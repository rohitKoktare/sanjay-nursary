"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryStore } from "@/store/useInventoryStore";
import { totalStockForProduct } from "@/utils/fifo";
import { formatQuantity } from "@/utils/units";
import { formatDate, daysAgo } from "@/utils/format";
import { cn } from "@/utils/cn";

export default function StockPage() {
  const products = useInventoryStore((s) => s.products);
  const batches = useInventoryStore((s) => s.batches);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");

  const rows = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .map((p) => {
      const productBatches = batches
        .filter((b) => b.product_id === p.id && b.quantity_remaining > 0)
        .sort(
          (a, b) =>
            new Date(a.received_at).getTime() -
            new Date(b.received_at).getTime(),
        );
      const totalReceived = batches
        .filter((b) => b.product_id === p.id)
        .reduce((a, b) => a + b.quantity_received, 0);
      const total = totalStockForProduct(batches, p.id);
      return {
        product: p,
        productBatches,
        total,
        totalReceived,
        isLow: total <= p.low_stock_threshold,
      };
    });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader
        title="Stock"
        description="Product-level totals with batch-level drilldown"
      />
      <PageContent>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Current Stock</CardTitle>
            <Input
              placeholder="Search product..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Batches</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-[var(--color-muted-foreground)]"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                )}
                {rows.map(({ product, productBatches, total, isLow }) => {
                  const isOpen = expanded.has(product.id);
                  return (
                    <React.Fragment key={product.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer",
                          isLow && "bg-[var(--color-destructive)]/5",
                        )}
                        onClick={() => toggle(product.id)}
                      >
                        <TableCell>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatQuantity(total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {productBatches.length}
                        </TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1 w-fit"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell />
                          <TableCell colSpan={5} className="bg-[var(--color-muted)]/30 p-4">
                            <BatchDrilldown
                              batches={productBatches}
                              suppliers={suppliers}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

function BatchDrilldown({
  batches,
  suppliers,
}: {
  batches: ReturnType<typeof useInventoryStore.getState>["batches"];
  suppliers: ReturnType<typeof useInventoryStore.getState>["suppliers"];
}) {
  if (batches.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)] py-2">
        No active batches for this product
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
        Batch Drilldown (FIFO order)
      </p>
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => {
              const age = daysAgo(b.received_at);
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <Badge className="font-mono">{b.batch_no}</Badge>
                  </TableCell>
                  <TableCell>
                    {suppliers.find((s) => s.id === b.supplier_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(b.quantity_received)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatQuantity(b.quantity_remaining)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-[var(--color-muted-foreground)]">
                    {formatDate(b.received_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        age > 30 ? "warning" : age > 60 ? "destructive" : "outline"
                      }
                    >
                      {age}d
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
