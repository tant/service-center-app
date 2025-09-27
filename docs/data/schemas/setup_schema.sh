#!/bin/bash

# Service Center Database Schema Setup Script
# # Check if database is running (suppre    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Applying migration...${NC}"
        if pnpx supabase migration up --local 2>/dev/null; then
            echo -e "${GREEN}✅ Migration applied${NC}"
            
            # Show updated database state (after migration)
            echo -e "${BLUE}📊 Updated database state:${NC}"
            psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT 'Tables' as object_type, count(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' UNION ALL SELECT 'Views' as object_type, count(*) as count FROM information_schema.views WHERE table_schema = 'public';" 2>/dev/null || echo -e "${YELLOW}   (Database not accessible)${NC}"
        else
            echo -e "${RED}❌ Migration failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}💡 Apply later: pnpx supabase migration up${NC}"
    fiutput)
if ! pnpx supabase status --output pretty 2>/dev/null | grep -q "API URL"; then
    echo -e "${YELLOW}⚠️  Local Supabase not running${NC}"
    read -p "Start it now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Starting Supabase...${NC}"
        pnpx supabase start
    else
        echo -e "${YELLOW}💡 Start later: pnpx supabase start${NC}"
    fi
fi

# Check current database state (before migration)
echo -e "${BLUE}📊 Current database state:${NC}"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT 'Tables' as object_type, count(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' UNION ALL SELECT 'Views' as object_type, count(*) as count FROM information_schema.views WHERE table_schema = 'public';" 2>/dev/null || echo -e "${YELLOW}   (Database not accessible)${NC}"helps copy schema files to Supabase folder and generate migrations

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

SCHEMA_COUNT=$(find docs/data/schemas -name "*.sql" | wc -l)
EXISTING_SCHEMAS=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l)

if [ $EXISTING_SCHEMAS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Will overwrite ${EXISTING_SCHEMAS} existing schema files${NC}"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚫 Cancelled${NC}"
        exit 0
    fi
fi

# Copy schema files
echo -e "${BLUE}📁 Copying ${SCHEMA_COUNT} schema files...${NC}"
cp docs/data/schemas/*.sql supabase/schemas/ 2>/dev/null || true
[ -f "docs/data/schemas/README.md" ] && cp docs/data/schemas/README.md supabase/schemas/

echo -e "${GREEN}✅ Schema files copied${NC}"

# Check Supabase setup
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Run 'supabase init' first${NC}"
    exit 1
fi

# Check if database is running (suppress status output)
if ! pnpx supabase status --output pretty 2>/dev/null | grep -q "API URL"; then
    echo -e "${YELLOW}⚠️  Local Supabase not running${NC}"
    read -p "Start it now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Starting Supabase...${NC}"
        pnpx supabase start
    else
        echo -e "${YELLOW}� Start later: pnpx supabase start${NC}"
    fi
fi

# Generate migration
MIGRATION_NAME=$([ $EXISTING_SCHEMAS -gt 0 ] && echo "update_service_center_schema" || echo "initial_service_center_schema")

echo -e "${BLUE}📊 Generating migration...${NC}"
if pnpx supabase db diff --local -f "$MIGRATION_NAME" 2>/dev/null; then
    LATEST_MIGRATION=$(ls -t supabase/migrations/*.sql 2>/dev/null | head -n1)
    echo -e "${GREEN}✅ Generated: $(basename "$LATEST_MIGRATION")${NC}"
    
    read -p "Apply migration now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Applying migration...${NC}"
        if pnpx supabase migration up --local 2>/dev/null; then
            echo -e "${GREEN}✅ Migration applied${NC}"
        else
            echo -e "${RED}❌ Migration failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}� Apply later: pnpx supabase migration up${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No changes detected (schemas may already be applied)${NC}"
fi

echo -e "${GREEN}🎉 Schema setup completed!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}  • Test: pnpx supabase start (then visit dashboard)${NC}"
echo -e "${BLUE}  • Deploy: pnpx supabase db push${NC}"
echo -e "${BLUE}  • Reset: pnpx supabase db reset${NC}"

exit 0