"use client";

import { MessageCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import PipelineStatusBadge, { type PipelineStatus } from "@/components/PipelineStatusBadge";
import { mockStudentsDirectory, type Student } from "@/data/mock";

function formatPipelineHint(status: PipelineStatus) {
  switch (status) {
    case "lead":
      return "Asked Questions";
    case "evaluating":
      return "Testing/Selecting Course";
    case "active":
      return "Registered";
  }
}

export default function StudentsDirectoryPage() {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | "All">("All");

  const courses = useMemo(() => {
    const unique = new Set(mockStudentsDirectory.map((s) => s.course));
    return ["All", ...Array.from(unique).sort()];
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockStudentsDirectory
      .filter((s) => (courseFilter === "All" ? true : s.course === courseFilter))
      .filter((s) => (statusFilter === "All" ? true : s.pipelineStatus === statusFilter))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q)
        );
      });
  }, [query, courseFilter, statusFilter]);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Students
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Directory, CRM pipeline status, and WhatsApp follow-ups
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl min-w-[280px] flex-1"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <Search size={14} style={{ color: "rgba(29,29,31,0.55)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, or course"
                className="bg-transparent outline-none text-[13px] w-full"
                style={{ color: "rgba(29,29,31,0.78)" }}
              />
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-[13px]"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "rgba(29,29,31,0.75)",
              }}
            >
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PipelineStatus | "All")}
              className="px-3 py-2 rounded-xl text-[13px]"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "rgba(29,29,31,0.75)",
              }}
            >
              <option value="All">All statuses</option>
              <option value="lead">Lead</option>
              <option value="evaluating">Evaluating</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.16)", color: "rgba(29,29,31,0.55)" }}>
              <div className="col-span-4">Student</div>
              <div className="col-span-3">Course</div>
              <div className="col-span-3">Pipeline</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.22)" }}>
              {rows.map((s: Student) => (
                <div
                  key={s.id}
                  className="grid grid-cols-12 px-4 py-3 items-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <div className="col-span-4 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                      {s.name}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "rgba(29,29,31,0.5)" }}>
                      {s.phone}
                    </p>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="text-[12px] truncate" style={{ color: "rgba(29,29,31,0.75)" }}>
                      {s.course}
                    </p>
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <PipelineStatusBadge status={s.pipelineStatus} />
                    <span className="text-[11px]" style={{ color: "rgba(29,29,31,0.5)" }}>
                      {formatPipelineHint(s.pipelineStatus)}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-full"
                      style={{
                        background: "rgba(34, 197, 94, 0.16)",
                        border: "1px solid rgba(34, 197, 94, 0.35)",
                        color: "rgb(21, 128, 61)",
                        cursor: "pointer",
                      }}
                      aria-label="WhatsApp"
                    >
                      <MessageCircle size={13} />
                      <span className="text-[11px] font-semibold">WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}

              {rows.length === 0 ? (
                <div className="px-4 py-6 text-[12px]" style={{ color: "rgba(29,29,31,0.55)" }}>
                  No students match the current filters.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 glass-card p-5">
          <p className="text-[13px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
            Notes
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            This is a UI-only directory page for now. Connect search and WhatsApp actions to your backend later.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
