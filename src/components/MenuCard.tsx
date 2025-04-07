
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu } from '@/data/menuData';
import { PaymentButton } from './PaymentButton';

interface MenuCardProps {
  menu: DayMenu;
  isActive: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ menu, isActive }) => {
  return (
    <Card className={`w-full max-w-md mx-auto overflow-hidden transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-lg' : 'scale-95 opacity-70'}`}>
      <CardHeader className="bg-restaurant-olive text-white">
        <CardTitle className="text-2xl">{menu.day}</CardTitle>
        <CardDescription className="text-restaurant-cream text-lg">{menu.date}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-semibold text-restaurant-olive">Plat Principal</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={menu.mainDish.image} 
                  alt={menu.mainDish.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{menu.mainDish.name}</h4>
                <p className="text-sm text-muted-foreground">{menu.mainDish.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-xl font-semibold text-restaurant-olive">Accompagnement</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={menu.sideDish.image} 
                  alt={menu.sideDish.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{menu.sideDish.name}</h4>
                <p className="text-sm text-muted-foreground">{menu.sideDish.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-xl font-semibold text-restaurant-olive">Dessert</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={menu.dessert.image} 
                  alt={menu.dessert.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{menu.dessert.name}</h4>
                <p className="text-sm text-muted-foreground">{menu.dessert.description}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 bg-muted p-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Prix total:</span>
          <span className="text-2xl font-bold text-restaurant-terracotta">{menu.totalPrice.toFixed(2)}€</span>
        </div>
        <PaymentButton price={menu.totalPrice} label={`Commander pour ${menu.day}`} />
      </CardFooter>
    </Card>
  );
};
