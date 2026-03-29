"use client";

import {
  BarChart2,
  GraduationCap,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Users,
  BookOpen,
  UserSquare2,
  CreditCard,
  WalletCards,
  LineChart,
  Calendar,
  LifeBuoy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

type NavItem = {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  href: string;
};

type AccordionGroup = {
  id: "manage" | "finance";
  labelKey: string;
  defaultLabel: string;
  items: NavItem[];
};

const rootNav: NavItem[] = [
  { id: "dashboard", labelKey: "sidebar.dashboard", defaultLabel: "Dashboard", icon: BarChart2, href: "#dashboard" },
  { id: "timetable", labelKey: "sidebar.timetable", defaultLabel: "Timetable", icon: Calendar, href: "#timetable" },
];

const accordionGroups: AccordionGroup[] = [
  {
    id: "manage",
    labelKey: "sidebar.manage",
    defaultLabel: "Manage",
    items: [
      { id: "students", labelKey: "sidebar.students", defaultLabel: "Students", icon: Users, href: "#students" },
      { id: "classes", labelKey: "sidebar.classes", defaultLabel: "Classes", icon: BookOpen, href: "#classes" },
      { id: "instructors", labelKey: "sidebar.instructors", defaultLabel: "Instructors", icon: UserSquare2, href: "#instructors" },
    ],
  },
  {
    id: "finance",
    labelKey: "sidebar.financeInsight",
    defaultLabel: "Finance & Insight",
    items: [
      { id: "payments", labelKey: "sidebar.payments", defaultLabel: "Payments", icon: CreditCard, href: "#payments" },
      { id: "payroll", labelKey: "sidebar.payroll", defaultLabel: "Payroll", icon: WalletCards, href: "#payroll" },
      { id: "reports", labelKey: "sidebar.reports", defaultLabel: "Reports", icon: LineChart, href: "#reports" },
    ],
  },
];

export default function Sidebar({ currentView = "dashboard" }: { currentView?: string }) {
  const [active, setActive] = useState(currentView);
  const [openGroups, setOpenGroups] = useState<Record<AccordionGroup["id"], boolean>>({
    manage: true,
    finance: true,
  });
  const [locale, setLocale] = useState<"KZ" | "RU" | "EN">("EN");
  const [darkIcon, setDarkIcon] = useState(false);

  useEffect(() => {
    setActive(currentView);
  }, [currentView]);

  const toggleGroup = (groupId: AccordionGroup["id"]) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isGroupActive = (group: AccordionGroup) => group.items.some((item) => item.id === active);

  const navBaseClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/5";

  return (
    <aside className="glass-sidebar bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-3xl border-r border-white/30 sticky top-0 h-screen overflow-y-auto w-72 flex-shrink-0 flex flex-col py-8 px-4 gap-3">
      <div className="flex items-center gap-3 px-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0071e3 0%, #34aadc 100%)" }}
        >
          <GraduationCap size={20} color="white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            {t("brand.title", "EduCenter OS")}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {t("brand.subtitle", "Management Suite")}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {rootNav.map(({ id, labelKey, defaultLabel, icon: Icon, href }) => {
          const activeRoot = active === id;
          return (
            <a
              key={id}
              href={href}
              onClick={() => setActive(id)}
              className={`${navBaseClass} ${activeRoot ? "bg-white/40 shadow-md shadow-black/5 backdrop-blur-md font-semibold" : "font-medium"}`}
              style={{
                color: activeRoot ? "var(--accent)" : "rgba(29,29,31,0.72)",
                fontSize: "14px",
                letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
            >
              <Icon size={17} strokeWidth={activeRoot ? 2.2 : 1.9} />
              {t(labelKey, defaultLabel)}
            </a>
          );
        })}

        {accordionGroups.map((group) => {
          const open = openGroups[group.id];
          const activeGroup = isGroupActive(group);

          return (
            <div key={group.id} className="mt-1 rounded-xl" style={{ background: activeGroup ? "rgba(255,255,255,0.12)" : "transparent" }}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/5 ${
                  activeGroup ? "bg-white/40 shadow-md shadow-black/5 backdrop-blur-md" : ""
                }`}
                style={{
                  color: activeGroup ? "var(--accent)" : "rgba(29,29,31,0.72)",
                  border: open ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500/80">
                  {t(group.labelKey, group.defaultLabel)}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
                  style={{ color: activeGroup ? "var(--accent)" : "rgba(29,29,31,0.5)" }}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: open ? `${group.items.length * 48}px` : "0px" }}
              >
                <div className="pt-1 pb-1 px-1 flex flex-col gap-1">
                  {group.items.map(({ id, labelKey, defaultLabel, icon: Icon, href }) => {
                    const childActive = active === id;
                    return (
                      <a
                        key={id}
                        href={href}
                        onClick={() => setActive(id)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/5 ${
                          childActive ? "bg-white/40 shadow-md shadow-black/5 backdrop-blur-md font-semibold" : "font-medium"
                        }`}
                        style={{
                          color: childActive ? "var(--accent)" : "rgba(29,29,31,0.68)",
                          fontSize: "13px",
                          letterSpacing: "-0.01em",
                          textDecoration: "none",
                        }}
                      >
                        <Icon size={16} strokeWidth={childActive ? 2.1 : 1.85} />
                        {t(labelKey, defaultLabel)}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.45)" }}>
        <a
          href="#support"
          onClick={() => setActive("support")}
          className={`mx-1 ${navBaseClass} ${active === "support" ? "bg-white/40 shadow-md shadow-black/5 backdrop-blur-md font-semibold" : "font-medium"}`}
          style={{
            color: active === "support" ? "var(--accent)" : "rgba(29,29,31,0.72)",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          <LifeBuoy size={17} strokeWidth={active === "support" ? 2.2 : 1.9} />
          {t("sidebar.helpSupport", "Help & Support")}
        </a>
        <a
          href="#settings"
          onClick={() => setActive("settings")}
          className={`mx-1 mt-1.5 ${navBaseClass} ${active === "settings" ? "bg-white/40 shadow-md shadow-black/5 backdrop-blur-md font-semibold" : "font-medium"}`}
          style={{
            color: active === "settings" ? "var(--accent)" : "rgba(29,29,31,0.72)",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          <Settings size={17} strokeWidth={active === "settings" ? 2.2 : 1.9} />
          {t("sidebar.settings", "Settings")}
        </a>
      </div>

      <div className="px-3 mt-2">
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)" }}
        >
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.25)" }}>
            {(["KZ", "RU", "EN"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setLocale(option)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: locale === option ? "rgba(0, 113, 227, 0.14)" : "transparent",
                  color: locale === option ? "var(--accent)" : "rgba(29,29,31,0.65)",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label={t("sidebar.languageToggle", "Change language")}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={() => setDarkIcon((prev) => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              border: "1px solid rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.25)",
              color: "rgba(29,29,31,0.7)",
              cursor: "pointer",
            }}
            aria-label={t("sidebar.themeToggle", "Toggle theme")}
          >
            {darkIcon ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
