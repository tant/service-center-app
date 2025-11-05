#!/usr/bin/env bash

# Reset local database by running cleanup then schema setup
# Usage: ./reset-db.sh

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="$ROOT_DIR/docs/data/cleanup_supabase.sh"
SETUP_SCRIPT="$ROOT_DIR/docs/data/schemas/setup_schema.sh"

log() { printf "\033[1;34m[reset-db] %s\033[0m\n" "$*"; }
err() { printf "\033[1;31m[reset-db][error] %s\033[0m\n" "$*" >&2; }

trap 'err "Failed at line ${LINENO}."' ERR

if [[ ! -f "$CLEANUP_SCRIPT" ]]; then
  err "Missing cleanup script: $CLEANUP_SCRIPT"
  exit 1
fi

if [[ ! -f "$SETUP_SCRIPT" ]]; then
  err "Missing setup script: $SETUP_SCRIPT"
  exit 1
fi

log "Starting Supabase cleanup..."
bash "$CLEANUP_SCRIPT"

log "Applying database schema..."
bash "$SETUP_SCRIPT"

log "Database reset complete."
