"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Tag,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateSafe, formatTime12h, formatCurrency } from "@/lib/utils";
import { BookingDetailRecord } from "./BookingDetailsModal";

interface BookingListProps {
  bookings: BookingDetailRecord[];
  isLoading: boolean;
  onSelectBooking: (booking: BookingDetailRecord) => void;
  onEditBooking: (booking: BookingDetailRecord) => void;
  onDeleteBooking: (booking: BookingDetailRecord) => void;
  onCreateBooking: () => void;
  onRefresh: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export function BookingList({
  bookings,
  isLoading,
  onSelectBooking,
  onEditBooking,
  onDeleteBooking,
  onCreateBooking,
  onRefresh,
  page = 1,
  totalPages = 1,
  onPageChange,
}: BookingListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === "ALL" || b.status.toUpperCase() === statusFilter.toUpperCase();

    const matchesSearch =
      !search ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const exportCSV = () => {
    if (filteredBookings.length === 0) return;
    const headers = ["ID", "Customer Name", "Customer Email", "Phone", "Service", "Date", "Start Time", "End Time", "Status", "Price", "Notes"];
    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.customerName}"`,
      `"${b.customerEmail}"`,
      `"${b.customerPhone || ""}"`,
      `"${b.serviceName}"`,
      `"${formatDateSafe(b.bookingDate, "yyyy-MM-dd")}"`,
      b.startTime,
      b.endTime,
      b.status,
      b.price || 0,
      `"${(b.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${formatDateSafe(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, service..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700">
            {["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All" : st.toLowerCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Refresh bookings"
            className="text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            title="Export CSV"
            className="text-slate-600 dark:text-slate-300"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onCreateBooking}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={search || statusFilter !== "ALL" ? "No matching bookings" : "No bookings scheduled"}
            description={
              search || statusFilter !== "ALL"
                ? "Try adjusting your search query or status filter."
                : "Create your first appointment to populate your workspace roster."
            }
            actionLabel="Schedule Booking"
            onAction={onCreateBooking}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Customer */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                        {b.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{b.customerEmail}</p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {b.serviceName}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-900 dark:text-white text-xs">
                        {formatDateSafe(b.bookingDate, "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                        {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}
                      </p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <StatusBadge status={b.status} />
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 text-xs font-semibold text-slate-900 dark:text-white">
                    {b.price ? formatCurrency(b.price) : "—"}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditBooking(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit booking"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBooking(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
