
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu } from '@/data/menuData';
import { MealOption } from './MealOption';

interface MenuCardProps {
  menu: DayMenu;
  isActive: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ menu, isActive }) => {
  return (
    <Card className={`w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-70'}`}>
      <CardHeader className="bg-restaurant-olive text-white">
        <CardTitle className="text-2xl">{menu.day}</CardTitle>
        <CardDescription className="text-restaurant-cream text-lg">{menu.date}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.mealOptions.map((option) => (
            <MealOption 
              key={option.id}
              id={option.id}
              mainDish={option.mainDish}
              sideDish={option.sideDish}
              dessert={option.dessert}
              basePrice={option.totalPrice}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground w-full">
          Tous nos plats sont préparés avec des ingrédients frais du jour. 
          Vous pouvez personnaliser votre repas en ajoutant ou retirant l'accompagnement et le dessert.
        </p>
      </CardFooter>
    </Card>
  );
};
