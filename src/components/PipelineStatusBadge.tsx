"use client";

export type PipelineStatus = "lead" | "evaluating" | "active";

export default function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  const config: Record<PipelineStatus, { label: string; className: string }> = {
    lead: {
      label: "Lead",
      className: "bg-orange-100 text-orange-700 border border-orange-200",
    },
    evaluating: {
      label: "Evaluating",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    active: {
      label: "Active",
      className: "bg-green-100 text-green-700 border border-green-200",
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${className}`}>
      {label}
    </span>
  );
}
