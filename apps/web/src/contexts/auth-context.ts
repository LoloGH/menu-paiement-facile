import { createContext } from "react";
import type { UserRole } from "@menu/shared";

/**
 * The context object lives apart from the provider component so that editing
 * either one does not force a full reload during development.
 */

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  loyaltyNumber: string | null;
  roles: UserRole[];
}

export interface AuthContextValue {
  user: CurrentUser | null;
  roles: UserRole[];
  isLoading: boolean;
  isLoggedIn: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  /** True for any back-office role. */
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
