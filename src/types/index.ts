export type UnitCode = "kg" | "gm";

export interface Unit {
  id: string;
  code: UnitCode;
  name: string;
  conversion_to_base: number;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  base_unit: UnitCode;
  low_stock_threshold: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface TransportVendor {
  id: string;
  name: string;
  phone: string;
  vehicle_no: string;
}

export interface Batch {
  id: string;
  batch_no: string;
  product_id: string;
  supplier_id: string;
  quantity_received: number;
  quantity_remaining: number;
  unit: UnitCode;
  received_at: string;
}

export type TransactionType = "inward" | "outward";

export interface BatchConsumption {
  batch_id: string;
  batch_no: string;
  quantity: number;
  unit: UnitCode;
}

export interface InwardTransaction {
  id: string;
  type: "inward";
  batch_id: string;
  product_id: string;
  supplier_id: string;
  category_id: string;
  quantity: number;
  unit: UnitCode;
  quantity_in_base: number;
  created_at: string;
}

export interface OutwardTransaction {
  id: string;
  type: "outward";
  product_id: string;
  customer_id: string;
  quantity: number;
  unit: UnitCode;
  quantity_in_base: number;
  consumption: BatchConsumption[];
  created_at: string;
}

export type Transaction = InwardTransaction | OutwardTransaction;
