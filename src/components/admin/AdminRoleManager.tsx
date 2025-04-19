
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Trash2, UserPlus, Users } from "lucide-react";
import { 
  fetchAdminUsers, fetchOrderManagerUsers, fetchViewerUsers, 
  addRoleToUser, removeRoleFromUser, UserRoleInfo, AdminRoleType, getRoleDisplayName
} from "@/utils/roleUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { logAdminAction } from "@/integrations/supabase/client";

export const AdminRoleManager = () => {
  const [users, setUsers] = useState<{[key: string]: UserRoleInfo[]}>({
    [AdminRoleType.ADMIN]: [],
    [AdminRoleType.ORDER_MANAGER]: [],
    [AdminRoleType.VIEWER]: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>(AdminRoleType.ADMIN);
  const { toast } = useToast();
  const { adminData } = useAdminAuth();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [admins, orderManagers, viewers] = await Promise.all([
        fetchAdminUsers(),
        fetchOrderManagerUsers(),
        fetchViewerUsers()
      ]);
      
      setUsers({
        [AdminRoleType.ADMIN]: admins,
        [AdminRoleType.ORDER_MANAGER]: orderManagers,
        [AdminRoleType.VIEWER]: viewers,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs avec rôles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Subscribe to role changes
    const channel = supabase
      .channel('role-manager-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_roles'
        },
        (payload) => {
          console.log('Role changes detected:', payload);
          loadUsers(); // Refresh the user list
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddUser = async () => {
    if (!emailToAdd.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addRoleToUser(emailToAdd, selectedRole);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        });
        
        setEmailToAdd("");
        loadUsers();

        // Log the action
        if (adminData) {
          await logAdminAction(
            adminData.id,
            "add_user_role",
            "user_roles",
            { email: emailToAdd, role: selectedRole }
          );
        }
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer le rôle.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string, email: string, role: string) => {
    try {
      const result = await removeRoleFromUser(userId, role);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: `${getRoleDisplayName(role)} retiré pour ${email}.`,
        });
        
        loadUsers();

        // Log the action
        if (adminData) {
          await logAdminAction(
            adminData.id,
            "remove_user_role",
            "user_roles",
            { userId, email, role }
          );
        }
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le rôle.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-restaurant-purple" />
          Gestion des Rôles et Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="role-email" className="mb-2 block">Ajouter un utilisateur par email</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="role-email"
                placeholder="email@exemple.com"
                value={emailToAdd}
                onChange={(e) => setEmailToAdd(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddUser} 
                disabled={isLoading || !emailToAdd.trim()}
                className="whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter Utilisateur
              </Button>
            </div>
            <div>
              <Label htmlFor="role-select" className="mb-2 block">Avec le rôle</Label>
              <select 
                id="role-select"
                className="w-full p-2 border rounded-md"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value={AdminRoleType.ADMIN}>Admin principal (accès total)</option>
                <option value={AdminRoleType.ORDER_MANAGER}>Gestionnaire de commandes</option>
                <option value={AdminRoleType.VIEWER}>Visualiseur (lecture seule)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4">Utilisateurs avec rôles</h3>
          
          <Tabs defaultValue={AdminRoleType.ADMIN}>
            <TabsList className="mb-4">
              <TabsTrigger value={AdminRoleType.ADMIN}>Admins principaux</TabsTrigger>
              <TabsTrigger value={AdminRoleType.ORDER_MANAGER}>Gestionnaires</TabsTrigger>
              <TabsTrigger value={AdminRoleType.VIEWER}>Visualiseurs</TabsTrigger>
            </TabsList>
            
            {Object.entries(users).map(([role, roleUsers]) => (
              <TabsContent key={role} value={role}>
                {isLoading ? (
                  <div className="text-center p-4">Chargement...</div>
                ) : roleUsers.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    Aucun utilisateur trouvé avec le rôle {getRoleDisplayName(role)}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roleUsers.map((user) => (
                      <div 
                        key={`${user.id}-${role}`} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <span className="font-medium">{user.email}</span>
                          <span className="ml-2 text-xs text-gray-500">({user.id.substring(0, 8)}...)</span>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRemoveUser(user.id, user.email, role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
