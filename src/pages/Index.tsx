import React, { useState, useEffect } from 'react';
import { MenuCard } from '@/components/MenuCard';
import { WeekNavigation } from '@/components/WeekNavigation';
import { weeklyMenu } from '@/data/menuData';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarCheck, ShoppingCart } from "lucide-react";
import { weeklyPackagePrice, paymentRedirectUrl, paymentMessages } from '@/config/paymentConfig';
import { SocialMediaButtons } from '@/components/SocialMediaButtons';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserHeader } from '@/components/UserHeader';

const Index = () => {
  const [activeDay, setActiveDay] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fonction pour déterminer le jour actuel de la semaine
  useEffect(() => {
    const getCurrentDay = () => {
      const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const currentDayName = daysOfWeek[new Date().getDay()];
      
      // Trouver le menu correspondant au jour actuel
      const todayMenu = weeklyMenu.find(menu => menu.day.includes(currentDayName));
      
      // Si le jour actuel existe dans le menu, on le définit comme actif
      // Sinon, on prend le premier jour du menu
      if (todayMenu) {
        setActiveDay(todayMenu.id);
      } else {
        setActiveDay(weeklyMenu[0].id);
      }
    };
    
    getCurrentDay();
  }, []);

  const handleWeeklyPayment = () => {
    toast({
      title: paymentMessages.weeklyTitle,
      description: paymentMessages.weeklyDescription(weeklyPackagePrice),
    });

    // Redirection vers le lien de paiement Wave
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    window.location.href = `${paymentRedirectUrl}?amount=${weeklyPackagePrice}&details=Menu_Semaine_Complete&return_url=${returnUrl}`;
  };

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30">
      <header className="bg-restaurant-purple text-white py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-[#1A1F2C] p-2 rounded-lg">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png" 
                  alt="AXESS Logo" 
                  className="h-16 md:h-20 mr-4"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserHeader className="mr-4" />
              <SocialMediaButtons />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Menu de la Semaine</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Découvrez nos délicieux repas préparés par nos chefs pour chaque jour de la semaine.
              Commandez à l'avance et profitez de repas frais et savoureux.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-restaurant-red text-white text-lg font-semibold px-6 py-3 rounded-full mb-6">
            Économisez en commandant pour toute la semaine !
          </div>
          <Button 
            onClick={handleWeeklyPayment}
            size={isMobile ? "default" : "lg"} 
            className={`bg-restaurant-purple hover:bg-restaurant-red transition-colors ${isMobile ? 'w-full' : ''}`}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isMobile ? (
              "Semaine entière - " + weeklyPackagePrice.toFixed(0) + " FCFA"
            ) : (
              "Payez Maintenant - Tous les repas de la semaine pour " + weeklyPackagePrice.toFixed(0) + " FCFA"
            )}
            <CalendarCheck className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {activeDay && (
          <>
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
          </>
        )}
      </main>

      <footer className="bg-restaurant-purple text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-[#1A1F2C] p-2 rounded-lg mr-4">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png" 
                  alt="AXESS Logo" 
                  className="h-12"
                />
              </div>
              <p className="text-sm">© 2025 Semaine Menu Paiement Facile</p>
            </div>
            <SocialMediaButtons />
          </div>
          <div className="text-center mt-4">
            <p className="text-sm">
              Tous nos plats sont préparés avec des ingrédients frais et de qualité.
              Livraison disponible dans un rayon de 10 km.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
