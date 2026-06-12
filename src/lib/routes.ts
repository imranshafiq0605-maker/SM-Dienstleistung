import type { UserRole } from "@/types/creatorflow";

export function dashboardPathForRole(role: UserRole) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "company") return "/company/dashboard";
  return "/creator/dashboard";
}
