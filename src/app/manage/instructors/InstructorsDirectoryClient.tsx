"use client";

import AppShell from "@/components/AppShell";
import { useDashboard } from "@/context/DashboardContext";
import { Plus } from "lucide-react";
import { useState } from "react";

export type InstructorTeachingGroup = {
  id: string;
  title: string;
  capacity: number;
  enrolledCount: number;
  fullnessPercent: number;
};

export type InstructorDirectoryItem = {
  id: string;
  name: string;
  specialization: string;
  scheduleSummary: string;
  payrollRateKztPerHour: number;
  groups: InstructorTeachingGroup[];
};

type InstructorsDirectoryClientProps = {
  instructors: InstructorDirectoryItem[];
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export default function InstructorsDirectoryClient({ instructors }: InstructorsDirectoryClientProps) {
  const { currentRole } = useDashboard();
  const [clicked, setClicked] = useState(false);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Instructors
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Specializations, schedules, and payroll rates
          </p>
        </div>

        <button
          onClick={() => {
            setClicked(true);
            setTimeout(() => setClicked(false), 1200);
          }}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-[14px] tracking-tight transition-all duration-200"
          style={{
            background: clicked
              ? "linear-gradient(135deg, #005fc4 0%, #1f8ef4 100%)"
              : "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
            color: "white",
            boxShadow: clicked ? "0 4px 12px rgba(0, 109, 224, 0.3)" : "0 8px 24px rgba(0, 109, 224, 0.38)",
            transform: clicked ? "scale(0.97)" : "scale(1)",
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            if (!clicked) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 28px rgba(0, 109, 224, 0.48)";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
            }
          }}
          onMouseLeave={(e) => {
            if (!clicked) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0, 109, 224, 0.38)";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }
          }}
        >
          <Plus size={16} strokeWidth={2.2} />
          + Add Instructor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {instructors.map((inst) => (
          <div
            key={inst.id}
            className="glass-card p-5 flex flex-col gap-3 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/25"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(0, 113, 227, 0.12)",
                  border: "1px solid rgba(0, 113, 227, 0.2)",
                  color: "var(--accent)",
                }}
              >
                <span className="text-[12px] font-bold tracking-tight">{getInitials(inst.name)}</span>
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-tight truncate" style={{ color: "var(--foreground)" }}>
                  {inst.name}
                </p>
                <p className="text-[12px] mt-1 truncate" style={{ color: "rgba(29,29,31,0.55)" }}>
                  {inst.specialization}
                </p>
              </div>
            </div>

            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Schedule
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                {inst.scheduleSummary}
              </p>
            </div>

            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Classes
              </p>

              {inst.groups.length === 0 ? (
                <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.55)" }}>
                  No groups assigned yet
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {inst.groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <p className="truncate" style={{ color: "rgba(29,29,31,0.72)" }}>
                        {group.title}
                      </p>
                      <p className="shrink-0" style={{ color: "rgba(29,29,31,0.55)" }}>
                        {group.capacity > 0
                          ? `${group.enrolledCount}/${group.capacity} (${group.fullnessPercent}%)`
                          : `${group.enrolledCount} students`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentRole === "Director" ? (
              <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                  Payroll Rate
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                  {inst.payrollRateKztPerHour > 0
                    ? `${inst.payrollRateKztPerHour.toLocaleString("ru-KZ")} KZT / hour`
                    : "Not configured"}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
