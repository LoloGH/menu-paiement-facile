
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
import { Check, Loader2, AlertCircle } from "lucide-react";
import { MenuItem, DishType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchRetries, setFetchRetries] = useState(0);
  const maxRetries = 3;
  
  const fetchArticles = async (retry = 0) => {
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

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('type', articleType)
        .order('name');
        // Removed timeout to fix TypeScript error

      if (error) {
        console.error('Error fetching articles:', error);
        
        // Retenter après un délai si on n'a pas atteint le max de tentatives
        if (retry < maxRetries) {
          setTimeout(() => fetchArticles(retry + 1), 1000);
          return;
        }
        
        throw error;
      }

      console.log('Fetched articles:', data);
      setAvailableArticles(data || []);
      
      // Si l'élément a déjà un articleId, utiliser celui-ci
      if (item?.articleId) {
        console.log('Setting selected article ID from item:', item.articleId);
        setSelectedArticleId(item.articleId);
      } else if (item?.name) {
        // Sinon, essayer de trouver un article correspondant par nom
        const matchingArticle = data?.find(article => article.name === item.name);
        if (matchingArticle) {
          console.log('Found matching article by name:', matchingArticle.id);
          setSelectedArticleId(matchingArticle.id);
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError("Erreur lors du chargement des articles. Veuillez réessayer.");
      
      // Mettre à jour le compteur de tentatives pour le prochain essai
      setFetchRetries(prevRetries => prevRetries + 1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    setIsOpen(true);
    
    // Nettoyer l'état à la fermeture
    return () => {
      setSelectedArticleId("");
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
    };
  }, [type, item]);

  // Fonction modifiée pour améliorer la séquence de fermeture et éviter le gel
  const handleSave = () => {
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

      // Préparer les données à l'avance
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
      
      // Marquer comme en cours de sauvegarde
      setIsSaving(true);
      
      // Fermer le dialogue AVANT d'exécuter onSave pour éviter le gel de l'interface
      setIsOpen(false);
      
      // Utiliser requestAnimationFrame pour déplacer l'opération de sauvegarde après la fermeture visuelle
      requestAnimationFrame(() => {
        // Appeler le callback de sauvegarde en dehors du thread principal
        setTimeout(() => {
          try {
            onSave(menuItem);
            
            // Notification de succès
            toast({
              title: "Succès",
              description: "L'élément a été enregistré avec succès",
            });
          } catch (error) {
            console.error("Error in save callback:", error);
          }
        }, 50); // Un petit délai pour s'assurer que l'UI a eu le temps de se mettre à jour
      });
    } catch (error) {
      console.error("Error preparing item for save:", error);
      setError("Une erreur est survenue lors de la préparation de l'élément. Veuillez réessayer.");
      setIsSaving(false);
    }
  };

  // Gérer la fermeture du dialogue de manière plus propre
  const handleCloseDialog = () => {
    // Marquer d'abord le dialogue comme fermé pour l'animation
    setIsOpen(false);
    
    // Utiliser requestAnimationFrame pour permettre à l'animation de fermeture de se produire
    requestAnimationFrame(() => {
      // Petit délai pour s'assurer que l'animation est en cours
      setTimeout(() => {
        onClose();
      }, 50);
    });
  };

  const typeLabel = type === "mainDish" 
    ? "plat principal" 
    : type === "sideDish" 
      ? "accompagnement" 
      : "dessert";

  // Si le dialogue est fermé, ne rien rendre
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
