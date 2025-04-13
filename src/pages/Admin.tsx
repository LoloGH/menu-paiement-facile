
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserTable } from "@/components/admin/UserTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderItemsTable } from "@/components/admin/OrderItemsTable";
import { Search, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
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
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord d'administration</h1>
      
      <div className="mb-6">
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
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="order-items">Articles commandés</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>Gestion de la base de données</CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="users">
              <UserTable searchTerm={searchTerm} />
            </TabsContent>
            
            <TabsContent value="orders">
              <OrdersTable searchTerm={searchTerm} />
            </TabsContent>
            
            <TabsContent value="order-items">
              <OrderItemsTable searchTerm={searchTerm} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Admin;
