"use client";

import AppShell from "@/components/AppShell";
import { useDashboard } from "@/context/DashboardContext";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import InstructorSlideOver, {
  type InstructorCourseOption,
  type InstructorFormData,
} from "@/components/instructors/InstructorSlideOver";
import { addInstructor, deleteInstructor, updateInstructor } from "@/actions/mutations";

export type { InstructorCourseOption };

export type InstructorTeachingGroup = {
  id: string;
  title: string;
  capacity: number;
  enrolledCount: number;
  fullnessPercent: number;
};

export type InstructorDirectoryItem = {
  id: string;
  name: string;
  phone?: string | null;
  courseId?: string | null;
  specialization: string;
  scheduleSummary: string;
  payrollRateKztPerHour: number;
  groups: InstructorTeachingGroup[];
};

type InstructorsDirectoryClientProps = {
  instructors: InstructorDirectoryItem[];
  courseOptions: InstructorCourseOption[];
};

type PanelMode = "add" | "edit";

type MenuState = {
  instructorId: string;
  x: number;
  y: number;
  openUp: boolean;
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export default function InstructorsDirectoryClient({
  instructors,
  courseOptions,
}: InstructorsDirectoryClientProps) {
  const { currentRole } = useDashboard();
  const router = useRouter();
  const [directoryInstructors, setDirectoryInstructors] = useState<InstructorDirectoryItem[]>(instructors);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("add");
  const [panelSessionKey, setPanelSessionKey] = useState(0);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null);
  const [deleteInstructorId, setDeleteInstructorId] = useState<string | null>(null);
  const [isMutationPending, startMutationTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
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

  const editingInstructor = useMemo(
    () => directoryInstructors.find((instructor) => instructor.id === editingInstructorId) ?? null,
    [directoryInstructors, editingInstructorId],
  );

  const currentFormData = useMemo<InstructorFormData>(() => {
    if (!editingInstructor) {
      return {
        fullName: "",
        phone: "",
        courseId: "",
      };
    }

    return {
      fullName: editingInstructor.name,
      phone: editingInstructor.phone ?? "",
      courseId: editingInstructor.courseId ?? "",
    };
  }, [editingInstructor]);

  const deleteInstructorName = useMemo(
    () => directoryInstructors.find((instructor) => instructor.id === deleteInstructorId)?.name ?? "",
    [directoryInstructors, deleteInstructorId],
  );

  const openAddPanel = () => {
    setPanelSessionKey((value) => value + 1);
    setPanelMode("add");
    setEditingInstructorId(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = (instructorId: string) => {
    setPanelSessionKey((value) => value + 1);
    setPanelMode("edit");
    setEditingInstructorId(instructorId);
    setIsPanelOpen(true);
    setMenuState(null);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingInstructorId(null);
  };

  const openMenu = (instructorId: string, index: number, target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();
    const shouldOpenUp = index >= directoryInstructors.length - 2;

    setMenuState((current) => {
      if (current?.instructorId === instructorId) return null;

      return {
        instructorId,
        x: rect.right,
        y: shouldOpenUp ? rect.top : rect.bottom,
        openUp: shouldOpenUp,
      };
    });
  };

  const handleSaveInstructor = (form: InstructorFormData) => {
    const formData = new FormData();
    formData.set("full_name", form.fullName);
    formData.set("phone", form.phone);
    formData.set("course_id", form.courseId);

    startMutationTransition(async () => {
      if (panelMode === "edit" && editingInstructorId) {
        const result = await updateInstructor(editingInstructorId, formData);

        if (!result.success) {
          toast.error(`Error: ${result.message}`);
          return;
        }

        const selectedCourse = courseOptions.find((course) => course.id === form.courseId);
        setDirectoryInstructors((prev) =>
          prev.map((instructor) =>
            instructor.id === editingInstructorId
              ? {
                  ...instructor,
                  name: form.fullName.trim(),
                  phone: form.phone.trim() || null,
                  courseId: form.courseId || null,
                  specialization: selectedCourse?.name ?? "General Studies",
                }
              : instructor,
          ),
        );

        closePanel();
        toast.success(result.message || "Instructor updated");
        return;
      }

      const result = await addInstructor(formData);

      if (!result.success) {
        toast.error(`Error: ${result.message}`);
        return;
      }

      closePanel();
      toast.success(result.message || "Instructor added");
      router.refresh();
    });
  };

  const openDeleteDialog = (instructorId: string) => {
    setDeleteInstructorId(instructorId);
    setMenuState(null);
  };

  const closeDeleteDialog = () => {
    setDeleteInstructorId(null);
  };

  const confirmDeleteInstructor = () => {
    if (!deleteInstructorId) return;
    const targetInstructorId = deleteInstructorId;

    startDeleteTransition(async () => {
      const result = await deleteInstructor(targetInstructorId);

      if (!result.success) {
        toast.error(`Error: ${result.message}`);
        return;
      }

      setDirectoryInstructors((prev) => prev.filter((instructor) => instructor.id !== targetInstructorId));
      closeDeleteDialog();
      toast.success(result.message || "Instructor deleted");
      router.refresh();
    });
  };

  return (
    <AppShell>
      <Toaster richColors position="top-right" />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Instructors
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Specializations, schedules, and payroll rates
          </p>
        </div>

        <button
          onClick={openAddPanel}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-[14px] tracking-tight transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
            color: "white",
            boxShadow: "0 8px 24px rgba(0, 109, 224, 0.38)",
            transform: "scale(1)",
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 28px rgba(0, 109, 224, 0.48)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0, 109, 224, 0.38)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <Plus size={16} strokeWidth={2.2} />
           Add Instructor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {directoryInstructors.map((inst, index) => (
          <div
            key={inst.id}
            className="glass-card p-5 flex flex-col gap-3 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/25"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(0, 113, 227, 0.12)",
                  border: "1px solid rgba(0, 113, 227, 0.2)",
                  color: "var(--accent)",
                }}
              >
                <span className="text-[12px] font-bold tracking-tight">{getInitials(inst.name)}</span>
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-tight truncate" style={{ color: "var(--foreground)" }}>
                  {inst.name}
                </p>
                <p className="text-[12px] mt-1 truncate" style={{ color: "rgba(29,29,31,0.55)" }}>
                  {inst.specialization}
                </p>
              </div>
            </div>

            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Schedule
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                {inst.scheduleSummary}
              </p>
            </div>

            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                Classes
              </p>

              {inst.groups.length === 0 ? (
                <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.55)" }}>
                  No groups assigned yet
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {inst.groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <p className="truncate" style={{ color: "rgba(29,29,31,0.72)" }}>
                        {group.title}
                      </p>
                      <p className="shrink-0" style={{ color: "rgba(29,29,31,0.55)" }}>
                        {group.capacity > 0
                          ? `${group.enrolledCount}/${group.capacity} (${group.fullnessPercent}%)`
                          : `${group.enrolledCount} students`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentRole === "Director" ? (
              <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <p className="text-[12px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                  Payroll Rate
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.55)" }}>
                  {inst.payrollRateKztPerHour > 0
                    ? `${inst.payrollRateKztPerHour.toLocaleString("ru-KZ")} KZT / hour`
                    : "Not configured"}
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={(event) => openMenu(inst.id, index, event.currentTarget)}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-white transition-colors"
                aria-label={`More options for ${inst.name}`}
              >
                <MoreHorizontal size={15} className="mx-auto" />
              </button>
            </div>
          </div>
        ))}
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
                onClick={() => openEditPanel(menuState.instructorId)}
                className="w-full h-8 rounded-lg px-2.5 flex items-center gap-2 text-[12px] text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={13} />
                Edit Instructor
              </button>
              <button
                onClick={() => openDeleteDialog(menuState.instructorId)}
                className="w-full h-8 rounded-lg px-2.5 flex items-center gap-2 text-[12px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Delete Instructor
              </button>
            </div>,
            document.body,
          )
        : null}

      <InstructorSlideOver
        key={panelSessionKey}
        isOpen={isPanelOpen}
        mode={panelMode}
        isPending={isMutationPending}
        courseOptions={courseOptions}
        initialData={currentFormData}
        onClose={closePanel}
        onSave={handleSaveInstructor}
      />

      {deleteInstructorId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-slate-900/35" onClick={closeDeleteDialog} aria-label="Close delete modal" />
          <section className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-[18px] font-semibold text-slate-900">Delete Instructor</h3>
            <p className="text-[12px] text-slate-500 mt-2">
              Are you sure you want to delete {deleteInstructorName}? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDeleteDialog}
                className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInstructor}
                disabled={isDeletePending}
                className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 text-[13px] font-semibold"
              >
                {isDeletePending ? "Deleting..." : "Delete Instructor"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
