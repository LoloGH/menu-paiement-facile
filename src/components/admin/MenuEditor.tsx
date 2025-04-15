
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { weeklyMenu } from "@/data/menuData";
import { Save, Edit, X, Plus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface MenuDay {
  id: string;
  day: string;
  date?: string;
  mainDishes: MenuItem[];
  sideDishes: MenuItem[];
  desserts: MenuItem[];
}

export const MenuEditor = () => {
  const { toast } = useToast();
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [editingMenu, setEditingMenu] = useState<MenuDay | null>(null);
  const [editingItem, setEditingItem] = useState<{item: MenuItem | null, type: string}>(
    {item: null, type: ''}
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Charger les menus depuis le localStorage au démarrage
  useEffect(() => {
    const savedMenus = localStorage.getItem('weeklyMenu');
    if (savedMenus) {
      try {
        setMenus(JSON.parse(savedMenus));
      } catch (error) {
        console.error("Erreur lors du chargement des menus sauvegardés:", error);
        // Si erreur de chargement, convertir les données du weeklyMenu
        convertAndSetMenus();
      }
    } else {
      // Pas de données sauvegardées, convertir les données du weeklyMenu
      convertAndSetMenus();
    }
  }, []);

  const convertAndSetMenus = () => {
    // Convertir les données du weeklyMenu au format MenuDay
    const convertedMenus: MenuDay[] = weeklyMenu.map(menu => {
      return {
        id: menu.id,
        day: menu.day,
        date: menu.date,
        mainDishes: menu.mealOptions.flatMap(option => ({
          id: option.mainDish.id,
          name: option.mainDish.name,
          price: option.mainDish.price,
          description: option.mainDish.description,
          imageUrl: option.mainDish.image
        })),
        sideDishes: menu.mealOptions.flatMap(option => ({
          id: option.sideDish.id,
          name: option.sideDish.name,
          price: option.sideDish.price,
          description: option.sideDish.description,
          imageUrl: option.sideDish.image
        })),
        desserts: menu.mealOptions.flatMap(option => ({
          id: option.dessert.id,
          name: option.dessert.name,
          price: option.dessert.price,
          description: option.dessert.description,
          imageUrl: option.dessert.image
        }))
      };
    });
    
    setMenus(convertedMenus);
  };

  const saveMenusToLocalStorage = (updatedMenus: MenuDay[]) => {
    try {
      localStorage.setItem('weeklyMenu', JSON.stringify(updatedMenus));
      toast({
        title: "Sauvegarde réussie",
        description: "Les menus ont été sauvegardés avec succès.",
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
    
    const updatedMenus = menus.map(menu => 
      menu.id === editingMenu.id ? editingMenu : menu
    );
    
    setMenus(updatedMenus);
    saveMenusToLocalStorage(updatedMenus);
    setEditingMenu(null);
  };

  const handleEditMenu = (menu: MenuDay) => {
    setEditingMenu({...menu});
  };

  const handleCancelEdit = () => {
    setEditingMenu(null);
    setEditingItem({item: null, type: ''});
  };

  const handleUpdateMenuField = (field: string, value: string) => {
    if (!editingMenu) return;
    setEditingMenu({...editingMenu, [field]: value});
  };

  const handleEditItem = (item: MenuItem, type: string) => {
    setEditingItem({item: {...item}, type});
  };

  const handleUpdateItemField = (field: string, value: string) => {
    if (!editingItem.item) return;
    
    let parsedValue: string | number = value;
    if (field === 'price') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setEditingItem({
      ...editingItem, 
      item: {...editingItem.item, [field]: parsedValue}
    });
  };

  const handleSaveItem = () => {
    if (!editingMenu || !editingItem.item || !editingItem.type) return;
    
    const itemType = `${editingItem.type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    
    const index = items.findIndex(item => item.id === editingItem.item?.id);
    
    if (index !== -1) {
      // Mettre à jour l'élément existant
      items[index] = editingItem.item;
    } else {
      // Ajouter un nouvel élément
      items.push({
        ...editingItem.item,
        id: `${editingItem.type}_${Date.now()}`
      });
    }
    
    setEditingMenu({
      ...editingMenu,
      [itemType]: items
    });
    
    setEditingItem({item: null, type: ''});
  };

  const handleAddNewItem = (type: string) => {
    const newItem: MenuItem = {
      id: '', // Sera généré lors de la sauvegarde
      name: '',
      price: 0,
      description: '',
      imageUrl: ''
    };
    
    setEditingItem({item: newItem, type});
  };

  const handleDeleteItem = (itemId: string, type: string) => {
    if (!editingMenu) return;
    
    const itemType = `${type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    
    const updatedItems = items.filter(item => item.id !== itemId);
    
    setEditingMenu({
      ...editingMenu,
      [itemType]: updatedItems
    });
  };

  const resetToDefault = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les menus aux valeurs par défaut ? Cette action est irréversible.")) {
      convertAndSetMenus();
      localStorage.removeItem('weeklyMenu');
      toast({
        title: "Menus réinitialisés",
        description: "Les menus ont été réinitialisés aux valeurs par défaut.",
      });
    }
  };

  const getMenuTableSection = (menu: MenuDay, type: string, title: string) => {
    // Add null check to ensure menu exists
    if (!menu) {
      console.error(`Menu is undefined when displaying ${type} for ${title}`);
      return null;
    }
    
    const itemType = `${type}s` as keyof MenuDay;
    
    // Add null check to ensure the items array exists before attempting to map
    const items = menu[itemType] as MenuItem[] || [];
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">{title}</h3>
          {editingMenu?.id === menu.id && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleAddNewItem(type)}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix (FCFA)</TableHead>
              <TableHead>Description</TableHead>
              {editingMenu?.id === menu.id && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>{item.description}</TableCell>
                {editingMenu?.id === menu.id && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditItem(item, type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteItem(item.id, type)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Menus</h2>
        <Button variant="outline" onClick={resetToDefault}>
          Réinitialiser aux valeurs par défaut
        </Button>
      </div>

      {/* Éditeur d'élément du menu (modal) */}
      {editingItem.item && (
        <Card className="border-2 border-blue-200 mb-4">
          <CardHeader>
            <CardTitle>
              {editingItem.item.id ? 'Modifier' : 'Ajouter'} un {editingItem.type === 'mainDish' 
                ? 'plat principal' 
                : editingItem.type === 'sideDish' 
                  ? 'accompagnement' 
                  : 'dessert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input 
                  value={editingItem.item.name}
                  onChange={(e) => handleUpdateItemField('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix (FCFA)</label>
                <Input 
                  type="number"
                  value={editingItem.item.price}
                  onChange={(e) => handleUpdateItemField('price', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={editingItem.item.description || ''}
                  onChange={(e) => handleUpdateItemField('description', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL de l'image</label>
                <Input 
                  value={editingItem.item.imageUrl || ''}
                  onChange={(e) => handleUpdateItemField('imageUrl', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingItem({item: null, type: ''})}>
              Annuler
            </Button>
            <Button onClick={handleSaveItem}>
              Enregistrer
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Liste des menus */}
      <div className="grid gap-6">
        {menus.map(menu => (
          <Card key={menu.id} className={editingMenu?.id === menu.id ? 'border-2 border-blue-400' : ''}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingMenu?.id === menu.id ? (
                    <Input 
                      value={editingMenu.day}
                      onChange={(e) => handleUpdateMenuField('day', e.target.value)}
                      className="font-bold text-xl"
                    />
                  ) : (
                    <span>{menu.day}</span>
                  )}
                </CardTitle>
                {editingMenu?.id === menu.id ? (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" /> Annuler
                    </Button>
                    <Button onClick={handleSaveMenu}>
                      <Save className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => handleEditMenu(menu)}>
                    <Edit className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {getMenuTableSection(editingMenu?.id === menu.id ? editingMenu : menu, 'mainDish', 'Plats principaux')}
              {getMenuTableSection(editingMenu?.id === menu.id ? editingMenu : menu, 'sideDish', 'Accompagnements')}
              {getMenuTableSection(editingMenu?.id === menu.id ? editingMenu : menu, 'dessert', 'Desserts')}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
