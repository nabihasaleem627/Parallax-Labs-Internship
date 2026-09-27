"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  Settings,
  ShieldCheck,
  ExternalLink,
  Code2,
  CalendarRange,
} from "lucide-react";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Bookings",
      href: "/dashboard/bookings",
      icon: CalendarCheck,
      current: pathname.startsWith("/dashboard/bookings"),
    },
    {
      name: "Calendar",
      href: "/dashboard/calendar",
      icon: CalendarDays,
      current: pathname.startsWith("/dashboard/calendar"),
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: Users,
      current: pathname.startsWith("/dashboard/customers"),
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                Schedulr<span className="text-indigo-400">.io</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                B2B SaaS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.current ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Developer & API
          </div>

          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>API Health Check</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href="/postman/booking-api.json"
            target="_blank"
            download
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Postman Collection</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>

        {/* Footer info / Multi-tenant status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-300">Live Production Mode</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Idempotency Active</span>
            <span>PostgreSQL Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}
