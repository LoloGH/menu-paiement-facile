
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu } from '@/data/menuData';
import { MealOption } from './MealOption';
import { format, parse, isValid } from "date-fns";
import { fr } from 'date-fns/locale';

interface MenuCardProps {
  menu: DayMenu;
  isActive: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ menu, isActive }) => {
  // Fonction pour formater la date
  const formatMenuDate = () => {
    if (!menu.date) return '';
    
    // Si la date est déjà au format ISO ou similaire
    if (typeof menu.date === 'string') {
      try {
        // Essayer de parser la date selon différents formats possibles
        let parsedDate;
        
        // Si la date est au format YYYY-MM-DD
        if (menu.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          parsedDate = parse(menu.date, 'yyyy-MM-dd', new Date());
        } 
        // Si la date est au format ISO complet
        else if (menu.date.includes('T')) {
          parsedDate = new Date(menu.date);
        } 
        // Sinon essayer un format général
        else {
          parsedDate = parse(menu.date, 'dd/MM/yyyy', new Date());
        }
        
        if (isValid(parsedDate)) {
          return format(parsedDate, 'd MMMM', { locale: fr });
        }
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
      }
    }
    
    return '';
  };
  
  // Traduire le jour en français si nécessaire
  const getLocalizedDay = () => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'Lundi',
      'Tuesday': 'Mardi',
      'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi',
      'Friday': 'Vendredi',
      'Saturday': 'Samedi',
      'Sunday': 'Dimanche',
      
      // Pour être sûr que les jours en français fonctionnent aussi
      'Lundi': 'Lundi',
      'Mardi': 'Mardi',
      'Mercredi': 'Mercredi',
      'Jeudi': 'Jeudi',
      'Vendredi': 'Vendredi',
      'Samedi': 'Samedi',
      'Dimanche': 'Dimanche'
    };
    
    // Vérifier si le jour est dans la table de correspondance
    if (menu.day && dayMap[menu.day]) {
      return dayMap[menu.day];
    }
    
    // Si c'est déjà en français ou pas reconnu, retourner tel quel
    return menu.day;
  };

  const displayDay = getLocalizedDay();
  const displayDate = formatMenuDate();

  return (
    <Card className={`w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-70'}`}>
      <CardHeader className="bg-restaurant-purple text-white">
        <CardTitle className="text-2xl">{displayDay}</CardTitle>
        <CardDescription className="text-restaurant-cream text-lg">{displayDate}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.mealOptions && menu.mealOptions.length > 0 ? (
            menu.mealOptions.map((option) => (
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
            <p className="col-span-full text-center py-8 text-muted-foreground">
              Aucune option de repas disponible pour ce jour.
            </p>
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
