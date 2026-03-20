"use client";

import { UserPlus, Phone, BookOpen } from "lucide-react";
import { mockStudentLeads } from "@/data/mock";
import { useState } from "react";

export default function PendingRegistration() {
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleQuickAdd = (id: string) => {
    setAdded((prev) => new Set([...prev, id]));
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Pending Registration
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {mockStudentLeads.length} new leads today
          </p>
        </div>
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
          style={{
            background: "rgba(0, 113, 227, 0.12)",
            color: "var(--accent)",
          }}
        >
          {mockStudentLeads.length}
        </div>
      </div>

      {/* Leads list */}
      <div className="flex flex-col gap-2">
        {mockStudentLeads.map((student) => {
          const isAdded = added.has(student.id);
          return (
            <div
              key={student.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.6)",
                opacity: isAdded ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* Avatar initials */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                style={{
                  background: "linear-gradient(135deg, #0071e3 0%, #34aadc 100%)",
                  color: "white",
                }}
              >
                {student.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
                >
                  {student.name}
                </p>
                <div
                  className="flex items-center gap-2 mt-0.5"
                  style={{ color: "rgba(29,29,31,0.45)" }}
                >
                  <div className="flex items-center gap-1">
                    <Phone size={9} />
                    <span className="text-[11px]">{student.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5" style={{ color: "rgba(29,29,31,0.4)" }}>
                  <BookOpen size={9} />
                  <span className="text-[11px] truncate">{student.course}</span>
                </div>
              </div>

              {/* Quick Add button */}
              <button
                onClick={() => handleQuickAdd(student.id)}
                disabled={isAdded}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
                style={{
                  background: isAdded
                    ? "rgba(52, 199, 89, 0.12)"
                    : "rgba(0, 113, 227, 0.1)",
                  color: isAdded ? "rgb(52, 199, 89)" : "var(--accent)",
                  border: isAdded
                    ? "1px solid rgba(52,199,89,0.2)"
                    : "1px solid rgba(0,113,227,0.2)",
                  cursor: isAdded ? "default" : "pointer",
                }}
              >
                <UserPlus size={11} />
                {isAdded ? "Added" : "Quick Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
