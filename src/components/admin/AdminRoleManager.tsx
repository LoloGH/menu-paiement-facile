
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Trash2, UserPlus } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'user';
}

export const AdminRoleManager = () => {
  const [adminUsers, setAdminUsers] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailToAdd, setEmailToAdd] = useState("");
  const { toast } = useToast();

  const fetchAdminUsers = async () => {
    setIsLoading(true);
    try {
      // Requête pour obtenir tous les utilisateurs avec le rôle admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin');

      if (roleError) {
        throw roleError;
      }

      if (roleData && roleData.length > 0) {
        // Récupérer les emails pour chaque utilisateur admin
        const userPromises = roleData.map(async (role) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', role.user_id)
            .single();

          if (userError) {
            console.error("Erreur lors de la récupération de l'email:", userError);
            return { ...role, email: "Email non disponible" };
          }

          return { ...role, email: userData?.email || "Email non disponible" };
        });

        const usersWithEmails = await Promise.all(userPromises);
        setAdminUsers(usersWithEmails as UserRole[]);
      } else {
        setAdminUsers([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des administrateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des administrateurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const addAdminByEmail = async () => {
    if (!emailToAdd.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Rechercher l'utilisateur par email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailToAdd)
        .single();

      if (userError) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec cette adresse email.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier si l'utilisateur a déjà le rôle admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userData.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast({
          title: "Information",
          description: "Cet utilisateur possède déjà les droits administrateur.",
        });
        return;
      }

      // Ajouter le rôle admin à l'utilisateur
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userData.id, role: 'admin' }]);

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Succès",
        description: "Droits administrateur attribués avec succès.",
      });
      
      setEmailToAdd("");
      fetchAdminUsers();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'administrateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer les droits administrateur.",
        variant: "destructive",
      });
    }
  };

  const removeAdmin = async (roleId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `Droits administrateur retirés pour ${email}.`,
      });
      
      fetchAdminUsers();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'administrateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer les droits administrateur.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-restaurant-purple" />
          Gestion des Administrateurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="admin-email" className="mb-2 block">Ajouter un administrateur par email</Label>
          <div className="flex gap-2">
            <Input
              id="admin-email"
              placeholder="email@exemple.com"
              value={emailToAdd}
              onChange={(e) => setEmailToAdd(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={addAdminByEmail} 
              disabled={isLoading || !emailToAdd.trim()}
              className="whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter Admin
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Administrateurs actuels</h3>
          {isLoading ? (
            <div className="text-center p-4">Chargement...</div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              Aucun administrateur trouvé.
            </div>
          ) : (
            <div className="space-y-2">
              {adminUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <span>{user.email}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => removeAdmin(user.id, user.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
