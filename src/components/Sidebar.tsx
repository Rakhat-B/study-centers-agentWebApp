"use client";

import { Users, Calendar, CreditCard, BarChart2, GraduationCap } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: BarChart2, href: "#dashboard" },
  { label: "Students", icon: Users, href: "#students" },
  { label: "Timetable", icon: Calendar, href: "#timetable" },
  { label: "Payments", icon: CreditCard, href: "#payments" },
  { label: "Summary", icon: BarChart2, href: "#summary" },
];

export default function Sidebar() {
  const [active, setActive] = useState("Dashboard");

  return (
    <aside className="glass-sidebar w-64 flex-shrink-0 flex flex-col h-full py-8 px-4 gap-2">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0071e3 0%, #34aadc 100%)" }}
        >
          <GraduationCap size={20} color="white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            EduCenter OS
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            Management Suite
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = active === label;
          return (
            <a
              key={label}
              href={href}
              onClick={() => setActive(label)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: isActive ? "rgba(0, 113, 227, 0.1)" : "transparent",
                color: isActive ? "var(--accent)" : "rgba(29,29,31,0.65)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "14px",
                letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "rgba(0,0,0,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent";
                }
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="mt-auto px-3">
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-[12px] font-medium" style={{ color: "rgba(29,29,31,0.7)" }}>
            Almaty Test Center
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.4)" }}>
            Spring Term 2026
          </p>
        </div>
      </div>
    </aside>
  );
}
