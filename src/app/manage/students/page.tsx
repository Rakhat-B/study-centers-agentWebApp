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
    leads: [],
  };

  rawStudents.forEach((student, index) => {
    const id = readString(student, ["id"], `student-${index + 1}`);
    const firstName = readString(student, ["first_name"], "");
    const lastName = readString(student, ["last_name"], "");
    const fullName = `${firstName} ${lastName}`.trim() || readString(student, ["full_name", "name"], "Unnamed Student");
    const phone = readString(student, ["phone"], "No phone");
    const registeredAt = readString(student, ["created_at", "registered_at"], new Date().toISOString());

    const { groupName, courseName } = extractPrimaryGroup(student);
    const course = courseName || readString(student, ["course", "interested_course"], groupName ?? "Unassigned");

    const status = readString(student, ["status"], "lead").toLowerCase();

    if (status === "lead") {
      const lead: WhatsAppLead = {
        id,
        name: fullName,
        phone,
        course,
        lastMessagedAt: registeredAt,
      };

      studentsByStatus.leads.push(lead);
      return;
    }

    if (status === "active" || status === "evaluating") {
      const directoryStudent: DirectoryStudent = {
        id,
        name: fullName,
        phone,
        course,
        groupName,
        pipelineStatus: status,
        registeredAt,
        internalNotes: "",
      };

      studentsByStatus[status].push(directoryStudent);
    }
  });

  return studentsByStatus;
}

function mapRawGroupsToAvailableClasses(rawGroups: RawGroupRow[]): AvailableClassOption[] {
  if (!rawGroups.length) {
    return [{ name: "Unassigned", groups: [] }];
  }

  const groupsByCourse = new Map<string, AvailableClassOption["groups"]>();

  rawGroups.forEach((group, index) => {
    const id = readString(group, ["id"], `group-${index + 1}`);
    const groupName = readString(group, ["name"], `Group ${index + 1}`);
    const courseName = readCourseNameFromGroup(group) || "Unassigned";

    if (!groupsByCourse.has(courseName)) {
      groupsByCourse.set(courseName, []);
    }

    groupsByCourse.get(courseName)?.push({
      id,
      name: groupName,
    });
  });

  return Array.from(groupsByCourse.entries())
    .sort(([courseA], [courseB]) => courseA.localeCompare(courseB))
    .map(([name, groups]) => ({
      name,
      groups: [...groups].sort((a, b) => a.name.localeCompare(b.name)),
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
      .select("*, group_students(groups(id, name, courses(name)))"),
    supabase
      .from("groups")
      .select("id, name, courses(name)"),
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
