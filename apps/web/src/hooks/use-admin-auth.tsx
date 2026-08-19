
import { useState, useEffect } from 'react';
import { supabase, isAdminUser } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up admin auth hook");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        // Update session and user state immediately
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoggedIn(!!session);
        
        if (session && session.user) {
          // Defer admin check to prevent blocking
          setTimeout(async () => {
            try {
              console.log("Checking admin status for user:", session.user.id);
              const adminStatus = await isAdminUser(session.user.id);
              console.log("Admin status result:", adminStatus);
              setIsAdmin(adminStatus);
              
              if (adminStatus) {
                setAdminData({
                  id: session.user.id,
                  email: session.user.email || "",
                  isAdmin: true
                });
              }
            } catch (error) {
              console.error("Error checking admin status:", error);
              setIsAdmin(false);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setAdminData(null);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    const initializeSession = async () => {
      try {
        console.log("Initializing admin session");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session?.user?.id);
        
        // Update session and user state
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoggedIn(!!session);
        
        if (session?.user) {
          console.log("Checking admin status during init for user:", session.user.id);
          const adminStatus = await isAdminUser(session.user.id);
          console.log("Admin status check result:", adminStatus);
          setIsAdmin(adminStatus);
          
          if (adminStatus) {
            setAdminData({
              id: session.user.id,
              email: session.user.email || "",
              isAdmin: true
            });
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    // Setup refresh timer
    const refreshTimer = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Session refresh is handled automatically by Supabase
          console.log("Session refreshed successfully");
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshTimer);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error);
        toast({
          title: "Erreur",
          description: "Un problème est survenu lors de la déconnexion.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoggedIn(false);
      setIsAdmin(false);
      setAdminData(null);
      setSession(null);
      setUser(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de l'interface administrateur.",
      });
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Un problème inattendu est survenu lors de la déconnexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoggedIn,
    isAdmin,
    adminData,
    isLoading,
    session,
    user,
    handleLogout
  };
};
