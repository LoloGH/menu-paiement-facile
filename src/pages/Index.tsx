
import React, { useState } from 'react';
import { MenuCard } from '@/components/MenuCard';
import { WeekNavigation } from '@/components/WeekNavigation';
import { weeklyMenu } from '@/data/menuData';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarCheck, ShoppingCart } from "lucide-react";
import { weeklyPackagePrice, paymentSimulationDelay, paymentMessages } from '@/config/paymentConfig';

const Index = () => {
  const [activeDay, setActiveDay] = useState(weeklyMenu[0].id);
  const { toast } = useToast();

  const handleWeeklyPayment = () => {
    toast({
      title: paymentMessages.weeklyTitle,
      description: paymentMessages.weeklyDescription(weeklyPackagePrice),
    });

    // Simuler une redirection après un court délai
    setTimeout(() => {
      toast({
        title: paymentMessages.simulatedTitle,
        description: paymentMessages.simulatedDescription,
        variant: "default",
      });
    }, paymentSimulationDelay);
  };

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30">
      <header className="bg-restaurant-purple text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Menu de la Semaine</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Découvrez nos délicieux repas préparés par nos chefs pour chaque jour de la semaine.
            Commandez à l'avance et profitez de repas frais et savoureux.
          </p>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-restaurant-red text-white text-lg font-semibold px-6 py-3 rounded-full mb-6">
            Économisez en commandant pour toute la semaine !
          </div>
          <Button 
            onClick={handleWeeklyPayment}
            size="lg" 
            className="bg-restaurant-purple hover:bg-restaurant-red transition-colors"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Payez Maintenant - Tous les repas de la semaine pour {weeklyPackagePrice.toFixed(0)} FCFA
            <CalendarCheck className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <WeekNavigation 
          menus={weeklyMenu} 
          activeDay={activeDay} 
          setActiveDay={setActiveDay} 
        />

        <div className="animate-fade-in">
          {weeklyMenu.map((menu) => (
            <div 
              key={menu.id} 
              className={`transition-all duration-500 ${
                activeDay === menu.id ? "block" : "hidden"
              }`}
            >
              <MenuCard menu={menu} isActive={activeDay === menu.id} />
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-restaurant-purple text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="mb-4">© 2025 Semaine Menu Paiement Facile</p>
          <p className="text-sm">
            Tous nos plats sont préparés avec des ingrédients frais et de qualité.
            Livraison disponible dans un rayon de 10 km.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
