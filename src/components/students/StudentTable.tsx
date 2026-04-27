"use client";

import Link from "next/link";
import { ArrowUpDown, MessageCircle, MoreHorizontal, PartyPopper, Pencil, Snowflake, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Student } from "@/data/mock";

const pipelineStyles: Record<Student["pipelineStatus"], { label: string; className: string }> = {
  active: {
    label: "Active (Registered)",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  evaluating: {
    label: "Evaluating",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  lead: {
    label: "Lead",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  frozen: {
    label: "Frozen",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
};

type StudentTableProps = {
  students: Student[];
  onEdit: (studentId: string) => void;
  onFreeze: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  showProgressColumn?: boolean;
};

type SortKey = "name" | "group" | "dateAdded";
type SortDirection = "asc" | "desc";

type MenuState = {
  studentId: string;
  x: number;
  y: number;
  openUp: boolean;
};

function toWhatsAppLink(phone: string) {
  const normalized = phone.replace(/\D/g, "");
  return `https://wa.me/${normalized}`;
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseDateOnly(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getFreezeState(freezeStart?: string, freezeEnd?: string) {
  if (!freezeStart || !freezeEnd) {
    return { state: "none" as const };
  }

  const start = parseDateOnly(freezeStart);
  const end = parseDateOnly(freezeEnd);
  if (!start || !end) {
    return { state: "none" as const };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (end < todayStart) {
    return { state: "none" as const };
  }

  if (start > todayStart) {
    return { state: "upcoming" as const, startLabel: formatDate(freezeStart) };
  }

  return { state: "active" as const, endLabel: formatDate(freezeEnd) };
}

export default function StudentTable({
  students,
  onEdit,
  onFreeze,
  onDelete,
  showProgressColumn = false,
}: StudentTableProps) {
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const hasRows = useMemo(() => students.length > 0, [students.length]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuState(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuState(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const sortedStudents = useMemo(() => {
    if (!sortKey || !sortDirection) return students;

    const sorted = [...students];
    sorted.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * direction;
      }

      if (sortKey === "group") {
        const ag = `${a.course} ${a.groupName ?? ""}`;
        const bg = `${b.course} ${b.groupName ?? ""}`;
        return ag.localeCompare(bg) * direction;
      }

      const aDate = new Date(a.registeredAt).getTime();
      const bDate = new Date(b.registeredAt).getTime();
      return (aDate - bDate) * direction;
    });

    return sorted;
  }, [students, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortKey(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  };

  const openMenu = (studentId: string, index: number, target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();
    const shouldOpenUp = index >= sortedStudents.length - 2;

    setMenuState((current) => {
      if (current?.studentId === studentId) return null;

      return {
        studentId,
        x: rect.right,
        y: shouldOpenUp ? rect.top : rect.bottom,
        openUp: shouldOpenUp,
      };
    });
  };

  return (
    <div className="rounded-xl overflow-visible bg-white border border-slate-200">
      <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-t-xl">
        <button onClick={() => toggleSort("name")} className="col-span-3 flex items-center gap-1.5 text-left">
          Name
          <ArrowUpDown size={12} />
        </button>
        <button onClick={() => toggleSort("group")} className="col-span-2 flex items-center gap-1.5 text-left">
          Class / Group
          <ArrowUpDown size={12} />
        </button>
        {showProgressColumn ? <div className="col-span-2">Test Score / Progress</div> : null}
        <button onClick={() => toggleSort("dateAdded")} className="col-span-2 flex items-center gap-1.5 text-left">
          Date Added
          <ArrowUpDown size={12} />
        </button>
        <div className={showProgressColumn ? "col-span-1" : "col-span-3"}>Pipeline</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-100">
        {sortedStudents.map((student, index) => {
          const badge = pipelineStyles[student.pipelineStatus];
          const freeze = getFreezeState(student.freezeStart, student.freezeEnd);
          const isFrozen = freeze.state === "active" || student.pipelineStatus === "frozen";
          const isLastRow = index === sortedStudents.length - 1;

          return (
            <div
              key={student.id}
              className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 transition-colors ${
                isFrozen ? "opacity-60 bg-blue-50/10" : ""
              } ${isLastRow ? "rounded-b-xl" : ""}`}
            >
              <div className="col-span-3 min-w-0">
                <p className="text-[13px] font-semibold truncate text-slate-900">{student.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] truncate text-slate-500">{student.phone}</p>
                  <a
                    href={toWhatsAppLink(student.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 -m-2 text-green-500 hover:text-green-600 transition-colors"
                    aria-label={`Open WhatsApp chat with ${student.name}`}
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                </div>
              </div>

              <div className="col-span-2 min-w-0">
                <Link
                  href={`/manage/classes/${student.id}`}
                  className="text-[12px] truncate text-blue-600 hover:underline inline-flex max-w-full"
                >
                  {student.course} (
                  <span className={student.groupName ? "text-blue-600" : "text-slate-400"}>
                    {student.groupName ?? "Unassigned"}
                  </span>
                  )
                </Link>
              </div>

              {showProgressColumn ? (
                <div className="col-span-2 min-w-0">
                  <p className="text-[12px] text-slate-700 truncate">
                    {student.testingScore !== undefined
                      ? `${student.testingScore}%`
                      : student.evaluationProgress ?? "Needs assessment"}
                  </p>
                </div>
              ) : null}

              <div className="col-span-2 min-w-0">
                <p className="text-[12px] text-slate-600">{formatDate(student.registeredAt)}</p>
              </div>

              <div className={showProgressColumn ? "col-span-1" : "col-span-3"}>
                {isFrozen ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border bg-sky-100 text-sky-800 border-sky-200">
                    {`❄️ Frozen till ${freeze.endLabel}`}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {freeze.state === "upcoming" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border bg-orange-100 text-orange-800 border-orange-200">
                        {`Upcoming freeze: ${freeze.startLabel}`}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <button
                  onClick={() => onEdit(student.id)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-white transition-colors"
                  aria-label={`Edit ${student.name}`}
                >
                  <Pencil size={13} />
                  <span className="text-[11px] font-semibold">Edit</span>
                </button>
                <button
                  onClick={(e) => openMenu(student.id, index, e.currentTarget)}
                  className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-white transition-colors"
                  aria-label={`More options for ${student.name}`}
                >
                  <MoreHorizontal size={15} className="mx-auto" />
                </button>
              </div>
            </div>
          );
        })}

        {!hasRows ? (
          <div className="px-4 py-10 flex flex-col items-center justify-center text-center text-slate-500">
            <PartyPopper className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-[13px] font-semibold text-slate-700">All caught up!</p>
            <p className="text-[12px]">No students in this view right now.</p>
          </div>
        ) : null}
      </div>

      {menuState
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[90] w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1"
              style={{
                left: menuState.x,
                top: menuState.y,
                transform: menuState.openUp
                  ? "translate(-100%, calc(-100% - 8px))"
                  : "translate(-100%, 8px)",
              }}
            >
              <button
                onClick={() => {
                  const studentId = menuState.studentId;
                  const target = students.find((student) => student.id === studentId);
                  if (target?.pipelineStatus === "frozen") {
                    setMenuState(null);
                    return;
                  }
                  setMenuState(null);
                  onFreeze(studentId);
                }}
                className="w-full h-8 rounded-lg px-2.5 flex items-center gap-2 text-[12px] text-slate-700 hover:bg-slate-50"
              >
                <Snowflake size={13} />
                {students.find((student) => student.id === menuState.studentId)?.pipelineStatus === "frozen"
                  ? "Already Frozen"
                  : "Freeze Student"}
              </button>
              <button
                onClick={() => {
                  const studentId = menuState.studentId;
                  setMenuState(null);
                  onDelete(studentId);
                }}
                className="w-full h-8 rounded-lg px-2.5 flex items-center gap-2 text-[12px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Delete Student
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
