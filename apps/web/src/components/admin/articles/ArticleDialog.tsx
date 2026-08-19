import { useState, type FormEvent } from "react";
import { ARTICLE_TYPES, type ArticleType } from "@menu/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSaveArticle } from "@/hooks/api/use-menus";
import { ApiError } from "@/lib/api";
import type { Article } from "@/hooks/api/types";
import { ARTICLE_TYPE_LABELS } from "./articleLabels";

interface ArticleDialogProps {
  article: Article | null;
  onClose: () => void;
}

export function ArticleDialog({ article, onClose }: ArticleDialogProps) {
  const { toast } = useToast();
  const saveArticle = useSaveArticle();

  const [name, setName] = useState(article?.name ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [type, setType] = useState<ArticleType>(article?.type ?? "main_dish");
  const [price, setPrice] = useState(String(article?.price ?? ""));
  const [imageUrl, setImageUrl] = useState(article?.imageUrl ?? "");
  const [isAvailable, setIsAvailable] = useState(article?.isAvailable ?? true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    saveArticle.mutate(
      {
        ...(article ? { id: article.id } : {}),
        name,
        description: description || null,
        type,
        // Whole francs. The server rejects a decimal rather than rounding it,
        // so the field is validated here too to fail before the round trip.
        price: Number(price),
        imageUrl: imageUrl || null,
        isAvailable,
      },
      {
        onSuccess: () => {
          toast({ title: article ? "Article modifié" : "Article créé" });
          onClose();
        },
        onError: (caught) => {
          if (caught instanceof ApiError) {
            setError(caught.message);
            setFieldErrors(
              Object.fromEntries(caught.fields.map((field) => [field.path, field.message])),
            );
          } else {
            setError("Enregistrement impossible.");
          }
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{article ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article-name">Nom</Label>
            <Input
              id="article-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-description">Description</Label>
            <Textarea
              id="article-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ArticleType)}>
                <SelectTrigger id="article-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_TYPES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {ARTICLE_TYPE_LABELS[entry]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-price">Prix (FCFA)</Label>
              <Input
                id="article-price"
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
              {fieldErrors.price && <p className="text-sm text-destructive">{fieldErrors.price}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-image">URL de l'image</Label>
            <Input
              id="article-image"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
            />
            {fieldErrors.imageUrl && (
              <p className="text-sm text-destructive">{fieldErrors.imageUrl}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch id="article-available" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="article-available">Disponible à la commande</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveArticle.isPending}>
              {saveArticle.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
