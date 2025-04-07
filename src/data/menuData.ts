
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface DayMenu {
  id: string;
  day: string;
  date: string;
  mainDish: MenuItem;
  sideDish: MenuItem;
  dessert: MenuItem;
  totalPrice: number;
}

export const weeklyMenu: DayMenu[] = [
  {
    id: "monday",
    day: "Lundi",
    date: "8 avril",
    mainDish: {
      id: "mon-main",
      name: "Poulet rôti aux herbes de Provence",
      description: "Poulet fermier rôti avec un mélange d'herbes de Provence, servi avec une sauce au thym.",
      price: 12.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "mon-side",
      name: "Gratin dauphinois",
      description: "Pommes de terre tranchées cuites au four avec de la crème, de l'ail et du fromage.",
      price: 4.99,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "mon-dessert",
      name: "Tarte aux pommes",
      description: "Tarte traditionnelle aux pommes avec une touche de cannelle et de sucre vanillé.",
      price: 3.99,
      image: "/placeholder.svg"
    },
    totalPrice: 19.99
  },
  {
    id: "tuesday",
    day: "Mardi",
    date: "9 avril",
    mainDish: {
      id: "tue-main",
      name: "Filet de saumon à l'aneth",
      description: "Filet de saumon frais cuit à la poêle avec une sauce à l'aneth et au citron.",
      price: 14.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "tue-side",
      name: "Riz pilaf aux légumes",
      description: "Riz basmati cuit avec des petits légumes et des épices délicates.",
      price: 3.99,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "tue-dessert",
      name: "Mousse au chocolat",
      description: "Mousse légère au chocolat noir, garnie de copeaux de chocolat.",
      price: 4.50,
      image: "/placeholder.svg"
    },
    totalPrice: 21.99
  },
  {
    id: "wednesday",
    day: "Mercredi",
    date: "10 avril",
    mainDish: {
      id: "wed-main",
      name: "Bœuf bourguignon",
      description: "Ragoût de bœuf mijoté dans une sauce au vin rouge avec des carottes et des champignons.",
      price: 13.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "wed-side",
      name: "Purée de pommes de terre",
      description: "Purée de pommes de terre crémeuse avec un soupçon de muscade.",
      price: 3.50,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "wed-dessert",
      name: "Crème brûlée",
      description: "Crème onctueuse à la vanille avec une fine couche de caramel croustillant.",
      price: 5.50,
      image: "/placeholder.svg"
    },
    totalPrice: 20.99
  },
  {
    id: "thursday",
    day: "Jeudi",
    date: "11 avril",
    mainDish: {
      id: "thu-main",
      name: "Risotto aux champignons",
      description: "Risotto crémeux préparé avec des champignons sauvages et du parmesan.",
      price: 11.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "thu-side",
      name: "Salade verte",
      description: "Mélange de salades fraîches avec vinaigrette balsamique maison.",
      price: 2.99,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "thu-dessert",
      name: "Tiramisu",
      description: "Dessert italien classique au mascarpone, café et cacao.",
      price: 4.99,
      image: "/placeholder.svg"
    },
    totalPrice: 18.99
  },
  {
    id: "friday",
    day: "Vendredi",
    date: "12 avril",
    mainDish: {
      id: "fri-main",
      name: "Filet de cabillaud en croûte d'herbes",
      description: "Filet de cabillaud frais recouvert d'une croûte d'herbes aromatiques et de pain.",
      price: 13.50,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "fri-side",
      name: "Ratatouille provençale",
      description: "Mélange de légumes du sud cuits lentement avec des herbes de Provence.",
      price: 4.50,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "fri-dessert",
      name: "Tarte au citron meringuée",
      description: "Tarte acidulée au citron recouverte d'une meringue légère et dorée.",
      price: 4.99,
      image: "/placeholder.svg"
    },
    totalPrice: 21.50
  },
  {
    id: "saturday",
    day: "Samedi",
    date: "13 avril",
    mainDish: {
      id: "sat-main",
      name: "Magret de canard au miel",
      description: "Magret de canard poêlé avec une sauce au miel et aux épices douces.",
      price: 16.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "sat-side",
      name: "Pommes de terre sarladaises",
      description: "Pommes de terre dorées à la graisse de canard, à l'ail et au persil.",
      price: 4.99,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "sat-dessert",
      name: "Fondant au chocolat",
      description: "Gâteau au chocolat avec un cœur coulant, servi tiède.",
      price: 5.99,
      image: "/placeholder.svg"
    },
    totalPrice: 24.99
  },
  {
    id: "sunday",
    day: "Dimanche",
    date: "14 avril",
    mainDish: {
      id: "sun-main",
      name: "Rôti de veau aux champignons",
      description: "Rôti de veau tendre cuit lentement avec une sauce crémeuse aux champignons.",
      price: 15.99,
      image: "/placeholder.svg"
    },
    sideDish: {
      id: "sun-side",
      name: "Gratin de courgettes",
      description: "Courgettes en tranches gratinées avec de la béchamel et du fromage râpé.",
      price: 4.50,
      image: "/placeholder.svg"
    },
    dessert: {
      id: "sun-dessert",
      name: "Paris-Brest",
      description: "Pâtisserie en forme de roue garnie de crème pralinée et d'amandes effilées.",
      price: 6.50,
      image: "/placeholder.svg"
    },
    totalPrice: 24.99
  }
];

export const weeklyPackagePrice = 129.99;
