// Mock data for Study Centers Management OS
// All names are Kazakhstani, currency in KZT

export interface Student {
  id: string;
  name: string;
  phone: string;
  course: string;
  groupName?: string;
  gender?: "male" | "female" | "other";
  pipelineStatus: "lead" | "evaluating" | "active";
  evaluationProgress?: string;
  testingScore?: number;
  freezeStart?: string;
  freezeEnd?: string;
  registeredAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  instructor: string;
  participants: number;
  maxParticipants: number;
  scheduleSummary: string;
}

export interface InstructorProfile {
  id: string;
  name: string;
  specialization: string;
  scheduleSummary: string;
  payrollRateKztPerHour: number;
}

export interface ClassSession {
  id: string;
  name: string;
  teacher: string;
  /** Offset in minutes from "now" when getClasses() is called */
  offsetMin: number;
  durationMin: number;
  room: string;
  participants: number;
  maxParticipants: number;
  /** Resolved HH:MM — set by getClasses() */
  time?: string;
}

export interface Transaction {
  id: string;
  studentName: string;
  amount: number; // KZT
  course: string;
  date: string;
  kaspiStatus: "paid" | "pending" | "failed";
}

export interface PayrollPreview {
  id: string;
  teacher: string;
  hours: number;
  groupCount: number;
  amount: number;
}

export interface CenterInsight {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendType: "up" | "down" | "stable";
}

export interface PaymentAlert {
  id: string;
  studentName: string;
  course: string;
  dueInHours: number;
  amount: number;
}

export type ClassCatalogItem = {
  name: string;
  groups: string[];
};

export const CLASSES_DATA: ClassCatalogItem[] = [
  { name: "IELTS Preparation", groups: ["Group A", "Group B", "Evening Group"] },
  { name: "Mathematics (Grade 9)", groups: ["Group A", "Group B", "Weekend Group"] },
  { name: "Physics (ENT Track)", groups: ["Group C", "Group D", "Intensive Group"] },
  { name: "Kazakh Literature", groups: ["Group A", "Group B"] },
  { name: "English Conversation", groups: ["Group D", "Evening Group", "Speaking Club"] },
];

export function GET_AVAILABLE_CLASSES(): ClassCatalogItem[] {
  return CLASSES_DATA.map((item) => ({
    name: item.name,
    groups: [...item.groups],
  }));
}

const pad = (n: number) => String(n).padStart(2, "0");

const rawClasses: Omit<ClassSession, "time">[] = [
  {
    id: "c1",
    name: "IELTS Preparation",
    teacher: "Aizat Bekova",
    offsetMin: 20,
    durationMin: 90,
    room: "A-101",
    participants: 12,
    maxParticipants: 15,
  },
  {
    id: "c2",
    name: "Mathematics (Grade 9)",
    teacher: "Yerlan Seitkali",
    offsetMin: -10,
    durationMin: 60,
    room: "B-204",
    participants: 8,
    maxParticipants: 10,
  },
  {
    id: "c3",
    name: "Kazakh Literature",
    teacher: "Ainur Dosanova",
    offsetMin: 75,
    durationMin: 60,
    room: "A-102",
    participants: 10,
    maxParticipants: 12,
  },
  {
    id: "c4",
    name: "Physics (ENT Track)",
    teacher: "Bakyt Omarov",
    offsetMin: 140,
    durationMin: 90,
    room: "C-301",
    participants: 14,
    maxParticipants: 15,
  },
  {
    id: "c5",
    name: "English Conversation",
    teacher: "Madina Akhmetova",
    offsetMin: 200,
    durationMin: 60,
    room: "A-103",
    participants: 6,
    maxParticipants: 8,
  },
];

/** Call on the client to get classes with resolved times. */
export function getClasses(): ClassSession[] {
  const now = new Date();
  return rawClasses.map((c) => {
    const d = new Date(now.getTime() + c.offsetMin * 60000);
    return { ...c, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
  });
}

export const mockStudentLeads: Student[] = [
  {
    id: "s1",
    name: "Daulet Nurmagambetov",
    phone: "+7 701 234 5678",
    course: "IELTS Preparation",
    groupName: "Group A",
    gender: "male",
    pipelineStatus: "lead",
    registeredAt: "2026-03-20T08:15:00Z",
  },
  {
    id: "s2",
    name: "Zhansaya Beisenova",
    phone: "+7 777 987 6543",
    course: "Mathematics (Grade 9)",
    groupName: "Group B",
    gender: "female",
    pipelineStatus: "evaluating",
    testingScore: 72,
    evaluationProgress: "Placement test: 72%",
    registeredAt: "2026-03-20T09:30:00Z",
  },
  {
    id: "s3",
    name: "Amir Serikbaev",
    phone: "+7 747 456 7890",
    course: "Physics (ENT Track)",
    groupName: "Group C",
    gender: "male",
    pipelineStatus: "active",
    freezeStart: "2026-04-01",
    freezeEnd: "2026-05-10",
    registeredAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "s4",
    name: "Kamila Rakhimova",
    phone: "+7 705 321 0987",
    course: "Kazakh Literature",
    groupName: "Group A",
    gender: "female",
    pipelineStatus: "lead",
    registeredAt: "2026-03-20T11:45:00Z",
  },
];

export const mockStudentsDirectory: Student[] = [
  ...mockStudentLeads,
  {
    id: "s5",
    name: "Aruzhan Kairat",
    phone: "+7 702 111 2233",
    course: "English Conversation",
    groupName: "Group D",
    gender: "female",
    pipelineStatus: "evaluating",
    testingScore: 54,
    evaluationProgress: "Interview pending",
    registeredAt: "2026-03-18T12:20:00Z",
  },
  {
    id: "s6",
    name: "Nurzhan Kasymov",
    phone: "+7 775 333 4455",
    course: "IELTS Preparation",
    groupName: "Group A",
    gender: "male",
    pipelineStatus: "active",
    freezeStart: "2026-04-10",
    freezeEnd: "2026-04-20",
    registeredAt: "2026-02-25T08:00:00Z",
  },
  {
    id: "s7",
    name: "Saltanat Yessimova",
    phone: "+7 707 888 9900",
    course: "Mathematics (Grade 9)",
    groupName: "Group C",
    gender: "female",
    pipelineStatus: "lead",
    registeredAt: "2026-03-29T15:10:00Z",
  },
];

export const mockClassGroups: ClassGroup[] = [
  {
    id: "g1",
    name: "IELTS Advanced-A",
    instructor: "Aizat Bekova",
    participants: 12,
    maxParticipants: 15,
    scheduleSummary: "Mon/Wed/Fri • 18:30",
  },
  {
    id: "g2",
    name: "Math Grade 9-B",
    instructor: "Yerlan Seitkali",
    participants: 8,
    maxParticipants: 10,
    scheduleSummary: "Tue/Thu • 17:00",
  },
  {
    id: "g3",
    name: "ENT Physics-C",
    instructor: "Bakyt Omarov",
    participants: 14,
    maxParticipants: 15,
    scheduleSummary: "Sat • 11:00",
  },
  {
    id: "g4",
    name: "English Conversation-D",
    instructor: "Madina Akhmetova",
    participants: 6,
    maxParticipants: 8,
    scheduleSummary: "Mon/Thu • 19:30",
  },
];

export const mockInstructors: InstructorProfile[] = [
  {
    id: "i1",
    name: "Aizat Bekova",
    specialization: "IELTS / Academic English",
    scheduleSummary: "3 groups • evenings",
    payrollRateKztPerHour: 9000,
  },
  {
    id: "i2",
    name: "Yerlan Seitkali",
    specialization: "Mathematics (Grades 7–11)",
    scheduleSummary: "2 groups • Tue/Thu",
    payrollRateKztPerHour: 8500,
  },
  {
    id: "i3",
    name: "Bakyt Omarov",
    specialization: "Physics (ENT Track)",
    scheduleSummary: "1 group • weekend",
    payrollRateKztPerHour: 9500,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "t1",
    studentName: "Nurzhan Kasymov",
    amount: 35000,
    course: "IELTS Preparation",
    date: "2026-03-20T07:00:00Z",
    kaspiStatus: "paid",
  },
  {
    id: "t2",
    studentName: "Aliya Smagulova",
    amount: 28000,
    course: "Mathematics (Grade 9)",
    date: "2026-03-19T18:30:00Z",
    kaspiStatus: "paid",
  },
  {
    id: "t3",
    studentName: "Temirlan Abdrakhmanov",
    amount: 42000,
    course: "Physics (ENT Track)",
    date: "2026-03-19T15:00:00Z",
    kaspiStatus: "pending",
  },
  {
    id: "t4",
    studentName: "Saltanat Yessimova",
    amount: 28000,
    course: "English Conversation",
    date: "2026-03-18T12:00:00Z",
    kaspiStatus: "failed",
  },
  {
    id: "t5",
    studentName: "Arman Bekzhanov",
    amount: 35000,
    course: "IELTS Preparation",
    date: "2026-03-18T09:00:00Z",
    kaspiStatus: "paid",
  },
];

export const mockPayrollUpcoming: PayrollPreview[] = [
  {
    id: "p1",
    teacher: "Aizat Bekova",
    hours: 18,
    groupCount: 3,
    amount: 162000,
  },
  {
    id: "p2",
    teacher: "Yerlan Seitkali",
    hours: 14,
    groupCount: 2,
    amount: 119000,
  },
  {
    id: "p3",
    teacher: "Ainur Dosanova",
    hours: 16,
    groupCount: 3,
    amount: 138000,
  },
];

export const mockCenterInsights: CenterInsight[] = [
  {
    id: "i1",
    label: "Daily Attendance",
    value: "92%",
    trend: "+2%",
    trendType: "up",
  },
  {
    id: "i2",
    label: "Revenue This Week",
    value: "450 000 KZT",
    trend: "+4.8%",
    trendType: "up",
  },
  {
    id: "i3",
    label: "Student Count",
    value: "142",
    trend: "Stable",
    trendType: "stable",
  },
  {
    id: "i4",
    label: "Course Fill Rate",
    value: "87%",
    trend: "-1%",
    trendType: "down",
  },
];

export const mockPaymentAlerts: PaymentAlert[] = [
  {
    id: "a1",
    studentName: "Madiyar Sarsembay",
    course: "IELTS Preparation",
    dueInHours: 20,
    amount: 35000,
  },
  {
    id: "a2",
    studentName: "Aruzhan Kairat",
    course: "Physics (ENT Track)",
    dueInHours: 34,
    amount: 42000,
  },
  {
    id: "a3",
    studentName: "Adilet Mukanov",
    course: "Mathematics (Grade 9)",
    dueInHours: 45,
    amount: 28000,
  },
];

/** Format HH:MM string to 12-hour display. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${pad(m)} ${period}`;
}

/** Check if a class is live (starts in <=30 min or currently in progress). */
export function isLive(session: ClassSession): boolean {
  return session.offsetMin <= 30 && session.offsetMin > -session.durationMin;
}

/** Format KZT currency. */
export function formatKZT(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}
