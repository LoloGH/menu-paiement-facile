
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserForm } from "./UserForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserTableProps {
  searchTerm: string;
}

export const UserTable: React.FC<UserTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from("users").select("*");
      
      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les utilisateurs: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setCurrentUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Toutes ses données seront perdues.")) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", id);
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "L'utilisateur a été supprimé avec succès",
        });
        
        fetchUsers();
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Impossible de supprimer l'utilisateur: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSubmit = async (userData: any) => {
    try {
      if (currentUser) {
        // Mise à jour
        const { error } = await supabase
          .from("users")
          .update({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
          })
          .eq("id", currentUser.id);
          
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      } else {
        // Création
        const { error } = await supabase.from("users").insert([
          {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
          },
        ]);
        
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Nouvel utilisateur créé avec succès",
        });
      }
      
      setIsFormOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'enregistrement: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setCurrentUser(null);
    setIsFormOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Utilisateurs ({loading ? "..." : users.length})</h2>
        <Button onClick={handleAddNew}>
          <UserPlus className="mr-2 h-4 w-4" /> Nouvel utilisateur
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Chargement des utilisateurs...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Aucun utilisateur ne correspond à votre recherche" : "Aucun utilisateur trouvé"}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          </DialogHeader>
          <UserForm 
            initialData={currentUser} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
