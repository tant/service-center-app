#!/bin/bash

# Service Center Database Schema Setup Script
# This script helps copy schema files to Supabase folder and generate migrations

set -e

echo "🚀 Service Center Database Schema Setup"
echo "======================================="

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

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI is not installed${NC}"
    echo "   Please install it first: https://supabase.com/docs/reference/cli/installing-the-cli"
    exit 1
fi

echo -e "${BLUE}📋 Current status:${NC}"

# Check if supabase/schemas directory exists
if [ ! -d "supabase/schemas" ]; then
    echo -e "${YELLOW}📁 Creating supabase/schemas directory...${NC}"
    mkdir -p supabase/schemas
fi

# Check if schema files exist in docs
if [ ! -d "docs/data/schemas" ]; then
    echo -e "${RED}❌ Error: docs/data/schemas directory not found${NC}"
    exit 1
fi

# Count schema files
SCHEMA_COUNT=$(find docs/data/schemas -name "*.sql" | wc -l)
echo -e "${BLUE}   Found ${SCHEMA_COUNT} schema files in docs/data/schemas${NC}"

# Check for existing schemas in supabase folder
EXISTING_SCHEMAS=$(find supabase/schemas -name "*.sql" 2>/dev/null | wc -l)
if [ $EXISTING_SCHEMAS -gt 0 ]; then
    echo -e "${YELLOW}   Found ${EXISTING_SCHEMAS} existing schema files in supabase/schemas${NC}"
    echo -e "${YELLOW}⚠️  Warning: This will overwrite existing schema files${NC}"
    read -p "   Do you want to continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚫 Operation cancelled${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}📁 Copying schema files...${NC}"

# Copy all SQL files from docs to supabase
cp docs/data/schemas/*.sql supabase/schemas/ 2>/dev/null || true

# Copy README for documentation
if [ -f "docs/data/schemas/README.md" ]; then
    cp docs/data/schemas/README.md supabase/schemas/
    echo -e "${GREEN}   ✅ Copied README.md${NC}"
fi

# List copied files
echo -e "${GREEN}   ✅ Copied schema files:${NC}"
for file in supabase/schemas/*.sql; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}      - $(basename "$file")${NC}"
    fi
done

echo -e "${BLUE}🔄 Checking Supabase project status...${NC}"

# Check if supabase is initialized
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Supabase project not initialized${NC}"
    echo "   Run 'supabase init' first"
    exit 1
fi

# Check if local database is running
if ! supabase status --output pretty | grep -q "API URL"; then
    echo -e "${YELLOW}⚠️  Local Supabase is not running${NC}"
    read -p "   Start local Supabase? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Starting Supabase...${NC}"
        supabase start
    else
        echo -e "${YELLOW}📝 Note: Start Supabase later with 'supabase start'${NC}"
    fi
fi

echo -e "${BLUE}📊 Generating migration from schemas...${NC}"

# Generate migration name with timestamp
MIGRATION_NAME="initial_service_center_schema"
if [ $EXISTING_SCHEMAS -gt 0 ]; then
    MIGRATION_NAME="update_service_center_schema"
fi

# Generate migration
if supabase db diff -f "$MIGRATION_NAME" --schema-only; then
    echo -e "${GREEN}   ✅ Migration generated successfully${NC}"
    
    # Show the generated migration
    LATEST_MIGRATION=$(ls -t supabase/migrations/*.sql 2>/dev/null | head -n1)
    if [ -f "$LATEST_MIGRATION" ]; then
        echo -e "${BLUE}   📄 Generated migration: $(basename "$LATEST_MIGRATION")${NC}"
        
        read -p "   Do you want to apply this migration now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🔄 Applying migration...${NC}"
            if supabase migration up; then
                echo -e "${GREEN}   ✅ Migration applied successfully${NC}"
            else
                echo -e "${RED}   ❌ Failed to apply migration${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}   📝 Apply migration later with 'supabase migration up'${NC}"
        fi
    fi
else
    echo -e "${YELLOW}   ⚠️  No changes detected or migration failed${NC}"
    echo -e "${YELLOW}   This might happen if schemas are already applied${NC}"
fi

echo -e "${GREEN}🎉 Schema setup completed!${NC}"
echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}   1. Review the generated migration file${NC}"
echo -e "${BLUE}   2. Test the schema in local environment${NC}"
echo -e "${BLUE}   3. When ready, deploy to production:${NC}"
echo -e "${BLUE}      supabase db push${NC}"
echo
echo -e "${BLUE}📚 Useful commands:${NC}"
echo -e "${BLUE}   - View local dashboard: supabase start${NC}"
echo -e "${BLUE}   - Reset database: supabase db reset${NC}"
echo -e "${BLUE}   - Generate new migration: supabase db diff -f migration_name${NC}"
echo -e "${BLUE}   - Deploy to production: supabase db push${NC}"

exit 0