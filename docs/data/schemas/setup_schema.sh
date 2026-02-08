#!/bin/bash

# Service Center Database Schema Setup Script
# This script copies schema files to Supabase folder and applies them via psql
#
# Updated: 2026-02-07
# Version: 5.0 (Robust binary detection, no migration generation)
#
# Changes:
# - Robust detection of supabase and psql binaries (Homebrew, PATH, pnpx)
# - Fallback DB URL when supabase status is unavailable
# - Removed migration generation step (schema files are the source of truth)
# - Improved error handling and messages

set -e

echo "Service Center Schema Setup (v5.0)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================
# Find binaries (supabase, psql)
# =====================================================

# Find supabase binary
find_supabase() {
    if command -v supabase &> /dev/null; then
        echo "supabase"
    elif [ -x "/opt/homebrew/bin/supabase" ]; then
        echo "/opt/homebrew/bin/supabase"
    elif command -v pnpx &> /dev/null; then
        echo "pnpx supabase"
    else
        echo ""
    fi
}

# Find psql binary
find_psql() {
    if command -v psql &> /dev/null; then
        echo "psql"
    elif [ -x "/opt/homebrew/opt/libpq/bin/psql" ]; then
        echo "/opt/homebrew/opt/libpq/bin/psql"
    elif [ -x "/usr/local/opt/libpq/bin/psql" ]; then
        echo "/usr/local/opt/libpq/bin/psql"
    else
        echo ""
    fi
}

SUPABASE_CMD=$(find_supabase)
PSQL_CMD=$(find_psql)

# Default DB URL for local Supabase (port from config.toml)
DEFAULT_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# =====================================================
# Pre-flight checks
# =====================================================

if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}Error: Run from project root (need package.json and supabase/ folder)${NC}"
    exit 1
fi

if [ ! -d "docs/data/schemas" ]; then
    echo -e "${RED}Error: docs/data/schemas directory not found${NC}"
    exit 1
fi

if [ -z "$PSQL_CMD" ]; then
    echo -e "${RED}Error: psql (PostgreSQL client) is not installed${NC}"
    echo -e "${YELLOW}   Install instructions:${NC}"
    echo -e "${YELLOW}   - macOS (Homebrew): brew install libpq${NC}"
    echo -e "${YELLOW}     Then add to PATH: echo 'export PATH=\"/opt/homebrew/opt/libpq/bin:\$PATH\"' >> ~/.zshrc${NC}"
    echo -e "${YELLOW}   - Ubuntu/Debian: sudo apt-get install postgresql-client${NC}"
    exit 1
fi
echo -e "${GREEN}   psql: $PSQL_CMD${NC}"

# =====================================================
# Get database connection URL
# =====================================================

echo -e "${BLUE}Getting database connection...${NC}"
DB_URL=""

if [ -n "$SUPABASE_CMD" ]; then
    echo -e "${BLUE}   supabase: $SUPABASE_CMD${NC}"
    STATUS_OUTPUT=$($SUPABASE_CMD status 2>/dev/null || true)
    DB_URL=$(echo "$STATUS_OUTPUT" | grep -m 1 -oE 'postgresql://[^[:space:]]+' || true)
fi

if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}   Could not get DB URL from supabase status, using default...${NC}"
    DB_URL="$DEFAULT_DB_URL"
fi

# Verify connection
if ! $PSQL_CMD "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database at $DB_URL${NC}"
    echo -e "${YELLOW}   Is Supabase running? Try: supabase start${NC}"
    exit 1
fi
echo -e "${GREEN}   Connected to: $DB_URL${NC}"

# =====================================================
# Copy schema files
# =====================================================

echo -e "${BLUE}Copying schema files...${NC}"
mkdir -p supabase/schemas

if cp docs/data/schemas/[1-9]*.sql supabase/schemas/ 2>/dev/null; then
    FILE_COUNT=$(ls -1 supabase/schemas/[1-9]*.sql 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}   Copied $FILE_COUNT schema files${NC}"
else
    echo -e "${RED}Error: Failed to copy schema files${NC}"
    exit 1
fi

# =====================================================
# Create storage buckets from seed data
# =====================================================

echo -e "${BLUE}Creating storage buckets...${NC}"
if [ -f "docs/data/seeds/storage_buckets.sql" ]; then
    BUCKET_OUTPUT=$($PSQL_CMD "$DB_URL" -f docs/data/seeds/storage_buckets.sql 2>&1)
    if [ $? -eq 0 ] || echo "$BUCKET_OUTPUT" | grep -q "already exists\|duplicate key"; then
        echo -e "${GREEN}   Storage buckets OK${NC}"
    else
        echo -e "${YELLOW}   Bucket creation warning: $BUCKET_OUTPUT${NC}"
    fi
else
    echo -e "${YELLOW}   Storage buckets seed file not found, skipping...${NC}"
fi

# =====================================================
# Apply all schema files to database
# =====================================================

echo -e "${BLUE}Applying schema files to database...${NC}"
SCHEMA_ERRORS=0
for file in supabase/schemas/[1-9]*.sql; do
    if [ -f "$file" ]; then
        BASENAME=$(basename "$file")
        echo -ne "${BLUE}   $BASENAME ... ${NC}"

        APPLY_OUTPUT=$($PSQL_CMD "$DB_URL" -f "$file" 2>&1)
        APPLY_EXIT_CODE=$?

        if [ $APPLY_EXIT_CODE -ne 0 ]; then
            if echo "$APPLY_OUTPUT" | grep -q "already exists\|does not exist\|IF EXISTS"; then
                echo -e "${YELLOW}SKIPPED (already applied)${NC}"
            else
                echo -e "${RED}ERROR${NC}"
                echo "$APPLY_OUTPUT" | head -5 | sed 's/^/         /'
                SCHEMA_ERRORS=$((SCHEMA_ERRORS + 1))
            fi
        else
            echo -e "${GREEN}OK${NC}"
        fi
    fi
done

if [ $SCHEMA_ERRORS -gt 0 ]; then
    echo -e "${RED}$SCHEMA_ERRORS schema file(s) failed to apply${NC}"
    exit 1
else
    echo -e "${GREEN}All schema files applied successfully${NC}"
fi

# =====================================================
# Apply storage policies (not captured by schema files on system tables)
# =====================================================

echo -e "${BLUE}Applying storage policies...${NC}"
if [ -f "docs/data/schemas/802_storage_policies.sql" ]; then
    POLICY_OUTPUT=$($PSQL_CMD "$DB_URL" -f docs/data/schemas/802_storage_policies.sql 2>&1)
    POLICY_EXIT_CODE=$?

    if [ $POLICY_EXIT_CODE -eq 0 ] || echo "$POLICY_OUTPUT" | grep -q "already exists"; then
        echo -e "${GREEN}   Storage policies applied${NC}"
    else
        echo -e "${RED}   Error applying storage policies${NC}"
        echo "$POLICY_OUTPUT" | head -5 | sed 's/^/      /'
        exit 1
    fi

    # Verify policies
    POLICY_COUNT=$($PSQL_CMD "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'" 2>&1)
    if [[ "$POLICY_COUNT" =~ ^[0-9]+$ ]] && [ "$POLICY_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   Verified: $POLICY_COUNT storage policies active${NC}"
    else
        echo -e "${RED}   WARNING: No storage policies found! File uploads will fail.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: 802_storage_policies.sql not found${NC}"
    exit 1
fi

# =====================================================
# Final verification
# =====================================================

echo -e "${BLUE}Verifying database setup...${NC}"

TABLE_COUNT=$($PSQL_CMD "$DB_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -ge 30 ]; then
    echo -e "${GREEN}   Tables: $TABLE_COUNT${NC}"
else
    echo -e "${YELLOW}   Warning: Only $TABLE_COUNT tables found (expected 30+)${NC}"
fi

RBAC_FUNCS=$($PSQL_CMD "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role')" 2>/dev/null || echo "0")
if [ "$RBAC_FUNCS" -ge 3 ]; then
    echo -e "${GREEN}   RBAC functions: $RBAC_FUNCS${NC}"
else
    echo -e "${YELLOW}   Warning: Only $RBAC_FUNCS RBAC functions found (expected 3+)${NC}"
fi

WAREHOUSE_COUNT=$($PSQL_CMD "$DB_URL" -tAc "SELECT COUNT(*) FROM public.physical_warehouses WHERE is_system_default = true" 2>/dev/null || echo "0")
VIRTUAL_COUNT=$($PSQL_CMD "$DB_URL" -tAc "SELECT COUNT(*) FROM public.virtual_warehouses" 2>/dev/null || echo "0")
if [ "$WAREHOUSE_COUNT" -eq 1 ] && [ "$VIRTUAL_COUNT" -eq 7 ]; then
    echo -e "${GREEN}   Warehouses: 1 physical, 7 virtual${NC}"
else
    echo -e "${YELLOW}   Warning: Warehouse counts unexpected (physical: $WAREHOUSE_COUNT, virtual: $VIRTUAL_COUNT)${NC}"
fi

echo
echo -e "${GREEN}Schema setup completed successfully!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. pnpm dev"
echo -e "  2. Open http://localhost:3025/setup to create admin user"
echo
exit 0
