"use client";

import AppShell from "@/components/AppShell";
import { mockClassGroups } from "@/data/mock";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function ClassesDirectoryPage() {
  const [clicked, setClicked] = useState(false);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Classes
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Class groups, capacity, and schedules
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
          + Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockClassGroups.map((group) => {
          const ratio = group.maxParticipants === 0 ? 0 : group.participants / group.maxParticipants;
          const isFull = group.participants >= group.maxParticipants;

          return (
          <div
            key={group.id}
            className="glass-card p-5 flex flex-col gap-3 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/25"
          >
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                {group.name}
              </p>
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: isFull ? "rgba(255, 149, 0, 0.14)" : "rgba(0, 113, 227, 0.14)",
                  border: isFull ? "1px solid rgba(255, 149, 0, 0.22)" : "1px solid rgba(0, 113, 227, 0.22)",
                  color: isFull ? "rgba(160, 90, 0, 1)" : "var(--accent)",
                }}
              >
                {group.participants}/{group.maxParticipants}
              </div>
            </div>

            <div
              className="rounded-full overflow-hidden"
              style={{
                height: 6,
                background: "rgba(255,255,255,0.22)",
                border: "1px solid rgba(255,255,255,0.24)",
              }}
              aria-label="Capacity"
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.round(ratio * 100))}%`,
                  background: isFull ? "rgba(255, 149, 0, 0.85)" : "rgba(0, 113, 227, 0.8)",
                }}
              />
            </div>

            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Instructor
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                {group.instructor}
              </p>
            </div>

            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Schedule
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                {group.scheduleSummary}
              </p>
            </div>
          </div>
        );
        })}
      </div>
    </AppShell>
  );
}
