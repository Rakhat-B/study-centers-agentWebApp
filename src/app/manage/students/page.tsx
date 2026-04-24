import { redirect } from "next/navigation";
import type { WhatsAppLead } from "@/components/students/LeadsTable";
import { createClient } from "@/utils/supabase/server";
import StudentsDirectoryClient, {
  type AvailableClassOption,
  type DirectoryStudent,
  type StudentsByStatus,
} from "./StudentsDirectoryClient";

type RecordLike = Record<string, unknown>;

type RawGroupStudentRow = RecordLike & {
  groups?: RecordLike | RecordLike[] | null;
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

function extractGroupNames(student: RawStudentRow): string[] {
  if (!Array.isArray(student.group_students)) {
    return [];
  }

  const groupNames = student.group_students
    .flatMap((groupStudent) => readRelations(groupStudent.groups))
    .map((group) => readString(group, ["name"], ""))
    .filter(Boolean);

  return Array.from(new Set(groupNames));
}

function mapRawStudents(rawStudents: RawStudentRow[]): {
  studentsByStatus: StudentsByStatus;
  availableClasses: AvailableClassOption[];
} {
  const studentsByStatus: StudentsByStatus = {
    active: [],
    evaluating: [],
    leads: [],
  };

  const uniqueGroupNames = new Set<string>();

  rawStudents.forEach((student, index) => {
    const id = readString(student, ["id"], `student-${index + 1}`);
    const firstName = readString(student, ["first_name"], "");
    const lastName = readString(student, ["last_name"], "");
    const fullName = `${firstName} ${lastName}`.trim() || readString(student, ["full_name", "name"], "Unnamed Student");
    const phone = readString(student, ["phone"], "No phone");
    const registeredAt = readString(student, ["created_at", "registered_at"], new Date().toISOString());

    const groupNames = extractGroupNames(student);
    groupNames.forEach((groupName) => uniqueGroupNames.add(groupName));

    const primaryGroupName = groupNames[0];
    const course = primaryGroupName ?? "Unassigned";

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
        groupName: primaryGroupName,
        pipelineStatus: status,
        registeredAt,
        internalNotes: "",
      };

      studentsByStatus[status].push(directoryStudent);
    }
  });

  const sortedGroupNames = Array.from(uniqueGroupNames).sort((a, b) => a.localeCompare(b));

  const availableClasses: AvailableClassOption[] = sortedGroupNames.length
    ? [{ name: "Live Programs", groups: sortedGroupNames }]
    : [{ name: "Unassigned", groups: [] }];

  return {
    studentsByStatus,
    availableClasses,
  };
}

export default async function StudentsDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawStudents, error } = await supabase
    .from("students")
    .select("*, group_students(groups(name))");

  if (error) {
    console.error("SUPABASE STUDENTS ERROR:", error);
  }

  const { studentsByStatus, availableClasses } = mapRawStudents((rawStudents ?? []) as RawStudentRow[]);

  return (
    <StudentsDirectoryClient
      initialStudentsByStatus={studentsByStatus}
      initialAvailableClasses={availableClasses}
    />
  );
}
