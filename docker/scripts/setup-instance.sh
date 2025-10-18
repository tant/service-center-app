#!/bin/bash

# Service Center - Instance Setup Script
# Automates steps 1.2, 1.4, 1.5, 1.6 from DEPLOYMENT.md
#
# Usage:
#   1. Edit the configuration variables below
#   2. Run: ./docker/scripts/setup-instance.sh

set -e

############################################
# CONFIGURATION - EDIT THESE VALUES
############################################

# Instance Information
CENTER_NAME="Tân test Service Center"
APP_PORT=3025          # App runs on http://localhost:3025

# Site URL (configure your Cloudflare Tunnel to point to http://localhost:${APP_PORT})
# IMPORTANT: Enter DOMAIN ONLY - do NOT include http:// or https://
# For production: sv.mydomain.com (script will add https://)
# For local: localhost (script will add http://localhost:${APP_PORT})
# Examples:
#   ✓ Correct: sv.mydomain.com
#   ✓ Correct: localhost
#   ✗ Wrong: https://sv.mydomain.com
#   ✗ Wrong: http://localhost:3025
SITE_URL=sv.tantran.dev

# Setup Password (leave empty to auto-generate)
SETUP_PASSWORD=tantran

# SMTP Configuration
SMTP_HOST="supabase-mail"
SMTP_PORT=2500
SMTP_USER="fake_mail_user"
SMTP_PASS="fake_mail_password"
SMTP_ADMIN_EMAIL="admin@example.com"
SMTP_SENDER_NAME="${CENTER_NAME}"

############################################
# END CONFIGURATION
############################################
# Everything below is auto-calculated - do not edit

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Service Center - Instance Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

############################################
# Auto-calculate all derived values
############################################

# Studio port auto-calculated from APP_PORT
# APP_PORT=3025 → STUDIO_PORT=3000
# APP_PORT=3026 → STUDIO_PORT=3100
# APP_PORT=3027 → STUDIO_PORT=3200
STUDIO_PORT=$((3000 + (APP_PORT - 3025) * 100))

# Kong port auto-calculated from APP_PORT
# APP_PORT=3025 → KONG_PORT=8000
# APP_PORT=3026 → KONG_PORT=8001
# APP_PORT=3027 → KONG_PORT=8002
KONG_PORT=$((8000 + APP_PORT - 3025))

# Clean up SITE_URL - remove any http:// or https:// prefix if provided
SITE_URL="${SITE_URL#http://}"
SITE_URL="${SITE_URL#https://}"

# Build URLs based on SITE_URL
if [[ "$SITE_URL" == "localhost" ]]; then
    # Local development mode
    SITE_URL="http://localhost:${APP_PORT}"
    API_EXTERNAL_URL="http://localhost:${KONG_PORT}"
    SUPABASE_EXTERNAL_URL="http://localhost:${STUDIO_PORT}"
else
    # Production mode with domain
    API_EXTERNAL_URL="https://api.${SITE_URL}"
    SUPABASE_EXTERNAL_URL="https://supabase.${SITE_URL}"
    SITE_URL="https://${SITE_URL}"
fi

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file already exists${NC}"
    read -p "Do you want to overwrite it? [y/N]: " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Cancelled"
        exit 0
    fi
    echo ""
fi

echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo ""
echo -e "${GREEN}Instance:${NC}"
echo "  Center Name: ${CENTER_NAME}"
echo "  App Port: ${APP_PORT}"
echo "  Studio Port: ${STUDIO_PORT} (auto-calculated)"
echo "  Kong Port: ${KONG_PORT} (auto-calculated)"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo "  Site: ${SITE_URL}"
echo "  API: ${API_EXTERNAL_URL}"
echo "  Studio: ${SUPABASE_EXTERNAL_URL}"
echo ""
echo -e "${GREEN}SMTP:${NC}"
echo "  Host: ${SMTP_HOST}:${SMTP_PORT}"
echo "  Admin: ${SMTP_ADMIN_EMAIL}"
echo ""
if [[ "$SITE_URL" == https://* ]]; then
    # Extract domain from SITE_URL for Cloudflare instructions
    DOMAIN="${SITE_URL#https://}"
    echo -e "${YELLOW}⚠️  Cloudflare Tunnel Required:${NC}"
    echo "  Configure these tunnels pointing to localhost:"
    echo "    ${DOMAIN} → localhost:${APP_PORT}"
    echo "    api.${DOMAIN} → localhost:${KONG_PORT}"
    echo "    supabase.${DOMAIN} → localhost:${STUDIO_PORT}"
    echo ""
fi

# Step 1.2: Generate Secrets
echo -e "${BLUE}🔑 Step 1.2: Generating secrets...${NC}"

if [ -z "$SETUP_PASSWORD" ]; then
    SETUP_PASSWORD=$(openssl rand -hex 16)
    echo -e "${GREEN}  ✓ Generated SETUP_PASSWORD${NC}"
else
    echo -e "${GREEN}  ✓ Using provided SETUP_PASSWORD${NC}"
fi

POSTGRES_PASSWORD=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated POSTGRES_PASSWORD${NC}"

JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated JWT_SECRET${NC}"

PG_META_CRYPTO_KEY=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated PG_META_CRYPTO_KEY${NC}"

VAULT_ENC_KEY=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated VAULT_ENC_KEY${NC}"

SECRET_KEY_BASE=$(openssl rand -hex 64)
echo -e "${GREEN}  ✓ Generated SECRET_KEY_BASE${NC}"

LOGFLARE_PUBLIC_ACCESS_TOKEN=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated LOGFLARE_PUBLIC_ACCESS_TOKEN${NC}"

LOGFLARE_PRIVATE_ACCESS_TOKEN=$(openssl rand -hex 32)
echo -e "${GREEN}  ✓ Generated LOGFLARE_PRIVATE_ACCESS_TOKEN${NC}"

DASHBOARD_PASSWORD=$(openssl rand -hex 16)
echo -e "${GREEN}  ✓ Generated DASHBOARD_PASSWORD${NC}"

echo ""

# Step 1.4: Setup Volume Directories
echo -e "${BLUE}📦 Step 1.4: Setting up volume directories...${NC}"

# Copy configuration files from docs/references
if [ -d "docs/references/volumes" ]; then
    cp -r docs/references/volumes/* volumes/
    echo -e "${GREEN}  ✓ Copied configuration files from docs/references/volumes${NC}"
else
    echo -e "${YELLOW}  ⚠️  docs/references/volumes not found, skipping...${NC}"
fi

# Create runtime directories
mkdir -p volumes/db/data
mkdir -p volumes/storage
echo -e "${GREEN}  ✓ Created runtime directories${NC}"

# Verify critical files
if [ -f "volumes/logs/vector.yml" ]; then
    echo -e "${GREEN}  ✓ vector.yml OK${NC}"
else
    echo -e "${RED}  ❌ vector.yml MISSING${NC}"
    exit 1
fi

if [ -f "volumes/api/kong.yml" ]; then
    echo -e "${GREEN}  ✓ kong.yml OK${NC}"
else
    echo -e "${RED}  ❌ kong.yml MISSING${NC}"
    exit 1
fi

echo ""

# Step 1.5: Configure .env
echo -e "${BLUE}⚙️  Step 1.5: Creating .env file...${NC}"

cat > .env <<EOF
# Environment Variables for Docker Deployment
# Generated by setup-instance.sh on $(date)

############################################
# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
#
# IMPORTANT: Use hex format for all secrets (URL-safe)
# Generate with: openssl rand -hex <bytes>
# See DEPLOYMENT.md Step 1.2 for details
############################################

# Database
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# JWT Secret (used to generate Supabase keys)
JWT_SECRET=${JWT_SECRET}

# Supabase Keys (generated from JWT_SECRET using generate-keys.js)
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase Infrastructure
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SECRET_KEY_BASE=${SECRET_KEY_BASE}
VAULT_ENC_KEY=${VAULT_ENC_KEY}
PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY}

############################################
# Application Settings
############################################

# Setup password for /setup endpoint
SETUP_PASSWORD=${SETUP_PASSWORD}

# Application port (exposed to host)
APP_PORT=${APP_PORT}

# Kong API Gateway port (exposed to host)
# Required for browser access to Supabase
KONG_PORT=${KONG_PORT}

############################################
# Database Configuration
############################################

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432  # Internal port only (not exposed to host)
# default user is postgres

############################################
# Supavisor -- Database pooler
############################################

# Maximum number of PostgreSQL connections Supavisor opens per pool
POOLER_DEFAULT_POOL_SIZE=20
# Maximum number of client connections Supavisor accepts per pool
POOLER_MAX_CLIENT_CONN=100
# Unique tenant identifier
POOLER_TENANT_ID=service-center-${APP_PORT}
# Pool size for internal metadata storage used by Supavisor
POOLER_DB_POOL_SIZE=5

############################################
# API - Configuration for PostgREST
############################################

PGRST_DB_SCHEMAS=public,storage,graphql_public

############################################
# Auth - Configuration for GoTrue
############################################

## General
SITE_URL=${SITE_URL}
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=${SITE_URL}

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=${SMTP_ADMIN_EMAIL}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_SENDER_NAME=${SMTP_SENDER_NAME}
ENABLE_ANONYMOUS_USERS=false

## Phone auth
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true

############################################
# Studio Configuration
############################################

STUDIO_DEFAULT_ORGANIZATION=${CENTER_NAME}
STUDIO_DEFAULT_PROJECT=Production

# Studio port (exposed to host)
STUDIO_PORT=${STUDIO_PORT}

# Supabase Public URL for Studio (points to Kong Gateway)
SUPABASE_PUBLIC_URL=${API_EXTERNAL_URL}

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Add your OpenAI API key to enable SQL Editor Assistant
OPENAI_API_KEY=

############################################
# Functions - Configuration for Functions
############################################

# NOTE: VERIFY_JWT applies to all functions. Per-function VERIFY_JWT is not supported yet.
FUNCTIONS_VERIFY_JWT=false

############################################
# Logs - Configuration for Analytics
############################################

# Change vector.toml sinks to reflect this change
# these cannot be the same value
LOGFLARE_PUBLIC_ACCESS_TOKEN=${LOGFLARE_PUBLIC_ACCESS_TOKEN}
LOGFLARE_PRIVATE_ACCESS_TOKEN=${LOGFLARE_PRIVATE_ACCESS_TOKEN}

# Docker socket location - this value will differ depending on your OS
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# Google Cloud Project details (optional - for BigQuery analytics)
GOOGLE_PROJECT_ID=GOOGLE_PROJECT_ID
GOOGLE_PROJECT_NUMBER=GOOGLE_PROJECT_NUMBER

############################################
# Next.js Application
############################################

# Public Supabase URL (for client-side browser access)
# Browser needs to access this URL, so use localhost or public domain
# For local: http://localhost:8000 (matches KONG_PORT)
# For production: https://api.yourdomain.com (via Cloudflare Tunnel)
NEXT_PUBLIC_SUPABASE_URL=${API_EXTERNAL_URL}

EOF

echo -e "${GREEN}  ✓ .env file created${NC}"
echo ""

# Step 1.6: Install Dependencies & Generate API Keys
echo -e "${BLUE}🔧 Step 1.6: Installing dependencies & generating API keys...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}  → Installing jsonwebtoken...${NC}"
    npm install jsonwebtoken
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}  ✓ Dependencies already installed${NC}"
fi

echo -e "${BLUE}  → Generating Supabase API keys...${NC}"

# Generate API keys using the script
API_KEYS=$(node docker/scripts/generate-keys.js "${JWT_SECRET}" 2>&1)

# Extract keys from output
SUPABASE_ANON_KEY=$(echo "$API_KEYS" | grep "SUPABASE_ANON_KEY=" | cut -d'=' -f2)
SUPABASE_SERVICE_ROLE_KEY=$(echo "$API_KEYS" | grep "SUPABASE_SERVICE_ROLE_KEY=" | cut -d'=' -f2)

if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}  ❌ Failed to generate API keys${NC}"
    echo "$API_KEYS"
    exit 1
fi

# Update .env with generated keys
sed -i "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}|" .env
sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}|" .env

echo -e "${GREEN}  ✓ API keys generated and added to .env${NC}"
echo ""

# Generate instance info summary file
echo -e "${BLUE}📝 Step 1.7: Generating instance info file...${NC}"

cat > INSTANCE_INFO.txt <<EOF
================================================================================
SERVICE CENTER INSTANCE INFORMATION
================================================================================
Generated: $(date)

================================================================================
INSTANCE CONFIGURATION
================================================================================

Center Name:           ${CENTER_NAME}
App Port:              ${APP_PORT}
Studio Port:           ${STUDIO_PORT} (auto-calculated)
Kong Port:             ${KONG_PORT} (auto-calculated)

================================================================================
URLS & DOMAINS
================================================================================

Application URL:       ${SITE_URL}
Supabase API URL:      ${API_EXTERNAL_URL}
Supabase Studio URL:   ${SUPABASE_EXTERNAL_URL}

EOF

# Add Cloudflare Tunnel instructions if production
if [[ "$SITE_URL" == https://* ]]; then
    DOMAIN="${SITE_URL#https://}"
    cat >> INSTANCE_INFO.txt <<EOF
================================================================================
CLOUDFLARE TUNNEL CONFIGURATION
================================================================================

Required tunnels pointing to localhost:

1. Main Application:
   ${DOMAIN} → localhost:${APP_PORT}

2. Supabase API (Kong):
   api.${DOMAIN} → localhost:${KONG_PORT}

3. Supabase Studio:
   supabase.${DOMAIN} → localhost:${STUDIO_PORT}

Example cloudflared config.yml:
---
ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${APP_PORT}
  - hostname: api.${DOMAIN}
    service: http://localhost:${KONG_PORT}
  - hostname: supabase.${DOMAIN}
    service: http://localhost:${STUDIO_PORT}
  - service: http_status:404

EOF
fi

cat >> INSTANCE_INFO.txt <<EOF
================================================================================
SECRETS & CREDENTIALS
================================================================================

Setup Password:        ${SETUP_PASSWORD}

Database:
  Host:                db (internal)
  Port:                5432 (internal)
  Database:            postgres
  User:                postgres
  Password:            ${POSTGRES_PASSWORD}

Supabase Dashboard:
  Username:            ${DASHBOARD_USERNAME}
  Password:            ${DASHBOARD_PASSWORD}

Supabase API Keys:
  Anon Key:            ${SUPABASE_ANON_KEY}
  Service Role Key:    ${SUPABASE_SERVICE_ROLE_KEY}

JWT Secret:            ${JWT_SECRET}

================================================================================
SMTP CONFIGURATION
================================================================================

Host:                  ${SMTP_HOST}
Port:                  ${SMTP_PORT}
User:                  ${SMTP_USER}
Password:              ${SMTP_PASS}
Admin Email:           ${SMTP_ADMIN_EMAIL}
Sender Name:           ${SMTP_SENDER_NAME}

================================================================================
ACCESS INFORMATION
================================================================================

Setup Page:            ${SITE_URL}/setup
                       Password: ${SETUP_PASSWORD}

Login Page:            ${SITE_URL}/login

Supabase Studio:       ${SUPABASE_EXTERNAL_URL}
                       Username: ${DASHBOARD_USERNAME}
                       Password: ${DASHBOARD_PASSWORD}

Database (via pooler): localhost:${POSTGRES_PORT}
                       (Only accessible when services are running)

================================================================================
IMPORTANT SECURITY NOTES
================================================================================

⚠️  KEEP THIS FILE SECURE - It contains sensitive credentials!
⚠️  Do NOT commit INSTANCE_INFO.txt to git
⚠️  Change default passwords before going to production
⚠️  Restrict Supabase Studio access in production (use Cloudflare Access)

================================================================================
NEXT STEPS
================================================================================

1. Review .env file:
   nano .env

2. Build and start services:
   docker compose build
   docker compose up -d

3. Apply database schema:
   ./docker/scripts/apply-schema.sh

4. Access setup page:
   ${SITE_URL}/setup
   Use setup password: ${SETUP_PASSWORD}

================================================================================
END OF INSTANCE INFORMATION
================================================================================
EOF

echo -e "${GREEN}  ✓ Instance info saved to INSTANCE_INFO.txt${NC}"
echo ""

# Summary
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo ""
echo -e "${BLUE}Instance Configuration:${NC}"
echo "  Center Name: ${CENTER_NAME}"
echo "  App Port: ${APP_PORT}"
echo "  Studio Port: ${STUDIO_PORT} (auto-calculated)"
echo "  Kong Port: ${KONG_PORT} (auto-calculated)"
echo "  Site URL: ${SITE_URL}"
echo ""
echo -e "${BLUE}Setup Password:${NC}"
echo "  ${SETUP_PASSWORD}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "${YELLOW}  • All credentials saved to INSTANCE_INFO.txt${NC}"
echo -e "${YELLOW}  • Keep this file secure - do NOT commit to git!${NC}"
echo -e "${YELLOW}  • Review with: cat INSTANCE_INFO.txt${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "  1. Review instance info: cat INSTANCE_INFO.txt"
echo "  2. Review .env file: nano .env"
echo "  3. Build and start services:"
echo "     docker compose build"
echo "     docker compose up -d"
echo ""
echo "  4. Apply database schema:"
echo "     ./docker/scripts/apply-schema.sh"
echo ""
echo "  5. Access setup page:"
echo "     ${SITE_URL}/setup"
echo "     Use setup password: ${SETUP_PASSWORD}"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
echo ""
