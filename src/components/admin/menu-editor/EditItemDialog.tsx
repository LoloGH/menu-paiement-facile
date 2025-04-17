
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { MenuItem } from "./types";

interface EditItemDialogProps {
  item: MenuItem | null;
  type: string;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

export const EditItemDialog = ({ item, type, onClose, onSave }: EditItemDialogProps) => {
  const [editingItem, setEditingItem] = React.useState<MenuItem>(
    item || {
      id: "",
      name: "",
      price: 0,
      description: "",
      imageUrl: "",
    }
  );

  const handleUpdateField = (field: keyof MenuItem, value: string) => {
    setEditingItem((prev) => ({
      ...prev,
      [field]: field === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = () => {
    if (!editingItem.name || editingItem.price === undefined) {
      return;
    }
    onSave(editingItem);
  };

  const typeLabel = type === "mainDish" 
    ? "plat principal" 
    : type === "sideDish" 
      ? "accompagnement" 
      : "dessert";

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item?.id ? "Modifier" : "Ajouter"} un {typeLabel}
          </DialogTitle>
          <DialogDescription>
            {item?.id
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
              value={editingItem.name}
              onChange={(e) => handleUpdateField("name", e.target.value)}
              placeholder={`Nom du ${typeLabel}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Prix (FCFA) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={editingItem.price}
              onChange={(e) => handleUpdateField("price", e.target.value)}
              placeholder="Prix en FCFA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={editingItem.description || ""}
              onChange={(e) => handleUpdateField("description", e.target.value)}
              placeholder="Décrivez brièvement ce plat"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL de l'image</label>
            <Input
              value={editingItem.imageUrl || ""}
              onChange={(e) => handleUpdateField("imageUrl", e.target.value)}
              placeholder="https://exemple.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide pour utiliser l'image par défaut.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-restaurant-purple">
            <Check className="h-4 w-4 mr-2" />
            {item?.id ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
