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

# Create storage buckets from seed data
echo -e "${BLUE}🪣 Creating storage buckets...${NC}"
if [ -f "docs/data/seeds/storage_buckets.sql" ]; then
    if pnpx supabase db execute -f docs/data/seeds/storage_buckets.sql 2>/dev/null; then
        echo -e "${GREEN}✅ Storage buckets created${NC}"
    else
        # If buckets already exist, that's fine
        echo -e "${YELLOW}⚠️  Buckets may already exist, continuing...${NC}"
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

# Cleanup: remove SQL files from migrations and schemas (no backup)
echo -e "${BLUE}🧹 Removing SQL files from supabase/migrations and supabase/schemas (no backup)...${NC}"
# Remove any .sql files directly
rm -f supabase/migrations/*.sql 2>/dev/null || true
rm -f supabase/schemas/*.sql 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed. SQL files removed from supabase/migrations and supabase/schemas${NC}"

echo -e "${GREEN}🎉 Schema setup completed!${NC}"
echo
exit 0