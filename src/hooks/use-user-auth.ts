
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "./use-toast";

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
}

export const useUserAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoggedIn(!!session);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              setUserData({
                id: session.user.id,
                email: session.user.email || data?.email || '',
                fullName: data?.name || session.user.user_metadata?.full_name || '',
                phoneNumber: data?.phone || session.user.phone || ''
              });
            } catch (error) {
              console.error("Error fetching user data:", error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUserData(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoggedIn(!!session);
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          
          setUserData({
            id: session.user.id,
            email: session.user.email || data?.email || '',
            fullName: data?.name || session.user.user_metadata?.full_name || '',
            phoneNumber: data?.phone || session.user.phone || ''
          });
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    return () => {
      subscription.unsubscribe();
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
      setUserData(null);
      setSession(null);
      setUser(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de votre compte.",
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

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!isLoggedIn || !userData) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour mettre à jour vos informations.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.fullName,
          phone: updates.phoneNumber,
          email: updates.email
        })
        .eq('id', userData.id);
        
      if (error) throw error;
      
      setUserData({ ...userData, ...updates });
      
      toast({
        title: "Succès",
        description: "Vos informations ont été mises à jour.",
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la mise à jour de vos informations.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isLoggedIn,
    userData,
    isLoading,
    session,
    user,
    handleLogout,
    setUserData,
    updateUserData
  };
};
