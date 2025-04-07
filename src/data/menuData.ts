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

// Création des données de menus avec 3 options de plats par jour
export const weeklyMenu: DayMenu[] = [
  {
    id: "monday",
    day: "Lundi",
    date: "8 avril",
    mealOptions: [
      {
        id: "mon-option1",
        mainDish: {
          id: "mon-main1",
          name: "Poulet rôti aux herbes de Provence",
          description: "Poulet fermier rôti avec un mélange d'herbes de Provence, servi avec une sauce au thym.",
          price: 12.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "mon-side1",
          name: "Gratin dauphinois",
          description: "Pommes de terre tranchées cuites au four avec de la crème, de l'ail et du fromage.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "mon-dessert1",
          name: "Tarte aux pommes",
          description: "Tarte traditionnelle aux pommes avec une touche de cannelle et de sucre vanillé.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        totalPrice: 21.97
      },
      {
        id: "mon-option2",
        mainDish: {
          id: "mon-main2",
          name: "Bœuf Bourguignon",
          description: "Ragoût de bœuf mijoté dans une sauce au vin rouge avec carottes, champignons et lardons.",
          price: 14.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "mon-side2",
          name: "Purée de pommes de terre",
          description: "Purée de pommes de terre crémeuse au beurre et à la crème fraîche.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "mon-dessert2",
          name: "Crème brûlée",
          description: "Crème à la vanille avec une fine couche de caramel croustillant.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        totalPrice: 23.97
      },
      {
        id: "mon-option3",
        mainDish: {
          id: "mon-main3",
          name: "Gratin de légumes à la provençale",
          description: "Assortiment de légumes frais cuisinés à la provençale et gratinés au four.",
          price: 11.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "mon-side3",
          name: "Riz basmati aux herbes",
          description: "Riz basmati parfumé aux herbes fraîches et au citron.",
          price: 2.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "mon-dessert3",
          name: "Salade de fruits frais",
          description: "Assortiment de fruits frais de saison avec un sirop léger à la menthe.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        totalPrice: 18.97
      }
    ]
  },
  {
    id: "tuesday",
    day: "Mardi",
    date: "9 avril",
    mealOptions: [
      {
        id: "tue-option1",
        mainDish: {
          id: "tue-main1",
          name: "Filet de saumon à l'aneth",
          description: "Filet de saumon frais cuit à la poêle avec une sauce à l'aneth et au citron.",
          price: 14.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "tue-side1",
          name: "Riz pilaf aux légumes",
          description: "Riz basmati cuit avec des petits légumes et des épices délicates.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "tue-dessert1",
          name: "Mousse au chocolat",
          description: "Mousse légère au chocolat noir, garnie de copeaux de chocolat.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 23.48
      },
      {
        id: "tue-option2",
        mainDish: {
          id: "tue-main2",
          name: "Suprême de volaille aux champignons",
          description: "Suprême de volaille cuit à basse température avec une sauce crémeuse aux champignons.",
          price: 13.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "tue-side2",
          name: "Écrasé de pommes de terre à l'huile d'olive",
          description: "Pommes de terre écrasées à la fourchette avec de l'huile d'olive et des herbes fraîches.",
          price: 3.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "tue-dessert2",
          name: "Tiramisu",
          description: "Tiramisu traditionnel au mascarpone, café et cacao.",
          price: 5.50,
          image: "/placeholder.svg"
        },
        totalPrice: 22.99
      },
      {
        id: "tue-option3",
        mainDish: {
          id: "tue-main3",
          name: "Risotto aux asperges",
          description: "Risotto crémeux préparé avec des asperges vertes, parmesan et bouillon maison.",
          price: 12.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "tue-side3",
          name: "Salade verte aux noix",
          description: "Salade de jeunes pousses avec vinaigrette balsamique et noix caramélisées.",
          price: 3.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "tue-dessert3",
          name: "Panna cotta aux fruits rouges",
          description: "Crème italienne onctueuse servie avec un coulis de fruits rouges.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 20.99
      }
    ]
  },
  {
    id: "wednesday",
    day: "Mercredi",
    date: "10 avril",
    mealOptions: [
      {
        id: "wed-option1",
        mainDish: {
          id: "wed-main1",
          name: "Bœuf bourguignon",
          description: "Ragoût de bœuf mijoté dans une sauce au vin rouge avec des carottes et des champignons.",
          price: 13.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "wed-side1",
          name: "Purée de pommes de terre",
          description: "Purée de pommes de terre crémeuse avec un soupçon de muscade.",
          price: 3.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "wed-dessert1",
          name: "Crème brûlée",
          description: "Crème onctueuse à la vanille avec une fine couche de caramel croustillant.",
          price: 5.50,
          image: "/placeholder.svg"
        },
        totalPrice: 22.99
      },
      {
        id: "wed-option2",
        mainDish: {
          id: "wed-main2",
          name: "Filet de dorade à la méditerranéenne",
          description: "Filet de dorade cuit au four avec tomates, olives et basilic.",
          price: 15.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "wed-side2",
          name: "Ratatouille provençale",
          description: "Légumes du soleil mijotés lentement avec herbes de Provence.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "wed-dessert2",
          name: "Tarte au citron meringuée",
          description: "Tarte au citron acidulée recouverte d'une meringue italienne dorée.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        totalPrice: 25.48
      },
      {
        id: "wed-option3",
        mainDish: {
          id: "wed-main3",
          name: "Lasagnes végétariennes",
          description: "Lasagnes aux légumes grillés, épinards et béchamel au fromage.",
          price: 11.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "wed-side3",
          name: "Salade mixte",
          description: "Mélange de salades fraîches avec vinaigrette maison.",
          price: 2.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "wed-dessert3",
          name: "Mousse à la mangue",
          description: "Mousse légère à la mangue avec éclats de pistaches.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 19.48
      }
    ]
  },
  {
    id: "thursday",
    day: "Jeudi",
    date: "11 avril",
    mealOptions: [
      {
        id: "thu-option1",
        mainDish: {
          id: "thu-main1",
          name: "Risotto aux champignons",
          description: "Risotto crémeux préparé avec des champignons sauvages et du parmesan.",
          price: 11.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "thu-side1",
          name: "Salade verte",
          description: "Mélange de salades fraîches avec vinaigrette balsamique maison.",
          price: 2.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "thu-dessert1",
          name: "Tiramisu",
          description: "Dessert italien classique au mascarpone, café et cacao.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        totalPrice: 19.97
      },
      {
        id: "thu-option2",
        mainDish: {
          id: "thu-main2",
          name: "Côte de porc à la moutarde",
          description: "Côte de porc grillée avec sauce à la moutarde à l'ancienne.",
          price: 13.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "thu-side2",
          name: "Pommes de terre rôties au romarin",
          description: "Pommes de terre nouvelles rôties au four avec romarin et ail.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "thu-dessert2",
          name: "Profiteroles au chocolat",
          description: "Choux garnis de glace vanille et nappés de sauce chocolat.",
          price: 5.99,
          image: "/placeholder.svg"
        },
        totalPrice: 23.97
      },
      {
        id: "thu-option3",
        mainDish: {
          id: "thu-main3",
          name: "Quiche méditerranéenne",
          description: "Quiche aux légumes grillés, feta et olives noires.",
          price: 10.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "thu-side3",
          name: "Salade de quinoa aux agrumes",
          description: "Quinoa avec segments d'agrumes, menthe et amandes effilées.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "thu-dessert3",
          name: "Salade de fruits frais",
          description: "Assortiment de fruits frais de saison avec un sirop léger.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        totalPrice: 18.97
      }
    ]
  },
  {
    id: "friday",
    day: "Vendredi",
    date: "12 avril",
    mealOptions: [
      {
        id: "fri-option1",
        mainDish: {
          id: "fri-main1",
          name: "Filet de cabillaud en croûte d'herbes",
          description: "Filet de cabillaud frais recouvert d'une croûte d'herbes aromatiques et de pain.",
          price: 13.50,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "fri-side1",
          name: "Ratatouille provençale",
          description: "Mélange de légumes du sud cuits lentement avec des herbes de Provence.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "fri-dessert1",
          name: "Tarte au citron meringuée",
          description: "Tarte acidulée au citron recouverte d'une meringue légère et dorée.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        totalPrice: 22.99
      },
      {
        id: "fri-option2",
        mainDish: {
          id: "fri-main2",
          name: "Tajine d'agneau aux abricots",
          description: "Tajine d'agneau mijoté lentement avec abricots secs, miel et épices.",
          price: 15.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "fri-side2",
          name: "Couscous aux légumes",
          description: "Semoule fine cuite à la vapeur avec légumes et bouillon parfumé.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "fri-dessert2",
          name: "Baklava",
          description: "Pâtisserie feuilletée aux noix et miel, parfumée à la fleur d'oranger.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 24.48
      },
      {
        id: "fri-option3",
        mainDish: {
          id: "fri-main3",
          name: "Penne aux légumes grillés et ricotta",
          description: "Pâtes penne avec légumes grillés, ricotta et basilic frais.",
          price: 10.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "fri-side3",
          name: "Focaccia à l'huile d'olive et romarin",
          description: "Pain plat italien à l'huile d'olive, romarin et fleur de sel.",
          price: 2.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "fri-dessert3",
          name: "Panna cotta aux fruits rouges",
          description: "Crème italienne onctueuse nappée d'un coulis de fruits rouges.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 18.48
      }
    ]
  },
  {
    id: "saturday",
    day: "Samedi",
    date: "13 avril",
    mealOptions: [
      {
        id: "sat-option1",
        mainDish: {
          id: "sat-main1",
          name: "Magret de canard au miel",
          description: "Magret de canard poêlé avec une sauce au miel et aux épices douces.",
          price: 16.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sat-side1",
          name: "Pommes de terre sarladaises",
          description: "Pommes de terre dorées à la graisse de canard, à l'ail et au persil.",
          price: 4.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sat-dessert1",
          name: "Fondant au chocolat",
          description: "Gâteau au chocolat avec un cœur coulant, servi tiède.",
          price: 5.99,
          image: "/placeholder.svg"
        },
        totalPrice: 27.97
      },
      {
        id: "sat-option2",
        mainDish: {
          id: "sat-main2",
          name: "Pavé de saumon en croûte de sésame",
          description: "Pavé de saumon en croûte de sésame avec sauce teriyaki.",
          price: 15.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sat-side2",
          name: "Wok de légumes croquants",
          description: "Légumes croquants sautés au wok avec sauce soja et gingembre.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sat-dessert2",
          name: "Cheesecake aux fruits de la passion",
          description: "Cheesecake crémeux au coulis de fruits de la passion.",
          price: 5.50,
          image: "/placeholder.svg"
        },
        totalPrice: 25.99
      },
      {
        id: "sat-option3",
        mainDish: {
          id: "sat-main3",
          name: "Risotto aux asperges et parmesan",
          description: "Risotto crémeux aux asperges fraîches et copeaux de parmesan.",
          price: 12.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sat-side3",
          name: "Salade de roquette et parmesan",
          description: "Salade de roquette avec copeaux de parmesan et vinaigrette balsamique.",
          price: 3.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sat-dessert3",
          name: "Panna cotta à la vanille",
          description: "Crème onctueuse à la vanille nappée de caramel.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        totalPrice: 21.48
      }
    ]
  },
  {
    id: "sunday",
    day: "Dimanche",
    date: "14 avril",
    mealOptions: [
      {
        id: "sun-option1",
        mainDish: {
          id: "sun-main1",
          name: "Rôti de veau aux champignons",
          description: "Rôti de veau tendre cuit lentement avec une sauce crémeuse aux champignons.",
          price: 15.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sun-side1",
          name: "Gratin de courgettes",
          description: "Courgettes en tranches gratinées avec de la béchamel et du fromage râpé.",
          price: 4.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sun-dessert1",
          name: "Paris-Brest",
          description: "Pâtisserie en forme de roue garnie de crème pralinée et d'amandes effilées.",
          price: 6.50,
          image: "/placeholder.svg"
        },
        totalPrice: 26.99
      },
      {
        id: "sun-option2",
        mainDish: {
          id: "sun-main2",
          name: "Suprême de pintade aux girolles",
          description: "Suprême de pintade rôti avec sauce crémeuse aux girolles fraîches.",
          price: 16.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sun-side2",
          name: "Écrasé de pommes de terre à la truffe",
          description: "Pommes de terre écrasées avec huile de truffe et parmesan.",
          price: 5.99,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sun-dessert2",
          name: "Royal au chocolat",
          description: "Entremet au chocolat avec croustillant praliné et mousse au chocolat.",
          price: 5.99,
          image: "/placeholder.svg"
        },
        totalPrice: 28.97
      },
      {
        id: "sun-option3",
        mainDish: {
          id: "sun-main3",
          name: "Tarte fine aux légumes confits",
          description: "Tarte fine avec légumes confits, chèvre frais et herbes aromatiques.",
          price: 12.99,
          image: "/placeholder.svg"
        },
        sideDish: {
          id: "sun-side3",
          name: "Salade de jeunes pousses",
          description: "Jeunes pousses assaisonnées à l'huile de noix et vinaigre balsamique.",
          price: 3.50,
          image: "/placeholder.svg"
        },
        dessert: {
          id: "sun-dessert3",
          name: "Assortiment de mignardises",
          description: "Sélection de petites pâtisseries variées faites maison.",
          price: 6.50,
          image: "/placeholder.svg"
        },
        totalPrice: 22.99
      }
    ]
  }
];

export { weeklyPackagePrice };
