import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter, 
  CardDescription 
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { weeklyMenu } from "@/data/menuData";
import { 
  Save, 
  Edit, 
  X, 
  Plus, 
  Trash, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Utensils, 
  Coffee, 
  IceCream,
  Check,
  MoreVertical,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState("mainDish");
  const [previewMode, setPreviewMode] = useState(false);
  
  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = () => {
    console.log("Loading menus...");
    const savedMenus = localStorage.getItem('weeklyMenu');
    if (savedMenus) {
      try {
        const parsedMenus = JSON.parse(savedMenus);
        console.log("Loaded menus from localStorage:", parsedMenus);
        setMenus(parsedMenus);
      } catch (error) {
        console.error("Erreur lors du chargement des menus sauvegardés:", error);
        convertAndSetMenus();
      }
    } else {
      console.log("No saved menus found, converting default data");
      convertAndSetMenus();
    }
  };

  const convertAndSetMenus = () => {
    console.log("Converting menu data from weeklyMenu:", weeklyMenu);
    
    const convertedMenus: MenuDay[] = weeklyMenu.map(menu => {
      const mainDishes: MenuItem[] = [];
      const sideDishes: MenuItem[] = [];
      const desserts: MenuItem[] = [];
      
      menu.mealOptions.forEach(option => {
        if (option.mainDish && !mainDishes.some(dish => dish.id === option.mainDish.id)) {
          mainDishes.push({
            id: option.mainDish.id,
            name: option.mainDish.name,
            price: option.mainDish.price,
            description: option.mainDish.description,
            imageUrl: option.mainDish.image
          });
        }
        
        if (option.sideDish && !sideDishes.some(dish => dish.id === option.sideDish.id)) {
          sideDishes.push({
            id: option.sideDish.id,
            name: option.sideDish.name,
            price: option.sideDish.price,
            description: option.sideDish.description,
            imageUrl: option.sideDish.image
          });
        }
        
        if (option.dessert && !desserts.some(dish => dish.id === option.dessert.id)) {
          desserts.push({
            id: option.dessert.id,
            name: option.dessert.name,
            price: option.dessert.price,
            description: option.dessert.description,
            imageUrl: option.dessert.image
          });
        }
      });
      
      return {
        id: menu.id,
        day: menu.day,
        date: menu.date,
        mainDishes,
        sideDishes,
        desserts
      };
    });
    
    console.log("Converted menus:", convertedMenus);
    setMenus(convertedMenus);
  };

  const saveMenusToLocalStorage = (updatedMenus: MenuDay[]) => {
    try {
      console.log("Saving menus to localStorage:", updatedMenus);
      localStorage.setItem('weeklyMenu', JSON.stringify(updatedMenus));
      
      const event = new CustomEvent('menu-updated', { detail: updatedMenus });
      window.dispatchEvent(event);
      
      toast({
        title: "Sauvegarde réussie",
        description: "Les menus ont été sauvegardés avec succès. Les changements sont maintenant visibles sur le site.",
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
    
    console.log("Saving menu:", editingMenu);
    
    const updatedMenus = menus.map(menu => 
      menu.id === editingMenu.id ? editingMenu : menu
    );
    
    setMenus(updatedMenus);
    saveMenusToLocalStorage(updatedMenus);
    setEditingMenu(null);
    setPreviewMode(false);
  };

  const handleEditMenu = (menu: MenuDay) => {
    console.log("Editing menu:", menu);
    setEditingMenu({...menu});
    setActiveMenuTab("mainDish");
    setPreviewMode(false);
  };

  const handleCancelEdit = () => {
    setEditingMenu(null);
    setEditingItem({item: null, type: ''});
    setPreviewMode(false);
  };

  const handleUpdateMenuField = (field: string, value: string) => {
    if (!editingMenu) return;
    console.log(`Updating menu field "${field}" to "${value}"`);
    setEditingMenu({...editingMenu, [field]: value});
  };

  const handleEditItem = (item: MenuItem, type: string) => {
    console.log(`Editing ${type} item:`, item);
    setEditingItem({item: {...item}, type});
  };

  const handleUpdateItemField = (field: string, value: string) => {
    if (!editingItem.item) return;
    
    let parsedValue: string | number = value;
    if (field === 'price') {
      parsedValue = parseFloat(value) || 0;
    }
    
    console.log(`Updating item field "${field}" to "${parsedValue}"`);
    
    setEditingItem({
      ...editingItem, 
      item: {...editingItem.item, [field]: parsedValue}
    });
  };

  const handleSaveItem = () => {
    if (!editingMenu || !editingItem.item || !editingItem.type) return;
    
    if (!editingItem.item.name || editingItem.item.price === undefined) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs obligatoires (nom et prix).",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Saving item:", editingItem.item);
    
    const itemType = `${editingItem.type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    
    const index = items.findIndex(item => item.id === editingItem.item?.id);
    
    if (index !== -1) {
      console.log("Updating existing item at index:", index);
      items[index] = editingItem.item;
    } else {
      console.log("Adding new item");
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
    
    toast({
      title: "Élément sauvegardé",
      description: index !== -1 ? "L'élément a été mis à jour avec succès." : "Nouvel élément ajouté avec succès.",
    });
  };

  const handleAddNewItem = (type: string) => {
    console.log(`Adding new ${type} item`);
    const newItem: MenuItem = {
      id: '',
      name: '',
      price: 0,
      description: '',
      imageUrl: ''
    };
    
    setEditingItem({item: newItem, type});
  };

  const handleDeleteItem = (itemId: string, type: string) => {
    if (!editingMenu) return;
    
    console.log(`Deleting ${type} item with ID:`, itemId);
    
    const itemType = `${type}s` as keyof MenuDay;
    const items = [...(editingMenu[itemType] as MenuItem[])];
    
    const updatedItems = items.filter(item => item.id !== itemId);
    
    setEditingMenu({
      ...editingMenu,
      [itemType]: updatedItems
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
    console.log("Resetting menus to default values");
    convertAndSetMenus();
    localStorage.removeItem('weeklyMenu');
    
    const event = new CustomEvent('menu-updated');
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

  const renderPreview = () => {
    if (!editingMenu) return null;
    
    return (
      <Card className="border-2 border-blue-200 mb-4">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Aperçu: {editingMenu.day}
            {editingMenu.date && <span className="ml-2 text-sm text-gray-500">({editingMenu.date})</span>}
          </CardTitle>
          <CardDescription>
            Voici à quoi ressemblera ce menu sur la page d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 bg-white">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Utensils className="h-5 w-5 mr-2 text-restaurant-purple" />
                Plats principaux
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editingMenu.mainDishes.map(dish => (
                  <Card key={dish.id} className="overflow-hidden">
                    <CardHeader className="p-3 bg-restaurant-olive text-white">
                      <CardTitle className="text-base">{dish.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-600">{dish.description}</p>
                        <Badge className="bg-restaurant-purple ml-2">{dish.price} FCFA</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-restaurant-terracotta" />
                Accompagnements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {editingMenu.sideDishes.map(dish => (
                  <Card key={dish.id} className="overflow-hidden">
                    <CardHeader className="p-2 bg-restaurant-terracotta text-white">
                      <CardTitle className="text-sm">{dish.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-600 truncate">{dish.description}</p>
                        <Badge className="bg-restaurant-terracotta ml-2 text-xs">{dish.price} FCFA</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <IceCream className="h-5 w-5 mr-2 text-restaurant-red" />
                Desserts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {editingMenu.desserts.map(dish => (
                  <Card key={dish.id} className="overflow-hidden">
                    <CardHeader className="p-2 bg-restaurant-red text-white">
                      <CardTitle className="text-sm">{dish.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-600 truncate">{dish.description}</p>
                        <Badge className="bg-restaurant-red ml-2 text-xs">{dish.price} FCFA</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getMenuTableSection = (menu: MenuDay, type: string, title: string, icon: React.ReactNode) => {
    if (!menu) {
      console.error(`Menu is undefined when displaying ${type} for ${title}`);
      return null;
    }
    
    const itemType = `${type}s` as keyof MenuDay;
    
    const items = menu[itemType] as MenuItem[] || [];
    
    return (
      <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            {icon}
            {title} <Badge className="ml-2 bg-blue-100 text-blue-800">{items.length}</Badge>
          </h3>
          {editingMenu?.id === menu.id && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleAddNewItem(type)}
              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          )}
        </div>
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nom</TableHead>
                <TableHead>Prix (FCFA)</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                {editingMenu?.id === menu.id && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">
                    {item.description}
                  </TableCell>
                  {editingMenu?.id === menu.id && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditItem(item, type)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteItem(item.id, type)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>Aucun élément n'a été ajouté</p>
            {editingMenu?.id === menu.id && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleAddNewItem(type)}
                className="mt-4 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter un {
                  type === 'mainDish' ? 'plat principal' : 
                  type === 'sideDish' ? 'accompagnement' : 'dessert'
                }
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleModifyItem = (item: MenuItem, type: string) => {
    console.log(`Modifier l'élément ${item.name} dans la catégorie ${type}`);
    setEditingMenu((prev) => (prev ? { ...prev } : null));
    setEditingItem({ item: { ...item }, type });
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

      <Dialog open={!!editingItem.item} onOpenChange={() => !editingItem.item || setEditingItem({item: null, type: ''})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem.item?.id ? 'Modifier' : 'Ajouter'} un {editingItem.type === 'mainDish' 
                ? 'plat principal' 
                : editingItem.type === 'sideDish' 
                  ? 'accompagnement' 
                  : 'dessert'}
            </DialogTitle>
            <DialogDescription>
              {editingItem.item?.id 
                ? "Modifiez les détails de l'élément ci-dessous." 
                : "Remplissez les détails pour ajouter un nouvel élément."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <Input 
                value={editingItem.item?.name || ''}
                onChange={(e) => handleUpdateItemField('name', e.target.value)}
                placeholder={`Nom du ${
                  editingItem.type === 'mainDish' ? 'plat principal' : 
                  editingItem.type === 'sideDish' ? 'accompagnement' : 'dessert'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Prix (FCFA) <span className="text-red-500">*</span>
              </label>
              <Input 
                type="number"
                value={editingItem.item?.price || 0}
                onChange={(e) => handleUpdateItemField('price', e.target.value)}
                placeholder="Prix en FCFA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea 
                value={editingItem.item?.description || ''}
                onChange={(e) => handleUpdateItemField('description', e.target.value)}
                placeholder="Décrivez brièvement ce plat"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL de l'image</label>
              <Input 
                value={editingItem.item?.imageUrl || ''}
                onChange={(e) => handleUpdateItemField('imageUrl', e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour utiliser l'image par défaut.
              </p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setEditingItem({item: null, type: ''})}>
              Annuler
            </Button>
            <Button onClick={handleSaveItem} className="bg-restaurant-purple">
              <Check className="h-4 w-4 mr-2" />
              {editingItem.item?.id ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button 
              onClick={confirmReset} 
              variant="destructive"
            >
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingMenu && renderEditingInterface()}

      <div className="grid gap-6">
        {menus.map(menu => (
          <Card 
            key={menu.id} 
            className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
              editingMenu?.id === menu.id ? 'border-2 border-blue-400' : ''
            }`}
          >
            <CardHeader className="bg-gray-50 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-restaurant-purple" />
                  <span>{menu.day}</span>
                  {menu.date && <span className="ml-2 text-sm text-gray-500">({menu.date})</span>}
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
                <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Utensils className="h-5 w-5 mr-2 text-restaurant-purple" />
                      Plats principaux <Badge className="ml-2 bg-blue-100 text-blue-800">{menu.mainDishes.length}</Badge>
                    </h3>
                    {editingMenu?.id === menu.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddNewItem('mainDish')}
                        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                      </Button>
                    )}
                  </div>
                  {menu.mainDishes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Prix (FCFA)</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          {editingMenu?.id === menu.id && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menu.mainDishes.map(item => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.price}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">{item.description}</TableCell>
                            {editingMenu?.id === menu.id && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleModifyItem(item, 'mainDish')}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDeleteItem(item.id, 'mainDish')}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p>Aucun élément n'a été ajouté</p>
                      {editingMenu?.id === menu.id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddNewItem('mainDish')}
                          className="mt-4 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Ajouter un plat principal
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Coffee className="h-5 w-5 mr-2 text-restaurant-terracotta" />
                      Accompagnements <Badge className="ml-2 bg-blue-100 text-blue-800">{menu.sideDishes.length}</Badge>
                    </h3>
                    {editingMenu?.id === menu.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddNewItem('sideDish')}
                        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                      </Button>
                    )}
                  </div>
                  {menu.sideDishes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Prix (FCFA)</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          {editingMenu?.id === menu.id && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menu.sideDishes.map(item => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.price}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">{item.description}</TableCell>
                            {editingMenu?.id === menu.id && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleModifyItem(item, 'sideDish')}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDeleteItem(item.id, 'sideDish')}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p>Aucun élément n'a été ajouté</p>
                      {editingMenu?.id === menu.id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddNewItem('sideDish')}
                          className="mt-4 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Ajouter un accompagnement
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <IceCream className="h-5 w-5 mr-2 text-restaurant-red" />
                      Desserts <Badge className="ml-2 bg-blue-100 text-blue-800">{menu.desserts.length}</Badge>
                    </h3>
                    {editingMenu?.id === menu.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddNewItem('dessert')}
                        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                      </Button>
                    )}
                  </div>
                  {menu.desserts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Prix (FCFA)</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          {editingMenu?.id === menu.id && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menu.desserts.map(item => (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.price}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">{item.description}</TableCell>
                            {editingMenu?.id === menu.id && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleModifyItem(item, 'dessert')}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDeleteItem(item.id, 'dessert')}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p>Aucun élément n'a été ajouté</p>
                      {editingMenu?.id === menu.id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddNewItem('dessert')}
                          className="mt-4 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Ajouter un dessert
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
