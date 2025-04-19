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
import {
  Edit,
  Trash,
  Plus,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Article {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  type: 'main_dish' | 'side_dish' | 'dessert' | 'other';
}

interface ArticlesTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export const ArticlesTable = ({
  articles,
  onEdit,
  onDelete,
  onAdd,
}: ArticlesTableProps) => {
  const getTypeLabel = (type: Article['type']) => {
    switch (type) {
      case 'main_dish':
        return { label: 'Plat principal', color: 'bg-restaurant-purple text-white' };
      case 'side_dish':
        return { label: 'Accompagnement', color: 'bg-restaurant-terracotta text-white' };
      case 'dessert':
        return { label: 'Dessert', color: 'bg-restaurant-red text-white' };
      default:
        return { label: 'Autre', color: 'bg-gray-500 text-white' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Articles disponibles</h2>
        <Button onClick={onAdd} className="bg-restaurant-purple">
          <Plus className="h-4 w-4 mr-2" /> Nouvel article
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const type = getTypeLabel(article.type);
            return (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.name}</TableCell>
                <TableCell>
                  <Badge className={type.color}>
                    {type.label}
                  </Badge>
                </TableCell>
                <TableCell>{article.price} FCFA</TableCell>
                <TableCell className="max-w-xs truncate">
                  {article.description}
                </TableCell>
                <TableCell>
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(article)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(article.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
