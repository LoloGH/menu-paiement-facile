
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ArticleType = Database['public']['Enums']['article_type'];

interface Article {
  name: string;
  description: string | null;
  price: number;
  type: ArticleType;
}

const platsArticles: Article[] = [
  {
    name: 'Thiebou Dieune',
    description: 'Riz au poisson et légumes',
    price: 2500,
    type: 'main_dish'
  },
  {
    name: 'Yassa Poulet',
    description: 'Poulet mariné aux oignons',
    price: 2000,
    type: 'main_dish'
  },
  {
    name: 'Mafé Viande',
    description: 'Viande sauce arachide',
    price: 2000,
    type: 'main_dish'
  },
  {
    name: 'Domoda Bœuf',
    description: 'Ragoût sauce tomate épaisse',
    price: 2200,
    type: 'main_dish'
  },
  {
    name: 'Caldou Poisson',
    description: 'Poisson sauce citron',
    price: 2500,
    type: 'main_dish'
  },
  {
    name: 'Thiebou Yapp',
    description: 'Riz gras à la viande',
    price: 2000,
    type: 'main_dish'
  },
  {
    name: 'Soupou Kandja',
    description: 'Sauce gombo parfumée',
    price: 2200,
    type: 'main_dish'
  },
  {
    name: 'Mbaxal Guinar',
    description: 'Poulet en sauce rouge',
    price: 2300,
    type: 'main_dish'
  },
  {
    name: 'Lakh Salé',
    description: 'Bouillie de mil salée',
    price: 1500,
    type: 'main_dish'
  },
  {
    name: 'Couscous Sauce Feuille',
    description: "Couscous et feuilles d'oseille",
    price: 1800,
    type: 'main_dish'
  }
];

const accompagnementsArticles: Article[] = [
  {
    name: 'Riz blanc',
    description: 'Riz nature légèrement parfumé',
    price: 500,
    type: 'side_dish'
  },
  {
    name: 'Riz rouge',
    description: 'Riz sauté à la sauce tomate',
    price: 600,
    type: 'side_dish'
  },
  {
    name: 'Couscous de mil',
    description: 'Semoule de mil légère',
    price: 500,
    type: 'side_dish'
  },
  {
    name: 'Légumes vapeur',
    description: 'Légumes tendres et vapeur',
    price: 600,
    type: 'side_dish'
  },
  {
    name: 'Sauce oignons',
    description: 'Oignons caramélisés',
    price: 400,
    type: 'side_dish'
  },
  {
    name: 'Lait caillé',
    description: 'Yaourt traditionnel frais',
    price: 500,
    type: 'side_dish'
  },
  {
    name: 'Pommes sautées',
    description: 'Pommes de terre épicées',
    price: 600,
    type: 'side_dish'
  },
  {
    name: 'Riz citronné',
    description: 'Riz parfumé au citron',
    price: 500,
    type: 'side_dish'
  },
  {
    name: 'Banane plantain',
    description: 'Bananes frites dorées',
    price: 700,
    type: 'side_dish'
  },
  {
    name: "Feuilles d'oseille",
    description: 'Sauce aux feuilles vertes',
    price: 500,
    type: 'side_dish'
  }
];

const dessertsArticles: Article[] = [
  {
    name: 'Thiakry (Deguê)',
    description: 'Couscous sucré au lait',
    price: 700,
    type: 'dessert'
  },
  {
    name: 'Flan caramel',
    description: 'Flan doux au caramel',
    price: 800,
    type: 'dessert'
  },
  {
    name: 'Bissap glacé',
    description: "Jus d'hibiscus rafraîchissant",
    price: 400,
    type: 'dessert'
  },
  {
    name: 'Jus de bouye',
    description: 'Boisson de fruit de baobab',
    price: 400,
    type: 'dessert'
  },
  {
    name: 'Salade de fruits',
    description: 'Fruits frais coupés',
    price: 800,
    type: 'dessert'
  },
  {
    name: 'Beignets sucrés',
    description: 'Petits beignets moelleux',
    price: 500,
    type: 'dessert'
  },
  {
    name: 'Sorbet maison',
    description: 'Glace artisanale fruitée',
    price: 1000,
    type: 'dessert'
  },
  {
    name: 'Gingembre',
    description: 'Boisson piquante et sucrée',
    price: 400,
    type: 'dessert'
  },
  {
    name: 'Crème de millet',
    description: 'Dessert à base de mil',
    price: 600,
    type: 'dessert'
  },
  {
    name: 'Banane flambée',
    description: 'Banane caramélisée au sucre',
    price: 700,
    type: 'dessert'
  }
];

export const insertMenuItems = async () => {
  try {
    // Insert plats principaux
    const { error: mainDishError } = await supabase
      .from('articles')
      .insert(platsArticles);
    
    if (mainDishError) throw mainDishError;
    
    // Insert accompagnements
    const { error: sideDishError } = await supabase
      .from('articles')
      .insert(accompagnementsArticles);
    
    if (sideDishError) throw sideDishError;
    
    // Insert desserts
    const { error: dessertError } = await supabase
      .from('articles')
      .insert(dessertsArticles);
    
    if (dessertError) throw dessertError;
    
    console.log('Tous les articles ont été insérés avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'insertion des articles:', error);
    return false;
  }
};
