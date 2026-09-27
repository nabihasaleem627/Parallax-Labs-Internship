"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
import {
  BookingDetailsModal,
  BookingDetailRecord,
} from "@/components/dashboard/BookingDetailsModal";
import {
  BookingFormModal,
} from "@/components/dashboard/BookingFormModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const [bookings, setBookings] = useState<BookingDetailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingDetailRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<BookingDetailRecord | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [initialTime, setInitialTime] = useState<string | undefined>();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings?limit=150");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load bookings");
      }
      setBookings(json.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load calendar events.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    const handleUpdate = () => loadBookings();
    window.addEventListener("booking:changed", handleUpdate);
    return () => window.removeEventListener("booking:changed", handleUpdate);
  }, [loadBookings]);

  const handleSelectBooking = (b: BookingDetailRecord) => {
    setSelectedBooking(b);
    setIsDetailsOpen(true);
  };

  const handleCreateBooking = (dateStr?: string, timeStr?: string) => {
    setBookingToEdit(null);
    setInitialDate(dateStr);
    setInitialTime(timeStr);
    setIsFormOpen(true);
  };

  const handleEdit = (b: BookingDetailRecord) => {
    setIsDetailsOpen(false);
    setBookingToEdit(b);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
          Interactive Calendar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Full screen multi-view schedule planner with atomic double-booking prevention.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadBookings} />
      ) : (
        <BookingCalendar
          bookings={bookings}
          isLoading={isLoading}
          onSelectBooking={handleSelectBooking}
          onCreateBooking={handleCreateBooking}
        />
      )}

      <BookingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        onEdit={handleEdit}
        onDeleted={() => loadBookings()}
        onStatusChanged={() => loadBookings()}
      />

      <BookingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bookingToEdit={bookingToEdit}
        initialDate={initialDate}
        initialTime={initialTime}
        onSuccess={() => {
          loadBookings();
          window.dispatchEvent(new CustomEvent("booking:changed"));
        }}
      />
    </div>
  );
}
