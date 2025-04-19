
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import UserProfile from "./pages/UserProfile";
import UserOrders from "./pages/UserOrders";
import AdminInterface from "./pages/AdminInterface";
import KitchenInterface from "./pages/KitchenInterface";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Écouter les événements de mise à jour du menu et invalider les requêtes
  useEffect(() => {
    const handleMenuUpdated = () => {
      console.log("Menu updated event detected, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyMenu'] });
    };
    
    window.addEventListener('menu-updated', handleMenuUpdated);
    
    return () => {
      window.removeEventListener('menu-updated', handleMenuUpdated);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/interface-admin" element={<AdminInterface />} />
            <Route path="/cuisine" element={<KitchenInterface />} />
            <Route path="/profil" element={<UserProfile />} />
            <Route path="/mes-commandes" element={<UserOrders />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
