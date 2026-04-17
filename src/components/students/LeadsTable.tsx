"use client";

import { MessageCircle, PartyPopper } from "lucide-react";
import type { Student } from "@/data/mock";

export type WhatsAppLead = {
  id: string;
  name: string;
  phone: string;
  course: string;
  gender?: "male" | "female" | "other";
  lastMessagedAt: string;
};

type LeadsTableProps = {
  leads: WhatsAppLead[];
  onReviewAdd: (lead: WhatsAppLead) => void;
};

function formatLastMessaged(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toWhatsAppLink(phone: string) {
  const normalized = phone.replace(/\D/g, "");
  return `https://wa.me/${normalized}`;
}

export function studentToWhatsAppLead(student: Student): WhatsAppLead {
  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    course: student.course,
    gender: student.gender,
    lastMessagedAt: student.registeredAt,
  };
}

export default function LeadsTable({ leads, onReviewAdd }: LeadsTableProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200">
      <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-semibold text-slate-500 bg-slate-50">
        <div className="col-span-3">Name</div>
        <div className="col-span-2">Phone</div>
        <div className="col-span-3">Interested In (Course)</div>
        <div className="col-span-2">Last Time Messaged</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      <div className="divide-y divide-slate-100">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 transition-colors"
          >
            <div className="col-span-3 min-w-0">
              <p className="text-[13px] font-semibold truncate text-slate-900">{lead.name}</p>
            </div>

            <div className="col-span-2 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[12px] truncate text-slate-600">{lead.phone}</p>
                <a
                  href={toWhatsAppLink(lead.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 -m-2 text-green-500 hover:text-green-600 transition-colors"
                  aria-label={`Open WhatsApp chat with ${lead.name}`}
                >
                  <MessageCircle className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="col-span-3 min-w-0">
              <p className="text-[12px] truncate text-slate-700">{lead.course}</p>
            </div>

            <div className="col-span-2 min-w-0">
              <p className="text-[12px] truncate text-slate-600">{formatLastMessaged(lead.lastMessagedAt)}</p>
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => onReviewAdd(lead)}
                className="h-8 px-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-[11px] font-semibold"
              >
                Review & Add
              </button>
            </div>
          </div>
        ))}

        {leads.length === 0 ? (
          <div className="px-4 py-10 flex flex-col items-center justify-center text-center text-slate-500">
            <PartyPopper className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-[13px] font-semibold text-slate-700">All caught up!</p>
            <p className="text-[12px]">No WhatsApp leads waiting for review.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
