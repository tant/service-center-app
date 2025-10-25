#!/bin/bash

# Service Center Database Cleanup Script
# This script stops Supabase, removes Docker volumes and containers related to service-center, and restarts Supabase
#
# Version: 2.0
# Updated: 2025-10-25
# Changes:
# - Added guidance for schema setup after cleanup
# - Updated to reflect 13 schema files (was 9)
# - Added reference to new documentation

set -euo pipefail
IFS=$'\n\t'

echo "🧹 Service Center Database Cleanup (v2.0)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging helpers
log() { echo -e "${BLUE}$*${NC}"; }
info() { echo -e "${BLUE}$*${NC}"; }
success() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
error() { echo -e "${RED}$*${NC}" >&2; }

# Check prerequisites
if ! command -v pnpm &> /dev/null && ! command -v pnpx &> /dev/null; then
    error "❌ Error: pnpm/pnpx not available"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "❌ Error: Docker not available"
    exit 1
fi

# (Removed pre-cleanup DB state check)

# Stop Supabase
info "🛑 Stopping Supabase..."
if pnpx supabase stop 2>/dev/null; then
    success "✅ Supabase stopped"
else
    warn "⚠️  Supabase was not running or stop failed"
fi

# Get Docker containers related to service-center
info "🔍 Finding Docker containers related to service-center..."
CONTAINERS=$(docker ps -a -q --filter "name=service-center" --format='{{.ID}}' || true)

if [ -n "$CONTAINERS" ]; then
    info "🗑️  Removing Docker containers..."
    echo "$CONTAINERS" | xargs -r docker rm -f
    success "✅ Docker containers removed"
else
    warn "⚠️  No Docker containers found with 'service-center' in the name"
fi

# Get Docker volumes related to service-center
info "🔍 Finding Docker volumes related to service-center..."
VOLUMES=$(docker volume ls --format '{{.Name}}' | grep -i 'service-center' || true)

if [ -n "$VOLUMES" ]; then
    info "🗑️  Removing Docker volumes..."
    echo "$VOLUMES" | xargs -r docker volume rm
    success "✅ Docker volumes removed"
else
    warn "⚠️  No Docker volumes found with 'service-center' in the name"
fi

# (Removed remaining Supabase-related Docker resource cleanup)

# Clean up migration and schema files
info "🗑️  Removing migration files..."
if [ -d "supabase/migrations" ]; then
    rm -f supabase/migrations/*.sql
    success "✅ Migration files removed"
else
    warn "⚠️  No migrations directory found"
fi

info "🗑️  Removing schema files..."
if [ -d "supabase/schemas" ]; then
    rm -f supabase/schemas/*.sql
    success "✅ Schema files removed"
else
    warn "⚠️  No schemas directory found"
fi

# Ensure required directories exist (create if missing)
info "📁 Ensuring required Supabase directories exist..."
REQUIRED_DIRS=("supabase/migrations" "supabase/schemas" "supabase/storage/avatars" "supabase/storage/product_images" "supabase/storage/service_media")
CREATED=()
EXISTED=0
for DIR in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        EXISTED=$((EXISTED + 1))
    else
        mkdir -p "$DIR"
        CREATED+=("$DIR")
    fi
done

if [ ${#CREATED[@]} -gt 0 ]; then
    success "   ✅ Created ${#CREATED[@]} directories: ${CREATED[*]}"
fi
info "   • ${EXISTED} directories already existed"

# Temporarily move seed file to avoid errors on empty database
SEED_FILE="supabase/seed.sql"
SEED_BACKUP="supabase/seed.sql.cleanup_backup"
if [ -f "$SEED_FILE" ]; then
    info "📦 Temporarily moving seed file (will restore after schemas are applied)..."
    mv "$SEED_FILE" "$SEED_BACKUP"
    success "   ✓ Seed file backed up"
fi

# Start Supabase
info "🚀 Starting Supabase..."
if pnpx supabase start --debug; then
    success "✅ Supabase started successfully"

    # Restore seed file
    if [ -f "$SEED_BACKUP" ]; then
        mv "$SEED_BACKUP" "$SEED_FILE"
        success "   ✓ Seed file restored"
    fi
else
    error "❌ Failed to start Supabase"

    # Restore seed file even on failure
    if [ -f "$SEED_BACKUP" ]; then
        mv "$SEED_BACKUP" "$SEED_FILE"
        warn "   ⚠️  Seed file restored after failure"
    fi
    exit 1
fi

# Post-cleanup instructions
echo ""
success "🎉 Cleanup completed successfully!"
echo ""
info "📋 Next Step:"
echo "   Run the setup script to apply schemas and seed data:"
echo ""
echo "   ./docs/data/schemas/setup_schema.sh"
echo ""

exit 0