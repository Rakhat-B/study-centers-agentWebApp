import Sidebar from "@/components/Sidebar";
import TodaysClasses from "@/components/TodaysClasses";
import PendingRegistration from "@/components/PendingRegistration";
import RecentPayments from "@/components/RecentPayments";
import AddStudentButton from "@/components/AddStudentButton";
import DateDisplay from "@/components/DateDisplay";

export default function Home() {
  return (
    <div className="flex h-full">
      {/* Persistent sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto px-8 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-[28px] font-bold tracking-tight leading-none"
              style={{ color: "var(--foreground)" }}
            >
              Dashboard
            </h1>
            <DateDisplay />
          </div>

          {/* Global Add Student CTA */}
          <AddStudentButton />
        </div>

        {/* Widget grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Today's Classes — full width */}
          <div className="col-span-2">
            <TodaysClasses />
          </div>

          {/* Pending Registration */}
          <PendingRegistration />

          {/* Recent Payments */}
          <RecentPayments />
        </div>
      </main>
    </div>
  );
}
