
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
    id: "tuesday",
    day: "Mardi",
    date: "",
    mealOptions: [
      {
        id: "tue-option1",
        mainDish: {
          id: "tue-main1",
          name: "Plat du mardi",
          description: "Le menu du mardi n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "tue-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "tue-dessert1",
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
    id: "wednesday",
    day: "Mercredi",
    date: "",
    mealOptions: [
      {
        id: "wed-option1",
        mainDish: {
          id: "wed-main1",
          name: "Plat du mercredi",
          description: "Le menu du mercredi n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "wed-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "wed-dessert1",
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
    id: "thursday",
    day: "Jeudi",
    date: "",
    mealOptions: [
      {
        id: "thu-option1",
        mainDish: {
          id: "thu-main1",
          name: "Plat du jeudi",
          description: "Le menu du jeudi n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "thu-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "thu-dessert1",
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
    id: "friday",
    day: "Vendredi",
    date: "",
    mealOptions: [
      {
        id: "fri-option1",
        mainDish: {
          id: "fri-main1",
          name: "Plat du vendredi",
          description: "Le menu du vendredi n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "fri-side1",
          name: "Accompagnement",
          description: "Le menu n'a pas pu être chargé",
          price: 0,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "fri-dessert1",
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
