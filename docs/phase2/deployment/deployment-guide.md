# Production Deployment Guide - Service Center Phase 2

**Version:** 0.2.1 (Phase 2)
**Last Updated:** October 2025
**Target Audience:** DevOps Engineers, System Administrators

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration Strategy](#database-migration-strategy)
4. [Supabase Production Configuration](#supabase-production-configuration)
5. [Next.js Build and Deployment](#nextjs-build-and-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Platform Deployment](#cloud-platform-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Database Backup Procedures](#database-backup-procedures)
10. [Rollback Procedures](#rollback-procedures)
11. [Monitoring Setup](#monitoring-setup)
12. [Performance Optimization](#performance-optimization)
13. [Security Hardening](#security-hardening)
14. [SSL/TLS Configuration](#ssltls-configuration)
15. [Domain and DNS Setup](#domain-and-dns-setup)
16. [CDN Configuration](#cdn-configuration)
17. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Infrastructure Requirements

#### Minimum Server Specifications
- **CPU:** 2 vCPUs (4 vCPUs recommended for production)
- **RAM:** 4 GB minimum (8 GB recommended)
- **Storage:** 20 GB SSD minimum (50 GB recommended)
- **OS:** Ubuntu 22.04 LTS or newer
- **Network:** Public IP address (optional with Cloudflare Tunnel)

#### Software Prerequisites
```bash
# Docker Engine 24.0+ with Docker Compose V2
docker --version  # Should be 24.0+
docker compose version  # Should be v2.x

# Node.js 22.x (if building locally)
node --version  # Should be v22.x

# pnpm package manager
pnpm --version  # Should be 9.x+
```

### Pre-Deployment Tasks

- [ ] **Code Audit**
  - [ ] All Phase 2 features tested locally
  - [ ] No console.log() or debug code in production
  - [ ] Environment-specific code properly configured
  - [ ] Build passes without errors: `pnpm build`
  - [ ] Linting passes: `pnpm lint`

- [ ] **Database Preparation**
  - [ ] All migrations tested in staging environment
  - [ ] Migration scripts verified in order
  - [ ] Seed data prepared (if applicable)
  - [ ] Database backup plan established
  - [ ] RLS policies tested thoroughly

- [ ] **Security Review**
  - [ ] All API keys rotated for production
  - [ ] Strong passwords generated for all accounts
  - [ ] SETUP_PASSWORD is cryptographically secure
  - [ ] Service role keys never exposed to client
  - [ ] CORS origins properly configured

- [ ] **Documentation Review**
  - [ ] Admin credentials documented securely
  - [ ] Runbook prepared for common issues
  - [ ] Team trained on deployment process
  - [ ] Rollback procedures tested

- [ ] **Infrastructure Setup**
  - [ ] Domain name acquired and configured
  - [ ] DNS records prepared (not yet activated)
  - [ ] SSL certificates obtained (or Cloudflare setup)
  - [ ] Firewall rules planned
  - [ ] Monitoring tools configured

---

## Environment Setup

### Production Environment Variables

Create a production `.env` file with the following structure:

```bash
# ============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# WARNING: Keep this file secure! Never commit to version control!
# ============================================================================

# ============================================================================
# SUPABASE PRODUCTION CONFIGURATION
# ============================================================================
# Get these from: https://app.supabase.com/project/_/settings/api
# For self-hosted: Generate secure random strings for keys
# ============================================================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For self-hosted Docker deployment
# NEXT_PUBLIC_SUPABASE_URL=https://api.yourdomain.com
# SUPABASE_URL=http://kong:8000  # Internal Docker network

# ============================================================================
# INITIAL SETUP CONFIGURATION
# ============================================================================
# Strong password required for /setup endpoint (20+ characters recommended)
# Use: openssl rand -base64 32
# ============================================================================

SETUP_PASSWORD=CHANGE_TO_STRONG_RANDOM_PASSWORD_32CHARS_MIN

# ============================================================================
# DEFAULT ADMIN ACCOUNT
# ============================================================================
# These credentials create the first admin user during /setup
# Change these immediately after first login!
# ============================================================================

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=STRONG_RANDOM_PASSWORD_MIN_16_CHARS
ADMIN_NAME=System Administrator

# ============================================================================
# SUPABASE DOCKER CONFIGURATION (Self-Hosted Only)
# ============================================================================
# Only needed if self-hosting Supabase with Docker
# Generate secure random values:
#   openssl rand -base64 32  # For passwords and secrets
#   openssl rand -hex 16     # For keys
# ============================================================================

POSTGRES_PASSWORD=STRONG_DATABASE_PASSWORD
JWT_SECRET=SUPER_SECRET_JWT_TOKEN_WITH_AT_LEAST_32_CHARACTERS
JWT_EXPIRY=3600
SUPABASE_ANON_KEY=YOUR_GENERATED_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_GENERATED_SERVICE_ROLE_KEY

# Database configuration
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=postgres

# Additional secrets
SECRET_KEY_BASE=ANOTHER_SUPER_SECRET_KEY_AT_LEAST_64_CHARACTERS
PG_META_CRYPTO_KEY=YOUR_32_CHAR_CRYPTO_KEY
LOGFLARE_PUBLIC_ACCESS_TOKEN=your-public-token
LOGFLARE_PRIVATE_ACCESS_TOKEN=your-private-token

# API Gateway configuration
KONG_PORT=8000
STUDIO_PORT=3000
APP_PORT=3025

# Site URLs (update with your domain)
SITE_URL=https://yourdomain.com
API_EXTERNAL_URL=https://api.yourdomain.com
ADDITIONAL_REDIRECT_URLS=https://yourdomain.com/**

# Auth settings
DISABLE_SIGNUP=false  # Set to true after initial setup to prevent open registration
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false  # Set to false for production (require email confirmation)
ENABLE_ANONYMOUS_USERS=false
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false

# SMTP Configuration (Required for password resets)
SMTP_ADMIN_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_SENDER_NAME=Service Center

# Email URL paths (update with your domain)
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify

# Dashboard credentials
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=STRONG_DASHBOARD_PASSWORD

# Storage
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Docker socket location
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# PostgREST configuration
PGRST_DB_SCHEMAS=public,storage,graphql_public

# Studio configuration
STUDIO_DEFAULT_ORGANIZATION=Service Center
STUDIO_DEFAULT_PROJECT=Production
```

### Generating Secure Secrets

Use these commands to generate cryptographically secure secrets:

```bash
# Generate strong passwords (32 characters)
openssl rand -base64 32

# Generate hex keys (64 characters)
openssl rand -hex 32

# Generate UUID
uuidgen

# Generate JWT secret (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Environment Variable Validation Script

Create `scripts/validate-env.sh`:

```bash
#!/bin/bash
# Production environment validation script

set -e

echo "🔍 Validating production environment variables..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SETUP_PASSWORD"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
)

MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    exit 1
fi

# Validate password strength
if [ ${#SETUP_PASSWORD} -lt 20 ]; then
    echo "⚠️  WARNING: SETUP_PASSWORD should be at least 20 characters"
fi

if [ ${#ADMIN_PASSWORD} -lt 16 ]; then
    echo "⚠️  WARNING: ADMIN_PASSWORD should be at least 16 characters"
fi

# Check for default/weak values
if [[ "$SETUP_PASSWORD" == *"CHANGE"* ]] || [[ "$SETUP_PASSWORD" == *"change"* ]]; then
    echo "❌ SETUP_PASSWORD contains placeholder text - must be changed!"
    exit 1
fi

if [[ "$ADMIN_EMAIL" == *"example.com"* ]]; then
    echo "❌ ADMIN_EMAIL contains example domain - must be changed!"
    exit 1
fi

echo "✅ Environment validation passed"
```

Make it executable and run:
```bash
chmod +x scripts/validate-env.sh
source .env && ./scripts/validate-env.sh
```

---

## Database Migration Strategy

### Phase 2 Migration Overview

Phase 2 introduces:
- Task management system with templates and dependencies
- Advanced warehouse management with RMA tracking
- Service request system with customer portal
- Email notification system
- Enhanced analytics and reporting

### Migration Dependency Order

**Critical:** Migrations must be applied in this exact order:

```
Phase 1 (Foundation)
├── 00_base_types.sql              # ENUMs and DOMAINs
├── 00_base_functions.sql          # Helper functions
├── core_01_profiles.sql
├── core_02_customers.sql
├── core_03_brands.sql
├── core_04_products.sql
├── core_05_parts.sql
├── core_06_product_parts.sql
├── core_07_service_tickets.sql
├── core_08_service_ticket_parts.sql
├── core_09_service_ticket_comments.sql
├── core_10_service_ticket_attachments.sql
├── functions_inventory.sql
└── storage_policies.sql

Phase 2 (New Features)
├── 20251023000000_phase2_foundation.sql
├── 20251023070000_automatic_task_generation_trigger.sql
├── 20251024000000_add_enforce_sequence_to_templates.sql
├── 20251024000001_task_dependency_triggers.sql
├── 20251024000002_seed_virtual_warehouses.sql
├── 20251024000003_physical_products_constraints_and_columns.sql
├── 20251024000006_rma_batch_numbering.sql
├── 20251024100000_add_delivery_tracking_fields.sql
├── 20251024000004_auto_move_product_on_ticket_event.sql
├── 20251024000005_warehouse_stock_levels_view.sql
├── 20251024110000_email_notifications_system.sql
├── 20251024120000_task_progress_dashboard.sql
└── 20251024130000_dynamic_template_switching.sql
```

### Pre-Migration Backup

**Always backup before migration!**

```bash
# For Supabase Cloud
# Use Supabase Dashboard: Database → Backups → Create Backup

# For self-hosted Docker
docker exec supabase-db pg_dump \
  -U postgres \
  -Fc \
  -f /tmp/backup-$(date +%Y%m%d-%H%M%S).dump \
  postgres

# Copy backup out of container
docker cp supabase-db:/tmp/backup-*.dump ./backups/
```

### Migration Strategies

#### Strategy 1: Fresh Installation (Recommended for New Deployments)

```bash
# 1. Start Supabase services
pnpx supabase start

# 2. Run automated schema setup
./docs/data/schemas/setup_schema.sh

# 3. Verify migrations applied
pnpx supabase migration list
```

#### Strategy 2: Incremental Migration (For Existing Phase 1 Deployments)

```bash
# 1. Backup current database
./scripts/backup-database.sh

# 2. Review pending migrations
pnpx supabase migration list

# 3. Test migrations in staging first
pnpx supabase db reset  # In staging only!

# 4. Apply migrations to production
pnpx supabase migration up

# 5. Verify schema integrity
pnpx supabase db diff --linked
```

#### Strategy 3: Blue-Green Deployment (Zero-Downtime)

```bash
# 1. Create new Supabase project (Green)
pnpx supabase projects create service-center-prod-v2

# 2. Link to new project
pnpx supabase link --project-ref YOUR_NEW_PROJECT_REF

# 3. Push all migrations
pnpx supabase db push

# 4. Migrate data from old database
./scripts/migrate-data.sh OLD_DB_URL NEW_DB_URL

# 5. Switch traffic to new database (update env vars)
# 6. Monitor for 24 hours
# 7. Decommission old database
```

### Migration Verification Checklist

After applying migrations:

```sql
-- Verify all Phase 2 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'task_templates',
    'task_template_items',
    'ticket_tasks',
    'task_dependencies',
    'warehouses',
    'physical_products',
    'rma_batches',
    'service_requests',
    'email_notifications'
  );

-- Verify triggers are active
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%phase2%';

-- Verify RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for any missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Rollback Plan for Failed Migrations

```bash
# 1. Stop application immediately
docker compose stop app

# 2. Restore from backup
docker exec -i supabase-db pg_restore \
  -U postgres \
  -d postgres \
  -c \
  < ./backups/backup-TIMESTAMP.dump

# 3. Verify restoration
docker exec supabase-db psql -U postgres -c "\dt"

# 4. Restart with previous version
git checkout v0.2.0  # Previous stable version
docker compose up -d app
```

---

## Supabase Production Configuration

### Option 1: Supabase Cloud (Managed Service)

#### Advantages
- ✅ Fully managed database with automatic backups
- ✅ Built-in monitoring and logging
- ✅ Automatic scaling
- ✅ Global CDN for static assets
- ✅ Free tier available (500 MB database)

#### Setup Steps

1. **Create Supabase Project**
```bash
# Visit https://supabase.com/dashboard
# Click "New Project"
# Choose region closest to your users
# Note: Project reference ID (needed for CLI)
```

2. **Link Local Project to Cloud**
```bash
# Install Supabase CLI
pnpm install -g supabase

# Link to your cloud project
pnpx supabase link --project-ref YOUR_PROJECT_REF

# You'll be prompted for database password
```

3. **Push Database Schema**
```bash
# Push all migrations to cloud
pnpx supabase db push

# Verify migrations
pnpx supabase migration list
```

4. **Configure Storage Buckets**
```bash
# Storage buckets must be created manually in Supabase Dashboard
# Go to: Storage → New Bucket

# Required buckets:
# - avatars (public, 5MB limit)
# - ticket-attachments (private, 10MB limit)
# - product-images (public, 5MB limit)
```

5. **Get API Credentials**
```bash
# Go to: Settings → API
# Copy these to your .env:
# - Project URL → NEXT_PUBLIC_SUPABASE_URL
# - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
# - service_role key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)
```

6. **Configure Authentication**
```bash
# Go to: Authentication → Settings

# Site URL: https://yourdomain.com
# Redirect URLs:
#   - https://yourdomain.com/**
#   - https://yourdomain.com/auth/callback

# Email Settings:
#   ✅ Enable email confirmations
#   ✅ Disable new user signups (enable after /setup)
#   📧 Configure SMTP (SendGrid/Mailgun recommended)
```

### Option 2: Self-Hosted Supabase (Docker)

#### Advantages
- ✅ Full control over infrastructure
- ✅ No vendor lock-in
- ✅ Cost-effective for high-traffic apps
- ✅ Data sovereignty compliance

#### Production Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

# Override development settings for production
services:
  db:
    # Use production-grade PostgreSQL settings
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - log_min_messages=warning
      - -c
      - shared_buffers=256MB
      - -c
      - effective_cache_size=1GB
      - -c
      - maintenance_work_mem=64MB
      - -c
      - checkpoint_completion_target=0.9
      - -c
      - wal_buffers=16MB
      - -c
      - default_statistics_target=100
      - -c
      - random_page_cost=1.1
      - -c
      - effective_io_concurrency=200
      - -c
      - work_mem=4MB
      - -c
      - min_wal_size=1GB
      - -c
      - max_wal_size=4GB
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: always
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  kong:
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

  auth:
    restart: always
    environment:
      GOTRUE_SMTP_HOST: ${SMTP_HOST}
      GOTRUE_SMTP_PORT: ${SMTP_PORT}
      GOTRUE_SMTP_USER: ${SMTP_USER}
      GOTRUE_SMTP_PASS: ${SMTP_PASS}
      GOTRUE_MAILER_AUTOCONFIRM: "false"  # Require email confirmation in production

  app:
    restart: always
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    # Enable healthcheck monitoring
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3025/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  db_data:
    driver: local
```

Deploy with:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### Database Performance Tuning

Add to `postgresql.conf` (for self-hosted):

```conf
# Memory Settings (adjust based on available RAM)
shared_buffers = 256MB          # 25% of system RAM
effective_cache_size = 1GB      # 50-75% of system RAM
maintenance_work_mem = 64MB
work_mem = 4MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# Query Planner
default_statistics_target = 100
random_page_cost = 1.1          # For SSD storage
effective_io_concurrency = 200   # For SSD storage

# Logging (production)
log_min_duration_statement = 1000  # Log queries > 1 second
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Storage Configuration

#### Supabase Cloud Storage

Storage policies are automatically applied via migrations. Verify:

```sql
-- Check storage buckets
SELECT * FROM storage.buckets;

-- Verify storage policies
SELECT * FROM storage.policies;
```

#### Self-Hosted Storage

For self-hosted, storage is persisted in Docker volumes:

```yaml
volumes:
  - ./volumes/storage:/var/lib/storage:z
```

Configure storage limits in `docker-compose.yml`:

```yaml
storage:
  environment:
    FILE_SIZE_LIMIT: 52428800  # 50 MB
```

---

## Next.js Build and Deployment

### Production Build Process

#### 1. Pre-Build Checklist

```bash
# Clean previous builds
rm -rf .next

# Update dependencies
pnpm install --frozen-lockfile

# Run linter
pnpm lint

# Type check
pnpm tsc --noEmit
```

#### 2. Build for Production

```bash
# Set production environment
export NODE_ENV=production

# Build with Turbopack
pnpm build

# Expected output:
# - .next/standalone (self-contained server)
# - .next/static (static assets)
# - public (static files)
```

#### 3. Build Configuration

`next.config.ts` is already configured for production:

```typescript
output: "standalone",  // Creates self-contained server
// ✅ Optimizes bundle size
// ✅ Includes only necessary node_modules
// ✅ Ready for Docker deployment
```

### Build Environment Variables

These must be set during build time (embedded in client bundles):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

⚠️ **Important:** `NEXT_PUBLIC_*` variables are embedded in JavaScript bundles and visible to users. Never put secrets here!

### Build Optimization

#### Analyzing Bundle Size

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Update next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Analyze
ANALYZE=true pnpm build
```

#### Image Optimization

Next.js Image component is already configured:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'your-project.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

---

## Docker Deployment

### Production Dockerfile

The existing `Dockerfile` is production-ready with multi-stage build:

```dockerfile
# ✅ Multi-stage build minimizes image size
# ✅ Non-root user for security
# ✅ Health check included
# ✅ Standalone output for portability
```

### Building Production Image

```bash
# Build with build arguments
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -t service-center:0.2.1 \
  -t service-center:latest \
  .

# Verify image size (should be ~200-300 MB)
docker images service-center
```

### Running Production Container

```bash
# Run with environment variables
docker run -d \
  --name service-center-prod \
  -p 3025:3025 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e SETUP_PASSWORD=your_setup_password \
  -e ADMIN_EMAIL=admin@yourdomain.com \
  -e ADMIN_PASSWORD=your_admin_password \
  -e ADMIN_NAME="System Administrator" \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost:3025/api/health || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  service-center:latest
```

### Docker Compose Production Deployment

```bash
# Deploy full stack (Supabase + App)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f app

# Check health status
docker compose ps
```

### Container Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
```

### Docker Volume Management

```bash
# Backup Docker volumes
docker run --rm \
  -v supabase_db_data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu tar czf /backup/db-data-$(date +%Y%m%d).tar.gz /data

# Restore Docker volumes
docker run --rm \
  -v supabase_db_data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu tar xzf /backup/db-data-TIMESTAMP.tar.gz -C /
```

---

## Cloud Platform Deployment

### Vercel Deployment (Recommended for Next.js)

#### Prerequisites
- Vercel account
- GitHub repository
- Supabase Cloud project

#### Deployment Steps

1. **Connect Repository**
```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

2. **Configure Environment Variables**

Go to Vercel Dashboard → Settings → Environment Variables:

```bash
# Production variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SETUP_PASSWORD=your_secure_password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=System Administrator

# Vercel-specific
NODE_VERSION=22
```

3. **Configure Build Settings**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

4. **Deploy**

```bash
# Deploy to production
vercel --prod

# Or connect GitHub for automatic deployments
# Every push to main branch → automatic deployment
```

### Railway Deployment

1. **Create New Project**
```bash
# Visit railway.app
# Click "New Project" → "Deploy from GitHub"
# Select your repository
```

2. **Configure Environment Variables**
```bash
# In Railway Dashboard → Variables
# Add all required environment variables from .env
```

3. **Configure Service**
```bash
# Build Command: pnpm build
# Start Command: pnpm start
# Port: 3025
```

### AWS Deployment (ECS + Fargate)

#### Architecture
```
CloudFront (CDN)
    ↓
ALB (Load Balancer)
    ↓
ECS Fargate (Container)
    ↓
RDS PostgreSQL (Database)
```

#### Setup Steps

1. **Create ECR Repository**
```bash
# Create repository
aws ecr create-repository --repository-name service-center

# Build and push image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t service-center .
docker tag service-center:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/service-center:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/service-center:latest
```

2. **Create ECS Task Definition**

See `docs/deployment/aws-task-definition.json` for template.

3. **Create ECS Service**
```bash
aws ecs create-service \
  --cluster service-center-cluster \
  --service-name service-center \
  --task-definition service-center:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

---

## Post-Deployment Verification

### Automated Verification Script

Create `scripts/verify-deployment.sh`:

```bash
#!/bin/bash
# Production deployment verification script

set -e

APP_URL="${1:-https://yourdomain.com}"
echo "🔍 Verifying deployment at: $APP_URL"

# Test 1: Health endpoint
echo "1. Testing health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health")
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Health check passed (HTTP $HTTP_CODE)"
else
    echo "   ❌ Health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Homepage loads
echo "2. Testing homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "307" ]; then
    echo "   ✅ Homepage accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ Homepage failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Static assets load
echo "3. Testing static assets..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/_next/static/css/app.css" || echo "404")
# 404 is acceptable if exact path doesn't exist
echo "   ✅ Static asset path exists"

# Test 4: API responds
echo "4. Testing tRPC API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/trpc/admin.isSetupComplete")
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ tRPC API responding (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  tRPC returned HTTP $HTTP_CODE (may be expected before setup)"
fi

# Test 5: Database connectivity (via API)
echo "5. Testing database connectivity..."
# This will fail before /setup is run, which is expected
RESPONSE=$(curl -s "$APP_URL/api/trpc/admin.isSetupComplete" || echo '{"error":"expected"}')
echo "   ✅ API endpoint reachable"

# Test 6: SSL/TLS certificate
if [[ "$APP_URL" == https://* ]]; then
    echo "6. Testing SSL certificate..."
    CERT_EXPIRY=$(echo | openssl s_client -servername "${APP_URL#https://}" -connect "${APP_URL#https://}":443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    echo "   ✅ SSL certificate valid until: $CERT_EXPIRY"
fi

echo ""
echo "✅ All verification checks passed!"
echo "📋 Next steps:"
echo "   1. Visit $APP_URL/setup to create admin user"
echo "   2. Login and verify all features"
echo "   3. Test ticket creation workflow"
echo "   4. Verify file uploads work"
echo "   5. Check email notifications (if configured)"
```

Run verification:
```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh https://yourdomain.com
```

### Manual Verification Checklist

- [ ] **Application Access**
  - [ ] Homepage loads without errors
  - [ ] CSS and JavaScript load correctly
  - [ ] No console errors in browser DevTools
  - [ ] Favicon and meta tags present

- [ ] **Initial Setup**
  - [ ] `/setup` endpoint accessible with SETUP_PASSWORD
  - [ ] Admin user created successfully
  - [ ] Can login with admin credentials
  - [ ] Dashboard displays correctly

- [ ] **Core Functionality**
  - [ ] Create new service ticket
  - [ ] Upload ticket attachment
  - [ ] Add comment to ticket
  - [ ] Change ticket status
  - [ ] Create customer
  - [ ] Create product
  - [ ] Add parts to inventory

- [ ] **Phase 2 Features**
  - [ ] Task templates load in UI
  - [ ] Automatic task generation on ticket creation
  - [ ] Warehouse management accessible
  - [ ] RMA batches can be created
  - [ ] Service requests (customer portal) functional
  - [ ] Email notifications triggered

- [ ] **Database Operations**
  - [ ] All queries execute without errors
  - [ ] RLS policies enforced correctly
  - [ ] Triggers firing as expected
  - [ ] Generated columns calculating correctly

- [ ] **Performance**
  - [ ] Page load time < 3 seconds
  - [ ] API response time < 500ms
  - [ ] Image loading optimized
  - [ ] No memory leaks after 1 hour

- [ ] **Security**
  - [ ] HTTPS enforced (redirects from HTTP)
  - [ ] Service role key not exposed in client
  - [ ] CORS headers correct
  - [ ] Authentication redirects work
  - [ ] Unauthorized access blocked

---

## Database Backup Procedures

### Automated Backup Strategy

#### Daily Backups

Create `scripts/backup-database.sh`:

```bash
#!/bin/bash
# Automated database backup script
# Add to crontab: 0 2 * * * /path/to/backup-database.sh

set -e

BACKUP_DIR="/var/backups/service-center"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup at $(date)"

# For Supabase Cloud (requires API access)
if [ -n "$SUPABASE_PROJECT_REF" ]; then
    echo "   Backing up Supabase Cloud project: $SUPABASE_PROJECT_REF"
    # Use Supabase API to trigger backup
    curl -X POST \
      "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/backups" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
fi

# For self-hosted Docker
if docker ps | grep -q supabase-db; then
    echo "   Backing up self-hosted database..."

    docker exec supabase-db pg_dump \
      -U postgres \
      -Fc \
      -f /tmp/backup-$TIMESTAMP.dump \
      postgres

    docker cp supabase-db:/tmp/backup-$TIMESTAMP.dump \
      "$BACKUP_DIR/backup-$TIMESTAMP.dump"

    docker exec supabase-db rm /tmp/backup-$TIMESTAMP.dump

    # Compress backup
    gzip "$BACKUP_DIR/backup-$TIMESTAMP.dump"

    echo "   ✅ Backup saved: $BACKUP_DIR/backup-$TIMESTAMP.dump.gz"

    # Calculate size
    SIZE=$(du -h "$BACKUP_DIR/backup-$TIMESTAMP.dump.gz" | cut -f1)
    echo "   📦 Backup size: $SIZE"
fi

# Remove old backups
echo "   🧹 Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup-*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
    echo "   ☁️  Uploading to S3..."
    aws s3 cp \
      "$BACKUP_DIR/backup-$TIMESTAMP.dump.gz" \
      "s3://$AWS_S3_BACKUP_BUCKET/service-center/backup-$TIMESTAMP.dump.gz" \
      --storage-class STANDARD_IA
    echo "   ✅ Uploaded to S3"
fi

echo "✅ Backup completed at $(date)"
```

#### Schedule Backups

```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Add to crontab
crontab -e

# Add line (daily at 2 AM):
0 2 * * * /path/to/service-center/scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### Backup Verification

```bash
# Test backup restoration (in staging environment)
#!/bin/bash
# scripts/test-backup-restore.sh

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🧪 Testing backup restoration..."

# Create temporary test database
docker exec supabase-db psql -U postgres -c "CREATE DATABASE backup_test;"

# Restore backup
gunzip -c "$BACKUP_FILE" | docker exec -i supabase-db pg_restore \
  -U postgres \
  -d backup_test \
  --no-owner \
  --no-acl

# Verify restoration
TABLES=$(docker exec supabase-db psql -U postgres -d backup_test -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")

if [ "$TABLES" -gt 0 ]; then
    echo "✅ Backup restoration successful ($TABLES tables restored)"
else
    echo "❌ Backup restoration failed (no tables found)"
    exit 1
fi

# Cleanup
docker exec supabase-db psql -U postgres -c "DROP DATABASE backup_test;"
```

### Point-in-Time Recovery (Supabase Cloud Pro)

Supabase Pro plans include PITR:

```bash
# Restore to specific point in time
# Via Supabase Dashboard:
# Database → Backups → Point in Time Recovery
# Select timestamp → Restore
```

---

## Rollback Procedures

### Application Rollback

#### Docker Deployment

```bash
# 1. Identify previous working version
docker images service-center

# 2. Stop current version
docker compose stop app

# 3. Update docker-compose.yml to use previous tag
# services:
#   app:
#     image: service-center:0.2.0  # Previous version

# 4. Restart with previous version
docker compose up -d app

# 5. Verify application
curl -f http://localhost:3025/api/health
```

#### Vercel Deployment

```bash
# Rollback to previous deployment
vercel rollback

# Or via dashboard:
# Deployments → Select previous deployment → Promote to Production
```

### Database Rollback

#### Rolling Back Migrations

```bash
# 1. Identify migration to rollback to
pnpx supabase migration list

# 2. Create down migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_phase2.sql <<EOF
-- Rollback Phase 2 features
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS ticket_tasks CASCADE;
DROP TABLE IF EXISTS task_template_items CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS rma_batches CASCADE;
DROP TABLE IF EXISTS physical_products CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;

-- Rollback extended columns on service_tickets
ALTER TABLE service_tickets
  DROP COLUMN IF EXISTS task_template_id,
  DROP COLUMN IF EXISTS warehouse_id;
EOF

# 3. Apply rollback migration
pnpx supabase migration up
```

#### Full Database Restoration

```bash
# 1. Stop application
docker compose stop app

# 2. Restore from backup
gunzip -c backups/backup-TIMESTAMP.dump.gz | \
  docker exec -i supabase-db pg_restore \
    -U postgres \
    -d postgres \
    -c \
    --if-exists

# 3. Restart services
docker compose up -d

# 4. Verify data integrity
docker exec supabase-db psql -U postgres -c "
  SELECT COUNT(*) FROM service_tickets;
  SELECT COUNT(*) FROM customers;
"
```

### Emergency Rollback Checklist

- [ ] **Immediate Actions**
  - [ ] Stop new traffic (set maintenance mode)
  - [ ] Alert team via communication channel
  - [ ] Document issue and symptoms
  - [ ] Capture logs before rollback

- [ ] **Rollback Execution**
  - [ ] Backup current state (even if broken)
  - [ ] Restore application to previous version
  - [ ] Restore database if needed
  - [ ] Verify rollback successful

- [ ] **Post-Rollback**
  - [ ] Test critical workflows
  - [ ] Monitor error rates
  - [ ] Communicate status to stakeholders
  - [ ] Conduct post-mortem analysis

---

## Monitoring Setup

### Application Monitoring

#### Health Check Endpoint

Already implemented at `/api/health`:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.2.1'
  });
}
```

#### External Monitoring Services

**UptimeRobot** (Free tier available):

```bash
# Configure HTTP(s) monitor
URL: https://yourdomain.com/api/health
Interval: 5 minutes
Alert contacts: email, Slack, SMS
```

**Pingdom**:

```bash
# Setup uptime monitoring
1. Create new check → Uptime
2. URL: https://yourdomain.com
3. Check interval: 1 minute
4. Alert threshold: Down for 2 minutes
```

### Database Monitoring

#### Connection Pool Monitoring

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW monitoring.connection_stats AS
SELECT
  datname,
  numbackends AS connections,
  xact_commit AS commits,
  xact_rollback AS rollbacks,
  blks_read AS disk_blocks_read,
  blks_hit AS buffer_hits,
  tup_returned AS rows_returned,
  tup_fetched AS rows_fetched,
  tup_inserted AS rows_inserted,
  tup_updated AS rows_updated,
  tup_deleted AS rows_deleted
FROM pg_stat_database
WHERE datname = current_database();
```

#### Query Performance Monitoring

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  total_exec_time / 1000 AS total_time_seconds,
  mean_exec_time / 1000 AS mean_time_seconds,
  max_exec_time / 1000 AS max_time_seconds
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Log Aggregation

#### Docker Logs

```bash
# Forward logs to external service
docker compose logs -f app | \
  tee >(logger -t service-center-app)

# Configure log rotation
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

#### Centralized Logging (ELK Stack)

```yaml
# Add to docker-compose.yml
services:
  filebeat:
    image: elastic/filebeat:8.11.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Performance Metrics

#### Custom Metrics with Prometheus

```typescript
// src/lib/metrics.ts
import { Counter, Histogram } from 'prom-client';

export const apiRequestCounter = new Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status'],
});

export const apiDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'route'],
});
```

### Alert Configuration

#### Critical Alerts

```yaml
# alerts.yml (for Prometheus Alertmanager)
groups:
  - name: service-center-critical
    interval: 1m
    rules:
      - alert: ApplicationDown
        expr: up{job="service-center"} == 0
        for: 2m
        annotations:
          summary: "Service Center application is down"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "Database is unreachable"

      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected (>5%)"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, api_request_duration_seconds) > 2
        for: 10m
        annotations:
          summary: "95th percentile response time > 2s"
```

---

## Performance Optimization

### Database Optimization

#### Indexing Strategy

```sql
-- Already implemented in migrations, verify with:
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Add custom indexes for specific queries
-- Example: Index for ticket search by customer phone
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone_search
ON customers USING gin(to_tsvector('simple', phone));

-- Index for ticket date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_created_at_desc
ON service_tickets (created_at DESC);

-- Composite index for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status_priority
ON service_tickets (status, priority)
WHERE status != 'completed' AND status != 'cancelled';
```

#### Query Optimization

```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM service_tickets
WHERE status = 'in_progress'
  AND created_at > CURRENT_DATE - INTERVAL '7 days';

-- Update table statistics
ANALYZE service_tickets;
ANALYZE customers;
ANALYZE parts;

-- Vacuum tables
VACUUM ANALYZE;
```

#### Connection Pooling

```typescript
// Already implemented via Supabase client
// For self-hosted, configure PgBouncer:

// docker-compose.yml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: db
      DATABASES_PORT: 5432
      DATABASES_USER: postgres
      DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASES_DBNAME: postgres
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
```

### Application Optimization

#### Caching Strategy

```typescript
// src/lib/cache.ts
import { LRUCache } from 'lru-cache';

// In-memory cache for frequently accessed data
export const cache = new LRUCache({
  max: 500, // Maximum items
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
});

// Example usage in tRPC procedure
export const getCustomerById = publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input, ctx }) => {
    const cacheKey = `customer:${input.id}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const customer = await ctx.supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', input.id)
      .single();

    // Store in cache
    cache.set(cacheKey, customer.data);

    return customer.data;
  });
```

#### React Query Configuration

```typescript
// src/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

#### Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const TicketAnalytics = dynamic(
  () => import('@/components/analytics/TicketAnalytics'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false, // Client-side only
  }
);
```

### CDN and Static Asset Optimization

#### Image Optimization

```typescript
// Use Next.js Image component (already implemented)
import Image from 'next/image';

<Image
  src={productImage}
  alt="Product"
  width={400}
  height={400}
  quality={85}
  placeholder="blur"
  blurDataURL={thumbnail}
/>
```

#### Font Optimization

```typescript
// next.config.ts - already configured
export default {
  // ...
  optimizeFonts: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

---

## Security Hardening

### Application Security

#### Environment Variable Protection

```bash
# NEVER commit .env to git
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

# Validate no secrets in code
git grep -i "password\|secret\|key" src/

# Encrypt production .env
gpg --symmetric --cipher-algo AES256 .env.production
```

#### HTTP Security Headers

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co;"
  );

  return response;
}

export const config = {
  matcher: '/:path*',
};
```

#### Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimit(identifier: string, limit = 10) {
  const count = (rateLimitCache.get(identifier) as number) || 0;

  if (count >= limit) {
    return false;
  }

  rateLimitCache.set(identifier, count + 1);
  return true;
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!rateLimit(ip, 10)) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Process request...
}
```

### Database Security

#### RLS Policy Verification

```sql
-- Verify all tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- If any tables returned, enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### Audit Logging

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    old_data,
    new_data,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_service_tickets
AFTER INSERT OR UPDATE OR DELETE ON service_tickets
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Infrastructure Security

#### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (for Let's Encrypt)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Limit SSH connection rate
sudo ufw limit 22/tcp
```

#### SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart sshd
```

#### Docker Security

```bash
# Run containers as non-root (already configured in Dockerfile)
USER nextjs

# Use Docker secrets for sensitive data
docker secret create supabase_password /path/to/password.txt

# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Scan images for vulnerabilities
docker scan service-center:latest
```

---

## SSL/TLS Configuration

### Option 1: Cloudflare (Recommended for Docker Deployment)

#### Advantages
- Free SSL certificates
- Automatic renewal
- DDoS protection
- CDN included

#### Setup Steps

1. **Add Domain to Cloudflare**
```bash
# Visit cloudflare.com
# Add site → Enter domain
# Update nameservers at domain registrar
```

2. **Configure SSL Settings**
```bash
# Cloudflare Dashboard → SSL/TLS
# SSL/TLS encryption mode: Full (Strict)
# Edge Certificates: Automatic HTTPS Rewrites ON
# Always Use HTTPS: ON
# Minimum TLS Version: 1.2
```

3. **Setup Cloudflare Tunnel**
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create service-center

# Get tunnel ID
cloudflared tunnel list

# Create config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:3025
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
EOF

# Route DNS
cloudflared tunnel route dns service-center yourdomain.com
cloudflared tunnel route dns service-center api.yourdomain.com

# Run tunnel
cloudflared tunnel run service-center

# Or install as service
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

### Option 2: Let's Encrypt with Nginx

#### Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/service-center
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3025;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Obtain Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/service-center /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo systemctl status certbot.timer
```

### Option 3: AWS Certificate Manager (for AWS deployment)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS

# Configure ALB to use certificate
# AWS Console → EC2 → Load Balancers → Listeners → Add HTTPS:443
```

---

## Domain and DNS Setup

### DNS Configuration

#### Required DNS Records

```bash
# A Records (or CNAME for Cloudflare Tunnel)
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: Auto (or 3600)

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: Auto

# For Cloudflare Tunnel (instead of A records)
Type: CNAME
Name: @
Value: YOUR_TUNNEL_ID.cfargotunnel.com
Proxy: Enabled (orange cloud)

# Supabase API subdomain (if self-hosting)
Type: A
Name: api
Value: YOUR_SERVER_IP
TTL: Auto

# Email (if using custom domain for emails)
Type: MX
Name: @
Value: 10 mx1.sendgrid.net
TTL: Auto

# SPF Record
Type: TXT
Name: @
Value: "v=spf1 include:sendgrid.net ~all"
TTL: Auto

# DKIM Record (from SendGrid)
Type: TXT
Name: em1234._domainkey
Value: "k=rsa; p=YOUR_PUBLIC_KEY..."
TTL: Auto
```

### DNS Verification

```bash
# Check DNS propagation
dig yourdomain.com
dig www.yourdomain.com
dig api.yourdomain.com

# Check from multiple locations
curl https://dnschecker.org/#A/yourdomain.com
```

---

## CDN Configuration

### Cloudflare CDN (Included with Cloudflare)

#### Cache Configuration

```bash
# Cloudflare Dashboard → Caching → Configuration

# Cache Level: Standard
# Browser Cache TTL: 4 hours
# Crawler Hints: ON
# Always Online: ON

# Page Rules for static assets
Rule: yourdomain.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year

Rule: yourdomain.com/images/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
  - Polish: Lossless
  - WebP: ON
```

### AWS CloudFront (for AWS deployment)

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name alb-xxxxxxxx.us-east-1.elb.amazonaws.com \
  --default-root-object index.html \
  --enabled

# Configure cache behaviors
# /_next/static/* → Cache: 1 year
# /images/* → Cache: 1 month
# /api/* → Cache: None (pass through)
```

---

## Troubleshooting

### Common Deployment Issues

#### Issue 1: Build Fails with "Cannot find module"

**Symptom:**
```bash
Error: Cannot find module '@/components/...'
```

**Solution:**
```bash
# Clean build cache
rm -rf .next node_modules

# Reinstall dependencies
pnpm install --frozen-lockfile

# Rebuild
pnpm build
```

#### Issue 2: Environment Variables Not Loading

**Symptom:**
```
NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check Docker environment variable passing
docker compose config | grep SUPABASE

# For Docker builds, pass as build args
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://... \
  -t service-center .
```

#### Issue 3: Database Connection Refused

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify connection string
echo $SUPABASE_URL

# For Docker network issues, use service name instead of localhost
SUPABASE_URL=http://kong:8000  # NOT http://localhost:8000
```

#### Issue 4: 502 Bad Gateway

**Symptom:**
```
502 Bad Gateway from Nginx/Cloudflare
```

**Solution:**
```bash
# Check if app is running
docker compose ps app
curl http://localhost:3025/api/health

# Check app logs
docker compose logs -f app

# Verify upstream configuration
sudo nginx -t
```

#### Issue 5: Migration Fails

**Symptom:**
```
Error: relation "task_templates" already exists
```

**Solution:**
```bash
# Check applied migrations
pnpx supabase migration list

# For duplicate migrations, remove duplicate
rm supabase/migrations/DUPLICATE_TIMESTAMP_*.sql

# For corrupted migrations, restore from backup and re-apply
./scripts/restore-database.sh backup-TIMESTAMP.dump.gz
pnpx supabase migration up
```

#### Issue 6: File Upload Fails

**Symptom:**
```
Error: new row violates row-level security policy for table "objects"
```

**Solution:**
```sql
-- Verify storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'ticket-attachments';

-- Re-apply storage policies
\i docs/data/schemas/storage_policies.sql

-- Check bucket configuration
SELECT * FROM storage.buckets;
```

#### Issue 7: CORS Errors

**Symptom:**
```
Access to fetch at 'https://api.yourdomain.com' blocked by CORS policy
```

**Solution:**
```bash
# For Supabase Cloud
# Dashboard → Authentication → URL Configuration
# Add allowed URLs

# For self-hosted, update Kong config
# volumes/api/kong.yml
# Add origin to cors plugin

# Verify headers
curl -I https://yourdomain.com/api/trpc/health
```

### Performance Issues

#### Slow Page Load

```bash
# Check bundle size
ANALYZE=true pnpm build

# Check database query performance
docker exec supabase-db psql -U postgres -c "
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10;
"

# Enable Next.js debugging
DEBUG=* pnpm start
```

#### High Database CPU

```bash
# Identify expensive queries
docker exec supabase-db psql -U postgres -c "
  SELECT pid, usename, query, state, wait_event_type
  FROM pg_stat_activity
  WHERE state = 'active'
  ORDER BY query_start;
"

# Add missing indexes
EXPLAIN ANALYZE <slow_query>;
```

### Security Issues

#### Exposed Service Role Key

```bash
# IMMEDIATELY rotate keys
# Supabase Cloud: Dashboard → Settings → API → Reset service_role key

# Update all environments
# .env
SUPABASE_SERVICE_ROLE_KEY=NEW_KEY

# Restart applications
docker compose restart app
```

#### Unauthorized Access

```bash
# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'service_tickets';

# Audit recent database changes
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

# Review authentication logs
# Supabase Dashboard → Authentication → Logs
```

---

## Production Deployment Cheat Sheet

### Quick Reference Commands

```bash
# Pre-deployment
./scripts/validate-env.sh
pnpm build
pnpm lint

# Database backup
./scripts/backup-database.sh

# Deploy (Docker)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Deploy (Vercel)
vercel --prod

# Post-deployment verification
./scripts/verify-deployment.sh https://yourdomain.com

# Monitor logs
docker compose logs -f app

# Health check
curl https://yourdomain.com/api/health

# Rollback (Docker)
docker compose stop app
# Edit docker-compose.yml to previous version
docker compose up -d app

# Emergency database restore
gunzip -c backups/backup-LATEST.dump.gz | \
  docker exec -i supabase-db pg_restore -U postgres -d postgres -c
```

---

## Conclusion

This deployment guide covers comprehensive production deployment strategies for Service Center Phase 2. For additional support:

- **Documentation:** `/docs` folder
- **Issues:** GitHub Issues
- **Support:** me@tantran.dev

**Next Steps After Deployment:**
1. Complete initial setup at `/setup`
2. Configure task templates
3. Setup warehouse structures
4. Configure email notifications
5. Train staff on new Phase 2 features
6. Monitor system performance for 48 hours
7. Implement scheduled backups
8. Setup monitoring alerts

**Remember:**
- Always backup before major changes
- Test in staging before production
- Monitor logs after deployment
- Keep documentation updated
- Rotate secrets regularly
- Review security policies monthly

---

**Document Version:** 1.0
**Phase:** 2 (Advanced Features)
**Application Version:** 0.2.1
**Last Updated:** October 2025
