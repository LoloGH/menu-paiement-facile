import { useState, useEffect } from 'react';
import { supabase, isAdminUser } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { useSessionRefresh } from "@/hooks/use-session-refresh";

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

  useSessionRefresh({
    onSessionChange: (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);

      if (session && session.user) {
        setTimeout(async () => {
          try {
            const adminStatus = await isAdminUser(session.user.id);
            setIsAdmin(adminStatus);
            if (adminStatus) {
              setAdminData({
                id: session.user.id,
                email: session.user.email || "",
                isAdmin: true
              });
            }
          } catch (error) {
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
  });

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
