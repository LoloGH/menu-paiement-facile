
import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { hasUserRole } from '@/integrations/supabase/client';
import { AdminRoleType } from '@/utils/roleUtils';

export interface UserPermissions {
  canViewDashboard: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewArticles: boolean;
  canManageArticles: boolean;
  canViewMenus: boolean;
  canManageMenus: boolean;
  canManageRoles: boolean;
  isLoading: boolean;
}

export const useRoleBasedAccess = () => {
  const { isLoggedIn, adminData, isLoading: authLoading } = useAdminAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewDashboard: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewOrders: false,
    canManageOrders: false,
    canViewArticles: false,
    canManageArticles: false,
    canViewMenus: false,
    canManageMenus: false,
    canManageRoles: false,
    isLoading: true,
  });
  
  useEffect(() => {
    const loadPermissions = async () => {
      if (authLoading || !isLoggedIn || !adminData) {
        setPermissions(prev => ({ ...prev, isLoading: authLoading }));
        return;
      }
      
      try {
        const userId = adminData.id;
        
        // Vérifier chaque rôle séparément, car un utilisateur peut avoir plusieurs rôles
        const [isAdmin, isOrderManager, isViewer] = await Promise.all([
          hasUserRole(userId, AdminRoleType.ADMIN),
          hasUserRole(userId, AdminRoleType.ORDER_MANAGER),
          hasUserRole(userId, AdminRoleType.VIEWER),
        ]);
        
        // Initialiser les permissions par défaut
        let updatedPermissions = {
          canViewDashboard: false,
          canViewUsers: false,
          canManageUsers: false,
          canViewOrders: false,
          canManageOrders: false,
          canViewArticles: false,
          canManageArticles: false,
          canViewMenus: false,
          canManageMenus: false,
          canManageRoles: false,
          isLoading: false,
        };
        
        // Appliquer les permissions pour chaque rôle que l'utilisateur possède
        if (isAdmin) {
          // Administrateur (accès total)
          updatedPermissions = {
            ...updatedPermissions,
            canViewDashboard: true,
            canViewUsers: true,
            canManageUsers: true,
            canViewOrders: true,
            canManageOrders: true,
            canViewArticles: true,
            canManageArticles: true,
            canViewMenus: true,
            canManageMenus: true,
            canManageRoles: true,
          };
        }
        
        if (isOrderManager) {
          // Gestionnaire de commandes
          updatedPermissions = {
            ...updatedPermissions,
            canViewDashboard: true,
            canViewOrders: true,
            canManageOrders: true,
          };
        }
        
        if (isViewer) {
          // Visualiseur (lecture seule)
          updatedPermissions = {
            ...updatedPermissions,
            canViewDashboard: true,
            canViewUsers: true,
            canViewOrders: true,
            canViewArticles: true,
            canViewMenus: true,
          };
        }
        
        setPermissions(updatedPermissions);
        
      } catch (error) {
        console.error("Error loading permissions:", error);
        setPermissions(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadPermissions();
  }, [isLoggedIn, adminData, authLoading]);
  
  return permissions;
};
