
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { weeklyMenu } from "@/data/menuData";
import {
  Save,
  Edit,
  X,
  AlertCircle,
  Calendar,
  Utensils,
  Coffee,
  IceCream,
  Eye,
} from "lucide-react";
import { MenuDay, MenuItem } from "./types";
import { EditItemDialog } from "./EditItemDialog";
import { MenuPreview } from "./MenuPreview";
import { MenuItemsTable } from "./MenuItemsTable";

interface MenuEditorProps {
  menu: MenuDay;
  menus: MenuDay[];
  setMenus: React.Dispatch<React.SetStateAction<MenuDay[]>>;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({ menu, menus, setMenus }) => {
  const { toast } = useToast();
  const [editingMenu, setEditingMenu] = useState<MenuDay | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem | null; type: string }>({
    item: null,
    type: "",
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState("mainDish");
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize editing menu when menu prop changes
  useEffect(() => {
    if (menu) {
      setEditingMenu({ ...menu });
    }
  }, [menu]);

  const saveMenusToLocalStorage = (updatedMenus: MenuDay[]) => {
    try {
      localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
      const event = new CustomEvent("menu-updated", { detail: updatedMenus });
      window.dispatchEvent(event);
      toast({
        title: "Sauvegarde réussie",
        description:
          "Les menus ont été sauvegardés avec succès. Les changements sont maintenant visibles sur le site.",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des menus:", error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de la sauvegarde des menus.",
        variant: "destructive",
      });
    }
  };

  const handleSaveMenu = () => {
    if (!editingMenu) return;
    const updatedMenus = menus.map((m) =>
      m.id === editingMenu.id ? editingMenu : m
    );
    setMenus(updatedMenus);
    saveMenusToLocalStorage(updatedMenus);
    setEditingMenu(null);
    setPreviewMode(false);
    
    // Reinitialize editing menu with updated data
    const updatedMenu = updatedMenus.find(m => m.id === menu.id);
    if (updatedMenu) {
      setEditingMenu({ ...updatedMenu });
    }
  };

  const handleUpdateMenuField = (field: string, value: string) => {
    if (!editingMenu) return;
    setEditingMenu({ ...editingMenu, [field]: value });
  };

  const handleSaveItem = (savedItem: MenuItem) => {
    if (!editingMenu || !editingItem.type) return;

    const itemType = `${editingItem.type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    const index = items.findIndex((item) => item.id === savedItem.id);

    if (index !== -1) {
      items[index] = savedItem;
    } else {
      items.push({
        ...savedItem,
        id: `${editingItem.type}_${Date.now()}`,
      });
    }

    setEditingMenu({
      ...editingMenu,
      [itemType]: items,
    });

    setEditingItem({ item: null, type: "" });

    toast({
      title: "Élément sauvegardé",
      description:
        index !== -1
          ? "L'élément a été mis à jour avec succès."
          : "Nouvel élément ajouté avec succès.",
    });
  };

  const handleDeleteItem = (itemId: string, type: string) => {
    if (!editingMenu) return;
    const itemType = `${type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    const updatedItems = items.filter((item) => item.id !== itemId);

    setEditingMenu({
      ...editingMenu,
      [itemType]: updatedItems,
    });

    toast({
      title: "Élément supprimé",
      description: "L'élément a été supprimé avec succès.",
    });
  };

  const resetToDefault = () => {
    setConfirmResetOpen(true);
  };

  const confirmReset = () => {
    // Get the original data for this menu from weeklyMenu
    const originalMenuData = weeklyMenu.find(m => m.id === menu.id);
    if (!originalMenuData) return;

    // Convert the original menu data to the MenuDay format
    const convertedMenu = {
      id: originalMenuData.id,
      day: originalMenuData.day,
      date: originalMenuData.date,
      mainDishes: [] as MenuItem[],
      sideDishes: [] as MenuItem[],
      desserts: [] as MenuItem[]
    };

    // Extract unique dishes from the original menu
    originalMenuData.mealOptions.forEach((option) => {
      if (option.mainDish && !convertedMenu.mainDishes.some(dish => dish.id === option.mainDish.id)) {
        convertedMenu.mainDishes.push({
          id: option.mainDish.id,
          name: option.mainDish.name,
          price: option.mainDish.price,
          description: option.mainDish.description,
          imageUrl: option.mainDish.image,
        });
      }

      if (option.sideDish && !convertedMenu.sideDishes.some(dish => dish.id === option.sideDish.id)) {
        convertedMenu.sideDishes.push({
          id: option.sideDish.id,
          name: option.sideDish.name,
          price: option.sideDish.price,
          description: option.sideDish.description,
          imageUrl: option.sideDish.image,
        });
      }

      if (option.dessert && !convertedMenu.desserts.some(dish => dish.id === option.dessert.id)) {
        convertedMenu.desserts.push({
          id: option.dessert.id,
          name: option.dessert.name,
          price: option.dessert.price,
          description: option.dessert.description,
          imageUrl: option.dessert.image,
        });
      }
    });

    // Update just this menu in the menus array
    const updatedMenus = menus.map(m => m.id === menu.id ? convertedMenu : m);
    setMenus(updatedMenus);
    saveMenusToLocalStorage(updatedMenus);
    setEditingMenu(convertedMenu);
    
    toast({
      title: "Menu réinitialisé",
      description: "Le menu a été réinitialisé aux valeurs par défaut.",
    });
    
    setConfirmResetOpen(false);
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  if (!editingMenu) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg">Chargement du menu...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Utensils className="h-6 w-6 mr-2 text-restaurant-purple" />
          Gestion du Menu: {editingMenu.day}
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={togglePreviewMode}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Éditer" : "Aperçu"}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Réinitialiser ce menu
          </Button>
          <Button 
            onClick={handleSaveMenu}
            className="bg-restaurant-purple hover:bg-restaurant-purple/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {previewMode ? (
          <MenuPreview menu={editingMenu} />
        ) : (
          <div className="grid gap-6">
            <MenuItemsTable
              items={editingMenu.mainDishes}
              type="mainDish"
              title="Plats principaux"
              icon={<Utensils className="h-5 w-5 text-restaurant-purple" />}
              onEdit={(item) => setEditingItem({ item, type: "mainDish" })}
              onDelete={(id) => handleDeleteItem(id, "mainDish")}
              onAdd={() => setEditingItem({ item: null, type: "mainDish" })}
              isEditing={true}
            />
            
            <MenuItemsTable
              items={editingMenu.sideDishes}
              type="sideDish"
              title="Accompagnements"
              icon={<Coffee className="h-5 w-5 text-restaurant-terracotta" />}
              onEdit={(item) => setEditingItem({ item, type: "sideDish" })}
              onDelete={(id) => handleDeleteItem(id, "sideDish")}
              onAdd={() => setEditingItem({ item: null, type: "sideDish" })}
              isEditing={true}
            />
            
            <MenuItemsTable
              items={editingMenu.desserts}
              type="dessert"
              title="Desserts"
              icon={<IceCream className="h-5 w-5 text-restaurant-red" />}
              onEdit={(item) => setEditingItem({ item, type: "dessert" })}
              onDelete={(id) => handleDeleteItem(id, "dessert")}
              onAdd={() => setEditingItem({ item: null, type: "dessert" })}
              isEditing={true}
            />
          </div>
        )}
      </div>

      {editingItem.item !== null && (
        <EditItemDialog
          item={editingItem.item}
          type={editingItem.type}
          onClose={() => setEditingItem({ item: null, type: "" })}
          onSave={handleSaveItem}
        />
      )}

      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Confirmation de réinitialisation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir réinitialiser ce menu aux valeurs par défaut ?
              Cette action est irréversible et supprimera toutes vos modifications pour ce jour.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmReset} variant="destructive">
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Eye(props: { className?: string; mr?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
