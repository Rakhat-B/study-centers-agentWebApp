"use client";

import { CalendarClock } from "lucide-react";
import { formatKZT, mockPayrollUpcoming } from "@/data/mock";
import { t } from "@/lib/i18n";

export default function UpcomingPayroll() {
  const totalHours = mockPayrollUpcoming.reduce((sum, row) => sum + row.hours, 0);
  const totalAmount = mockPayrollUpcoming.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            {t("payroll.title", "Upcoming Payroll")}
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {t("payroll.subtitle", "Preview for next payout cycle")}
          </p>
        </div>
        <CalendarClock size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      <div className="flex flex-col gap-2">
        {mockPayrollUpcoming.map((teacher) => (
          <div
            key={teacher.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                {teacher.teacher}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
                {teacher.hours}h · {teacher.groupCount} {t("payroll.groups", "groups")}
              </p>
            </div>

            <p className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
              {formatKZT(teacher.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-xl px-3 py-2.5" style={{ background: "rgba(0, 113, 227, 0.1)", border: "1px solid rgba(0, 113, 227, 0.2)" }}>
        <p className="text-[11px]" style={{ color: "rgba(29,29,31,0.55)" }}>
          {t("payroll.totalHours", "Total hours")}: <span className="font-semibold text-[12px]" style={{ color: "var(--foreground)" }}>{totalHours}h</span>
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
          {t("payroll.totalAmount", "Total amount")}: <span className="font-semibold text-[12px]" style={{ color: "var(--foreground)" }}>{formatKZT(totalAmount)}</span>
        </p>
      </div>
    </div>
  );
}
