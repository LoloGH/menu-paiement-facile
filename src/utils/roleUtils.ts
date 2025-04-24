
import { supabase } from "@/integrations/supabase/client";
import type { AdminRoleType as SupabaseAdminRoleType } from "@/integrations/supabase/client";

// Re-export the AdminRoleType
export type AdminRoleType = SupabaseAdminRoleType;

// Also create a value object for AdminRoleTypes to use in the code
export const AdminRoleTypes = {
  ADMIN: 'admin',
  ORDER_MANAGER: 'order_manager',
  VIEWER: 'viewer'
} as const;

export interface UserRoleInfo {
  id: string;
  email: string;
  name?: string | null;
  created_at: string;
}

export interface RoleActionResult {
  success: boolean;
  message: string;
}

export const getRoleDisplayName = (role: string): string => {
  const displayNames: Record<string, string> = {
    'admin': 'Administrateur',
    'order_manager': 'Gestionnaire de commandes',
    'viewer': 'Visualiseur',
    'user': 'Utilisateur',
    'moderator': 'Modérateur'
  };
  
  return displayNames[role] || role;
};

export const fetchAdminUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersByRole(AdminRoleTypes.ADMIN);
};

export const fetchOrderManagerUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersByRole(AdminRoleTypes.ORDER_MANAGER);
};

export const fetchViewerUsers = async (): Promise<UserRoleInfo[]> => {
  return fetchUsersByRole(AdminRoleTypes.VIEWER);
};

const fetchUsersByRole = async (role: string): Promise<UserRoleInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        users (
          id,
          email,
          name,
          created_at
        )
      `)
      .eq('role', role);
      
    if (error) throw error;
    
    // Fix the mapping to correctly access user properties
    return data
      .filter(item => item.users)
      .map(item => ({
        id: item.user_id,
        email: item.users?.email || '',
        name: item.users?.name || null,
        created_at: item.users?.created_at || ''
      }));
  } catch (error) {
    console.error(`Error fetching ${role} users:`, error);
    return [];
  }
};

export const addRoleToUser = async (email: string, role: string): Promise<RoleActionResult> => {
  try {
    // First check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (userError) throw userError;
    
    if (!userData) {
      return {
        success: false,
        message: `Aucun utilisateur trouvé avec l'email ${email}`
      };
    }
    
    // Now check if the role assignment already exists
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userData.id)
      .eq('role', role)
      .maybeSingle();
      
    if (roleCheckError) throw roleCheckError;
    
    if (existingRole) {
      return {
        success: false,
        message: `L'utilisateur a déjà le rôle ${getRoleDisplayName(role)}`
      };
    }
    
    // Assign the role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.id,
        role
      });
      
    if (insertError) throw insertError;
    
    return {
      success: true,
      message: `Rôle ${getRoleDisplayName(role)} attribué à ${email}`
    };
  } catch (error: any) {
    console.error("Error adding role to user:", error);
    return {
      success: false,
      message: `Erreur lors de l'attribution du rôle: ${error.message}`
    };
  }
};

export const removeRoleFromUser = async (userId: string, role: string): Promise<RoleActionResult> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
      
    if (error) throw error;
    
    return {
      success: true,
      message: `Rôle ${getRoleDisplayName(role)} retiré avec succès`
    };
  } catch (error: any) {
    console.error("Error removing role from user:", error);
    return {
      success: false,
      message: `Erreur lors du retrait du rôle: ${error.message}`
    };
  }
};
