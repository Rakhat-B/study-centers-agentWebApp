import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardClient, { type DashboardData, type DashboardStats } from "./DashboardClient";

type RecordLike = Record<string, unknown>;

type RawGroupRow = RecordLike & {
  schedule_days?: unknown;
  courses?: RecordLike | RecordLike[] | null;
  rooms?: RecordLike | RecordLike[] | null;
  instructors?: RecordLike | RecordLike[] | null;
  group_students?: RecordLike[] | null;
};

type RawStudentRow = RecordLike & {
  group_students?: RecordLike[] | null;
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
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is RecordLike => Boolean(item) && typeof item === "object");
  }
  if (typeof value === "object") {
    return [value as RecordLike];
  }
  return [];
}

function readRawDayNumbers(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "number" ? item : Number(String(item).trim())))
      .filter((item) => Number.isInteger(item));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item));
  }

  return [];
}

function getTodayDbDayCandidates(now: Date): number[] {
  // DB uses either 1..7 (Mon..Sun) or 0..6 (Sun..Sat).
  const jsDay = now.getDay();
  const oneToSeven = jsDay === 0 ? 7 : jsDay;
  return [oneToSeven, jsDay];
}

function parseTimeToMinutes(value: string): number | null {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

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

function formatCompactKZT(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildFullName(source: RecordLike): string {
  const firstName = readString(source, ["first_name"], "");
  const lastName = readString(source, ["last_name"], "");
  return `${firstName} ${lastName}`.trim() || readString(source, ["full_name", "name"], "Unnamed");
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    activeStudentsResult,
    leadsResult,
    totalGroupsResult,
    totalStudentsResult,
    rawStudentsResult,
    rawGroupsResult,
    rawPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "lead"),
    supabase
      .from("groups")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("id, first_name, last_name, full_name, name, phone, status, created_at, group_students(groups(name, courses(name)))")
      .in("status", ["lead", "evaluating", "active"])
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("groups")
      .select("id, name, start_time, end_time, schedule_days, capacity, courses(name), rooms(name), instructors(full_name), group_students(count)"),
    supabase
      .from("payments")
      .select("*")
      .limit(30),
  ]);

  if (activeStudentsResult.error || leadsResult.error || totalGroupsResult.error || totalStudentsResult.error) {
    console.error("SUPABASE DASHBOARD METRICS ERROR", {
      activeStudentsError: activeStudentsResult.error,
      leadsError: leadsResult.error,
      totalGroupsError: totalGroupsResult.error,
      totalStudentsError: totalStudentsResult.error,
    });
  }

  if (rawStudentsResult.error || rawGroupsResult.error || rawPaymentsResult.error) {
    console.error("SUPABASE DASHBOARD WIDGETS ERROR", {
      studentsError: rawStudentsResult.error,
      groupsError: rawGroupsResult.error,
      paymentsError: rawPaymentsResult.error,
    });
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDayCandidates = getTodayDbDayCandidates(now);
  const rawGroups = (rawGroupsResult.data ?? []) as RawGroupRow[];
  const rawStudents = (rawStudentsResult.data ?? []) as RawStudentRow[];
  const rawPayments = ((rawPaymentsResult.data ?? []) as RecordLike[]).slice();

  const todaysClasses = rawGroups
    .filter((group) => {
      const dayNumbers = readRawDayNumbers(group.schedule_days);
      return dayNumbers.some((day) => todayDayCandidates.includes(day));
    })
    .map((group, index) => {
      const groupStudents = readRelations(group.group_students);
      const relationCount = groupStudents.length > 0 ? readNumber(groupStudents[0], ["count"], 0) : 0;
      const participants = readNumber(group, ["student_count", "students_count", "participants", "enrolled_count"], relationCount);
      const maxParticipants = readNumber(group, ["capacity", "max_capacity", "max_participants"], 0);
      const startTime = readString(group, ["start_time", "start"], "");
      const endTime = readString(group, ["end_time", "end"], "");
      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);
      const isLive =
        startMinutes !== null &&
        endMinutes !== null &&
        nowMinutes >= startMinutes - 30 &&
        nowMinutes <= endMinutes;

      const course = readRelations(group.courses)[0] ?? null;
      const room = readRelations(group.rooms)[0] ?? null;
      const instructor = readRelations(group.instructors)[0] ?? null;

      return {
        id: readString(group, ["id"], `class-${index + 1}`),
        name: course ? readString(course, ["name"], "Untitled Class") : readString(group, ["name"], "Untitled Class"),
        teacher: instructor
          ? readString(instructor, ["full_name", "name"], "Instructor not set")
          : "Instructor not set",
        room: room ? readString(room, ["name"], "Room not set") : "Room not set",
        time: startTime,
        participants,
        maxParticipants,
        isLive,
      };
    })
    .sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.time) ?? Number.MAX_SAFE_INTEGER;
      const bMinutes = parseTimeToMinutes(b.time) ?? Number.MAX_SAFE_INTEGER;
      return aMinutes - bMinutes;
    });

  const pendingLeads = rawStudents.map((student, index) => {
    const groups = Array.isArray(student.group_students) ? student.group_students : [];
    const firstGroupJoin = readRelations(groups[0])[0] ?? null;
    const groupFromJoin = firstGroupJoin ? readRelations(firstGroupJoin.groups)[0] ?? null : null;
    const groupCourse = groupFromJoin ? readRelations(groupFromJoin.courses)[0] ?? null : null;
    const statusRaw = readString(student, ["status"], "lead").toLowerCase();
    const pipelineStatus = statusRaw === "active" || statusRaw === "evaluating" ? statusRaw : "lead";

    return {
      id: readString(student, ["id"], `lead-${index + 1}`),
      name: buildFullName(student),
      phone: readString(student, ["phone"], "No phone"),
      course: groupCourse
        ? readString(groupCourse, ["name"], "Unassigned")
        : groupFromJoin
          ? readString(groupFromJoin, ["name"], "Unassigned")
          : "Unassigned",
      pipelineStatus,
      createdAt: readString(student, ["created_at"], ""),
    };
  });

  const sortedLeadRows = pendingLeads
    .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""))
    .slice(0, 5)
    .map(({ createdAt: _createdAt, ...lead }) => lead);

  rawPayments.sort((a, b) => {
    const left = Date.parse(readString(a, ["created_at", "createdAt", "date"], ""));
    const right = Date.parse(readString(b, ["created_at", "createdAt", "date"], ""));
    return right - left;
  });

  const recentPayments = rawPayments.slice(0, 5).map((payment, index) => {
    const status = readString(payment, ["kaspi_status", "payment_status", "status"], "pending").toLowerCase();
    const normalizedStatus = status === "paid" || status === "failed" ? status : "pending";
    const studentName =
      buildFullName(payment) ||
      readString(payment, ["student_name", "full_name", "customer_name"], "Unknown Student");

    return {
      id: readString(payment, ["id"], `payment-${index + 1}`),
      studentName,
      amount: readNumber(payment, ["amount", "amount_kzt", "sum"], 0),
      course: readString(payment, ["course_name", "course", "description"], "General tuition"),
      kaspiStatus: normalizedStatus,
    };
  });

  const paymentAlerts = rawPayments
    .map((payment, index) => {
      const dueAtRaw = readString(payment, ["due_at", "due_date", "deadline_at"], "");
      const dueAtTs = Date.parse(dueAtRaw);
      const status = readString(payment, ["kaspi_status", "payment_status", "status"], "pending").toLowerCase();

      if (!Number.isFinite(dueAtTs) || status === "paid") {
        return null;
      }

      const diffHours = Math.round((dueAtTs - now.getTime()) / (1000 * 60 * 60));
      if (diffHours < 0 || diffHours > 48) {
        return null;
      }

      const studentName =
        buildFullName(payment) ||
        readString(payment, ["student_name", "full_name", "customer_name"], "Unknown Student");

      return {
        id: readString(payment, ["id"], `alert-${index + 1}`),
        studentName,
        course: readString(payment, ["course_name", "course", "description"], "General tuition"),
        dueInHours: diffHours,
        amount: readNumber(payment, ["amount", "amount_kzt", "sum"], 0),
      };
    })
    .filter((alert): alert is NonNullable<typeof alert> => Boolean(alert))
    .sort((a, b) => a.dueInHours - b.dueInHours)
    .slice(0, 4);

  const instructorSchedule = todaysClasses.slice(0, 6).map((session) => ({
    id: session.id,
    className: session.name,
    time: session.time ? `${formatTime(session.time)}${session.isLive ? " (Live)" : ""}` : "Time not set",
    room: session.room,
  }));

  const totalTodayParticipants = todaysClasses.reduce((sum, session) => sum + session.participants, 0);
  const totalTodayCapacity = todaysClasses.reduce((sum, session) => sum + session.maxParticipants, 0);
  const estimatedAbsent = Math.max(totalTodayCapacity - totalTodayParticipants, 0);

  const attendanceSummary = [
    { label: "Present", value: totalTodayParticipants },
    { label: "Late", value: 0 },
    { label: "Absent", value: estimatedAbsent },
  ];

  const totalEnrolled = rawGroups.reduce((sum, group) => {
    const groupStudents = readRelations(group.group_students);
    const relationCount = groupStudents.length > 0 ? readNumber(groupStudents[0], ["count"], 0) : 0;
    return sum + readNumber(group, ["student_count", "students_count", "participants", "enrolled_count"], relationCount);
  }, 0);
  const totalCapacity = rawGroups.reduce(
    (sum, group) => sum + readNumber(group, ["capacity", "max_capacity", "max_participants"], 0),
    0,
  );

  const paidRevenueThisWeek = rawPayments.reduce((sum, payment) => {
    const createdAt = Date.parse(readString(payment, ["created_at", "createdAt", "date"], ""));
    const daysDiff = (now.getTime() - createdAt) / (1000 * 60 * 60 * 24);
    const status = readString(payment, ["kaspi_status", "payment_status", "status"], "pending").toLowerCase();
    if (Number.isFinite(createdAt) && daysDiff <= 7 && daysDiff >= 0 && status === "paid") {
      return sum + readNumber(payment, ["amount", "amount_kzt", "sum"], 0);
    }
    return sum;
  }, 0);

  const attendanceRate =
    totalTodayParticipants + estimatedAbsent > 0
      ? Math.round((totalTodayParticipants / (totalTodayParticipants + estimatedAbsent)) * 100)
      : 0;
  const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const centerInsights = [
    {
      id: "attendance",
      label: "Daily Attendance",
      value: `${attendanceRate}%`,
      trend: "Live",
      trendType: "stable" as const,
    },
    {
      id: "revenue",
      label: "Revenue This Week",
      value: paidRevenueThisWeek > 0 ? formatCompactKZT(paidRevenueThisWeek) : "N/A",
      trend: "From paid transactions",
      trendType: "stable" as const,
    },
    {
      id: "students",
      label: "Student Count",
      value: String(totalStudentsResult.count ?? 0),
      trend: "Live",
      trendType: "stable" as const,
    },
    {
      id: "fill-rate",
      label: "Course Fill Rate",
      value: `${fillRate}%`,
      trend: "Based on group capacity",
      trendType: "stable" as const,
    },
  ];

  const stats: DashboardStats = {
    activeStudents: activeStudentsResult.count ?? 0,
    leadStudents: leadsResult.count ?? 0,
    totalGroups: totalGroupsResult.count ?? 0,
  };

  const data: DashboardData = {
    classes: todaysClasses,
    pendingLeads: sortedLeadRows,
    recentPayments,
    centerInsights,
    paymentAlerts,
    instructorSchedule,
    attendanceSummary,
  };

  return <DashboardClient stats={stats} data={data} />;
}
