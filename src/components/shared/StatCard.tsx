import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "destructive";
}

const toneMap: Record<string, string> = {
  default: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  destructive:
    "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {label}
          </p>
          {icon && (
            <div
              className={cn(
                "h-8 w-8 rounded-md grid place-items-center",
                toneMap[tone],
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold text-[var(--color-foreground)]">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
