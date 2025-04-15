
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserTable } from "@/components/admin/UserTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderItemsTable } from "@/components/admin/OrderItemsTable";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { Search, ShieldAlert, UtensilsCrossed, ChevronLeft, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminLoginDialog } from "@/components/admin/AdminLoginDialog";

const AdminInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  // Vérification de l'authentification et droits admin
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      // Pour l'instant, tous les utilisateurs connectés sont des administrateurs
      // Dans un système réel, vous devriez vérifier si l'utilisateur a un rôle d'administrateur
      setIsAdmin(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleLoginClick = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = (user: any) => {
    setIsLoginDialogOpen(false);
    setIsAdmin(true);
    
    toast({
      title: "Connexion administrateur réussie",
      description: "Bienvenue dans l'interface d'administration.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
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
          <h1 className="text-3xl font-bold mb-3">Accès non autorisé</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleLoginClick} className="bg-restaurant-purple text-white">
              <LogIn className="h-4 w-4 mr-2" />
              Connexion Admin
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
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
            <Link to="/" className="flex items-center text-white hover:text-gray-200 transition">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour au site principal
            </Link>
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
              <div>
                <Link to="/" className="bg-restaurant-purple text-white px-4 py-2 rounded hover:bg-restaurant-red transition-colors inline-flex items-center">
                  Voir le site principal
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la base de données</CardTitle>
              <TabsList className="grid grid-cols-4 gap-4">
                <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="order-items">Articles commandés</TabsTrigger>
                <TabsTrigger value="menus">
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Menus
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
                <MenuEditor />
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
