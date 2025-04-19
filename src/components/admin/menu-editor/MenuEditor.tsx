import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import { MenuEditorProps, MenuDay } from "./types";

export const MenuEditor: React.FC<MenuEditorProps> = ({ 
  menu, 
  menus, 
  setMenus, 
  readOnly = false,
  onMenuUpdated 
}) => {
  const { toast } = useToast();
  const [mainDishName, setMainDishName] = useState("");
  const [mainDishPrice, setMainDishPrice] = useState("");
  const [mainDishDescription, setMainDishDescription] = useState("");
  const [mainDishImageUrl, setMainDishImageUrl] = useState("");
  const [sideDishName, setSideDishName] = useState("");
  const [sideDishPrice, setSideDishPrice] = useState("");
  const [sideDishDescription, setSideDishDescription] = useState("");
  const [sideDishImageUrl, setSideDishImageUrl] = useState("");
  const [dessertName, setDessertName] = useState("");
  const [dessertPrice, setDessertPrice] = useState("");
  const [dessertDescription, setDessertDescription] = useState("");
  const [dessertImageUrl, setDessertImageUrl] = useState("");
  const [selectedMainDish, setSelectedMainDish] = useState<string | null>(null);
  const [selectedSideDish, setSelectedSideDish] = useState<string | null>(null);
  const [selectedDessert, setSelectedDessert] = useState<string | null>(null);
  const [isAddingMainDish, setIsAddingMainDish] = useState(false);
  const [isAddingSideDish, setIsAddingSideDish] = useState(false);
  const [isAddingDessert, setIsAddingDessert] = useState(false);

  useEffect(() => {
    console.log("MenuEditor: menu prop updated:", menu);
  }, [menu]);

  const handleAddMainDish = async () => {
    if (!mainDishName || !mainDishPrice || !mainDishDescription || !mainDishImageUrl) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du plat principal.",
        variant: "destructive",
      });
      return;
    }

    const newMainDish = {
      id: uuidv4(),
      name: mainDishName,
      price: parseFloat(mainDishPrice),
      description: mainDishDescription,
      imageUrl: mainDishImageUrl,
    };

    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          mainDishes: [...m.mainDishes, newMainDish],
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
    setIsAddingMainDish(false);
    setMainDishName("");
    setMainDishPrice("");
    setMainDishDescription("");
    setMainDishImageUrl("");

    if (onMenuUpdated) {
      await onMenuUpdated('add_main_dish', { menuId: menu.id, dish: newMainDish });
    }

    toast({
      title: "Succès",
      description: "Plat principal ajouté avec succès.",
    });
  };

  const handleAddSideDish = async () => {
    if (!sideDishName || !sideDishPrice || !sideDishDescription || !sideDishImageUrl) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs de l'accompagnement.",
        variant: "destructive",
      });
      return;
    }

    const newSideDish = {
      id: uuidv4(),
      name: sideDishName,
      price: parseFloat(sideDishPrice),
      description: sideDishDescription,
      imageUrl: sideDishImageUrl,
    };

    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          sideDishes: [...m.sideDishes, newSideDish],
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
    setIsAddingSideDish(false);
    setSideDishName("");
    setSideDishPrice("");
    setSideDishDescription("");
    setSideDishImageUrl("");

    if (onMenuUpdated) {
      await onMenuUpdated('add_side_dish', { menuId: menu.id, dish: newSideDish });
    }

    toast({
      title: "Succès",
      description: "Accompagnement ajouté avec succès.",
    });
  };

  const handleAddDessert = async () => {
    if (!dessertName || !dessertPrice || !dessertDescription || !dessertImageUrl) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du dessert.",
        variant: "destructive",
      });
      return;
    }

    const newDessert = {
      id: uuidv4(),
      name: dessertName,
      price: parseFloat(dessertPrice),
      description: dessertDescription,
      imageUrl: dessertImageUrl,
    };

    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          desserts: [...m.desserts, newDessert],
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));
    setIsAddingDessert(false);
    setDessertName("");
    setDessertPrice("");
    setDessertDescription("");
    setDessertImageUrl("");

    if (onMenuUpdated) {
      await onMenuUpdated('add_dessert', { menuId: menu.id, dish: newDessert });
    }

    toast({
      title: "Succès",
      description: "Dessert ajouté avec succès.",
    });
  };

  const handleDeleteMainDish = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          mainDishes: m.mainDishes.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_main_dish', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Plat principal supprimé avec succès.",
    });
  };

  const handleDeleteSideDish = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          sideDishes: m.sideDishes.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_side_dish', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Accompagnement supprimé avec succès.",
    });
  };

  const handleDeleteDessert = async (dishId: string) => {
    const updatedMenus = menus.map((m) => {
      if (m.id === menu.id) {
        return {
          ...m,
          desserts: m.desserts.filter((dish) => dish.id !== dishId),
        };
      }
      return m;
    });

    setMenus(updatedMenus);
    localStorage.setItem("weeklyMenu", JSON.stringify(updatedMenus));

    if (onMenuUpdated) {
      await onMenuUpdated('delete_dessert', { menuId: menu.id, dishId });
    }

    toast({
      title: "Succès",
      description: "Dessert supprimé avec succès.",
    });
  };

  const handleSelectMainDish = (dishId: string) => {
    setSelectedMainDish(dishId);
  };

  const handleSelectSideDish = (dishId: string) => {
    setSelectedSideDish(dishId);
  };

  const handleSelectDessert = (dishId: string) => {
    setSelectedDessert(dishId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plats Principaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu.mainDishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell>{dish.name}</TableCell>
                  <TableCell>{dish.price}</TableCell>
                  <TableCell>{dish.description}</TableCell>
                  <TableCell>{dish.imageUrl}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSelectMainDish(dish.id)}
                        >
                          Sélectionner
                        </DropdownMenuItem>
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer ce plat
                                  principal?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMainDish(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => setIsAddingMainDish(true)}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un plat principal
            </Button>
          )}
          {isAddingMainDish && (
            <div className="mt-4">
              <Label htmlFor="mainDishName">Nom</Label>
              <Input
                id="mainDishName"
                value={mainDishName}
                onChange={(e) => setMainDishName(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="mainDishPrice">Prix</Label>
              <Input
                id="mainDishPrice"
                value={mainDishPrice}
                onChange={(e) => setMainDishPrice(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="mainDishDescription">Description</Label>
              <Input
                id="mainDishDescription"
                value={mainDishDescription}
                onChange={(e) => setMainDishDescription(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="mainDishImageUrl">Image URL</Label>
              <Input
                id="mainDishImageUrl"
                value={mainDishImageUrl}
                onChange={(e) => setMainDishImageUrl(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleAddMainDish} className="mr-2">
                Ajouter
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsAddingMainDish(false)}
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accompagnements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu.sideDishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell>{dish.name}</TableCell>
                  <TableCell>{dish.price}</TableCell>
                  <TableCell>{dish.description}</TableCell>
                  <TableCell>{dish.imageUrl}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSelectSideDish(dish.id)}
                        >
                          Sélectionner
                        </DropdownMenuItem>
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer cet
                                  accompagnement?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSideDish(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => setIsAddingSideDish(true)}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un accompagnement
            </Button>
          )}
          {isAddingSideDish && (
            <div className="mt-4">
              <Label htmlFor="sideDishName">Nom</Label>
              <Input
                id="sideDishName"
                value={sideDishName}
                onChange={(e) => setSideDishName(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="sideDishPrice">Prix</Label>
              <Input
                id="sideDishPrice"
                value={sideDishPrice}
                onChange={(e) => setSideDishPrice(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="sideDishDescription">Description</Label>
              <Input
                id="sideDishDescription"
                value={sideDishDescription}
                onChange={(e) => setSideDishDescription(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="sideDishImageUrl">Image URL</Label>
              <Input
                id="sideDishImageUrl"
                value={sideDishImageUrl}
                onChange={(e) => setSideDishImageUrl(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleAddSideDish} className="mr-2">
                Ajouter
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsAddingSideDish(false)}
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desserts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu.desserts.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell>{dish.name}</TableCell>
                  <TableCell>{dish.price}</TableCell>
                  <TableCell>{dish.description}</TableCell>
                  <TableCell>{dish.imageUrl}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSelectDessert(dish.id)}
                        >
                          Sélectionner
                        </DropdownMenuItem>
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Êtes-vous sûr de vouloir supprimer ce dessert?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDessert(dish.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => setIsAddingDessert(true)}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un dessert
            </Button>
          )}
          {isAddingDessert && (
            <div className="mt-4">
              <Label htmlFor="dessertName">Nom</Label>
              <Input
                id="dessertName"
                value={dessertName}
                onChange={(e) => setDessertName(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="dessertPrice">Prix</Label>
              <Input
                id="dessertPrice"
                value={dessertPrice}
                onChange={(e) => setDessertPrice(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="dessertDescription">Description</Label>
              <Input
                id="dessertDescription"
                value={dessertDescription}
                onChange={(e) => setDessertDescription(e.target.value)}
                className="mb-2"
              />
              <Label htmlFor="dessertImageUrl">Image URL</Label>
              <Input
                id="dessertImageUrl"
                value={dessertImageUrl}
                onChange={(e) => setDessertImageUrl(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleAddDessert} className="mr-2">
                Ajouter
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsAddingDessert(false)}
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
