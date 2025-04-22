
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { SelectArticleDialog } from './SelectArticleDialog';
import { supabase } from '@/integrations/supabase/client';

interface HomepageItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  type: 'main_dish' | 'side_dish' | 'dessert';
}

export const HomepageEditor = () => {
  const [isSelectingArticle, setIsSelectingArticle] = useState(false);
  const [selectedType, setSelectedType] = useState<'main_dish' | 'side_dish' | 'dessert'>('main_dish');
  const [featuredItems, setFeaturedItems] = useState<HomepageItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadFeaturedItems();
  }, []);

  const loadFeaturedItems = async () => {
    try {
      const { data: menuArticles, error } = await supabase
        .from('menu_articles')
        .select(`
          article_id,
          articles (
            id,
            name,
            price,
            description,
            type
          )
        `)
        .eq('menu_day', 'homepage');

      if (error) throw error;

      const items = menuArticles
        .map(ma => ma.articles)
        .filter(article => article) as HomepageItem[];

      setFeaturedItems(items);
    } catch (error) {
      console.error('Error loading featured items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles mis en avant",
        variant: "destructive"
      });
    }
  };

  const handleAddItem = (articleId: string) => {
    supabase
      .from('menu_articles')
      .insert({
        menu_day: 'homepage',
        article_id: articleId
      })
      .then(({ error }) => {
        if (error) {
          toast({
            title: "Erreur",
            description: "Impossible d'ajouter l'article",
            variant: "destructive"
          });
          return;
        }
        loadFeaturedItems();
        toast({
          title: "Succès",
          description: "Article ajouté avec succès"
        });
      });
    setIsSelectingArticle(false);
  };

  const handleDeleteItem = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('menu_articles')
        .delete()
        .eq('menu_day', 'homepage')
        .eq('article_id', articleId);

      if (error) throw error;

      await loadFeaturedItems();
      toast({
        title: "Succès",
        description: "Article supprimé avec succès"
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Articles mis en avant sur la page d'accueil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setSelectedType('main_dish');
                  setIsSelectingArticle(true);
                }}
                className="bg-restaurant-purple"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un plat principal
              </Button>
              <Button
                onClick={() => {
                  setSelectedType('side_dish');
                  setIsSelectingArticle(true);
                }}
                className="bg-restaurant-terracotta"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un accompagnement
              </Button>
              <Button
                onClick={() => {
                  setSelectedType('dessert');
                  setIsSelectingArticle(true);
                }}
                className="bg-restaurant-red"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un dessert
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.type === 'main_dish' 
                        ? 'Plat principal' 
                        : item.type === 'side_dish' 
                          ? 'Accompagnement' 
                          : 'Dessert'}
                    </TableCell>
                    <TableCell>{item.price} FCFA</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {featuredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      Aucun article mis en avant
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SelectArticleDialog
        isOpen={isSelectingArticle}
        onClose={() => setIsSelectingArticle(false)}
        onSelect={handleAddItem}
        type={selectedType}
      />
    </div>
  );
};
