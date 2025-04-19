import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { revalidatePath } from 'next/cache';

interface ArticlesManagerProps {
  readOnly?: boolean;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit comporter au moins 10 caractères.",
  }),
  price: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }, {
    message: "Le prix doit être un nombre positif.",
  }),
  category: z.string().min(1, {
    message: "Veuillez sélectionner une catégorie.",
  }),
  image_url: z.string().url({
    message: "Veuillez entrer une URL valide.",
  }),
  available_from: z.date(),
  available_until: z.date(),
});

export const ArticlesManager: React.FC<ArticlesManagerProps> = ({ readOnly = false }) => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(new Date());
  const [availableUntil, setAvailableUntil] = useState<Date | undefined>(new Date());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      available_from: new Date(),
      available_until: new Date(),
    },
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArticles(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les articles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      setCategories(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les catégories: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateArticle = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from("articles")
        .insert({
          ...values,
          price: parseFloat(values.price),
          available_from: format(values.available_from, "yyyy-MM-dd", { locale: fr }),
          available_until: format(values.available_until, "yyyy-MM-dd", { locale: fr }),
        });
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Article créé avec succès",
      });
      fetchArticles();
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de créer l'article: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateArticle = async (values: z.infer<typeof formSchema>) => {
    if (!selectedArticle) return;
    try {
      const { error } = await supabase
        .from("articles")
        .update({
          ...values,
          price: parseFloat(values.price),
          available_from: format(values.available_from, "yyyy-MM-dd", { locale: fr }),
          available_until: format(values.available_until, "yyyy-MM-dd", { locale: fr }),
        })
        .eq("id", selectedArticle.id);
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Article mis à jour avec succès",
      });
      fetchArticles();
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour l'article: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle) return;
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", selectedArticle.id);
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Article supprimé avec succès",
      });
      fetchArticles();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'article: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (article: any) => {
    setSelectedArticle(article);
    setAvailableFrom(new Date(article.available_from));
    setAvailableUntil(new Date(article.available_until));
    form.setValue("name", article.name);
    form.setValue("description", article.description);
    form.setValue("price", article.price.toString());
    form.setValue("category", article.category);
    form.setValue("image_url", article.image_url);
    form.setValue("available_from", new Date(article.available_from));
    form.setValue("available_until", new Date(article.available_until));
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (article: any) => {
    setSelectedArticle(article);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des articles</CardTitle>
        <CardDescription>
          Ici, vous pouvez gérer les articles disponibles sur le site web.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={readOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un article
          </Button>
        </div>
        {isLoading ? (
          <p>Chargement des articles...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>{article.name}</TableCell>
                  <TableCell>{article.price} €</TableCell>
                  <TableCell>
                    {
                      categories.find((category) => category.id === article.category)?.name
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditDialog(article)}
                        disabled={readOnly}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(article)}
                        disabled={readOnly}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Article Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un article</DialogTitle>
            <DialogDescription>
              Ajouter un nouvel article à la liste.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateArticle)}
              className="space-y-4"
            >
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de l'article"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input placeholder="Prix de l'article" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="URL de l'image" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="available_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disponible à partir du</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={fr}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > (availableUntil || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available_until"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disponible jusqu'au</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={fr}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < (availableFrom || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">Créer</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier un article</DialogTitle>
            <DialogDescription>
              Modifier les informations de l'article sélectionné.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateArticle)}
              className="space-y-4"
            >
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de l'article"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input placeholder="Prix de l'article" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="URL de l'image" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="available_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disponible à partir du</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={fr}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > (availableUntil || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available_until"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disponible jusqu'au</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={fr}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < (availableFrom || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">Modifier</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Article Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'article définitivement.
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
