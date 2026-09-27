"use client";

import React from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export interface DashboardStatsData {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  currency: string;
}

interface OverviewMetricsProps {
  stats: DashboardStatsData | null;
  isLoading: boolean;
}

export function OverviewMetrics({ stats, isLoading }: OverviewMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Bookings",
      value: stats?.totalBookings ?? 0,
      description: "All historical & scheduled records",
      icon: CalendarDays,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
      borderColor: "border-indigo-100 dark:border-indigo-900/50",
    },
    {
      title: "Today's Bookings",
      value: stats?.todayBookings ?? 0,
      description: "Scheduled for today's roster",
      icon: CalendarClock,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-950/50",
      borderColor: "border-sky-100 dark:border-sky-900/50",
    },
    {
      title: "Upcoming Bookings",
      value: stats?.upcomingBookings ?? 0,
      description: "Confirmed or pending future slots",
      icon: CalendarCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      title: "Cancelled Bookings",
      value: stats?.cancelledBookings ?? 0,
      description: "Freed slots available for rebooking",
      icon: CalendarX2,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      borderColor: "border-rose-100 dark:border-rose-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                {card.title}
              </span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bgColor} ${card.borderColor} border shrink-0`}
              >
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.value.toLocaleString()}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
