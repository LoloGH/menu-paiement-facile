
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Article {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  type: 'main_dish' | 'side_dish' | 'dessert' | 'other';
}

interface ArticleDialogProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Article, 'id'>) => void;
}

const articleSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  type: z.enum(["main_dish", "side_dish", "dessert", "other"]),
});

export const ArticleDialog = ({
  article,
  isOpen,
  onClose,
  onSave,
}: ArticleDialogProps) => {
  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      name: article?.name || "",
      price: article?.price || 0,
      description: article?.description || "",
      image_url: article?.image_url || "",
      type: article?.type || "main_dish",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: article?.name || "",
        price: article?.price || 0,
        description: article?.description || "",
        image_url: article?.image_url || "",
        type: article?.type || "main_dish",
      });
    }
  }, [article, isOpen, form]);

  const onSubmit = (data: z.infer<typeof articleSchema>) => {
    onSave({
      name: data.name,
      price: data.price,
      description: data.description,
      image_url: data.image_url,
      type: data.type,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {article ? "Modifier l'article" : "Nouvel article"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main_dish">Plat principal</SelectItem>
                      <SelectItem value="side_dish">Accompagnement</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (FCFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Prix"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de l'article"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'image</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="URL de l'image"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mr-2"
              >
                Annuler
              </Button>
              <Button type="submit" className="bg-restaurant-purple">
                {article ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
