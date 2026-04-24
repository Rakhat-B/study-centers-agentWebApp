import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { AlertTriangle, BookOpen, Clock3, MapPin, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type RecordLike = Record<string, unknown>;

type GroupRow = RecordLike & {
  rooms?: RecordLike | RecordLike[] | null;
  instructors?: RecordLike | RecordLike[] | null;
};

type CourseRow = RecordLike & {
  groups?: GroupRow[] | null;
};

function readString(source: RecordLike, keys: string[], fallback: string): string {
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

function readNumber(source: RecordLike, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function readRelation(value: unknown): RecordLike | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? (first as RecordLike) : null;
  }

  return typeof value === "object" ? (value as RecordLike) : null;
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildScheduleLabel(group: GroupRow): string {
  const explicitSummary = readString(group, ["schedule_summary"], "");
  if (explicitSummary) {
    return explicitSummary;
  }

  const days = readStringArray(group.days ?? group.week_days);
  const start = readString(group, ["start_time", "start", "starts_at"], "");
  const end = readString(group, ["end_time", "end", "ends_at"], "");

  const dayLabel = days.join(", ");

  if (dayLabel && start && end) {
    return `${dayLabel} • ${start} - ${end}`;
  }

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (dayLabel) {
    return dayLabel;
  }

  return "Schedule not set";
}

export default async function ClassesDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*, groups(*, rooms(*), instructors(*))");

  const courses = ((data ?? []) as CourseRow[]).map((course, index) => ({
    key: readString(course, ["id"], `course-${index + 1}`),
    name: readString(course, ["name", "course_name", "title"], "Untitled Course"),
    groups: Array.isArray(course.groups) ? course.groups : [],
  }));

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Classes
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "rgba(29,29,31,0.48)" }}>
            Live data from Supabase ({courses.length} course{courses.length === 1 ? "" : "s"})
          </p>
        </div>

        <span
          className="live-glow rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            background: "rgba(52, 199, 89, 0.14)",
            border: "1px solid rgba(52, 199, 89, 0.3)",
            color: "rgba(20, 83, 45, 0.92)",
          }}
        >
          Live
        </span>
      </div>

      {error ? (
        <div
          className="glass-card flex items-start gap-3 rounded-2xl p-5"
          style={{ border: "1px solid rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.08)" }}
        >
          <AlertTriangle size={18} className="mt-0.5 text-red-700" />
          <div>
            <p className="text-[14px] font-semibold text-red-900">Could not load classes</p>
            <p className="mt-1 text-[12px] text-red-800/85">{error.message}</p>
          </div>
        </div>
      ) : null}

      {!error && courses.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <BookOpen size={26} className="mx-auto mb-3 text-[rgba(29,29,31,0.45)]" />
          <p className="text-[18px] font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            No courses yet
          </p>
          <p className="mx-auto mt-2 max-w-lg text-[13px]" style={{ color: "rgba(29,29,31,0.58)" }}>
            Once courses and groups are created in Supabase, they will appear here automatically.
          </p>
          <Link
            href="/manage/students"
            className="mt-5 inline-flex rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{
              textDecoration: "none",
              color: "var(--accent)",
              background: "rgba(0, 113, 227, 0.12)",
              border: "1px solid rgba(0, 113, 227, 0.22)",
            }}
          >
            Go to Students
          </Link>
        </div>
      ) : null}

      {!error && courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {courses.map((course) => (
            <section key={course.key} className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-[20px] font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
                  {course.name}
                </h2>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.38)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    color: "rgba(29,29,31,0.6)",
                  }}
                >
                  {course.groups.length} group{course.groups.length === 1 ? "" : "s"}
                </span>
              </div>

              {course.groups.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-4 text-[12px]"
                  style={{ color: "rgba(29,29,31,0.58)", borderColor: "rgba(255,255,255,0.5)" }}
                >
                  No groups available for this course.
                </div>
              ) : (
                <div className="space-y-3">
                  {course.groups.map((group, groupIndex) => {
                    const room = readRelation(group.rooms);
                    const instructor = readRelation(group.instructors);

                    const enrolled = readNumber(
                      group,
                      ["student_count", "students_count", "participants", "enrolled_count"],
                      0,
                    );
                    const capacity = readNumber(group, ["capacity", "max_capacity", "max_participants"], 0);
                    const usage = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

                    const roomName = room
                      ? readString(room, ["name", "room_name", "title"], "Room not set")
                      : readString(group, ["room_name"], "Room not set");
                    const instructorName = instructor
                      ? readString(instructor, ["name", "full_name"], "Instructor not set")
                      : readString(group, ["instructor_name"], "Instructor not set");

                    return (
                      <article
                        key={readString(group, ["id"], `${course.key}-group-${groupIndex + 1}`)}
                        className="rounded-2xl border border-white/40 bg-white/28 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
                            {readString(group, ["name", "title"], `Group ${groupIndex + 1}`)}
                          </h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              background: "rgba(0, 113, 227, 0.12)",
                              color: "var(--accent)",
                              border: "1px solid rgba(0, 113, 227, 0.2)",
                            }}
                          >
                            {usage}% full
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: "rgba(29,29,31,0.6)" }}>
                          <Clock3 size={13} />
                          {buildScheduleLabel(group)}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] md:grid-cols-3">
                          <p className="inline-flex items-center gap-2" style={{ color: "rgba(29,29,31,0.62)" }}>
                            <MapPin size={13} /> {roomName}
                          </p>
                          <p className="inline-flex items-center gap-2" style={{ color: "rgba(29,29,31,0.62)" }}>
                            <UserRound size={13} /> {instructorName}
                          </p>
                          <p className="inline-flex items-center gap-2" style={{ color: "rgba(29,29,31,0.62)" }}>
                            <Users size={13} />
                            {capacity > 0 ? `${enrolled}/${capacity} students` : `${enrolled} students`}
                          </p>
                        </div>

                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${usage}%`,
                              background:
                                usage >= 100
                                  ? "#ef4444"
                                  : usage >= 80
                                    ? "#f59e0b"
                                    : "var(--accent)",
                            }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}