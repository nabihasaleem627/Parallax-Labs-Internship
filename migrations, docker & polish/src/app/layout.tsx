import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavHeader } from "@/components/NavHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parallax Settings - Multi-Tenant Settings & Caching",
  description:
    "Week 6: production-ready tenant settings dashboard with Redis caching, database fallback, and health monitoring.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <NavHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4">
          <p className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-500 sm:px-6">
            Parallax Labs Internship &mdash; Week 6: Advanced Caching &amp; Settings UI
          </p>
        </footer>
      </body>
    </html>
  );
}
