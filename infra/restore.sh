#!/bin/bash
# Restores a dump into the running database.
#
#   ./restore.sh /var/backups/menu/menu-20260819-030000.sql.gz
#
# Destructive: the dump drops and recreates every object it contains. Test it
# against a scratch database before you ever need it in anger.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
DUMP="${1:?usage: restore.sh <fichier.sql.gz>}"

# shellcheck source=/dev/null
set -a; . "$DIR/.env"; set +a

echo "Restauration de $DUMP dans $POSTGRES_DB."
read -r -p "Les données actuelles seront écrasées. Continuer ? [oui/N] " reply
[ "$reply" = "oui" ] || { echo "annulé"; exit 1; }

gunzip -c "$DUMP" | docker compose -f "$DIR/docker-compose.yml" exec -T db \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restauration terminée."
