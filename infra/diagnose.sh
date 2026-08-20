#!/bin/bash
#
# Collects the state of a deployment, to paste into a support conversation.
#
#   ./infra/diagnose.sh                 # production
#   ./infra/diagnose.sh staging         # pre-production
#
# Secrets are redacted: passwords, JWT secret and payment keys are shown as
# "défini" or "absent", never printed. Read the output before sharing it anyway.
set -uo pipefail

ENV_NAME="${1:-production}"
DIR="$(cd "$(dirname "$0")" && pwd)"
[ "$ENV_NAME" = "production" ] && ENV_FILE="$DIR/.env" || ENV_FILE="$DIR/.env.$ENV_NAME"

section() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

section "Environnement"
echo "date      : $(date -Is)"
echo "fichier   : $ENV_FILE $([ -f "$ENV_FILE" ] && echo '(présent)' || echo '(ABSENT)')"
[ -f "$ENV_FILE" ] || { echo "Sans fichier d'environnement, rien d'autre n'est lisible."; exit 1; }

# Only non-secret values are echoed; the rest is reported as present or absent.
while IFS='=' read -r key value; do
  case "$key" in
    ''|\#*) continue ;;
    *PASSWORD*|*SECRET*|*API_KEY*)
      [ -n "$value" ] && echo "$key = <défini>" || echo "$key = <absent>" ;;
    *) echo "$key = $value" ;;
  esac
done < "$ENV_FILE"

section "Conteneurs"
docker compose --env-file "$ENV_FILE" -f "$DIR/docker-compose.yml" ps 2>&1 | head -20

section "Santé de l'API (depuis la machine)"
PORT="$(grep -E '^API_PORT=' "$ENV_FILE" | cut -d= -f2-)"
PORT="${PORT:-3000}"
curl -sS --max-time 10 "http://127.0.0.1:$PORT/api/health" 2>&1 | head -3
echo

section "Ports en écoute"
ss -lntp 2>/dev/null | grep -E ':(80|443|3000|3001|5432|8069|8090)\s' | head -12

section "Base de données"
docker compose --env-file "$ENV_FILE" -f "$DIR/docker-compose.yml" exec -T db \
  psql -U "$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2-)" \
       -d "$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2-)" \
       -q -c "select
                (select count(*) from users) as comptes,
                (select count(*) from user_roles where role='admin') as admins,
                (select count(*) from articles) as articles,
                (select count(*) from menus where is_published) as menus_publies,
                (select count(*) from orders) as commandes;" 2>&1 | head -8

section "Migrations appliquées"
docker compose --env-file "$ENV_FILE" -f "$DIR/docker-compose.yml" exec -T db \
  psql -U "$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2-)" \
       -d "$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2-)" \
       -q -c "select count(*) as migrations from drizzle.__drizzle_migrations;" 2>&1 | head -5

section "Apache"
apachectl configtest 2>&1 | tail -2
echo "sites actifs :"
ls /etc/apache2/sites-enabled/ 2>/dev/null | sed 's/^/  /'
echo "modules requis :"
for m in proxy proxy_http headers rewrite; do
  apachectl -M 2>/dev/null | grep -q "${m}_module" && echo "  ✓ $m" || echo "  ✗ $m MANQUANT"
done

section "Racine web"
WEB_ROOT="$(grep -E '^WEB_ROOT=' "$ENV_FILE" | cut -d= -f2-)"
if [ -n "$WEB_ROOT" ] && [ -d "$WEB_ROOT" ]; then
  echo "$WEB_ROOT :"
  ls "$WEB_ROOT" | head -6 | sed 's/^/  /'
  echo "  index.html modifié : $(stat -c '%y' "$WEB_ROOT/index.html" 2>/dev/null || echo ABSENT)"
  echo "  fichiers dans assets/ : $(ls "$WEB_ROOT/assets" 2>/dev/null | wc -l)"
else
  echo "WEB_ROOT introuvable : ${WEB_ROOT:-<non défini>}"
fi

section "Logs de l'API (40 dernières lignes)"
docker compose --env-file "$ENV_FILE" -f "$DIR/docker-compose.yml" logs --tail 40 api 2>&1 | tail -40

section "Erreurs Apache pour ce site (20 dernières)"
tail -20 /var/log/apache2/menu-error.log 2>/dev/null || echo "  (pas de journal menu-error.log)"

section "Ressources"
free -h | head -2
df -h / | tail -1

printf '\n\033[1mFin du diagnostic.\033[0m\n'
