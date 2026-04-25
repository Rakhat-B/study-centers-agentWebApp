"use client";

import { CreditCard } from "lucide-react";
import { t } from "@/lib/i18n";
import WidgetTitleLink from "@/components/WidgetTitleLink";
import type { DashboardPayment } from "@/app/dashboard/DashboardClient";

type RecentPaymentsProps = {
  payments: DashboardPayment[];
};

function formatKZT(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function KaspiStatusBadge({ status }: { status: DashboardPayment["kaspiStatus"] }) {
  const config = {
    paid: {
      label: t("payments.status.paid", "Kaspi ✓"),
      bg: "rgba(52, 199, 89, 0.1)",
      color: "rgb(52, 199, 89)",
      border: "rgba(52, 199, 89, 0.2)",
    },
    pending: {
      label: t("payments.status.pending", "Pending"),
      bg: "rgba(255, 159, 10, 0.1)",
      color: "rgb(255, 159, 10)",
      border: "rgba(255, 159, 10, 0.2)",
    },
    failed: {
      label: t("payments.status.failed", "Failed"),
      bg: "rgba(255, 59, 48, 0.08)",
      color: "rgb(255, 59, 48)",
      border: "rgba(255, 59, 48, 0.2)",
    },
  };

  const { label, bg, color, border } = config[status];

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}

export default function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#payments" title={t("payments.title", "Recent Payments")} />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {t("payments.subtitle", "via Kaspi.kz")}
          </p>
        </div>
        <CreditCard size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      {/* Transactions list */}
      <div className="flex flex-col gap-2">
        {payments.length === 0 ? (
          <p className="text-[12px]" style={{ color: "rgba(29,29,31,0.5)" }}>
            No payment records available yet.
          </p>
        ) : null}
        {payments.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  tx.kaspiStatus === "paid"
                    ? "rgba(52,199,89,0.1)"
                    : tx.kaspiStatus === "pending"
                    ? "rgba(255,159,10,0.1)"
                    : "rgba(255,59,48,0.08)",
              }}
            >
              <CreditCard
                size={14}
                style={{
                  color:
                    tx.kaspiStatus === "paid"
                      ? "rgb(52,199,89)"
                      : tx.kaspiStatus === "pending"
                      ? "rgb(255,159,10)"
                      : "rgb(255,59,48)",
                }}
              />
            </div>

            {/* Name & course */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-medium truncate"
                style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
              >
                {tx.studentName}
              </p>
              <p
                className="text-[11px] truncate mt-0.5"
                style={{ color: "rgba(29,29,31,0.45)" }}
              >
                {tx.course}
              </p>
            </div>

            {/* Amount & status */}
            <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
              <p
                className="text-[13px] font-semibold tabular-nums"
                style={{ color: "var(--foreground)" }}
              >
                {formatKZT(tx.amount)}
              </p>
              <KaspiStatusBadge status={tx.kaspiStatus} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
