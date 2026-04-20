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
import type { Unit } from "@/types";

const schema = z.object({
  code: z.enum(["kg", "gm"]),
  name: z.string().min(1, "Required"),
  conversion_to_base: z.number().positive(),
});
type FormValues = z.infer<typeof schema>;

export default function UnitsPage() {
  const units = useInventoryStore((s) => s.units);
  const upsertLocal = useInventoryStore((s) => s.upsertLocal);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Unit | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "kg", name: "", conversion_to_base: 1 },
  });

  const openAdd = () => {
    setEditing(null);
    form.reset({ code: "kg", name: "", conversion_to_base: 1 });
    setOpen(true);
  };
  const openEdit = (u: Unit) => {
    setEditing(u);
    form.reset({
      code: u.code,
      name: u.name,
      conversion_to_base: u.conversion_to_base,
    });
    setOpen(true);
  };
  const onSubmit = async (v: FormValues) => {
    try {
      if (editing) {
        const updated = await api.units.update(editing.id, v);
        upsertLocal(
          "units",
          units.map((u) => (u.id === editing.id ? updated : u)),
        );
        toast.success("Unit updated");
      } else {
        const created = await api.units.create(v);
        upsertLocal("units", [...units, created]);
        toast.success("Unit added");
      }
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : undefined);
    }
  };
  const onDelete = async (u: Unit) => {
    await api.units.remove(u.id);
    upsertLocal(
      "units",
      units.filter((x) => x.id !== u.id),
    );
  };

  return (
    <CrudPage
      title="Units"
      description="Measurement units and their conversion to base (kg)"
      data={units}
      searchFn={(u, q) =>
        u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q)
      }
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={onDelete}
      columns={[
        { key: "code", header: "Code", cell: (u) => <span className="font-mono">{u.code}</span> },
        { key: "name", header: "Name", cell: (u) => u.name },
        {
          key: "conv",
          header: "Conversion to kg",
          cell: (u) => `1 ${u.code} = ${u.conversion_to_base} kg`,
        },
      ]}
      FormDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Unit" : "Add Unit"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Code</Label>
                <Select {...form.register("code")}>
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <Label>Conversion to base (kg)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  {...form.register("conversion_to_base", {
                    valueAsNumber: true,
                  })}
                />
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
