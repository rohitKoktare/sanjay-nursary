"use client";

import * as React from "react";
import { useInventoryStore } from "@/store/useInventoryStore";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadAll = useInventoryStore((s) => s.loadAll);
  const loaded = useInventoryStore((s) => s.loaded);
  const loading = useInventoryStore((s) => s.loading);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {!loaded && loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Loading inventory...
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <Toaster />
    </div>
  );
}
