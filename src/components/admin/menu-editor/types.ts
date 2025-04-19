
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  articleId?: string;
  type?: 'main_dish' | 'side_dish' | 'dessert';
}

export interface MenuDay {
  id: string;
  day: string;
  date?: string;
  mainDishes: MenuItem[];
  sideDishes: MenuItem[];
  desserts: MenuItem[];
}

export interface WeeklyMenu {
  id: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuArticle {
  id: string;
  menu_day: string;
  article_id: string;
  created_at: string;
}
