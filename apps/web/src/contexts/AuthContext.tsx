import { useCallback, useMemo, type ReactNode } from "react";
import { AuthContext, type AuthContextValue, type CurrentUser } from "./auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@menu/shared";
import { api, apiRequest, ApiError } from "@/lib/api";

/**
 * One source of truth for who is signed in.
 *
 * Replaces `use-admin-auth` and `use-user-auth`, which each ran their own
 * `onAuthStateChange` listener, their own ten-minute refresh timer, and their
 * own copy of the session — so the two could disagree about the same user.
 * Here the server answers `GET /api/me` and React Query caches it.
 */

const ME_KEY = ["me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        // No automatic refresh here: an anonymous visitor would otherwise pay
        // for a pointless POST /api/auth/refresh on every page load. If the
        // access cookie has merely expired, the next real request refreshes it.
        const { user } = await apiRequest<{ user: CurrentUser }>("/api/me", {
          retryOnUnauthorised: false,
        });
        return user;
      } catch (error) {
        // Not signed in is an answer, not a failure: return null so the query
        // settles instead of retrying and flashing an error state.
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = data ?? null;

  const loginMutation = useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ user: CurrentUser }>("/api/auth/login", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  });

  const registerMutation = useMutation({
    mutationFn: (input: { email: string; password: string; name: string; phone?: string }) =>
      api.post<{ user: CurrentUser }>("/api/auth/register", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name: string; phone?: string }) => {
      await registerMutation.mutateAsync(input);
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    // Everything cached was fetched as the previous user; none of it may be
    // shown to whoever signs in next.
    queryClient.clear();
    queryClient.setQueryData(ME_KEY, null);
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ME_KEY });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const roles = user?.roles ?? [];
    return {
      user,
      roles,
      isLoading,
      isLoggedIn: user !== null,
      hasRole: (...wanted: UserRole[]) => wanted.some((role) => roles.includes(role)),
      isStaff: roles.length > 0,
      login,
      register,
      logout,
      refresh,
    };
  }, [user, isLoading, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

