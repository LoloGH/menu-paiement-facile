
import { useState, useCallback } from 'react';
import { MenuDay, MenuItem, DishType } from '@/components/admin/menu-editor/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runAsyncInBackground, saveToLocalStorageAsync } from '@/utils/backgroundWorker';

interface UseMenuOperationsProps {
  onMenuUpdated?: (action: string, details?: any) => Promise<void>;
}

/**
 * Hook pour gérer les opérations sur les menus de manière optimisée
 */
export function useMenuOperations({ onMenuUpdated }: UseMenuOperationsProps = {}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Met à jour localStorage avec les nouveaux menus
   */
  const saveToLocalStorage = useCallback(async (menus: MenuDay[]) => {
    try {
      await saveToLocalStorageAsync('weeklyMenu', menus);
      
      // Déclencher un événement personnalisé pour mettre à jour d'autres parties de l'application
      const event = new CustomEvent('menu-updated', { detail: menus });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Error saving menus to localStorage:', error);
      return false;
    }
  }, []);

  /**
   * Met à jour l'association menu-article dans la base de données
   */
  const updateDatabaseAssociation = useCallback(async (
    articleId: string | undefined,
    menuId: string,
    action: 'add' | 'remove'
  ) => {
    if (!articleId) return;
    
    return runAsyncInBackground(async () => {
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
            }
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
          }
        }
      } catch (error) {
        console.error('Error in database operation:', error);
      }
    });
  }, []);

  /**
   * Exécute le callback onMenuUpdated de manière non bloquante
   */
  const notifyMenuUpdated = useCallback(async (action: string, details?: any) => {
    if (!onMenuUpdated) return;
    
    return runAsyncInBackground(async () => {
      try {
        await onMenuUpdated(action, details);
      } catch (error) {
        console.error('Error in onMenuUpdated callback:', error);
      }
    });
  }, [onMenuUpdated]);

  /**
   * Ajoute ou met à jour un élément de menu
   */
  const saveMenuItem = useCallback(async (
    item: MenuItem,
    type: DishType,
    menuId: string,
    menus: MenuDay[],
    setMenus: React.Dispatch<React.SetStateAction<MenuDay[]>>
  ) => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    
    try {
      // Obtenir le nom du tableau correspondant au type
      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = itemTypeMap[type];
      const isNewItem = item.id.includes(`${type}_`);
      const actionType = isNewItem ? `add_${type}` : `update_${type}`;
      
      // Mise à jour optimiste de l'interface
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          // Ensure m[itemType] is an array before using spread
          const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
          
          if (!isNewItem) {
            // Mettre à jour un élément existant
            const items = [...currentItems];
            const index = items.findIndex(i => i.id === item.id);
            if (index !== -1) {
              items[index] = item;
            }
            return {...m, [itemType]: items};
          } else {
            // Ajouter un nouvel élément
            return {...m, [itemType]: [...currentItems, item]};
          }
        }
        return m;
      });
      
      // Mettre à jour l'état local immédiatement
      setMenus(updatedMenus);
      
      // Notification à l'utilisateur
      toast({
        title: "Succès",
        description: `${isNewItem ? "Nouvel élément ajouté" : "Élément mis à jour"} avec succès.`,
      });
      
      // Démarrer les opérations en arrière-plan
      Promise.all([
        saveToLocalStorage(updatedMenus),
        item.articleId ? updateDatabaseAssociation(item.articleId, menuId, 'add') : Promise.resolve(),
        notifyMenuUpdated(actionType, { menuId, dish: item })
      ]).catch(error => {
        console.error('Error in background operations:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Error saving menu item:', error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, saveToLocalStorage, updateDatabaseAssociation, notifyMenuUpdated, toast]);

  /**
   * Supprime un élément de menu
   */
  const deleteMenuItem = useCallback(async (
    itemId: string,
    type: DishType,
    menuId: string,
    menus: MenuDay[],
    setMenus: React.Dispatch<React.SetStateAction<MenuDay[]>>
  ) => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    
    try {
      // Obtenir le nom du tableau correspondant au type
      const itemTypeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = itemTypeMap[type];
      
      // Trouver le menu et l'élément à supprimer
      const menu = menus.find(m => m.id === menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
      
      // Ensure menu[itemType] is an array before using find
      const itemsArray = Array.isArray(menu[itemType]) ? menu[itemType] as MenuItem[] : [];
      const itemToDelete = itemsArray.find(i => i.id === itemId);
      
      if (!itemToDelete) {
        throw new Error('Item not found');
      }
      
      // Mise à jour optimiste de l'interface
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          // Ensure m[itemType] is an array before filtering
          const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
          
          return {
            ...m,
            [itemType]: currentItems.filter(i => i.id !== itemId),
          };
        }
        return m;
      });
      
      // Mettre à jour l'état local immédiatement
      setMenus(updatedMenus);
      
      // Notification utilisateur
      toast({
        title: "Succès",
        description: `Élément supprimé avec succès.`,
      });
      
      // Démarrer les opérations en arrière-plan
      Promise.all([
        saveToLocalStorage(updatedMenus),
        itemToDelete.articleId ? updateDatabaseAssociation(itemToDelete.articleId, menuId, 'remove') : Promise.resolve(),
        notifyMenuUpdated(`delete_${type}`, { 
          menuId, 
          dishId: itemId, 
          dishDetails: itemToDelete 
        })
      ]).catch(error => {
        console.error('Error in background delete operations:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, saveToLocalStorage, updateDatabaseAssociation, notifyMenuUpdated, toast]);

  return {
    isProcessing,
    saveMenuItem,
    deleteMenuItem,
    saveToLocalStorage
  };
}
