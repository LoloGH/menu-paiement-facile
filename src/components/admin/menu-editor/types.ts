
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  articleId?: string; // Add articleId to store reference to article
}

export interface MenuDay {
  id: string;
  day: string;
  date?: string;
  mainDishes: MenuItem[];
  sideDishes: MenuItem[];
  desserts: MenuItem[];
}
