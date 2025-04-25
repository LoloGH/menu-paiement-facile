
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MealOption } from './MealOption';
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from 'date-fns/locale';
import { ProcessedMenu } from '@/hooks/use-weekly-menu';

interface MenuCardProps {
  menu: ProcessedMenu;
  isActive: boolean;
}

const getDayDate = (dayName: string): string => {
  try {
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
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Helper function to generate meal options from separate dish arrays
const generateMealOptions = (menu: ProcessedMenu) => {
  const mealOptions = [];
  
  // First, try to use any pre-existing mealOptions
  if (menu.mealOptions && menu.mealOptions.length > 0) {
    return menu.mealOptions;
  }
  
  // If no meal options exist, create combinations from the available dishes
  // Main dishes as separate options
  for (const mainDish of menu.mainDishes) {
    // For each main dish, create options with different side dishes if available
    if (menu.sideDishes.length > 0) {
      for (const sideDish of menu.sideDishes) {
        // With desserts if available
        if (menu.desserts.length > 0) {
          for (const dessert of menu.desserts) {
            mealOptions.push({
              id: `${mainDish.id}-${sideDish.id}-${dessert.id}`,
              mainDish,
              sideDish,
              dessert,
              totalPrice: mainDish.price + sideDish.price + dessert.price
            });
          }
        } else {
          // Without dessert
          mealOptions.push({
            id: `${mainDish.id}-${sideDish.id}`,
            mainDish,
            sideDish,
            totalPrice: mainDish.price + sideDish.price
          });
        }
      }
    } else {
      // Main dish only
      mealOptions.push({
        id: mainDish.id,
        mainDish,
        totalPrice: mainDish.price
      });
    }
  }
  
  return mealOptions;
};

export const MenuCard: React.FC<MenuCardProps> = ({ menu, isActive }) => {
  const dynamicDate = menu?.day ? getDayDate(menu.day) : '';

  // Vérifier que menu existe
  if (!menu) {
    console.error('Menu data is invalid:', menu);
    return (
      <Card className="w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 opacity-70">
        <CardHeader className="bg-restaurant-purple text-white">
          <CardTitle className="text-2xl">Menu non disponible</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p>Les informations du menu ne sont pas disponibles pour le moment.</p>
        </CardContent>
      </Card>
    );
  }
  
  const generatedMealOptions = generateMealOptions(menu);

  return (
    <Card className={`w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-70'}`}>
      <CardHeader className="bg-restaurant-purple text-white">
        <CardTitle className="text-2xl">{menu.day}</CardTitle>
        <CardDescription className="text-restaurant-cream text-lg">{dynamicDate}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedMealOptions.length > 0 ? (
            generatedMealOptions.map((option) => (
              <MealOption 
                key={option.id}
                id={option.id}
                mainDish={option.mainDish}
                sideDish={option.sideDish}
                dessert={option.dessert}
                basePrice={option.totalPrice}
              />
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg">
              <p>Pas d'options de repas disponibles pour ce jour.</p>
            </div>
          )}
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
