"use client";

import { useToastStore, type ToastVariant } from "@/store/useToastStore";
import { cn } from "@/utils/cn";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />,
  error: <XCircle className="h-5 w-5 text-[var(--color-destructive)]" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />,
};

const BORDER: Record<ToastVariant, string> = {
  success: "border-l-[var(--color-success)]",
  error: "border-l-[var(--color-destructive)]",
  info: "border-l-blue-500",
  warning: "border-l-[var(--color-warning)]",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-md border border-[var(--color-border)] border-l-4 bg-[var(--color-background)] p-4 shadow-lg",
            BORDER[t.variant],
          )}
          role="status"
        >
          {ICON[t.variant]}
          <div className="flex-1">
            <p className="font-medium text-sm">{t.title}</p>
            {t.description && (
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
