import React, { useState, useEffect } from 'react';
import { useWeeklyMenu } from '@/hooks/use-weekly-menu';
import { MenuCard } from '@/components/MenuCard';
import { WeekNavigation } from '@/components/WeekNavigation';
import { weeklyMenu as defaultWeeklyMenu, DayMenu } from '@/data/menuData';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, ShoppingCart } from "lucide-react";
import { weeklyPackagePrice, paymentRedirectUrl, paymentMessages, generateReceiptId } from '@/config/paymentConfig';
import { SocialMediaButtons } from '@/components/SocialMediaButtons';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserHeader } from '@/components/user-header/UserHeader';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeDay, setActiveDay] = useState("");
  const { menus, isLoading } = useWeeklyMenu();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showWeeklyReceipt, setShowWeeklyReceipt] = useState(false);
  const [weeklyReceiptId, setWeeklyReceiptId] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment_status');
    
    if (paymentStatus === 'success') {
      toast({
        title: paymentMessages.paymentSuccess,
        description: paymentMessages.paymentSuccessDescription,
      });
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);

  useEffect(() => {
    const getCurrentDay = () => {
      const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const currentDayName = daysOfWeek[new Date().getDay()];
      
      const todayMenu = menus.find(menu => menu.day.includes(currentDayName));
      
      if (todayMenu) {
        setActiveDay(todayMenu.id);
      } else {
        setActiveDay(menus[0]?.id || "");
      }
    };
    
    getCurrentDay();
  }, [menus]);

  const handleWeeklyPayment = () => {
    const receiptId = generateReceiptId();
    setWeeklyReceiptId(receiptId);
    setShowWeeklyReceipt(true);
    
    toast({
      title: paymentMessages.weeklyTitle,
      description: paymentMessages.weeklyDescription(weeklyPackagePrice),
    });
  };

  const handleCloseWeeklyReceipt = () => {
    setShowWeeklyReceipt(false);
    
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    window.location.href = `${paymentRedirectUrl}?amount=${weeklyPackagePrice}&details=Menu_Semaine_Complete&return_url=${returnUrl}`;
  };

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30">
      <header className="bg-restaurant-purple text-white py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-2 rounded-lg">
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
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-restaurant-purple border-t-restaurant-red rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
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
                  menus={menus} 
                  activeDay={activeDay} 
                  setActiveDay={setActiveDay} 
                />

                <div className="animate-fade-in">
                  {menus.map((menu) => (
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
          </>
        )}
      </main>

      {showWeeklyReceipt && (
        <PaymentReceiptDialog
          isOpen={showWeeklyReceipt}
          onClose={handleCloseWeeklyReceipt}
          price={weeklyPackagePrice}
          details="Menu complet de la semaine"
          date={new Date()}
          receiptId={weeklyReceiptId}
        />
      )}

      <footer className="bg-restaurant-purple text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-2 rounded-lg mr-4">
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
