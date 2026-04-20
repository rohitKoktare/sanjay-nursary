"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Warehouse,
  ScrollText,
  Tag,
  Truck,
  Users,
  Building2,
  Ruler,
  Leaf,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inward", href: "/inward", icon: ArrowDownToLine, section: "Operations" },
  { label: "Outward", href: "/outward", icon: ArrowUpFromLine, section: "Operations" },
  { label: "Stock", href: "/stock", icon: Warehouse, section: "Operations" },
  { label: "Ledger", href: "/ledger", icon: ScrollText, section: "Operations" },
  { label: "Products", href: "/masters/products", icon: Package, section: "Masters" },
  { label: "Categories", href: "/masters/categories", icon: Tag, section: "Masters" },
  { label: "Suppliers", href: "/masters/suppliers", icon: Building2, section: "Masters" },
  { label: "Customers", href: "/masters/customers", icon: Users, section: "Masters" },
  { label: "Transport", href: "/masters/transport-vendors", icon: Truck, section: "Masters" },
  { label: "Units", href: "/masters/units", icon: Ruler, section: "Masters" },
];

export function Sidebar() {
  const pathname = usePathname();
  const sections = Array.from(
    new Set(NAV.map((n) => n.section).filter(Boolean)),
  ) as string[];
  const topLevel = NAV.filter((n) => !n.section);

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] h-screen sticky top-0">
      <div className="p-5 border-b border-[var(--color-border)] flex items-center gap-2">
        <div className="h-9 w-9 rounded-md bg-[var(--color-primary)] grid place-items-center">
          <Leaf className="h-5 w-5 text-[var(--color-primary-foreground)]" />
        </div>
        <div>
          <h1 className="text-sm font-bold">Nursery Inventory</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Batch Tracker
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-5">
        <div className="space-y-1">
          {topLevel.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
        {sections.map((section) => (
          <div key={section} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
              {section}
            </p>
            {NAV.filter((n) => n.section === section).map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)]">
        <p>MVP Build</p>
        <p className="opacity-70">Mock data · Supabase ready</p>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "text-[var(--color-foreground)] hover:bg-[var(--color-accent)]",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
