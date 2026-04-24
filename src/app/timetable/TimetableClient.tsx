"use client";

import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type CalendarEvent = {
  id: string;
  title: string;
  instructor: string;
  room: string;
  dayIndex: number; // 0=Mon
  startMin: number; // minutes from 00:00
  endMin: number;
  paletteIndex?: number;
};

type TimetableClientProps = {
  initialEvents: CalendarEvent[];
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const eventPalettes = [
  {
    card: "bg-blue-50/95",
    border: "border-blue-200/80",
    accent: "bg-blue-500",
    text: "text-blue-900",
  },
  {
    card: "bg-emerald-50/95",
    border: "border-emerald-200/80",
    accent: "bg-emerald-500",
    text: "text-emerald-900",
  },
  {
    card: "bg-violet-50/95",
    border: "border-violet-200/80",
    accent: "bg-violet-500",
    text: "text-violet-900",
  },
  {
    card: "bg-amber-50/95",
    border: "border-amber-200/80",
    accent: "bg-amber-500",
    text: "text-amber-900",
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

function formatDayNumber(date: Date) {
  return date.getDate();
}

type EventCardProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
};

function EventCard({ event, top, height, isSelected, onClick }: EventCardProps) {
  const palette = typeof event.paletteIndex === "number" ? eventPalettes[event.paletteIndex] : eventPaletteForTitle(event.title);

  return (
    <button
      onClick={onClick}
      className={[
        "group absolute left-2 right-2 rounded-xl border px-3 py-2 text-left transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        "shadow-sm",
        palette.card,
        palette.border,
        isSelected ? "ring-2 ring-blue-500/45 shadow-lg scale-[1.01]" : "",
      ].join(" ")}
      style={{ top, height: Math.max(48, height) }}
    >
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${palette.accent}`} aria-hidden />
      <p className={`pl-2 text-[13px] font-bold leading-tight truncate ${palette.text}`}>{event.title}</p>
      <p className="pl-2 mt-1 text-[11px] text-slate-600 truncate">
        {formatTime(event.startMin)} - {formatTime(event.endMin)} • {event.room}
      </p>
      <p className="pl-2 text-[11px] text-slate-500 truncate">{event.instructor}</p>
    </button>
  );
}

export default function TimetableClient({ initialEvents }: TimetableClientProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [now, setNow] = useState<Date>(() => new Date());

  const startHour = 7;
  const endHour = 23;
  const pxPerMinute = 1.6;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const events = useMemo(() => initialEvents, [initialEvents]);

  const gridHeight = (endHour - startHour) * 60 * pxPerMinute;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowIndicator = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
  const nowTop = (nowMinutes - startHour * 60) * pxPerMinute;
  const rangeLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );
  const nowDayIndex = useMemo(() => {
    const day = now.getDay();
    return day === 0 ? 6 : day - 1;
  }, [now]);
  const weekDates = useMemo(() => days.map((_, idx) => addDays(weekStart, idx)), [weekStart]);
  const hourRows = useMemo(() => Array.from({ length: endHour - startHour + 1 }, (_, idx) => startHour + idx), [startHour, endHour]);
  const halfHourRows = useMemo(() => Array.from({ length: (endHour - startHour) * 2 }, (_, i) => i), [startHour, endHour]);

  function openEditor(event: CalendarEvent) {
    setSelectedEventId(event.id);
  }

  function closeEditor() {
    setSelectedEventId(null);
  }

  return (
    <AppShell>
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm px-4 py-4 md:px-5 md:py-5 mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
              Timetable
            </h1>
            <p className="text-[12px] mt-1 text-slate-500">
              Weekly calendar view - click an event to view details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
              className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <button
              aria-label="Previous week"
              onClick={() => setWeekStart((prev) => addDays(prev, -7))}
              className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Next week"
              onClick={() => setWeekStart((prev) => addDays(prev, 7))}
              className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center">
              {rangeLabel}
            </div>
            <div className="h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              Week
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white/85 shadow-sm">
        <div className="max-h-[76vh] overflow-y-auto">
          <div className="sticky top-0 z-30">
            <div className="grid" style={{ gridTemplateColumns: "88px repeat(7, minmax(145px, 1fr))" }}>
              <div className="sticky left-0 z-30 px-3 py-3 text-[11px] font-semibold text-slate-700 border-r border-slate-200 bg-slate-100/95 backdrop-blur">
                Time
              </div>
              {days.map((day, idx) => {
                const isTodayColumn = idx === nowDayIndex;
                return (
                  <div
                    key={day}
                    className={[
                      "px-3 py-3 border-r border-slate-200/80 relative",
                      idx === 6 ? "border-r-0" : "",
                      isTodayColumn ? "bg-blue-100/95 shadow-[inset_0_-2px_0_0_rgba(59,130,246,0.45)]" : "bg-slate-50/90",
                    ].join(" ")}
                  >
                    <p className={`text-[11px] font-semibold ${isTodayColumn ? "text-blue-700" : "text-slate-500"}`}>{day}</p>
                    <p className={`text-[16px] mt-0.5 font-semibold ${isTodayColumn ? "text-blue-900" : "text-slate-800"}`}>
                      {formatDayNumber(weekDates[idx])}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            {showNowIndicator && nowDayIndex >= 0 ? (
              <div className="absolute pointer-events-none z-20" style={{ left: 88, right: 0, top: nowTop }}>
                <div className="relative">
                  <span className="absolute -left-[78px] -top-3 text-[10px] font-bold uppercase tracking-wide text-red-500">
                    Now
                  </span>
                  <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                  <div className="h-[2px] bg-red-500/90 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
            ) : null}

            <div className="grid" style={{ gridTemplateColumns: "88px repeat(7, minmax(145px, 1fr))" }}>
              <div className="sticky left-0 z-20 border-r border-slate-200 bg-slate-100/90 backdrop-blur relative" style={{ height: gridHeight }}>
                {hourRows.map((hour) => {
                  const top = (hour - startHour) * 60 * pxPerMinute;
                  return (
                    <div key={hour} className="absolute left-0 right-0 px-3" style={{ top: top - 9 }}>
                      <span className="text-[11px] font-semibold text-slate-700">{String(hour).padStart(2, "0")}:00</span>
                    </div>
                  );
                })}
              </div>

              {days.map((_, dayIndex) => {
                const dayEvents = events.filter((event) => event.dayIndex === dayIndex);
                const isTodayColumn = dayIndex === nowDayIndex;

                return (
                  <div
                    key={dayIndex}
                    className={[
                      "relative border-r border-slate-200/80",
                      dayIndex === 6 ? "border-r-0" : "",
                      isTodayColumn
                        ? "bg-blue-50/70 shadow-[inset_1px_0_0_rgba(59,130,246,0.45),inset_-1px_0_0_rgba(59,130,246,0.45)]"
                        : dayIndex % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/45",
                    ].join(" ")}
                    style={{ height: gridHeight }}
                  >
                    {halfHourRows.map((i) => (
                      <div
                        key={i}
                        className={i % 2 === 0 ? "absolute left-0 right-0 border-t border-slate-200/80" : "absolute left-0 right-0 border-t border-slate-100"}
                        style={{ top: i * 30 * pxPerMinute }}
                      />
                    ))}

                    {dayEvents.length === 0 ? (
                      <p className="absolute top-4 left-3 text-[11px] text-slate-400">No classes scheduled</p>
                    ) : null}

                    {dayEvents.map((event) => {
                      const top = (event.startMin - startHour * 60) * pxPerMinute + 3;
                      const height = (event.endMin - event.startMin) * pxPerMinute - 6;
                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          top={top}
                          height={height}
                          isSelected={event.id === selectedEventId}
                          onClick={() => openEditor(event)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close class details"
            className="absolute inset-0 bg-slate-900/35"
            onClick={closeEditor}
          />

          <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-semibold leading-tight text-slate-900">
                  {selectedEvent.title}
                </p>
                <p className="text-[12px] mt-1 text-slate-500">
                  {days[selectedEvent.dayIndex]} class details
                </p>
              </div>
              <button
                onClick={closeEditor}
                className="h-8 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] font-medium"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <UserRound size={13} />
                  Instructor
                </p>
                <p className="text-[13px] mt-1 text-slate-900">{selectedEvent.instructor}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <Clock3 size={13} />
                    Time
                </p>
                <p className="text-[13px] mt-1 text-slate-900">
                  {formatTime(selectedEvent.startMin)} - {formatTime(selectedEvent.endMin)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <MapPin size={13} />
                  Room
                </p>
                <p className="text-[13px] mt-1 text-slate-900">{selectedEvent.room}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <BookOpen size={13} />
                  Subject
                </p>
                <p className="text-[13px] mt-1 text-slate-900">{selectedEvent.title.split(" ")[0]}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => router.push("/manage/classes")}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[13px] font-semibold transition-colors"
              >
                Edit in Classes
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
