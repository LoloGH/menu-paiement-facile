
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { MenuDay, MenuItem, DishType } from '../components/admin/menu-editor/types';

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
}

const MenuStateContext = createContext<MenuStateContextProps | undefined>(undefined);

export const MenuStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [deleteProcessing, setDeleteProcessing] = useState<string | null>(null);
  const [editingItemIds, setEditingItemIds] = useState<string[]>([]);

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
    }
  }, []);

  const addEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prev => [...prev, itemId]);
  }, []);

  const removeEditingItemId = useCallback((itemId: string) => {
    setEditingItemIds(prev => prev.filter(id => id !== itemId));
  }, []);

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
