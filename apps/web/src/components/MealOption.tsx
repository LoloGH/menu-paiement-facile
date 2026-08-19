import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatAmount } from "@menu/shared";
import type { MealCombo, MenuDish } from "@/data/menuData";
import { OrderButton } from "./OrderButton";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

interface MealOptionProps {
  combo: MealCombo;
  serviceDate: string;
}

interface DishRowProps {
  dish: MenuDish;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onPreview: (dish: MenuDish) => void;
}

function DishRow({ dish, label, checked, onCheckedChange, onPreview }: DishRowProps) {
  const inputId = `dish-${dish.menuItemId}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            id={inputId}
            checked={checked}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            disabled={!dish.isAvailable}
          />
          <Label htmlFor={inputId} className="truncate cursor-pointer">
            <span className="text-xs uppercase text-gray-500 block">{label}</span>
            {dish.name}
          </Label>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-medium">{formatAmount(dish.price)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPreview(dish)}
            aria-label={`Voir la photo de ${dish.name}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {dish.description && <p className="text-sm text-gray-600 pl-6">{dish.description}</p>}
      {!dish.isAvailable && <p className="text-sm text-restaurant-red pl-6">Indisponible</p>}
    </div>
  );
}

/**
 * One orderable combo: a main course, optionally with a side and a dessert.
 *
 * The total shown here is only an estimate for the customer's benefit. What is
 * actually charged is computed by the server from the selected `menuItemId`s —
 * this component never sends a price.
 */
export function MealOption({ combo, serviceDate }: MealOptionProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => ({
    [combo.mainDish.menuItemId]: combo.mainDish.isAvailable,
    ...(combo.sideDish ? { [combo.sideDish.menuItemId]: combo.sideDish.isAvailable } : {}),
    ...(combo.dessert ? { [combo.dessert.menuItemId]: combo.dessert.isAvailable } : {}),
  }));
  const [tableNumber, setTableNumber] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [preview, setPreview] = useState<MenuDish | null>(null);

  const dishes = useMemo(
    () =>
      [
        { dish: combo.mainDish, label: "Plat principal" },
        ...(combo.sideDish ? [{ dish: combo.sideDish, label: "Accompagnement" }] : []),
        ...(combo.dessert ? [{ dish: combo.dessert, label: "Dessert" }] : []),
      ].filter((entry) => entry.dish.isAvailable),
    [combo],
  );

  const chosen = dishes.filter((entry) => selected[entry.dish.menuItemId]);
  const total = chosen.reduce((sum, entry) => sum + entry.dish.price, 0);

  return (
    <>
      <Card className="w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg flex flex-col">
        <CardHeader className="bg-restaurant-purple text-white">
          <CardTitle className="text-lg">{combo.mainDish.name}</CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-4 flex-1">
          {dishes.map((entry) => (
            <DishRow
              key={entry.dish.menuItemId}
              dish={entry.dish}
              label={entry.label}
              checked={selected[entry.dish.menuItemId] ?? false}
              onCheckedChange={(checked) =>
                setSelected((current) => ({ ...current, [entry.dish.menuItemId]: checked }))
              }
              onPreview={setPreview}
            />
          ))}

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor={`table-${combo.id}`}>Numéro de table (facultatif)</Label>
            <Input
              id={`table-${combo.id}`}
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              maxLength={20}
              placeholder="Ex. 12"
            />
            <Label htmlFor={`note-${combo.id}`}>Note pour la cuisine (facultatif)</Label>
            <Textarea
              id={`note-${combo.id}`}
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Sans piment, allergie…"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 bg-gray-50 p-5">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-600">Total estimé</span>
            <span className="text-xl font-semibold">{formatAmount(total)}</span>
          </div>
          <OrderButton
            items={chosen.map((entry) => ({ menuItemId: entry.dish.menuItemId, quantity: 1 }))}
            summary={chosen.map((entry) => entry.dish.name).join(", ")}
            serviceDate={serviceDate}
            tableNumber={tableNumber}
            customerNote={customerNote}
          />
        </CardFooter>
      </Card>

      {preview && (
        <ImagePreviewDialog
          isOpen
          onClose={() => setPreview(null)}
          imageUrl={preview.image}
          itemName={preview.name}
        />
      )}
    </>
  );
}
