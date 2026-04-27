"use client";

import { LoaderCircle, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { addStudent, updateStudent } from "@/actions/mutations";

export type StudentFormStatus = "lead" | "evaluating" | "active" | "frozen";

export type GroupSelectOption = {
  id: string;
  name: string;
};

export type CourseSelectOption = {
  id: string;
  name: string;
};

export type StudentFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  course: string;
  courseId: string;
  groupId: string;
  groupName: string;
  gender: "" | "male" | "female" | "other";
  status: StudentFormStatus;
  testingScore: string;
  notes: string;
};

type StudentSlideOverProps = {
  isOpen: boolean;
  mode: "add" | "edit" | "review";
  courses: CourseSelectOption[];
  groupsByCourse: Record<string, GroupSelectOption[]>;
  initialData: StudentFormData;
  editingStudentId?: string | null;
  isFreezePending?: boolean;
  onFreezeStudent?: () => void;
  onClose: () => void;
  onSave: (data: StudentFormData) => void;
};

const INITIAL_MUTATION_ACTION_STATE = {
  success: false,
  message: "",
};

function buildInitialFormState(
  initialData: StudentFormData,
  courses: CourseSelectOption[],
  groupsByCourse: Record<string, GroupSelectOption[]>,
): StudentFormData {
  const selectedCourse = initialData.courseId
    ? courses.find((course) => course.id === initialData.courseId)
    : courses.find((course) => course.name === initialData.course);

  const resolvedCourseId = selectedCourse?.id ?? initialData.courseId ?? "";
  const resolvedCourseName = selectedCourse?.name ?? initialData.course ?? "";
  const initialGroups = resolvedCourseId ? groupsByCourse[resolvedCourseId] ?? [] : [];
  const initialMatchedGroup = initialData.groupId
    ? initialGroups.find((group) => group.id === initialData.groupId)
    : initialGroups.find((group) => group.name === initialData.groupName);

  return {
    ...initialData,
    course: resolvedCourseName,
    courseId: initialData.courseId || resolvedCourseId,
    groupId: initialMatchedGroup?.id ?? initialData.groupId,
    groupName: initialMatchedGroup?.name ?? initialData.groupName,
    gender: initialData.gender || "",
    testingScore: initialData.testingScore ? initialData.testingScore.toString() : "",
    notes: initialData.notes || "",
  };
}

export default function StudentSlideOver({
  isOpen,
  mode,
  courses,
  groupsByCourse,
  initialData,
  editingStudentId = null,
  isFreezePending = false,
  onFreezeStudent,
  onClose,
  onSave,
}: StudentSlideOverProps) {
  const [actionState, submitAddStudent, isActionPending] = useActionState(
    addStudent,
    INITIAL_MUTATION_ACTION_STATE,
  );
  const [isTransitionPending, startTransition] = useTransition();
  const [form, setForm] = useState<StudentFormData>(() =>
    buildInitialFormState(initialData, courses, groupsByCourse),
  );
  const isAddMode = mode === "add";
  const isPending = isActionPending || isTransitionPending;
  const disableFormInputs = isAddMode && isPending;
  const availableGroups = form.courseId ? groupsByCourse[form.courseId] ?? [] : [];

  useEffect(() => {
    setForm(buildInitialFormState(initialData, courses, groupsByCourse));
  }, [initialData, courses, groupsByCourse]);

  const handleCourseChange = (nextCourseId: string) => {
    const selectedCourse = courses.find((course) => course.id === nextCourseId);

    setForm((prev) => ({
      ...prev,
      courseId: nextCourseId,
      course: selectedCourse?.name ?? "",
      groupId: "",
      groupName: "",
    }));
  };

  const handleGroupChange = (nextGroupId: string) => {
    const selectedGroup = availableGroups.find((group) => group.id === nextGroupId);

    setForm((prev) => ({
      ...prev,
      groupId: nextGroupId,
      groupName: selectedGroup?.name ?? "",
    }));
  };

  const handleGenderChange = (nextGender: StudentFormData["gender"]) => {
    setForm((prev) => ({
      ...prev,
      gender: nextGender,
    }));
  };

  const handleStatusChange = (nextStatus: StudentFormStatus) => {
    setForm((prev) => ({
      ...prev,
      status: nextStatus,
    }));
  };

  const handleTestingScoreChange = (nextScore: string) => {
    setForm((prev) => ({
      ...prev,
      testingScore: nextScore,
    }));
  };

  const handleInternalNotesChange = (nextNotes: string) => {
    setForm((prev) => ({
      ...prev,
      notes: nextNotes,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("gender", form.gender);
    formData.set("testingScore", form.testingScore.toString());
    formData.set("internalNotes", form.notes);
    formData.set("status", form.status);
    formData.set("group_id", form.groupId);
    formData.set("course_id", form.courseId || "");

    startTransition(() => {
      submitAddStudent(formData);
    });
  };

  const handleEditSave = async () => {
    if (!editingStudentId) {
      toast.error("Student not found for editing.");
      return;
    }

    const formData = new FormData();
    formData.set("first_name", form.firstName);
    formData.set("last_name", form.lastName);
    formData.set("phone", form.phone);
    formData.set("gender", form.gender);
    formData.set("testingScore", form.testingScore.toString());
    formData.set("internalNotes", form.notes);
    formData.set("status", form.status);
    formData.set("group_id", form.groupId);
    formData.set("course_id", form.courseId || "");

    startTransition(async () => {
      const result = await updateStudent(editingStudentId, formData);

      if (!result.success) {
        toast.error(`Error: ${result.message}`);
        return;
      }

      onSave(form);
      toast.success(result.message || "Student updated");
    });
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", onEscape);
      return () => window.removeEventListener("keydown", onEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!actionState.message) {
      return;
    }

    if (actionState.success) {
      toast.success(actionState.message);
      onClose();
      return;
    }

    toast.error(`Error: ${actionState.message}`);
  }, [actionState, onClose]);

  const panelTitle = useMemo(() => {
    if (mode === "edit") return "Edit Student";
    if (mode === "review") return "Review WhatsApp Lead";
    return "Add Student";
  }, [mode]);

  const canSave = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.course.trim(),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-label="Close panel"
      />

      <section className="relative h-full w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <header className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-slate-900">{panelTitle}</h2>
          <button
            type="button"
            className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} className="mx-auto" />
          </button>
        </header>

        <form onSubmit={isAddMode ? handleSubmit : undefined} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-[12px] font-medium text-slate-600">First Name</span>
              <input
                name="first_name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                disabled={disableFormInputs}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[12px] font-medium text-slate-600">Last Name</span>
              <input
                name="last_name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                disabled={disableFormInputs}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Phone Number</span>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={disableFormInputs}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Course</span>
            <select
              name="course_id"
              value={form.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={disableFormInputs}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Group</span>
            <select
              name="group_id"
              value={form.groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              disabled={!form.courseId || disableFormInputs}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Unassigned</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Gender</span>
            <select
              name="gender"
              value={form.gender}
              onChange={(e) => handleGenderChange(e.target.value as StudentFormData["gender"])}
              disabled={disableFormInputs}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="space-y-2">
            <p className="text-[12px] font-medium text-slate-600">Initial Status</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleStatusChange("evaluating")}
                disabled={disableFormInputs}
                className={`rounded-lg px-3 py-2 text-left transition-colors ${
                  form.status === "evaluating" || form.status === "lead"
                    ? "bg-white border border-slate-300 text-slate-900"
                    : "border border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                <p className="text-[12px] font-semibold">Pending</p>
                <p className="text-[11px]">Taking a test / Needs follow-up</p>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("active")}
                disabled={disableFormInputs}
                className={`rounded-lg px-3 py-2 text-left transition-colors ${
                  form.status === "active"
                    ? "bg-white border border-slate-300 text-slate-900"
                    : "border border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                <p className="text-[12px] font-semibold">Registered</p>
                <p className="text-[11px]">Active pipeline</p>
              </button>
            </div>
          </div>

          <label
            className={`space-y-1.5 block rounded-xl p-3 border ${
              form.status === "evaluating" || form.status === "lead"
                ? "border-blue-200 bg-blue-50/60"
                : "border-transparent"
            }`}
          >
            <span className="text-[12px] font-medium text-slate-600">Testing Score</span>
            <input
              name="testingScore"
              type="number"
              min={0}
              max={100}
              value={form.testingScore}
              onChange={(e) => handleTestingScoreChange(e.target.value)}
              disabled={disableFormInputs}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              placeholder="0 - 100"
            />
            {form.status === "evaluating" || form.status === "lead" ? (
              <p className="text-[11px] text-blue-700">Helpful for evaluating pipeline recommendations.</p>
            ) : null}
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Internal Notes</span>
            <textarea
              name="internalNotes"
              value={form.notes}
              onChange={(e) => handleInternalNotesChange(e.target.value)}
              disabled={disableFormInputs}
              rows={4}
              className="w-full rounded-lg border border-white/50 bg-white/60 px-3 py-2 text-[13px] text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 resize-y"
              placeholder="Log internal follow-up details for this student"
            />
          </label>

        </div>

        <footer className="h-16 px-5 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky bottom-0 flex items-center justify-end gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onFreezeStudent}
              disabled={isFreezePending}
              className="h-9 px-4 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-60 disabled:hover:bg-transparent text-[13px] font-medium mr-auto"
            >
              {isFreezePending ? "Freezing..." : "Freeze Student"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
          >
            Cancel
          </button>
          {isAddMode ? (
            <button
              type="submit"
              disabled={!canSave || isPending}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-[13px] font-semibold inline-flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />
                  Adding...
                </>
              ) : (
                "Save Student"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={mode === "edit" ? handleEditSave : () => onSave(form)}
              disabled={!canSave}
              className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-[13px] font-semibold"
            >
              Save Student
            </button>
          )}
        </footer>
        </form>
      </section>
    </div>
  );
}
