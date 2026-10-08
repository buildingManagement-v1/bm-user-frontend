import type { Manager } from "~/types/manager";
import type { ManagerRole } from "~/types/manager";

/**
 * Mirrors the backend's ManagerRolesGuard: owners can do everything in their
 * buildings, managers only what their roles in the selected building allow.
 * Roles come from the login snapshot; the backend re-checks every request.
 */
export function usePermissions() {
  const { user, userType } = useAuth();
  const { selectedBuildingId } = useSelectedBuilding();

  const isOwner = computed(() => userType.value === "user");

  const roles = computed<ManagerRole[]>(() => {
    if (userType.value !== "manager" || !user.value) return [];
    const assignments = (user.value as Manager).buildings ?? [];
    const current = assignments.find(
      (b) => b.buildingId === selectedBuildingId.value
    );
    // Before a building is chosen, show what any of their buildings allow
    return current
      ? current.roles
      : [...new Set(assignments.flatMap((b) => b.roles))];
  });

  /** True for owners, or managers holding any of the given roles */
  const can = (...required: ManagerRole[]) =>
    isOwner.value || required.some((role) => roles.value.includes(role));

  return { isOwner, roles, can };
}
