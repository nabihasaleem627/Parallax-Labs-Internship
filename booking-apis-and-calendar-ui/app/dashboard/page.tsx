"use client";

import React, { useState, useEffect, useCallback } from "react";
import { OverviewMetrics, DashboardStatsData } from "@/components/dashboard/OverviewMetrics";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
import {
  BookingDetailsModal,
  BookingDetailRecord,
} from "@/components/dashboard/BookingDetailsModal";
import {
  BookingFormModal,
} from "@/components/dashboard/BookingFormModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Plus, RefreshCw, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [bookings, setBookings] = useState<BookingDetailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<BookingDetailRecord | null>(null);
  const [initialBookingDate, setInitialBookingDate] = useState<string | undefined>();
  const [initialBookingTime, setInitialBookingTime] = useState<string | undefined>();

  // Fetch metrics and bookings
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/bookings?limit=100"),
      ]);

      const [statsJson, bookingsJson] = await Promise.all([
        statsRes.json(),
        bookingsRes.json(),
      ]);

      if (!statsRes.ok || !statsJson.success) {
        throw new Error(statsJson.error?.message || "Failed to load statistics");
      }
      if (!bookingsRes.ok || !bookingsJson.success) {
        throw new Error(bookingsJson.error?.message || "Failed to load bookings");
      }

      setStats(statsJson.data);
      setBookings(bookingsJson.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retrieve workspace data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleBookingChanged = () => {
      loadDashboardData();
    };

    window.addEventListener("booking:changed", handleBookingChanged);
    return () => {
      window.removeEventListener("booking:changed", handleBookingChanged);
    };
  }, [loadDashboardData]);

  // Calendar booking interaction handlers
  const handleSelectBooking = (b: BookingDetailRecord) => {
    setSelectedBooking(b);
    setIsDetailsOpen(true);
  };

  const handleCreateBookingFromCalendar = (dateStr?: string, timeStr?: string) => {
    setBookingToEdit(null);
    setInitialBookingDate(dateStr);
    setInitialBookingTime(timeStr);
    setIsFormOpen(true);
  };

  const handleEditBooking = (b: BookingDetailRecord) => {
    setIsDetailsOpen(false);
    setBookingToEdit(b);
    setIsFormOpen(true);
  };

  const handleDeletedBooking = (deletedId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== deletedId));
    loadDashboardData();
  };

  const handleStatusChanged = (updated: BookingDetailRecord) => {
    setSelectedBooking(updated);
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    loadDashboardData();
  };

  const handleFormSuccess = () => {
    loadDashboardData();
    window.dispatchEvent(new CustomEvent("booking:changed"));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Booking Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time appointment schedule, customer records, and conflict-free calendar roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            title="Refresh database records"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleCreateBookingFromCalendar()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-semibold"
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Error state alert if fetch fails */}
      {error && (
        <ErrorState
          title="Could not load dashboard data"
          message={error}
          onRetry={loadDashboardData}
        />
      )}

      {/* Overview Metric Cards (Real DB Data) */}
      <OverviewMetrics stats={stats} isLoading={isLoading} />

      {/* Booking Calendar Interface */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Calendar & Appointment Roster
          </h2>
          <span className="text-xs text-slate-400">
            Click any cell or slot to schedule
          </span>
        </div>

        <BookingCalendar
          bookings={bookings}
          isLoading={isLoading}
          onSelectBooking={handleSelectBooking}
          onCreateBooking={handleCreateBookingFromCalendar}
        />
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        onEdit={handleEditBooking}
        onDeleted={handleDeletedBooking}
        onStatusChanged={handleStatusChanged}
      />

      {/* Booking Create/Edit Form Modal */}
      <BookingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bookingToEdit={bookingToEdit}
        initialDate={initialBookingDate}
        initialTime={initialBookingTime}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
