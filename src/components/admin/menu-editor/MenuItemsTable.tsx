
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { MenuItem } from "./types";

interface MenuItemsTableProps {
  items: MenuItem[];
  type: string;
  title: string;
  icon: React.ReactNode;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  onAdd: () => void;
  isEditing: boolean;
}

export const MenuItemsTable = ({
  items,
  type,
  title,
  icon,
  onAdd,
  isEditing,
}: MenuItemsTableProps) => {
  const typeLabel =
    type === "mainDish"
      ? "plat principal"
      : type === "sideDish"
      ? "accompagnement"
      : "dessert";

  return (
    <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-lg font-medium ml-2">{title}</h3>
        </div>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAdd}
            className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
          >
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p>Aucun élément n'a été ajouté</p>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAdd}
            className="mt-4 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
          >
            <Plus className="h-4 w-4 mr-1" /> Ajouter un {typeLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
