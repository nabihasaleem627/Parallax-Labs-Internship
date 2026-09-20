"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/format";
import { navItems } from "./nav-items";

export type SidebarOrganization = {
  name: string;
  subdomain: string;
  plan: string;
};

export function Sidebar({ organization }: { organization: SidebarOrganization }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Link href="/dashboard">
          <Brand />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-indigo-600" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{organization.name}</p>
            <Badge tone="indigo" className="capitalize">
              {organization.plan}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {organization.subdomain}.bookflow.app
          </p>
        </div>
      </div>
    </aside>
  );
}
