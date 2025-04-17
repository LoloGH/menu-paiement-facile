
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/admin/UserTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderItemsTable } from "@/components/admin/OrderItemsTable";
import { MenuEditor } from "@/components/admin/menu-editor/MenuEditor";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { Search, ShieldAlert, UtensilsCrossed, ChevronLeft, LogIn, LogOut, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminLoginDialog } from "@/components/admin/AdminLoginDialog";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { MenuDay } from "@/components/admin/menu-editor/types";
import { weeklyMenu } from "@/data/menuData";

const AdminInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { isLoggedIn, isAdmin, adminData, isLoading, handleLogout } = useAdminAuth();
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activeMenuId, setActiveMenuId] = useState("");

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = () => {
    const savedMenus = localStorage.getItem("weeklyMenu");
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        setMenus(parsedMenus);
        if (parsedMenus.length > 0) {
          setActiveMenuId(parsedMenus[0].id);
        }
      } catch (error) {
        console.error("Error loading menus:", error);
        convertAndSetMenus();
      }
    } else {
      convertAndSetMenus();
    }
  };

  const convertAndSetMenus = () => {
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

    setMenus(convertedMenus);
    if (convertedMenus.length > 0) {
      setActiveMenuId(convertedMenus[0].id);
    }
  };

  const handleSelectMenu = (menuId: string) => {
    setActiveMenuId(menuId);
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
    if (isLoggedIn && !isAdmin && !isLoading) {
      toast({
        title: "Accès refusé",
        description: "Votre compte n'a pas les droits administrateur nécessaires.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isLoggedIn, isAdmin, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
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
            Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
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
            <div className="flex items-center space-x-4">
              <div className="text-sm bg-white/20 px-3 py-1 rounded">
                Admin: {adminData?.email}
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
        
        <Tabs defaultValue="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la base de données</CardTitle>
              <TabsList className="grid grid-cols-5 gap-4">
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="order-items">Articles commandés</TabsTrigger>
                <TabsTrigger value="menus">
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Menus
                </TabsTrigger>
                <TabsTrigger value="admins">
                  <Users className="h-4 w-4 mr-2" />
                  Administrateurs
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="users" className="space-y-4">
                <UserTable searchTerm={searchTerm} />
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-4">
                <OrdersTable searchTerm={searchTerm} />
              </TabsContent>
              
              <TabsContent value="order-items" className="space-y-4">
                <OrderItemsTable searchTerm={searchTerm} />
              </TabsContent>
              
              <TabsContent value="menus" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="overflow-x-auto">
                      <TabsList className="w-full justify-start border-b pb-2 flex space-x-2">
                        {menus.map((menu) => (
                          <TabsTrigger
                            key={menu.id}
                            value={menu.id}
                            onClick={() => setActiveMenuId(menu.id)}
                            className={`${
                              activeMenuId === menu.id
                                ? "bg-restaurant-purple text-white"
                                : "text-restaurant-purple"
                            }`}
                          >
                            {menu.day}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {selectedMenu && (
                      <MenuEditor 
                        key={activeMenuId} /* Ajout d'une clé unique pour forcer le re-rendu */
                        menu={selectedMenu}
                        menus={menus}
                        setMenus={setMenus}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="admins" className="space-y-4">
                <AdminRoleManager />
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
