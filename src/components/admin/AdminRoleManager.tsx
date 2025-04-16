
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { fetchAdminUsers, addAdminRole, removeAdminRole, UserRoleInfo } from "@/utils/roleUtils";

export const AdminRoleManager = () => {
  const [adminUsers, setAdminUsers] = useState<UserRoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailToAdd, setEmailToAdd] = useState("");
  const { toast } = useToast();

  const loadAdminUsers = async () => {
    setIsLoading(true);
    try {
      const users = await fetchAdminUsers();
      setAdminUsers(users);
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
    loadAdminUsers();
  }, []);

  const handleAddAdmin = async () => {
    if (!emailToAdd.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addAdminRole(emailToAdd);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        });
        
        setEmailToAdd("");
        loadAdminUsers();
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'administrateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer les droits administrateur.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    try {
      const result = await removeAdminRole(userId);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: `Droits administrateur retirés pour ${email}.`,
        });
        
        loadAdminUsers();
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
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
              onClick={handleAddAdmin} 
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
                    onClick={() => handleRemoveAdmin(user.id, user.email)}
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
