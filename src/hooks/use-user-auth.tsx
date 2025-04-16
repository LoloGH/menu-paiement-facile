
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

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        if (session && session.user) {
          setIsLoggedIn(true);
          
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error("Erreur lors de la récupération des données utilisateur:", error);
              
              const fullName = session.user.user_metadata?.name || "";
              const phone = session.user.user_metadata?.phone || "";
              
              // Create user record if it doesn't exist
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  { 
                    id: session.user.id,
                    email: session.user.email,
                    name: fullName || "Utilisateur",
                    phone: phone,
                  }
                ]);
                
              if (insertError) {
                console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
                toast({
                  title: "Erreur",
                  description: "Impossible d'enregistrer vos informations dans la base de données.",
                  variant: "destructive",
                });
              } else {
                console.log("Nouvel utilisateur ajouté à la base de données:", session.user.id);
              }
              
              setUserData({
                id: session.user.id,
                email: session.user.email || "",
                fullName: fullName || "Utilisateur",
                phoneNumber: phone || "",
              });
            } else {
              setUserData({
                id: data.id,
                email: data.email,
                fullName: data.name || "Utilisateur",
                phoneNumber: data.phone || "",
              });
            }
          } catch (err) {
            console.error("Erreur lors de la gestion des données utilisateur:", err);
            setUserData({
              id: session.user.id,
              email: session.user.email || "",
              fullName: session.user.user_metadata?.name || "Utilisateur",
              phoneNumber: session.user.user_metadata?.phone || "",
            });
          }
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
    );

    // Then check for existing session
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session?.user?.id);
      
      if (session && session.user) {
        setIsLoggedIn(true);
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Erreur lors de la récupération des données utilisateur:", error);
            
            const fullName = session.user.user_metadata?.name || "";
            const phone = session.user.user_metadata?.phone || "";
            
            // Create user record if it doesn't exist
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                { 
                  id: session.user.id,
                  email: session.user.email,
                  name: fullName || "Utilisateur",
                  phone: phone,
                }
              ]);
              
            if (insertError) {
              console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
              toast({
                title: "Erreur",
                description: "Impossible d'enregistrer vos informations dans la base de données.",
                variant: "destructive",
              });
            } else {
              console.log("Nouvel utilisateur ajouté à la base de données:", session.user.id);
            }
            
            setUserData({
              id: session.user.id,
              email: session.user.email || "",
              fullName: fullName || "Utilisateur",
              phoneNumber: phone || "",
            });
          } else {
            setUserData({
              id: data.id,
              email: data.email,
              fullName: data.name || "Utilisateur",
              phoneNumber: data.phone || "",
            });
          }
        } catch (err) {
          console.error("Erreur lors de la gestion des données utilisateur:", err);
          setUserData({
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.user_metadata?.name || "Utilisateur",
            phoneNumber: session.user.user_metadata?.phone || "",
          });
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
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
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de votre compte.",
      });
    } catch (err) {
      console.error("Exception lors de la déconnexion:", err);
      toast({
        title: "Erreur",
        description: "Un problème inattendu est survenu lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  return {
    isLoggedIn,
    userData,
    handleLogout,
    setUserData
  };
};
