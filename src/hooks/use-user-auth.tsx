import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

export const useUserAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
      console.log(`Fetching user data for ID: ${userId}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
        }
        return null;
      }
      
      console.log("User data retrieved:", data);
      return {
        id: data.id,
        email: data.email,
        fullName: data.name || "Utilisateur",
        phoneNumber: data.phone || "",
      };
    } catch (err) {
      console.error("Erreur lors de la récupération des données utilisateur:", err);
      return null;
    }
  };

  const createUserRecord = async (sessionUser: any) => {
    const fullName = sessionUser.user_metadata?.full_name || "";
    
    // Create user record if it doesn't exist
    try {
      console.log("Creating user record for:", sessionUser.id);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            id: sessionUser.id,
            email: sessionUser.email,
            name: fullName || "Utilisateur",
            phone: sessionUser.user_metadata?.phone || "",
          }
        ]);
        
      if (insertError) {
        console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
      }
      
      return {
        id: sessionUser.id,
        email: sessionUser.email || "",
        fullName: fullName || "Utilisateur",
        phoneNumber: sessionUser.user_metadata?.phone || "",
      };
    } catch (err) {
      console.error("Erreur lors de la création de l'utilisateur:", err);
      return {
        id: sessionUser.id,
        email: sessionUser.email || "",
        fullName: sessionUser.user_metadata?.full_name || "Utilisateur",
        phoneNumber: sessionUser.user_metadata?.phone || "",
      };
    }
  };

  const handleUserSession = async (session: Session | null) => {
    if (session && session.user) {
      console.log("Setting up session for user:", session.user.id);
      setIsLoggedIn(true);
      setSession(session);
      setUser(session.user);
      
      // Récupérer les données utilisateur de la base
      const userDataFromDb = await fetchUserData(session.user.id);
      
      if (!userDataFromDb) {
        // Si l'utilisateur n'existe pas, créer un nouvel enregistrement
        console.log("User record not found, creating new record");
        const newUserData = await createUserRecord(session.user);
        setUserData(newUserData);
      } else {
        setUserData(userDataFromDb);
      }
    } else {
      setIsLoggedIn(false);
      setUserData(null);
      setSession(null);
      setUser(null);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        await handleUserSession(session);
      }
    );

    // Then check for existing session
    const initializeSession = async () => {
      console.log("Checking current session");
      const { data: { session } } = await supabase.auth.getSession();
      await handleUserSession(session);
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
    console.log("Logging out");
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
  };

  const updateUserData = async (newData: Partial<UserData>): Promise<boolean> => {
    if (!userData || !userData.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour mettre à jour votre profil.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Mise à jour des données utilisateur:", newData);
      
      // Préparation des données pour la table users
      const usersData: any = {};
      
      if (newData.fullName) {
        usersData.name = newData.fullName;
      }
      
      if (newData.phoneNumber) {
        usersData.phone = newData.phoneNumber;
      }
      
      // Mise à jour de la table users
      if (Object.keys(usersData).length > 0) {
        console.log("Mise à jour de la table users avec:", usersData);
        const { error: usersError } = await supabase
          .from('users')
          .update(usersData)
          .eq('id', userData.id);
        
        if (usersError) {
          console.error("Erreur lors de la mise à jour de la table users:", usersError);
          throw usersError;
        }
      }
      
      // Mise à jour des métadonnées utilisateur dans Supabase Auth
      if (newData.fullName || newData.phoneNumber) {
        const metadataUpdate: any = {};
        
        if (newData.fullName) {
          metadataUpdate.full_name = newData.fullName;
        }
        
        if (newData.phoneNumber) {
          metadataUpdate.phone = newData.phoneNumber;
        }
        
        console.log("Mise à jour des métadonnées Auth avec:", { data: metadataUpdate });
        const { error: metadataError } = await supabase.auth.updateUser({ 
          data: metadataUpdate 
        });
        
        if (metadataError) {
          console.error("Erreur lors de la mise à jour des métadonnées:", metadataError);
          throw metadataError;
        }
      }
      
      // Mettre à jour l'état local immédiatement pour refléter les changements
      setUserData({
        ...userData,
        fullName: newData.fullName || userData.fullName,
        phoneNumber: newData.phoneNumber || userData.phoneNumber
      });
      
      // Rafraîchir les données utilisateur depuis la base après la mise à jour
      const refreshedData = await fetchUserData(userData.id);
      if (refreshedData) {
        setUserData(refreshedData);
      }
      
      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour avec succès.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isLoggedIn,
    userData,
    session,
    user,
    handleLogout,
    setUserData,
    updateUserData
  };
};
