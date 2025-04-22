
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  name: string;
  price: number;
  description: string | null;
  type: 'main_dish' | 'side_dish' | 'dessert';
}

interface SelectArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (articleId: string) => void;
  type: 'main_dish' | 'side_dish' | 'dessert';
}

export const SelectArticleDialog: React.FC<SelectArticleDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  type
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadArticles();
    }
  }, [isOpen, type]);

  useEffect(() => {
    const filtered = articles.filter(article =>
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredArticles(filtered);
  }, [searchTerm, articles]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('type', type)
        .order('name');

      if (error) throw error;

      setArticles(data || []);
      setFilteredArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Sélectionner un {
              type === 'main_dish' 
                ? 'plat principal' 
                : type === 'side_dish' 
                  ? 'accompagnement' 
                  : 'dessert'
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher par nom ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>{article.name}</TableCell>
                  <TableCell>{article.price} FCFA</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {article.description || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => onSelect(article.id)}
                      className="bg-restaurant-purple"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredArticles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    Aucun article trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
