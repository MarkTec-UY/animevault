#!/bin/sh
set -eu

cd /var/www/html

LOG_FILE="${SCHEDULER_LOG_PATH:-/var/www/html/storage/logs/scheduler.log}"
INTERVAL_SECONDS="${SCHEDULER_INTERVAL_SECONDS:-60}"

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S %z'
}

log_line() {
  printf '[%s] %s\n' "$(timestamp)" "$1" | tee -a "$LOG_FILE"
}

handle_shutdown() {
  log_line "Scheduler container stopping."
  exit 0
}

trap handle_shutdown INT TERM

log_line "Scheduler container started. Running php artisan schedule:run -v every ${INTERVAL_SECONDS}s."

while true; do
  log_line "Starting scheduler tick."
  php artisan schedule:run -v 2>&1 | tee -a "$LOG_FILE"
  log_line "Scheduler tick finished."
  sleep "$INTERVAL_SECONDS" &
  wait $!
done
