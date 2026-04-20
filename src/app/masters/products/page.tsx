"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrudPage } from "@/modules/masters/CrudPage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/store/useInventoryStore";
import { api } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import type { Product } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  sku: z.string().min(1, "Required"),
  category_id: z.string().min(1, "Required"),
  base_unit: z.enum(["kg", "gm"]),
  low_stock_threshold: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function ProductsPage() {
  const products = useInventoryStore((s) => s.products);
  const categories = useInventoryStore((s) => s.categories);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      category_id: "",
      base_unit: "kg",
      low_stock_threshold: 0,
    },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({
      name: "",
      sku: "",
      category_id: categories[0]?.id ?? "",
      base_unit: "kg",
      low_stock_threshold: 0,
    });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.reset(p);
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        const updated = await api.products.update(editing.id, values);
        upsertLocal(
          "products",
          products.map((p) => (p.id === editing.id ? updated : p)),
        );
        toast.success("Product updated");
      } else {
        const created = await api.products.create(values);
        upsertLocal("products", [...products, created]);
        toast.success("Product added");
      }
      setOpen(false);
    } catch (e) {
      toast.error(
        "Save failed",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const onDelete = async (p: Product) => {
    await api.products.remove(p.id);
    upsertLocal(
      "products",
      products.filter((x) => x.id !== p.id),
    );
  };

  return (
    <CrudPage
      title="Products"
      description="Manage nursery product master data"
      data={products}
      searchFn={(p, q) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      }
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "sku", header: "SKU", cell: (p) => <span className="font-mono text-xs">{p.sku}</span> },
        { key: "name", header: "Name", cell: (p) => <span className="font-medium">{p.name}</span> },
        {
          key: "category",
          header: "Category",
          cell: (p) => categories.find((c) => c.id === p.category_id)?.name ?? "—",
        },
        { key: "unit", header: "Base Unit", cell: (p) => p.base_unit },
        {
          key: "threshold",
          header: "Low Stock Threshold",
          cell: (p) => `${p.low_stock_threshold} kg`,
        },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-[var(--color-destructive)] mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>SKU</Label>
                <Input {...form.register("sku")} />
                {form.formState.errors.sku && (
                  <p className="text-xs text-[var(--color-destructive)] mt-1">
                    {form.formState.errors.sku.message}
                  </p>
                )}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base Unit</Label>
                  <Select {...form.register("base_unit")}>
                    <option value="kg">kg</option>
                    <option value="gm">gm</option>
                  </Select>
                </div>
                <div>
                  <Label>Low Stock Threshold (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("low_stock_threshold", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {editing ? "Save" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
