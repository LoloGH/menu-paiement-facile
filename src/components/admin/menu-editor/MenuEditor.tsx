
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { MenuEditorProps, MenuItem, DishType, MenuDay } from "./types";
import { EditItemDialog } from "./EditItemDialog";
import { useMenuItemOperations } from "@/hooks/use-menu-item-operations";
import { useMenuState } from "@/contexts/MenuStateContext";

// Separate component for the dish type section to improve rendering performance
const DishTypeSection: React.FC<{
  title: string;
  type: DishType;
  items: MenuItem[];
  readOnly: boolean;
  onAddItem: (type: DishType) => void;
  onEditItem: (item: MenuItem, type: DishType) => void;
  onDeleteItem: (dishId: string, type: DishType) => void;
  deleteDialogOpen: {[key: string]: boolean};
  handleDeleteDialogState: (itemId: string, isOpen: boolean) => void;
  deleteProcessing: string | null;
  isItemBeingEdited: (itemId: string) => boolean;
  isProcessing: boolean;
}> = ({
  title,
  type,
  items,
  readOnly,
  onAddItem,
  onEditItem,
  onDeleteItem,
  deleteDialogOpen,
  handleDeleteDialogState,
  deleteProcessing,
  isItemBeingEdited,
  isProcessing,
}) => {
  // Memoize the section to prevent unnecessary re-renders
  return useMemo(() => (
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
                            onClick={() => onEditItem(dish, type)}
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
                            onClick={() => onDeleteItem(dish.id, type)}
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
            onClick={() => onAddItem(type)}
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
  ), [
    title, 
    type, 
    items, 
    readOnly, 
    onAddItem, 
    onEditItem, 
    onDeleteItem, 
    deleteDialogOpen, 
    handleDeleteDialogState, 
    deleteProcessing, 
    isItemBeingEdited, 
    isProcessing
  ]);
};

export const MenuEditor: React.FC<MenuEditorProps> = ({ 
  menu, 
  readOnly = false,
  onMenuUpdated 
}) => {
  // Use the shared menu state
  const { 
    editingItemIds, 
    addEditingItemId, 
    removeEditingItemId, 
    isProcessing, 
    setIsProcessing, 
    deleteProcessing, 
    setDeleteProcessing, 
    pendingOperations 
  } = useMenuState();
  
  // Use the menu item operations hook
  const { saveMenuItem, removeMenuItem } = useMenuItemOperations(onMenuUpdated);
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: DishType}>({
    item: null,
    type: 'mainDish'
  });
  
  // État pour suivre les dialogues de confirmation de suppression ouverts
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{[key: string]: boolean}>({});

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
    if (isProcessing) return;
    setEditingItem({item: null, type});
    setIsAddingItem(true);
  }, [isProcessing]);

  const handleEditItem = useCallback((item: MenuItem, type: DishType) => {
    if (isProcessing || isItemBeingEdited(item.id)) return;
    
    // Ajouter l'ID de l'élément à la liste des éléments en cours d'édition
    addEditingItemId(item.id);
    
    setEditingItem({item, type});
    setIsAddingItem(true);
  }, [isProcessing, isItemBeingEdited, addEditingItemId]);

  const handleSaveItem = useCallback(async (updatedItem: MenuItem) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Déterminer si c'est un nouvel élément ou une mise à jour
      const isNewItem = !editingItem.item || updatedItem.id.includes(`${editingItem.type}_`);
      
      // Utiliser le hook pour sauvegarder l'élément
      await saveMenuItem(updatedItem, menu.id, isNewItem);
      
    } catch (error) {
      console.error('Error in handleSaveItem:', error);
    } finally {
      // Réinitialiser les états uniquement en cas de succès
      setEditingItem({item: null, type: 'mainDish'});
      setIsAddingItem(false);
      
      // Supprimer l'ID de la liste des éléments en cours d'édition
      if (editingItem.item) {
        removeEditingItemId(editingItem.item.id);
      }
    }
  }, [isProcessing, editingItem, menu.id, setIsProcessing, saveMenuItem, removeEditingItemId]);

  const handleCancelEdit = useCallback(() => {
    // Supprimer l'ID de la liste des éléments en cours d'édition
    if (editingItem.item) {
      removeEditingItemId(editingItem.item.id);
    }
    
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingItem(false);
  }, [editingItem, removeEditingItemId]);

  const handleDeleteItem = useCallback(async (dishId: string, dishType: DishType) => {
    if (isProcessing || deleteProcessing) return;
    
    // Fermer le dialogue de confirmation
    handleDeleteDialogState(dishId, false);
    
    // Marquer cet élément spécifique comme étant en cours de suppression
    setDeleteProcessing(dishId);
    
    try {
      // Find the item to get its articleId
      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = itemTypeMap[dishType];
      const items = menu[itemType] as MenuItem[] || [];
      const dishToDelete = items.find(dish => dish.id === dishId);
      
      // Utiliser le hook pour supprimer l'élément
      await removeMenuItem(dishId, menu.id, dishType, dishToDelete?.articleId);
    } catch (error) {
      console.error('Error in handleDeleteItem:', error);
    }
  }, [isProcessing, deleteProcessing, menu, handleDeleteDialogState, setDeleteProcessing, removeMenuItem]);

  // Vérifie si le menu est valide
  if (!menu) {
    return (
      <div className="p-4 text-center">
        <p>Aucun menu sélectionné ou menu invalide</p>
      </div>
    );
  }
  
  // Afficher l'indicateur de chargement si des opérations sont en cours
  if (pendingOperations > 0) {
    console.log(`MenuEditor: ${pendingOperations} operations pending`);
  }

  return (
    <div className="space-y-4">
      <DishTypeSection
        title="Plats Principaux"
        type="mainDish"
        items={menu.mainDishes || []}
        readOnly={readOnly}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        deleteDialogOpen={deleteDialogOpen}
        handleDeleteDialogState={handleDeleteDialogState}
        deleteProcessing={deleteProcessing}
        isItemBeingEdited={isItemBeingEdited}
        isProcessing={isProcessing}
      />
      
      <DishTypeSection
        title="Accompagnements"
        type="sideDish"
        items={menu.sideDishes || []}
        readOnly={readOnly}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        deleteDialogOpen={deleteDialogOpen}
        handleDeleteDialogState={handleDeleteDialogState}
        deleteProcessing={deleteProcessing}
        isItemBeingEdited={isItemBeingEdited}
        isProcessing={isProcessing}
      />
      
      <DishTypeSection
        title="Desserts"
        type="dessert"
        items={menu.desserts || []}
        readOnly={readOnly}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        deleteDialogOpen={deleteDialogOpen}
        handleDeleteDialogState={handleDeleteDialogState}
        deleteProcessing={deleteProcessing}
        isItemBeingEdited={isItemBeingEdited}
        isProcessing={isProcessing}
      />

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
