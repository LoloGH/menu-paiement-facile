
import React, { useState, useEffect } from 'react';
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
  const [menus, setMenus] = useState<DayMenu[]>(defaultWeeklyMenu);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showWeeklyReceipt, setShowWeeklyReceipt] = useState(false);
  const [weeklyReceiptId, setWeeklyReceiptId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
    const loadMenus = async () => {
      try {
        setIsLoading(true);
        
        // Charger d'abord les menus hebdomadaires actifs
        const { data: weeklyMenus, error: weeklyMenuError } = await supabase
          .from('weekly_menus')
          .select('*')
          .eq('is_active', true)
          .order('date', { ascending: true });

        if (weeklyMenuError) throw weeklyMenuError;

        if (!weeklyMenus || weeklyMenus.length === 0) {
          console.log("Aucun menu hebdomadaire actif trouvé, utilisation des menus par défaut");
          setMenus(defaultWeeklyMenu);
          setIsLoading(false);
          return;
        }

        // Charger ensuite les articles de menu avec leurs détails
        const { data: menuArticles, error: menuArticlesError } = await supabase
          .from('menu_articles')
          .select(`
            id,
            menu_day,
            article_id,
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

        // Grouper les articles par jour de menu et type
        const menusByDay = new Map();
        
        // Initialiser la structure pour chaque jour de la semaine
        weeklyMenus.forEach(weekMenu => {
          menusByDay.set(weekMenu.day, {
            id: `menu_${weekMenu.day}`,
            day: weekMenu.day,
            date: weekMenu.date ? new Date(weekMenu.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '',
            mainDishes: [],
            sideDishes: [],
            desserts: []
          });
        });

        // Ajouter les articles aux jours correspondants
        menuArticles.forEach((menuArticle: any) => {
          const article = menuArticle.articles;
          const menuDay = menuArticle.menu_day;
          
          if (!menusByDay.has(menuDay)) {
            return; // Ignorer les articles pour des jours non actifs
          }
          
          const menu = menusByDay.get(menuDay);
          if (!article) return; // Ignorer les articles non définis
          
          if (article.type === 'main_dish') {
            menu.mainDishes.push({
              id: article.id,
              name: article.name,
              price: article.price,
              description: article.description || "",
              imageUrl: article.image_url || "/placeholder.svg"
            });
          } else if (article.type === 'side_dish') {
            menu.sideDishes.push({
              id: article.id,
              name: article.name,
              price: article.price,
              description: article.description || "",
              imageUrl: article.image_url || "/placeholder.svg"
            });
          } else if (article.type === 'dessert') {
            menu.desserts.push({
              id: article.id,
              name: article.name,
              price: article.price,
              description: article.description || "",
              imageUrl: article.image_url || "/placeholder.svg"
            });
          }
        });

        // Convertir les données au format attendu par l'application
        const convertedMenus = Array.from(menusByDay.values()).map(menuDay => ({
          id: menuDay.id,
          day: menuDay.day,
          date: menuDay.date,
          mealOptions: convertToMealOptions(menuDay)
        }));

        if (convertedMenus && convertedMenus.length > 0) {
          console.log("Menus chargés depuis Supabase:", convertedMenus);
          setMenus(convertedMenus);
          setIsLoading(false);
          return;
        }
        
        throw new Error("Aucun menu valide n'a été trouvé dans Supabase");
        
      } catch (error) {
        console.error("Erreur lors du chargement des menus depuis Supabase:", error);
        
        // Essayer de charger depuis localStorage en cas d'échec
        try {
          const savedMenus = localStorage.getItem('weeklyMenu');
          if (savedMenus) {
            const adminMenus = JSON.parse(savedMenus);
            const convertedMenus = convertAdminMenusToAppFormat(adminMenus);
            
            if (convertedMenus && convertedMenus.length > 0) {
              console.log("Menus chargés depuis localStorage:", convertedMenus);
              setMenus(convertedMenus);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des menus depuis localStorage:", error);
        }

        // En dernier recours, utiliser les menus par défaut
        console.log("Utilisation des menus par défaut");
        setMenus(defaultWeeklyMenu);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenus();

    const handleMenuUpdate = (event: CustomEvent) => {
      console.log("Événement de mise à jour des menus détecté");
      loadMenus();
    };
    
    window.addEventListener('menu-updated', handleMenuUpdate as EventListener);
    
    return () => {
      window.removeEventListener('menu-updated', handleMenuUpdate as EventListener);
    };
  }, []);

  const convertAdminMenusToAppFormat = (adminMenus: any[]): DayMenu[] => {
    if (!adminMenus || !Array.isArray(adminMenus)) return defaultWeeklyMenu;

    return adminMenus.map(adminMenu => {
      const mealOptions = [];
      
      for (const mainDish of adminMenu.mainDishes) {
        const sideDish = adminMenu.sideDishes[0] || { 
          id: `default_side_${Date.now()}`,
          name: "Accompagnement standard",
          price: 0,
          description: "Accompagnement du jour"
        };
        
        const dessert = adminMenu.desserts[0] || {
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
            image: mainDish.imageUrl || "/placeholder.svg"
          },
          sideDish: {
            id: sideDish.id,
            name: sideDish.name,
            description: sideDish.description || "",
            price: sideDish.price || 0,
            image: sideDish.imageUrl || "/placeholder.svg"
          },
          dessert: {
            id: dessert.id,
            name: dessert.name,
            description: dessert.description || "",
            price: dessert.price || 0,
            image: dessert.imageUrl || "/placeholder.svg"
          },
          totalPrice
        });
      }
      
      return {
        id: adminMenu.id,
        day: adminMenu.day,
        date: adminMenu.date || "",
        mealOptions
      };
    });
  };

  const convertToMealOptions = (menuDay: any) => {
    const mealOptions = [];

    for (const mainDish of menuDay.mainDishes) {
      // Si aucun accompagnement ou dessert n'est disponible, utiliser des valeurs par défaut
      const sideDish = menuDay.sideDishes[0] || {
        id: `default_side_${Date.now()}`,
        name: "Accompagnement standard",
        price: 0,
        description: "Accompagnement du jour",
        imageUrl: "/placeholder.svg"
      };

      const dessert = menuDay.desserts[0] || {
        id: `default_dessert_${Date.now()}`,
        name: "Dessert standard",
        price: 0,
        description: "Dessert du jour",
        imageUrl: "/placeholder.svg"
      };

      const totalPrice = (mainDish.price || 0) + (sideDish.price || 0) + (dessert.price || 0);

      mealOptions.push({
        id: `option_${mainDish.id}`,
        mainDish: {
          id: mainDish.id,
          name: mainDish.name,
          description: mainDish.description || "",
          price: mainDish.price || 0,
          image: mainDish.imageUrl || "/placeholder.svg"
        },
        sideDish: {
          id: sideDish.id,
          name: sideDish.name,
          description: sideDish.description || "",
          price: sideDish.price || 0,
          image: sideDish.imageUrl || "/placeholder.svg"
        },
        dessert: {
          id: dessert.id,
          name: dessert.name,
          description: dessert.description || "",
          price: dessert.price || 0,
          image: dessert.imageUrl || "/placeholder.svg"  // Correction de l'erreur ici
        },
        totalPrice
      });
    }

    return mealOptions;
  };

  useEffect(() => {
    const getCurrentDay = () => {
      // Les jours en français
      const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const currentDayName = daysOfWeek[new Date().getDay()];
      
      const todayMenu = menus.find(menu => menu.day === currentDayName);
      
      if (todayMenu) {
        setActiveDay(todayMenu.id);
      } else {
        setActiveDay(menus[0]?.id || "");
      }
    };
    
    if (menus.length > 0 && !isLoading) {
      getCurrentDay();
    }
  }, [menus, isLoading]);

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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-restaurant-purple mx-auto mb-4"></div>
              <p className="text-lg text-restaurant-purple">Chargement des menus...</p>
            </div>
          </div>
        ) : activeDay ? (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              Aucun menu n'est actuellement disponible. Veuillez revenir plus tard.
            </p>
          </div>
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
