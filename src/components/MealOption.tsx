
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MenuItem } from '@/data/menuData';
import { PaymentButton } from './PaymentButton';

interface MealOptionProps {
  id: string;
  mainDish: MenuItem;
  sideDish: MenuItem;
  dessert: MenuItem;
  basePrice: number;
}

export const MealOption: React.FC<MealOptionProps> = ({ 
  id, 
  mainDish, 
  sideDish, 
  dessert, 
  basePrice 
}) => {
  const [includeSide, setIncludeSide] = useState(true);
  const [includeDessert, setIncludeDessert] = useState(true);

  // Calcul du prix total en fonction des sélections
  const calculateTotal = (): number => {
    let total = basePrice;
    if (!includeSide) total -= sideDish.price;
    if (!includeDessert) total -= dessert.price;
    return total;
  };

  const total = calculateTotal();

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden transition-all duration-300 mb-6 shadow-md hover:shadow-lg">
      <CardHeader className="bg-restaurant-purple text-white">
        <CardTitle className="text-xl">{mainDish.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={mainDish.image} 
                  alt={mainDish.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Plat Principal</h4>
                <p className="text-sm text-muted-foreground">{mainDish.description}</p>
                <p className="text-sm font-medium mt-1 text-restaurant-red">{mainDish.price.toFixed(0)} FCFA</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`side-${id}`} 
                  checked={includeSide} 
                  onCheckedChange={(checked) => setIncludeSide(checked as boolean)}
                />
                <Label htmlFor={`side-${id}`} className="font-serif text-lg font-semibold text-restaurant-purple">
                  Accompagnement
                </Label>
              </div>
              <span className="text-sm font-medium text-restaurant-red">{sideDish.price.toFixed(0)} FCFA</span>
            </div>
            
            {includeSide && (
              <div className="flex items-center gap-4 pl-6">
                <div className="w-12 h-12 rounded-md overflow-hidden">
                  <img 
                    src={sideDish.image} 
                    alt={sideDish.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{sideDish.name}</h4>
                  <p className="text-sm text-muted-foreground">{sideDish.description}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`dessert-${id}`} 
                  checked={includeDessert} 
                  onCheckedChange={(checked) => setIncludeDessert(checked as boolean)}
                />
                <Label htmlFor={`dessert-${id}`} className="font-serif text-lg font-semibold text-restaurant-purple">
                  Dessert
                </Label>
              </div>
              <span className="text-sm font-medium text-restaurant-red">{dessert.price.toFixed(0)} FCFA</span>
            </div>
            
            {includeDessert && (
              <div className="flex items-center gap-4 pl-6">
                <div className="w-12 h-12 rounded-md overflow-hidden">
                  <img 
                    src={dessert.image} 
                    alt={dessert.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{dessert.name}</h4>
                  <p className="text-sm text-muted-foreground">{dessert.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 bg-muted p-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Prix total:</span>
          <span className="text-2xl font-bold text-restaurant-red">{total.toFixed(0)} FCFA</span>
        </div>
        <PaymentButton 
          price={total} 
          label={`Commander ${mainDish.name}`} 
          details={`${mainDish.name}${includeSide ? ` + ${sideDish.name}` : ''}${includeDessert ? ` + ${dessert.name}` : ''}`}
        />
      </CardFooter>
    </Card>
  );
};
