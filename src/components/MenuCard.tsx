
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu } from '@/data/menuData';
import { MealOption } from './MealOption';
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from 'date-fns/locale';

interface MenuCardProps {
  menu: DayMenu;
  isActive: boolean;
}

const getDayDate = (dayName: string): string => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
  
  const dayMap: { [key: string]: number } = {
    'Lundi': 0,
    'Mardi': 1,
    'Mercredi': 2,
    'Jeudi': 3,
    'Vendredi': 4,
    'Samedi': 5,
    'Dimanche': 6
  };

  const dayOffset = dayMap[dayName];
  if (dayOffset === undefined) return '';

  const date = addDays(weekStart, dayOffset);
  return format(date, 'd MMMM', { locale: fr });
};

export const MenuCard: React.FC<MenuCardProps> = ({ menu, isActive }) => {
  const dynamicDate = getDayDate(menu.day);

  return (
    <Card className={`w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-70'}`}>
      <CardHeader className="bg-restaurant-purple text-white">
        <CardTitle className="text-2xl">{menu.day}</CardTitle>
        <CardDescription className="text-restaurant-cream text-lg">{dynamicDate}</CardDescription>
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
