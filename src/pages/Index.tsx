import React, { useState, useEffect } from 'react';
import { MenuCard } from '@/components/MenuCard';
import { DayMenu } from '@/data/menuData';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, CalendarCheck } from "lucide-react";
import { weeklyPackagePrice, paymentRedirectUrl, paymentMessages, generateReceiptId } from '@/config/paymentConfig';
import { SocialMediaButtons } from '@/components/SocialMediaButtons';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserHeader } from '@/components/user-header/UserHeader';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { supabase } from "@/integrations/supabase/client";

// Modify the type to include only weekdays for certain operations
type WeekdayName = "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";
type DayName = WeekdayName | "Samedi" | "Dimanche";

const Index = () => {
  const [todayMenu, setTodayMenu] = useState<DayMenu | null>(null);
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
    const loadTodayMenu = async () => {
      try {
        const daysOfWeek: DayName[] = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const currentDayIndex = new Date().getDay();
        const currentDayName = daysOfWeek[currentDayIndex];

        // Use type assertion or filtering when working with weekday-specific operations
        const { data: weeklyMenus, error: weeklyMenuError } = await supabase
          .from('weekly_menus')
          .select('*')
          .eq('is_active', true)
          // Ensure only valid weekdays are used here
          .eq('day', currentDayName as WeekdayName);

        if (weeklyMenuError) throw weeklyMenuError;

        const { data: menuArticles, error: menuArticlesError } = await supabase
          .from('menu_articles')
          .select(`
            id,
            menu_day,
            articles (
              id,
              name,
              price,
              description,
              image_url,
              type
            )
          `);

        if (menuArticlesError) throw menuArticlesError;

        // Group articles by menu day and type
        const menuItems = {
          mainDishes: [],
          sideDishes: [],
          desserts: []
        };
        
        if (menuArticles && menuArticles.length > 0) {
          menuArticles
            .filter(ma => ma.menu_day === currentDayName)
            .forEach((menuArticle: any) => {
              const article = menuArticle.articles;
              if (article.type === 'main_dish') menuItems.mainDishes.push(article);
              else if (article.type === 'side_dish') menuItems.sideDishes.push(article);
              else if (article.type === 'dessert') menuItems.desserts.push(article);
            });
        }

        const todayMenuData = {
          id: `menu_${currentDayName}`,
          day: currentDayName,
          date: weeklyMenus?.[0]?.date || '',
          mealOptions: convertToMealOptions(menuItems)
        };

        setTodayMenu(todayMenuData);
      } catch (error) {
        console.error("Erreur lors du chargement du menu:", error);
        setTodayMenu(null);
      }
    };

    loadTodayMenu();
  }, []);

  const convertToMealOptions = (items: any) => {
    const mealOptions = [];

    if (items.mainDishes && items.mainDishes.length > 0) {
      for (const mainDish of items.mainDishes) {
        const sideDish = items.sideDishes[0] || {
          id: `default_side_${Date.now()}`,
          name: "Accompagnement standard",
          price: 0,
          description: "Accompagnement du jour"
        };

        const dessert = items.desserts[0] || {
          id: `default_dessert_${Date.now()}`,
          name: "Dessert standard",
          price: 0,
          description: "Dessert du jour"
        };

        const totalPrice = (mainDish.price || 0) + (sideDish.price || 0) + (dessert.price || 0);

        mealOptions.push({
          id: `option_${mainDish.id}`,
          mainDish: {
            id: mainDish.id,
            name: mainDish.name,
            description: mainDish.description || "",
            price: mainDish.price || 0,
            image: mainDish.image_url || "/placeholder.svg"
          },
          sideDish: {
            id: sideDish.id,
            name: sideDish.name,
            description: sideDish.description || "",
            price: sideDish.price || 0,
            image: sideDish.image_url || "/placeholder.svg"
          },
          dessert: {
            id: dessert.id,
            name: dessert.name,
            description: dessert.description || "",
            price: dessert.price || 0,
            image: dessert.image_url || "/placeholder.svg"
          },
          totalPrice
        });
      }
    }

    return mealOptions;
  };

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Menu du Jour</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Découvrez nos délicieux repas préparés par nos chefs pour aujourd'hui.
              Commandez à l'avance et profitez de repas frais et savoureux.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="animate-fade-in">
          {todayMenu ? (
            <MenuCard menu={todayMenu} isActive={true} />
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                Aucun menu n'est disponible pour aujourd'hui.
              </p>
            </div>
          )}
        </div>
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
              <p className="text-sm">© 2025 Menu du Jour</p>
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
