"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  Batch,
  Category,
  Customer,
  Product,
  Supplier,
  Transaction,
  TransportVendor,
  Unit,
} from "@/types";

interface State {
  units: Unit[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transport_vendors: TransportVendor[];
  batches: Batch[];
  transactions: Transaction[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface Actions {
  loadAll: () => Promise<void>;
  refresh: () => Promise<void>;
  upsertLocal: <K extends keyof State>(
    key: K,
    rows: State[K],
  ) => void;
}

const initialState: State = {
  units: [],
  categories: [],
  products: [],
  suppliers: [],
  customers: [],
  transport_vendors: [],
  batches: [],
  transactions: [],
  loading: false,
  loaded: false,
  error: null,
};

export const useInventoryStore = create<State & Actions>((set, get) => ({
  ...initialState,
  loadAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const [
        units,
        categories,
        products,
        suppliers,
        customers,
        transport_vendors,
        batches,
        transactions,
      ] = await Promise.all([
        api.units.list(),
        api.categories.list(),
        api.products.list(),
        api.suppliers.list(),
        api.customers.list(),
        api.transport_vendors.list(),
        api.batches.list(),
        api.transactions.list(),
      ]);
      set({
        units,
        categories,
        products,
        suppliers,
        customers,
        transport_vendors,
        batches,
        transactions,
        loading: false,
        loaded: true,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load",
      });
    }
  },
  refresh: async () => {
    set({ loading: true });
    const [
      units,
      categories,
      products,
      suppliers,
      customers,
      transport_vendors,
      batches,
      transactions,
    ] = await Promise.all([
      api.units.list(),
      api.categories.list(),
      api.products.list(),
      api.suppliers.list(),
      api.customers.list(),
      api.transport_vendors.list(),
      api.batches.list(),
      api.transactions.list(),
    ]);
    set({
      units,
      categories,
      products,
      suppliers,
      customers,
      transport_vendors,
      batches,
      transactions,
      loading: false,
      loaded: true,
    });
  },
  upsertLocal: (key, rows) => set({ [key]: rows } as Partial<State>),
}));
