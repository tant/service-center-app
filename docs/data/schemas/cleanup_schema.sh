#!/bin/bash

# Service Center Database Schema Cleanup Script
# This script removes all schema files and migrations to start fresh

set -e

echo "🧹 Service Center Schema Cleanup"

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

# Check what will be cleaned up
SCHEMA_FILES=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l || echo "0")
MIGRATION_FILES=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l || echo "0")

# Check if local database is running
DB_RUNNING=false
if pnpx supabase status --output pretty 2>/dev/null | grep -q "API URL"; then
    DB_RUNNING=true
fi

if [ $SCHEMA_FILES -eq 0 ] && [ $MIGRATION_FILES -eq 0 ] && [ "$DB_RUNNING" = false ]; then
    echo -e "${GREEN}✨ Already clean!${NC}"
    exit 0
fi

# Show current database state (before cleanup)
if [ "$DB_RUNNING" = true ]; then
    echo -e "${BLUE}📊 Current database state:${NC}"
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT 'Tables' as object_type, count(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' UNION ALL SELECT 'Views' as object_type, count(*) as count FROM information_schema.views WHERE table_schema = 'public';" 2>/dev/null || echo -e "${YELLOW}   (Database not accessible)${NC}"
fi

echo -e "${YELLOW}Will clean: ${SCHEMA_FILES} schemas, ${MIGRATION_FILES} migrations${NC}"

echo -e "${RED}⚠️  WARNING: Will delete all schemas, migrations, and reset database${NC}"
read -p "Continue? Type 'yes': " -r
echo
if [[ ! $REPLY == "yes" ]]; then
    echo -e "${YELLOW}🚫 Cancelled${NC}"
    exit 0
fi

# Remove migration files
if [ $MIGRATION_FILES -gt 0 ]; then
    echo -e "${BLUE}🗑️  Removing ${MIGRATION_FILES} migration files...${NC}"
    find supabase/migrations -name "*.sql" -delete
    echo -e "${GREEN}✅ Migrations removed${NC}"
fi

# Reset database
if [ "$DB_RUNNING" = true ]; then
    echo -e "${BLUE}🔄 Resetting database...${NC}"
    pnpx supabase stop 2>/dev/null || true
    if pnpx supabase db reset --local 2>/dev/null; then
        echo -e "${GREEN}✅ Database reset${NC}"
        
        # Start database again to show clean state
        pnpx supabase start 2>/dev/null || true
        echo -e "${BLUE}� Clean database state:${NC}"
        psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT 'Tables' as object_type, count(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' UNION ALL SELECT 'Views' as object_type, count(*) as count FROM information_schema.views WHERE table_schema = 'public';" 2>/dev/null || echo -e "${YELLOW}   (Database not accessible)${NC}"
    else
        echo -e "${YELLOW}⚠️  Database reset failed${NC}"
    fi
fi

# Remove schema files
if [ $SCHEMA_FILES -gt 0 ]; then
    echo -e "${BLUE}🗑️  Removing ${SCHEMA_FILES} schema files...${NC}"
    find supabase/schemas -name "*.sql" -delete
    [ -f "supabase/schemas/README.md" ] && rm supabase/schemas/README.md
    echo -e "${GREEN}✅ Schemas removed${NC}"
fi

# Clean up temp files and directories
echo -e "${BLUE}🗑️  Cleaning temp files...${NC}"
[ -d "supabase/.temp" ] && rm -rf supabase/.temp
[ -d "supabase/.branches" ] && find supabase/.branches -type f -delete 2>/dev/null || true

# Ensure clean schemas directory
if [ -d "supabase/schemas" ] && [ -z "$(ls -A supabase/schemas)" ]; then
    rmdir supabase/schemas
fi
mkdir -p supabase/schemas
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Verify cleanup
REMAINING_SCHEMAS=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l || echo "0")
REMAINING_MIGRATIONS=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l || echo "0")
SOURCE_SCHEMAS=$(find docs/data/schemas -name "*.sql" 2>/dev/null | wc -l || echo "0")

if [ $REMAINING_SCHEMAS -eq 0 ] && [ $REMAINING_MIGRATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ Environment clean - ${SOURCE_SCHEMAS} source schemas preserved${NC}"
else
    echo -e "${YELLOW}⚠️  ${REMAINING_SCHEMAS} schemas, ${REMAINING_MIGRATIONS} migrations remain${NC}"
fi

echo
echo -e "${GREEN}🎉 Cleanup completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}  • Setup: ./docs/data/schemas/setup_schema.sh${NC}"
echo -e "${BLUE}  • Start: pnpx supabase start${NC}"

exit 0