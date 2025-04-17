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
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MenuEditorSidebar } from "./MenuEditorSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const MenuEditor = () => {
  const { toast } = useToast();
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [editingMenu, setEditingMenu] = useState<MenuDay | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem | null; type: string }>({
    item: null,
    type: "",
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState("mainDish");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = () => {
    const savedMenus = localStorage.getItem("weeklyMenu");
    if (savedMenus) {
      try {
        setMenus(JSON.parse(savedMenus));
      } catch (error) {
        console.error("Erreur lors du chargement des menus:", error);
        convertAndSetMenus();
      }
    } else {
      convertAndSetMenus();
    }
  };

  const convertAndSetMenus = () => {
    const convertedMenus = weeklyMenu.map((menu) => {
      const mainDishes: MenuItem[] = [];
      const sideDishes: MenuItem[] = [];
      const desserts: MenuItem[] = [];

      menu.mealOptions.forEach((option) => {
        if (option.mainDish && !mainDishes.some((dish) => dish.id === option.mainDish.id)) {
          mainDishes.push({
            id: option.mainDish.id,
            name: option.mainDish.name,
            price: option.mainDish.price,
            description: option.mainDish.description,
            imageUrl: option.mainDish.image,
          });
        }

        if (
          option.sideDish &&
          !sideDishes.some((dish) => dish.id === option.sideDish.id)
        ) {
          sideDishes.push({
            id: option.sideDish.id,
            name: option.sideDish.name,
            price: option.sideDish.price,
            description: option.sideDish.description,
            imageUrl: option.sideDish.image,
          });
        }

        if (
          option.dessert &&
          !desserts.some((dish) => dish.id === option.dessert.id)
        ) {
          desserts.push({
            id: option.dessert.id,
            name: option.dessert.name,
            price: option.dessert.price,
            description: option.dessert.description,
            imageUrl: option.dessert.image,
          });
        }
      });

      return {
        id: menu.id,
        day: menu.day,
        date: menu.date,
        mainDishes,
        sideDishes,
        desserts,
      };
    });

    setMenus(convertedMenus);
  };

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

  const handleSelectMenu = (menuId: string) => {
    const selectedMenu = menus.find(menu => menu.id === menuId);
    if (selectedMenu) {
      setEditingMenu(selectedMenu);
      setActiveMenuTab("mainDish");
      setPreviewMode(false);
    }
  };

  const handleSaveMenu = () => {
    if (!editingMenu) return;
    const updatedMenus = menus.map((menu) =>
      menu.id === editingMenu.id ? editingMenu : menu
    );
    setMenus(updatedMenus);
    saveMenusToLocalStorage(updatedMenus);
    setEditingMenu(null);
    setPreviewMode(false);
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
    convertAndSetMenus();
    localStorage.removeItem("weeklyMenu");
    const event = new CustomEvent("menu-updated");
    window.dispatchEvent(event);
    toast({
      title: "Menus réinitialisés",
      description: "Les menus ont été réinitialisés aux valeurs par défaut.",
    });
    setConfirmResetOpen(false);
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MenuEditorSidebar 
          menus={menus}
          activeMenuId={editingMenu?.id || ''}
          onSelectMenu={handleSelectMenu}
        />
        
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Utensils className="h-6 w-6 mr-2 text-restaurant-purple" />
              Gestion des Menus
            </h2>
            <Button 
              variant="outline" 
              onClick={() => setConfirmResetOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Réinitialiser aux valeurs par défaut
            </Button>
          </div>

          {editingMenu ? (
            <div className="space-y-6">
              {/* Main editing interface */}
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
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Sélectionnez un jour dans le menu latéral pour commencer l'édition</p>
            </div>
          )}
        </div>
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
              Êtes-vous sûr de vouloir réinitialiser tous les menus aux valeurs par défaut ?
              Cette action est irréversible et supprimera toutes vos modifications.
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
    </SidebarProvider>
  );
};
