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
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export default function CustomersPage() {
  const customers = useInventoryStore((s) => s.customers);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", address: "" });
    setOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    form.reset(c);
    setOpen(true);
  };
  const onSubmit = async (v: FormValues) => {
    try {
      if (editing) {
        const updated = await api.customers.update(editing.id, v);
        upsertLocal(
          "customers",
          customers.map((c) => (c.id === editing.id ? updated : c)),
        );
        toast.success("Customer updated");
      } else {
        const created = await api.customers.create(v);
        upsertLocal("customers", [...customers, created]);
        toast.success("Customer added");
      }
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : undefined);
    }
  };
  const onDelete = async (c: Customer) => {
    await api.customers.remove(c.id);
    upsertLocal(
      "customers",
      customers.filter((x) => x.id !== c.id),
    );
  };

  return (
    <CrudPage
      title="Customers"
      description="Nurseries and buyers"
      data={customers}
      searchFn={(c, q) => c.name.toLowerCase().includes(q)}
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "name", header: "Name", cell: (c) => <span className="font-medium">{c.name}</span> },
        { key: "phone", header: "Phone", cell: (c) => c.phone },
        { key: "address", header: "Address", cell: (c) => c.address },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
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
