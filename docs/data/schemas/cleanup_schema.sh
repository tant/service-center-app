#!/bin/bash

# Service Center Database Schema Cleanup Script
# This script removes all schema files and migrations to start fresh

set -e

echo "🧹 Service Center Database Schema Cleanup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo "   Make sure you have a 'supabase' folder and 'package.json' file"
    exit 1
fi

# Check if pnpm is available (we'll use pnpx supabase)
if ! command -v pnpm &> /dev/null && ! command -v pnpx &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm/pnpx is not available${NC}"
    echo "   Please install pnpm first or ensure pnpx is available"
    exit 1
fi

echo -e "${BLUE}📋 Current status:${NC}"

# Check what will be cleaned up
SCHEMA_FILES=0
MIGRATION_FILES=0

if [ -d "supabase/schemas" ]; then
    SCHEMA_FILES=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l)
    if [ $SCHEMA_FILES -gt 0 ]; then
        echo -e "${YELLOW}   📁 Found ${SCHEMA_FILES} schema files in supabase/schemas/${NC}"
    fi
fi

if [ -d "supabase/migrations" ]; then
    MIGRATION_FILES=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
    if [ $MIGRATION_FILES -gt 0 ]; then
        echo -e "${YELLOW}   📁 Found ${MIGRATION_FILES} migration files in supabase/migrations/${NC}"
    fi
fi

# Check if local database is running
DB_RUNNING=false
if pnpx supabase status --output pretty 2>/dev/null | grep -q "API URL"; then
    DB_RUNNING=true
    echo -e "${BLUE}   🔄 Local Supabase database is running${NC}"
else
    echo -e "${YELLOW}   ⏸️  Local Supabase database is not running${NC}"
fi

if [ $SCHEMA_FILES -eq 0 ] && [ $MIGRATION_FILES -eq 0 ] && [ "$DB_RUNNING" = false ]; then
    echo -e "${GREEN}✨ Already clean! Nothing to clean up.${NC}"
    exit 0
fi

echo
echo -e "${RED}⚠️  WARNING: This will permanently delete:${NC}"
if [ $SCHEMA_FILES -gt 0 ]; then
    echo -e "${RED}   - All schema files in supabase/schemas/ (${SCHEMA_FILES} files)${NC}"
fi
if [ $MIGRATION_FILES -gt 0 ]; then
    echo -e "${RED}   - All migration files in supabase/migrations/ (${MIGRATION_FILES} files)${NC}"
fi
if [ "$DB_RUNNING" = true ]; then
    echo -e "${RED}   - Reset local database to initial state${NC}"
fi
echo -e "${RED}   - This action cannot be undone!${NC}"
echo

read -p "Are you sure you want to continue? Type 'yes' to confirm: " -r
echo
if [[ ! $REPLY == "yes" ]]; then
    echo -e "${YELLOW}🚫 Operation cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}🧹 Starting cleanup process...${NC}"

# Step 1: Remove migration files FIRST (before database reset)
if [ $MIGRATION_FILES -gt 0 ]; then
    echo -e "${BLUE}🗑️  Removing migration files...${NC}"
    
    # List files to be deleted
    find supabase/migrations -name "*.sql" -exec basename {} \; | while read file; do
        echo -e "${YELLOW}   - Removing: $file${NC}"
    done
    
    # Remove migration files
    find supabase/migrations -name "*.sql" -delete
    echo -e "${GREEN}   ✅ Migration files removed${NC}"
fi

# Step 2: Reset database after removing migrations
if [ "$DB_RUNNING" = true ]; then
    echo -e "${BLUE}🔄 Resetting local database...${NC}"
    echo -e "${YELLOW}   Note: 'Using project host: supabase.co' is normal - you're still working locally${NC}"
    if pnpx supabase db reset --local --debug; then
        echo -e "${GREEN}   ✅ Database reset successfully${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Database reset failed or was cancelled${NC}"
        echo -e "${YELLOW}   Continuing with file cleanup...${NC}"
    fi
fi

# Step 3: Remove schema files
if [ $SCHEMA_FILES -gt 0 ]; then
    echo -e "${BLUE}🗑️  Removing schema files...${NC}"
    
    # List files to be deleted
    find supabase/schemas -name "*.sql" -exec basename {} \; | while read file; do
        echo -e "${YELLOW}   - Removing: $file${NC}"
    done
    
    # Remove schema files
    find supabase/schemas -name "*.sql" -delete
    
    # Remove README if it exists
    if [ -f "supabase/schemas/README.md" ]; then
        rm supabase/schemas/README.md
        echo -e "${YELLOW}   - Removing: README.md${NC}"
    fi
    
    echo -e "${GREEN}   ✅ Schema files removed${NC}"
fi

# Step 4: Clean up empty directories
if [ -d "supabase/schemas" ] && [ -z "$(ls -A supabase/schemas)" ]; then
    echo -e "${BLUE}🗑️  Removing empty schemas directory...${NC}"
    rmdir supabase/schemas
    echo -e "${GREEN}   ✅ Empty schemas directory removed${NC}"
fi

# Step 5: Verify cleanup
echo -e "${BLUE}🔍 Verifying cleanup...${NC}"

REMAINING_SCHEMAS=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l || echo "0")
REMAINING_MIGRATIONS=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l || echo "0")

if [ $REMAINING_SCHEMAS -eq 0 ] && [ $REMAINING_MIGRATIONS -eq 0 ]; then
    echo -e "${GREEN}   ✅ Cleanup verified - all files removed${NC}"
else
    echo -e "${YELLOW}   ⚠️  Some files may still remain:${NC}"
    [ $REMAINING_SCHEMAS -gt 0 ] && echo -e "${YELLOW}     - ${REMAINING_SCHEMAS} schema files${NC}"
    [ $REMAINING_MIGRATIONS -gt 0 ] && echo -e "${YELLOW}     - ${REMAINING_MIGRATIONS} migration files${NC}"
fi

echo
echo -e "${GREEN}🎉 Cleanup completed!${NC}"
echo
echo -e "${BLUE}📋 What was cleaned:${NC}"
[ $SCHEMA_FILES -gt 0 ] && echo -e "${BLUE}   ✅ Removed ${SCHEMA_FILES} schema files${NC}"
[ $MIGRATION_FILES -gt 0 ] && echo -e "${BLUE}   ✅ Removed ${MIGRATION_FILES} migration files${NC}"
[ "$DB_RUNNING" = true ] && echo -e "${BLUE}   ✅ Reset local database${NC}"

echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}   1. Your environment is now clean and ready${NC}"
echo -e "${BLUE}   2. Run setup script to reinstall schemas:${NC}"
echo -e "${BLUE}      ./docs/data/schemas/setup_schema.sh${NC}"
echo -e "${BLUE}   3. Or start Supabase fresh:${NC}"
echo -e "${BLUE}      pnpx supabase start${NC}"

echo
echo -e "${GREEN}✨ Ready to start fresh!${NC}"

exit 0