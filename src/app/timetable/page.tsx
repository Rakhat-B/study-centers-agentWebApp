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
  paletteIndex?: number;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const eventPalettes = [
  {
    tileBg: "rgba(59, 130, 246, 0.24)",
    tileBorder: "rgba(59, 130, 246, 0.34)",
    stripe: "rgba(37, 99, 235, 0.9)",
  },
  {
    tileBg: "rgba(16, 185, 129, 0.22)",
    tileBorder: "rgba(16, 185, 129, 0.34)",
    stripe: "rgba(5, 150, 105, 0.9)",
  },
  {
    tileBg: "rgba(168, 85, 247, 0.23)",
    tileBorder: "rgba(168, 85, 247, 0.34)",
    stripe: "rgba(147, 51, 234, 0.9)",
  },
  {
    tileBg: "rgba(245, 158, 11, 0.24)",
    tileBorder: "rgba(245, 158, 11, 0.34)",
    stripe: "rgba(217, 119, 6, 0.9)",
  },
];

function minutes(h: number, m: number) {
  return h * 60 + m;
}

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  return h * 60 + m;
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

function eventPaletteForTitle(title: string) {
  const category = title.split(" ")[0] ?? title;
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % eventPalettes.length;
  return eventPalettes[index];
}

export default function TimetablePage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editInstructor, setEditInstructor] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editPaletteIndex, setEditPaletteIndex] = useState<number>(0);
  const [editError, setEditError] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [now, setNow] = useState<Date>(() => new Date());

  const startHour = 0;
  const endHour = 24;
  const pxPerMinute = 840 / ((endHour - startHour) * 60); // keep overall grid height visually similar

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const [events, setEvents] = useState<CalendarEvent[]>([
      {
        id: "e1",
        title: "IELTS Advanced-A",
        instructor: "Aizat Bekova",
        room: "A-101",
        dayIndex: 0,
        startMin: minutes(18, 30),
        endMin: minutes(20, 0),
        paletteIndex: 0,
      },
      {
        id: "e2",
        title: "Math Grade 9-B",
        instructor: "Yerlan Seitkali",
        room: "B-204",
        dayIndex: 1,
        startMin: minutes(17, 0),
        endMin: minutes(18, 0),
        paletteIndex: 1,
      },
      {
        id: "e3",
        title: "ENT Physics-C",
        instructor: "Bakyt Omarov",
        room: "C-301",
        dayIndex: 5,
        startMin: minutes(11, 0),
        endMin: minutes(12, 30),
        paletteIndex: 2,
      },
      {
        id: "e4",
        title: "English Conversation-D",
        instructor: "Madina Akhmetova",
        room: "A-103",
        dayIndex: 3,
        startMin: minutes(19, 30),
        endMin: minutes(20, 30),
        paletteIndex: 3,
      },
    ]);

  const gridHeight = (endHour - startHour) * 60 * pxPerMinute;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowIndicator = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
  const nowTop = (nowMinutes - startHour * 60) * pxPerMinute;
  const rangeLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  function openEditor(event: CalendarEvent) {
    setSelectedEventId(event.id);
    setEditInstructor(event.instructor);
    setEditStartTime(formatTime(event.startMin));
    setEditEndTime(formatTime(event.endMin));
    setEditPaletteIndex(event.paletteIndex ?? 0);
    setEditError(null);
  }

  function closeEditor() {
    setSelectedEventId(null);
    setEditError(null);
  }

  function saveEventChanges() {
    if (!selectedEvent) {
      return;
    }
    const startMin = parseTimeToMinutes(editStartTime);
    const endMin = parseTimeToMinutes(editEndTime);
    if (startMin === null || endMin === null) {
      setEditError("Please enter valid start and end time.");
      return;
    }
    if (startMin < 0 || endMin > 24 * 60 || endMin <= startMin) {
      setEditError("End time must be after start time and within 24 hours.");
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              instructor: editInstructor.trim() || event.instructor,
              startMin,
              endMin,
              paletteIndex: editPaletteIndex,
            }
          : event
      )
    );
    closeEditor();
  }

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
                      background: "rgba(255, 59, 48, 0.55)",
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
              borderRight: "1px solid rgba(29,29,31,0.05)",
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
                borderRight: dayIndex === 6 ? "none" : "1px solid rgba(29,29,31,0.05)",
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
                    borderTop: "1px solid rgba(29,29,31,0.045)",
                  }}
                />
              ))}

              {events
                .filter((e) => e.dayIndex === dayIndex)
                .map((e) => {
                  const top = (e.startMin - startHour * 60) * pxPerMinute;
                  const rawHeight = (e.endMin - e.startMin) * pxPerMinute;
                  const palette = typeof e.paletteIndex === "number" ? eventPalettes[e.paletteIndex] : eventPaletteForTitle(e.title);
                  return (
                    <button
                      key={e.id}
                      onClick={() => openEditor(e)}
                      className="group absolute left-1.5 right-1.5 rounded-[11px] px-3 py-2 text-left transform-gpu transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
                      style={{
                        top: top + 4,
                        height: Math.max(36, rawHeight - 8),
                        background: palette.tileBg,
                        border: "1px solid rgba(0,0,0,0.05)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        color: "rgba(29,29,31,0.8)",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
                        style={{ background: palette.stripe }}
                      />
                      <p className="pl-1 text-[13px] font-semibold leading-tight truncate" style={{ color: "rgba(17,24,39,0.94)" }}>
                        {e.title}
                      </p>
                      <p className="pl-1 text-[10px] mt-0.5 truncate" style={{ color: "rgba(55,65,81,0.72)" }}>
                        {formatTime(e.startMin)}–{formatTime(e.endMin)} • {e.room}
                      </p>
                      <p className="pl-1 text-[10px] truncate" style={{ color: "rgba(55,65,81,0.65)" }}>
                        {e.instructor}
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

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close class editor"
            className="absolute inset-0"
            onClick={closeEditor}
            style={{ background: "rgba(7, 12, 24, 0.34)" }}
          />

          <div
            className="relative w-full max-w-lg rounded-2xl p-5 sm:p-6"
            style={{
              background: eventPalettes[editPaletteIndex].tileBg,
              border: "1px solid rgba(255,255,255,0.52)",
              boxShadow: "0 20px 40px rgba(10, 14, 22, 0.24)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-bold leading-tight" style={{ color: "rgba(17,24,39,0.95)" }}>
                  {selectedEvent.title}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "rgba(31,41,55,0.72)" }}>
                  {days[selectedEvent.dayIndex]} • {selectedEvent.room}
                </p>
              </div>
              <button
                onClick={closeEditor}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.65)",
                  color: "rgba(29,29,31,0.75)",
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-[12px] font-semibold" style={{ color: "rgba(31,41,55,0.8)" }}>
                  Instructor
                </span>
                <input
                  value={editInstructor}
                  onChange={(e) => setEditInstructor(e.target.value)}
                  className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.68)",
                    border: "1px solid rgba(255,255,255,0.78)",
                    color: "rgba(17,24,39,0.95)",
                  }}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(31,41,55,0.8)" }}>
                    Start time
                  </span>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{
                      background: "rgba(255,255,255,0.68)",
                      border: "1px solid rgba(255,255,255,0.78)",
                      color: "rgba(17,24,39,0.95)",
                    }}
                  />
                </label>

                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(31,41,55,0.8)" }}>
                    End time
                  </span>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    style={{
                      background: "rgba(255,255,255,0.68)",
                      border: "1px solid rgba(255,255,255,0.78)",
                      color: "rgba(17,24,39,0.95)",
                    }}
                  />
                </label>
              </div>

              <div>
                <p className="text-[12px] font-semibold" style={{ color: "rgba(31,41,55,0.8)" }}>
                  Class color
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {eventPalettes.map((palette, idx) => (
                    <button
                      key={palette.stripe}
                      onClick={() => setEditPaletteIndex(idx)}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-105"
                      style={{
                        background: palette.stripe,
                        border: editPaletteIndex === idx ? "2px solid rgba(17,24,39,0.75)" : "2px solid rgba(255,255,255,0.7)",
                      }}
                      aria-label={`Set class color ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {editError ? (
                <p className="text-[12px] font-medium" style={{ color: "rgba(185, 28, 28, 0.92)" }}>
                  {editError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeEditor}
                className="px-3.5 py-2 rounded-full text-[12px] font-semibold"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.65)",
                  color: "rgba(29,29,31,0.75)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEventChanges}
                className="px-3.5 py-2 rounded-full text-[12px] font-semibold"
                style={{
                  background: "rgba(17,24,39,0.86)",
                  border: "1px solid rgba(17,24,39,0.9)",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
