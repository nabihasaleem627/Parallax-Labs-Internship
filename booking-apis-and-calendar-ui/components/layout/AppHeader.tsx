"use client";

import React from "react";
import { Menu, Plus, Calendar } from "lucide-react";
import { TenantSwitcher } from "@/components/dashboard/TenantSwitcher";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onOpenCreateBooking?: () => void;
}

export function AppHeader({ onToggleSidebar, onOpenCreateBooking }: AppHeaderProps) {
  const todayStr = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left side: Hamburger (mobile) + Tenant Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <TenantSwitcher />
      </div>

      {/* Center: Current date display */}
      <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/50">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>{todayStr}</span>
      </div>

      {/* Right side: Quick Action "New Booking" + User avatar */}
      <div className="flex items-center gap-3">
        {onOpenCreateBooking && (
          <Button
            size="sm"
            onClick={onOpenCreateBooking}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-semibold text-xs sm:text-sm"
          >
            <span>New Booking</span>
          </Button>
        )}

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/20">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
