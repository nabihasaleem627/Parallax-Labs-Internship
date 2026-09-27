"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import { Tenant } from "@prisma/client";

interface TenantSwitcherProps {
  currentTenantSlug?: string;
  onTenantChange?: (tenant: Tenant) => void;
}

export function TenantSwitcher({
  currentTenantSlug = "acme-wellness",
  onTenantChange,
}: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await fetch("/api/tenants");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.availableTenants) {
            setTenants(json.data.availableTenants);
            const found =
              json.data.availableTenants.find(
                (t: Tenant) => t.slug === currentTenantSlug
              ) || json.data.currentTenant || json.data.availableTenants[0];
            setActiveTenant(found);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
      }
    }
    loadTenants();
  }, [currentTenantSlug]);

  const handleSelect = (tenant: Tenant) => {
    setActiveTenant(tenant);
    setIsOpen(false);
    // Persist to cookie so subsequent API requests and page reloads pick up the tenant
    document.cookie = `saas_tenant_slug=${tenant.slug}; path=/; max-age=2592000`;
    document.cookie = `saas_tenant_id=${tenant.id}; path=/; max-age=2592000`;
    
    if (onTenantChange) {
      onTenantChange(tenant);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-left bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors border border-slate-200/80 dark:border-slate-700/60 max-w-[240px] w-full"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          {activeTenant ? activeTenant.name.charAt(0) : "W"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {activeTenant?.name || "Workspace"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {activeTenant?.industry || "Multi-Tenant Org"}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Switch Organization
            </div>

            <div className="space-y-0.5 px-1">
              {tenants.map((t) => {
                const isSelected = activeTenant?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {t.industry}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Strict database-level tenant isolation</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
