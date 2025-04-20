
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { v4 as uuidv4 } from 'uuid';
import { MenuEditorProps, MenuDay, MenuItem } from "./types";
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
  const [isAddingMainDish, setIsAddingMainDish] = useState(false);
  const [isAddingSideDish, setIsAddingSideDish] = useState(false);
  const [isAddingDessert, setIsAddingDessert] = useState(false);
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: string}>({
    item: null,
    type: ''
  });

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
  }, [menu]);

  const handleAddMainDish = () => {
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingMainDish(true);
  };

  const handleAddSideDish = () => {
    setEditingItem({item: null, type: 'sideDish'});
    setIsAddingSideDish(true);
  };

  const handleAddDessert = () => {
    setEditingItem({item: null, type: 'dessert'});
    setIsAddingDessert(true);
  };

  const handleEditItem = (item: MenuItem, type: string) => {
    setEditingItem({item, type});
    if (type === 'mainDish') setIsAddingMainDish(true);
    if (type === 'sideDish') setIsAddingSideDish(true);
    if (type === 'dessert') setIsAddingDessert(true);
  };

  const handleSaveItem = async (updatedItem: MenuItem) => {
    const { type } = editingItem;
    
    let updatedMenus = [...menus];
    let action = '';
    let itemType = '';
    
    // Determiner le type d'élément et d'action
    if (type === 'mainDish') {
      itemType = 'mainDishes';
      action = updatedItem.id.includes('mainDish_') ? 'add_main_dish' : 'update_main_dish';
      setIsAddingMainDish(false);
    } else if (type === 'sideDish') {
      itemType = 'sideDishes';
      action = updatedItem.id.includes('sideDish_') ? 'add_side_dish' : 'update_side_dish';
      setIsAddingSideDish(false);
    } else if (type === 'dessert') {
      itemType = 'desserts';
      action = updatedItem.id.includes('dessert_') ? 'add_dessert' : 'update_dessert';
      setIsAddingDessert(false);
    }
    
    // Mise à jour du menu concerné
    updatedMenus = menus.map(m => {
      if (m.id === menu.id) {
        // Vérifier si c'est un nouvel élément ou une mise à jour
        if (editingItem.item && m[itemType as keyof MenuDay]) {
          // Mise à jour
          const items = [...(m[itemType as keyof MenuDay] as MenuItem[])];
          const index = items.findIndex(item => item.id === editingItem.item?.id);
          if (index !== -1) {
            items[index] = updatedItem;
          } else {
            items.push(updatedItem);
          }
          return {...m, [itemType]: items};
        } else {
          // Ajout
          const items = [...(m[itemType as keyof MenuDay] as MenuItem[]), updatedItem];
          return {...m, [itemType]: items};
        }
      }
      return m;
    });
    
    // Mettre à jour l'état local
    setMenus(updatedMenus);
    
    // Sauvegarder dans localStorage
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
    
    // Mettre à jour la base de données si articleId est présent
    if (updatedItem.articleId) {
      try {
        // Vérifier si l'article est déjà associé à ce menu
        const { data: existingAssociations, error: fetchError } = await supabase
          .from('menu_articles')
          .select('*')
          .eq('menu_day', menu.id)
          .eq('article_id', updatedItem.articleId);
          
        if (fetchError) {
          console.error('Error checking existing menu article association:', fetchError);
          throw fetchError;
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
          variant: "destructive",
        });
      }
    }
    
    // Callback de notification
    if (onMenuUpdated) {
      await onMenuUpdated(action, { menuId: menu.id, dish: updatedItem });
    }
    
    // Notification à l'utilisateur
    toast({
      title: "Succès",
      description: `${editingItem.item ? "Élément mis à jour" : "Nouvel élément ajouté"} avec succès.`,
    });
    
    // Réinitialiser l'état d'édition
    setEditingItem({item: null, type: ''});
  };

  const handleCancelEdit = () => {
    setEditingItem({item: null, type: ''});
    setIsAddingMainDish(false);
    setIsAddingSideDish(false);
    setIsAddingDessert(false);
  };

  const handleDeleteMainDish = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        const dish = m.mainDishes.find(d => d.id === dishId);
        
        // Si le plat a un articleId, supprimer l'association en base de données
        if (dish?.articleId) {
          supabase
            .from('menu_articles')
            .delete()
            .eq('menu_day', menu.id)
            .eq('article_id', dish.articleId)
            .then(({ error }) => {
              if (error) {
                console.error('Error deleting menu article association:', error);
                toast({
                  title: "Erreur",
                  description: "Impossible de supprimer l'association en base de données.",
                  variant: "destructive",
                });
              } else {
                console.log('Menu article association deleted successfully');
              }
            });
        }
        
        return {
          ...m,
          mainDishes: m.mainDishes.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_main_dish', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Plat principal supprimé avec succès.",
    });
  };

  const handleDeleteSideDish = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        const dish = m.sideDishes.find(d => d.id === dishId);
        
        // Si le plat a un articleId, supprimer l'association en base de données
        if (dish?.articleId) {
          supabase
            .from('menu_articles')
            .delete()
            .eq('menu_day', menu.id)
            .eq('article_id', dish.articleId)
            .then(({ error }) => {
              if (error) {
                console.error('Error deleting menu article association:', error);
                toast({
                  title: "Erreur",
                  description: "Impossible de supprimer l'association en base de données.",
                  variant: "destructive",
                });
              } else {
                console.log('Menu article association deleted successfully');
              }
            });
        }
        
        return {
          ...m,
          sideDishes: m.sideDishes.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_side_dish', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Accompagnement supprimé avec succès.",
    });
  };

  const handleDeleteDessert = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        const dish = m.desserts.find(d => d.id === dishId);
        
        // Si le dessert a un articleId, supprimer l'association en base de données
        if (dish?.articleId) {
          supabase
            .from('menu_articles')
            .delete()
            .eq('menu_day', menu.id)
            .eq('article_id', dish.articleId)
            .then(({ error }) => {
              if (error) {
                console.error('Error deleting menu article association:', error);
                toast({
                  title: "Erreur",
                  description: "Impossible de supprimer l'association en base de données.",
                  variant: "destructive",
                });
              } else {
                console.log('Menu article association deleted successfully');
              }
            });
        }
        
        return {
          ...m,
          desserts: m.desserts.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_dessert', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Dessert supprimé avec succès.",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plats Principaux</CardTitle>
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
              {menu.mainDishes.map((dish) => (
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
                            onClick={() => handleEditItem(dish, 'mainDish')}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer ce plat
                                  principal?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMainDish(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={handleAddMainDish}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un plat principal
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accompagnements</CardTitle>
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
              {menu.sideDishes.map((dish) => (
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
                            onClick={() => handleEditItem(dish, 'sideDish')}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer cet
                                  accompagnement?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSideDish(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={handleAddSideDish}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un accompagnement
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desserts</CardTitle>
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
              {menu.desserts.map((dish) => (
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
                            onClick={() => handleEditItem(dish, 'dessert')}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer ce dessert?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDessert(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={handleAddDessert}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un dessert
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialogs de modification/ajout */}
      {isAddingMainDish && (
        <EditItemDialog
          item={editingItem.item}
          type="mainDish"
          onClose={handleCancelEdit}
          onSave={handleSaveItem}
        />
      )}
      
      {isAddingSideDish && (
        <EditItemDialog
          item={editingItem.item}
          type="sideDish"
          onClose={handleCancelEdit}
          onSave={handleSaveItem}
        />
      )}
      
      {isAddingDessert && (
        <EditItemDialog
          item={editingItem.item}
          type="dessert"
          onClose={handleCancelEdit}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};
