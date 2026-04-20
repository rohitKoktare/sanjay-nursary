"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "@/store/useToastStore";

export interface CrudPageProps<T extends { id: string }> {
  title: string;
  description: string;
  data: T[];
  columns: Column<T>[];
  searchFn?: (row: T, query: string) => boolean;
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => Promise<void>;
  FormDialog: React.ReactNode;
  deleteLabel?: (row: T) => string;
}

export function CrudPage<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  searchFn,
  onAdd,
  onEdit,
  onDelete,
  FormDialog,
  deleteLabel,
}: CrudPageProps<T>) {
  const [confirmRow, setConfirmRow] = React.useState<T | null>(null);

  const columnsWithActions: Column<T>[] = [
    ...columns,
    {
      header: "Actions",
      key: "__actions",
      className: "w-32 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(row)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setConfirmRow(row)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add New
          </Button>
        }
      />
      <PageContent>
        <DataTable
          data={data}
          columns={columnsWithActions}
          searchFn={searchFn}
        />
      </PageContent>
      {FormDialog}
      <ConfirmDialog
        open={!!confirmRow}
        onOpenChange={(o) => !o && setConfirmRow(null)}
        title="Delete record"
        description={
          confirmRow
            ? `Delete "${deleteLabel ? deleteLabel(confirmRow) : (confirmRow as { name?: string }).name ?? ""}"? This cannot be undone.`
            : ""
        }
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmRow) return;
          try {
            await onDelete(confirmRow);
            toast.success("Deleted");
          } catch (e) {
            toast.error(
              "Delete failed",
              e instanceof Error ? e.message : undefined,
            );
          }
        }}
      />
    </>
  );
}
