import type {
  Batch,
  Category,
  Customer,
  InwardTransaction,
  Product,
  Supplier,
  TransportVendor,
  Unit,
} from "@/types";

export const seedUnits: Unit[] = [
  { id: "u_kg", code: "kg", name: "Kilogram", conversion_to_base: 1 },
  { id: "u_gm", code: "gm", name: "Gram", conversion_to_base: 0.001 },
];

export const seedCategories: Category[] = [
  { id: "c_fertilizer", name: "Fertilizer", parent_id: null },
  { id: "c_organic", name: "Organic", parent_id: "c_fertilizer" },
  { id: "c_chemical", name: "Chemical", parent_id: "c_fertilizer" },
  { id: "c_growing", name: "Growing Media", parent_id: null },
  { id: "c_coir", name: "Coir Based", parent_id: "c_growing" },
];

export const seedSuppliers: Supplier[] = [
  {
    id: "s_a",
    name: "Supplier A",
    phone: "+91 98100 10001",
    address: "Pune, MH",
  },
  {
    id: "s_b",
    name: "Supplier B",
    phone: "+91 98100 10002",
    address: "Nashik, MH",
  },
];

export const seedCustomers: Customer[] = [
  {
    id: "cu_rohit",
    name: "Rohit",
    phone: "+91 90000 12345",
    address: "Mumbai, MH",
  },
  {
    id: "cu_prashant",
    name: "Prashant Nursery",
    phone: "+91 90000 54321",
    address: "Thane, MH",
  },
];

export const seedTransportVendors: TransportVendor[] = [
  {
    id: "tv_1",
    name: "Fast Movers",
    phone: "+91 99999 00001",
    vehicle_no: "MH12 AB 1234",
  },
  {
    id: "tv_2",
    name: "City Logistics",
    phone: "+91 99999 00002",
    vehicle_no: "MH14 XY 4321",
  },
];

export const seedProducts: Product[] = [
  {
    id: "p_cocopeat",
    name: "Cocopeat",
    sku: "COCO-001",
    category_id: "c_coir",
    base_unit: "kg",
    low_stock_threshold: 5000,
  },
  {
    id: "p_vermi",
    name: "Vermicompost",
    sku: "VERM-001",
    category_id: "c_organic",
    base_unit: "kg",
    low_stock_threshold: 2000,
  },
];

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

export const seedBatches: Batch[] = [
  {
    id: "b_001",
    batch_no: "B001",
    product_id: "p_cocopeat",
    supplier_id: "s_a",
    quantity_received: 20000,
    quantity_remaining: 20000,
    unit: "kg",
    received_at: daysAgo(20),
  },
  {
    id: "b_002",
    batch_no: "B002",
    product_id: "p_cocopeat",
    supplier_id: "s_b",
    quantity_received: 10000,
    quantity_remaining: 10000,
    unit: "kg",
    received_at: daysAgo(10),
  },
  {
    id: "b_003",
    batch_no: "B003",
    product_id: "p_vermi",
    supplier_id: "s_a",
    quantity_received: 5000,
    quantity_remaining: 5000,
    unit: "kg",
    received_at: daysAgo(5),
  },
];

export const seedInwardTransactions: InwardTransaction[] = seedBatches.map(
  (b) => ({
    id: `tx_${b.id}`,
    type: "inward",
    batch_id: b.id,
    product_id: b.product_id,
    supplier_id: b.supplier_id,
    category_id:
      seedProducts.find((p) => p.id === b.product_id)?.category_id ?? "",
    quantity: b.quantity_received,
    unit: b.unit,
    quantity_in_base: b.quantity_received,
    created_at: b.received_at,
  }),
);
