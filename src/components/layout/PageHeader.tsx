import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function PageContent({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-6">{children}</div>;
}
