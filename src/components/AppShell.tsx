"use client";

import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="mesh-bg flex-1 min-h-screen overflow-y-auto px-5 md:px-8 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
