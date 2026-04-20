import type { Batch, BatchConsumption } from "@/types";

export interface FifoResult {
  consumption: BatchConsumption[];
  updatedBatches: Batch[];
  shortfall: number;
}

export function applyFifo(
  batches: Batch[],
  productId: string,
  quantityInBase: number,
): FifoResult {
  const relevant = batches
    .filter((b) => b.product_id === productId && b.quantity_remaining > 0)
    .sort(
      (a, b) =>
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
    );

  const consumption: BatchConsumption[] = [];
  const updates = new Map<string, Batch>();
  let remaining = quantityInBase;

  for (const batch of relevant) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity_remaining, remaining);
    consumption.push({
      batch_id: batch.id,
      batch_no: batch.batch_no,
      quantity: take,
      unit: batch.unit,
    });
    updates.set(batch.id, {
      ...batch,
      quantity_remaining: batch.quantity_remaining - take,
    });
    remaining -= take;
  }

  const updatedBatches = batches.map((b) => updates.get(b.id) ?? b);
  return { consumption, updatedBatches, shortfall: remaining };
}

export function totalStockForProduct(batches: Batch[], productId: string): number {
  return batches
    .filter((b) => b.product_id === productId)
    .reduce((acc, b) => acc + b.quantity_remaining, 0);
}
