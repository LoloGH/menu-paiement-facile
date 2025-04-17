
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { MenuItem } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  type: 'main_dish' | 'side_dish' | 'dessert' | 'other';
}

interface EditItemDialogProps {
  item: MenuItem | null;
  type: string;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

export const EditItemDialog = ({ item, type, onClose, onSave }: EditItemDialogProps) => {
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  
  useEffect(() => {
    const fetchArticles = async () => {
      const articleType = type === 'mainDish' 
        ? 'main_dish' 
        : type === 'sideDish' 
          ? 'side_dish' 
          : 'dessert';

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('type', articleType)
        .order('name');

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      setAvailableArticles(data);
      
      if (item?.name) {
        const matchingArticle = data.find(article => article.name === item.name);
        if (matchingArticle) {
          setSelectedArticleId(matchingArticle.id);
        }
      }
    };

    fetchArticles();
  }, [type, item]);

  const handleSave = async () => {
    const selectedArticle = availableArticles.find(article => article.id === selectedArticleId);
    if (!selectedArticle) return;

    const menuItem: MenuItem = {
      id: item?.id || `${type}_${Date.now()}`,
      name: selectedArticle.name,
      price: selectedArticle.price,
      description: selectedArticle.description || '',
      imageUrl: selectedArticle.image_url || '',
      articleId: selectedArticle.id // Ajouter l'ID de l'article pour la référence
    };

    onSave(menuItem);
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
            Sélectionnez un article dans la liste des articles disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Article disponible
            </label>
            <Select
              value={selectedArticleId}
              onValueChange={setSelectedArticleId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un article" />
              </SelectTrigger>
              <SelectContent>
                {availableArticles.map((article) => (
                  <SelectItem key={article.id} value={article.id}>
                    {article.name} - {article.price} FCFA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedArticleId && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium">Détails de l'article sélectionné</h4>
              {availableArticles.find(a => a.id === selectedArticleId)?.description && (
                <p className="text-sm text-gray-600">
                  {availableArticles.find(a => a.id === selectedArticleId)?.description}
                </p>
              )}
              <p className="text-sm font-medium">
                Prix: {availableArticles.find(a => a.id === selectedArticleId)?.price} FCFA
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-restaurant-purple"
            disabled={!selectedArticleId}
          >
            <Check className="h-4 w-4 mr-2" />
            {item?.id ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
