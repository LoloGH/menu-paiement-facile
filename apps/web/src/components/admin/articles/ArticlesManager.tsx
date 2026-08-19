import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { formatAmount } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminArticles, useRetireArticle } from "@/hooks/api/use-menus";
import type { Article } from "@/hooks/api/types";
import { ArticleDialog } from "./ArticleDialog";
import { ARTICLE_TYPE_LABELS } from "./articleLabels";

export function ArticlesManager({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [editing, setEditing] = useState<Article | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: articles, isLoading, isError, error } = useAdminArticles(debouncedSearch);
  const retireArticle = useRetireArticle();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Nom d'un article…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher un article"
          />
        </div>
        {!readOnly && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        )}
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : "Chargement impossible."}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead>Disponibilité</TableHead>
              {!readOnly && <TableHead className="w-[110px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && articles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Aucun article.
                </TableCell>
              </TableRow>
            )}
            {articles?.map((article) => (
              <TableRow key={article.id}>
                <TableCell>
                  {article.name}
                  {article.description && (
                    <span className="block text-xs text-gray-500 max-w-md truncate">
                      {article.description}
                    </span>
                  )}
                </TableCell>
                <TableCell>{ARTICLE_TYPE_LABELS[article.type]}</TableCell>
                <TableCell className="text-right">{formatAmount(article.price)}</TableCell>
                <TableCell>
                  {article.isAvailable ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      Retiré
                    </Badge>
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Modifier ${article.name}`}
                        onClick={() => setEditing(article)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!article.isAvailable || retireArticle.isPending}
                        aria-label={`Retirer ${article.name}`}
                        onClick={() =>
                          retireArticle.mutate(article.id, {
                            onSuccess: () =>
                              toast({
                                title: "Article retiré",
                                // Retiring rather than deleting: the dish may
                                // appear in past orders and menus.
                                description: "Il reste visible dans l'historique des commandes.",
                              }),
                            onError: (caught) =>
                              toast({
                                title: "Retrait impossible",
                                description: caught instanceof Error ? caught.message : undefined,
                                variant: "destructive",
                              }),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-restaurant-red" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(isCreating || editing) && (
        <ArticleDialog
          article={editing}
          onClose={() => {
            setIsCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
