
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MenuDay, MenuItem, DishType } from '@/components/admin/menu-editor/types';
import { globalTaskQueue } from '@/utils/backgroundWorker';

export const useMenuOperations = () => {
  const { toast } = useToast();
  const [isUpdatingDatabase, setIsUpdatingDatabase] = useState(false);

  /**
   * Update the database with menu article associations
   */
  const updateMenuArticleAssociation = async (
    articleId: string | undefined, 
    menuId: string, 
    action: 'add' | 'remove'
  ): Promise<void> => {
    if (!articleId) {
      return;
    }

    setIsUpdatingDatabase(true);

    try {
      if (action === 'add') {
        // Check if the association already exists
        const { data: existingAssociations, error: fetchError } = await supabase
          .from('menu_articles')
          .select('*')
          .eq('menu_day', menuId)
          .eq('article_id', articleId);
          
        if (fetchError) {
          console.error('Error checking existing menu article association:', fetchError);
          return;
        }
        
        // If the association doesn't exist, create it
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
        // Delete the association
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
    } finally {
      setIsUpdatingDatabase(false);
    }
  };

  /**
   * Process database operations in background using the task queue
   */
  const processInBackground = <T>(
    operation: () => Promise<T>, 
    successMessage: string,
    errorMessage: string
  ): Promise<T> => {
    return globalTaskQueue.add(async () => {
      try {
        const result = await operation();
        if (successMessage) {
          toast({
            title: "Succès",
            description: successMessage,
          });
        }
        return result;
      } catch (error) {
        console.error('Background operation error:', error);
        if (errorMessage) {
          toast({
            title: "Erreur",
            description: errorMessage,
            variant: "destructive",
          });
        }
        throw error;
      }
    });
  };

  /**
   * Add or update a menu item in the database and local storage
   */
  const addOrUpdateMenuItem = async (
    item: MenuItem, 
    menuId: string, 
    menus: MenuDay[],
    type: DishType,
    isNew: boolean
  ): Promise<MenuDay[]> => {
    try {
      // Update local storage first for immediate UI feedback
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          const itemTypeKey = `${type}s` as keyof MenuDay;
          const currentItems = (m[itemTypeKey] as MenuItem[]) || [];
          
          let updatedItems: MenuItem[];
          
          if (isNew) {
            updatedItems = [...currentItems, item];
          } else {
            updatedItems = currentItems.map(existing => 
              existing.id === item.id ? item : existing
            );
            
            // If item wasn't found, add it
            if (!updatedItems.some(i => i.id === item.id)) {
              updatedItems.push(item);
            }
          }
          
          return { ...m, [itemTypeKey]: updatedItems };
        }
        return m;
      });
      
      // Update database in background
      if (item.articleId) {
        processInBackground(
          () => updateMenuArticleAssociation(item.articleId, menuId, 'add'),
          '',  // No toast notification here, will be handled by caller
          'Erreur lors de la mise à jour de la base de données'
        );
      }
      
      return updatedMenus;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  };

  /**
   * Delete a menu item from the database and local storage
   */
  const deleteMenuItem = async (
    dishId: string, 
    menuId: string,
    dishType: DishType,
    menus: MenuDay[]
  ): Promise<MenuDay[]> => {
    try {
      // Find the menu and item to delete
      const menu = menus.find(m => m.id === menuId);
      if (!menu) throw new Error('Menu not found');
      
      const itemTypeKey = `${dishType}s` as keyof MenuDay;
      const currentItems = (menu[itemTypeKey] as MenuItem[]) || [];
      const itemToDelete = currentItems.find(item => item.id === dishId);
      
      // Update local menus first for immediate UI feedback
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          return {
            ...m,
            [itemTypeKey]: currentItems.filter(item => item.id !== dishId)
          };
        }
        return m;
      });
      
      // Update database in background if needed
      if (itemToDelete?.articleId) {
        processInBackground(
          () => updateMenuArticleAssociation(itemToDelete.articleId, menuId, 'remove'),
          '',  // No toast notification here, will be handled by caller
          'Erreur lors de la suppression de l\'association dans la base de données'
        );
      }
      
      return updatedMenus;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  };

  return {
    isUpdatingDatabase,
    updateMenuArticleAssociation,
    processInBackground,
    addOrUpdateMenuItem,
    deleteMenuItem
  };
};
