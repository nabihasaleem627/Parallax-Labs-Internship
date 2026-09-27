"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { BookingFormModal } from "@/components/dashboard/BookingFormModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateSuccess = () => {
    // Notify window for views that listen to booking updates
    window.dispatchEvent(new CustomEvent("booking:changed"));
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreateBooking={() => setIsCreateModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Quick Create Booking Modal */}
      <BookingFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
