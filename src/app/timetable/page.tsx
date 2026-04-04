"use client";

import AppShell from "@/components/AppShell";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  instructor: string;
  room: string;
  dayIndex: number; // 0=Mon
  startMin: number; // minutes from 00:00
  endMin: number;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minutes(h: number, m: number) {
  return h * 60 + m;
}

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function addDays(date: Date, daysToAdd: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + daysToAdd);
  return d;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const monthStart = weekStart.toLocaleString("en-US", { month: "short" });
  const monthEnd = weekEnd.toLocaleString("en-US", { month: "short" });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekEnd.getFullYear();

  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    return `${monthStart} ${startDay}, ${weekStart.getFullYear()} - ${monthEnd} ${endDay}, ${weekEnd.getFullYear()}`;
  }

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${monthStart} ${startDay} - ${endDay}, ${year}`;
  }

  return `${monthStart} ${startDay} - ${monthEnd} ${endDay}, ${year}`;
}

export default function TimetablePage() {
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [now, setNow] = useState<Date>(() => new Date());

  const startHour = 8;
  const endHour = 22;
  const pxPerMinute = 1; // 60px per hour

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const events: CalendarEvent[] = useMemo(
    () => [
      {
        id: "e1",
        title: "IELTS Advanced-A",
        instructor: "Aizat Bekova",
        room: "A-101",
        dayIndex: 0,
        startMin: minutes(18, 30),
        endMin: minutes(20, 0),
      },
      {
        id: "e2",
        title: "Math Grade 9-B",
        instructor: "Yerlan Seitkali",
        room: "B-204",
        dayIndex: 1,
        startMin: minutes(17, 0),
        endMin: minutes(18, 0),
      },
      {
        id: "e3",
        title: "ENT Physics-C",
        instructor: "Bakyt Omarov",
        room: "C-301",
        dayIndex: 5,
        startMin: minutes(11, 0),
        endMin: minutes(12, 30),
      },
      {
        id: "e4",
        title: "English Conversation-D",
        instructor: "Madina Akhmetova",
        room: "A-103",
        dayIndex: 3,
        startMin: minutes(19, 30),
        endMin: minutes(20, 30),
      },
    ],
    []
  );

  const gridHeight = (endHour - startHour) * 60 * pxPerMinute;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowIndicator = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
  const nowTop = (nowMinutes - startHour * 60) * pxPerMinute;
  const rangeLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Timetable
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Weekly calendar view — click an event to view details
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            className="px-3 py-2 rounded-full text-[12px] font-semibold transition-colors"
            style={{
              background: "rgba(255,255,255,0.28)",
              border: "1px solid rgba(255,255,255,0.42)",
              color: "rgba(29,29,31,0.75)",
              cursor: "pointer",
            }}
          >
            Today
          </button>

          <button
            aria-label="Previous week"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "1px solid rgba(255,255,255,0.38)",
              color: "rgba(29,29,31,0.7)",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <div
            className="px-3 py-2 rounded-full text-[12px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "1px solid rgba(255,255,255,0.38)",
              color: "rgba(29,29,31,0.7)",
              minWidth: 180,
              textAlign: "center",
            }}
          >
            {rangeLabel}
          </div>

          <button
            aria-label="Next week"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "1px solid rgba(255,255,255,0.38)",
              color: "rgba(29,29,31,0.7)",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {selected ? (
        <div className="glass-card p-5 mb-6">
          <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
            {selected.title}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.55)" }}>
            {days[selected.dayIndex]} • {formatTime(selected.startMin)}–{formatTime(selected.endMin)} • {selected.room}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.55)" }}>
            Instructor: {selected.instructor}
          </p>
          <button
            onClick={() => setSelected(null)}
            className="mt-3 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.48)",
              color: "rgba(29,29,31,0.75)",
              cursor: "pointer",
            }}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: "88px repeat(7, minmax(140px, 1fr))" }}>
          <div
            className="px-3 py-2 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,0.14)", color: "rgba(29,29,31,0.55)" }}
          >
            Time
          </div>
          {days.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-[11px] font-semibold"
              style={{ background: "rgba(255,255,255,0.14)", color: "rgba(29,29,31,0.55)" }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="max-h-[72vh] overflow-y-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="relative">
            {showNowIndicator ? (
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowTop, zIndex: 20 }}>
                <div className="relative" style={{ height: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 88 - 4,
                      top: -4,
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: "rgba(255, 59, 48, 0.9)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 88,
                      right: 0,
                      top: 0,
                      height: 1,
                      background: "rgba(255, 59, 48, 0.85)",
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid" style={{ gridTemplateColumns: "88px repeat(7, minmax(140px, 1fr))" }}>
          <div
            className="relative"
            style={{
              height: gridHeight,
              borderRight: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {Array.from({ length: endHour - startHour + 1 }).map((_, idx) => {
              const hour = startHour + idx;
              const top = (hour - startHour) * 60 * pxPerMinute;
              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 px-3"
                  style={{ top: top - 8, color: "rgba(29,29,31,0.5)" }}
                >
                  <span className="text-[10px] font-semibold">{String(hour).padStart(2, "0")}:00</span>
                </div>
              );
            })}
          </div>

          {days.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="relative"
              style={{
                height: gridHeight,
                borderRight: dayIndex === 6 ? "none" : "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              {Array.from({ length: (endHour - startHour) * 2 }).map((__, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    top: i * 30 * pxPerMinute,
                    height: 0,
                    borderTop: "1px solid rgba(255,255,255,0.14)",
                  }}
                />
              ))}

              {events
                .filter((e) => e.dayIndex === dayIndex)
                .map((e) => {
                  const top = (e.startMin - startHour * 60) * pxPerMinute;
                  const height = (e.endMin - e.startMin) * pxPerMinute;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="absolute left-2 right-2 rounded-xl px-2.5 py-2 text-left transition-colors"
                      style={{
                        top,
                        height,
                        background: "rgba(0, 113, 227, 0.16)",
                        border: "1px solid rgba(0, 113, 227, 0.28)",
                        color: "rgba(29,29,31,0.8)",
                        cursor: "pointer",
                      }}
                    >
                      <p className="text-[12px] font-bold leading-tight truncate">{e.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(29,29,31,0.6)" }}>
                        {formatTime(e.startMin)}–{formatTime(e.endMin)} • {e.room}
                      </p>
                    </button>
                  );
                })}
            </div>
          ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
