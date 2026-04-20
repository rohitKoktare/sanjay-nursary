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
import type { TransportVendor } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  vehicle_no: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export default function TransportVendorsPage() {
  const vendors = useInventoryStore((s) => s.transport_vendors);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TransportVendor | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", vehicle_no: "" },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", vehicle_no: "" });
    setOpen(true);
  };
  const openEdit = (v: TransportVendor) => {
    setEditing(v);
    form.reset(v);
    setOpen(true);
  };
  const onSubmit = async (v: FormValues) => {
    try {
      if (editing) {
        const updated = await api.transport_vendors.update(editing.id, v);
        upsertLocal(
          "transport_vendors",
          vendors.map((x) => (x.id === editing.id ? updated : x)),
        );
        toast.success("Vendor updated");
      } else {
        const created = await api.transport_vendors.create(v);
        upsertLocal("transport_vendors", [...vendors, created]);
        toast.success("Vendor added");
      }
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : undefined);
    }
  };
  const onDelete = async (v: TransportVendor) => {
    await api.transport_vendors.remove(v.id);
    upsertLocal(
      "transport_vendors",
      vendors.filter((x) => x.id !== v.id),
    );
  };

  return (
    <CrudPage
      title="Transport Vendors"
      description="Delivery and logistics partners"
      data={vendors}
      searchFn={(v, q) => v.name.toLowerCase().includes(q)}
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "name", header: "Name", cell: (v) => <span className="font-medium">{v.name}</span> },
        { key: "phone", header: "Phone", cell: (v) => v.phone },
        { key: "vehicle", header: "Vehicle No.", cell: (v) => <span className="font-mono text-xs">{v.vehicle_no}</span> },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
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
                <Label>Vehicle Number</Label>
                <Input {...form.register("vehicle_no")} />
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
