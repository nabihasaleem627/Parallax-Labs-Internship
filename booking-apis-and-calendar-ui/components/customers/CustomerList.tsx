"use client";

import React, { useState } from "react";
import { Mail, Phone, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateSafe } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  _count?: {
    bookings: number;
  };
  bookings?: Array<{
    id: string;
    bookingDate: string | Date;
    startTime: string;
    endTime: string;
    status: string;
    serviceName: string;
    price: number;
  }>;
}

interface CustomerListProps {
  customers: CustomerRecord[];
  isLoading: boolean;
  onSelectCustomer?: (customer: CustomerRecord) => void;
  onCreateCustomer?: () => void;
  onBookForCustomer?: (customer: CustomerRecord) => void;
}

export function CustomerList({
  customers,
  isLoading,
  onCreateCustomer,
  onBookForCustomer,
}: CustomerListProps) {
  const [search, setSearch] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {onCreateCustomer && (
          <Button
            size="sm"
            onClick={onCreateCustomer}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No customers found"
            description={
              search
                ? "No client profiles match your current search terms."
                : "Customers are automatically indexed when bookings are scheduled, or can be added manually."
            }
            actionLabel={onCreateCustomer ? "Add Customer Profile" : undefined}
            onAction={onCreateCustomer}
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((customer) => {
            const isExpanded = expandedCustomerId === customer.id;
            return (
              <div key={customer.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {customer.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {customer._count?.bookings ?? (customer.bookings?.length || 0)} appointments
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {customer.phone}
                          </span>
                        )}
                        <span className="text-slate-400">
                          Joined {formatDateSafe(customer.createdAt, "MMM yyyy")}
                        </span>
                      </div>
                      {customer.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                          {customer.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {onBookForCustomer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onBookForCustomer(customer)}
                        className="text-xs"
                      >
                        Book Appointment
                      </Button>
                    )}
                    <button
                      onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                    >
                      {isExpanded ? "Hide History" : "View History"}
                    </button>
                  </div>
                </div>

                {/* Expanded recent bookings history */}
                {isExpanded && customer.bookings && customer.bookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Recent Appointments
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {customer.bookings.map((b) => (
                        <div
                          key={b.id}
                          className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {b.serviceName}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              {formatDateSafe(b.bookingDate, "MMM d, yyyy")} • {b.startTime} - {b.endTime}
                            </p>
                          </div>
                          <StatusBadge status={b.status} showIcon={false} className="text-[10px] px-1.5 py-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
