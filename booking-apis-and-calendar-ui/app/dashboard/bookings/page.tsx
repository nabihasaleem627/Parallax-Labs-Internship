"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookingList } from "@/components/dashboard/BookingList";
import {
  BookingDetailsModal,
  BookingDetailRecord,
} from "@/components/dashboard/BookingDetailsModal";
import {
  BookingFormModal,
} from "@/components/dashboard/BookingFormModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { CalendarCheck } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDetailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingDetailRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<BookingDetailRecord | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings?limit=100");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load bookings");
      }
      setBookings(json.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retrieve bookings.";
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

  const handleSelect = (b: BookingDetailRecord) => {
    setSelectedBooking(b);
    setIsDetailsOpen(true);
  };

  const handleEdit = (b: BookingDetailRecord) => {
    setIsDetailsOpen(false);
    setBookingToEdit(b);
    setIsFormOpen(true);
  };

  const handleDelete = (b: BookingDetailRecord) => {
    setSelectedBooking(b);
    setIsDetailsOpen(true);
  };

  const handleDeleted = (deletedId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== deletedId));
    loadBookings();
  };

  const handleStatusChanged = (updated: BookingDetailRecord) => {
    setSelectedBooking(updated);
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    loadBookings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <CalendarCheck className="w-6 h-6 text-indigo-600" />
          Booking Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search, filter, update, and export all customer appointments in your workspace.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadBookings} />
      ) : (
        <BookingList
          bookings={bookings}
          isLoading={isLoading}
          onSelectBooking={handleSelect}
          onEditBooking={handleEdit}
          onDeleteBooking={handleDelete}
          onCreateBooking={() => {
            setBookingToEdit(null);
            setIsFormOpen(true);
          }}
          onRefresh={loadBookings}
        />
      )}

      <BookingDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
        onStatusChanged={handleStatusChanged}
      />

      <BookingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bookingToEdit={bookingToEdit}
        onSuccess={() => {
          loadBookings();
          window.dispatchEvent(new CustomEvent("booking:changed"));
        }}
      />
    </div>
  );
}
