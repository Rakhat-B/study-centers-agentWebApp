import AppShell from "@/components/AppShell";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TimetableClient, { type CalendarEvent } from "./TimetableClient";

type RecordLike = Record<string, unknown>;

type RawGroupRow = RecordLike & {
  schedule_days?: unknown;
  courses?: RecordLike | RecordLike[] | null;
  rooms?: RecordLike | RecordLike[] | null;
  instructors?: RecordLike | RecordLike[] | null;
};

function readString(source: RecordLike, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function readRelations(value: unknown): RecordLike[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is RecordLike => Boolean(item) && typeof item === "object");
  }

  if (typeof value === "object") {
    return [value as RecordLike];
  }

  return [];
}

function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":");
  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function mapScheduleDayToIndex(dayNumber: number): number | null {
  if (!Number.isInteger(dayNumber)) {
    return null;
  }

  // 1..7 as Mon..Sun from DB schema notes.
  if (dayNumber >= 1 && dayNumber <= 7) {
    return dayNumber - 1;
  }

  // Fallback for JS-style weekdays 0..6 where Sunday=0.
  if (dayNumber >= 0 && dayNumber <= 6) {
    return dayNumber === 0 ? 6 : dayNumber - 1;
  }

  return null;
}

function readScheduleDayIndexes(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const indexes = value
    .map((item) => {
      if (typeof item === "number") {
        return mapScheduleDayToIndex(item);
      }

      if (typeof item === "string") {
        const parsed = Number(item.trim());
        if (Number.isFinite(parsed)) {
          return mapScheduleDayToIndex(parsed);
        }
      }

      return null;
    })
    .filter((item): item is number => item !== null);

  return Array.from(new Set(indexes)).sort((a, b) => a - b);
}

function toPaletteIndex(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) % 4;
}

function mapGroupsToEvents(rawGroups: RawGroupRow[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  rawGroups.forEach((group, groupIndex) => {
    const groupId = readString(group, ["id"], `group-${groupIndex + 1}`);
    const groupName = readString(group, ["name", "title"], `Group ${groupIndex + 1}`);

    const course = readRelations(group.courses)[0] ?? null;
    const room = readRelations(group.rooms)[0] ?? null;
    const instructor = readRelations(group.instructors)[0] ?? null;

    const courseName = course
      ? readString(course, ["name"], "Course")
      : "Course";
    const roomName = room
      ? readString(room, ["name"], "Room not set")
      : "Room not set";
    const instructorName = instructor
      ? readString(instructor, ["full_name", "name"], "Instructor not set")
      : "Instructor not set";

    const startMin = parseTimeToMinutes(readString(group, ["start_time", "start"], ""));
    const endMin = parseTimeToMinutes(readString(group, ["end_time", "end"], ""));

    if (startMin === null || endMin === null || endMin <= startMin) {
      return;
    }

    const dayIndexes = readScheduleDayIndexes(group.schedule_days);

    dayIndexes.forEach((dayIndex) => {
      events.push({
        id: `${groupId}-${dayIndex}`,
        title: `${courseName} - ${groupName}`,
        instructor: instructorName,
        room: roomName,
        dayIndex,
        startMin,
        endMin,
        paletteIndex: toPaletteIndex(courseName),
      });
    });
  });

  return events;
}

export default async function TimetablePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawGroups, error } = await supabase
    .from("groups")
    .select("*, courses(name), rooms(name), instructors(full_name)");

  if (error) {
    return (
      <AppShell>
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Timetable
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "rgba(29,29,31,0.45)" }}>
            Weekly calendar view
          </p>
        </div>

        <div
          className="glass-card flex items-start gap-3 rounded-2xl p-5"
          style={{ border: "1px solid rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.08)" }}
        >
          <AlertTriangle size={18} className="mt-0.5 text-red-700" />
          <div>
            <p className="text-[14px] font-semibold text-red-900">Could not load timetable</p>
            <p className="mt-1 text-[12px] text-red-800/85">{error.message}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const events = mapGroupsToEvents((rawGroups ?? []) as RawGroupRow[]);

  return <TimetableClient initialEvents={events} />;
}
