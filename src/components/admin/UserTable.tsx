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
import { 
  Pencil, 
  Trash2, 
  UserPlus, 
  Download,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserForm } from "./UserForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserTableProps {
  searchTerm: string;
}

export const UserTable: React.FC<UserTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
    fetchUsers();
  }, [searchTerm, page]);

  useEffect(() => {
    if (localSearchTerm !== searchTerm) {
      setPage(1);
    }
  }, [localSearchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from("users").select('*', { count: 'exact' });
      
      if (searchTerm) {
        countQuery = countQuery.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalItems(count || 0);
      
      let query = supabase.from("users").select("*");
      
      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }
      
      query = query
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order("created_at", { ascending: false });
      
      const { data, error } = await query;
      
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

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const { error } = await supabase.from("users").delete().eq("id", userToDelete);
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
    } finally {
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (userData: any) => {
    try {
      if (currentUser) {
        console.log("Mise à jour de l'utilisateur:", userData);
        
        const updateData: any = {};
        
        if (userData.name !== currentUser.name) {
          updateData.name = userData.name;
        }
        
        if (userData.email !== currentUser.email) {
          updateData.email = userData.email;
        }
        
        if (userData.phone !== currentUser.phone) {
          updateData.phone = userData.phone;
        }
        
        if (Object.keys(updateData).length === 0) {
          toast({
            title: "Information",
            description: "Aucune modification n'a été détectée.",
          });
          setIsFormOpen(false);
          return;
        }
        
        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", currentUser.id);
          
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      } else {
        console.log("Création d'un nouvel utilisateur:", userData);
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
      console.error("Erreur lors de l'enregistrement:", error);
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

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (username.length <= 3) return email;
    
    const maskedUsername = `${username.substring(0, 3)}${"*".repeat(username.length - 3)}`;
    return `${maskedUsername}@${domain}`;
  };

  const exportToCSV = () => {
    try {
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          
          if (!data || data.length === 0) {
            toast({
              title: "Info",
              description: "Aucun utilisateur à exporter",
            });
            return;
          }
          
          const headers = ["ID", "Nom", "Email", "Téléphone", "Date d'inscription"];
          const csvContent = [
            headers.join(","),
            ...data.map(user => {
              return [
                user.id,
                user.name || "",
                user.email || "",
                user.phone || "",
                new Date(user.created_at).toLocaleDateString()
              ].join(",");
            })
          ].join("\n");
          
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Succès",
            description: "Export CSV réussi",
          });
        });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible d'exporter les utilisateurs: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Utilisateurs ({loading ? "..." : totalItems})</h2>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex gap-2 items-center">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={handleAddNew} className="flex gap-2 items-center">
            <UserPlus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-10"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchUsers();
              }
            }}
          />
        </div>
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
                <TableHead>Date d'inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>
                    <span title={user.email}>{maskEmail(user.email)}</span>
                  </TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(user)}
                      className="hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(user.id)}
                      className="hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) < 2 || p === 1 || p === totalPages)
                .map((p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${p}`}>
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                        <PaginationItem key={p}>
                          <PaginationLink 
                            onClick={() => setPage(p)}
                            isActive={page === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink 
                        onClick={() => setPage(p)}
                        isActive={page === p}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
