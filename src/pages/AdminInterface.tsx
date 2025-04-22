import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu, Search, ShieldAlert, UtensilsCrossed, ChevronLeft, LogIn, LogOut, Users, FileText, RefreshCw, History, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLoginDialog } from "@/components/admin/AdminLoginDialog";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { MenuDay } from "@/components/admin/menu-editor/types";
import { weeklyMenu } from "@/data/menuData";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserTable } from "@/components/admin/UserTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderItemsTable } from "@/components/admin/OrderItemsTable";
import { ArticlesManager } from "@/components/admin/articles/ArticlesManager";
import { MenuEditor } from "@/components/admin/menu-editor/MenuEditor";
import { HomepageEditor } from "@/components/admin/homepage-editor/HomepageEditor";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { useRoleBasedAccess } from "@/hooks/use-role-based-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { StatCard } from "@/components/admin/stats/StatCard";
import { DashboardStats } from "@/components/admin/stats/DashboardStats";
import { logAdminAction } from "@/integrations/supabase/client";

const AdminInterface = () => {
  const { isLoggedIn, isAdmin, adminData, isLoading, handleLogout } = useAdminAuth();
  const { toast } = useToast();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    canViewDashboard,
    canViewUsers,
    canManageUsers,
    canViewOrders,
    canManageOrders,
    canViewArticles,
    canManageArticles,
    canViewMenus,
    canManageMenus,
    canManageRoles,
    isLoading: permissionsLoading,
  } = useRoleBasedAccess();

  if (isLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-restaurant-purple text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-md mr-3">
                  <img 
                    src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                    alt="Logo"
                    className="h-10 w-auto"
                  />
                </div>
                <h1 className="text-2xl font-bold">Administration</h1>
              </div>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto flex flex-col items-center justify-center py-20 px-4">
          <ShieldAlert className="w-20 h-20 text-restaurant-red mb-6" />
          <h1 className="text-3xl font-bold mb-3">Connexion administrateur requise</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Vous devez vous connecter pour accéder à l'interface d'administration.
          </p>
          <Button onClick={() => setIsLoginDialogOpen(true)} className="bg-restaurant-purple">
            <LogIn className="h-4 w-4 mr-2" />
            Se connecter
          </Button>
          
          <AdminLoginDialog 
            isOpen={isLoginDialogOpen} 
            onClose={() => setIsLoginDialogOpen(false)} 
          />
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-restaurant-purple text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-md mr-3">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                  alt="Logo"
                  className="h-10 w-auto"
                />
              </div>
              <h1 className="text-2xl font-bold">Administration</h1>
            </div>
            <div className="flex items-center gap-4">
              {adminData && (
                <div className="text-sm">
                  Connecté en tant que <span className="font-semibold">{adminData.email}</span>
                </div>
              )}
              
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
              
              <Button variant="outline" onClick={() => window.location.href = "/"} size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="mb-4 w-full flex items-center justify-center">
                  <Menu className="h-4 w-4 mr-2" />
                  Menu d'administration
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4">
                  <Link to="/cuisine" className="flex w-full items-center p-2 rounded-md hover:bg-gray-100 mb-2 text-restaurant-purple">
                    <UtensilsCrossed className="h-5 w-5 mr-3" />
                    Interface cuisine
                  </Link>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Card className="w-64 h-fit sticky top-4">
              <CardContent className="p-4">
                <Link to="/cuisine" className="flex w-full items-center p-2 rounded-md hover:bg-gray-100 mb-2 text-restaurant-purple">
                  <UtensilsCrossed className="h-5 w-5 mr-3" />
                  Interface cuisine
                </Link>
              </CardContent>
            </Card>
          )}
          
          <div className="flex-1">
            <Tabs defaultValue="dashboard">
              <TabsList className="mb-4 flex flex-wrap">
                {canViewDashboard && (
                  <TabsTrigger value="dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </TabsTrigger>
                )}
                {canViewUsers && (
                  <TabsTrigger value="users">
                    <Users className="h-4 w-4 mr-2" />
                    Utilisateurs
                  </TabsTrigger>
                )}
                {canViewOrders && (
                  <TabsTrigger value="orders">
                    <FileText className="h-4 w-4 mr-2" />
                    Commandes
                  </TabsTrigger>
                )}
                {canViewArticles && (
                  <TabsTrigger value="articles">
                    Articles
                  </TabsTrigger>
                )}
                {canViewMenus && (
                  <TabsTrigger value="menus">
                    Menus
                  </TabsTrigger>
                )}
                {canViewMenus && (
                  <TabsTrigger value="homepage">
                    Accueil
                  </TabsTrigger>
                )}
                {canManageRoles && (
                  <TabsTrigger value="roles">
                    Rôles
                  </TabsTrigger>
                )}
                <TabsTrigger value="logs">
                  <History className="h-4 w-4 mr-2" />
                  Journaux
                </TabsTrigger>
              </TabsList>
              
              {canViewDashboard && (
                <TabsContent value="dashboard" className="space-y-4">
                  <DashboardStats />
                </TabsContent>
              )}
              
              {canViewUsers && (
                <TabsContent value="users" className="space-y-4">
                  <UserTable canManage={canManageUsers} />
                </TabsContent>
              )}
              
              {canViewOrders && (
                <TabsContent value="orders" className="space-y-4">
                  <OrdersTable canManage={canManageOrders} />
                </TabsContent>
              )}
              
              {canViewArticles && (
                <TabsContent value="articles" className="space-y-4">
                  <ArticlesManager canManage={canManageArticles} />
                </TabsContent>
              )}
              
              {canViewMenus && (
                <TabsContent value="menus" className="space-y-4">
                  <MenuEditor canManage={canManageMenus} />
                </TabsContent>
              )}
              
              {canViewMenus && (
                <TabsContent value="homepage" className="space-y-4">
                  <HomepageEditor />
                </TabsContent>
              )}
              
              {canManageRoles && (
                <TabsContent value="roles" className="space-y-4">
                  <AdminRoleManager />
                </TabsContent>
              )}
              
              <TabsContent value="logs" className="space-y-4">
                <AuditLogViewer />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
