import { useMemo } from "react";
import type { UserRole } from "@menu/shared";
import { useAuth } from "@/hooks/use-auth";

/**
 * What the signed-in user may see, derived from the roles already carried by
 * the session.
 *
 * This decides rendering only. The old hook fired three `has_role` round-trips
 * on every mount to build the same table, and — more importantly — the answer
 * was the only thing standing between a user and an admin screen. The server
 * now enforces the same rules on every route, so being wrong here shows or
 * hides a button, it does not grant anything.
 */
export interface Permissions {
  canViewDashboard: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewKitchen: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewCatalogue: boolean;
  canManageCatalogue: boolean;
  canManageRoles: boolean;
  canConfirmPayments: boolean;
  canViewAudit: boolean;
}

const NONE: Permissions = {
  canViewDashboard: false,
  canViewOrders: false,
  canManageOrders: false,
  canViewKitchen: false,
  canViewUsers: false,
  canManageUsers: false,
  canViewCatalogue: false,
  canManageCatalogue: false,
  canManageRoles: false,
  canConfirmPayments: false,
  canViewAudit: false,
};

export function permissionsFor(roles: UserRole[]): Permissions {
  const has = (role: UserRole) => roles.includes(role);
  const admin = has("admin");

  return {
    canViewDashboard: admin || has("order_manager") || has("viewer"),
    canViewOrders: admin || has("order_manager") || has("viewer") || has("kitchen"),
    canManageOrders: admin || has("order_manager"),
    canViewKitchen: admin || has("order_manager") || has("kitchen"),
    canViewUsers: admin || has("viewer"),
    canManageUsers: admin,
    canViewCatalogue: admin || has("order_manager") || has("viewer") || has("kitchen"),
    canManageCatalogue: admin,
    canManageRoles: admin,
    canConfirmPayments: admin || has("order_manager"),
    canViewAudit: admin,
  };
}

export function usePermissions(): Permissions & { isLoading: boolean } {
  const { roles, isLoading } = useAuth();
  return useMemo(
    () => ({ ...(isLoading ? NONE : permissionsFor(roles)), isLoading }),
    [roles, isLoading],
  );
}
