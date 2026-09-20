"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import { NewBookingForm } from "./new-booking-form";

export function NewBookingPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        aria-expanded={open}
      >
        <PlusIcon className="h-4 w-4" />
        New booking
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-full min-w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Create a booking</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <NewBookingForm onCreated={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
