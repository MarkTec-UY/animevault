#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

SERVICE_NAME="pgsql"
MODE="backup"
OUTPUT_FILE=""
INPUT_FILE=""
USE_GZIP=0

usage() {
  cat <<'EOF'
Usage: ./backup_db.sh [options]

Creates or restores a PostgreSQL backup using the Docker Compose "pgsql" service.
Default mode is backup, saved in ./db with a timestamped filename.
Restore mode resets the application schemas before importing.

Options:
  -r, --restore FILE Restore database from FILE (.sql, .gz, .gzip).
  -o, --output FILE  Output file path.
      --gzip         Compress output using gzip.
  -h, --help         Show this help message.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -r|--restore)
      shift
      if [ "$#" -eq 0 ]; then
        echo "Missing value for --restore."
        usage
        exit 1
      fi
      MODE="restore"
      INPUT_FILE="$1"
      ;;
    -o|--output)
      shift
      if [ "$#" -eq 0 ]; then
        echo "Missing value for --output."
        usage
        exit 1
      fi
      OUTPUT_FILE="$1"
      ;;
    --gzip)
      USE_GZIP=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

if [ "$MODE" = "restore" ] && [ -n "$OUTPUT_FILE" ]; then
  echo "--output cannot be used with --restore."
  exit 1
fi

if [ "$MODE" = "restore" ] && [ "$USE_GZIP" -eq 1 ]; then
  echo "--gzip cannot be used with --restore."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "'docker compose' is not available."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running or not accessible."
  exit 1
fi

CONTAINER_ID="$(docker compose ps -q "$SERVICE_NAME" 2>/dev/null || true)"
if [ -z "$CONTAINER_ID" ]; then
  echo "Database service is not created. Starting $SERVICE_NAME..."
  docker compose up -d "$SERVICE_NAME"
  CONTAINER_ID="$(docker compose ps -q "$SERVICE_NAME" 2>/dev/null || true)"
fi

if [ -z "$CONTAINER_ID" ]; then
  echo "Could not resolve a container for service '$SERVICE_NAME'."
  exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_ID" 2>/dev/null || true)" != "true" ]; then
  echo "Database service is not running. Starting $SERVICE_NAME..."
  docker compose up -d "$SERVICE_NAME"
fi

is_compressed_file() {
  case "$1" in
    *.gz|*.gzip) return 0 ;;
    *) return 1 ;;
  esac
}

reset_application_schemas() {
  docker compose exec -T "$SERVICE_NAME" sh -c '
    PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'\''SQL'\''
DROP SCHEMA IF EXISTS schema_characters CASCADE;
DROP SCHEMA IF EXISTS schema_staff CASCADE;
DROP SCHEMA IF EXISTS schema_manga CASCADE;
DROP SCHEMA IF EXISTS schema_anime CASCADE;
DROP SCHEMA IF EXISTS schema_user CASCADE;
DROP SCHEMA IF EXISTS schema_core CASCADE;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL'
}

if [ "$MODE" = "restore" ]; then
  if [ -z "$INPUT_FILE" ]; then
    echo "You must provide a file with --restore."
    exit 1
  fi

  if [ ! -f "$INPUT_FILE" ]; then
    echo "Restore file not found: $INPUT_FILE"
    exit 1
  fi

  TMP_SQL=""

  if is_compressed_file "$INPUT_FILE"; then
    if ! command -v gzip >/dev/null 2>&1; then
      echo "gzip is not installed."
      exit 1
    fi

    TMP_SQL="$(mktemp /tmp/restore_pg_XXXXXX.sql)"
    gzip -dc "$INPUT_FILE" > "$TMP_SQL"
  else
    TMP_SQL="$INPUT_FILE"
  fi

  echo "Restoring database from: $INPUT_FILE"
  echo "Resetting application schemas before restore..."
  reset_application_schemas

  echo "Importing backup..."
  docker compose exec -T "$SERVICE_NAME" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$TMP_SQL"

  if [ "$TMP_SQL" != "$INPUT_FILE" ]; then
    rm -f "$TMP_SQL"
  fi

  echo "Restore completed successfully."
  exit 0
fi

if [ "$USE_GZIP" -eq 1 ] && ! command -v gzip >/dev/null 2>&1; then
  echo "gzip is not installed."
  exit 1
fi

mkdir -p db

if [ -z "$OUTPUT_FILE" ]; then
  TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
  OUTPUT_FILE="db/postgresql_backup_${TIMESTAMP}.sql"
fi

if [ "$USE_GZIP" -eq 1 ]; then
  case "$OUTPUT_FILE" in
    *.gz|*.gzip) ;;
    *) OUTPUT_FILE="${OUTPUT_FILE}.gz" ;;
  esac
fi

OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
mkdir -p "$OUTPUT_DIR"

TMP_SQL="$(mktemp /tmp/backup_pg_XXXXXX.sql)"
TMP_OUTPUT="${OUTPUT_FILE}.tmp"
rm -f "$TMP_OUTPUT"

docker compose exec -T "$SERVICE_NAME" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$TMP_SQL"

if [ "$USE_GZIP" -eq 1 ]; then
  gzip -c "$TMP_SQL" > "$TMP_OUTPUT"
else
  cp "$TMP_SQL" "$TMP_OUTPUT"
fi

rm -f "$TMP_SQL"

mv "$TMP_OUTPUT" "$OUTPUT_FILE"
echo "Backup created: $OUTPUT_FILE"
