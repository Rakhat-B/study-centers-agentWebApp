"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type DashboardWidgetId =
  | "classes"
  | "registration"
  | "intelligence"
  | "payments"
  | "alerts"
  | "instructorSchedule"
  | "quickAttendance";

export type UserRole = "Director" | "Receptionist" | "Instructor";

type VisibilityMap = Record<DashboardWidgetId, boolean>;

type DashboardContextType = {
  editMode: boolean;
  visibleWidgets: VisibilityMap;
  currentRole: UserRole;
  toggleEditMode: () => void;
  setCurrentRole: (role: UserRole) => void;
  setWidgetVisibility: (widgetId: DashboardWidgetId, visible: boolean) => void;
  toggleWidgetVisibility: (widgetId: DashboardWidgetId) => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

const initialVisibility: VisibilityMap = {
  classes: true,
  registration: true,
  intelligence: true,
  payments: true,
  alerts: true,
  instructorSchedule: true,
  quickAttendance: true,
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<VisibilityMap>(initialVisibility);
  const [currentRole, setCurrentRole] = useState<UserRole>("Director");

  const value = useMemo(
    () => ({
      editMode,
      visibleWidgets,
      currentRole,
      toggleEditMode: () => setEditMode((prev) => !prev),
      setCurrentRole,
      setWidgetVisibility: (widgetId: DashboardWidgetId, visible: boolean) => {
        setVisibleWidgets((prev) => ({ ...prev, [widgetId]: visible }));
      },
      toggleWidgetVisibility: (widgetId: DashboardWidgetId) => {
        setVisibleWidgets((prev) => ({ ...prev, [widgetId]: !prev[widgetId] }));
      },
    }),
    [editMode, visibleWidgets, currentRole]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
