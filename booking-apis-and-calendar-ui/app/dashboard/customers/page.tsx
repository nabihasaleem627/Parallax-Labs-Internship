"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CustomerList, CustomerRecord } from "@/components/customers/CustomerList";
import { CustomerModal } from "@/components/customers/CustomerModal";
import { BookingFormModal } from "@/components/dashboard/BookingFormModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Users } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [targetCustomerForBooking, setTargetCustomerForBooking] = useState<CustomerRecord | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load customers");
      }
      setCustomers(json.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retrieve customers.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleBookForCustomer = (c: CustomerRecord) => {
    setTargetCustomerForBooking(c);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-indigo-600" />
          Customer Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Client profiles, lifetime appointment histories, and intake notes.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadCustomers} />
      ) : (
        <CustomerList
          customers={customers}
          isLoading={isLoading}
          onCreateCustomer={() => setIsCustomerModalOpen(true)}
          onBookForCustomer={handleBookForCustomer}
        />
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setTargetCustomerForBooking(null);
        }}
        bookingToEdit={
          targetCustomerForBooking
            ? {
                customerName: targetCustomerForBooking.name,
                customerEmail: targetCustomerForBooking.email,
                customerPhone: targetCustomerForBooking.phone || undefined,
                serviceName: "General Appointment",
                bookingDate: new Date().toISOString().split("T")[0],
                startTime: "09:00",
                endTime: "10:00",
                status: "CONFIRMED",
                notes: targetCustomerForBooking.notes || undefined,
                price: 0,
              }
            : null
        }
        onSuccess={() => {
          loadCustomers();
          window.dispatchEvent(new CustomEvent("booking:changed"));
        }}
      />
    </div>
  );
}
