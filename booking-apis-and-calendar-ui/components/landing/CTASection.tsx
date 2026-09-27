import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30">
          <CalendarRange className="w-6 h-6" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Ready to modernize your appointment workflow?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Experience clean scheduling, instant double-booking prevention, and production-ready multi-tenant management today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-lg shadow-indigo-500/25"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Now
            </Button>
          </Link>
          <Link href="/dashboard/calendar" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-semibold"
            >
              Explore Live Workspace
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            No credit card required for demo
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Zero-config instant deployment
          </span>
        </div>
      </div>
    </section>
  );
}
