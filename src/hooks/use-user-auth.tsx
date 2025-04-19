
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

export const useUserAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        ])
        .select();
        
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

  const handleUserSession = async (session: any) => {
    try {
      if (session && session.user) {
        console.log("Session user:", session.user);
        setIsLoggedIn(true);
        
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
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la session:", error);
      setIsLoggedIn(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // L'ordre est important : d'abord configurer l'écouteur d'événements, puis vérifier la session existante
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, "Session:", session ? "exists" : "null");
        
        // Mise à jour synchrone de l'état pour éviter les blocages
        setIsLoading(true);
        
        if (session) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
        
        // Déférer le traitement asynchrone
        setTimeout(() => {
          handleUserSession(session);
        }, 0);
      }
    );

    // Vérifier la session existante
    const checkCurrentSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        await handleUserSession(data.session);
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        setIsLoading(false);
      }
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    console.log("Logging out");
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
        setIsLoading(false);
        return;
      }
      
      // La session sera mise à jour via onAuthStateChange
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de votre compte.",
      });
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la déconnexion.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
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
    isLoading,
    handleLogout,
    setUserData,
    updateUserData
  };
};
