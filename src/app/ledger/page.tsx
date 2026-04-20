"use client";

import * as React from "react";
import { FilterX } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { useInventoryStore } from "@/store/useInventoryStore";
import { formatQuantity } from "@/utils/units";
import { formatDateTime } from "@/utils/format";
import type { Transaction } from "@/types";

export default function LedgerPage() {
  const products = useInventoryStore((s) => s.products);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const customers = useInventoryStore((s) => s.customers);
  const batches = useInventoryStore((s) => s.batches);
  const transactions = useInventoryStore((s) => s.transactions);

  const [typeFilter, setTypeFilter] = React.useState<"all" | "inward" | "outward">(
    "all",
  );
  const [productFilter, setProductFilter] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  const filtered = React.useMemo(() => {
    return transactions
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) =>
        productFilter === "all" ? true : t.product_id === productFilter,
      )
      .filter((t) => {
        if (!fromDate) return true;
        return new Date(t.created_at) >= new Date(fromDate);
      })
      .filter((t) => {
        if (!toDate) return true;
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        return new Date(t.created_at) <= end;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );
  }, [transactions, typeFilter, productFilter, fromDate, toDate]);

  const clearFilters = () => {
    setTypeFilter("all");
    setProductFilter("all");
    setFromDate("");
    setToDate("");
  };

  const columns: Column<Transaction>[] = [
    {
      key: "when",
      header: "Date",
      cell: (t) => (
        <span className="text-xs tabular-nums">
          {formatDateTime(t.created_at)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (t) =>
        t.type === "inward" ? (
          <Badge variant="success">Inward</Badge>
        ) : (
          <Badge variant="warning">Outward</Badge>
        ),
    },
    {
      key: "product",
      header: "Product",
      cell: (t) => (
        <span className="font-medium">
          {products.find((p) => p.id === t.product_id)?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "party",
      header: "Party",
      cell: (t) =>
        t.type === "inward"
          ? suppliers.find((s) => s.id === t.supplier_id)?.name ?? "—"
          : customers.find((c) => c.id === t.customer_id)?.name ?? "—",
    },
    {
      key: "batch",
      header: "Batch(es)",
      cell: (t) => {
        if (t.type === "inward") {
          const batch = batches.find((b) => b.id === t.batch_id);
          return batch ? (
            <Badge className="font-mono">{batch.batch_no}</Badge>
          ) : (
            <span className="text-[var(--color-muted-foreground)]">—</span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {t.consumption.map((c) => (
              <Badge key={c.batch_id} variant="outline" className="font-mono">
                {c.batch_no}: {formatQuantity(c.quantity)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "qty",
      header: "Quantity",
      className: "text-right",
      cell: (t) => (
        <span className="font-semibold tabular-nums">
          {formatQuantity(t.quantity_in_base)}
        </span>
      ),
    },
  ];

  const filterActive =
    typeFilter !== "all" ||
    productFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  return (
    <>
      <PageHeader
        title="Ledger"
        description="All inward and outward transactions"
      />
      <PageContent>
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs font-medium mb-1 block text-[var(--color-muted-foreground)]">
                  Type
                </label>
                <Select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as typeof typeFilter)
                  }
                >
                  <option value="all">All</option>
                  <option value="inward">Inward</option>
                  <option value="outward">Outward</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-[var(--color-muted-foreground)]">
                  Product
                </label>
                <Select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="all">All products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-[var(--color-muted-foreground)]">
                  From
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-[var(--color-muted-foreground)]">
                  To
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!filterActive}
              >
                <FilterX className="h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <DataTable
          data={filtered}
          columns={columns}
          searchable={false}
          pageSize={15}
          emptyMessage="No transactions match these filters"
        />
      </PageContent>
    </>
  );
}
