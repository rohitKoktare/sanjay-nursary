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
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/store/useInventoryStore";
import { api } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import type { Supplier } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export default function SuppliersPage() {
  const suppliers = useInventoryStore((s) => s.suppliers);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", address: "" });
    setOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    form.reset(s);
    setOpen(true);
  };
  const onSubmit = async (v: FormValues) => {
    try {
      if (editing) {
        const updated = await api.suppliers.update(editing.id, v);
        upsertLocal(
          "suppliers",
          suppliers.map((s) => (s.id === editing.id ? updated : s)),
        );
        toast.success("Supplier updated");
      } else {
        const created = await api.suppliers.create(v);
        upsertLocal("suppliers", [...suppliers, created]);
        toast.success("Supplier added");
      }
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : undefined);
    }
  };
  const onDelete = async (s: Supplier) => {
    await api.suppliers.remove(s.id);
    upsertLocal(
      "suppliers",
      suppliers.filter((x) => x.id !== s.id),
    );
  };

  return (
    <CrudPage
      title="Suppliers"
      description="Manage vendors that provide inventory"
      data={suppliers}
      searchFn={(s, q) =>
        s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q)
      }
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "name", header: "Name", cell: (s) => <span className="font-medium">{s.name}</span> },
        { key: "phone", header: "Phone", cell: (s) => s.phone },
        { key: "address", header: "Address", cell: (s) => s.address },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
              <div>
                <Label>Address</Label>
                <Input {...form.register("address")} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
