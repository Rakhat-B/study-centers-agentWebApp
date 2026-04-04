"use client";

import { CalendarClock, MapPin, Clock3 } from "lucide-react";
import WidgetTitleLink from "@/components/WidgetTitleLink";

const todaySchedule = [
  { id: "is1", className: "IELTS Advanced", time: "10:00 - 11:30", room: "A-101" },
  { id: "is2", className: "Grammar Workshop", time: "13:00 - 14:00", room: "B-204" },
  { id: "is3", className: "Speaking Lab", time: "16:30 - 18:00", room: "A-103" },
];

export default function InstructorSchedule() {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <WidgetTitleLink href="#my-schedule" title="Instructor Schedule" />
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(29,29,31,0.45)" }}>
            3 classes planned for today
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0, 113, 227, 0.14)", color: "var(--accent)" }}
        >
          <CalendarClock size={15} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {todaySchedule.map((item) => (
          <div
            key={item.id}
            className="rounded-xl px-3 py-2.5 flex items-center justify-between"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {item.className}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: "rgba(29,29,31,0.55)" }}>
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={10} />
                  {item.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={10} />
                  {item.room}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
