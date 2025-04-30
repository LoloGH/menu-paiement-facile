
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { MenuDay, MenuItem, DishType } from '../components/admin/menu-editor/types';
import { globalTaskQueue } from '@/utils/backgroundWorker';
import { useToast } from '@/hooks/use-toast';

interface MenuStateContextProps {
  menus: MenuDay[];
  updateMenus: (updatedMenus: MenuDay[]) => void;
  saveMenusToLocalStorage: (updatedMenus: MenuDay[]) => void;
  activeMenuId: string;
  setActiveMenuId: (id: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  deleteProcessing: string | null;
  setDeleteProcessing: (itemId: string | null) => void;
  editingItemIds: string[];
  addEditingItemId: (itemId: string) => void;
  removeEditingItemId: (itemId: string) => void;
  pendingOperations: number;
  updateMenuItem: (menuId: string, item: MenuItem, isNew: boolean) => Promise<void>;
  deleteMenuItem: (menuId: string, dishId: string, dishType: DishType) => Promise<void>;
}

const MenuStateContext = createContext<MenuStateContextProps | undefined>(undefined);

export const MenuStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [deleteProcessing, setDeleteProcessing] = useState<string | null>(null);
  const [editingItemIds, setEditingItemIds] = useState<string[]>([]);
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  
  // Load menus from localStorage when component mounts
  useEffect(() => {
    try {
      const savedMenus = localStorage.getItem('weeklyMenu');
      if (savedMenus) {
        const parsedMenus = JSON.parse(savedMenus);
        setMenus(parsedMenus);
        
        // Set the first menu as active if there's no active menu
        if (parsedMenus.length > 0 && !activeMenuId) {
          setActiveMenuId(parsedMenus[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading menus from localStorage:", error);
    }
    
    // Listen to pending operations and reset processing flags when done
    const checkPendingOperations = () => {
      if (globalTaskQueue.pending === 0 && globalTaskQueue.active === 0) {
        // Reset processing flags if no pending operations
        setIsProcessing(false);
        setDeleteProcessing(null);
        setPendingOperations(0);
      } else {
        setPendingOperations(globalTaskQueue.pending + globalTaskQueue.active);
      }
    };
    
    // Check pending operations every 500ms
    const intervalId = setInterval(checkPendingOperations, 500);
    
    return () => clearInterval(intervalId);
  }, [activeMenuId]);

  const updateMenus = useCallback((updatedMenus: MenuDay[]) => {
    setMenus(updatedMenus);
  }, []);

  const saveMenusToLocalStorage = useCallback((updatedMenus: MenuDay[]) => {
    try {
      console.log("Saving menus to localStorage:", updatedMenus);
      localStorage.setItem('weeklyMenu', JSON.stringify(updatedMenus));
      
      // Trigger an event to notify other components
      const event = new CustomEvent('menu-updated', { detail: updatedMenus });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error saving menus to localStorage:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des menus.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prev => [...prev, itemId]);
  }, []);

  const removeEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prev => prev.filter(id => id !== itemId));
  }, []);

  // Function to update a menu item with optimistic updates
  const updateMenuItem = useCallback(async (menuId: string, item: MenuItem, isNew: boolean) => {
    try {
      // Get the type key (mainDishes, sideDishes, desserts)
      const typeMap: Record<string, keyof MenuDay> = {
        main_dish: 'mainDishes',
        side_dish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = typeMap[item.type] as keyof MenuDay;
      
      // Update menus with optimistic update
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          const currentItems = [...(Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [])];
          
          if (isNew) {
            return { ...m, [itemType]: [...currentItems, item] };
          } else {
            const updatedItems = currentItems.map(existingItem => 
              existingItem.id === item.id ? item : existingItem
            );
            
            // If item wasn't found, add it
            if (!updatedItems.some(i => i.id === item.id)) {
              updatedItems.push(item);
            }
            
            return { ...m, [itemType]: updatedItems };
          }
        }
        return m;
      });
      
      // Update UI immediately
      setMenus(updatedMenus);
      
      // Save to localStorage
      saveMenusToLocalStorage(updatedMenus);
      
      // Show success toast
      toast({
        title: "Succès",
        description: isNew ? "Élément ajouté avec succès" : "Élément mis à jour avec succès",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'élément.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  }, [menus, saveMenusToLocalStorage, toast]);

  // Function to delete a menu item with optimistic updates
  const deleteMenuItem = useCallback(async (menuId: string, dishId: string, dishType: DishType) => {
    try {
      // Get the type key (mainDishes, sideDishes, desserts)
      const typeMap: Record<DishType, keyof MenuDay> = {
        mainDish: 'mainDishes',
        sideDish: 'sideDishes',
        dessert: 'desserts'
      };
      
      const itemType = typeMap[dishType];
      
      // Update menus with optimistic delete
      const updatedMenus = menus.map(m => {
        if (m.id === menuId) {
          const currentItems = Array.isArray(m[itemType]) ? m[itemType] as MenuItem[] : [];
          return {
            ...m,
            [itemType]: currentItems.filter(item => item.id !== dishId)
          };
        }
        return m;
      });
      
      // Update UI immediately
      setMenus(updatedMenus);
      
      // Save to localStorage
      saveMenusToLocalStorage(updatedMenus);
      
      // Show success toast
      toast({
        title: "Succès",
        description: "Élément supprimé avec succès",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  }, [menus, saveMenusToLocalStorage, toast]);

  return (
    <MenuStateContext.Provider 
      value={{
        menus,
        updateMenus,
        saveMenusToLocalStorage,
        activeMenuId,
        setActiveMenuId,
        isProcessing,
        setIsProcessing,
        deleteProcessing,
        setDeleteProcessing,
        editingItemIds,
        addEditingItemId,
        removeEditingItemId,
        pendingOperations,
        updateMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </MenuStateContext.Provider>
  );
};

export const useMenuState = (): MenuStateContextProps => {
  const context = useContext(MenuStateContext);
  if (context === undefined) {
    throw new Error('useMenuState must be used within a MenuStateProvider');
  }
  return context;
};
