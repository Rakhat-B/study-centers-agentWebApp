"use client";

import { DashboardProvider } from "@/context/DashboardContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
