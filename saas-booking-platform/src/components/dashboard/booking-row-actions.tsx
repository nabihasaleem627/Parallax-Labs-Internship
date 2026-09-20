"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/ui/icons";

type Booking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  userId: string;
};

type CurrentUser = {
  id: string;
  role: "ORG_ADMIN" | "STAFF" | "USER";
};

export function BookingRowActions({
  booking,
  currentUser,
}: {
  booking: Booking;
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const isManager = currentUser.role === "ORG_ADMIN" || currentUser.role === "STAFF";
  const isOwn = booking.userId === currentUser.id;
  const canCancel = isManager || isOwn;
  const canConfirm = isManager && booking.status !== "CONFIRMED" && booking.status !== "CANCELLED";
  const canDelete = isManager;

  if (!canCancel && !canConfirm && !canDelete) return null;

  async function updateStatus(status: "CONFIRMED" | "CANCELLED") {
    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        alert(json?.error ?? "Could not update the booking.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteBooking() {
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        alert(json?.error ?? "Could not delete the booking.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canConfirm && (
        <button
          type="button"
          onClick={() => updateStatus("CONFIRMED")}
          disabled={busy}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
        >
          Confirm
        </button>
      )}
      {canCancel && booking.status !== "CANCELLED" && (
        <button
          type="button"
          onClick={() => updateStatus("CANCELLED")}
          disabled={busy}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={deleteBooking}
          disabled={busy}
          aria-label="Delete booking"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
      {busy && <span className="text-xs text-slate-400">…</span>}
    </div>
  );
}
