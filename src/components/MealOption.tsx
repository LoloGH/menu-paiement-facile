
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MenuItem } from '@/data/menuData';
import { PaymentButton } from './PaymentButton';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { Eye } from 'lucide-react';
import { Button } from './ui/button';

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
  const [tableNumber, setTableNumber] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [previewImage, setPreviewImage] = useState<{url: string; name: string} | null>(null);

  const calculateTotal = (): number => {
    let total = basePrice;
    if (!includeSide) total -= sideDish.price;
    if (!includeDessert) total -= dessert.price;
    return total;
  };

  const total = calculateTotal();

  const handlePreviewImage = (imageUrl: string, name: string) => {
    setPreviewImage({ url: imageUrl, name });
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto overflow-hidden transition-all duration-300 mb-6 shadow-md hover:shadow-lg">
        <CardHeader className="bg-restaurant-purple text-white">
          <CardTitle className="text-xl">{mainDish.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Plat Principal */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden relative group">
                  <img 
                    src={mainDish.image} 
                    alt={mainDish.name} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handlePreviewImage(mainDish.image, mainDish.name)}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePreviewImage(mainDish.image, mainDish.name)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Plat Principal</h4>
                  <p className="text-sm text-muted-foreground">{mainDish.description}</p>
                  <p className="text-sm font-medium mt-1 text-restaurant-red">{mainDish.price.toFixed(0)} FCFA</p>
                </div>
              </div>
            </div>

            {/* Accompagnement */}
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
                  <div className="w-12 h-12 rounded-md overflow-hidden relative group">
                    <img 
                      src={sideDish.image} 
                      alt={sideDish.name} 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handlePreviewImage(sideDish.image, sideDish.name)}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePreviewImage(sideDish.image, sideDish.name)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{sideDish.name}</h4>
                    <p className="text-sm text-muted-foreground">{sideDish.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dessert */}
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
                  <div className="w-12 h-12 rounded-md overflow-hidden relative group">
                    <img 
                      src={dessert.image} 
                      alt={dessert.name} 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handlePreviewImage(dessert.image, dessert.name)}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePreviewImage(dessert.image, dessert.name)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{dessert.name}</h4>
                    <p className="text-sm text-muted-foreground">{dessert.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Numéro de table et Notes */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor={`table-${id}`}>Numéro de table</Label>
                <Input
                  id={`table-${id}`}
                  placeholder="Entrez le numéro de votre table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`note-${id}`}>Note spéciale</Label>
                <Textarea
                  id={`note-${id}`}
                  placeholder="Ajoutez une note spéciale pour votre commande"
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4 bg-muted p-6">
          <div className="flex justify-between items-center text-center">
            <span className="text-lg font-semibold">Prix total:</span>
            <span className="text-2xl font-bold text-restaurant-red">{total.toFixed(0)} FCFA</span>
          </div>
          <PaymentButton 
            price={total} 
            label="Payez Maintenant" 
            details={`${mainDish.name}${includeSide ? ` + ${sideDish.name}` : ''}${includeDessert ? ` + ${dessert.name}` : ''}`}
            additionalData={{
              tableNumber,
              clientNote,
            }}
          />
        </CardFooter>
      </Card>

      <ImagePreviewDialog 
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        itemName={previewImage?.name || ''}
      />
    </>
  );
};
