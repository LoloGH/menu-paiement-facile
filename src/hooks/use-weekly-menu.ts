
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyMenu } from '@/components/admin/menu-editor/types';
import { useToast } from './use-toast';

export const useWeeklyMenu = () => {
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMenus = async () => {
    try {
      const { data: weeklyMenus, error: weeklyMenuError } = await supabase
        .from('weekly_menus')
        .select('*')
        .eq('is_active', true);

      if (weeklyMenuError) throw weeklyMenuError;

      const { data: menuArticles, error: menuArticlesError } = await supabase
        .from('menu_articles')
        .select(`
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

      // Process and format the data
      const processedMenus = weeklyMenus.map(weeklyMenu => {
        const dayArticles = menuArticles.filter(ma => ma.menu_day === weeklyMenu.day);
        
        return {
          id: weeklyMenu.id,
          day: weeklyMenu.day,
          date: weeklyMenu.date,
          is_active: weeklyMenu.is_active,
          mainDishes: dayArticles
            .filter(ma => ma.articles.type === 'main_dish')
            .map(ma => ({
              id: ma.articles.id,
              name: ma.articles.name,
              price: ma.articles.price,
              description: ma.articles.description,
              imageUrl: ma.articles.image_url,
            })),
          sideDishes: dayArticles
            .filter(ma => ma.articles.type === 'side_dish')
            .map(ma => ({
              id: ma.articles.id,
              name: ma.articles.name,
              price: ma.articles.price,
              description: ma.articles.description,
              imageUrl: ma.articles.image_url,
            })),
          desserts: dayArticles
            .filter(ma => ma.articles.type === 'dessert')
            .map(ma => ({
              id: ma.articles.id,
              name: ma.articles.name,
              price: ma.articles.price,
              description: ma.articles.description,
              imageUrl: ma.articles.image_url,
            })),
        };
      });

      setMenus(processedMenus);
    } catch (error) {
      console.error('Error fetching menus:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les menus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  return { menus, isLoading, refreshMenus: fetchMenus };
};
