"use client";

import { Eye, EyeOff, GripVertical, LayoutDashboard } from "lucide-react";
import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TodaysClasses from "@/components/TodaysClasses";
import PendingRegistration from "@/components/PendingRegistration";
import RecentPayments from "@/components/RecentPayments";
import AddStudentButton from "@/components/AddStudentButton";
import DateDisplay from "@/components/DateDisplay";
import CenterIntelligence from "@/components/CenterIntelligence";
import PaymentAlerts from "@/components/PaymentAlerts";
import InstructorSchedule from "@/components/InstructorSchedule";
import QuickAttendance from "@/components/QuickAttendance";
import { t } from "@/lib/i18n";
import {
  DashboardProvider,
  DashboardWidgetId,
  UserRole,
  useDashboard,
} from "@/context/DashboardContext";

type TileConfig = {
  id: DashboardWidgetId;
  title: string;
  href: string;
  render: () => React.ReactNode;
};

function DashboardContent() {
  const { editMode, toggleEditMode, visibleWidgets, toggleWidgetVisibility, currentRole } = useDashboard();

  const defaultTileOrderByRole: Record<UserRole, DashboardWidgetId[]> = {
    Director: ["registration", "intelligence", "classes", "payments", "alerts"],
    Receptionist: ["registration", "classes", "alerts"],
    Instructor: ["instructorSchedule", "quickAttendance"],
  };

  const [tileOrderByRole, setTileOrderByRole] = useState<Record<UserRole, DashboardWidgetId[]>>(defaultTileOrderByRole);
  const [draggingTileId, setDraggingTileId] = useState<DashboardWidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<DashboardWidgetId | null>(null);

  const roleVisibleTileIds = defaultTileOrderByRole[currentRole];
  const tileOrder = tileOrderByRole[currentRole];

  const tiles: TileConfig[] = useMemo(
    () => [
      {
        id: "classes",
        title: t("classes.today", "Today's Classes"),
        href: "#classes",
        render: () => <TodaysClasses />,
      },
      {
        id: "registration",
        title: t("pending.title", "Pending Registration"),
        href: "#students",
        render: () => <PendingRegistration />,
      },
      {
        id: "intelligence",
        title: t("intelligence.title", "Center Intelligence"),
        href: "#reports",
        render: () => <CenterIntelligence />,
      },
      {
        id: "payments",
        title: t("payments.title", "Bank Feed & Payments"),
        href: "#payments",
        render: () => <RecentPayments />,
      },
      {
        id: "instructorSchedule",
        title: t("instructor.schedule", "Instructor Schedule"),
        href: "#my-schedule",
        render: () => <InstructorSchedule />,
      },
      {
        id: "quickAttendance",
        title: t("instructor.quickAttendance", "Quick Attendance"),
        href: "#my-classes",
        render: () => <QuickAttendance />,
      },
      {
        id: "alerts",
        title: t("alerts.title", "Payment Alerts"),
        href: "#payments",
        render: () => <PaymentAlerts />,
      },
    ],
    []
  );

  const tilesById = useMemo(() => {
    return tiles.reduce<Record<DashboardWidgetId, TileConfig>>((acc, tile) => {
      acc[tile.id] = tile;
      return acc;
    }, {} as Record<DashboardWidgetId, TileConfig>);
  }, [tiles]);

  const orderedTiles = tileOrder
    .filter((tileId) => roleVisibleTileIds.includes(tileId))
    .map((tileId) => tilesById[tileId]);

  const moveTile = (sourceId: DashboardWidgetId, targetId: DashboardWidgetId) => {
    if (sourceId === targetId) {
      return;
    }

    setTileOrderByRole((prevByRole) => {
      const prev = prevByRole[currentRole];
      const sourceIndex = prev.indexOf(sourceId);
      const targetIndex = prev.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return prevByRole;
      }

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...prevByRole,
        [currentRole]: next,
      };
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView="dashboard" />

      <main className="mesh-bg flex-1 min-h-screen overflow-y-auto px-5 md:px-8 py-6 md:py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-[28px] font-bold tracking-tight leading-none"
              style={{ color: "var(--foreground)" }}
            >
              {t("dashboard.title", "Dashboard")}
            </h1>
            <DateDisplay />
          </div>

          <div className="flex items-center gap-2.5">
            {currentRole !== "Instructor" ? (
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200"
                style={{
                  background: editMode
                    ? "rgba(0, 113, 227, 0.16)"
                    : "rgba(255,255,255,0.3)",
                  color: editMode ? "var(--accent)" : "rgba(29,29,31,0.78)",
                  border: "1px solid rgba(255,255,255,0.42)",
                  boxShadow: editMode ? "0 8px 22px rgba(0,113,227,0.2)" : "none",
                  cursor: "pointer",
                }}
              >
                <LayoutDashboard size={15} />
                {editMode
                  ? t("dashboard.doneCustomizing", "Done")
                  : t("dashboard.customize", "Customize Layout")}
              </button>
            ) : null}
            {currentRole === "Director" || currentRole === "Receptionist" ? <AddStudentButton /> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {orderedTiles.map((tile, index) => {
            const colSpan = index % 2 === 0 ? "xl:col-span-2" : "xl:col-span-1";
            const isVisible = visibleWidgets[tile.id];

            if (!isVisible && !editMode) {
              return null;
            }

            if (!isVisible && editMode) {
              return (
                <div
                  key={tile.id}
                  className={`${colSpan} glass-card p-5 min-h-[220px] border-dashed ${
                    editMode ? "select-none" : ""
                  } ${dropTargetId === tile.id ? "ring-2 ring-blue-300/60" : ""}`}
                  draggable={editMode}
                  onDragStart={(event) => {
                    if (!editMode) {
                      return;
                    }
                    setDraggingTileId(tile.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", tile.id);
                  }}
                  onDragOver={(event) => {
                    if (!editMode) {
                      return;
                    }
                    event.preventDefault();
                    setDropTargetId(tile.id);
                  }}
                  onDrop={(event) => {
                    if (!editMode) {
                      return;
                    }
                    event.preventDefault();
                    const sourceId = (draggingTileId ?? event.dataTransfer.getData("text/plain")) as DashboardWidgetId;
                    if (sourceId) {
                      moveTile(sourceId, tile.id);
                    }
                    setDraggingTileId(null);
                    setDropTargetId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingTileId(null);
                    setDropTargetId(null);
                  }}
                >
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
                        {tile.title}
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
                        {t("dashboard.hiddenWidget", "Widget is currently hidden")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => toggleWidgetVisibility(tile.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                        style={{
                          background: "hsla(0, 0%, 100%, 0.35)",
                          color: "rgba(29,29,31,0.8)",
                          border: "1px solid rgba(255,255,255,0.48)",
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={13} />
                        {t("dashboard.show", "Show")}
                      </button>
                      <div className="drag-placeholder">
                        <GripVertical size={14} />
                        {t("dashboard.dragDrop", "Drag and drop")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tile.id}
                className={`${colSpan} relative ${editMode ? "edit-shake select-none" : ""} ${
                  dropTargetId === tile.id ? "ring-2 ring-blue-300/60 rounded-2xl" : ""
                }`}
                style={editMode ? { animationDelay: `${index * 90}ms` } : undefined}
                draggable={editMode}
                onDragStart={(event) => {
                  if (!editMode) {
                    return;
                  }
                  setDraggingTileId(tile.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", tile.id);
                }}
                onDragOver={(event) => {
                  if (!editMode) {
                    return;
                  }
                  event.preventDefault();
                  setDropTargetId(tile.id);
                }}
                onDrop={(event) => {
                  if (!editMode) {
                    return;
                  }
                  event.preventDefault();
                  const sourceId = (draggingTileId ?? event.dataTransfer.getData("text/plain")) as DashboardWidgetId;
                  if (sourceId) {
                    moveTile(sourceId, tile.id);
                  }
                  setDraggingTileId(null);
                  setDropTargetId(null);
                }}
                onDragEnd={() => {
                  setDraggingTileId(null);
                  setDropTargetId(null);
                }}
              >
                {editMode ? (
                  <div className="absolute z-20 right-3 top-3">
                    <button
                      onClick={() => toggleWidgetVisibility(tile.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        background: "rgba(255,255,255,0.52)",
                        color: "rgba(29,29,31,0.75)",
                        border: "1px solid rgba(255,255,255,0.55)",
                        cursor: "pointer",
                      }}
                    >
                      <EyeOff size={12} />
                      {t("dashboard.hide", "Hide")}
                    </button>
                  </div>
                ) : null}

                <div className={editMode ? "pointer-events-none" : ""}>{tile.render()}</div>

                {editMode ? (
                  <div className="absolute z-20 left-3 bottom-3 drag-placeholder">
                    <GripVertical size={14} />
                    {t("dashboard.dragDrop", "Drag and drop")}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
