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

# Schema files in order
SCHEMA_FILES=(
    "00_base_types.sql"
    "00_base_functions.sql"
    "core_01_profiles.sql"
    "core_02_customers.sql"
    "core_03_brands.sql"
    "core_04_products.sql"
    "core_05_parts.sql"
    "core_06_product_parts.sql"
    "core_07_service_tickets.sql"
    "core_08_service_ticket_parts.sql"
    "core_09_service_ticket_comments.sql"
    "core_10_service_ticket_attachments.sql"
    "functions_inventory.sql"
    "storage_policies.sql"
)

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
docker compose exec -T db psql -U postgres -d postgres -c "\dt public.*" | grep -E "profiles|customers|products|parts|service_tickets" || echo "  (checking...)"

echo ""
echo -e "${BLUE}Storage policies:${NC}"
POLICY_COUNT=$(docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage';" 2>/dev/null || echo "0")
echo "  Found $POLICY_COUNT storage policies"

echo ""
echo -e "${GREEN}🎉 Schema deployment completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify tables: docker compose exec db psql -U postgres -c '\dt'"
echo "  2. Access setup: https://your-domain.com/setup"
echo "  3. Create admin user and start using the app"
echo ""
