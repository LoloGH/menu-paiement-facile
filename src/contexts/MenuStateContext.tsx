
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { MenuDay, MenuItem } from '@/components/admin/menu-editor/types';

interface MenuStateContextType {
  isProcessingAction: boolean;
  setIsProcessingAction: (isProcessing: boolean) => void;
  editingItemIds: string[];
  addEditingItemId: (id: string) => void;
  removeEditingItemId: (id: string) => void;
  pendingOperations: Map<string, () => Promise<void>>;
  addPendingOperation: (key: string, operation: () => Promise<void>) => void;
  removePendingOperation: (key: string) => void;
  executePendingOperation: (key: string) => Promise<void>;
  menus: MenuDay[];
  setMenus: React.Dispatch<React.SetStateAction<MenuDay[]>>;
}

export const MenuStateContext = createContext<MenuStateContextType>({
  isProcessingAction: false,
  setIsProcessingAction: () => {},
  editingItemIds: [],
  addEditingItemId: () => {},
  removeEditingItemId: () => {},
  pendingOperations: new Map(),
  addPendingOperation: () => {},
  removePendingOperation: () => {},
  executePendingOperation: async () => {},
  menus: [],
  setMenus: () => {},
});

interface MenuStateProviderProps {
  children: ReactNode;
  initialMenus?: MenuDay[];
  onMenusChanged?: (menus: MenuDay[]) => void;
}

export const MenuStateProvider: React.FC<MenuStateProviderProps> = ({ 
  children, 
  initialMenus = [],
  onMenusChanged 
}) => {
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [editingItemIds, setEditingItemIds] = useState<string[]>([]);
  const [pendingOperations] = useState<Map<string, () => Promise<void>>>(new Map());
  const [menus, setMenusState] = useState<MenuDay[]>(initialMenus);

  const setMenus = (newMenus: React.SetStateAction<MenuDay[]>) => {
    setMenusState(prev => {
      const updatedMenus = typeof newMenus === 'function' ? newMenus(prev) : newMenus;
      // Appeler le callback si fourni
      if (onMenusChanged) {
        setTimeout(() => onMenusChanged(updatedMenus), 0);
      }
      return updatedMenus;
    });
  };
  
  const addEditingItemId = (id: string) => {
    setEditingItemIds(prev => [...prev, id]);
  };
  
  const removeEditingItemId = (id: string) => {
    setEditingItemIds(prev => prev.filter(itemId => itemId !== id));
  };
  
  const addPendingOperation = (key: string, operation: () => Promise<void>) => {
    pendingOperations.set(key, operation);
  };
  
  const removePendingOperation = (key: string) => {
    pendingOperations.delete(key);
  };
  
  const executePendingOperation = async (key: string) => {
    const operation = pendingOperations.get(key);
    if (operation) {
      try {
        await operation();
      } finally {
        pendingOperations.delete(key);
      }
    }
  };

  return (
    <MenuStateContext.Provider 
      value={{ 
        isProcessingAction, 
        setIsProcessingAction,
        editingItemIds,
        addEditingItemId,
        removeEditingItemId,
        pendingOperations,
        addPendingOperation,
        removePendingOperation,
        executePendingOperation,
        menus,
        setMenus
      }}
    >
      {children}
    </MenuStateContext.Provider>
  );
};

export const useMenuState = () => useContext(MenuStateContext);
