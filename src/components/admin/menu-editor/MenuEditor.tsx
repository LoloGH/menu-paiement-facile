
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Plus, Trash2, Edit, Loader2, RefreshCw } from "lucide-react";
import { MenuEditorProps, MenuDay, MenuItem, DishType } from "./types";
import { EditItemDialog } from "./EditItemDialog";
import { supabase } from "@/integrations/supabase/client";

export const MenuEditor: React.FC<MenuEditorProps> = ({ 
  menu, 
  menus, 
  setMenus, 
  readOnly = false,
  onMenuUpdated 
}) => {
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: DishType}>({
    item: null,
    type: 'mainDish'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState<string | null>(null);
  // État pour suivre les dialogues de confirmation de suppression ouverts
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{[key: string]: boolean}>({});
  // État pour suivre les éléments en cours d'édition
  const [editingItemIds, setEditingItemIds] = useState<string[]>([]);
  // Référence au dernier menu reçu par les props
  const [lastMenu, setLastMenu] = useState<MenuDay | null>(null);

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
    setLastMenu(menu);
  }, [menu]);

  // Méthode pour vérifier si un élément est en cours d'édition
  const isItemBeingEdited = (itemId: string) => {
    return editingItemIds.includes(itemId);
  };

  // Fonction pour gérer l'ouverture/fermeture des dialogues de suppression
  const handleDeleteDialogState = (itemId: string, isOpen: boolean) => {
    setDeleteDialogOpen(prev => ({
      ...prev,
      [itemId]: isOpen
    }));
  };

  const handleAddItem = (type: DishType) => {
    if (isProcessing) return;
    setEditingItem({item: null, type});
    setIsAddingItem(true);
  };

  const handleEditItem = (item: MenuItem, type: DishType) => {
    if (isProcessing || isItemBeingEdited(item.id)) return;
    
    // Ajouter l'ID de l'élément à la liste des éléments en cours d'édition
    setEditingItemIds(prev => [...prev, item.id]);
    
    setEditingItem({item, type});
    setIsAddingItem(true);
  };

  // Fonction sécurisée pour faire une mise à jour sans bloquer l'interface
  const safeUpdateRemote = useCallback(async (actionType: string, details: any) => {
    if (onMenuUpdated) {
      try {
        // Utiliser setTimeout pour s'assurer que cette opération est non-bloquante
        setTimeout(() => {
          onMenuUpdated(actionType, details).catch(error => {
            console.error("Error in onMenuUpdated callback:", error);
          });
        }, 0);
      } catch (error) {
        console.error("Error triggering onMenuUpdated callback:", error);
      }
    }
  }, [onMenuUpdated]);

  // Fonction sécurisée pour mettre à jour la base de données
  const safeUpdateDatabase = useCallback((articleId: string | undefined, menuId: string, action: 'add' | 'remove'): Promise<void> => {
    return new Promise((resolve) => {
      if (!articleId) {
        resolve();
        return;
      }

      // Utiliser setTimeout pour s'assurer que cette opération est non-bloquante
      setTimeout(async () => {
        try {
          if (action === 'add') {
            // Vérifier si l'association existe déjà
            const { data: existingAssociations, error: fetchError } = await supabase
              .from('menu_articles')
              .select('*')
              .eq('menu_day', menuId)
              .eq('article_id', articleId);
              // Removed timeout to fix TypeScript error
              
            if (fetchError) {
              console.error('Error checking existing menu article association:', fetchError);
              resolve();
              return;
            }
            
            // Si l'association n'existe pas, la créer
            if (!existingAssociations || existingAssociations.length === 0) {
              const { error: insertError } = await supabase
                .from('menu_articles')
                .insert({
                  menu_day: menuId,
                  article_id: articleId
                });
                // Removed timeout to fix TypeScript error
                
              if (insertError) {
                console.error('Error saving menu article association:', insertError);
              } else {
                console.log('Menu article association saved successfully');
              }
            } else {
              console.log('Menu article association already exists');
            }
          } else if (action === 'remove') {
            // Supprimer l'association
            const { error } = await supabase
              .from('menu_articles')
              .delete()
              .eq('menu_day', menuId)
              .eq('article_id', articleId);
              // Removed timeout to fix TypeScript error

            if (error) {
              console.error(`Error deleting menu article association:`, error);
            } else {
              console.log('Menu article association deleted successfully');
            }
          }
        } catch (error) {
          console.error('Error in database operation:', error);
        } finally {
          resolve();
        }
      }, 0);
    });
  }, []);

  const handleSaveItem = useCallback(async (updatedItem: MenuItem) => {
    if (isProcessing) return;
    
    console.log("Starting save operation for item:", updatedItem);
    setIsProcessing(true);
    
    try {
      const { type } = editingItem;
      
      // Obtenir le nom du tableau correspondant au type
      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = itemTypeMap[type];
      const actionType = updatedItem.id.includes(`${type}_`) ? `add_${type}` : `update_${type}`;
      
      // Fermer le dialogue et mettre à jour l'UI immédiatement (optimistic update)
      const updatedMenus = menus.map(m => {
        if (m.id === menu.id) {
          // Vérifier si c'est un nouvel élément ou une mise à jour
          if (editingItem.item && m[itemType]) {
            // Mise à jour
            // Ensure m[itemType] is an array before using find
            const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
            const items = [...currentItems];
            const index = items.findIndex(item => item.id === editingItem.item?.id);
            if (index !== -1) {
              items[index] = updatedItem;
            } else {
              items.push(updatedItem);
            }
            return {...m, [itemType]: items};
          } else {
            // Ajout
            // Ensure m[itemType] is an array before spreading
            const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
            const items = [...currentItems, updatedItem];
            return {...m, [itemType]: items};
          }
        }
        return m;
      });
      
      // Mettre à jour l'état local immédiatement pour une interface réactive
      setMenus(updatedMenus);
      
      // Exécuter des tâches en arrière-plan après le rendu
      setTimeout(() => {
        try {
          // Sauvegarder dans localStorage
          localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
          
          // Notification à l'utilisateur
          toast({
            title: "Succès",
            description: `${editingItem.item ? "Élément mis à jour" : "Nouvel élément ajouté"} avec succès.`,
          });
          
          // Mettre à jour la base de données en arrière-plan sans bloquer l'UI
          if (updatedItem.articleId) {
            safeUpdateDatabase(updatedItem.articleId, menu.id, 'add');
          }
          
          // Appeler le callback de notification en arrière-plan
          safeUpdateRemote(actionType, { menuId: menu.id, dish: updatedItem });
        } catch (error) {
          console.error("Error in background tasks:", error);
        }
      }, 10);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive",
      });
    } finally {
      // Réinitialiser les états de façon asynchrone pour éviter de bloquer l'UI
      setTimeout(() => {
        setIsProcessing(false);
        setEditingItem({item: null, type: 'mainDish'});
        setIsAddingItem(false);
        
        // Supprimer l'ID de la liste des éléments en cours d'édition
        if (editingItem.item) {
          setEditingItemIds(prev => prev.filter(id => id !== editingItem.item?.id));
        }
      }, 0);
    }
  }, [isProcessing, editingItem, menu, menus, setMenus, toast, safeUpdateDatabase, safeUpdateRemote]);

  const handleCancelEdit = useCallback(() => {
    // Supprimer l'ID de la liste des éléments en cours d'édition
    if (editingItem.item) {
      setEditingItemIds(prev => prev.filter(id => id !== editingItem.item?.id));
    }
    
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingItem(false);
  }, [editingItem]);

  const handleDeleteItem = useCallback(async (dishId: string, dishType: DishType) => {
    if (isProcessing || deleteProcessing) return;
    
    // Fermer le dialogue de confirmation
    handleDeleteDialogState(dishId, false);
    
    // Marquer cet élément spécifique comme étant en cours de suppression
    setDeleteProcessing(dishId);
    
    try {
      // Obtenir le nom du tableau correspondant au type
      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = itemTypeMap[dishType];
      
      // Ensure menu[itemType] is an array before using find
      const itemsArray = Array.isArray(menu[itemType]) ? menu[itemType] as MenuItem[] : [];
      const dishToDelete = itemsArray.find((dish) => dish.id === dishId);
      
      // Mise à jour optimiste de l'interface - immédiatement
      const updatedMenus = menus.map((m) => {
        if (m.id === menu.id) {
          // Ensure m[itemType] is an array before finding or filtering
          const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
          
          return {
            ...m,
            [itemType]: currentItems.filter((dish) => dish.id !== dishId),
          };
        }
        return m;
      });
      
      // Mettre à jour l'état et localStorage immédiatement pour une interface réactive
      setMenus(updatedMenus);
      
      // Exécuter des tâches en arrière-plan sans bloquer l'UI
      const dish = itemsArray.find(d => d.id === dishId);
      setTimeout(() => {
        try {
          // Mettre à jour localStorage
          localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
          
          // Notification utilisateur - immédiatement
          toast({
            title: "Succès",
            description: `Élément supprimé avec succès.`,
          });
          
          // Traitement en arrière-plan sans bloquer l'UI
          if (dish?.articleId) {
            safeUpdateDatabase(dish.articleId, menu.id, 'remove');
          }
          
          // Appeler le callback de notification en arrière-plan
          safeUpdateRemote(`delete_${dishType}`, { 
            menuId: menu.id, 
            dishId, 
            dishDetails: dishToDelete 
          });
        } catch (error) {
          console.error("Error in background tasks:", error);
        }
      }, 10);
      
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
    } finally {
      // S'assurer que l'état de suppression est réinitialisé de façon asynchrone
      setTimeout(() => {
        setDeleteProcessing(null);
      }, 0);
    }
  }, [isProcessing, deleteProcessing, menu, menus, setMenus, toast, safeUpdateDatabase, safeUpdateRemote]);

  // Fonction pour rendre une section de type de plat
  const renderDishTypeSection = (title: string, type: DishType, items: MenuItem[]) => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.map((dish) => (
                  <TableRow key={dish.id} className={deleteProcessing === dish.id ? "opacity-50" : ""}>
                    <TableCell>{dish.name}</TableCell>
                    <TableCell>{dish.price}</TableCell>
                    <TableCell>{dish.description}</TableCell>
                    <TableCell>{dish.imageUrl}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            disabled={
                              isProcessing || 
                              deleteProcessing === dish.id || 
                              isItemBeingEdited(dish.id)
                            }
                          >
                            <span className="sr-only">Ouvrir le menu</span>
                            {deleteProcessing === dish.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isItemBeingEdited(dish.id) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!readOnly && (
                            <DropdownMenuItem
                              onClick={() => handleEditItem(dish, type)}
                              disabled={
                                isProcessing || 
                                deleteProcessing === dish.id || 
                                isItemBeingEdited(dish.id)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {!readOnly && (
                            <DropdownMenuItem
                              className="text-red-500" 
                              onClick={() => handleDeleteDialogState(dish.id, true)}
                              disabled={
                                isProcessing || 
                                deleteProcessing === dish.id || 
                                isItemBeingEdited(dish.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Dialogue de confirmation de suppression - séparé du DropdownMenu */}
                      <AlertDialog 
                        open={deleteDialogOpen[dish.id] || false}
                        onOpenChange={(open) => handleDeleteDialogState(dish.id, open)}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Êtes-vous sûr de vouloir supprimer cet élément?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              onClick={() => handleDeleteDialogState(dish.id, false)}
                              disabled={deleteProcessing === dish.id}
                            >
                              Annuler
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(dish.id, type)}
                              disabled={deleteProcessing === dish.id}
                              className={deleteProcessing === dish.id ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              {deleteProcessing === dish.id ? (
                                <span className="flex items-center">
                                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                  Suppression...
                                </span>
                              ) : (
                                "Supprimer"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Aucun élément trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => handleAddItem(type)}
              className="mt-2"
              disabled={isProcessing}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter{" "}
              {type === "mainDish"
                ? "un plat principal"
                : type === "sideDish"
                  ? "un accompagnement"
                  : "un dessert"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Vérifie si le menu est valide
  if (!menu) {
    return (
      <div className="p-4 text-center">
        <p>Aucun menu sélectionné ou menu invalide</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderDishTypeSection("Plats Principaux", "mainDish", menu.mainDishes || [])}
      {renderDishTypeSection("Accompagnements", "sideDish", menu.sideDishes || [])}
      {renderDishTypeSection("Desserts", "dessert", menu.desserts || [])}

      {/* Dialog d'édition */}
      {isAddingItem && (
        <EditItemDialog
          item={editingItem.item}
          type={editingItem.type}
          onClose={handleCancelEdit}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};
