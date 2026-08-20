# Essai en préproduction avant la mise en production

Une instance complète, sur la même machine que la production future, avec sa
propre base et son propre domaine. Rien de ce qui suit ne touche
`portail.sukaxess.com`, `speedtest.sukaxess.com` ni Odoo — mais ces services
partagent l'Apache, alors les précautions comptent.

## Ce que la préproduction ne partage pas avec la production

| | Préproduction | Production |
|---|---|---|
| Domaine | `menu-test.sukaxess.com` | `menu.sukaxess.com` |
| Projet Docker | `menu-staging` | `menu` |
| Base de données | volume `menu-staging_db-data` | volume `menu_db-data` |
| Port de l'API | 3001 | 3000 |
| Racine web | `/var/www/menu-staging` | `/var/www/menu` |
| Fichier d'environnement | `infra/.env.staging` | `infra/.env` |
| Paiement | `manual` | `cinetpay` |

Docker isole containers, réseau et volume par projet : la préproduction ne peut
pas atteindre les données de production, et inversement.

## Avant de commencer

```sh
# 1. Sauvegarder la configuration Apache existante — c'est le seul point de
#    contact avec vos sites en service.
sudo tar czf ~/apache-avant-menu-$(date +%F).tar.gz /etc/apache2/sites-available /etc/apache2/sites-enabled

# 2. Vérifier que les ports visés sont libres
ss -lntp | grep -E ':(3000|3001)\s' || echo "3000 et 3001 libres"

# 3. Vérifier la place disque et la mémoire
df -h / && free -h

# 4. Noter l'état actuel, pour pouvoir comparer après
systemctl is-active apache2 && curl -sSI https://portail.sukaxess.com | head -1
```

## 1. DNS

Ajouter un enregistrement A `menu-test.sukaxess.com` vers `161.97.183.94`, avec
le proxy Cloudflare sur **DNS uniquement**.

> Le proxy orange met en tampon les réponses longues. L'écran de cuisine tient
> un flux ouvert en permanence : derrière le proxy, il cesse de recevoir les
> commandes sans afficher d'erreur. C'est vrai pour la production aussi.

## 2. Le dépôt

```sh
sudo git clone <URL_DU_DEPOT> /opt/menu-paiement-facile
cd /opt/menu-paiement-facile
sudo git checkout claude/project-analysis-improvements-xmtouj
```

## 3. Configuration de la préproduction

```sh
sudo cp .env.example infra/.env.staging
sudo nano infra/.env.staging
```

```sh
COMPOSE_PROJECT_NAME=menu-staging
POSTGRES_DB=menu
POSTGRES_USER=menu
POSTGRES_PASSWORD=<mot de passe distinct de la production>
JWT_SECRET=<openssl rand -base64 48 — distinct de la production>
PUBLIC_ORIGIN=https://menu-test.sukaxess.com
API_PORT=3001
WEB_ROOT=/var/www/menu-staging
NODE_ENV=production
LOG_LEVEL=debug

# Aucun paiement réel pendant l'essai.
PAYMENT_PROVIDER=manual
```

> `PAYMENT_PROVIDER=manual` est délibéré : la préproduction ne doit déclencher
> aucun mouvement d'argent. CinetPay se branche à l'étape 8, une fois le reste
> validé.

```sh
sudo chmod 600 infra/.env.staging
```

## 4. Démarrer l'API

```sh
sudo make api-up ENV=staging
sudo make ps ENV=staging
curl -s http://127.0.0.1:3001/api/health
```

Les migrations s'appliquent au démarrage du conteneur.

## 5. Publier le front

```sh
sudo make build-web ENV=staging
```

## 6. Vhost Apache

```sh
sudo a2enmod proxy proxy_http headers rewrite expires
sudo htpasswd -c /etc/apache2/.htpasswd-menu preprod   # protège l'essai

sudo cp infra/apache/menu-staging.conf /etc/apache2/sites-available/
sudo a2ensite menu-staging

# Le contrôle qui compte : si la syntaxe est mauvaise, un reload couperait
# TOUS vos sites. configtest le dit avant.
sudo apachectl configtest

sudo systemctl reload apache2

# Vérifier immédiatement que rien d'autre n'a bougé.
curl -sSI https://portail.sukaxess.com | head -1
curl -sSI https://speedtest.sukaxess.com | head -1
```

```sh
sudo certbot --apache -d menu-test.sukaxess.com
```

## 7. La vérification

```sh
./infra/smoke-test.sh https://preprod:<mot-de-passe>@menu-test.sukaxess.com
```

Le script ne se contente pas de vérifier que le site répond. Il rejoue les
failles que la réécriture ferme : création d'un compte avec `role`, `roles` et
`isAdmin` dans le corps, commande avec un montant falsifié, visite de
`?payment_status=success`, tentative de confirmation d'un paiement par le
client, identifiant malformé, webhook non signé.

Il crée un compte jetable et passe une commande, mais ne confirme aucun
paiement : rien ne part en cuisine, aucun argent ne bouge.

Attendu : **24 réussis, 0 échec**. Un seul échec doit arrêter la mise en
production.

## 8. Essai manuel

Le script ne voit pas l'interface. À parcourir à la main :

- [ ] Le menu de la semaine s'affiche, les photos et prix sont corrects
- [ ] Créer un compte client, passer une commande, télécharger le reçu PDF
- [ ] `make seed-admin ENV=staging`, se connecter au back-office
- [ ] Confirmer le paiement dans « Paiements à confirmer »
- [ ] Ouvrir `/cuisine` **dans un second navigateur** : la commande y apparaît
      sans rafraîchir, et l'indicateur affiche « En direct »
- [ ] Faire avancer la commande jusqu'à « livrée »
- [ ] Le journal d'audit montre qui a confirmé le paiement
- [ ] Se connecter avec un compte sans rôle : `/interface-admin` refuse l'accès

Le point du second navigateur est le plus important : c'est le seul qui teste
réellement le flux temps réel à travers Apache.

## 9. Essai de CinetPay

Une fois le reste validé, et **seulement alors** :

```sh
sudo nano infra/.env.staging   # PAYMENT_PROVIDER=cinetpay + les trois clés
sudo make api-up ENV=staging
```

Déclarer dans CinetPay l'URL de notification de la préproduction :
`https://menu-test.sukaxess.com/api/payments/webhook/cinetpay`

> L'authentification basique du vhost bloquerait les notifications de CinetPay.
> Pour cet essai, commenter le bloc `<Location /api>` du vhost de
> préproduction, recharger Apache, et le remettre après.

Passer une commande d'un petit montant réel et payer. Attendu : la commande
passe seule à « payée » et apparaît en cuisine, sans intervention. Vérifier
dans `make api-logs ENV=staging` qu'aucun écart de montant n'est signalé.

## 10. Mise en production

Une fois tout validé, refaire les étapes 1 à 6 avec `infra/.env`,
`menu.sukaxess.com` et le port 3000, puis importer le vrai catalogue
([migration-catalogue.md](migration-catalogue.md)), programmer les sauvegardes,
et relancer `smoke-test.sh` sur le domaine de production.

La préproduction peut rester en place : elle sert à essayer chaque mise à jour
avant qu'elle n'atteigne les clients.

## Quand quelque chose ne va pas

```sh
./infra/diagnose.sh              # production
./infra/diagnose.sh staging      # préproduction
```

Rassemble en une fois l'état des conteneurs, la santé de l'API, le contenu de
la base, les migrations appliquées, la configuration Apache, la racine web, les
logs et les ressources. Les mots de passe, le secret JWT et les clés de paiement
sont remplacés par « défini » ou « absent » — mais relisez la sortie avant de la
partager.

## Revenir en arrière

Rien de ce qui précède ne modifie vos services existants. Pour tout défaire :

```sh
sudo make api-down ENV=staging
sudo a2dissite menu-staging && sudo systemctl reload apache2
sudo rm -rf /var/www/menu-staging
docker volume rm menu-staging_db-data
```
