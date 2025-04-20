
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from 'lucide-react';

interface TopDish {
  dish: string;
  count: number;
}

interface TopDishesCardProps {
  dishes: TopDish[];
}

export const TopDishesCard = ({ dishes }: TopDishesCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Plats les plus commandés</CardTitle>
        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dishes.map((dish, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm truncate flex-1 mr-4">{dish.dish}</span>
              <span className="text-sm font-medium">{dish.count} commandes</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
