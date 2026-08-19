import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@menu/shared";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied } from "@/components/admin/AccessDenied";

interface Props {
  children: ReactNode;
  /** Any one of these roles grants access. Omit to require only a session. */
  roles?: UserRole[];
}

/**
 * The single gate in front of every private route.
 *
 * Replaces the per-page `useEffect` checks, which mounted the protected screen
 * first and only then decided to navigate away — so an unauthorised visitor saw
 * the admin interface render, and its data queries fire, before being bounced.
 * Here nothing below the gate mounts until the answer is known.
 */
export function ProtectedRoute({ children, roles }: Props) {
  const { isLoggedIn, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-16 h-16 border-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"
          role="status"
          aria-label="Chargement"
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    // `state` lets the login screen send the visitor back where they were
    // heading, instead of dropping them on the home page.
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AccessDenied message="Votre compte n'a pas les droits nécessaires pour accéder à cette page." />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
