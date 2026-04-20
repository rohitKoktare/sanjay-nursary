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
import { Badge } from "@/components/ui/badge";
import { useInventoryStore } from "@/store/useInventoryStore";
import { api } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  parent_id: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const categories = useInventoryStore((s) => s.categories);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", parent_id: null },
  });

  const parents = categories.filter((c) => c.parent_id === null);

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: "", parent_id: null });
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    form.reset({ name: c.name, parent_id: c.parent_id });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        name: values.name,
        parent_id: values.parent_id || null,
      };
      if (editing) {
        const updated = await api.categories.update(editing.id, payload);
        upsertLocal(
          "categories",
          categories.map((c) => (c.id === editing.id ? updated : c)),
        );
        toast.success("Category updated");
      } else {
        const created = await api.categories.create(payload);
        upsertLocal("categories", [...categories, created]);
        toast.success("Category added");
      }
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : undefined);
    }
  };

  const onDelete = async (c: Category) => {
    await api.categories.remove(c.id);
    upsertLocal(
      "categories",
      categories.filter((x) => x.id !== c.id),
    );
  };

  return (
    <CrudPage
      title="Categories"
      description="Parent + subcategories for product classification"
      data={categories}
      searchFn={(c, q) => c.name.toLowerCase().includes(q)}
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "name", header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
        {
          key: "type",
          header: "Type",
          cell: (c) =>
            c.parent_id ? (
              <Badge variant="secondary">Sub</Badge>
            ) : (
              <Badge>Parent</Badge>
            ),
        },
        {
          key: "parent",
          header: "Parent",
          cell: (c) =>
            c.parent_id
              ? categories.find((p) => p.id === c.parent_id)?.name ?? "—"
              : "—",
        },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Category" : "Add Category"}
              </DialogTitle>
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
                <Label>Parent Category</Label>
                <Select
                  {...form.register("parent_id", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                >
                  <option value="">None (top-level)</option>
                  {parents
                    .filter((p) => p.id !== editing?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Select>
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
