"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDateSafe, formatTime12h, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Tag,
  FileText,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";

export interface BookingDetailRecord {
  id: string;
  tenantId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceId?: string | null;
  serviceName: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  price?: number;
  idempotencyKey?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetailRecord | null;
  onEdit: (booking: BookingDetailRecord) => void;
  onDeleted: (bookingId: string) => void;
  onStatusChanged?: (updatedBooking: BookingDetailRecord) => void;
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onEdit,
  onDeleted,
  onStatusChanged,
}: BookingDetailsModalProps) {
  const toast = useToast();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!booking) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("Failed to Delete", data.error?.message || "Could not delete booking");
        setIsDeleting(false);
        return;
      }

      toast.success("Booking Deleted", "The appointment has been removed.");
      setIsConfirmDeleteOpen(false);
      onDeleted(booking.id);
      onClose();
    } catch (err) {
      console.error("Delete booking error:", err);
      toast.error("Network Error", "Unable to reach server to delete booking.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("Status Update Failed", data.error?.message || "Could not update status.");
        return;
      }

      toast.success("Status Updated", `Booking marked as ${newStatus.toLowerCase()}.`);
      if (onStatusChanged) {
        onStatusChanged(data.data);
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Network Error", "Unable to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyBookingId = () => {
    navigator.clipboard.writeText(booking.id);
    toast.info("Copied", "Booking ID copied to clipboard.");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span>Booking Overview</span>
            <StatusBadge status={booking.status} />
          </div>
        }
        description={
          <span className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={copyBookingId}>
            ID: <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{booking.id}</code>
            <Copy className="w-3 h-3 inline text-slate-400" />
          </span>
        }
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {booking.customerName}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${booking.customerEmail}`} className="hover:underline">
                    {booking.customerEmail}
                  </a>
                </div>
              </div>
              {booking.customerPhone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${booking.customerPhone}`} className="hover:underline">
                    {booking.customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Schedule & Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Date & Schedule
              </h4>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatDateSafe(booking.bookingDate, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)} ({booking.startTime} - {booking.endTime})
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Service & Fee
              </h4>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {booking.serviceName || "General Appointment"}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {booking.price ? formatCurrency(booking.price) : "Free / Included"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notes & Client Instructions
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Created: {formatDateSafe(booking.createdAt, "MMM d, yyyy h:mm a")}</span>
            <span>Updated: {formatDateSafe(booking.updatedAt, "MMM d, yyyy h:mm a")}</span>
          </div>

          {/* Quick status actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              {booking.status !== "CONFIRMED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickStatusChange("CONFIRMED")}
                  isLoading={isUpdatingStatus}
                  className="text-emerald-700 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Confirm
                </Button>
              )}
              {booking.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickStatusChange("CANCELLED")}
                  isLoading={isUpdatingStatus}
                  className="text-rose-700 dark:text-rose-400 border-rose-200 hover:bg-rose-50 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Cancel Slot
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit(booking);
                }}
                leftIcon={<Edit className="w-3.5 h-3.5" />}
              >
                Edit Booking
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog before destructive deletion */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this booking?"
        description={`Are you sure you want to permanently delete the booking for "${booking.customerName}" on ${formatDateSafe(booking.bookingDate)} at ${booking.startTime}? This action cannot be undone.`}
        confirmLabel="Delete Booking"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}
