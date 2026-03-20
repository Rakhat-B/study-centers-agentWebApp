"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

export default function AddStudentButton() {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    // Reset after animation
    setTimeout(() => setClicked(false), 1200);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-[14px] tracking-tight transition-all duration-200"
      style={{
        background: clicked
          ? "linear-gradient(135deg, #005bb8 0%, #2899c8 100%)"
          : "linear-gradient(135deg, #0071e3 0%, #34aadc 100%)",
        color: "white",
        boxShadow: clicked
          ? "0 2px 12px rgba(0, 113, 227, 0.25)"
          : "0 4px 20px rgba(0, 113, 227, 0.38)",
        transform: clicked ? "scale(0.97)" : "scale(1)",
        border: "none",
        cursor: "pointer",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={(e) => {
        if (!clicked) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 24px rgba(0, 113, 227, 0.5)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (!clicked) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(0, 113, 227, 0.38)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }
      }}
    >
      <UserPlus size={16} strokeWidth={2.2} />
      Add Student
    </button>
  );
}
