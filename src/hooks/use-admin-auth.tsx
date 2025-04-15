
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminData {
  id: string;
  email: string;
}

export const useAdminAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          // We'll consider any authenticated user as an admin for now
          // In a real app, you would check if the user has admin role
          setIsLoggedIn(true);
          setAdminData({
            id: session.user.id,
            email: session.user.email || ""
          });
        } else {
          setIsLoggedIn(false);
          setAdminData(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Consider any authenticated user as an admin for now
        setIsLoggedIn(true);
        setAdminData({
          id: session.user.id,
          email: session.user.email || ""
        });
      }
      setIsLoading(false);
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Erreur de déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la déconnexion.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoggedIn(false);
    setAdminData(null);
    setIsLoading(false);
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de l'interface administrateur.",
    });
  };

  return {
    isLoggedIn,
    adminData,
    isLoading,
    handleLogout
  };
};
