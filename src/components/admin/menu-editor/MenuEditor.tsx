import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  onDeleteItem: (dishId: string, type: DishType, articleId?: string) => void;
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
                      onOpenChange={(open) => {
                        // N'autorise pas la fermeture par clic à l'extérieur pendant la suppression
                        if (deleteProcessing === dish.id && !open) return;
                        handleDeleteDialogState(dish.id, open);
                      }}
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
                            onClick={() => {
                              // Déclencher la suppression sans fermer immédiatement le dialogue
                              onDeleteItem(dish.id, type, dish.articleId);
                              // Le dialogue sera fermé par le callback après la suppression
                            }}
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

  // Fonction améliorée pour gérer l'ouverture/fermeture des dialogues de suppression
  const handleDeleteDialogState = useCallback((itemId: string, isOpen: boolean) => {
    // Ne pas fermer le dialogue si une suppression est en cours
    if (deleteProcessing === itemId && !isOpen) {
      console.log(`Preventing dialog close for item ${itemId} as deletion is in progress`);
      return;
    }
    
    // Utiliser requestAnimationFrame pour éviter les blocages d'interface
    requestAnimationFrame(() => {
      console.log(`Setting dialog state for ${itemId} to ${isOpen ? 'open' : 'closed'}`);
      setDeleteDialogOpen(prev => ({
        ...prev,
        [itemId]: isOpen
      }));
    });
  }, [deleteProcessing]);

  const handleAddItem = useCallback((type: DishType) => {
    if (isProcessing) return;
    
    // Use setTimeout to prevent UI freeze when opening dialog
    setTimeout(() => {
      setEditingItem({item: null, type});
      setIsAddingItem(true);
    }, 0);
  }, [isProcessing]);

  const handleEditItem = useCallback((item: MenuItem, type: DishType) => {
    if (isProcessing || isItemBeingEdited(item.id)) return;
    
    // Use setTimeout to prevent UI freeze when opening dialog
    setTimeout(() => {
      // Ajouter l'ID de l'élément à la liste des éléments en cours d'édition
      addEditingItemId(item.id);
      
      setEditingItem({item, type});
      setIsAddingItem(true);
    }, 0);
  }, [isProcessing, isItemBeingEdited, addEditingItemId]);

  const handleSaveItem = useCallback(async (updatedItem: MenuItem) => {
    if (isProcessing) return;
    
    console.log("Handling save item:", updatedItem);
    setIsProcessing(true);
    
    try {
      // Déterminer si c'est un nouvel élément ou une mise à jour
      const isNewItem = !editingItem.item || updatedItem.id.includes(`${editingItem.type}_`);
      
      // Run the save operation in the next event cycle to allow UI to update
      setTimeout(async () => {
        try {
          // Utiliser le hook pour sauvegarder l'élément
          await saveMenuItem(updatedItem, menu.id, isNewItem);
        } catch (error) {
          console.error('Error in handleSaveItem:', error);
        } finally {
          // Reset editing state
          setEditingItem({item: null, type: 'mainDish'});
          setIsAddingItem(false);
          
          // Editing state will be cleared by the context via saveMenuItem
        }
      }, 0);
      
    } catch (error) {
      console.error('Error in handleSaveItem:', error);
      setIsProcessing(false);
    }
  }, [isProcessing, editingItem, menu.id, setIsProcessing, saveMenuItem]);

  const handleCancelEdit = useCallback(() => {
    // Supprimer l'ID de la liste des éléments en cours d'édition
    if (editingItem.item) {
      removeEditingItemId(editingItem.item.id);
    }
    
    setEditingItem({item: null, type: 'mainDish'});
    setIsAddingItem(false);
  }, [editingItem, removeEditingItemId]);

  // New effect to monitor pending operations and handle dialog closure
  useEffect(() => {
    // If there are no pending operations and we have a deleteProcessing item,
    // it means the deletion has completed and we can close the dialog
    if (pendingOperations === 0 && deleteProcessing) {
      console.log(`All operations completed, closing dialog for ${deleteProcessing}`);
      
      // Small delay before closing to ensure smooth transitions
      setTimeout(() => {
        handleDeleteDialogState(deleteProcessing, false);
        // We don't reset deleteProcessing here - that's handled by the context
      }, 100);
    }
  }, [pendingOperations, deleteProcessing, handleDeleteDialogState]);

  const handleDeleteItem = useCallback(async (dishId: string, dishType: DishType, articleId?: string) => {
    if (isProcessing || deleteProcessing) {
      console.log(`Deletion already in progress, ignoring request for ${dishId}`);
      return;
    }
    
    // Mark this specific item as being in deletion process
    console.log(`Setting deleteProcessing state for ${dishId}`);
    setDeleteProcessing(dishId);
    
    // Use setTimeout to allow UI to update before starting delete operation
    setTimeout(async () => {
      try {
        console.log(`Starting removeMenuItem for dish: ${dishId}`);
        
        // Use the hook to remove the item (now runs in background)
        await removeMenuItem(dishId, menu.id, dishType, articleId);
        
        // We intentionally keep the dialog open until the task completes
        // The MenuStateContext monitoring will tell us when it's done
        
        // Only after a confirmation that deletion is complete should we close the dialog
        // This is now handled by the effect monitoring pendingOperations in this component
        
      } catch (error) {
        console.error('Error in handleDeleteItem:', error);
        
        // In case of error, we need to reset the deletion state and close dialog
        handleDeleteDialogState(dishId, false);
        setDeleteProcessing(null);
      }
    }, 50); // Small timeout to allow UI update first
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

      {/* Dialog d'édition - rendu conditionnel optimisé */}
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
