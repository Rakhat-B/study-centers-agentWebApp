"use client";

export default function DateDisplay() {
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <p
      className="text-[13px] mt-1.5"
      style={{ color: "rgba(29,29,31,0.45)" }}
      suppressHydrationWarning
    >
      {date}
    </p>
  );
}
