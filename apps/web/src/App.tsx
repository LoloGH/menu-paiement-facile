import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError } from "@/lib/api";
import Index from "./pages/Index";

/*
 * Only the public menu is bundled eagerly. The back office pulls in recharts
 * and jspdf, which a visitor who just wants to see today's menu should never
 * have to download.
 */
const Admin = lazy(() => import("./pages/AdminInterface"));
const KitchenInterface = lazy(() => import("./pages/KitchenInterface"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const UserOrders = lazy(() => import("./pages/UserOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetching on focus made every tab switch re-query the whole admin
      // screen; the SSE stream is what keeps live data fresh.
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        // Retrying a 4xx just repeats a request the server already refused.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

function PageLoader() {
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

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />

                  <Route
                    path="/profil"
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mes-commandes"
                    element={
                      <ProtectedRoute>
                        <UserOrders />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/interface-admin"
                    element={
                      <ProtectedRoute roles={["admin", "order_manager", "viewer"]}>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cuisine"
                    element={
                      <ProtectedRoute roles={["admin", "order_manager", "kitchen"]}>
                        <KitchenInterface />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
