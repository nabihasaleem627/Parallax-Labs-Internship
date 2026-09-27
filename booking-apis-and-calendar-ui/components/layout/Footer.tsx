import React from "react";
import Link from "next/link";
import { CalendarRange, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <CalendarRange className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Schedulr<span className="text-indigo-400">.io</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Enterprise-grade multi-tenant booking infrastructure engineered with Next.js, Prisma, PostgreSQL, and strict idempotency.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production Systems Operational</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Interactive Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/calendar" className="hover:text-white transition-colors">
                  Responsive Calendar
                </Link>
              </li>
              <li>
                <Link href="/dashboard/bookings" className="hover:text-white transition-colors">
                  Booking Management
                </Link>
              </li>
              <li>
                <Link href="/dashboard/customers" className="hover:text-white transition-colors">
                  Customer Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & API */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Architecture & API
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/api/health" target="_blank" className="hover:text-white transition-colors">
                  REST Health API
                </a>
              </li>
              <li>
                <a href="/postman/booking-api.json" download target="_blank" className="hover:text-white transition-colors">
                  Postman Collection (v2.1)
                </a>
              </li>
              <li>
                <span className="text-slate-500">Idempotency-Key Protocol</span>
              </li>
              <li>
                <span className="text-slate-500">Atomic Conflict Prevention</span>
              </li>
            </ul>
          </div>

          {/* Compliance & Standard */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Engineered For
            </h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              Clinics, Salons, Consultants, Agencies, Fitness Studios, and Small Businesses.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Tenant Isolated</span>
              </div>
              <p className="text-slate-500 text-[10px]">
                Strict tenant scoping prevents unauthorized cross-tenant data access.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Schedulr SaaS Platform. Production-Ready Software.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, TypeScript, Tailwind CSS & PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
}
