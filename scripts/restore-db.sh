#!/usr/bin/env bash
# Restore the Dentify PostgreSQL database from a pg_dump custom-format backup.
# WARNING: this drops and recreates all data in the target database.
#
# Usage:
#   ./scripts/restore-db.sh <backup-file>
#
# Env vars (all optional, matching docker-compose.yml defaults):
#   POSTGRES_CONTAINER  (default: auto-detected running postgres container)
#   POSTGRES_DB         (default: Dentify)
#   POSTGRES_USER       (default: dentify)

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"
POSTGRES_DB="${POSTGRES_DB:-Dentify}"
POSTGRES_USER="${POSTGRES_USER:-dentify}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

read -p "This will REPLACE all data in database '$POSTGRES_DB'. Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

CONTAINER="${POSTGRES_CONTAINER:-$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)}"

if [ -n "$CONTAINER" ]; then
  echo "Restoring '$BACKUP_FILE' into database '$POSTGRES_DB' on container '$CONTAINER'"
  docker cp "$BACKUP_FILE" "$CONTAINER:/tmp/restore.dump"
  docker exec "$CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists "/tmp/restore.dump"
  docker exec "$CONTAINER" rm "/tmp/restore.dump"
else
  echo "No running postgres container found — falling back to local pg_restore (expects Postgres on localhost:5432)"
  PGPASSWORD="${POSTGRES_PASSWORD:-dentify}" pg_restore -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists "$BACKUP_FILE"
fi

echo "Restore complete. Restart the backend/DbMigrator if it was running."
