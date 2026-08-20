#!/bin/bash
# Daily dump of the ordering database, kept for two weeks.
#
#   0 3 * * * /opt/menu-paiement-facile/infra/backup.sh >> /var/log/menu-backup.log 2>&1
#
# A backup that has never been restored is not a backup: infra/restore.sh does
# the restore, and should be exercised on a scratch database now and then.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# Defaults to production; `make backup ENV=staging` points it elsewhere.
ENV_FILE="${ENV_FILE:-$DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/menu}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# shellcheck source=/dev/null
set -a; . "$ENV_FILE"; set +a

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/menu-$STAMP.sql.gz"

docker compose --env-file "$ENV_FILE" -f "$DIR/docker-compose.yml" exec -T db \
  pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$TARGET.partial"

# Renamed only once the dump completed, so a truncated file is never mistaken
# for a usable backup.
mv "$TARGET.partial" "$TARGET"
chmod 600 "$TARGET"

find "$BACKUP_DIR" -name 'menu-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name '*.partial' -mtime +1 -delete

echo "$(date -Is) sauvegarde : $TARGET ($(du -h "$TARGET" | cut -f1))"
