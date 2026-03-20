"use client";

import { Clock, Users } from "lucide-react";
import { getClasses, formatTime, isLive } from "@/data/mock";

export default function TodaysClasses() {
  const classes = getClasses();

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Today&apos;s Classes
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {classes.length} sessions scheduled
          </p>
        </div>
        <Clock size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      {/* Class feed */}
      <div className="flex flex-col gap-2">
        {classes.map((session) => {
          const live = isLive(session);
          return (
            <div
              key={session.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                live ? "live-glow" : ""
              }`}
              style={{
                background: live
                  ? "rgba(52, 199, 89, 0.07)"
                  : "rgba(255,255,255,0.5)",
                border: live
                  ? "1px solid rgba(52, 199, 89, 0.25)"
                  : "1px solid rgba(255,255,255,0.6)",
              }}
            >
              {/* Live badge */}
              <div className="flex-shrink-0 w-8 flex justify-center">
                {live ? (
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(52, 199, 89, 0.15)",
                      color: "rgb(52, 199, 89)",
                      border: "1px solid rgba(52, 199, 89, 0.3)",
                    }}
                  >
                    Live
                  </span>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
                >
                  {session.name}
                </p>
                <p
                  className="text-[11px] truncate mt-0.5"
                  style={{ color: "rgba(29,29,31,0.5)" }}
                >
                  {session.teacher} · {session.room}
                </p>
              </div>

              {/* Time & participants */}
              <div className="flex-shrink-0 text-right">
                <p
                  className="text-[13px] font-semibold tabular-nums"
                  style={{ color: live ? "rgb(52,199,89)" : "var(--foreground)" }}
                  suppressHydrationWarning
                >
                  {session.time ? formatTime(session.time) : "—"}
                </p>
                <div
                  className="flex items-center gap-1 justify-end mt-0.5"
                  style={{ color: "rgba(29,29,31,0.4)" }}
                >
                  <Users size={10} />
                  <span className="text-[11px]">
                    {session.participants}/{session.maxParticipants}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
