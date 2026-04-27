import { redirect } from "next/navigation";
import type { WhatsAppLead } from "@/components/students/LeadsTable";
import { createClient } from "@/utils/supabase/server";
import StudentsDirectoryClient, {
  type AvailableClassOption,
  type DirectoryStudent,
  type StudentsByStatus,
} from "./StudentsDirectoryClient";

type RecordLike = Record<string, unknown>;

type RawGroupRow = RecordLike & {
  courses?: RecordLike | RecordLike[] | null;
};

type RawGroupStudentRow = RecordLike & {
  groups?: RawGroupRow | RawGroupRow[] | null;
};

type RawStudentRow = RecordLike & {
  gender?: string | null;
  testing_score?: number | string | null;
  internal_notes?: string | null;
  freeze_start?: string | null;
  freeze_end?: string | null;
  interested_course_id?: string | null;
  group_students?: RawGroupStudentRow[] | null;
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

function readCourseNameFromGroup(group: RecordLike): string {
  const rawCourse = readRelations((group as RawGroupRow).courses)[0] ?? null;

  if (!rawCourse) {
    return "";
  }

  return readString(rawCourse, ["name"], "");
}

function readCourseMetaFromGroup(group: RecordLike): { id: string; name: string } {
  const rawCourse = readRelations((group as RawGroupRow).courses)[0] ?? null;

  if (!rawCourse) {
    return { id: "", name: "" };
  }

  return {
    id: readString(rawCourse, ["id"], ""),
    name: readString(rawCourse, ["name"], ""),
  };
}

function extractPrimaryGroup(student: RawStudentRow): {
  groupId?: string;
  groupName?: string;
  courseName?: string;
} {
  if (!Array.isArray(student.group_students)) {
    return {};
  }

  const firstGroup = student.group_students
    .flatMap((groupStudent) => readRelations(groupStudent.groups))
    .find((group) => Boolean(group));

  if (!firstGroup) {
    return {};
  }

  const groupId = readString(firstGroup, ["id"], "");
  const groupName = readString(firstGroup, ["name"], "");
  const courseName = readCourseNameFromGroup(firstGroup);

  return {
    groupId: groupId || undefined,
    groupName: groupName || undefined,
    courseName: courseName || undefined,
  };
}

function mapRawStudents(rawStudents: RawStudentRow[]): StudentsByStatus {
  const studentsByStatus: StudentsByStatus = {
    active: [],
    evaluating: [],
    frozen: [],
    leads: [],
  };

  rawStudents.forEach((student, index) => {
    const id = readString(student, ["id"], `student-${index + 1}`);
    const firstName = readString(student, ["first_name"], "");
    const lastName = readString(student, ["last_name"], "");
    const fullName = `${firstName} ${lastName}`.trim() || readString(student, ["full_name", "name"], "Unnamed Student");
    const phone = readString(student, ["phone"], "No phone");
    const registeredAt = readString(student, ["created_at", "registered_at"], new Date().toISOString());
    const gender = readString(student, ["gender"], "") || "";
    const testingScoreRaw = student.testing_score;
    const parsedTestingScore =
      typeof testingScoreRaw === "number"
        ? testingScoreRaw
        : typeof testingScoreRaw === "string" && testingScoreRaw.trim()
          ? Number(testingScoreRaw)
          : null;
    const testingScore = Number.isFinite(parsedTestingScore) ? parsedTestingScore : null;
    const internalNotes = readString(student, ["internal_notes"], "") || "";
    const courseId = readString(student, ["interested_course_id"], "") || "";
    const freezeStart = readString(student, ["freeze_start"], "") || undefined;
    const freezeEnd = readString(student, ["freeze_end"], "") || undefined;

    const { groupName, courseName } = extractPrimaryGroup(student);
    const course = courseName || readString(student, ["course", "interested_course"], groupName ?? "Unassigned");

    const status = readString(student, ["status"], "lead").toLowerCase();

    if (status === "lead") {
      const lead: WhatsAppLead = {
        id,
        name: fullName,
        phone,
        course,
        gender: gender || undefined,
        lastMessagedAt: registeredAt,
      };

      studentsByStatus.leads.push(lead);
      return;
    }

    if (status === "active" || status === "evaluating" || status === "frozen") {
      const directoryStudent: DirectoryStudent = {
        id,
        name: fullName,
        phone,
        course,
        courseId: courseId || null,
        groupName,
        gender: gender || "",
        pipelineStatus: status,
        testingScore: testingScore || null,
        registeredAt,
        internalNotes: internalNotes || "",
        freezeStart,
        freezeEnd,
      };

      studentsByStatus[status].push(directoryStudent);
    }
  });

  return studentsByStatus;
}

function mapRawGroupsToAvailableClasses(rawGroups: RawGroupRow[]): AvailableClassOption[] {
  if (!rawGroups.length) {
    return [];
  }

  const groupsByCourse = new Map<string, AvailableClassOption>();

  rawGroups.forEach((group, index) => {
    const id = readString(group, ["id"], `group-${index + 1}`);
    const groupName = readString(group, ["name"], `Group ${index + 1}`);
    const { id: courseId, name: courseName } = readCourseMetaFromGroup(group);

    if (!courseId || !courseName) {
      return;
    }

    if (!groupsByCourse.has(courseId)) {
      groupsByCourse.set(courseId, {
        id: courseId,
        name: courseName,
        groups: [],
      });
    }

    groupsByCourse.get(courseId)?.groups.push({
      id,
      name: groupName,
    });
  });

  return Array.from(groupsByCourse.values())
    .sort((courseA, courseB) => courseA.name.localeCompare(courseB.name))
    .map((course) => ({
      ...course,
      groups: [...course.groups].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function buildClientKey(rawStudents: RawStudentRow[], rawGroups: RawGroupRow[]) {
  const studentKey = rawStudents
    .map((student) => {
      const id = readString(student, ["id"], "unknown-student");
      const updatedAt = readString(student, ["updated_at", "created_at"], "");
      return `${id}:${updatedAt}`;
    })
    .join("|");

  const groupKey = rawGroups
    .map((group) => {
      const id = readString(group, ["id"], "unknown-group");
      const updatedAt = readString(group, ["updated_at", "created_at"], "");
      return `${id}:${updatedAt}`;
    })
    .join("|");

  return `${studentKey}__${groupKey}`;
}

export default async function StudentsDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: rawStudents, error: studentsError }, { data: rawGroups, error: groupsError }] = await Promise.all([
    supabase
      .from("students")
      .select("*, interested_course_id, group_students(groups(id, name, courses(id, name)))"),
    supabase
      .from("groups")
      .select("id, name, courses(id, name)"),
  ]);

  if (studentsError) {
    console.error("SUPABASE STUDENTS ERROR:", studentsError);
  }

  if (groupsError) {
    console.error("SUPABASE GROUPS ERROR:", groupsError);
  }

  const studentRows = (rawStudents ?? []) as RawStudentRow[];
  const groupRows = (rawGroups ?? []) as RawGroupRow[];

  const studentsByStatus = mapRawStudents(studentRows);
  const availableClasses = mapRawGroupsToAvailableClasses(groupRows);
  const clientKey = buildClientKey(studentRows, groupRows);

  return (
    <StudentsDirectoryClient
      key={clientKey}
      initialStudentsByStatus={studentsByStatus}
      initialAvailableClasses={availableClasses}
    />
  );
}
