/**
 * Mock API layer. All functions return Promises so swapping the body for a
 * real Supabase client later is a mechanical change — the call sites stay the same.
 */
import type {
  Batch,
  Category,
  Customer,
  InwardTransaction,
  OutwardTransaction,
  Product,
  Supplier,
  Transaction,
  TransportVendor,
  Unit,
} from "@/types";
import { applyFifo } from "@/utils/fifo";
import { uid, nextBatchNo } from "@/utils/id";
import { convertToBaseUnit } from "@/utils/units";
import {
  seedBatches,
  seedCategories,
  seedCustomers,
  seedInwardTransactions,
  seedProducts,
  seedSuppliers,
  seedTransportVendors,
  seedUnits,
} from "./seed";

const LATENCY = 120;
const delay = <T>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY));

interface DB {
  units: Unit[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transport_vendors: TransportVendor[];
  batches: Batch[];
  transactions: Transaction[];
}

const db: DB = {
  units: [...seedUnits],
  categories: [...seedCategories],
  products: [...seedProducts],
  suppliers: [...seedSuppliers],
  customers: [...seedCustomers],
  transport_vendors: [...seedTransportVendors],
  batches: [...seedBatches],
  transactions: [...seedInwardTransactions],
};

type TableKey =
  | "units"
  | "categories"
  | "products"
  | "suppliers"
  | "customers"
  | "transport_vendors";

type TableRow = {
  units: Unit;
  categories: Category;
  products: Product;
  suppliers: Supplier;
  customers: Customer;
  transport_vendors: TransportVendor;
};

function list<K extends TableKey>(table: K): Promise<TableRow[K][]> {
  return delay([...(db[table] as TableRow[K][])]);
}

function create<K extends TableKey>(
  table: K,
  row: Omit<TableRow[K], "id">,
): Promise<TableRow[K]> {
  const record = { id: uid(table.slice(0, 3)), ...row } as TableRow[K];
  (db[table] as TableRow[K][]).push(record);
  return delay(record);
}

function update<K extends TableKey>(
  table: K,
  id: string,
  patch: Partial<TableRow[K]>,
): Promise<TableRow[K]> {
  const rows = db[table] as TableRow[K][];
  const idx = rows.findIndex((r) => (r as { id: string }).id === id);
  if (idx === -1) throw new Error(`${table} ${id} not found`);
  rows[idx] = { ...rows[idx], ...patch } as TableRow[K];
  return delay(rows[idx]);
}

function remove<K extends TableKey>(table: K, id: string): Promise<void> {
  const rows = db[table] as TableRow[K][];
  const idx = rows.findIndex((r) => (r as { id: string }).id === id);
  if (idx === -1) throw new Error(`${table} ${id} not found`);
  rows.splice(idx, 1);
  return delay(undefined);
}

export const api = {
  units: {
    list: () => list("units"),
    create: (row: Omit<Unit, "id">) => create("units", row),
    update: (id: string, patch: Partial<Unit>) => update("units", id, patch),
    remove: (id: string) => remove("units", id),
  },
  categories: {
    list: () => list("categories"),
    create: (row: Omit<Category, "id">) => create("categories", row),
    update: (id: string, patch: Partial<Category>) =>
      update("categories", id, patch),
    remove: (id: string) => remove("categories", id),
  },
  products: {
    list: () => list("products"),
    create: (row: Omit<Product, "id">) => create("products", row),
    update: (id: string, patch: Partial<Product>) =>
      update("products", id, patch),
    remove: (id: string) => remove("products", id),
  },
  suppliers: {
    list: () => list("suppliers"),
    create: (row: Omit<Supplier, "id">) => create("suppliers", row),
    update: (id: string, patch: Partial<Supplier>) =>
      update("suppliers", id, patch),
    remove: (id: string) => remove("suppliers", id),
  },
  customers: {
    list: () => list("customers"),
    create: (row: Omit<Customer, "id">) => create("customers", row),
    update: (id: string, patch: Partial<Customer>) =>
      update("customers", id, patch),
    remove: (id: string) => remove("customers", id),
  },
  transport_vendors: {
    list: () => list("transport_vendors"),
    create: (row: Omit<TransportVendor, "id">) =>
      create("transport_vendors", row),
    update: (id: string, patch: Partial<TransportVendor>) =>
      update("transport_vendors", id, patch),
    remove: (id: string) => remove("transport_vendors", id),
  },
  batches: {
    list: () => delay([...db.batches]),
  },
  transactions: {
    list: () => delay([...db.transactions]),
  },
  inward: {
    create: async (input: {
      product_id: string;
      supplier_id: string;
      category_id: string;
      quantity: number;
      unit: "kg" | "gm";
      received_at: string;
    }): Promise<{ batch: Batch; transaction: InwardTransaction }> => {
      const qtyBase = convertToBaseUnit(input.quantity, input.unit);
      const batch_no = nextBatchNo(db.batches.map((b) => b.batch_no));
      const batch: Batch = {
        id: uid("bat"),
        batch_no,
        product_id: input.product_id,
        supplier_id: input.supplier_id,
        quantity_received: qtyBase,
        quantity_remaining: qtyBase,
        unit: "kg",
        received_at: input.received_at,
      };
      db.batches.push(batch);
      const tx: InwardTransaction = {
        id: uid("tx"),
        type: "inward",
        batch_id: batch.id,
        product_id: input.product_id,
        supplier_id: input.supplier_id,
        category_id: input.category_id,
        quantity: input.quantity,
        unit: input.unit,
        quantity_in_base: qtyBase,
        created_at: new Date().toISOString(),
      };
      db.transactions.push(tx);
      return delay({ batch, transaction: tx });
    },
  },
  outward: {
    create: async (input: {
      product_id: string;
      customer_id: string;
      quantity: number;
      unit: "kg" | "gm";
    }): Promise<{ transaction: OutwardTransaction }> => {
      const qtyBase = convertToBaseUnit(input.quantity, input.unit);
      const result = applyFifo(db.batches, input.product_id, qtyBase);
      if (result.shortfall > 0) {
        throw new Error(
          `Insufficient stock. Short by ${result.shortfall} kg`,
        );
      }
      db.batches = result.updatedBatches;
      const tx: OutwardTransaction = {
        id: uid("tx"),
        type: "outward",
        product_id: input.product_id,
        customer_id: input.customer_id,
        quantity: input.quantity,
        unit: input.unit,
        quantity_in_base: qtyBase,
        consumption: result.consumption,
        created_at: new Date().toISOString(),
      };
      db.transactions.push(tx);
      return delay({ transaction: tx });
    },
    preview: async (input: {
      product_id: string;
      quantity: number;
      unit: "kg" | "gm";
    }) => {
      const qtyBase = convertToBaseUnit(input.quantity, input.unit);
      const result = applyFifo(db.batches, input.product_id, qtyBase);
      return delay(result);
    },
  },
};

export type Api = typeof api;
