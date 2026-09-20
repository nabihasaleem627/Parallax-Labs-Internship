"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon, MenuIcon, XIcon } from "@/components/ui/icons";
import { RoleBadge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/format";
import { navItems } from "./nav-items";
import type { SidebarOrganization } from "./sidebar";

export type TopbarUser = {
  name: string;
  email: string;
  role: "ORG_ADMIN" | "STAFF" | "USER";
};

export function Topbar({
  user,
  organization,
}: {
  user: TopbarUser;
  organization: SidebarOrganization;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{organization.name}</p>
            <p className="truncate text-xs text-slate-500">{organization.subdomain}.bookflow.app</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials(user.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-slate-900">
                {user.name}
              </span>
              <span className="block text-xs leading-tight text-slate-500">{user.email}</span>
            </span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  role="menuitem"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
                  role="menuitem"
                >
                  <LogOutIcon className="h-4 w-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-base font-semibold text-slate-900">{organization.name}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMobileOpen(false);
                      router.refresh();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
            </div>
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
              >
                <LogOutIcon className="h-5 w-5" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
