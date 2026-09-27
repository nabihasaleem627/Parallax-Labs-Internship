"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarRange, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              Schedulr<span className="text-indigo-600 dark:text-indigo-400">.io</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              B2B SaaS Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Features
          </a>
          <a href="#demo" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Live Preview
          </a>
          <a href="#industries" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Industries
          </a>
          <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Pricing
          </a>
          <Link href="/postman/booking-api.json" target="_blank" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            API Spec
          </Link>
        </nav>

        {/* CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Live Demo
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="shadow-sm"
            >
              Explore Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Features
          </a>
          <a
            href="#demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Live Preview
          </a>
          <a
            href="#industries"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Industries
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Pricing
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full" size="sm">
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
