
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditItemDialog } from "./EditItemDialog";
import { MenuItemsTable } from "./MenuItemsTable";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuEditorProps } from "./types";
import { Utensils, Coffee, IceCream } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MenuEditor: React.FC<MenuEditorProps> = ({ 
  menu, 
  menus, 
  setMenus, 
  readOnly = false,
  onMenuUpdated 
}) => {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: string}>({
    item: null,
    type: ''
  });

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
  }, [menu]);

  const handleEditItem = (item: MenuItem, type: string) => {
    console.log(`Editing ${type} item:`, item);
    setEditingItem({item: {...item}, type});
  };

  const handleSaveItem = async (updatedItem: MenuItem) => {
    if (!menu) return;

    const itemType = `${editingItem.type}s` as keyof MenuDay;
    const items = [...(menu[itemType] as MenuItem[])];
    const index = items.findIndex(item => item.id === updatedItem.id);

    let updatedItems;
    if (index !== -1) {
      updatedItems = items.map((item, i) => i === index ? updatedItem : item);
    } else {
      updatedItems = [...items, updatedItem];
    }

    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          [itemType]: updatedItems
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    setEditingItem({ item: null, type: '' });

    if (onMenuUpdated) {
      await onMenuUpdated(
        index !== -1 ? 'update_item' : 'add_item', 
        { menuId: menu.id, item: updatedItem }
      );
    }

    toast({
      title: "Succès",
      description: `${updatedItem.name} a été ${index !== -1 ? 'mis à jour' : 'ajouté'} avec succès.`,
    });
  };

  const handleDeleteItem = async (itemId: string, type: string) => {
    if (!menu) return;

    const itemType = `${type}s` as keyof MenuDay;
    const items = [...(menu[itemType] as MenuItem[])];
    const updatedItems = items.filter(item => item.id !== itemId);

    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          [itemType]: updatedItems
        };
      }
      return m;
    });

    setMenus(updatedMenus);

    if (onMenuUpdated) {
      await onMenuUpdated('delete_item', { menuId: menu.id, itemId, type });
    }

    // Supprimer l'élément de la base de données
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "L'élément a été supprimé avec succès.",
    });
  };

  const handleAddItem = (type: string) => {
    setEditingItem({
      item: null,
      type
    });
  };

  return (
    <div className="space-y-4">
      <MenuItemsTable
        items={menu.mainDishes}
        type="mainDish"
        title="Plats Principaux"
        icon={<Utensils className="h-5 w-5 mr-2 text-restaurant-purple" />}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onAdd={() => handleAddItem('mainDish')}
        isEditing={!readOnly}
      />

      <MenuItemsTable
        items={menu.sideDishes}
        type="sideDish"
        title="Accompagnements"
        icon={<Coffee className="h-5 w-5 mr-2 text-restaurant-terracotta" />}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onAdd={() => handleAddItem('sideDish')}
        isEditing={!readOnly}
      />

      <MenuItemsTable
        items={menu.desserts}
        type="dessert"
        title="Desserts"
        icon={<IceCream className="h-5 w-5 mr-2 text-restaurant-red" />}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onAdd={() => handleAddItem('dessert')}
        isEditing={!readOnly}
      />

      {editingItem.item !== null && (
        <EditItemDialog
          item={editingItem.item}
          type={editingItem.type}
          onClose={() => setEditingItem({ item: null, type: '' })}
          onSave={handleSaveItem}
          menuId={menu.id}
        />
      )}
    </div>
  );
};
