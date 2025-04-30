
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MenuItem, DishType } from '@/components/admin/menu-editor/types';
import { globalTaskQueue, withRetry } from '@/utils/backgroundWorker';
import { useMenuState } from '@/contexts/MenuStateContext';

export const useMenuItemOperations = (onMenuUpdated?: (actionType: string, details: any) => Promise<void>) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { updateMenuItem, deleteMenuItem } = useMenuState();

  /**
   * Update the database with menu article associations
   */
  const updateMenuArticleAssociation = useCallback(async (
    articleId: string | undefined, 
    menuId: string, 
    action: 'add' | 'remove'
  ): Promise<void> => {
    if (!articleId) return;

    return await globalTaskQueue.add(async () => {
      try {
        if (action === 'add') {
          // Check if the association already exists with automatic retry
          const result = await withRetry(async () => {
            return await supabase
              .from('menu_articles')
              .select('*')
              .eq('menu_day', menuId)
              .eq('article_id', articleId);
          });
            
          if (result.error) {
            console.error('Error checking existing menu article association:', result.error);
            return;
          }
          
          // If the association doesn't exist, create it
          if (!result.data || result.data.length === 0) {
            const insertResult = await withRetry(async () => {
              return await supabase
                .from('menu_articles')
                .insert({
                  menu_day: menuId,
                  article_id: articleId
                });
            });
              
            if (insertResult.error) {
              console.error('Error saving menu article association:', insertResult.error);
            } else {
              console.log('Menu article association saved successfully');
            }
          } else {
            console.log('Menu article association already exists');
          }
        } else if (action === 'remove') {
          // Delete the association with automatic retry
          const result = await withRetry(async () => {
            return await supabase
              .from('menu_articles')
              .delete()
              .eq('menu_day', menuId)
              .eq('article_id', articleId);
          });

          if (result.error) {
            console.error(`Error deleting menu article association:`, result.error);
          } else {
            console.log('Menu article association deleted successfully');
          }
        }
      } catch (error) {
        console.error('Error in database operation:', error);
      }
    });
  }, []);

  /**
   * Log admin action safely in background with retry
   */
  const safelyLogAdminAction = useCallback(async (
    actionType: string,
    details: any
  ): Promise<void> => {
    if (!onMenuUpdated) return;
    
    return globalTaskQueue.add(async () => {
      try {
        // Use withRetry to automatically retry in case of failure
        await withRetry(async () => {
          await onMenuUpdated(actionType, details);
          return { error: null }; // Format to match withRetry expectation
        }, 3, 500); // 3 retries with 500ms base delay
        
        console.log(`Admin action logged successfully: ${actionType}`);
      } catch (error) {
        // Just log the error but don't throw - this prevents UI blocking
        console.error(`Failed to log admin action after retries: ${actionType}`, error);
      }
    });
  }, [onMenuUpdated]);

  /**
   * Save a menu item with optimistic updates and background processing
   */
  const saveMenuItem = useCallback(async (
    item: MenuItem,
    menuId: string,
    isNew: boolean
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Get action type for logging
      const actionType = isNew 
        ? `add_${item.type === 'main_dish' ? 'mainDish' : item.type === 'side_dish' ? 'sideDish' : 'dessert'}`
        : `update_${item.type === 'main_dish' ? 'mainDish' : item.type === 'side_dish' ? 'sideDish' : 'dessert'}`;
      
      // Update menu item in context (which handles optimistic updates)
      await updateMenuItem(menuId, item, isNew);
      
      // Process database updates in background
      globalTaskQueue.add(async () => {
        try {
          // Update database associations
          if (item.articleId) {
            await updateMenuArticleAssociation(item.articleId, menuId, 'add');
          }
          
          // Call the safelyLogAdminAction function for logging
          await safelyLogAdminAction(actionType, { 
            menuId, 
            dish: item 
          });
        } catch (error) {
          console.error("Error in background tasks:", error);
        }
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'élément.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateMenuItem, updateMenuArticleAssociation, safelyLogAdminAction, toast]);
  
  /**
   * Delete a menu item with optimistic updates and background processing
   */
  const removeMenuItem = useCallback(async (
    dishId: string,
    menuId: string,
    dishType: DishType,
    articleId?: string
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Delete in context (which handles optimistic updates)
      await deleteMenuItem(menuId, dishId, dishType);
      
      // Process database updates in background
      globalTaskQueue.add(async () => {
        try {
          // Remove the association from the database
          if (articleId) {
            await updateMenuArticleAssociation(articleId, menuId, 'remove');
          }
          
          // Call the safelyLogAdminAction function for logging
          await safelyLogAdminAction(`delete_${dishType}`, { 
            menuId,
            dishId,
          });
        } catch (error) {
          console.error("Error in background tasks:", error);
        }
      });
    } catch (error) {
      console.error('Error removing menu item:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [deleteMenuItem, updateMenuArticleAssociation, safelyLogAdminAction, toast]);

  return {
    isLoading,
    saveMenuItem,
    removeMenuItem,
    updateMenuArticleAssociation
  };
};
