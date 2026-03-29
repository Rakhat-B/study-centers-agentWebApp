"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type DashboardWidgetId =
  | "classes"
  | "registration"
  | "intelligence"
  | "payments"
  | "alerts";

type VisibilityMap = Record<DashboardWidgetId, boolean>;

type DashboardContextType = {
  editMode: boolean;
  visibleWidgets: VisibilityMap;
  toggleEditMode: () => void;
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
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<VisibilityMap>(initialVisibility);

  const value = useMemo(
    () => ({
      editMode,
      visibleWidgets,
      toggleEditMode: () => setEditMode((prev) => !prev),
      setWidgetVisibility: (widgetId: DashboardWidgetId, visible: boolean) => {
        setVisibleWidgets((prev) => ({ ...prev, [widgetId]: visible }));
      },
      toggleWidgetVisibility: (widgetId: DashboardWidgetId) => {
        setVisibleWidgets((prev) => ({ ...prev, [widgetId]: !prev[widgetId] }));
      },
    }),
    [editMode, visibleWidgets]
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
