/**
 * Every cache key in one place, so an invalidation cannot miss a query because
 * its key was spelled differently at the call site.
 */
export const queryKeys = {
  me: ["me"] as const,
  menus: {
    current: (from?: string, to?: string) => ["menus", "current", from ?? null, to ?? null] as const,
    byDate: (date: string) => ["menus", "date", date] as const,
    all: ["menus"] as const,
  },
  articles: {
    public: ["articles", "public"] as const,
    admin: (search?: string) => ["articles", "admin", search ?? ""] as const,
    all: ["articles"] as const,
  },
  orders: {
    mine: ["orders", "mine"] as const,
    one: (id: string) => ["orders", id] as const,
    admin: (filters: Record<string, unknown>) => ["orders", "admin", filters] as const,
    all: ["orders"] as const,
  },
  users: {
    admin: (search: string, page: number) => ["users", "admin", search, page] as const,
    all: ["users"] as const,
  },
  roles: ["roles"] as const,
  audit: (page: number) => ["audit", page] as const,
} as const;
