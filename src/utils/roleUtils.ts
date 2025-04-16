
import { supabase } from "@/integrations/supabase/client";

export type UserRoleInfo = {
  id: string;
  email: string;
  role: string;
};

// Fonction pour récupérer tous les utilisateurs avec le rôle admin
export const fetchAdminUsers = async (): Promise<UserRoleInfo[]> => {
  try {
    // Appel à une fonction sur mesure via RPC qui récupère tous les utilisateurs admin
    // Use type assertion to bypass TypeScript's strict checking
    const { data, error } = await (supabase.rpc('get_users_with_role', {
      role_name: 'admin'
    }) as unknown as Promise<{data: UserRoleInfo[], error: null} | {data: null, error: Error}>);

    if (error) {
      console.error("Erreur lors du chargement des administrateurs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erreur lors du chargement des administrateurs:", error);
    return [];
  }
};

// Fonction pour ajouter un utilisateur en tant qu'admin
export const addAdminRole = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Appel à une fonction RPC pour ajouter un rôle admin à un utilisateur par email
    // Use type assertion to bypass TypeScript's strict checking
    const { data, error } = await (supabase.rpc('add_role_to_user_by_email', {
      user_email: email,
      role_name: 'admin'
    }) as unknown as Promise<{data: boolean, error: null} | {data: null, error: {message: string}}>);

    if (error) {
      return { 
        success: false, 
        message: error.message 
      };
    }

    return { 
      success: true, 
      message: "Droits administrateur attribués avec succès." 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      message 
    };
  }
};

// Fonction pour supprimer un rôle admin
export const removeAdminRole = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Appel à une fonction RPC pour supprimer un rôle
    // Use type assertion to bypass TypeScript's strict checking
    const { data, error } = await (supabase.rpc('remove_role_from_user', {
      user_id: userId,
      role_name: 'admin'
    }) as unknown as Promise<{data: boolean, error: null} | {data: null, error: {message: string}}>);

    if (error) {
      return { 
        success: false, 
        message: error.message 
      };
    }

    return { 
      success: true, 
      message: "Droits administrateur retirés avec succès." 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      message 
    };
  }
};
