
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArticlesTable } from "./ArticlesTable";
import { ArticleDialog } from "./ArticleDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Article {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  type: 'main_dish' | 'side_dish' | 'dessert' | 'other';
}

export const ArticlesManager = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const loadArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading articles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles",
        variant: "destructive",
      });
      return;
    }

    setArticles(data);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSaveArticle = async (articleData: Omit<Article, 'id'>) => {
    try {
      if (selectedArticle?.id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', selectedArticle.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Article mis à jour avec succès",
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Article créé avec succès",
        });
      }

      setIsDialogOpen(false);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'article",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Article supprimé avec succès",
      });

      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <ArticlesTable
        articles={articles}
        onEdit={(article) => {
          setSelectedArticle(article);
          setIsDialogOpen(true);
        }}
        onDelete={(id) => {
          setArticleToDelete(id);
          setIsDeleteDialogOpen(true);
        }}
        onAdd={() => {
          setSelectedArticle(null);
          setIsDialogOpen(true);
        }}
      />

      <ArticleDialog
        article={selectedArticle}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedArticle(null);
        }}
        onSave={handleSaveArticle}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cet article sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => articleToDelete && handleDeleteArticle(articleToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
