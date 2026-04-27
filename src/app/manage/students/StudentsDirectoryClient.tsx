"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import LeadsTable, { type WhatsAppLead } from "@/components/students/LeadsTable";
import StudentSlideOver, { type StudentFormData } from "@/components/students/StudentSlideOver";
import StudentTable from "../../../components/students/StudentTable";
import { type Student } from "@/data/mock";
import { Toaster } from "sonner";

type TabId = "directory" | "evaluating" | "whatsappLeads";
type PanelMode = "add" | "edit" | "review";
export type DirectoryStudent = Student & { internalNotes: string };
export type AvailableClassOption = { id: string; name: string; groups: { id: string; name: string }[] };
export type StudentsByStatus = {
  active: DirectoryStudent[];
  evaluating: DirectoryStudent[];
  leads: WhatsAppLead[];
};

type StudentsDirectoryClientProps = {
  initialStudentsByStatus: StudentsByStatus;
  initialAvailableClasses: AvailableClassOption[];
};

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function normalizeFreezeWindow(student: Student) {
  if (!student.freezeStart || !student.freezeEnd) {
    return { freezeStart: undefined, freezeEnd: undefined };
  }

  const start = parseDateOnly(student.freezeStart);
  const end = parseDateOnly(student.freezeEnd);
  if (!start || !end) {
    return { freezeStart: undefined, freezeEnd: undefined };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (end < todayStart) {
    return { freezeStart: undefined, freezeEnd: undefined };
  }

  return { freezeStart: student.freezeStart, freezeEnd: student.freezeEnd };
}

function normalizeGender(value?: string | null): StudentFormData["gender"] {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }

  return "";
}

function toFormData(input: {
  name: string;
  phone: string;
  course: string;
  courseId?: string;
  groupId?: string;
  groupName?: string;
  gender?: string | null;
  status?: Student["pipelineStatus"];
  testingScore?: number | null;
  notes?: string | null;
}): StudentFormData {
  const [firstName, ...rest] = input.name.trim().split(" ");
  const lastName = rest.join(" ");

  return {
    firstName: firstName ?? "",
    lastName,
    phone: input.phone,
    course: input.course,
    courseId: input.courseId ?? "",
    groupId: input.groupId ?? "",
    groupName: input.groupName ?? "",
    gender: normalizeGender(input.gender),
    status:
      input.status === "active"
        ? "active"
        : input.status === "lead"
          ? "lead"
          : "evaluating",
    testingScore: input.testingScore != null ? String(input.testingScore) : "",
    notes: input.notes ?? "",
  };
}

function formStatusToPipelineStatus(status: StudentFormData["status"]): Student["pipelineStatus"] {
  return status;
}

function createStudentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `student-${Date.now()}`;
}

export default function StudentsDirectoryClient({
  initialStudentsByStatus,
  initialAvailableClasses,
}: StudentsDirectoryClientProps) {
  const availableClasses = useMemo(() => initialAvailableClasses, [initialAvailableClasses]);
  const [activeTab, setActiveTab] = useState<TabId>("directory");
  const [query, setQuery] = useState("");
  const [directoryStudents, setDirectoryStudents] = useState<DirectoryStudent[]>(() =>
    [...initialStudentsByStatus.active, ...initialStudentsByStatus.evaluating].map((student) => {
      const normalizedFreeze = normalizeFreezeWindow(student);

      return {
        ...student,
        ...normalizedFreeze,
      };
    }),
  );
  const [whatsAppLeads, setWhatsAppLeads] = useState<WhatsAppLead[]>(initialStudentsByStatus.leads);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("add");
  const [panelSessionKey, setPanelSessionKey] = useState(0);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [reviewingLeadId, setReviewingLeadId] = useState<string | null>(null);
  const [freezeStudentId, setFreezeStudentId] = useState<string | null>(null);
  const [freezeStartDate, setFreezeStartDate] = useState("");
  const [freezeEndDate, setFreezeEndDate] = useState("");
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  const courses = useMemo(() => availableClasses, [availableClasses]);

  const groupsByCourse = useMemo(
    () =>
      Object.fromEntries(
        availableClasses.map((item) => [item.id, item.groups]),
      ) as Record<string, AvailableClassOption["groups"]>,
    [availableClasses],
  );

  const filteredDirectoryRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryStudents.filter((student) => {
      if (student.pipelineStatus !== "active") return false;
      if (!q) return true;

      return (
        student.name.toLowerCase().includes(q) ||
        student.phone.toLowerCase().includes(q) ||
        student.course.toLowerCase().includes(q)
      );
    });
  }, [query, directoryStudents]);

  const filteredEvaluatingRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryStudents.filter((student) => {
      if (student.pipelineStatus !== "evaluating") return false;
      if (!q) return true;

      return (
        student.name.toLowerCase().includes(q) ||
        student.phone.toLowerCase().includes(q) ||
        student.course.toLowerCase().includes(q)
      );
    });
  }, [query, directoryStudents]);

  const filteredLeadsRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return whatsAppLeads.filter((lead) => {
      if (!q) return true;

      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.course.toLowerCase().includes(q)
      );
    });
  }, [query, whatsAppLeads]);

  const editingStudent = useMemo(
    () => directoryStudents.find((student) => student.id === editingStudentId) ?? null,
    [directoryStudents, editingStudentId],
  );

  const reviewingLead = useMemo(
    () => whatsAppLeads.find((lead) => lead.id === reviewingLeadId) ?? null,
    [whatsAppLeads, reviewingLeadId],
  );

  const currentFormData = useMemo<StudentFormData>(() => {
    if (panelMode === "edit" && editingStudent) {
      const matchingCourse = editingStudent.courseId
        ? availableClasses.find((courseOption) => courseOption.id === editingStudent.courseId)
        : availableClasses.find((courseOption) => courseOption.name === editingStudent.course);
      const matchingGroup = (matchingCourse ? groupsByCourse[matchingCourse.id] ?? [] : []).find(
        (group) => group.name === editingStudent.groupName,
      );

      return toFormData({
        name: editingStudent.name,
        phone: editingStudent.phone,
        course: matchingCourse?.name ?? editingStudent.course,
        courseId: editingStudent.courseId ?? matchingCourse?.id,
        groupId: matchingGroup?.id,
        groupName: editingStudent.groupName,
        gender: editingStudent.gender,
        status: editingStudent.pipelineStatus,
        testingScore: editingStudent.testingScore,
        notes: editingStudent.internalNotes,
      });
    }

    if (panelMode === "review" && reviewingLead) {
      const matchingCourse = availableClasses.find((courseOption) => courseOption.name === reviewingLead.course);

      return toFormData({
        name: reviewingLead.name,
        phone: reviewingLead.phone,
        course: matchingCourse?.name ?? reviewingLead.course,
        courseId: matchingCourse?.id,
        groupName: "",
        gender: reviewingLead.gender,
        testingScore: undefined,
        notes: "",
      });
    }

    return {
      firstName: "",
      lastName: "",
      phone: "",
      course: courses[0]?.name ?? "",
      courseId: courses[0]?.id ?? "",
      groupId: "",
      groupName: "",
      gender: "",
      status: "evaluating",
      testingScore: "",
      notes: "",
    };
  }, [panelMode, editingStudent, reviewingLead, courses, groupsByCourse, availableClasses]);

  const openAddPanel = () => {
    setPanelSessionKey((value) => value + 1);
    setPanelMode("add");
    setEditingStudentId(null);
    setReviewingLeadId(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = (studentId: string) => {
    setPanelSessionKey((value) => value + 1);
    setPanelMode("edit");
    setEditingStudentId(studentId);
    setReviewingLeadId(null);
    setIsPanelOpen(true);
  };

  const openReviewPanel = (lead: WhatsAppLead) => {
    setPanelSessionKey((value) => value + 1);
    setPanelMode("review");
    setReviewingLeadId(lead.id);
    setEditingStudentId(null);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingStudentId(null);
    setReviewingLeadId(null);
  };

  const handleSaveStudent = (data: StudentFormData) => {
    const name = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
    const numericScore = data.testingScore.trim().length > 0 ? Number(data.testingScore) : undefined;
    const testingScore = Number.isFinite(numericScore) ? Number(numericScore) : undefined;
    const nextPipelineStatus = formStatusToPipelineStatus(data.status);

    const nextStudent: DirectoryStudent = {
      id: editingStudent?.id ?? reviewingLead?.id ?? createStudentId(),
      name,
      phone: data.phone.trim(),
      course: data.course,
      courseId: data.courseId || null,
      groupName: data.groupName || undefined,
      gender: data.gender || null,
      pipelineStatus: nextPipelineStatus,
      testingScore,
      evaluationProgress:
        nextPipelineStatus === "evaluating"
          ? testingScore !== undefined
            ? `Testing score: ${testingScore}%`
            : editingStudent?.evaluationProgress ?? "Needs assessment"
          : undefined,
      registeredAt: editingStudent?.registeredAt ?? new Date().toISOString(),
      internalNotes: data.notes.trim(),
      freezeStart: editingStudent?.freezeStart,
      freezeEnd: editingStudent?.freezeEnd,
    };

    if (panelMode === "edit" && editingStudent) {
      setDirectoryStudents((prev) =>
        prev.map((student) => (student.id === editingStudent.id ? { ...student, ...nextStudent } : student)),
      );
      closePanel();
      return;
    }

    setDirectoryStudents((prev) => [nextStudent, ...prev]);

    if (panelMode === "review" && reviewingLead) {
      setWhatsAppLeads((prev) => prev.filter((lead) => lead.id !== reviewingLead.id));
    }

    closePanel();
  };

  const openFreezeDialog = (studentId: string) => {
    const existing = directoryStudents.find((student) => student.id === studentId);
    setFreezeStudentId(studentId);
    setFreezeStartDate(existing?.freezeStart ?? "");
    setFreezeEndDate(existing?.freezeEnd ?? "");
  };

  const closeFreezeDialog = () => {
    setFreezeStudentId(null);
    setFreezeStartDate("");
    setFreezeEndDate("");
  };

  const confirmFreezeStudent = () => {
    if (!freezeStudentId || !freezeStartDate || !freezeEndDate) return;

    setDirectoryStudents((prev) =>
      prev.map((student) => {
        if (student.id !== freezeStudentId) return student;
        const freezeNote = `Frozen from ${freezeStartDate} to ${freezeEndDate}`;
        const mergedNotes = student.internalNotes
          ? `${student.internalNotes}\n${freezeNote}`
          : freezeNote;

        return {
          ...student,
          internalNotes: mergedNotes,
          freezeStart: freezeStartDate,
          freezeEnd: freezeEndDate,
        };
      }),
    );

    closeFreezeDialog();
  };

  const clearFreezeStudent = () => {
    if (!freezeStudentId) return;

    setDirectoryStudents((prev) =>
      prev.map((student) =>
        student.id === freezeStudentId
          ? { ...student, freezeStart: undefined, freezeEnd: undefined }
          : student,
      ),
    );

    closeFreezeDialog();
  };

  const openDeleteDialog = (studentId: string) => {
    setDeleteStudentId(studentId);
  };

  const closeDeleteDialog = () => {
    setDeleteStudentId(null);
  };

  const confirmDeleteStudent = () => {
    if (!deleteStudentId) return;
    setDirectoryStudents((prev) => prev.filter((student) => student.id !== deleteStudentId));
    closeDeleteDialog();
  };

  const freezeStudentName = useMemo(
    () => directoryStudents.find((student) => student.id === freezeStudentId)?.name ?? "",
    [directoryStudents, freezeStudentId],
  );

  const deleteStudentName = useMemo(
    () => directoryStudents.find((student) => student.id === deleteStudentId)?.name ?? "",
    [directoryStudents, deleteStudentId],
  );

  return (
    <AppShell>
      <Toaster richColors position="top-right" />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Students
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Directory, CRM pipeline status, and WhatsApp follow-ups
          </p>

          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setActiveTab("directory")}
              className={`h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors ${
                activeTab === "directory"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Current Students
            </button>
            <button
              onClick={() => setActiveTab("evaluating")}
              className={`h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors ${
                activeTab === "evaluating"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Evaluating
            </button>
            <button
              onClick={() => setActiveTab("whatsappLeads")}
              className={`h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors ${
                activeTab === "whatsappLeads"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              WhatsApp Leads
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={openAddPanel}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-[13px] font-semibold shadow-sm"
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl min-w-[280px] flex-1 bg-white/60 focus-within:bg-white shadow-sm border border-white/50 text-gray-900">
              <Search size={14} className="text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, or course"
                className="bg-transparent outline-none text-[13px] w-full text-gray-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {activeTab === "directory" ? (
            <StudentTable
              students={filteredDirectoryRows}
              onEdit={openEditPanel}
              onFreeze={openFreezeDialog}
              onDelete={openDeleteDialog}
            />
          ) : activeTab === "evaluating" ? (
            <StudentTable
              students={filteredEvaluatingRows}
              onEdit={openEditPanel}
              onFreeze={openFreezeDialog}
              onDelete={openDeleteDialog}
              showProgressColumn
            />
          ) : (
            <LeadsTable leads={filteredLeadsRows} onReviewAdd={openReviewPanel} />
          )}
      </div>

      <StudentSlideOver
        key={panelSessionKey}
        isOpen={isPanelOpen}
        mode={panelMode}
        courses={courses}
        groupsByCourse={groupsByCourse}
        initialData={currentFormData}
        onClose={closePanel}
        onSave={handleSaveStudent}
      />

      {freezeStudentId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-slate-900/35" onClick={closeFreezeDialog} aria-label="Close freeze modal" />
          <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-[18px] font-semibold text-slate-900">Freeze Student</h3>
            <p className="text-[12px] text-slate-500 mt-1">Set a freeze period for {freezeStudentName}.</p>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-600">Freeze Start Date</span>
                <input
                  type="date"
                  value={freezeStartDate}
                  onChange={(e) => setFreezeStartDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-600">Freeze End Date</span>
                <input
                  type="date"
                  value={freezeEndDate}
                  onChange={(e) => setFreezeEndDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeFreezeDialog}
                className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={clearFreezeStudent}
                className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
              >
                Clear Freeze
              </button>
              <button
                onClick={confirmFreezeStudent}
                disabled={!freezeStartDate || !freezeEndDate}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-[13px] font-semibold"
              >
                Confirm Freeze
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {deleteStudentId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-slate-900/35" onClick={closeDeleteDialog} aria-label="Close delete modal" />
          <section className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-[18px] font-semibold text-slate-900">Delete Student</h3>
            <p className="text-[12px] text-slate-500 mt-2">
              Are you sure you want to delete {deleteStudentName}? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDeleteDialog}
                className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStudent}
                className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 text-[13px] font-semibold"
              >
                Delete Student
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
