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
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { DashboardStats } from "@/components/admin/stats/DashboardStats";
import { useRoleBasedAccess } from "@/hooks/use-role-based-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { StatCard } from "@/components/admin/stats/StatCard";
import { logAdminAction } from "@/integrations/supabase/client";

const AdminInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { isLoggedIn, isAdmin, adminData, isLoading, handleLogout } = useAdminAuth();
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activeMenuId, setActiveMenuId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenusOpen, setIsMenusOpen] = useState(false);
  const isMobile = useIsMobile();
  const permissions = useRoleBasedAccess();

  useEffect(() => {
    loadMenus();
    
    const handleMenuUpdated = (event: CustomEvent) => {
      console.log("Menu updated event received:", event.detail);
      if (event.detail) {
        setMenus(event.detail);
      } else {
        loadMenus();
      }
    };
    
    window.addEventListener('menu-updated', handleMenuUpdated as EventListener);
    
    return () => {
      window.removeEventListener('menu-updated', handleMenuUpdated as EventListener);
    };
  }, []);

  const loadMenus = () => {
    console.log("Loading menus from storage or default...");
    const savedMenus = localStorage.getItem("weeklyMenu");
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        console.log("Loaded menus from localStorage:", parsedMenus);
        setMenus(parsedMenus);
        if (parsedMenus.length > 0 && !activeMenuId) {
          setActiveMenuId(parsedMenus[0].id);
        }
      } catch (error) {
        console.error("Error loading menus:", error);
        convertAndSetMenus();
      }
    } else {
      console.log("No menus in localStorage, loading defaults");
      convertAndSetMenus();
    }
  };

  const convertAndSetMenus = () => {
    console.log("Converting default menus...");
    const convertedMenus = weeklyMenu.map((menu) => {
      const mainDishes: any[] = [];
      const sideDishes: any[] = [];
      const desserts: any[] = [];

      menu.mealOptions.forEach((option) => {
        if (option.mainDish && !mainDishes.some((dish) => dish.id === option.mainDish.id)) {
          mainDishes.push({
            id: option.mainDish.id,
            name: option.mainDish.name,
            price: option.mainDish.price,
            description: option.mainDish.description,
            imageUrl: option.mainDish.image,
          });
        }

        if (option.sideDish && !sideDishes.some((dish) => dish.id === option.sideDish.id)) {
          sideDishes.push({
            id: option.sideDish.id,
            name: option.sideDish.name,
            price: option.sideDish.price,
            description: option.sideDish.description,
            imageUrl: option.sideDish.image,
          });
        }

        if (option.dessert && !desserts.some((dish) => dish.id === option.dessert.id)) {
          desserts.push({
            id: option.dessert.id,
            name: option.dessert.name,
            price: option.dessert.price,
            description: option.dessert.description,
            imageUrl: option.dessert.image,
          });
        }
      });

      return {
        id: menu.id,
        day: menu.day,
        date: menu.date,
        mainDishes,
        sideDishes,
        desserts,
      };
    });

    console.log("Converted menus:", convertedMenus);
    setMenus(convertedMenus);
    if (convertedMenus.length > 0) {
      setActiveMenuId(convertedMenus[0].id);
    }
    
    localStorage.setItem("weeklyMenu", JSON.stringify(convertedMenus));
  };

  const handleSelectMenu = (menuId: string) => {
    console.log("Changing active menu to:", menuId);
    setActiveMenuId(menuId);
  };

  const handleRefreshMenus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadMenus();
      setIsRefreshing(false);
      toast({
        title: "Menus actualisés",
        description: "Les menus ont été rechargés avec succès.",
      });
    }, 500);
  };

  const handleLoginClick = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = (user: any) => {
    setIsLoginDialogOpen(false);
    toast({
      title: "Connexion administrateur réussie",
      description: "Bienvenue dans l'interface d'administration.",
    });
  };

  useEffect(() => {
    if (isLoggedIn && !isAdmin && !isLoading && !permissions.canViewDashboard) {
      toast({
        title: "Accès refusé",
        description: "Votre compte n'a pas les droits nécessaires pour accéder à cette interface.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isLoggedIn, isAdmin, isLoading, permissions, navigate, toast]);

  if (isLoading || permissions.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn || (!permissions.canViewDashboard && !isAdmin)) {
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
                <h1 className="text-2xl font-bold">Interface Administrateur</h1>
              </div>
              <Button
                onClick={handleLoginClick}
                className="bg-white text-restaurant-purple hover:bg-gray-100"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Connexion Admin
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto flex flex-col items-center justify-center py-20 px-4">
          <ShieldAlert className="w-20 h-20 text-restaurant-red mb-6" />
          <h1 className="text-3xl font-bold mb-3">Accès réservé</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Vous devez être connecté avec un compte disposant des droits nécessaires pour accéder à cette page.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleLoginClick} className="bg-restaurant-purple text-white">
              <LogIn className="h-4 w-4 mr-2" />
              Connexion Admin
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
        
        <AdminLoginDialog
          isOpen={isLoginDialogOpen}
          onClose={() => setIsLoginDialogOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const selectedMenu = menus.find(menu => menu.id === activeMenuId);

  const renderMenuButtons = () => {
    if (isMobile) {
      return (
        <Drawer open={isMenusOpen} onOpenChange={setIsMenusOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="mb-4">
              <Menu className="h-4 w-4 mr-2" />
              Sélectionner un jour
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 space-y-2">
              <h3 className="font-medium mb-2">Jours de la semaine</h3>
              <div className="flex flex-col gap-2">
                {menus.map((menu) => (
                  <Button
                    key={menu.id}
                    variant={activeMenuId === menu.id ? "default" : "outline"}
                    onClick={() => {
                      handleSelectMenu(menu.id);
                      setIsMenusOpen(false);
                    }}
                    className={`${
                      activeMenuId === menu.id
                        ? "bg-restaurant-purple text-white"
                        : "text-restaurant-purple"
                    }`}
                  >
                    {menu.day}
                  </Button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <div className="w-full justify-start border-b pb-2 flex space-x-2 overflow-x-auto">
        {menus.map((menu) => (
          <Button
            key={menu.id}
            variant={activeMenuId === menu.id ? "default" : "outline"}
            onClick={() => handleSelectMenu(menu.id)}
            className={`${
              activeMenuId === menu.id
                ? "bg-restaurant-purple text-white"
                : "text-restaurant-purple"
            }`}
          >
            {menu.day}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-restaurant-purple text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-md mr-3">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                  alt="Logo"
                  className="h-10 w-auto"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold">Interface Administrateur</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/cuisine" className="flex items-center bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition text-sm">
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Interface Cuisine
              </Link>
              <div className="text-sm bg-white/20 px-3 py-1 rounded">
                {adminData?.email}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="bg-restaurant-red hover:bg-restaurant-red/80"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
              <Link to="/" className="flex items-center text-white hover:text-gray-200 transition">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Retour au site
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher par email, nom, ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la base de données</CardTitle>
              <TabsList className={`${isMobile ? 'grid-cols-2' : 'grid-cols-9'} grid gap-4`}>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                {permissions.canViewOrders && (
                  <TabsTrigger value="orders">Commandes</TabsTrigger>
                )}
                {permissions.canViewUsers && (
                  <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                )}
                {permissions.canViewOrders && (
                  <TabsTrigger value="order-items">Articles Com.</TabsTrigger>
                )}
                {permissions.canViewArticles && (
                  <TabsTrigger value="articles">
                    <FileText className="h-4 w-4 mr-2" />
                    Articles
                  </TabsTrigger>
                )}
                {permissions.canViewMenus && (
                  <TabsTrigger value="menus">
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Menus
                  </TabsTrigger>
                )}
                {permissions.canViewMenus && (
                  <TabsTrigger value="homepage">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Accueil
                  </TabsTrigger>
                )}
                {permissions.canManageRoles && (
                  <TabsTrigger value="admins">
                    <Users className="h-4 w-4 mr-2" />
                    Rôles
                  </TabsTrigger>
                )}
                {permissions.canManageRoles && (
                  <TabsTrigger value="audit-log">
                    <History className="h-4 w-4 mr-2" />
                    Audit
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="dashboard" className="space-y-4">
                <DashboardStats />
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                {permissions.canViewUsers ? (
                  <UserTable searchTerm={searchTerm} />
                ) : (
                  <AccessDenied />
                )}
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-4">
                {permissions.canViewOrders ? (
                  <OrdersTable 
                    searchTerm={searchTerm} 
                    readOnly={!permissions.canManageOrders}
                    onActionPerformed={async (action, resource, details) => {
                      if (adminData) {
                        await logAdminAction(adminData.id, action, resource, details);
                      }
                    }}
                  />
                ) : (
                  <AccessDenied />
                )}
              </TabsContent>
              
              <TabsContent value="order-items" className="space-y-4">
                {permissions.canViewOrders ? (
                  <OrderItemsTable searchTerm={searchTerm} />
                ) : (
                  <AccessDenied />
                )}
              </TabsContent>
              
              <TabsContent value="articles" className="space-y-4">
                {permissions.canViewArticles ? (
                  <ArticlesManager readOnly={!permissions.canManageArticles} />
                ) : (
                  <AccessDenied />
                )}
              </TabsContent>
              
              <TabsContent value="menus" className="space-y-4">
                {permissions.canViewMenus ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center mb-3">
                        <CardTitle>Gestion des Menus Hebdomadaires</CardTitle>
                        {permissions.canManageMenus && (
                          <Button
                            variant="outline"
                            onClick={handleRefreshMenus}
                            className="flex items-center"
                            disabled={isRefreshing}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Actualiser
                          </Button>
                        )}
                      </div>
                      {renderMenuButtons()}
                    </CardHeader>
                    <CardContent className="pt-6">
                      {selectedMenu && (
                        <MenuEditor 
                          key={activeMenuId}
                          menu={menus.find(menu => {
                            const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
                            const currentDayName = daysOfWeek[new Date().getDay()];
                            return menu.day === currentDayName;
                          }) || menus[0]}
                          menus={menus}
                          setMenus={setMenus}
                          readOnly={!permissions.canManageMenus}
                          onMenuUpdated={async (action, details) => {
                            try {
                              if (adminData) {
                                await logAdminAction(adminData.id, action, 'menu_items', details);
                              }
                            } catch (error) {
                              console.error("Error logging admin action:", error);
                            }
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <AccessDenied />
                )}
              </TabsContent>
              
              <TabsContent value="admins" className="space-y-4">
                {permissions.canManageRoles ? (
                  <AdminRoleManager />
                ) : (
                  <AccessDenied message="Vous n'avez pas les permissions nécessaires pour gérer les rôles d'administration." />
                )}
              </TabsContent>
              
              <TabsContent value="audit-log" className="space-y-4">
                {permissions.canManageRoles ? (
                  <AuditLogViewer />
                ) : (
                  <AccessDenied message="Vous n'avez pas les permissions nécessaires pour consulter le journal d'audit." />
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
      
      <AdminLoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default AdminInterface;
