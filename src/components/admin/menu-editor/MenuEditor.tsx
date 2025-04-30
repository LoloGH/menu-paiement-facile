
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { MenuStateProvider, useMenuState } from "@/contexts/MenuStateContext";

// Composant wrapper qui fournit le contexte
export const MenuEditor: React.FC<MenuEditorProps> = (props) => {
  return (
    <MenuStateProvider initialMenus={props.menus} onMenusChanged={props.setMenus}>
      <MenuEditorContent {...props} />
    </MenuStateProvider>
  );
};

// Composant principal qui utilise le contexte
const MenuEditorContent: React.FC<MenuEditorProps> = ({ 
  menu, 
  menus, 
  readOnly = false,
  onMenuUpdated 
}) => {
  const { toast } = useToast();
  const { 
    isProcessingAction, 
    setIsProcessingAction,
    editingItemIds, 
    addEditingItemId, 
    removeEditingItemId 
  } = useMenuState();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: DishType}>({
    item: null,
    type: 'mainDish'
  });
  const [deleteProcessing, setDeleteProcessing] = useState<string | null>(null);
  // État pour suivre les dialogues de confirmation de suppression ouverts
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{[key: string]: boolean}>({});
  // Référence au dernier menu reçu par les props
  const [lastMenu, setLastMenu] = useState<MenuDay | null>(null);

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
    setLastMenu(menu);
  }, [menu]);

  // Méthode pour vérifier si un élément est en cours d'édition
  const isItemBeingEdited = useCallback((itemId: string) => {
    return editingItemIds.includes(itemId);
  }, [editingItemIds]);

  // Fonction pour gérer l'ouverture/fermeture des dialogues de suppression
  const handleDeleteDialogState = useCallback((itemId: string, isOpen: boolean) => {
    setDeleteDialogOpen(prev => ({
      ...prev,
      [itemId]: isOpen
    }));
  }, []);

  const handleAddItem = useCallback((type: DishType) => {
    if (isProcessingAction) return;
    setEditingItem({item: null, type});
    setIsAddingItem(true);
  }, [isProcessingAction]);

  const handleEditItem = useCallback((item: MenuItem, type: DishType) => {
    if (isProcessingAction || isItemBeingEdited(item.id)) return;
    
    // Ajouter l'ID de l'élément à la liste des éléments en cours d'édition
    addEditingItemId(item.id);
    
    setEditingItem({item, type});
    setIsAddingItem(true);
  }, [isProcessingAction, isItemBeingEdited, addEditingItemId]);

  // Fonction sécurisée pour faire une mise à jour sans bloquer l'interface
  const safeUpdateRemote = useCallback(async (actionType: string, details: any) => {
    if (onMenuUpdated) {
      try {
        // Créer une promesse pour cette opération
        const updatePromise = onMenuUpdated(actionType, details).catch(error => {
          console.error("Error in onMenuUpdated callback:", error);
        });
        
        // Retourner la promesse sans l'attendre
        return updatePromise;
      } catch (error) {
        console.error("Error triggering onMenuUpdated callback:", error);
      }
    }
    return Promise.resolve();
  }, [onMenuUpdated]);

  // Fonction sécurisée pour mettre à jour la base de données
  const safeUpdateDatabase = useCallback((articleId: string | undefined, menuId: string, action: 'add' | 'remove'): Promise<void> => {
    return new Promise((resolve) => {
      if (!articleId) {
        resolve();
        return;
      }

      // Exécuter l'opération de base de données en arrière-plan
      const databaseOperation = async () => {
        try {
          if (action === 'add') {
            // Vérifier si l'association existe déjà
            const { data: existingAssociations, error: fetchError } = await supabase
              .from('menu_articles')
              .select('*')
              .eq('menu_day', menuId)
              .eq('article_id', articleId);
              
            if (fetchError) {
              console.error('Error checking existing menu article association:', fetchError);
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

            if (error) {
              console.error(`Error deleting menu article association:`, error);
            } else {
              console.log('Menu article association deleted successfully');
            }
          }
        } catch (error) {
          console.error('Error in database operation:', error);
        }
      };

      // Lancer l'opération en arrière-plan et résoudre immédiatement la promesse
      databaseOperation().finally(() => resolve());
    });
  }, []);

  const handleSaveItem = useCallback(async (updatedItem: MenuItem) => {
    if (isProcessingAction) return;
    
    console.log("Starting save operation for item:", updatedItem);
    setIsProcessingAction(true);
    
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
      
      // Réduction du traitement synchrone au minimum pour éviter le blocage de l'interface
      const updatedMenus = menus.map(m => {
        if (m.id === menu.id) {
          if (editingItem.item && m[itemType]) {
            // Mise à jour
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
            const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
            const items = [...currentItems, updatedItem];
            return {...m, [itemType]: items};
          }
        }
        return m;
      });
      
      // Fermer le dialogue d'abord pour améliorer la réactivité perçue
      handleCancelEdit();
      
      // Planifier une notification de succès après un court délai
      setTimeout(() => {
        toast({
          title: "Succès",
          description: `${editingItem.item ? "Élément mis à jour" : "Nouvel élément ajouté"} avec succès.`,
        });
      }, 100);
      
      // Lancer les opérations de fond en parallèle
      Promise.all([
        // Sauvegarder dans localStorage de façon asynchrone
        new Promise<void>(resolve => {
          try {
            localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
            resolve();
          } catch (error) {
            console.error("Error saving to localStorage:", error);
            resolve();
          }
        }),
        
        // Mettre à jour la base de données en arrière-plan
        updatedItem.articleId ? safeUpdateDatabase(updatedItem.articleId, menu.id, 'add') : Promise.resolve(),
        
        // Appeler le callback de notification en arrière-plan
        safeUpdateRemote(actionType, { menuId: menu.id, dish: updatedItem })
      ]).catch(error => {
        console.error("Error in background operations:", error);
      }).finally(() => {
        setIsProcessingAction(false);
      });
      
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive",
      });
      setIsProcessingAction(false);
    }
  }, [isProcessingAction, editingItem, menu, menus, toast, safeUpdateDatabase, safeUpdateRemote, handleCancelEdit, setIsProcessingAction]);

  const handleCancelEdit = useCallback(() => {
    // Supprimer l'ID de la liste des éléments en cours d'édition
    if (editingItem.item) {
      removeEditingItemId(editingItem.item.id);
    }
    
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingItem(false);
  }, [editingItem.item, removeEditingItemId]);

  const handleDeleteItem = useCallback(async (dishId: string, dishType: DishType) => {
    if (isProcessingAction || deleteProcessing) return;
    
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
      
      // Exécuter des tâches en arrière-plan sans bloquer l'UI
      const dish = itemsArray.find(d => d.id === dishId);
      
      // Notification utilisateur - immédiatement
      toast({
        title: "Succès",
        description: `Élément supprimé avec succès.`,
      });
      
      // Lancer toutes les opérations d'arrière-plan en parallèle
      Promise.all([
        // Mettre à jour localStorage de façon asynchrone
        new Promise<void>(resolve => {
          try {
            localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
            resolve();
          } catch (error) {
            console.error("Error saving to localStorage:", error);
            resolve();
          }
        }),
        
        // Traitement en arrière-plan sans bloquer l'UI
        dish?.articleId ? safeUpdateDatabase(dish.articleId, menu.id, 'remove') : Promise.resolve(),
        
        // Appeler le callback de notification en arrière-plan
        safeUpdateRemote(`delete_${dishType}`, { 
          menuId: menu.id, 
          dishId, 
          dishDetails: dishToDelete 
        })
      ]).catch(error => {
        console.error("Error in background delete operations:", error);
      }).finally(() => {
        // S'assurer que l'état de suppression est réinitialisé
        setDeleteProcessing(null);
      });
      
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
      setDeleteProcessing(null);
    }
  }, [isProcessingAction, deleteProcessing, handleDeleteDialogState, menu, menus, toast, safeUpdateDatabase, safeUpdateRemote]);

  // Fonction pour rendre une section de type de plat
  const renderDishTypeSection = useCallback((title: string, type: DishType, items: MenuItem[]) => {
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
                              isProcessingAction || 
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
                                isProcessingAction || 
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
                                isProcessingAction || 
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
              disabled={isProcessingAction}
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
  }, [deleteProcessing, handleAddItem, handleDeleteDialogState, handleDeleteItem, handleEditItem, isItemBeingEdited, isProcessingAction, readOnly]);

  // Vérifie si le menu est valide
  if (!menu) {
    return (
      <div className="p-4 text-center">
        <p>Aucun menu sélectionné ou menu invalide</p>
      </div>
    );
  }

  // Utilisation de useMemo pour éviter de recalculer ces sections à chaque rendu
  const mainDishesSection = useMemo(() => 
    renderDishTypeSection("Plats Principaux", "mainDish", menu.mainDishes || []),
  [renderDishTypeSection, menu.mainDishes]);

  const sideDishesSection = useMemo(() => 
    renderDishTypeSection("Accompagnements", "sideDish", menu.sideDishes || []),
  [renderDishTypeSection, menu.sideDishes]);

  const dessertsSection = useMemo(() => 
    renderDishTypeSection("Desserts", "dessert", menu.desserts || []),
  [renderDishTypeSection, menu.desserts]);

  return (
    <div className="space-y-4">
      {mainDishesSection}
      {sideDishesSection}
      {dessertsSection}

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
