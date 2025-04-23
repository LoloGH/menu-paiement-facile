
import React, { useState, useEffect } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Plus, Trash2, Edit } from "lucide-react";
import { MenuEditorProps, MenuDay, MenuItem, DishType } from "./types";
import { EditItemDialog } from "./EditItemDialog";
import { supabase } from "@/integrations/supabase/client";
import { playSounds } from "@/utils/soundEffects";

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

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
  }, [menu]);

  const handleAddItem = (type: DishType) => {
    if (isProcessing) return;
    setEditingItem({item: null, type});
    setIsAddingItem(true);
  };

  const handleEditItem = (item: MenuItem, type: DishType) => {
    if (isProcessing) return;
    setEditingItem({item, type});
    setIsAddingItem(true);
  };

  const handleSaveItem = async (updatedItem: MenuItem) => {
    if (isProcessing) return;
    
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
      
      let updatedMenus = [...menus];
      
      // Mise à jour du menu concerné
      updatedMenus = menus.map(m => {
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
      
      // Sauvegarder dans localStorage
      localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
      
      // Mettre à jour la base de données si articleId est présent - sans attendre
      let dbUpdatePromise = Promise.resolve();
      
      if (updatedItem.articleId) {
        dbUpdatePromise = new Promise<void>(async (resolve) => {
          try {
            // Vérifier si l'article est déjà associé à ce menu
            const { data: existingAssociations, error: fetchError } = await supabase
              .from('menu_articles')
              .select('*')
              .eq('menu_day', menu.id)
              .eq('article_id', updatedItem.articleId);
              
            if (fetchError) {
              console.error('Error checking existing menu article association:', fetchError);
              // On résout quand même la promesse pour ne pas bloquer
              resolve();
              return;
            }
            
            // Si l'association n'existe pas, la créer
            if (!existingAssociations || existingAssociations.length === 0) {
              const { error: insertError } = await supabase
                .from('menu_articles')
                .insert({
                  menu_day: menu.id,
                  article_id: updatedItem.articleId
                });
                
              if (insertError) {
                console.error('Error saving menu article association:', insertError);
              } else {
                console.log('Menu article association saved successfully');
              }
            } else {
              console.log('Menu article association already exists');
            }
            
            resolve();
          } catch (error) {
            console.error('Error in database operation:', error);
            toast({
              title: "Erreur de sauvegarde en base de données",
              description: "Une erreur est survenue lors de la sauvegarde des associations d'articles.",
              variant: "destructive",
            });
            resolve(); // Résoudre quand même pour éviter de bloquer
          }
        });
      }
      
      // Callback de notification - sans attendre la fin
      let callbackPromise = Promise.resolve();
      
      if (onMenuUpdated) {
        callbackPromise = new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              // Ne pas attendre la résolution du callback
              onMenuUpdated(actionType, { menuId: menu.id, dish: updatedItem })
                .catch(error => {
                  console.error("Error in onMenuUpdated callback:", error);
                })
                .finally(() => {
                  resolve();
                });
            } catch (error) {
              console.error("Error triggering onMenuUpdated callback:", error);
              resolve();
            }
          }, 0);
        });
      }
      
      // Notification à l'utilisateur
      toast({
        title: "Succès",
        description: `${editingItem.item ? "Élément mis à jour" : "Nouvel élément ajouté"} avec succès.`,
      });
      
      // Réinitialiser l'état d'édition
      setEditingItem({item: null, type: 'mainDish'});
      setIsAddingItem(false);
      
      // Exécuter les promises en arrière-plan sans bloquer l'interface
      Promise.all([dbUpdatePromise, callbackPromise])
        .catch(e => console.error("Background operations error:", e))
        .finally(() => {
          // Ne rien faire ici, nous avons déjà mis à jour l'interface
        });
      
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingItem(false);
  };

  const handleDeleteItem = async (dishId: string, dishType: DishType) => {
    if (isProcessing || deleteProcessing) return;
    
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
      localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
      
      // Notification utilisateur - immédiatement
      toast({
        title: "Succès",
        description: `Élément supprimé avec succès.`,
      });
      
      // Effectuer les opérations de base de données en arrière-plan
      const dish = itemsArray.find(d => d.id === dishId);
      
      // Traitement en arrière-plan
      if (dish?.articleId) {
        // Supprimer l'association en base de données sans bloquer l'UI
        supabase
          .from('menu_articles')
          .delete()
          .eq('menu_day', menu.id)
          .eq('article_id', dish.articleId)
          .then(({ error }) => {
            if (error) {
              console.error(`Error deleting menu article association:`, error);
              toast({
                title: "Avertissement",
                description: "L'élément a été supprimé localement mais l'association en base de données pourrait ne pas avoir été effacée.",
                variant: "default",
              });
            } else {
              console.log('Menu article association deleted successfully');
            }
          });
      }
      
      // Appeler le callback de notification en arrière-plan sans bloquer l'interface
      if (onMenuUpdated) {
        setTimeout(() => {
          try {
            onMenuUpdated(`delete_${dishType}`, { menuId: menu.id, dishId, dishDetails: dishToDelete })
              .catch(error => {
                console.error("Error in onMenuUpdated callback:", error);
              });
          } catch (error) {
            console.error("Error triggering onMenuUpdated callback:", error);
          }
        }, 0);
      }
      
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
    } finally {
      // S'assurer que l'état de suppression est réinitialisé
      setDeleteProcessing(null);
    }
  };

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
                  <TableRow key={dish.id}>
                    <TableCell>{dish.name}</TableCell>
                    <TableCell>{dish.price}</TableCell>
                    <TableCell>{dish.description}</TableCell>
                    <TableCell>{dish.imageUrl}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!readOnly && (
                            <DropdownMenuItem
                              onClick={() => handleEditItem(dish, type)}
                              disabled={isProcessing || deleteProcessing === dish.id}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {!readOnly && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-500" 
                                  disabled={isProcessing || deleteProcessing === dish.id}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
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
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteItem(dish.id, type)}
                                    disabled={isProcessing || deleteProcessing === dish.id}
                                    className={deleteProcessing === dish.id ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    {deleteProcessing === dish.id ? (
                                      <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Suppression...
                                      </span>
                                    ) : (
                                      "Supprimer"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
