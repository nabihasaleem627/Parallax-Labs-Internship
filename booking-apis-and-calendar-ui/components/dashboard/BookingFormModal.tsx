"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createBookingSchema, BookingStatusType } from "@/lib/validations/booking";
import { generateClientUUID } from "@/lib/utils";
import { Clock, Calendar as CalendarIcon, User, Mail, Phone, Tag, FileText } from "lucide-react";

export interface BookingData {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceId?: string | null;
  serviceName?: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  status: BookingStatusType;
  notes?: string | null;
  price?: number;
}

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingToEdit?: BookingData | null;
  initialDate?: string;
  initialTime?: string;
  onSuccess: (booking: BookingData) => void;
}

export function BookingFormModal({
  isOpen,
  onClose,
  bookingToEdit,
  initialDate,
  initialTime,
  onSuccess,
}: BookingFormModalProps) {
  const toast = useToast();
  const isEditing = Boolean(bookingToEdit?.id);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceName, setServiceName] = useState("General Appointment");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [status, setStatus] = useState<BookingStatusType>("CONFIRMED");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState<number | string>(0);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      // Generate a fresh idempotency key for this creation session
      setIdempotencyKey(generateClientUUID());
      setErrors({});

      if (bookingToEdit) {
        setCustomerName(bookingToEdit.customerName || "");
        setCustomerEmail(bookingToEdit.customerEmail || "");
        setCustomerPhone(bookingToEdit.customerPhone || "");
        setServiceName(bookingToEdit.serviceName || "General Appointment");

        const dateVal =
          typeof bookingToEdit.bookingDate === "string"
            ? bookingToEdit.bookingDate.split("T")[0]
            : new Date(bookingToEdit.bookingDate).toISOString().split("T")[0];
        setBookingDate(dateVal);

        setStartTime(bookingToEdit.startTime || "09:00");
        setEndTime(bookingToEdit.endTime || "10:00");
        setStatus(bookingToEdit.status || "CONFIRMED");
        setNotes(bookingToEdit.notes || "");
        setPrice(bookingToEdit.price ?? 0);
      } else {
        const todayStr = initialDate || new Date().toISOString().split("T")[0];
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setServiceName("General Appointment");
        setBookingDate(todayStr);
        setStartTime(initialTime || "09:00");
        // default 1 hour after start
        const [h, m] = (initialTime || "09:00").split(":").map(Number);
        const endH = (h + 1).toString().padStart(2, "0");
        setEndTime(`${endH}:${m.toString().padStart(2, "0")}`);
        setStatus("CONFIRMED");
        setNotes("");
        setPrice(0);
      }
    }
  }, [isOpen, bookingToEdit, initialDate, initialTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      serviceName,
      bookingDate,
      startTime,
      endTime,
      status,
      notes: notes || undefined,
      price: Number(price) || 0,
    };

    // Client-side Zod validation
    const validationResult = createBookingSchema.safeParse(payload);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || "form";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error("Validation Error", "Please review the highlighted fields in the form.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/bookings/${bookingToEdit!.id}`
        : `/api/bookings`;

      const method = isEditing ? "PATCH" : "POST";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Include Idempotency-Key for POST requests to guard against network retries/double-submissions
      if (!isEditing && idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.code === "BOOKING_CONFLICT") {
          setErrors({
            startTime: "This time slot is already booked for another appointment.",
            endTime: "Please select an unoccupied time window.",
          });
          toast.error("Time Slot Conflict", data.error.message || "This time slot is already booked.");
        } else if (data.error?.details && Array.isArray(data.error.details)) {
          const apiFieldErrors: Record<string, string> = {};
          data.error.details.forEach((d: { field?: string; message: string }) => {
            if (d.field) apiFieldErrors[d.field] = d.message;
          });
          setErrors(apiFieldErrors);
          toast.error("Validation Error", data.error.message);
        } else {
          toast.error("Booking Failed", data.error?.message || "Unable to save booking. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success(
        isEditing ? "Booking Updated" : "Booking Created Successfully",
        `${payload.customerName} scheduled for ${payload.bookingDate} at ${payload.startTime}.`
      );

      onSuccess(data.data);
      onClose();
    } catch (err) {
      console.error("Booking form submit error:", err);
      toast.error("Network Error", "Unable to communicate with the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Booking Details" : "Create New Booking"}
      description={
        isEditing
          ? "Update appointment timing, customer information, or status."
          : "Schedule a client appointment with automated conflict prevention."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.customerName
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {errors.customerName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="eleanor@example.com"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.customerEmail
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {errors.customerEmail && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.customerEmail}</p>
            )}
          </div>
        </div>

        {/* Phone & Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service / Appointment Type
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Initial Consultation"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Date & Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Booking Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.bookingDate
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {errors.bookingDate && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.bookingDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.startTime
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {errors.startTime && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  errors.endTime
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {errors.endTime && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Status & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Booking Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatusType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Price / Fee ($)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Appointment Notes / Client Instructions
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes or client requirements..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {!isEditing && (
              <span title={`Idempotency Key: ${idempotencyKey}`}>
                Protected by Idempotency Key
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isEditing ? "Save Changes" : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
