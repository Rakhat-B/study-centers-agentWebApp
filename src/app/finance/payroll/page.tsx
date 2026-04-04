"use client";

import AppShell from "@/components/AppShell";
import { useDashboard } from "@/context/DashboardContext";
import { mockPayrollUpcoming, formatKZT } from "@/data/mock";
import type { CSSProperties } from "react";

type PayrollStatus = "calculated" | "confirmed" | "paid";

function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const config: Record<PayrollStatus, { label: string; style: CSSProperties }> = {
    calculated: {
      label: "Calculated",
      style: {
        background: "rgba(0, 113, 227, 0.14)",
        border: "1px solid rgba(0, 113, 227, 0.22)",
        color: "var(--accent)",
      },
    },
    confirmed: {
      label: "Confirmed",
      style: {
        background: "rgba(255, 149, 0, 0.14)",
        border: "1px solid rgba(255, 149, 0, 0.22)",
        color: "rgba(160, 90, 0, 1)",
      },
    },
    paid: {
      label: "Paid",
      style: {
        background: "rgba(52, 199, 89, 0.14)",
        border: "1px solid rgba(52, 199, 89, 0.22)",
        color: "rgb(21, 128, 61)",
      },
    },
  };

  const { label, style } = config[status];
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={style}>
      {label}
    </span>
  );
}

export default function PayrollPage() {
  const { currentRole } = useDashboard();

  const rows = mockPayrollUpcoming.map((p, idx) => ({
    ...p,
    status: (idx === 0 ? "confirmed" : idx === 1 ? "calculated" : "paid") as PayrollStatus,
  }));

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Payroll
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Salary cycle overview and payout status
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 glass-card p-5 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/20">
            <p className="text-[13px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
              Cycle Summary
            </p>
            <p className="text-[24px] font-bold mt-2" style={{ color: "var(--foreground)" }}>
              {formatKZT(total)}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
              Total due for this cycle
            </p>
          </div>

          <div className="xl:col-span-2 glass-card p-5 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
                Staff Payroll
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl px-3 py-3 flex items-center justify-between gap-4 transition-colors hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                      {r.teacher}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.5)" }}>
                      {r.hours} hours • {r.groupCount} groups
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: "rgba(29,29,31,0.8)" }}>
                      {formatKZT(r.amount)}
                    </p>
                    <PayrollStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
