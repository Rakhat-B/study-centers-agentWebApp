"use client";

import AppShell from "@/components/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Help & Support
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for FAQs, contact, and onboarding docs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-5">
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            Getting Started
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for onboarding steps, navigation guide, and common workflows.
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            Contact Support
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for WhatsApp/Email contact options and issue reporting.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
