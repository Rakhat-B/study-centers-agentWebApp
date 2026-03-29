"use client";

import { Activity } from "lucide-react";
import { mockCenterInsights } from "@/data/mock";
import { t } from "@/lib/i18n";
import WidgetTitleLink from "@/components/WidgetTitleLink";

export default function CenterIntelligence() {
  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#reports" title={t("intelligence.title", "Center Intelligence")} />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            {t("intelligence.subtitle", "Live insights feed")}
          </p>
        </div>
        <Activity size={16} style={{ color: "rgba(29,29,31,0.3)" }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {mockCenterInsights.map((item) => (
          <div
            key={item.id}
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            <p className="text-[11px]" style={{ color: "rgba(29,29,31,0.55)" }}>
              {t(`intelligence.${item.id}.label`, item.label)}
            </p>
            <p className="text-[14px] font-semibold mt-1" style={{ color: "var(--foreground)" }}>
              {item.value}
            </p>
            <p
              className="text-[11px] mt-0.5 font-medium"
              style={{
                color:
                  item.trendType === "up"
                    ? "rgb(22, 163, 74)"
                    : item.trendType === "down"
                    ? "rgb(225, 29, 72)"
                    : "rgba(29,29,31,0.55)",
              }}
            >
              {item.trendType === "up" ? "↑ " : item.trendType === "down" ? "↓ " : ""}
              {item.trend}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
