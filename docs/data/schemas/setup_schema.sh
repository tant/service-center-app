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

# Copy schema files (simple copy of all .sql files)
echo -e "${BLUE}📁 Copying schema files...${NC}"
cp docs/data/schemas/*.sql supabase/schemas/ 2>/dev/null || true
[ -f "docs/data/schemas/README.md" ] && cp docs/data/schemas/README.md supabase/schemas/
echo -e "${GREEN}✅ Schema files copied${NC}"

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

echo -e "${GREEN}🎉 Schema setup completed!${NC}"
echo
exit 0