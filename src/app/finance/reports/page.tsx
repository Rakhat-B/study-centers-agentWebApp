"use client";

import AppShell from "@/components/AppShell";
import { useDashboard } from "@/context/DashboardContext";

export default function ReportsPage() {
  const { currentRole } = useDashboard();

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Reports
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Analytics placeholders
          </p>
        </div>
      </div>

      {currentRole !== "Director" ? (
        <div className="glass-card p-5">
          <p className="text-[14px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
            Director-only
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            You don’t have access to this page under the current role.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="glass-card p-5">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              Revenue Summary
            </p>
            <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
              Placeholder card for revenue by day/week/month.
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              Student Growth
            </p>
            <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
              Placeholder card for student acquisition and retention charts.
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              Teacher Performance
            </p>
            <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
              Placeholder card for attendance, outcomes, and class load.
            </p>
          </div>
          <div className="glass-card p-5 md:col-span-2">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              KPI Overview
            </p>
            <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
              Placeholder card for KPI widgets and trend comparisons.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
