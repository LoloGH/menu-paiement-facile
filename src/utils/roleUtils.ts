
import { supabase } from "@/integrations/supabase/client";

export type UserRoleInfo = {
  id: string;
  email: string;
  role: string;
};

export enum AdminRoleType {
  ADMIN = 'admin',
  ORDER_MANAGER = 'order_manager',
  VIEWER = 'viewer'
}

// Fonction pour récupérer tous les utilisateurs avec un rôle spécifique
export const fetchUsersWithRole = async (role: string): Promise<UserRoleInfo[]> => {
  try {
    const { data, error } = await (supabase.rpc as any)('get_users_with_role', {
      role_name: role
    });

    if (error) {
      console.error(`Erreur lors du chargement des utilisateurs avec le rôle ${role}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Erreur lors du chargement des utilisateurs avec le rôle ${role}:`, error);
    return [];
  }
};

// Fonction pour récupérer tous les utilisateurs avec le rôle admin
export const fetchAdminUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersWithRole(AdminRoleType.ADMIN);
};

// Fonction pour récupérer tous les utilisateurs avec le rôle gestionnaire de commandes
export const fetchOrderManagerUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersWithRole(AdminRoleType.ORDER_MANAGER);
};

// Fonction pour récupérer tous les utilisateurs avec le rôle visualiseur
export const fetchViewerUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersWithRole(AdminRoleType.VIEWER);
};

// Fonction pour ajouter un utilisateur avec un rôle spécifique
export const addRoleToUser = async (email: string, role: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await (supabase.rpc as any)('add_role_to_user_by_email', {
      user_email: email,
      role_name: role
    });

    if (error) {
      return { 
        success: false, 
        message: error.message || `Erreur lors de l'ajout du rôle ${role}` 
      };
    }

    return { 
      success: true, 
      message: `Droits ${role} attribués avec succès.` 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      message 
    };
  }
};

// Fonction pour ajouter un utilisateur en tant qu'admin
export const addAdminRole = async (email: string): Promise<{ success: boolean; message: string }> => {
  return addRoleToUser(email, AdminRoleType.ADMIN);
};

// Fonction pour supprimer un rôle d'un utilisateur
export const removeRoleFromUser = async (userId: string, role: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await (supabase.rpc as any)('remove_role_from_user', {
      user_id: userId,
      role_name: role
    });

    if (error) {
      return { 
        success: false, 
        message: error.message || `Erreur lors de la suppression du rôle ${role}` 
      };
    }

    return { 
      success: true, 
      message: `Droits ${role} retirés avec succès.` 
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
  return removeRoleFromUser(userId, AdminRoleType.ADMIN);
};

// Fonction pour obtenir le nom lisible d'un rôle
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case AdminRoleType.ADMIN:
      return "Admin principal";
    case AdminRoleType.ORDER_MANAGER:
      return "Gestionnaire de commandes";
    case AdminRoleType.VIEWER:
      return "Visualiseur";
    default:
      return role;
  }
};
