"use client";

import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Settings
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Workspace preferences and integrations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            WhatsApp Bot Integration
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for connecting a WhatsApp number, webhook, and message templates.
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            Notifications
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for payment alerts, attendance reminders, and system events.
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            Permissions
          </p>
          <p className="text-[12px] mt-2" style={{ color: "rgba(29,29,31,0.45)" }}>
            Placeholder for managing roles and access policies.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
