#!/usr/bin/env bash
# Backup the Dentify PostgreSQL database using pg_dump.
# Works whether Postgres runs via `docker compose up -d postgres` or is installed locally.
#
# Usage:
#   ./scripts/backup-db.sh [output-file]
#
# Env vars (all optional, matching docker-compose.yml defaults):
#   POSTGRES_CONTAINER  (default: giaptechdentify-postgres-1 — auto-detected if different)
#   POSTGRES_DB         (default: Dentify)
#   POSTGRES_USER       (default: dentify)

set -euo pipefail

POSTGRES_DB="${POSTGRES_DB:-Dentify}"
POSTGRES_USER="${POSTGRES_USER:-dentify}"
OUTPUT_FILE="${1:-backup-$(date +%Y%m%d-%H%M%S).dump}"

CONTAINER="${POSTGRES_CONTAINER:-$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)}"

if [ -n "$CONTAINER" ]; then
  CONTAINER_TMP_FILE="/tmp/$(basename "$OUTPUT_FILE")"
  echo "Backing up database '$POSTGRES_DB' from container '$CONTAINER' -> $OUTPUT_FILE"
  docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f "$CONTAINER_TMP_FILE"
  docker cp "$CONTAINER:$CONTAINER_TMP_FILE" "$OUTPUT_FILE"
  docker exec "$CONTAINER" rm "$CONTAINER_TMP_FILE"
else
  echo "No running postgres container found — falling back to local pg_dump (expects Postgres on localhost:5432)"
  PGPASSWORD="${POSTGRES_PASSWORD:-dentify}" pg_dump -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f "$OUTPUT_FILE"
fi

echo "Done: $OUTPUT_FILE"
