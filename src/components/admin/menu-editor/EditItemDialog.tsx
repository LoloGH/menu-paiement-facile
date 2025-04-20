
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
  menuId?: string;
}

export const EditItemDialog = ({ item, type, onClose, onSave, menuId }: EditItemDialogProps) => {
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      
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
        setIsLoading(false);
        return;
      }

      setAvailableArticles(data);
      
      if (item?.articleId) {
        setSelectedArticleId(item.articleId);
      } else if (item?.name) {
        const matchingArticle = data.find(article => article.name === item.name);
        if (matchingArticle) {
          setSelectedArticleId(matchingArticle.id);
        }
      }
      
      setIsLoading(false);
    };

    fetchArticles();
    setIsOpen(true);
  }, [type, item]);

  const handleSave = async () => {
    console.log("Saving item with articleId:", selectedArticleId);
    
    const selectedArticle = availableArticles.find(article => article.id === selectedArticleId);
    if (!selectedArticle) {
      console.error("No article selected or article not found");
      return;
    }

    const menuItem: MenuItem = {
      id: item?.id || `${type}_${Date.now()}`,
      name: selectedArticle.name,
      price: selectedArticle.price,
      description: selectedArticle.description || '',
      imageUrl: selectedArticle.image_url || '',
      articleId: selectedArticle.id,
      type: type === 'mainDish' ? 'main_dish' : type === 'sideDish' ? 'side_dish' : 'dessert'
    };

    // Si nous avons un menuId, mettons à jour la base de données
    if (menuId) {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          id: menuItem.id,
          menu_id: menuId,
          article_id: selectedArticle.id,
          article_type: menuItem.type
        });

      if (error) {
        console.error("Error saving menu item to database:", error);
        return;
      }
    }

    onSave(menuItem);
    setIsOpen(false);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    onClose();
  };

  const typeLabel = type === "mainDish" 
    ? "plat principal" 
    : type === "sideDish" 
      ? "accompagnement" 
      : "dessert";

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
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
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-restaurant-purple border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
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
          )}

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
          <Button variant="outline" onClick={handleCloseDialog}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-restaurant-purple"
            disabled={!selectedArticleId || isLoading}
          >
            <Check className="h-4 w-4 mr-2" />
            {item?.id ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
