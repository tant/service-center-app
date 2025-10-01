#!/bin/bash

# Service Center Database Schema Setup Script
# This script helps copy schema files to Supabase folder and generate migrations

set -e

echo "🚀 Service Center Schema Setup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Silent checks
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Error: Run from project root (need package.json and supabase/ folder)${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null && ! command -v pnpx &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm/pnpx not available${NC}"
    exit 1
fi

# Setup directories and check files
mkdir -p supabase/schemas

if [ ! -d "docs/data/schemas" ]; then
    echo -e "${RED}❌ Error: docs/data/schemas directory not found${NC}"
    exit 1
fi

# Copy schema files in proper order
echo -e "${BLUE}📁 Copying schema files in proper order...${NC}"

# Order of execution matters due to dependencies
SCHEMA_FILES=(
    "00_base_functions.sql"
    "core_01_profiles.sql"
    "core_02_customers.sql"
    "core_03_products.sql"
    "core_04_parts.sql"
    "core_05_product_parts.sql"
    "core_06_service_tickets.sql"
    "core_07_service_ticket_parts.sql"
    "core_08_service_ticket_comments.sql"
    "core_09_service_ticket_attachments.sql"
    "functions_inventory.sql"
    "storage_policies.sql"
)

# Copy each file in order
for file in "${SCHEMA_FILES[@]}"; do
    if [ -f "docs/data/schemas/$file" ]; then
        cp "docs/data/schemas/$file" "supabase/schemas/"
        echo -e "  ✓ Copied $file"
    else
        echo -e "${YELLOW}  ⚠️  Warning: $file not found, skipping${NC}"
    fi
done

echo -e "${GREEN}✅ Schema files copied${NC}"

# Get database connection URL
echo -e "${BLUE}🔌 Getting database connection...${NC}"
DB_URL=$(pnpx supabase status | grep "Database URL" | sed 's/.*Database URL: //' | xargs)
if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Error: Could not get database URL. Is Supabase running?${NC}"
    echo -e "${YELLOW}   Run: pnpx supabase start${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Connected to: $DB_URL${NC}"

# Create storage buckets from seed data
echo -e "${BLUE}🪣 Creating storage buckets...${NC}"
if [ -f "docs/data/seeds/storage_buckets.sql" ]; then
    BUCKET_OUTPUT=$(psql "$DB_URL" -f docs/data/seeds/storage_buckets.sql 2>&1)
    BUCKET_EXIT_CODE=$?

    if [ $BUCKET_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Storage buckets created${NC}"
    else
        if echo "$BUCKET_OUTPUT" | grep -q "already exists\|duplicate key"; then
            echo -e "${YELLOW}⚠️  Buckets already exist, continuing...${NC}"
        else
            echo -e "${YELLOW}⚠️  Bucket creation warning:${NC}"
            echo -e "${YELLOW}   $BUCKET_OUTPUT${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Storage buckets seed file not found, skipping...${NC}"
fi

# Generate migration (simple, may take some time)
echo -e "${BLUE}📊 Generating migration (this may take a little while)...${NC}"
if pnpx supabase db diff -f init_schema --debug; then
    echo -e "${GREEN}✅ Migration generated (init_schema)${NC}"
else
    echo -e "${YELLOW}⚠️  Migration generation failed or no changes detected; continuing to attempt to apply migrations${NC}"
fi

# Apply migration
echo -e "${BLUE}🔄 Applying migration...${NC}"
if pnpx supabase migration up; then
    echo -e "${GREEN}✅ Migration applied${NC}"
else
    echo -e "${RED}❌ Migration application failed${NC}"
    exit 1
fi

# Apply storage policies (db diff doesn't capture policies on system tables)
echo -e "${BLUE}🔐 Applying storage policies...${NC}"
if [ -f "docs/data/schemas/storage_policies.sql" ]; then
    echo -e "${BLUE}   📄 File found: docs/data/schemas/storage_policies.sql${NC}"
    echo -e "${BLUE}   🔧 Executing storage policies via psql...${NC}"

    # Capture both stdout and stderr for debugging
    POLICY_OUTPUT=$(psql "$DB_URL" -f docs/data/schemas/storage_policies.sql 2>&1)
    POLICY_EXIT_CODE=$?

    if [ $POLICY_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Storage policies applied successfully${NC}"
        if [ -n "$POLICY_OUTPUT" ]; then
            echo -e "${BLUE}   Output:${NC}"
            echo "$POLICY_OUTPUT" | sed 's/^/      /'
        fi
    else
        echo -e "${YELLOW}⚠️  Storage policy application encountered issues${NC}"
        echo -e "${YELLOW}   Exit code: $POLICY_EXIT_CODE${NC}"
        echo -e "${YELLOW}   Output:${NC}"
        echo "$POLICY_OUTPUT" | sed 's/^/      /'

        # Check if it's just a "already exists" error
        if echo "$POLICY_OUTPUT" | grep -q "already exists"; then
            echo -e "${YELLOW}   → Policies already exist, continuing...${NC}"
        else
            echo -e "${RED}   → Unexpected error during policy creation${NC}"
            echo -e "${RED}   → This will cause permission errors when uploading files!${NC}"
            exit 1
        fi
    fi

    # Verify policies were created
    echo -e "${BLUE}   🔍 Verifying storage policies...${NC}"
    POLICY_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'" 2>&1)

    if [[ "$POLICY_COUNT" =~ ^[0-9]+$ ]]; then
        echo -e "${BLUE}   Found $POLICY_COUNT storage policies${NC}"

        if [ "$POLICY_COUNT" -eq 0 ]; then
            echo -e "${RED}   ⚠️  WARNING: No storage policies found in database!${NC}"
            echo -e "${RED}   This will cause permission errors when uploading files.${NC}"
            exit 1
        else
            echo -e "${GREEN}   ✓ Storage policies verified ($POLICY_COUNT policies active)${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  Could not verify policy count: $POLICY_COUNT${NC}"
    fi
else
    echo -e "${RED}❌ Error: Storage policies file not found at docs/data/schemas/storage_policies.sql${NC}"
    exit 1
fi

# Cleanup: remove SQL files from migrations and schemas (no backup)
echo -e "${BLUE}🧹 Removing SQL files from supabase/migrations and supabase/schemas (no backup)...${NC}"
# Remove any .sql files directly
rm -f supabase/migrations/*.sql 2>/dev/null || true
rm -f supabase/schemas/*.sql 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed. SQL files removed from supabase/migrations and supabase/schemas${NC}"

echo -e "${GREEN}🎉 Schema setup completed!${NC}"
echo
exit 0