#!/bin/bash

# Service Center - Production Schema Deployment Script
# Simple script to apply database schemas to Docker production instance

set -e

echo "🚀 Service Center - Schema Deployment"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if database container is running
if ! docker compose ps db | grep -q "Up\|running"; then
    echo -e "${RED}❌ Error: Database container is not running${NC}"
    echo "Start it with: docker compose up -d db"
    exit 1
fi

echo -e "${BLUE}📊 Database Status:${NC}"
docker compose ps db
echo ""

# Auto-detect all schema files in numerical order (100-900)
# Files are processed in order: 100 (ENUMs) → 150 (Functions) → 200-206 (Tables)
# → 300-301 (Constraints) → 500-502 (Functions) → 600-610 (Triggers)
# → 700-701 (Views) → 800-802 (RLS) → 900-903 (Seed)
SCHEMA_FILES=($(cd docs/data/schemas && ls [1-9]*.sql 2>/dev/null | sort -V))

echo -e "${YELLOW}⚠️  This will apply schema files to the production database${NC}"
echo -e "${YELLOW}   Make sure you have a backup before proceeding!${NC}"
echo ""
read -p "Continue? [y/N]: " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Applying schema files...${NC}"
echo ""

# Apply each schema file
for file in "${SCHEMA_FILES[@]}"; do
    if [ -f "docs/data/schemas/$file" ]; then
        echo -e "${BLUE}→ Applying $file...${NC}"

        if docker compose exec -T db psql -U postgres -d postgres < "docs/data/schemas/$file" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ $file applied successfully${NC}"
        else
            echo -e "${YELLOW}  ⚠️  $file - may already exist or had errors (continuing...)${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️  $file not found, skipping${NC}"
    fi
done

echo ""
echo -e "${BLUE}🪣 Creating storage buckets...${NC}"

if [ -f "docs/data/seeds/storage_buckets.sql" ]; then
    if docker compose exec -T db psql -U postgres -d postgres < "docs/data/seeds/storage_buckets.sql" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Storage buckets created${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Storage buckets may already exist (continuing...)${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  storage_buckets.sql not found, skipping${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo ""

# Verify tables
echo -e "${BLUE}Tables created:${NC}"
TABLE_COUNT=$(docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -ge 30 ]; then
    echo -e "${GREEN}  ✓ $TABLE_COUNT tables created${NC}"
else
    echo -e "${YELLOW}  ⚠️  Only $TABLE_COUNT tables found (expected 30+)${NC}"
fi

echo ""
echo -e "${BLUE}Storage policies:${NC}"
POLICY_COUNT=$(docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';" 2>/dev/null || echo "0")
if [ "$POLICY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}  ✓ $POLICY_COUNT storage policies active${NC}"
else
    echo -e "${YELLOW}  ⚠️  No storage policies found${NC}"
fi

echo ""
echo -e "${BLUE}RBAC functions:${NC}"
RBAC_COUNT=$(docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role');" 2>/dev/null || echo "0")
if [ "$RBAC_COUNT" -ge 3 ]; then
    echo -e "${GREEN}  ✓ $RBAC_COUNT RBAC functions verified${NC}"
else
    echo -e "${YELLOW}  ⚠️  Only $RBAC_COUNT RBAC functions found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Schema deployment completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify tables: docker compose exec db psql -U postgres -c '\dt'"
echo "  2. Access setup: https://your-domain.com/setup"
echo "  3. Create admin user and start using the app"
echo ""
