"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Search,
  CalendarDays,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateSafe } from "@/lib/utils";
import { BookingDetailRecord } from "./BookingDetailsModal";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

interface BookingCalendarProps {
  bookings: BookingDetailRecord[];
  isLoading?: boolean;
  onSelectBooking: (booking: BookingDetailRecord) => void;
  onCreateBooking: (dateStr?: string, timeStr?: string) => void;
  onRefresh?: () => void;
}

export function BookingCalendar({
  bookings,
  onSelectBooking,
  onCreateBooking,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === "day") {
      const prev = subDays(currentDate, 1);
      setCurrentDate(prev);
      setSelectedDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === "day") {
      const next = addDays(currentDate, 1);
      setCurrentDate(next);
      setSelectedDate(next);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Filter bookings based on status and search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        statusFilter === "ALL" || b.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesSearch =
        !searchQuery ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingDetailRecord[]>();

    filteredBookings.forEach((b) => {
      const dateKey =
        typeof b.bookingDate === "string"
          ? b.bookingDate.split("T")[0]
          : format(new Date(b.bookingDate), "yyyy-MM-dd");

      const list = map.get(dateKey) || [];
      list.push(b);
      map.set(dateKey, list);
    });

    // Sort bookings within each day by start time
    map.forEach((list) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [filteredBookings]);

  // Month View Days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Week View Days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Bookings for selected date
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayBookings = bookingsByDate.get(selectedDateKey) || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header / Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Month title & Nav buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
              aria-label="Previous date period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
              aria-label="Next date period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white min-w-[160px]">
            {viewMode === "day"
              ? format(currentDate, "MMMM d, yyyy")
              : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

        {/* Center: Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Right: View mode toggle & Create action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700">
            {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => onCreateBooking(format(selectedDate, "yyyy-MM-dd"))}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            Schedule
          </Button>
        </div>
      </div>

      {/* Main Calendar View Area */}
      <div className="p-4 sm:p-6 flex-1 overflow-x-auto">
        {/* VIEW 1: MONTH VIEW */}
        {viewMode === "month" && (
          <div className="space-y-2">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 pb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayBookings = bookingsByDate.get(dayKey) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20"
                        : isDayToday
                        ? "border-indigo-300 dark:border-indigo-800 bg-indigo-50/10"
                        : isCurrentMonth
                        ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                        : "border-slate-100/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/20 opacity-50"
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isDayToday
                            ? "bg-indigo-600 text-white font-bold"
                            : isSelected
                            ? "text-indigo-600 dark:text-indigo-400 font-bold"
                            : isCurrentMonth
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Quick Add button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateBooking(dayKey);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-opacity hidden sm:block"
                        title="Add booking for this day"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bookings pills */}
                    <div className="space-y-1 mt-1 overflow-hidden flex-1">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(b);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 transition-opacity hover:opacity-85 ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : b.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : b.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 line-through opacity-70"
                          }`}
                        >
                          <span className="shrink-0">{b.startTime}</span>
                          <span className="truncate">{b.customerName}</span>
                        </div>
                      ))}

                      {dayBookings.length > 3 && (
                        <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 px-1">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEK VIEW */}
        {viewMode === "week" && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDate.get(dayKey) || [];
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-xl border p-3 flex flex-col min-h-[300px] ${
                    isDayToday
                      ? "border-indigo-400 bg-indigo-50/20 dark:border-indigo-900/60 dark:bg-indigo-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        {format(day, "EEE")}
                      </span>
                      <p className={`text-base font-bold ${isDayToday ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}>
                        {format(day, "MMM d")}
                      </p>
                    </div>
                    <button
                      onClick={() => onCreateBooking(dayKey)}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Add booking"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayBookings.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-3 text-[11px] text-slate-400">
                        No appointments
                      </div>
                    ) : (
                      dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => onSelectBooking(b)}
                          className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                            <span>{b.startTime} - {b.endTime}</span>
                            <StatusBadge status={b.status} showIcon={false} className="text-[9px] px-1.5 py-0" />
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {b.customerName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {b.serviceName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: DAY VIEW */}
        {viewMode === "day" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDayBookings.length} appointment{selectedDayBookings.length === 1 ? "" : "s"} scheduled
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onCreateBooking(format(currentDate, "yyyy-MM-dd"))}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Book Slot
              </Button>
            </div>

            <div className="space-y-2">
              {selectedDayBookings.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No appointments booked for this day. Click &ldquo;Book Slot&rdquo; to add one.
                </div>
              ) : (
                selectedDayBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 py-2 rounded-lg">
                        {b.startTime}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {b.customerName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{b.serviceName}</span>
                          <span>•</span>
                          <span>{b.customerEmail}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: AGENDA VIEW */}
        {viewMode === "agenda" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No matching bookings found for the selected filter.
              </div>
            ) : (
              Array.from(bookingsByDate.entries()).map(([dateStr, dayBookings]) => (
                <div key={dateStr} className="space-y-2">
                  <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {formatDateSafe(dateStr, "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-xs text-slate-400">
                      {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            {b.startTime} - {b.endTime}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {b.customerName}
                            </p>
                            <p className="text-xs text-slate-500">{b.serviceName} • {b.customerEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Day Agenda Drawer */}
      {viewMode === "month" && (
        <div className="p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Roster for {formatDateSafe(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreateBooking(selectedDateKey)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Add Booking
            </Button>
          </div>

          {selectedDayBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              No bookings scheduled for this date. Click &ldquo;Add Booking&rdquo; or click any date cell to schedule.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {b.startTime} - {b.endTime}
                    </span>
                    <StatusBadge status={b.status} showIcon={false} className="text-[10px] px-1.5 py-0" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {b.customerName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {b.serviceName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
