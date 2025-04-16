
import { useState, useEffect } from 'react';
import { supabase, isAdminUser } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminData {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const useAdminAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          // Store user login status immediately
          setIsLoggedIn(true);
          
          // Defer admin check to prevent blocking the UI
          setTimeout(async () => {
            // Check if the user has admin privileges using the user_roles table
            const adminStatus = await isAdminUser(session.user.id);
            setIsAdmin(adminStatus);
            
            setAdminData({
              id: session.user.id,
              email: session.user.email || "",
              isAdmin: adminStatus
            });
            setIsLoading(false);
          }, 0);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setAdminData(null);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Store user login status immediately
        setIsLoggedIn(true);
        
        // Check if user has admin privileges
        const adminStatus = await isAdminUser(session.user.id);
        setIsAdmin(adminStatus);
        
        setAdminData({
          id: session.user.id,
          email: session.user.email || "",
          isAdmin: adminStatus
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
    setIsAdmin(false);
    setAdminData(null);
    setIsLoading(false);
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de l'interface administrateur.",
    });
  };

  return {
    isLoggedIn,
    isAdmin,
    adminData,
    isLoading,
    handleLogout
  };
};
