
import { weeklyPackagePrice } from "../config/paymentConfig";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface MealOption {
  id: string;
  mainDish: MenuItem;
  sideDish: MenuItem;
  dessert: MenuItem;
  totalPrice: number;
}

export interface DayMenu {
  id: string;
  day: string;
  date: string;
  mealOptions: MealOption[];
}

// Données minimales de secours en cas d'échec du chargement depuis Supabase
export const weeklyMenu: DayMenu[] = [
  {
    id: "monday",
    day: "Lundi",
    date: "",
    mealOptions: [
      {
        id: "mon-option1",
        mainDish: {
          id: "mon-main1",
          name: "Plat du jour",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "mon-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "mon-dessert1",
          name: "Dessert",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        totalPrice: 0
      }
    ]
  },
  {
    id: "saturday",
    day: "Samedi",
    date: "",
    mealOptions: [
      {
        id: "sat-option1",
        mainDish: {
          id: "sat-main1",
          name: "Plat du samedi",
          description: "Le menu du samedi n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sat-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sat-dessert1",
          name: "Dessert",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        totalPrice: 0
      }
    ]
  },
  {
    id: "sunday",
    day: "Dimanche",
    date: "",
    mealOptions: [
      {
        id: "sun-option1",
        mainDish: {
          id: "sun-main1",
          name: "Plat du dimanche",
          description: "Le menu du dimanche n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sun-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sun-dessert1",
          name: "Dessert",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        totalPrice: 0
      }
    ]
  }
];

export { weeklyPackagePrice };
