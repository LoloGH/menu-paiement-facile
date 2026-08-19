# Migration du catalogue depuis Supabase

Seuls les **articles et les menus** sont repris. Les comptes, les commandes et
le journal d'audit repartent de zéro : les mots de passe de Supabase Auth ne
sont pas transposables, et l'historique de commandes de l'ancien schéma ne
distingue pas le prix payé du prix courant.

## 1. Exporter

Dans le projet Supabase, **SQL Editor → New query** :

```sql
select json_build_object(
  'exportedAt',    now(),
  'articles',      (select coalesce(json_agg(a), '[]'::json) from articles a),
  'weekly_menus',  (select coalesce(json_agg(w), '[]'::json) from weekly_menus w),
  'menu_articles', (select coalesce(json_agg(m), '[]'::json) from menu_articles m),
  'menu_items',    (select coalesce(json_agg(i), '[]'::json) from menu_items i)
) as catalog;
```

Copier la cellule renvoyée dans un fichier `catalog.json`.

L'éditeur SQL s'exécute avec les droits du propriétaire, donc la RLS ne
bloque rien. La clé anon fonctionne aussi via l'API REST, mais seulement sur
les tables que la RLS ouvre en lecture.

## 2. Vérifier avant d'écrire

```sh
npm run import:catalog -w @menu/api -- catalog.json --dry-run
```

Le script affiche ce qu'il compte importer et la liste des anomalies. Rien
n'est écrit. À relire attentivement : les avertissements décrivent des données
que l'ancienne application avait laissé passer faute de validation côté serveur.

## 3. Importer

```sh
npm run import:catalog -w @menu/api -- catalog.json
```

Tout se fait dans une seule transaction. Les identifiants d'origine sont
conservés, donc relancer la commande ne duplique rien.

## Correspondance des schémas

| Ancien | Nouveau | Remarque |
|---|---|---|
| `articles` | `articles` | Prix arrondi à l'entier ; un type inconnu devient `other` |
| `weekly_menus` | `menus` | `date` → `service_date`, `is_active` → `is_published` |
| `menu_articles.menu_day` | `menu_items` | `menu_day` contient le **nom du jour** (« Lundi »), résolu via `weekly_menus.day` |
| `menu_items` | `menu_items` | Seconde représentation des mêmes lignes ; fusionnée et dédoublonnée |

## Anomalies attendues

L'ancien schéma n'avait aucune contrainte côté serveur. Le script les signale
plutôt que d'échouer :

- **prix décimal** — le FCFA n'a pas de sous-unité, la valeur est arrondie ;
- **type d'article inconnu** — rangé dans `other`, à reclasser ensuite dans le
  back-office ;
- **plusieurs menus pour une même date** — `menus.service_date` est unique, le
  premier gagne et les autres sont signalés ;
- **date illisible** — le menu est ignoré ;
- **`menu_day` sans menu correspondant** — la ligne est ignorée ;
- **référence vers un article absent de l'export** — la ligne est ignorée.

Aucune de ces situations n'interrompt l'import : mieux vaut un catalogue
complet à corriger à la marge qu'un échec sur une ligne aberrante.

## Après l'import

```sh
npm run seed:admin -w @menu/api      # crée le premier administrateur
```

Puis, dans le back-office, vérifier les articles rangés dans `other` et publier
les menus voulus.
