"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  Clock,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LiveInteractiveDemo() {
  const [selectedSlot, setSelectedSlot] = useState<string>("10:00 - 11:00");
  const [customerName, setCustomerName] = useState<string>("Alex Rivera");
  const [testResult, setTestResult] = useState<{
    status: "idle" | "conflict" | "success" | "idempotent";
    message: string;
    code?: string;
  }>({
    status: "idle",
    message: "Select a slot above and click 'Test Reservation Engine' to test atomic conflict detection.",
  });

  // Pre-configured test slots representing active DB bookings vs free slots
  const slots = [
    { time: "09:00 - 10:00", status: "OCCUPIED", bookedBy: "Eleanor Vance (Dr. Jenkins)" },
    { time: "10:00 - 11:00", status: "AVAILABLE", bookedBy: "Open Slot" },
    { time: "11:00 - 12:00", status: "OCCUPIED", bookedBy: "David Kim (Physical Therapy)" },
    { time: "14:00 - 15:00", status: "AVAILABLE", bookedBy: "Open Slot" },
    { time: "15:00 - 16:00", status: "OCCUPIED", bookedBy: "Sophia Martinez (Checkup)" },
    { time: "16:00 - 17:00", status: "AVAILABLE", bookedBy: "Open Slot" },
  ];

  const handleTestBooking = () => {
    const targetSlot = slots.find((s) => s.time === selectedSlot);

    if (targetSlot?.status === "OCCUPIED") {
      setTestResult({
        status: "conflict",
        code: "BOOKING_CONFLICT",
        message: `HTTP 409 Conflict: Time slot ${selectedSlot} is already booked by ${targetSlot.bookedBy}. System prevented double-booking atomically.`,
      });
    } else {
      setTestResult({
        status: "success",
        code: "201_CREATED",
        message: `HTTP 201 Created: Appointment successfully registered for ${customerName} at ${selectedSlot}. Database-level idempotency record committed.`,
      });
    }
  };

  const handleSimulateDuplicateRetry = () => {
    setTestResult({
      status: "idempotent",
      code: "IDEMPOTENT_REPLAY",
      message:
        "HTTP 200 OK (Header: Idempotent-Replayed: true). Replayed existing response for key 'idemp_live_test_7f8a9'. No duplicate row created in PostgreSQL.",
    });
  };

  return (
    <section id="demo" className="py-20 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Sandbox</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Test the Conflict & Idempotency Engine Live
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            See how the platform catches overlapping appointments in real time and handles network request retries.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Interactive Slot Picker */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                1. Select a Time Slot to Test
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {slots.map((s) => {
                  const isSelected = selectedSlot === s.time;
                  return (
                    <button
                      key={s.time}
                      onClick={() => {
                        setSelectedSlot(s.time);
                        setTestResult({
                          status: "idle",
                          message: `Selected ${s.time} (${s.status.toLowerCase()}). Click 'Test Reservation Engine' below.`,
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/40"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1">
                        <span>{s.time}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          s.status === "OCCUPIED"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {s.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name for Test
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleTestBooking}
                  className="flex-1 text-xs"
                >
                  Test Reservation Engine
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSimulateDuplicateRetry}
                  className="text-xs"
                  title="Simulate network retry with same Idempotency-Key"
                >
                  Simulate Retry
                </Button>
              </div>
            </div>

            {/* Right Column: Engine Response Output */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] text-slate-400">Server Execution Log</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-400">
                    Idempotency-Key: active
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <p>
                    <span className="text-slate-500">&gt; Target Slot:</span> {selectedSlot}
                  </p>
                  <p>
                    <span className="text-slate-500">&gt; Customer:</span> {customerName}
                  </p>
                  <p>
                    <span className="text-slate-500">&gt; Tenant Context:</span> Acme Wellness (acme-wellness)
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border mt-3 text-xs leading-relaxed ${
                    testResult.status === "conflict"
                      ? "bg-rose-950/80 border-rose-800 text-rose-200"
                      : testResult.status === "success"
                      ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                      : testResult.status === "idempotent"
                      ? "bg-indigo-950/80 border-indigo-800 text-indigo-200"
                      : "bg-slate-800/80 border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 font-bold">
                    {testResult.status === "conflict" && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                    {testResult.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {testResult.status === "idempotent" && <Lock className="w-4 h-4 text-indigo-400" />}
                    <span>{testResult.code || "READY"}</span>
                  </div>
                  <p className="font-sans text-xs">{testResult.message}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Prisma Client Safe</span>
                <span>PostgreSQL 17 Compatible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
