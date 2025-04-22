import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreVertical, Plus, Trash2, Edit } from "lucide-react";
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
  const {
    toast
  } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    item: MenuItem | null;
    type: DishType;
  }>({
    item: null,
    type: 'mainDish'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
  }, [menu]);

  const handleAddItem = (type: DishType) => {
    if (isProcessing) return;
    setEditingItem({
      item: null,
      type
    });
    setIsAddingItem(true);
  };

  const handleEditItem = (item: MenuItem, type: DishType) => {
    if (isProcessing) return;
    setEditingItem({
      item,
      type
    });
    setIsAddingItem(true);
  };

  const handleSaveItem = async (updatedItem: MenuItem) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const {
        type
      } = editingItem;

      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      const itemType = itemTypeMap[type];
      const actionType = updatedItem.id.includes(`${type}_`) ? `add_${type}` : `update_${type}`;
      let updatedMenus = [...menus];

      updatedMenus = menus.map(m => {
        if (m.id === menu.id) {
          if (editingItem.item && m[itemType]) {
            const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
            const items = [...currentItems];
            const index = items.findIndex(item => item.id === editingItem.item?.id);
            if (index !== -1) {
              items[index] = updatedItem;
            } else {
              items.push(updatedItem);
            }
            return {
              ...m,
              [itemType]: items
            };
          } else {
            const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
            const items = [...currentItems, updatedItem];
            return {
              ...m,
              [itemType]: items
            };
          }
        }
        return m;
      });

      setMenus(updatedMenus);
      localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

      if (updatedItem.articleId) {
        try {
          const {
            data: existingAssociations,
            error: fetchError
          } = await supabase.from('menu_articles').select('*').eq('menu_day', menu.id).eq('article_id', updatedItem.articleId);
          if (fetchError) {
            console.error('Error checking existing menu article association:', fetchError);
            throw fetchError;
          }

          if (!existingAssociations || existingAssociations.length === 0) {
            const {
              error: insertError
            } = await supabase.from('menu_articles').insert({
              menu_day: menu.id,
              article_id: updatedItem.articleId
            });
            if (insertError) {
              console.error('Error saving menu article association:', insertError);
              throw insertError;
            }
            console.log('Menu article association saved successfully');
          } else {
            console.log('Menu article association already exists');
          }
        } catch (error) {
          console.error('Error in database operation:', error);
          toast({
            title: "Erreur de sauvegarde en base de données",
            description: "Une erreur est survenue lors de la sauvegarde des associations d'articles.",
            variant: "destructive"
          });
        }
      }

      if (onMenuUpdated) {
        try {
          await onMenuUpdated(actionType, {
            menuId: menu.id,
            dish: updatedItem
          });
        } catch (error) {
          console.error("Error in onMenuUpdated callback:", error);
        }
      }

      toast({
        title: "Succès",
        description: `${editingItem.item ? "Élément mis à jour" : "Nouvel élément ajouté"} avec succès.`
      });

      setEditingItem({
        item: null,
        type: 'mainDish'
      });
      setIsAddingItem(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem({
      item: null,
      type: 'mainDish'
    });
    setIsAddingItem(false);
  };

  const handleDeleteItem = async (dishId: string, dishType: DishType) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);

      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      const itemType = itemTypeMap[dishType];

      const itemsArray = Array.isArray(menu[itemType]) ? menu[itemType] as MenuItem[] : [];
      const dishToDelete = itemsArray.find(dish => dish.id === dishId);
      const updatedMenus = menus.map(m => {
        if (m.id === menu.id) {
          const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
          const dish = currentItems.find(d => d.id === dishId);

          if (dish?.articleId) {
            supabase.from('menu_articles').delete().eq('menu_day', menu.id).eq('article_id', dish.articleId).then(({
              error
            }) => {
              if (error) {
                console.error(`Error deleting menu article association:`, error);
                toast({
                  title: "Erreur",
                  description: "Impossible de supprimer l'association en base de données.",
                  variant: "destructive"
                });
              } else {
                console.log('Menu article association deleted successfully');
              }
            });
          }
          return {
            ...m,
            [itemType]: currentItems.filter(dish => dish.id !== dishId)
          };
        }
        return m;
      });
      setMenus(updatedMenus);
      localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
      if (onMenuUpdated) {
        try {
          await onMenuUpdated(`delete_${dishType}`, {
            menuId: menu.id,
            dishId,
            dishDetails: dishToDelete
          });
        } catch (error) {
          console.error("Error in onMenuUpdated callback:", error);
        }
      }
      toast({
        title: "Succès",
        description: `Élément supprimé avec succès.`
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDishTypeSection = (title: string, type: DishType, items: MenuItem[]) => {
    return <Card className="mb-4">
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
              {items && items.length > 0 ? items.map(dish => (
                <TableRow key={dish.id}>
                  <TableCell>{dish.name}</TableCell>
                  <TableCell>{dish.price}</TableCell>
                  <TableCell>{dish.description}</TableCell>
                  <TableCell>{dish.imageUrl || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditItem(dish, type)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action ne peut pas être annulée. Cela supprimera définitivement
                                cet élément du menu.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(dish.id, type)} className="bg-red-600">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Aucun élément trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!readOnly && <Button variant="outline" onClick={() => handleAddItem(type)} className="mt-2" disabled={isProcessing}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter{" "}
              {type === "mainDish" ? "un plat principal" : type === "sideDish" ? "un accompagnement" : "un dessert"}
            </Button>}
        </CardContent>
      </Card>;
  };

  if (!menu) {
    return <div className="p-4 text-center">
        <p>Aucun menu sélectionné ou menu invalide</p>
      </div>;
  }
  return <div className="space-y-4">
      {renderDishTypeSection("Plats Principaux", "mainDish", menu.mainDishes || [])}
      {renderDishTypeSection("Accompagnements", "sideDish", menu.sideDishes || [])}
      {renderDishTypeSection("Desserts", "dessert", menu.desserts || [])}

      {isAddingItem && <EditItemDialog item={editingItem.item} type={editingItem.type} onClose={handleCancelEdit} onSave={handleSaveItem} />}
    </div>;
};
