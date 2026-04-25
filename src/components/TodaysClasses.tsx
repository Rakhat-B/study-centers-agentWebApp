"use client";

import { Clock, Users } from "lucide-react";
import { t } from "@/lib/i18n";
import WidgetTitleLink from "@/components/WidgetTitleLink";
import type { DashboardClassSession } from "@/app/dashboard/DashboardClient";

type TodaysClassesProps = {
  sessions: DashboardClassSession[];
};

function formatTime(value: string): string {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function TodaysClasses({ sessions }: TodaysClassesProps) {

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#classes" title={t("classes.today", "Today's Classes")} />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {sessions.length} {t("classes.sessionsScheduled", "sessions scheduled")}
          </p>
        </div>
        <Clock size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      {/* Class feed */}
      <div className="flex flex-col gap-2">
        {sessions.length === 0 ? (
          <p className="text-[12px]" style={{ color: "rgba(29,29,31,0.5)" }}>
            No classes scheduled for today.
          </p>
        ) : null}
        {sessions.map((session) => {
          const live = session.isLive;
          return (
            <div
              key={session.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                live ? "live-glow" : ""
              }`}
              style={{
                background: live
                  ? "rgba(52, 199, 89, 0.07)"
                  : "rgba(255,255,255,0.2)",
                border: live
                  ? "1px solid rgba(52, 199, 89, 0.25)"
                  : "1px solid rgba(255,255,255,0.3)",
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
                    {t("classes.live", "Live")}
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
