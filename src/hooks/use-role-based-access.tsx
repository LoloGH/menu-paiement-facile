
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
        const [isAdmin, isOrderManager, isViewer] = await Promise.all([
          hasUserRole(userId, AdminRoleType.ADMIN),
          hasUserRole(userId, AdminRoleType.ORDER_MANAGER),
          hasUserRole(userId, AdminRoleType.VIEWER),
        ]);
        
        // Admin principal (accès total)
        if (isAdmin) {
          setPermissions({
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
            isLoading: false,
          });
          return;
        }
        
        // Gestionnaire de commandes (accès uniquement à la partie commande)
        if (isOrderManager) {
          setPermissions({
            canViewDashboard: true,
            canViewUsers: false,
            canManageUsers: false,
            canViewOrders: true,
            canManageOrders: true,
            canViewArticles: false,
            canManageArticles: false,
            canViewMenus: false,
            canManageMenus: false,
            canManageRoles: false,
            isLoading: false,
          });
          return;
        }
        
        // Visualiseur (lecture seule)
        if (isViewer) {
          setPermissions({
            canViewDashboard: true,
            canViewUsers: true,
            canManageUsers: false,
            canViewOrders: true,
            canManageOrders: false,
            canViewArticles: true,
            canManageArticles: false,
            canViewMenus: true,
            canManageMenus: false,
            canManageRoles: false,
            isLoading: false,
          });
          return;
        }
        
        // Aucun rôle spécifique
        setPermissions({
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
        });
        
      } catch (error) {
        console.error("Error loading permissions:", error);
        setPermissions(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadPermissions();
  }, [isLoggedIn, adminData, authLoading]);
  
  return permissions;
};
