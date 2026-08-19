# Déploiement sur le VPS

Serveur cible : Contabo, Ubuntu 24.04, 7,8 Go de RAM. Apache y occupe déjà les
ports 80 et 443 pour `portail.sukaxess.com`, `speedtest.sukaxess.com` et Odoo.

## Architecture retenue

Apache reste le seul serveur en façade, comme pour Odoo. Il sert le front
construit depuis le disque et proxifie `/api` vers le conteneur.

```
Internet ──▶ Apache (80/443, TLS)
               ├── /            →  /var/www/menu          (fichiers statiques)
               └── /api         →  127.0.0.1:3000         (conteneur menu-api)
                                        │
                                        └── réseau Docker interne
                                                 └── menu-db (PostgreSQL 16)
```

Deux conteneurs seulement : l'API et sa base.

- **Aucun serveur web supplémentaire.** Ni Caddy ni nginx : Apache fait déjà le
  travail, en ajouter un obligerait à déplacer 80/443 ou à empiler deux proxys.
- **PostgreSQL sans port publié.** L'hôte fait déjà tourner un PostgreSQL pour
  Odoo sur 5432 ; celui-ci reste sur le réseau Docker, joignable seulement par
  l'API. Pas de conflit possible, et la base n'est pas exposée.
- **L'API n'écoute que sur la boucle locale** (`127.0.0.1:3000`). Apache y
  accède, Internet non.
- **Un seul domaine** pour le front et l'API : le cookie de session reste
  same-site et aucune configuration CORS n'est nécessaire.

Empreinte mémoire attendue : environ 300 Mo pour l'API et 150 Mo pour
PostgreSQL au repos. Les 7,8 Go du serveur laissent une marge confortable
au-dessus d'Odoo.

## Mise en place, une fois

### 1. DNS

Créer un enregistrement A `menu.sukaxess.com` vers l'IP du serveur. Ajuster le
`ServerName` dans `infra/apache/menu.conf` si vous préférez un autre
sous-domaine.

### 2. Récupérer le dépôt

```sh
sudo git clone <URL_DU_DEPOT> /opt/menu-paiement-facile
cd /opt/menu-paiement-facile
```

### 3. Configuration

```sh
cp .env.example infra/.env
openssl rand -base64 48        # à coller dans JWT_SECRET
nano infra/.env
```

À renseigner : `POSTGRES_PASSWORD`, `JWT_SECRET`, et
`PUBLIC_ORIGIN=https://menu.sukaxess.com`.

Vérifier au passage que le port 3000 est libre :

```sh
ss -lntp | grep :3000
```

S'il est pris, définir `API_PORT` sur autre chose dans `infra/.env` **et**
ajuster les trois `ProxyPass` du vhost.

### 4. Démarrer l'API

```sh
make api-up          # construit l'image, applique les migrations, démarre
make ps
curl -s http://127.0.0.1:3000/api/health
```

Les migrations tournent au démarrage du conteneur : le code ne peut pas prendre
de l'avance sur le schéma.

### 5. Publier le front

```sh
make build-web       # construit et copie vers /var/www/menu
```

### 6. Vhost Apache

```sh
sudo a2enmod proxy proxy_http headers rewrite expires
sudo cp infra/apache/menu.conf /etc/apache2/sites-available/menu.conf
sudo a2ensite menu
sudo apachectl configtest
sudo systemctl reload apache2
sudo certbot --apache -d menu.sukaxess.com
```

Certbot réécrit le vhost HTTP pour rediriger vers HTTPS et renseigne les
chemins de certificat.

### 7. Premier administrateur

```sh
make seed-admin
```

C'est le seul moyen de créer un compte administrateur : aucune route de l'API
n'attribue de rôle à qui n'en a pas déjà.

### 8. Catalogue

Suivre [migration-catalogue.md](migration-catalogue.md), puis :

```sh
docker compose -f infra/docker-compose.yml cp catalog.json api:/tmp/catalog.json
docker compose -f infra/docker-compose.yml exec api \
  node apps/api/dist/scripts/import-catalog.js /tmp/catalog.json --dry-run
```

### 9. Sauvegardes

```sh
sudo crontab -e
# 0 3 * * * /opt/menu-paiement-facile/infra/backup.sh >> /var/log/menu-backup.log 2>&1
```

Puis **tester la restauration** sur une base jetable. Une sauvegarde qui n'a
jamais été restaurée n'est pas une sauvegarde.

## Mises à jour

```sh
cd /opt/menu-paiement-facile
git pull
make deploy          # front reconstruit et publié, API reconstruite et relancée
```

## Points de vigilance

**Le flux temps réel de la cuisine.** Il tient une connexion HTTP ouverte. Le
vhost le déclare avant la règle `/api` générale (Apache applique les `ProxyPass`
dans l'ordre écrit), avec `flushpackets=on` pour désactiver la mise en tampon et
`timeout=3600` pour qu'il ne soit pas coupé comme inactif. Sans cela, les écrans
de cuisine cessent silencieusement de recevoir les commandes.

**Paiement.** `PAYMENT_PROVIDER=manual` par défaut : les commandes restent en
attente jusqu'à confirmation dans le back-office. `wave_link` ajoute la
redirection vers le lien marchand mais ne conclut rien du retour — aucun des
deux ne peut vérifier un paiement automatiquement. Voir `apps/api/src/payments/`.

**Odoo.** Ses ports natifs 8069 et 8072 écoutent directement. Ils n'ont rien à
voir avec ce projet, mais s'ils ne sont pas utilisés en direct, ils gagneraient
à être filtrés par UFW.
