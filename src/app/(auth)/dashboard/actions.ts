"use server";

import { createClient } from "@/utils/supabase/server";

export interface EmployeePerformance {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  totalAssigned: number;
  inProgress: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export async function getEmployeePerformance(): Promise<EmployeePerformance[]> {
  try {
    const supabase = await createClient();

    // Get all profiles (employees) with their ticket statistics
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url, role")
      .in("role", ["technician", "manager"]); // Only show technical staff

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Get ticket statistics for each employee
    const employeeStats = await Promise.all(
      profiles.map(async (profile) => {
        // Count total assigned tickets
        const { count: totalAssigned } = await supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", profile.user_id);

        // Count in progress tickets
        const { count: inProgress } = await supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", profile.user_id)
          .eq("status", "in_progress");

        // Count completed tickets
        const { count: completed } = await supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", profile.user_id)
          .eq("status", "completed");

        // Count pending tickets
        const { count: pending } = await supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", profile.user_id)
          .eq("status", "pending");

        // Calculate completion rate
        const total = totalAssigned || 0;
        const completedCount = completed || 0;
        const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

        return {
          id: profile.user_id,
          fullName: profile.full_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          totalAssigned: total,
          inProgress: inProgress || 0,
          completed: completedCount,
          pending: pending || 0,
          completionRate,
        };
      }),
    );

    return employeeStats;
  } catch (error) {
    console.error("Error in getEmployeePerformance:", error);
    return [];
  }
}
