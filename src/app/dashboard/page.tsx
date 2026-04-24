import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardClient, { type DashboardStats } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [activeStudentsResult, leadsResult, totalGroupsResult] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "lead"),
    supabase
      .from("groups")
      .select("*", { count: "exact", head: true }),
  ]);

  if (activeStudentsResult.error || leadsResult.error || totalGroupsResult.error) {
    console.error("SUPABASE DASHBOARD METRICS ERROR", {
      activeStudentsError: activeStudentsResult.error,
      leadsError: leadsResult.error,
      totalGroupsError: totalGroupsResult.error,
    });
  }

  const stats: DashboardStats = {
    activeStudents: activeStudentsResult.count ?? 0,
    leadStudents: leadsResult.count ?? 0,
    totalGroups: totalGroupsResult.count ?? 0,
  };

  return <DashboardClient stats={stats} />;
}
