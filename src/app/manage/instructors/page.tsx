import AppShell from "@/components/AppShell";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InstructorsDirectoryClient, {
  type InstructorDirectoryItem,
  type InstructorTeachingGroup,
} from "./InstructorsDirectoryClient";

type RecordLike = Record<string, unknown>;

type RawGroupRow = RecordLike & {
  group_students?: RecordLike[] | null;
};

type RawInstructorRow = RecordLike & {
  groups?: RawGroupRow[] | null;
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

function readNumber(source: RecordLike, keys: string[], fallback = 0): number {
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

function mapRawInstructors(rawInstructors: RawInstructorRow[]): InstructorDirectoryItem[] {
  return rawInstructors.map((instructor, instructorIndex) => {
    const rawGroups = readRelations(instructor.groups);

    const groups: InstructorTeachingGroup[] = rawGroups.map((group, groupIndex) => {
      const groupStudents = readRelations(group.group_students);
      const enrolledFromJoinCount = groupStudents.length > 0
        ? readNumber(groupStudents[0], ["count"], 0)
        : 0;

      const enrolledCount = readNumber(
        group,
        ["student_count", "students_count", "participants", "enrolled_count"],
        enrolledFromJoinCount,
      );
      const capacity = readNumber(group, ["capacity", "max_capacity", "max_participants"], 0);
      const fullnessPercent = capacity > 0 ? Math.min(100, Math.round((enrolledCount / capacity) * 100)) : 0;

      return {
        id: readString(group, ["id"], `group-${instructorIndex + 1}-${groupIndex + 1}`),
        title: readString(group, ["name", "title"], `Group ${groupIndex + 1}`),
        capacity,
        enrolledCount,
        fullnessPercent,
      };
    });

    const scheduleSummary =
      groups.length === 0
        ? "No classes assigned yet"
        : groups.length <= 2
          ? groups.map((group) => group.title).join(" • ")
          : `${groups[0].title} • ${groups[1].title} +${groups.length - 2} more`;

    return {
      id: readString(instructor, ["id"], `instructor-${instructorIndex + 1}`),
      name: readString(instructor, ["full_name", "name"], "Unnamed Instructor"),
      specialization: readString(instructor, ["subject", "specialization"], "General Studies"),
      scheduleSummary,
      payrollRateKztPerHour: readNumber(
        instructor,
        ["payroll_rate_kzt_per_hour", "hourly_rate_kzt", "payroll_rate"],
        0,
      ),
      groups,
    };
  });
}

export default async function InstructorsDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawInstructors, error } = await supabase
    .from("instructors")
    .select("*, groups(id, name, capacity, group_students(count))");

  if (error) {
    return (
      <AppShell>
        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Instructors
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "rgba(29,29,31,0.45)" }}>
            Specializations, schedules, and payroll rates
          </p>
        </div>

        <div
          className="glass-card flex items-start gap-3 rounded-2xl p-5"
          style={{ border: "1px solid rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.08)" }}
        >
          <AlertTriangle size={18} className="mt-0.5 text-red-700" />
          <div>
            <p className="text-[14px] font-semibold text-red-900">Could not load instructors</p>
            <p className="mt-1 text-[12px] text-red-800/85">{error.message}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const instructors = mapRawInstructors((rawInstructors ?? []) as RawInstructorRow[]);

  return <InstructorsDirectoryClient instructors={instructors} />;
}
