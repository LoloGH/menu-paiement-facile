
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
  }, [activeMenuId]);
  
  // Monitor background task queue and update pending operations count
  useEffect(() => {
    const checkPendingOperations = () => {
      const totalPending = globalTaskQueue.pending + globalTaskQueue.active;
      
      // Update pending operations count
      setPendingOperations(totalPending);
      
      // Reset processing flags if no pending operations
      if (totalPending === 0) {
        // Use a slight delay to avoid immediate UI transitions
        setTimeout(() => {
          setIsProcessing(false);
          setDeleteProcessing(null);
        }, 300);
      }
    };
    
    // Check pending operations every 250ms
    const intervalId = setInterval(checkPendingOperations, 250);
    
    return () => clearInterval(intervalId);
  }, []);

  const updateMenus = useCallback((updatedMenus: MenuDay[]) => {
    setMenus(updatedMenus);
  }, []);

  const saveMenusToLocalStorage = useCallback((updatedMenus: MenuDay[]) => {
    try {
      // Use requestAnimationFrame to avoid blocking rendering
      requestAnimationFrame(() => {
        localStorage.setItem('weeklyMenu', JSON.stringify(updatedMenus));
        
        // Dispatch an event to notify other components about the update
        const event = new CustomEvent('menu-updated', { detail: updatedMenus });
        window.dispatchEvent(event);
        
        console.log('Menus saved to localStorage successfully');
      });
    } catch (error) {
      console.error('Error saving menus to localStorage:', error);
    }
  }, []);

  const addEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prevIds => [...prevIds, itemId]);
  }, []);

  const removeEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prevIds => prevIds.filter(id => id !== itemId));
  }, []);

  // Update a menu item with optimistic updates
  const updateMenuItem = useCallback(async (
    menuId: string, 
    item: MenuItem, 
    isNew: boolean
  ): Promise<void> => {
    // Set processing state before the update
    setIsProcessing(true);
    
    try {
      const optimisticUpdate = () => {
        setMenus(prevMenus => {
          const updatedMenus = prevMenus.map(menu => {
            if (menu.id === menuId) {
              const itemType = item.type === 'main_dish' 
                ? 'mainDishes' 
                : item.type === 'side_dish' 
                  ? 'sideDishes' 
                  : 'desserts';
                  
              const itemsArray = [...(menu[itemType as keyof MenuDay] as MenuItem[])];
              
              if (isNew) {
                // Add new item
                itemsArray.push(item);
              } else {
                // Update existing item
                const index = itemsArray.findIndex(existing => existing.id === item.id);
                if (index !== -1) {
                  itemsArray[index] = item;
                } else {
                  // Item wasn't found but we need to update, so add it
                  itemsArray.push(item);
                }
              }
              
              return { ...menu, [itemType]: itemsArray };
            }
            return menu;
          });
          
          // Save to localStorage in background
          setTimeout(() => {
            saveMenusToLocalStorage(updatedMenus);
          }, 0);
          
          return updatedMenus;
        });
      };
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        optimisticUpdate();
        
        // Remove the item from editing state
        if (!isNew && item.id) {
          removeEditingItemId(item.id);
        }
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du menu.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [saveMenusToLocalStorage, removeEditingItemId, toast]);

  // Delete a menu item with optimistic updates
  const deleteMenuItem = useCallback(async (
    menuId: string, 
    dishId: string, 
    dishType: DishType
  ): Promise<void> => {
    try {
      const optimisticDelete = () => {
        setMenus(prevMenus => {
          const updatedMenus = prevMenus.map(menu => {
            if (menu.id === menuId) {
              const itemTypeKey = `${dishType}s` as keyof MenuDay;
              const currentItems = [...(menu[itemTypeKey] as MenuItem[] || [])];
              
              // Filter out the item to be deleted
              const updatedItems = currentItems.filter(item => item.id !== dishId);
              
              return { ...menu, [itemTypeKey]: updatedItems };
            }
            return menu;
          });
          
          // Save to localStorage in background
          setTimeout(() => {
            saveMenusToLocalStorage(updatedMenus);
          }, 0);
          
          return updatedMenus;
        });
      };
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        optimisticDelete();
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément du menu.",
        variant: "destructive",
      });
      setDeleteProcessing(null);
    }
  }, [saveMenusToLocalStorage, toast]);

  const value = {
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
    deleteMenuItem
  };

  return (
    <MenuStateContext.Provider value={value}>
      {children}
    </MenuStateContext.Provider>
  );
};

export const useMenuState = (): MenuStateContextProps => {
  const context = useContext(MenuStateContext);
  
  if (!context) {
    throw new Error('useMenuState must be used within a MenuStateProvider');
  }
  
  return context;
};
