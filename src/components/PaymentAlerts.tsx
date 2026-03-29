"use client";

import { BellRing, Link2 } from "lucide-react";
import { formatKZT, mockPaymentAlerts } from "@/data/mock";
import { t } from "@/lib/i18n";
import WidgetTitleLink from "@/components/WidgetTitleLink";

export default function PaymentAlerts() {
  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#payments" title={t("alerts.title", "Payment Alerts")} />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {t("alerts.subtitle", "Bills due in the next 48 hours")}
          </p>
        </div>
        <BellRing size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      <div className="flex flex-col gap-2">
        {mockPaymentAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                {alert.studentName}
              </p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(29,29,31,0.5)" }}>
                {alert.course} · {alert.dueInHours}h · {formatKZT(alert.amount)}
              </p>
            </div>

            <button
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{
                background: "linear-gradient(135deg, #006de0 0%, #2f9eff 100%)",
                color: "white",
                border: "1px solid rgba(8, 124, 242, 0.45)",
                boxShadow: "0 8px 18px rgba(0, 109, 224, 0.28)",
                cursor: "pointer",
              }}
            >
              <Link2 size={12} />
              {t("alerts.sendKaspiLink", "Send Kaspi Link")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
