import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LiveInteractiveDemo } from "@/components/landing/LiveInteractiveDemo";
import { IndustryShowcase } from "@/components/landing/IndustryShowcase";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureGrid />
        <LiveInteractiveDemo />
        <IndustryShowcase />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
