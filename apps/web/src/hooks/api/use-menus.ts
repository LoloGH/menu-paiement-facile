import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { queryKeys } from "./queryKeys";
import type { Article, Menu } from "./types";

/** The published week. Public: no session required. */
export function useCurrentMenus(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.menus.current(from, to),
    queryFn: () =>
      api
        .get<{ menus: Menu[] }>(`/api/menus/current${queryString({ from, to })}`)
        .then((response) => response.menus),
    staleTime: 60 * 1000,
  });
}

export function usePublicArticles() {
  return useQuery({
    queryKey: queryKeys.articles.public,
    queryFn: () =>
      api.get<{ articles: Article[] }>("/api/articles").then((response) => response.articles),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminArticles(search?: string) {
  return useQuery({
    queryKey: queryKeys.articles.admin(search),
    queryFn: () =>
      api
        .get<{ articles: Article[] }>(`/api/admin/articles${queryString({ search })}`)
        .then((response) => response.articles),
  });
}

export interface ArticlePayload {
  name: string;
  description?: string | null;
  type: Article["type"];
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
}

export function useSaveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ArticlePayload & { id?: string }) =>
      id
        ? api.put<{ article: Article }>(`/api/admin/articles/${id}`, payload)
        : api.post<{ article: Article }>("/api/admin/articles", payload),
    // Menus embed article names and prices, so both caches go stale together.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

export function useRetireArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ article: Article }>(`/api/admin/articles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

export function useAdminMenus() {
  return useQuery({
    queryKey: queryKeys.menus.all,
    queryFn: () =>
      api
        .get<{ menus: Omit<Menu, "items">[] }>("/api/admin/menus")
        .then((response) => response.menus),
  });
}

export interface MenuPayload {
  serviceDate: string;
  isPublished: boolean;
  items: { articleId: string; priceOverride?: number | null; position: number }[];
}

export function useSaveMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MenuPayload) => api.put<{ menu: Menu }>("/api/admin/menus", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.menus.all }),
  });
}
