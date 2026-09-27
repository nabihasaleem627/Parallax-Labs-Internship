import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Schedulr | Modern Multi-Tenant SaaS Booking Platform",
  description:
    "Production-ready B2B SaaS booking platform featuring atomic double-booking prevention, database-backed idempotency, multi-tenant data isolation, and responsive calendar management.",
  keywords: [
    "SaaS booking platform",
    "appointment scheduler",
    "multi-tenant calendar",
    "conflict prevention",
    "idempotent booking API",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
