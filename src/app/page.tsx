"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  AlertTriangle,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { relativeTime, daysAgo } from "@/utils/format";

export default function DashboardPage() {
  const products = useInventoryStore((s) => s.products);
  const batches = useInventoryStore((s) => s.batches);
  const transactions = useInventoryStore((s) => s.transactions);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const customers = useInventoryStore((s) => s.customers);

  const productStocks = products.map((p) => ({
    product: p,
    stock: totalStockForProduct(batches, p.id),
    isLow: totalStockForProduct(batches, p.id) <= p.low_stock_threshold,
  }));

  const totalStock = productStocks.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = productStocks.filter((p) => p.isLow).length;
  const totalBatches = batches.filter((b) => b.quantity_remaining > 0).length;

  const recentTx = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 8);

  const nameOf = (id: string, from: { id: string; name: string }[]) =>
    from.find((x) => x.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of stock, transactions, and alerts"
        actions={
          <>
            <Link href="/inward">
              <Button variant="outline">
                <ArrowDownToLine className="h-4 w-4" /> Inward
              </Button>
            </Link>
            <Link href="/outward">
              <Button>
                <ArrowUpFromLine className="h-4 w-4" /> Outward
              </Button>
            </Link>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Stock"
            value={formatQuantity(totalStock)}
            hint={`Across ${products.length} products`}
            icon={<Warehouse className="h-4 w-4" />}
            tone="default"
          />
          <StatCard
            label="Active Batches"
            value={totalBatches}
            hint="With remaining quantity"
            icon={<Package className="h-4 w-4" />}
            tone="success"
          />
          <StatCard
            label="Transactions"
            value={transactions.length}
            hint="Inward + Outward"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="default"
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount}
            hint={lowStockCount ? "Needs attention" : "All good"}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={lowStockCount ? "destructive" : "success"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTx.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  No transactions yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTx.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {tx.type === "inward" ? (
                            <Badge variant="success">Inward</Badge>
                          ) : (
                            <Badge variant="warning">Outward</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {nameOf(tx.product_id, products)}
                        </TableCell>
                        <TableCell className="text-[var(--color-muted-foreground)]">
                          {tx.type === "inward"
                            ? nameOf(tx.supplier_id, suppliers)
                            : nameOf(tx.customer_id, customers)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatQuantity(tx.quantity_in_base)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-[var(--color-muted-foreground)]">
                          {relativeTime(tx.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productStocks.filter((p) => p.isLow).length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  All products above threshold
                </p>
              ) : (
                productStocks
                  .filter((p) => p.isLow)
                  .map((p) => (
                    <div
                      key={p.product.id}
                      className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-destructive)]/5 p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.product.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Threshold: {p.product.low_stock_threshold} kg
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {formatQuantity(p.stock)}
                      </Badge>
                    </div>
                  ))
              )}

              <div className="border-t border-[var(--color-border)] pt-3 mt-3">
                <p className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)] mb-2">
                  Stock by product
                </p>
                {productStocks.map((p) => (
                  <div
                    key={p.product.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                      <span className="text-sm">{p.product.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatQuantity(p.stock)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Oldest Batches (FIFO next)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...batches]
                    .filter((b) => b.quantity_remaining > 0)
                    .sort(
                      (a, b) =>
                        new Date(a.received_at).getTime() -
                        new Date(b.received_at).getTime(),
                    )
                    .slice(0, 5)
                    .map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">
                          {b.batch_no}
                        </TableCell>
                        <TableCell>{nameOf(b.product_id, products)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatQuantity(b.quantity_remaining)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-[var(--color-muted-foreground)]">
                          {daysAgo(b.received_at)}d
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Suppliers" value={suppliers.length} />
              <Row label="Customers" value={customers.length} />
              <Row label="Products" value={products.length} />
              <Row
                label="Total quantity received"
                value={formatQuantity(
                  batches.reduce((a, b) => a + b.quantity_received, 0),
                )}
              />
              <Row
                label="Total quantity consumed"
                value={formatQuantity(
                  batches.reduce(
                    (a, b) => a + (b.quantity_received - b.quantity_remaining),
                    0,
                  ),
                )}
              />
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 last:border-0">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
