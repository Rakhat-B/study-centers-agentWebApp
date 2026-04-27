"use client";

import AppShell from "@/components/AppShell";
import {
  CLASSES_DATA,
  INSTRUCTORS_DATA,
  ROOMS_DATA,
  mockStudentsDirectory,
  type ClassCatalogCourse,
  type ClassCatalogGroup,
  type GroupSchedule,
} from "@/data/mock";
import { AlertTriangle, MapPin, MessageCircle, PencilLine, Plus, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GroupEditorMode = "create" | "edit";

type GroupEditorState = {
  isOpen: boolean;
  mode: GroupEditorMode;
  sourceCourseId: string;
  sourceGroupId: string | null;
};

type GroupEditorForm = {
  courseId: string;
  name: string;
  roomId: string;
  instructorId: string;
  capacity: number;
  studentIds: string[];
  schedule: GroupSchedule;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const deepCopyCourses = (): ClassCatalogCourse[] =>
  CLASSES_DATA.map((course) => ({
    ...course,
    groups: course.groups.map((group) => ({
      ...group,
      studentIds: [...group.studentIds],
      schedule: {
        days: [...group.schedule.days],
        start: group.schedule.start,
        end: group.schedule.end,
      },
    })),
  }));

const initialEditorState: GroupEditorState = {
  isOpen: false,
  mode: "create",
  sourceCourseId: "",
  sourceGroupId: null,
};

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatSchedule(schedule: GroupSchedule): string {
  return `${schedule.days.join(", ")} • ${schedule.start} - ${schedule.end}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function scheduleOverlap(a: GroupSchedule, b: GroupSchedule): boolean {
  const hasSharedDay = a.days.some((day) => b.days.includes(day));
  if (!hasSharedDay) return false;

  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(a.end) > toMinutes(b.start);
}

function capacityTheme(currentStudents: number, maxCapacity: number) {
  if (maxCapacity === 0) {
    return {
      progress: 0,
      barColor: "#22c55e",
      labelColor: "rgba(21, 128, 61, 0.95)",
      badgeBg: "rgba(34, 197, 94, 0.14)",
      badgeBorder: "rgba(34, 197, 94, 0.24)",
    };
  }

  const progress = Math.min(100, Math.round((currentStudents / maxCapacity) * 100));

  if (currentStudents >= maxCapacity) {
    return {
      progress,
      barColor: "#ef4444",
      labelColor: "rgba(185, 28, 28, 0.95)",
      badgeBg: "rgba(239, 68, 68, 0.14)",
      badgeBorder: "rgba(239, 68, 68, 0.24)",
    };
  }

  if (currentStudents / maxCapacity >= 0.8) {
    return {
      progress,
      barColor: "#f59e0b",
      labelColor: "rgba(161, 98, 7, 0.95)",
      badgeBg: "rgba(245, 158, 11, 0.14)",
      badgeBorder: "rgba(245, 158, 11, 0.24)",
    };
  }

  return {
    progress,
    barColor: "#22c55e",
    labelColor: "rgba(21, 128, 61, 0.95)",
    badgeBg: "rgba(34, 197, 94, 0.14)",
    badgeBorder: "rgba(34, 197, 94, 0.24)",
  };
}

function isInSession(schedule: GroupSchedule, now: Date): boolean {
  const dayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
  if (!schedule.days.includes(dayAbbrev)) {
    return false;
  }

  const currentMin = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);
  return currentMin >= start && currentMin < end;
}

function buildEmptyGroupForm(courseId: string): GroupEditorForm {
  return {
    courseId,
    name: "",
    roomId: ROOMS_DATA[0]?.id ?? "",
    instructorId: INSTRUCTORS_DATA[0]?.id ?? "",
    capacity: 15,
    studentIds: [],
    schedule: {
      days: ["Mon", "Wed", "Fri"],
      start: "15:00",
      end: "16:30",
    },
  };
}

export default function ClassesDirectoryPage() {
  const [coursesState, setCoursesState] = useState<ClassCatalogCourse[]>(deepCopyCourses);
  const [now, setNow] = useState(new Date());

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [addCourseError, setAddCourseError] = useState<string | null>(null);

  const [groupEditor, setGroupEditor] = useState<GroupEditorState>(initialEditorState);
  const [groupForm, setGroupForm] = useState<GroupEditorForm>(buildEmptyGroupForm(CLASSES_DATA[0]?.id ?? ""));
  const [groupFormError, setGroupFormError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const activeStudents = useMemo(
    () => mockStudentsDirectory.filter((student) => student.pipelineStatus === "active"),
    [],
  );

  const studentsById = useMemo(
    () => Object.fromEntries(mockStudentsDirectory.map((student) => [student.id, student])) as Record<string, (typeof mockStudentsDirectory)[number]>,
    [],
  );

  const roomsById = useMemo(
    () => Object.fromEntries(ROOMS_DATA.map((room) => [room.id, room])) as Record<string, (typeof ROOMS_DATA)[number]>,
    [],
  );

  const instructorsById = useMemo(
    () =>
      Object.fromEntries(INSTRUCTORS_DATA.map((instructor) => [instructor.id, instructor])) as Record<
        string,
        (typeof INSTRUCTORS_DATA)[number]
      >,
    [],
  );

  const flatGroups = useMemo(
    () =>
      coursesState.flatMap((course) =>
        course.groups.map((group) => ({
          ...group,
          courseId: course.id,
          courseName: course.courseName,
        })),
      ),
    [coursesState],
  );

  const isRoomAvailable = (
    roomId: string,
    schedule: GroupSchedule,
    excludeGroupId?: string,
  ): { available: boolean; conflictingGroupName?: string } => {
    for (const group of flatGroups) {
      if (group.id === excludeGroupId) continue;
      if (group.roomId !== roomId) continue;
      if (!scheduleOverlap(schedule, group.schedule)) continue;

      return { available: false, conflictingGroupName: group.name };
    }

    return { available: true };
  };

  const roomConflict = (() => {
    if (!groupEditor.isOpen) return null;
    if (!groupForm.roomId || groupForm.schedule.days.length === 0) return null;
    if (toMinutes(groupForm.schedule.end) <= toMinutes(groupForm.schedule.start)) return null;

    const result = isRoomAvailable(groupForm.roomId, groupForm.schedule, groupEditor.sourceGroupId ?? undefined);
    if (result.available) return null;

    return `⚠️ Room Conflict: This room is already booked for ${result.conflictingGroupName}.`;
  })();

  const filteredActiveStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return activeStudents.filter((student) => {
      if (!query) return true;
      return student.name.toLowerCase().includes(query) || student.phone.toLowerCase().includes(query);
    });
  }, [activeStudents, studentSearch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const openAddGroup = (courseId: string) => {
    setGroupEditor({
      isOpen: true,
      mode: "create",
      sourceCourseId: courseId,
      sourceGroupId: null,
    });
    setGroupForm(buildEmptyGroupForm(courseId));
    setGroupFormError(null);
    setStudentSearch("");
  };

  const openEditGroup = (courseId: string, group: ClassCatalogGroup) => {
    setGroupEditor({
      isOpen: true,
      mode: "edit",
      sourceCourseId: courseId,
      sourceGroupId: group.id,
    });
    setGroupForm({
      courseId,
      name: group.name,
      roomId: group.roomId,
      instructorId: group.instructorId,
      capacity: group.capacity,
      studentIds: [...group.studentIds],
      schedule: {
        days: [...group.schedule.days],
        start: group.schedule.start,
        end: group.schedule.end,
      },
    });
    setGroupFormError(null);
    setStudentSearch("");
  };

  const closeGroupEditor = () => {
    setGroupEditor(initialEditorState);
    setGroupFormError(null);
    setStudentSearch("");
  };

  const toggleDay = (day: string) => {
    setGroupForm((prev) => {
      const exists = prev.schedule.days.includes(day);
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          days: exists
            ? prev.schedule.days.filter((item) => item !== day)
            : [...prev.schedule.days, day],
        },
      };
    });
  };

  const toggleStudent = (studentId: string) => {
    setGroupForm((prev) => {
      const exists = prev.studentIds.includes(studentId);
      return {
        ...prev,
        studentIds: exists
          ? prev.studentIds.filter((id) => id !== studentId)
          : [...prev.studentIds, studentId],
      };
    });
  };

  const handleAddCourse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const courseName = newCourseName.trim();
    if (!courseName) {
      setAddCourseError("Course name is required.");
      return;
    }

    const duplicate = coursesState.some(
      (course) => course.courseName.toLowerCase() === courseName.toLowerCase(),
    );
    if (duplicate) {
      setAddCourseError("This course already exists.");
      return;
    }

    setCoursesState((prev) => [
      ...prev,
      {
        id: `course-${slugify(courseName)}-${Date.now()}`,
        courseName,
        groups: [],
      },
    ]);

    setNewCourseName("");
    setAddCourseError(null);
    setIsAddCourseOpen(false);
  };

  const handleSaveGroup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupForm.courseId || !groupForm.name.trim()) {
      setGroupFormError("Course and group name are required.");
      return;
    }

    if (!groupForm.roomId || !groupForm.instructorId) {
      setGroupFormError("Please select both a classroom and instructor.");
      return;
    }

    if (groupForm.schedule.days.length === 0) {
      setGroupFormError("Select at least one day in the schedule.");
      return;
    }

    if (toMinutes(groupForm.schedule.end) <= toMinutes(groupForm.schedule.start)) {
      setGroupFormError("End time must be later than start time.");
      return;
    }

    if (groupForm.capacity <= 0 || groupForm.studentIds.length > groupForm.capacity) {
      setGroupFormError("Capacity must be positive and not smaller than assigned students.");
      return;
    }

    if (roomConflict) {
      setGroupFormError("Resolve the room conflict before saving.");
      return;
    }

    const groupId =
      groupEditor.mode === "edit" && groupEditor.sourceGroupId
        ? groupEditor.sourceGroupId
        : `${slugify(groupForm.courseId)}-${slugify(groupForm.name)}-${Date.now()}`;

    const nextGroup: ClassCatalogGroup = {
      id: groupId,
      name: groupForm.name.trim(),
      roomId: groupForm.roomId,
      instructorId: groupForm.instructorId,
      capacity: groupForm.capacity,
      studentIds: [...groupForm.studentIds],
      schedule: {
        days: [...groupForm.schedule.days],
        start: groupForm.schedule.start,
        end: groupForm.schedule.end,
      },
    };

    setCoursesState((prev) => {
      const withoutOldGroup = prev.map((course) => ({
        ...course,
        groups: course.groups.filter((group) => group.id !== groupId),
      }));

      return withoutOldGroup.map((course) => {
        if (course.id !== groupForm.courseId) return course;

        return {
          ...course,
          groups: [...course.groups, nextGroup],
        };
      });
    });

    closeGroupEditor();
  };

  const removeGroup = (groupId: string) => {
    setCoursesState((prev) =>
      prev.map((course) => ({
        ...course,
        groups: course.groups.filter((group) => group.id !== groupId),
      })),
    );
  };

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Classes
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Courses, groups, rooms, and live session status
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddCourseOpen(true);
            setAddCourseError(null);
            setNewCourseName("");
          }}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-[14px] tracking-tight transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
            color: "white",
            boxShadow: "0 8px 24px rgba(0, 109, 224, 0.38)",
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          <Plus size={16} strokeWidth={2.2} />
          Add Course
        </button>
      </div>

      <div className="space-y-9">
        {coursesState.map((course) => (
          <section key={course.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] md:text-[22px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                {course.courseName}
              </h2>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: "rgba(29,29,31,0.62)",
                  background: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.62)",
                }}
              >
                {course.groups.length} groups
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {course.groups.map((group) => {
                const roomName = roomsById[group.roomId]?.name ?? "Unknown Room";
                const instructor = instructorsById[group.instructorId];
                const enrolled = group.studentIds.length;
                const capacity = capacityTheme(enrolled, group.capacity);
                const inSession = isInSession(group.schedule, now);

                const phones = group.studentIds
                  .map((id) => studentsById[id]?.phone)
                  .filter((value): value is string => Boolean(value));

                const waText = `Group ${group.name} (${course.courseName}) phones: ${phones.join(", ") || "No students assigned"}`;
                const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`;

                return (
                  <article
                    key={group.id}
                    className="glass-card p-4 md:p-5 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                    style={{
                      background: "linear-gradient(165deg, rgba(255,255,255,0.35), rgba(255,255,255,0.18))",
                      border: "1px solid rgba(255, 255, 255, 0.55)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[16px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                          {group.name}
                        </p>
                        <div
                          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            color: "rgba(29,29,31,0.68)",
                            background: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.65)",
                          }}
                        >
                          <MapPin size={13} />
                          {roomName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditGroup(course.id, group)}
                        className="h-8 w-8 rounded-full inline-flex items-center justify-center"
                        style={{
                          background: "rgba(255,255,255,0.45)",
                          border: "1px solid rgba(255,255,255,0.6)",
                          color: "rgba(29,29,31,0.72)",
                        }}
                        aria-label={`Edit ${group.name}`}
                      >
                        <PencilLine size={15} />
                      </button>
                    </div>

                    {inSession ? (
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold w-fit"
                        style={{
                          color: "rgba(22, 101, 52, 0.95)",
                          background: "rgba(34, 197, 94, 0.15)",
                          border: "1px solid rgba(34, 197, 94, 0.28)",
                        }}
                      >
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        In Session
                      </span>
                    ) : null}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                          Capacity
                        </span>
                        <span
                          className="text-[11px] font-semibold px-2 py-1 rounded-full"
                          style={{
                            color: capacity.labelColor,
                            background: capacity.badgeBg,
                            border: `1px solid ${capacity.badgeBorder}`,
                          }}
                        >
                          {enrolled}/{group.capacity}
                        </span>
                      </div>

                      <div
                        className="rounded-full overflow-hidden"
                        style={{
                          height: 5,
                          background: "rgba(255,255,255,0.28)",
                          border: "1px solid rgba(255,255,255,0.5)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${capacity.progress}%`,
                            background: capacity.barColor,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      href="/manage/timetable"
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold w-fit transition-opacity hover:opacity-80"
                      style={{
                        color: "rgba(29,29,31,0.66)",
                        background: "rgba(255,255,255,0.46)",
                        border: "1px solid rgba(255,255,255,0.62)",
                      }}
                    >
                      {formatSchedule(group.schedule)}
                    </Link>

                    <Link
                      href="/manage/instructors"
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold w-fit transition-opacity hover:opacity-80"
                      style={{
                        color: "rgba(29,29,31,0.72)",
                        background: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.65)",
                      }}
                    >
                      <User size={14} />
                      {instructor?.name ?? "Unassigned"}
                    </Link>

                    <div className="mt-auto flex gap-2">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                        style={{
                          color: "#0f5132",
                          background: "rgba(34,197,94,0.14)",
                          border: "1px solid rgba(34,197,94,0.24)",
                        }}
                      >
                        <MessageCircle size={14} />
                        Message Group
                      </a>

                      <button
                        type="button"
                        onClick={() => removeGroup(group.id)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                        style={{
                          color: "#b91c1c",
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                );
              })}

              <button
                type="button"
                onClick={() => openAddGroup(course.id)}
                className="rounded-2xl p-5 border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[220px] transition-all hover:-translate-y-1 hover:shadow-md"
                style={{
                  borderColor: "rgba(29,29,31,0.2)",
                  color: "rgba(29,29,31,0.52)",
                  background: "rgba(255,255,255,0.18)",
                }}
              >
                <span
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.75)",
                  }}
                >
                  <Plus size={24} />
                </span>
                <span className="text-[14px] font-semibold">Add New Group</span>
              </button>
            </div>
          </section>
        ))}
      </div>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-250 ${
          isAddCourseOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Close add course modal"
          onClick={() => setIsAddCourseOpen(false)}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCourse}
            className="glass-card w-full max-w-[460px] p-5"
            style={{
              background: "linear-gradient(170deg, rgba(255,255,255,0.92), rgba(246,249,255,0.88))",
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(29,29,31,0.52)" }}>
                  Add Course
                </p>
                <h3 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                  Create Course Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCourseOpen(false)}
                className="h-8 w-8 rounded-full inline-flex items-center justify-center"
                style={{
                  background: "rgba(29,29,31,0.06)",
                  color: "rgba(29,29,31,0.62)",
                }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <label className="block mt-4">
              <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                Course Name
              </span>
              <input
                value={newCourseName}
                onChange={(event) => setNewCourseName(event.target.value)}
                placeholder="SAT Prep"
                className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
              />
            </label>

            {addCourseError ? (
              <div
                className="mt-3 rounded-xl px-3 py-2 text-[12px] font-medium flex items-start gap-2"
                style={{
                  color: "#b91c1c",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <AlertTriangle size={15} className="shrink-0 mt-[1px]" />
                <span>{addCourseError}</span>
              </div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddCourseOpen(false)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold"
                style={{
                  color: "rgba(29,29,31,0.72)",
                  background: "rgba(255,255,255,0.62)",
                  border: "1px solid rgba(255,255,255,0.8)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full text-[13px] font-semibold"
                style={{
                  color: "white",
                  background: "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
                  border: "1px solid rgba(0,109,224,0.4)",
                }}
              >
                Add Course
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-250 ${
          groupEditor.isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Close group management sheet"
          onClick={closeGroupEditor}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-[580px] p-4 md:p-6 transition-transform duration-300 ${
            groupEditor.isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form
            onSubmit={handleSaveGroup}
            className="h-full glass-card flex flex-col"
            style={{
              background: "linear-gradient(170deg, rgba(255,255,255,0.85), rgba(246,249,255,0.78))",
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(29,29,31,0.08)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(29,29,31,0.52)" }}>
                    Group Management
                  </p>
                  <h3 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                    {groupEditor.mode === "create" ? "Create New Group" : "Edit Group"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeGroupEditor}
                  className="h-8 w-8 rounded-full inline-flex items-center justify-center"
                  style={{
                    background: "rgba(29,29,31,0.06)",
                    color: "rgba(29,29,31,0.62)",
                  }}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 flex-1 overflow-auto space-y-4">
              <label className="block">
                <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                  Course
                </span>
                <select
                  value={groupForm.courseId}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, courseId: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                >
                  {coursesState.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    Group Name
                  </span>
                  <input
                    value={groupForm.name}
                    onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                    placeholder="Group A"
                  />
                </label>

                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    Capacity
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={groupForm.capacity}
                    onChange={(event) =>
                      setGroupForm((prev) => ({ ...prev, capacity: Number(event.target.value) || 0 }))
                    }
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    Classroom
                  </span>
                  <select
                    value={groupForm.roomId}
                    onChange={(event) => setGroupForm((prev) => ({ ...prev, roomId: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                  >
                    {ROOMS_DATA.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    Instructor
                  </span>
                  <select
                    value={groupForm.instructorId}
                    onChange={(event) =>
                      setGroupForm((prev) => ({ ...prev, instructorId: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                  >
                    {INSTRUCTORS_DATA.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name} ({instructor.subject})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: "rgba(29,29,31,0.62)" }}>
                  Schedule Days
                </p>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = groupForm.schedule.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                        style={{
                          color: active ? "white" : "rgba(29,29,31,0.66)",
                          background: active ? "#0071e3" : "rgba(255,255,255,0.6)",
                          border: active ? "1px solid #0071e3" : "1px solid rgba(255,255,255,0.75)",
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    Start Time
                  </span>
                  <input
                    type="time"
                    value={groupForm.schedule.start}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        schedule: { ...prev.schedule, start: event.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                  />
                </label>

                <label className="block">
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                    End Time
                  </span>
                  <input
                    type="time"
                    value={groupForm.schedule.end}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        schedule: { ...prev.schedule, end: event.target.value },
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl px-3 py-2 text-[13px]"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                  />
                </label>
              </div>

              <div>
                <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.62)" }}>
                  Active Student Roster
                </p>
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search by name or phone"
                  className="mt-1.5 mb-2 w-full rounded-xl px-3 py-2 text-[13px]"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
                />

                <div
                  className="rounded-xl p-2 max-h-[200px] overflow-auto space-y-1"
                  style={{ background: "rgba(255,255,255,0.54)", border: "1px solid rgba(255,255,255,0.78)" }}
                >
                  {filteredActiveStudents.map((student) => {
                    const selected = groupForm.studentIds.includes(student.id);
                    return (
                      <label
                        key={student.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: selected ? "rgba(0,113,227,0.08)" : "transparent" }}
                      >
                        <span className="text-[12px]" style={{ color: "rgba(29,29,31,0.75)" }}>
                          {student.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleStudent(student.id)}
                        />
                      </label>
                    );
                  })}

                  {!filteredActiveStudents.length ? (
                    <p className="text-[12px] px-2 py-2" style={{ color: "rgba(29,29,31,0.58)" }}>
                      No active students found.
                    </p>
                  ) : null}
                </div>
              </div>

              {roomConflict ? (
                <div
                  className="rounded-xl px-3 py-2 text-[12px] font-medium flex items-start gap-2"
                  style={{
                    color: "#b91c1c",
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  <AlertTriangle size={15} className="shrink-0 mt-[1px]" />
                  <span>{roomConflict}</span>
                </div>
              ) : null}

              {groupFormError ? (
                <div
                  className="rounded-xl px-3 py-2 text-[12px] font-medium flex items-start gap-2"
                  style={{
                    color: "#b91c1c",
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  <AlertTriangle size={15} className="shrink-0 mt-[1px]" />
                  <span>{groupFormError}</span>
                </div>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: "rgba(29,29,31,0.08)" }}>
              <button
                type="button"
                onClick={closeGroupEditor}
                className="px-4 py-2 rounded-full text-[13px] font-semibold"
                style={{
                  color: "rgba(29,29,31,0.72)",
                  background: "rgba(255,255,255,0.62)",
                  border: "1px solid rgba(255,255,255,0.8)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(roomConflict)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: "white",
                  background: "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
                  border: "1px solid rgba(0,109,224,0.4)",
                }}
              >
                Save
              </button>
            </div>
          </form>
        </aside>
      </div>
    </AppShell>
  );
}