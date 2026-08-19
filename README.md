# Menu Paiement Facile

Commande et paiement de menus de restaurant : menu hebdomadaire public, espace
client, back-office d'administration et écran de cuisine.

## Structure

```
apps/web/        Front-end React (Vite, TypeScript, Tailwind, shadcn/ui)
apps/api/        API Fastify + PostgreSQL (Drizzle)
packages/shared/ Enums, schémas et helpers partagés entre le front et l'API
infra/           Docker Compose, reverse proxy, sauvegardes
```

Le serveur est la seule autorité sur les prix, les rôles et les statuts de
paiement. Le navigateur ne parle jamais directement à la base de données.

## Prérequis

- Node.js >= 22
- Docker (pour PostgreSQL en développement)

## Démarrage

```sh
npm install
cp .env.example .env          # puis renseigner JWT_SECRET
docker compose -f infra/docker-compose.dev.yml up -d   # PostgreSQL
npm run build -w @menu/shared
npm run db:migrate -w @menu/api
npm run seed:admin -w @menu/api
```

Deux terminaux :

```sh
npm run dev:api    # http://localhost:3000
npm run dev:web    # http://localhost:8080  (proxifie /api vers l'API)
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run build` | Construit `shared`, puis `api`, puis `web` |
| `npm run typecheck` | `tsc --noEmit` sur les trois workspaces |
| `npm run lint` | ESLint sur tout le dépôt |
| `npm test` | Tests unitaires et d'intégration |

Les tests d'intégration de l'API tournent contre un vrai PostgreSQL, pas un
double : ce qu'ils vérifient — qu'un rôle ne peut pas s'auto-attribuer, qu'un
prix ne peut pas être falsifié — repose autant sur les contraintes SQL et les
prédicats de requête que sur le TypeScript. Créer la base une fois :

```sh
createdb menu_test
DATABASE_URL=postgres://menu:menu@localhost:5432/menu_test npm run db:migrate -w @menu/api
```

Le limiteur de débit est neutralisé sous `NODE_ENV=test` — chaque requête
injectée vient de la même adresse et brimerait la suite au lieu de l'attaquant.
`apps/api/test/rate-limit.test.ts` construit une application en configuration de
production et vérifie que la protection fonctionne.

`@menu/shared` doit être construit avant les autres : `api` et `web` consomment
son `dist/`.

## Migration depuis Supabase

Le catalogue (articles et menus) se reprend depuis l'ancien projet Supabase ;
comptes et commandes repartent de zéro. Procédure détaillée dans
[docs/migration-catalogue.md](docs/migration-catalogue.md).

## Déploiement

Le service tourne derrière l'Apache déjà présent sur le serveur, qui sert le
front depuis le disque et proxifie `/api` vers un conteneur. Procédure complète
dans [docs/deploiement.md](docs/deploiement.md).

```sh
make deploy      # reconstruit le front, le publie, relance l'API
make api-logs
make backup
```

## Rôles

| Rôle | Droits |
|---|---|
| `admin` | Accès complet, y compris la gestion des rôles |
| `order_manager` | Commandes et confirmation des paiements |
| `kitchen` | Écran de cuisine, avancement des préparations |
| `viewer` | Lecture seule |

Un compte ne peut pas s'attribuer de rôle. Le premier administrateur est créé
par `npm run seed:admin -w @menu/api` ; les suivants par un administrateur
existant depuis le back-office.

## Paiement

Le module de paiement est derrière une interface unique
(`apps/api/src/payments/`), choisie par la variable `PAYMENT_PROVIDER` :

- `manual` — la commande reste `pending` jusqu'à confirmation par un
  administrateur. Aucun appel externe.
- `wave_link` — redirige vers le lien marchand Wave. Le retour d'URL ne vaut
  pas preuve de paiement : la confirmation reste manuelle.

- `cinetpay` — agrégateur mobile money d'Afrique de l'Ouest. Le paiement se
  solde tout seul, à partir d'une vérification serveur à serveur et jamais du
  contenu du rappel. Voir [docs/paiement-cinetpay.md](docs/paiement-cinetpay.md).

Ajouter une autre passerelle consiste à écrire une implémentation de cette
interface, sans changement de schéma.
