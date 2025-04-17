
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

  const handleEditMenu = (menu: MenuDay) => {
    setEditingMenu({ ...menu });
    setActiveMenuTab("mainDish");
    setPreviewMode(false);
  };

  const handleCancelEdit = () => {
    setEditingMenu(null);
    setEditingItem({ item: null, type: "" });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Utensils className="h-6 w-6 mr-2 text-restaurant-purple" />
          Gestion des Menus
        </h2>
        <Button
          variant="outline"
          onClick={resetToDefault}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Réinitialiser aux valeurs par défaut
        </Button>
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

      {editingMenu && (
        <Card className="border-2 border-blue-200 mb-4">
          <CardHeader className="bg-blue-50 pb-2">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <CardTitle>
                  <Input
                    value={editingMenu.day}
                    onChange={(e) => handleUpdateMenuField("day", e.target.value)}
                    className="font-bold text-xl"
                    placeholder="Jour de la semaine"
                  />
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    value={editingMenu.date || ""}
                    onChange={(e) => handleUpdateMenuField("date", e.target.value)}
                    className="text-sm"
                    placeholder="Date (ex: 10 avril)"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={togglePreviewMode}
                  className="text-purple-600"
                >
                  {previewMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-1" /> Éditer
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" /> Aperçu
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="text-gray-500">
                  <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
                <Button onClick={handleSaveMenu} className="bg-restaurant-purple">
                  <Save className="h-4 w-4 mr-1" /> Enregistrer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {previewMode ? (
              <div className="p-4">
                <MenuPreview menu={editingMenu} />
              </div>
            ) : (
              <Tabs value={activeMenuTab} onValueChange={setActiveMenuTab} className="w-full">
                <TabsList className="w-full bg-gray-100 p-0 rounded-none">
                  <TabsTrigger
                    value="mainDish"
                    className="flex-1 data-[state=active]:bg-restaurant-purple data-[state=active]:text-white"
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    Plats principaux
                  </TabsTrigger>
                  <TabsTrigger
                    value="sideDish"
                    className="flex-1 data-[state=active]:bg-restaurant-terracotta data-[state=active]:text-white"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Accompagnements
                  </TabsTrigger>
                  <TabsTrigger
                    value="dessert"
                    className="flex-1 data-[state=active]:bg-restaurant-red data-[state=active]:text-white"
                  >
                    <IceCream className="h-4 w-4 mr-2" />
                    Desserts
                  </TabsTrigger>
                </TabsList>
                <div className="p-4">
                  <TabsContent value="mainDish">
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
                  </TabsContent>
                  <TabsContent value="sideDish">
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
                  </TabsContent>
                  <TabsContent value="dessert">
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
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {menus.map((menu) => (
          <Card
            key={menu.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
              editingMenu?.id === menu.id ? "border-2 border-blue-400" : ""
            }`}
          >
            <CardHeader className="bg-gray-50 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-restaurant-purple" />
                  <span>{menu.day}</span>
                  {menu.date && (
                    <span className="ml-2 text-sm text-gray-500">({menu.date})</span>
                  )}
                </CardTitle>
                {editingMenu?.id === menu.id ? (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" /> Annuler
                    </Button>
                    <Button onClick={handleSaveMenu} className="bg-restaurant-purple">
                      <Save className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleEditMenu(menu)}
                    className="bg-white text-restaurant-purple hover:bg-restaurant-purple hover:text-white transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                <MenuItemsTable
                  items={menu.mainDishes}
                  type="mainDish"
                  title="Plats principaux"
                  icon={<Utensils className="h-5 w-5 text-restaurant-purple" />}
                  onEdit={(item) => setEditingItem({ item, type: "mainDish" })}
                  onDelete={(id) => handleDeleteItem(id, "mainDish")}
                  onAdd={() => setEditingItem({ item: null, type: "mainDish" })}
                  isEditing={editingMenu?.id === menu.id}
                />
                <MenuItemsTable
                  items={menu.sideDishes}
                  type="sideDish"
                  title="Accompagnements"
                  icon={<Coffee className="h-5 w-5 text-restaurant-terracotta" />}
                  onEdit={(item) => setEditingItem({ item, type: "sideDish" })}
                  onDelete={(id) => handleDeleteItem(id, "sideDish")}
                  onAdd={() => setEditingItem({ item: null, type: "sideDish" })}
                  isEditing={editingMenu?.id === menu.id}
                />
                <MenuItemsTable
                  items={menu.desserts}
                  type="dessert"
                  title="Desserts"
                  icon={<IceCream className="h-5 w-5 text-restaurant-red" />}
                  onEdit={(item) => setEditingItem({ item, type: "dessert" })}
                  onDelete={(id) => handleDeleteItem(id, "dessert")}
                  onAdd={() => setEditingItem({ item: null, type: "dessert" })}
                  isEditing={editingMenu?.id === menu.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
