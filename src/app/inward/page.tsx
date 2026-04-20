"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownToLine, CheckCircle2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryStore } from "@/store/useInventoryStore";
import { api } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import { convertToBaseUnit, formatQuantity } from "@/utils/units";
import { formatDateTime } from "@/utils/format";
import type { Batch, InwardTransaction } from "@/types";

const schema = z.object({
  supplier_id: z.string().min(1, "Required"),
  product_id: z.string().min(1, "Required"),
  category_id: z.string().min(1, "Required"),
  quantity: z.number().positive("Must be > 0"),
  unit: z.enum(["kg", "gm"]),
  received_at: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export default function InwardPage() {
  const products = useInventoryStore((s) => s.products);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const categories = useInventoryStore((s) => s.categories);
  const batches = useInventoryStore((s) => s.batches);
  const transactions = useInventoryStore((s) => s.transactions);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier_id: "",
      product_id: "",
      category_id: "",
      quantity: 0,
      unit: "kg",
      received_at: today,
    },
  });

  const [lastCreated, setLastCreated] = React.useState<{
    batch: Batch;
    transaction: InwardTransaction;
  } | null>(null);

  const watchProductId = form.watch("product_id");
  React.useEffect(() => {
    const product = products.find((p) => p.id === watchProductId);
    if (product && !form.getValues("category_id")) {
      form.setValue("category_id", product.category_id);
    }
  }, [watchProductId, products, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.inward.create({
        ...values,
        received_at: new Date(values.received_at).toISOString(),
      });
      upsertLocal("batches", [...batches, res.batch]);
      upsertLocal("transactions", [...transactions, res.transaction]);
      setLastCreated(res);
      toast.success(
        `Batch ${res.batch.batch_no} created`,
        `${formatQuantity(res.batch.quantity_received)} added to stock`,
      );
      form.reset({
        supplier_id: "",
        product_id: "",
        category_id: "",
        quantity: 0,
        unit: "kg",
        received_at: today,
      });
    } catch (e) {
      toast.error(
        "Inward failed",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const previewQty = form.watch("quantity");
  const previewUnit = form.watch("unit");
  const previewBase =
    previewQty && previewUnit
      ? convertToBaseUnit(Number(previewQty) || 0, previewUnit)
      : 0;

  const recentInward = transactions
    .filter((t) => t.type === "inward")
    .slice(-5)
    .reverse() as InwardTransaction[];

  return (
    <>
      <PageHeader
        title="Inward Entry"
        description="Record incoming stock — creates a new batch"
      />
      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-[var(--color-primary)]" />
                New Inward Record
              </CardTitle>
              <CardDescription>
                Each submission creates a new batch with FIFO tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier</Label>
                    <Select {...form.register("supplier_id")}>
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                    {form.formState.errors.supplier_id && (
                      <p className="text-xs text-[var(--color-destructive)] mt-1">
                        {form.formState.errors.supplier_id.message}
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

                <div>
                  <Label>Category</Label>
                  <Select {...form.register("category_id")}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parent_id
                          ? `${categories.find((p) => p.id === c.parent_id)?.name ?? ""} › ${c.name}`
                          : c.name}
                      </option>
                    ))}
                  </Select>
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

                <div>
                  <Label>Date</Label>
                  <Input type="date" {...form.register("received_at")} />
                </div>

                {previewBase > 0 && previewUnit !== "kg" && (
                  <div className="rounded-md bg-[var(--color-muted)]/60 p-3 text-xs">
                    Will be stored as{" "}
                    <span className="font-semibold">
                      {formatQuantity(previewBase)}
                    </span>{" "}
                    (base unit)
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
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Creating..."
                      : "Create Batch"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {lastCreated && (
              <Card className="border-[var(--color-success)]/40 bg-[var(--color-success)]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--color-success)]">
                    <CheckCircle2 className="h-5 w-5" />
                    Batch Created
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row
                    label="Batch ID"
                    value={
                      <Badge className="font-mono">
                        {lastCreated.batch.batch_no}
                      </Badge>
                    }
                  />
                  <Row
                    label="Product"
                    value={
                      products.find((p) => p.id === lastCreated.batch.product_id)
                        ?.name ?? "—"
                    }
                  />
                  <Row
                    label="Supplier"
                    value={
                      suppliers.find(
                        (s) => s.id === lastCreated.batch.supplier_id,
                      )?.name ?? "—"
                    }
                  />
                  <Row
                    label="Quantity"
                    value={formatQuantity(lastCreated.batch.quantity_received)}
                  />
                  <Row
                    label="Received"
                    value={formatDateTime(lastCreated.batch.received_at)}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Inward</CardTitle>
              </CardHeader>
              <CardContent>
                {recentInward.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    No inward records yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentInward.map((tx) => {
                        const batch = batches.find(
                          (b) => b.id === tx.batch_id,
                        );
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-xs">
                              {batch?.batch_no ?? "—"}
                            </TableCell>
                            <TableCell>
                              {products.find((p) => p.id === tx.product_id)
                                ?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatQuantity(tx.quantity_in_base)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
