import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayMenu } from "@/data/menuData";
import { MealOption } from "./MealOption";

interface MenuCardProps {
  menu: DayMenu;
  isActive: boolean;
}

export function MenuCard({ menu, isActive }: MenuCardProps) {
  if (!isActive) return null;

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {menu.day}
          {/* The date comes from the menu's own service date rather than being
              recomputed from the current week, so a menu shown out of the
              current week is not mislabelled. */}
          <span className="block text-base font-normal text-gray-600 mt-1">{menu.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {menu.combos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucun plat n'est proposé pour cette journée.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menu.combos.map((combo) => (
              <MealOption key={combo.id} combo={combo} serviceDate={menu.serviceDate} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
