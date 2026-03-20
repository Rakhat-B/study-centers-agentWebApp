// Mock data for Study Centers Management OS
// All names are Kazakhstani, currency in KZT

export interface Student {
  id: string;
  name: string;
  phone: string;
  course: string;
  status: "lead" | "active" | "inactive";
  registeredAt: string;
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
    status: "lead",
    registeredAt: "2026-03-20T08:15:00Z",
  },
  {
    id: "s2",
    name: "Zhansaya Beisenova",
    phone: "+7 777 987 6543",
    course: "Mathematics (Grade 9)",
    status: "lead",
    registeredAt: "2026-03-20T09:30:00Z",
  },
  {
    id: "s3",
    name: "Amir Serikbaev",
    phone: "+7 747 456 7890",
    course: "Physics (ENT Track)",
    status: "lead",
    registeredAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "s4",
    name: "Kamila Rakhimova",
    phone: "+7 705 321 0987",
    course: "Kazakh Literature",
    status: "lead",
    registeredAt: "2026-03-20T11:45:00Z",
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
