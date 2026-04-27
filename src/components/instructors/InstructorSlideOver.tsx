"use client";

import { LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type InstructorCourseOption = {
  id: string;
  name: string;
};

export type InstructorFormData = {
  fullName: string;
  phone: string;
  courseId: string;
};

type InstructorSlideOverProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  isPending: boolean;
  courseOptions: InstructorCourseOption[];
  initialData: InstructorFormData;
  onClose: () => void;
  onSave: (data: InstructorFormData) => void;
};

export default function InstructorSlideOver({
  isOpen,
  mode,
  isPending,
  courseOptions,
  initialData,
  onClose,
  onSave,
}: InstructorSlideOverProps) {
  const [form, setForm] = useState<InstructorFormData>(initialData);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  const panelTitle = mode === "edit" ? "Edit Instructor" : "Add Instructor";
  const submitLabel = mode === "edit" ? "Save Instructor" : "Add Instructor";
  const pendingLabel = mode === "edit" ? "Saving..." : "Adding...";
  const canSave = useMemo(() => form.fullName.trim().length > 0, [form.fullName]);

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

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 pb-24">
          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Instructor Full Name</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              disabled={isPending}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              placeholder="e.g. Aizat Bekova"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Phone Number</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={isPending}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              placeholder="+7 700 000 0000"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[12px] font-medium text-slate-600">Course</span>
            <select
              value={form.courseId}
              onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
              disabled={isPending}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white"
            >
              <option value="">No specific course</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <footer className="h-16 px-5 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky bottom-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={!canSave || isPending}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-[13px] font-semibold inline-flex items-center gap-2"
          >
            {isPending ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                {pendingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
