
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
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
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

  const handleUserSession = async (session: any) => {
    if (session && session.user) {
      setIsLoggedIn(true);
      
      // Récupérer les données utilisateur de la base
      const userDataFromDb = await fetchUserData(session.user.id);
      
      if (!userDataFromDb) {
        // Si l'utilisateur n'existe pas, créer un nouvel enregistrement
        const newUserData = await createUserRecord(session.user);
        setUserData(newUserData);
      } else {
        setUserData(userDataFromDb);
      }
    } else {
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleUserSession(session);
      }
    );

    // Then check for existing session
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleUserSession(session);
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
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
      // Mettre à jour les métadonnées utilisateur dans Supabase Auth
      if (newData.fullName || newData.phoneNumber) {
        const authUpdate: any = { data: {} };
        
        if (newData.fullName) {
          authUpdate.data.full_name = newData.fullName;
        }
        
        if (newData.phoneNumber) {
          authUpdate.data.phone = newData.phoneNumber;
        }
        
        const { error: metadataError } = await supabase.auth.updateUser(authUpdate);
        
        if (metadataError) {
          console.error("Erreur lors de la mise à jour des métadonnées:", metadataError);
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour les informations d'authentification.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      // Mettre à jour la table users
      const updateData: any = {};
      
      if (newData.fullName) {
        updateData.name = newData.fullName;
      }
      
      if (newData.phoneNumber) {
        updateData.phone = newData.phoneNumber;
      }
      
      if (Object.keys(updateData).length > 0) {
        console.log("Mise à jour de la table users avec:", updateData);
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userData.id);
        
        if (error) {
          console.error("Erreur lors de la mise à jour de la table users:", error);
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour la base de données utilisateurs.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      // Mettre à jour l'état local
      setUserData({
        ...userData,
        fullName: newData.fullName || userData.fullName,
        phoneNumber: newData.phoneNumber || userData.phoneNumber
      });
      
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
    handleLogout,
    setUserData,
    updateUserData
  };
};
