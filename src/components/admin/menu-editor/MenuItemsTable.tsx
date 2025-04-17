
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Edit, Trash, Plus } from "lucide-react";
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
  onEdit,
  onDelete,
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

      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Nom</TableHead>
              <TableHead>Prix (FCFA)</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              {isEditing && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">
                  {item.description}
                </TableCell>
                {isEditing && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item.id)}
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
      )}
    </div>
  );
};
