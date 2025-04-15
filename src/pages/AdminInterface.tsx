
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
import { Search, ShieldAlert, UtensilsCrossed, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AdminInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Vérification de l'authentification et droits admin
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      // Pour l'instant, tous les utilisateurs connectés sont des administrateurs
      // Dans un système réel, vous devriez vérifier si l'utilisateur a un rôle d'administrateur
      setIsAdmin(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ShieldAlert className="w-16 h-16 text-restaurant-red mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accès non autorisé</h1>
        <p className="text-gray-600 mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-restaurant-purple text-white p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Interface Administrateur</h1>
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
    </div>
  );
};

export default AdminInterface;
