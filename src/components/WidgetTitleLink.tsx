"use client";

import { ChevronRight } from "lucide-react";

type Props = {
  href: string;
  title: string;
};

export default function WidgetTitleLink({ href, title }: Props) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-tight"
      style={{ color: "var(--foreground)", textDecoration: "none" }}
    >
      <span
        className="border-b border-transparent transition-colors duration-200 group-hover:border-[rgba(29,29,31,0.28)]"
      >
        {title}
      </span>
      <ChevronRight
        size={14}
        className="opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        style={{ color: "rgba(29,29,31,0.45)" }}
      />
    </a>
  );
}
