import { useEffect, useMemo, useState } from "react";
import { toDateOnly, formatAmount } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAdminArticles, useCurrentMenus, useSaveMenu } from "@/hooks/api/use-menus";
import { ARTICLE_TYPE_LABELS } from "@/components/admin/articles/articleLabels";

/**
 * Builds the menu for one service date.
 *
 * The screen sends the complete desired state for that date and the server
 * replaces what it had — the route is idempotent on the date. The previous
 * editor kept its own copy of the menus in localStorage, synced through a
 * context that polled a task queue every 200 ms, and could drift from the
 * database without anyone noticing.
 */
export function MenuEditor({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast();
  const [serviceDate, setServiceDate] = useState(() => toDateOnly(new Date()));
  const [isPublished, setIsPublished] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: articles, isLoading: articlesLoading } = useAdminArticles();
  const { data: menus, isLoading: menusLoading } = useCurrentMenus(serviceDate, serviceDate);
  const saveMenu = useSaveMenu();

  const existing = menus?.[0];

  // Load the day's menu whenever the date changes, so switching dates shows
  // what is actually stored rather than the previous day's selection.
  useEffect(() => {
    setSelected(existing?.items.map((item) => item.articleId) ?? []);
    setIsPublished(existing?.isPublished ?? false);
  }, [existing]);

  const available = useMemo(
    () => (articles ?? []).filter((article) => article.isAvailable),
    [articles],
  );

  const byType = useMemo(() => {
    const groups = new Map<string, typeof available>();
    for (const article of available) {
      groups.set(article.type, [...(groups.get(article.type) ?? []), article]);
    }
    return groups;
  }, [available]);

  const handleSave = () => {
    saveMenu.mutate(
      {
        serviceDate,
        isPublished,
        items: selected.map((articleId, index) => ({ articleId, position: index })),
      },
      {
        onSuccess: () =>
          toast({
            title: "Menu enregistré",
            description: `${selected.length} article(s) pour le ${serviceDate}.`,
          }),
        onError: (caught) =>
          toast({
            title: "Enregistrement impossible",
            description: caught instanceof Error ? caught.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="menu-date">Date de service</Label>
          <Input
            id="menu-date"
            type="date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            className="w-[200px]"
          />
        </div>
        <div className="flex items-center gap-3 pb-2">
          <Switch
            id="menu-published"
            checked={isPublished}
            onCheckedChange={setIsPublished}
            disabled={readOnly}
          />
          <Label htmlFor="menu-published">Publié (visible par les clients)</Label>
        </div>
        {!readOnly && (
          <Button onClick={handleSave} disabled={saveMenu.isPending}>
            {saveMenu.isPending ? "Enregistrement…" : "Enregistrer le menu"}
          </Button>
        )}
      </div>

      {menusLoading && <p className="text-gray-600">Chargement du menu…</p>}

      {!menusLoading && !existing && (
        <Alert>
          <AlertDescription>
            Aucun menu n'existe pour cette date. Sélectionnez des articles puis enregistrez.
          </AlertDescription>
        </Alert>
      )}

      {articlesLoading && <p className="text-gray-600">Chargement du catalogue…</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {[...byType.entries()].map(([type, group]) => (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {ARTICLE_TYPE_LABELS[type as keyof typeof ARTICLE_TYPE_LABELS] ?? type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.map((article) => {
                const checked = selected.includes(article.id);
                return (
                  <div key={article.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`menu-article-${article.id}`}
                        checked={checked}
                        disabled={readOnly}
                        onCheckedChange={(value) =>
                          setSelected((current) =>
                            value === true
                              ? [...current, article.id]
                              : current.filter((id) => id !== article.id),
                          )
                        }
                      />
                      <Label
                        htmlFor={`menu-article-${article.id}`}
                        className="truncate cursor-pointer"
                      >
                        {article.name}
                      </Label>
                    </div>
                    <span className="text-sm text-gray-600 shrink-0">
                      {formatAmount(article.price)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
