import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@menu/shared";
import { api, queryString } from "@/lib/api";
import { queryKeys } from "./queryKeys";
import type { AdminUser, AuditEntry } from "./types";

export function useAdminUsers(search: string, page = 1, pageSize = 25) {
  return useQuery({
    queryKey: queryKeys.users.admin(search, page),
    queryFn: () =>
      api.get<{ users: AdminUser[]; page: number; pageSize: number; total: number }>(
        `/api/admin/users${queryString({ search, page, pageSize })}`,
      ),
    placeholderData: (previous) => previous,
  });
}

export function useToggleUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      api.post<{ user: AdminUser }>(`/api/admin/users/${id}/${enable ? "enable" : "disable"}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export interface RoleAssignment {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () =>
      api.get<{ roles: RoleAssignment[] }>("/api/admin/roles").then((response) => response.roles),
  });
}

export function useGrantRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: UserRole }) =>
      api.post("/api/admin/roles", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: UserRole }) =>
      api.delete("/api/admin/roles", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useAuditLog(page = 1) {
  return useQuery({
    queryKey: queryKeys.audit(page),
    queryFn: () =>
      api
        .get<{ entries: AuditEntry[] }>(`/api/admin/audit${queryString({ page })}`)
        .then((response) => response.entries),
  });
}
