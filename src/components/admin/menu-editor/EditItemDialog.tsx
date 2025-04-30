
import React, { useEffect, useState, useCallback } from "react";
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
import { Check, Loader2, AlertCircle } from "lucide-react";
import { MenuItem, DishType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { runInBackground, globalTaskQueue, withRetry } from "@/utils/backgroundWorker";
import { useMenuState } from "@/contexts/MenuStateContext";

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
  type: DishType;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

export const EditItemDialog = ({ item, type, onClose, onSave }: EditItemDialogProps) => {
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchRetries, setFetchRetries] = useState(0);
  const maxRetries = 3;
  const { editingItemIds, removeEditingItemId } = useMenuState();
  
  // Memoized fetch articles function with improved error handling
  const fetchArticles = useCallback(async (retry = 0) => {
    if (retry > maxRetries) {
      setError("Erreur persistante lors du chargement des articles. Veuillez réessayer plus tard.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const articleType = type === 'mainDish' 
        ? 'main_dish' 
        : type === 'sideDish' 
          ? 'side_dish' 
          : 'dessert';

      // Run the fetch in background to prevent UI blocking
      const result = await globalTaskQueue.add(async () => {
        try {
          // Use withRetry for automatic retry with backoff
          return await withRetry(async () => {
            const response = await supabase
              .from('articles')
              .select('*')
              .eq('type', articleType)
              .order('name');
              
            return response;
          });
        } catch (error) {
          console.error('Error in background fetch:', error);
          throw error;
        }
      });

      if (result.error) {
        console.error('Error fetching articles:', result.error);
        
        // Retry after a delay if we haven't reached the max retries
        if (retry < maxRetries) {
          setTimeout(() => fetchArticles(retry + 1), 1000);
          return;
        }
        
        throw result.error;
      }

      console.log('Fetched articles:', result.data);
      setAvailableArticles(result.data || []);
      
      // Set the selected article ID if available
      if (item?.articleId) {
        console.log('Setting selected article ID from item:', item.articleId);
        setSelectedArticleId(item.articleId);
      } else if (item?.name) {
        // Try to find a matching article by name
        const matchingArticle = result.data?.find(article => article.name === item.name);
        if (matchingArticle) {
          console.log('Found matching article by name:', matchingArticle.id);
          setSelectedArticleId(matchingArticle.id);
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError("Erreur lors du chargement des articles. Veuillez réessayer.");
      
      // Update the retry counter for the next attempt
      setFetchRetries(prevRetries => prevRetries + 1);
    } finally {
      setIsLoading(false);
    }
  }, [type, item, maxRetries]);

  useEffect(() => {
    fetchArticles();
    
    // Clean up state when the dialog closes
    return () => {
      setSelectedArticleId("");
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
    };
  }, [fetchArticles]);

  // Improved save handler with optimized dialog closing sequence
  const handleSave = useCallback(() => {
    if (isSaving) return;
    
    try {
      console.log("Beginning save operation with articleId:", selectedArticleId);
      
      if (!selectedArticleId) {
        setError("Veuillez sélectionner un article");
        return;
      }
      
      const selectedArticle = availableArticles.find(article => article.id === selectedArticleId);
      if (!selectedArticle) {
        setError("Article sélectionné non trouvé");
        return;
      }

      // Prepare the data in advance
      const menuItem: MenuItem = {
        id: item?.id || `${type}_${Date.now()}`,
        name: selectedArticle.name,
        price: selectedArticle.price,
        description: selectedArticle.description || '',
        imageUrl: selectedArticle.image_url || '',
        articleId: selectedArticle.id,
        type: type === 'mainDish' ? 'main_dish' : type === 'sideDish' ? 'side_dish' : 'dessert'
      };

      console.log("Menu item prepared:", menuItem);
      
      // Mark as saving and close the dialog at the same time
      setIsSaving(true);
      setIsOpen(false);
      
      // Use a short timeout to allow the dialog closing animation to start
      // before performing the save operation (which might briefly block the main thread)
      setTimeout(() => {
        try {
          onSave(menuItem);
        } catch (error) {
          console.error("Error in save callback:", error);
        }
      }, 50);
      
    } catch (error) {
      console.error("Error preparing item for save:", error);
      setError("Une erreur est survenue lors de la préparation de l'élément. Veuillez réessayer.");
      setIsSaving(false);
    }
  }, [selectedArticleId, availableArticles, item, type, isSaving, onSave]);

  // Improved close handler to ensure clean dialog closing
  const handleCloseDialog = useCallback(() => {
    // Mark the dialog as closed to start the animation
    setIsOpen(false);
    
    // Use requestAnimationFrame to allow the closing animation to start
    requestAnimationFrame(() => {
      // Small delay to ensure the animation starts before we call onClose
      setTimeout(() => {
        if (item?.id) {
          removeEditingItemId(item.id);
        }
        onClose();
      }, 50);
    });
  }, [onClose, item, removeEditingItemId]);

  const typeLabel = type === "mainDish" 
    ? "plat principal" 
    : type === "sideDish" 
      ? "accompagnement" 
      : "dessert";

  // If the dialog is closed, don't render anything
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseDialog();
    }}>
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
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-restaurant-purple animate-spin" />
              <p className="text-sm text-gray-500">Chargement des articles disponibles...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Article disponible
              </label>
              <Select
                value={selectedArticleId}
                onValueChange={setSelectedArticleId}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un article" />
                </SelectTrigger>
                <SelectContent>
                  {availableArticles.length > 0 ? (
                    availableArticles.map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.name} - {article.price} FCFA
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {error ? "Erreur de chargement" : "Aucun article disponible"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {availableArticles.length === 0 && !isLoading && !error && (
                <div className="p-2 bg-amber-50 text-amber-700 rounded-md text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Aucun article disponible pour ce type. Veuillez en créer d'abord dans la section Articles.</span>
                </div>
              )}
              
              {fetchRetries > 0 && !error && (
                <button 
                  onClick={() => fetchArticles()}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C7.60771 22 3.83752 19.0163 2.69494 14.9516" strokeLinecap="round"/>
                    <path d="M2 12H6" strokeLinecap="round"/>
                    <path d="M2 12L4.59619 15" strokeLinecap="round"/>
                  </svg>
                  Actualiser la liste
                </button>
              )}
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
          <Button 
            variant="outline" 
            onClick={handleCloseDialog}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-restaurant-purple"
            disabled={!selectedArticleId || isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {item?.id ? 'Mettre à jour' : 'Ajouter'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
