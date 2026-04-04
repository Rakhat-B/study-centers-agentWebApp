"use client";

import AppShell from "@/components/AppShell";
import { useDashboard } from "@/context/DashboardContext";
import { mockTransactions, formatKZT } from "@/data/mock";
import { FileCheck2 } from "lucide-react";

export default function BankFeedPage() {
  const { currentRole } = useDashboard();

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
            Bank Feed
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            Statement-like transaction stream (Kaspi/Halyk style)
          </p>
        </div>
      </div>

      {currentRole !== "Director" ? (
        <div className="glass-card p-5">
          <p className="text-[14px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
            Director-only
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.45)" }}>
            You don’t have access to this page under the current role.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass-card p-5 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
                Live Statement Feed
              </p>
              <div
                className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "rgba(29,29,31,0.65)",
                }}
              >
                {mockTransactions.length} transactions
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {mockTransactions.map((tx) => {
                const isOutgoing = tx.amount < 0;
                const amountLabel = `${isOutgoing ? "-" : "+"}${formatKZT(Math.abs(tx.amount))}`;
                const ts = new Date(tx.date);
                const time = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                const date = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

                return (
                <div
                  key={tx.id}
                  className="rounded-xl px-3 py-3 flex items-center justify-between gap-4 transition-colors hover:bg-white/10"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                      {tx.studentName}
                    </p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(29,29,31,0.42)" }}>
                      {time} • {date}
                    </p>
                    <p className="text-[11px] mt-1 truncate" style={{ color: "rgba(29,29,31,0.5)" }}>
                      {tx.course}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className={`text-[14px] font-bold ${isOutgoing ? "text-red-400" : "text-emerald-400"}`}>{amountLabel}</p>
                    <button
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{
                        background: "rgba(0, 113, 227, 0.14)",
                        border: "1px solid rgba(0, 113, 227, 0.22)",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}
                    >
                      Match with Student Bill
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-1 glass-card p-5 transition-all duration-200 hover:bg-white/5 hover:ring-1 hover:ring-white/20">
            <p className="text-[13px] font-semibold" style={{ color: "rgba(29,29,31,0.75)" }}>
              Matching Queue
            </p>
            <div
              className="mt-4 rounded-xl flex flex-col items-center justify-center text-center px-4 py-10"
              style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}
            >
              <FileCheck2 size={28} style={{ color: "rgba(29,29,31,0.35)" }} />
              <p className="text-[13px] font-semibold mt-3" style={{ color: "rgba(29,29,31,0.6)" }}>
                All transactions matched
              </p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(29,29,31,0.42)" }}>
                New unmatched items will appear here.
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
