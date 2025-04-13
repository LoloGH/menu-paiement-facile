
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import { buttonVariants } from "./components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Add admin link to the navigation */}
        <nav className="p-4 bg-gray-100 flex justify-between items-center">
          <div className="flex space-x-4">
            <Link to="/" className={buttonVariants({ variant: "ghost" })}>
              Accueil
            </Link>
            <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Interface Admin
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
