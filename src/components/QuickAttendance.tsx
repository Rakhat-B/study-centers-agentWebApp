"use client";

import { CheckCheck } from "lucide-react";
import WidgetTitleLink from "@/components/WidgetTitleLink";

const attendanceSummary = [
  { label: "Present", value: "24" },
  { label: "Late", value: "3" },
  { label: "Absent", value: "2" },
];

export default function QuickAttendance() {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#my-classes" title="Quick Attendance" />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            Snapshot of current sessions
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(52, 199, 89, 0.14)", color: "rgb(21, 128, 61)" }}
        >
          <CheckCheck size={15} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {attendanceSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl px-2.5 py-2 text-center"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <p className="text-[16px] font-bold" style={{ color: "var(--foreground)" }}>
              {item.value}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(29,29,31,0.55)" }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
