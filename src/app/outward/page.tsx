"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInventoryStore } from "@/store/useInventoryStore";
import { api } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import { applyFifo, totalStockForProduct } from "@/utils/fifo";
import { convertToBaseUnit, formatQuantity } from "@/utils/units";
import type { BatchConsumption, OutwardTransaction } from "@/types";

const schema = z.object({
  customer_id: z.string().min(1, "Required"),
  product_id: z.string().min(1, "Required"),
  quantity: z.number().positive("Must be > 0"),
  unit: z.enum(["kg", "gm"]),
});
type FormValues = z.infer<typeof schema>;

export default function OutwardPage() {
  const products = useInventoryStore((s) => s.products);
  const customers = useInventoryStore((s) => s.customers);
  const batches = useInventoryStore((s) => s.batches);
  const transactions = useInventoryStore((s) => s.transactions);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: "",
      product_id: "",
      quantity: 0,
      unit: "kg",
    },
  });

  const productId = form.watch("product_id");
  const quantity = form.watch("quantity");
  const unit = form.watch("unit");

  const qtyBase =
    quantity && unit
      ? convertToBaseUnit(Number(quantity) || 0, unit)
      : 0;

  const preview = React.useMemo(() => {
    if (!productId || qtyBase <= 0) return null;
    return applyFifo(batches, productId, qtyBase);
  }, [productId, qtyBase, batches]);

  const availableStock = productId
    ? totalStockForProduct(batches, productId)
    : 0;

  const [lastResult, setLastResult] = React.useState<{
    consumption: BatchConsumption[];
    tx: OutwardTransaction;
  } | null>(null);

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.outward.create(values);
      const updatedBatches = batches.map((b) => {
        const consumed = res.transaction.consumption.find(
          (c) => c.batch_id === b.id,
        );
        return consumed
          ? { ...b, quantity_remaining: b.quantity_remaining - consumed.quantity }
          : b;
      });
      upsertLocal("batches", updatedBatches);
      upsertLocal("transactions", [...transactions, res.transaction]);
      setLastResult({
        consumption: res.transaction.consumption,
        tx: res.transaction,
      });
      toast.success(
        "Stock dispatched",
        `${formatQuantity(res.transaction.quantity_in_base)} via ${res.transaction.consumption.length} batch(es)`,
      );
      form.reset({
        customer_id: "",
        product_id: "",
        quantity: 0,
        unit: "kg",
      });
    } catch (e) {
      toast.error(
        "Outward failed",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const canSubmit =
    preview !== null && preview.shortfall === 0 && qtyBase > 0;

  return (
    <>
      <PageHeader
        title="Outward Entry"
        description="Dispatch stock to customers — consumed FIFO across batches"
      />
      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-[var(--color-primary)]" />
                New Outward Record
              </CardTitle>
              <CardDescription>
                Stock is deducted from oldest batches first (FIFO)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <Select {...form.register("customer_id")}>
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    {form.formState.errors.customer_id && (
                      <p className="text-xs text-[var(--color-destructive)] mt-1">
                        {form.formState.errors.customer_id.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Product</Label>
                    <Select {...form.register("product_id")}>
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                    {form.formState.errors.product_id && (
                      <p className="text-xs text-[var(--color-destructive)] mt-1">
                        {form.formState.errors.product_id.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      step="0.001"
                      {...form.register("quantity", { valueAsNumber: true })}
                    />
                    {form.formState.errors.quantity && (
                      <p className="text-xs text-[var(--color-destructive)] mt-1">
                        {form.formState.errors.quantity.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select {...form.register("unit")}>
                      <option value="kg">kg</option>
                      <option value="gm">gm</option>
                    </Select>
                  </div>
                </div>

                {productId && (
                  <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3 text-sm">
                    <span className="text-[var(--color-muted-foreground)]">
                      Available stock
                    </span>
                    <Badge
                      variant={availableStock > 0 ? "secondary" : "destructive"}
                    >
                      {formatQuantity(availableStock)}
                    </Badge>
                  </div>
                )}

                {qtyBase > 0 && unit !== "kg" && (
                  <div className="rounded-md bg-[var(--color-muted)]/60 p-3 text-xs">
                    Converts to{" "}
                    <span className="font-semibold">
                      {formatQuantity(qtyBase)}
                    </span>{" "}
                    (base unit)
                  </div>
                )}

                {preview && preview.shortfall > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/5 p-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-[var(--color-destructive)] mt-0.5" />
                    <div>
                      <p className="font-medium text-[var(--color-destructive)]">
                        Insufficient stock
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Short by {formatQuantity(preview.shortfall)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Dispatching..."
                      : "Dispatch Stock"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                  Batch Consumption Breakdown
                </CardTitle>
                <CardDescription>
                  Live FIFO preview — updates as you type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!preview || qtyBase === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Select a product and enter quantity to see how stock will
                    be consumed.
                  </p>
                ) : preview.consumption.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    No batches available for this product.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {preview.consumption.map((c) => (
                      <li
                        key={c.batch_id}
                        className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className="font-mono">{c.batch_no}</Badge>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            →
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {formatQuantity(c.quantity)}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="font-bold tabular-nums">
                        {formatQuantity(
                          preview.consumption.reduce(
                            (a, c) => a + c.quantity,
                            0,
                          ),
                        )}
                      </span>
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>

            {lastResult && (
              <Card className="border-[var(--color-success)]/40 bg-[var(--color-success)]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--color-success)]">
                    <CheckCircle2 className="h-5 w-5" />
                    Dispatched
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {lastResult.consumption.map((c) => (
                      <li
                        key={c.batch_id}
                        className="flex justify-between"
                      >
                        <span className="font-mono text-xs">{c.batch_no}</span>
                        <span>{formatQuantity(c.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </>
  );
}
