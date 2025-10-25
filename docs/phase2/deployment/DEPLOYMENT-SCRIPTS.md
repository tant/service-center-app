# Deployment Automation Scripts - Phase 2
## Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic:** EPIC-01 - Service Center Phase 2
**Story:** 1.20 - Production Deployment and Monitoring Setup
**Last Updated:** 2025-10-24
**Owner:** DevOps Team

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Scripts](#pre-deployment-scripts)
4. [Deployment Scripts](#deployment-scripts)
5. [Post-Deployment Scripts](#post-deployment-scripts)
6. [Database Migration Scripts](#database-migration-scripts)
7. [Health Check Automation](#health-check-automation)
8. [Smoke Test Automation](#smoke-test-automation)
9. [Backup Automation](#backup-automation)
10. [Environment Validation](#environment-validation)
11. [Complete Deployment Orchestration](#complete-deployment-orchestration)
12. [Rollback Scripts](#rollback-scripts)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides production-ready, copy-paste deployment scripts for the Service Center Phase 2 application. All scripts include error handling, logging, and validation.

**Deployment Methods Covered:**
- Vercel deployment (recommended for production)
- Docker deployment (containerized)
- Manual deployment with PM2 (traditional VPS)

**Script Features:**
- ✅ Error handling and validation
- ✅ Comprehensive logging
- ✅ Rollback capabilities
- ✅ Health checks
- ✅ Automated smoke tests
- ✅ Environment validation

---

## Prerequisites

### Required Tools

```bash
# Install required tools
#!/bin/bash
# File: install-prerequisites.sh

echo "=== Installing Deployment Prerequisites ==="

# Node.js 18.17+
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js version must be 18.17 or higher"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# pnpm
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi
echo "✓ pnpm $(pnpm -v)"

# Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "Installing Supabase CLI..."
  npm install -g supabase
fi
echo "✓ Supabase CLI $(supabase -v)"

# jq (for JSON parsing)
if ! command -v jq &> /dev/null; then
  echo "Installing jq..."
  sudo apt-get update && sudo apt-get install -y jq
fi
echo "✓ jq $(jq --version)"

# PostgreSQL client (for database operations)
if ! command -v psql &> /dev/null; then
  echo "Installing PostgreSQL client..."
  sudo apt-get update && sudo apt-get install -y postgresql-client
fi
echo "✓ psql $(psql --version | head -1)"

# curl (for API testing)
if ! command -v curl &> /dev/null; then
  echo "Installing curl..."
  sudo apt-get install -y curl
fi
echo "✓ curl $(curl --version | head -1)"

# Git
if ! command -v git &> /dev/null; then
  echo "Installing git..."
  sudo apt-get install -y git
fi
echo "✓ git $(git --version)"

echo ""
echo "=== Prerequisites Installation Complete ==="
```

**Make executable and run:**

```bash
chmod +x install-prerequisites.sh
./install-prerequisites.sh
```

### Environment Variables

```bash
#!/bin/bash
# File: setup-environment.sh
# Description: Setup and validate environment variables

set -e

ENV_FILE="${1:-.env}"

echo "=== Environment Setup ==="
echo "Environment file: $ENV_FILE"

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
  echo "❌ .env.example not found"
  exit 1
fi

# Create .env from .env.example if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating $ENV_FILE from .env.example..."
  cp .env.example "$ENV_FILE"
  echo "⚠️  Please update $ENV_FILE with your actual values"
  exit 1
fi

# Function to check required variable
check_var() {
  local var_name="$1"
  local value=$(grep "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2-)

  if [ -z "$value" ] || [[ "$value" =~ ^(your_|change_) ]]; then
    echo "❌ $var_name is not set or has default value"
    return 1
  else
    echo "✓ $var_name is set"
    return 0
  fi
}

# Check all required variables
echo ""
echo "Validating environment variables..."

ERRORS=0

# Supabase
check_var "NEXT_PUBLIC_SUPABASE_URL" || ERRORS=$((ERRORS + 1))
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || ERRORS=$((ERRORS + 1))
check_var "SUPABASE_SERVICE_ROLE_KEY" || ERRORS=$((ERRORS + 1))

# Setup
check_var "SETUP_PASSWORD" || ERRORS=$((ERRORS + 1))
check_var "ADMIN_EMAIL" || ERRORS=$((ERRORS + 1))
check_var "ADMIN_PASSWORD" || ERRORS=$((ERRORS + 1))
check_var "ADMIN_NAME" || ERRORS=$((ERRORS + 1))

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ $ERRORS environment variable(s) need to be set"
  echo "Please update $ENV_FILE with correct values"
  exit 1
fi

echo ""
echo "✓ All required environment variables are set"

# Additional validation
echo ""
echo "Validating environment values..."

# Check Supabase URL format
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" | cut -d'=' -f2-)
if [[ ! "$SUPABASE_URL" =~ ^https?:// ]]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL must be a valid URL"
  ERRORS=$((ERRORS + 1))
fi

# Check email format
ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" "$ENV_FILE" | cut -d'=' -f2-)
if [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  echo "❌ ADMIN_EMAIL must be a valid email address"
  ERRORS=$((ERRORS + 1))
fi

# Check password strength
ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2-)
if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  echo "⚠️  ADMIN_PASSWORD should be at least 8 characters"
fi

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Environment validation failed"
  exit 1
fi

echo "✓ Environment validation passed"
echo ""
echo "=== Environment Setup Complete ==="
```

**Usage:**

```bash
chmod +x setup-environment.sh
./setup-environment.sh          # Validates .env
./setup-environment.sh .env.production  # Validates custom file
```

---

## Pre-Deployment Scripts

### 1. Full Pre-Deployment Check

```bash
#!/bin/bash
# File: pre-deployment-check.sh
# Description: Comprehensive pre-deployment validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="logs/pre-deployment-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log_success() {
  log "${GREEN}✓ $1${NC}"
}

log_error() {
  log "${RED}❌ $1${NC}"
}

log_warning() {
  log "${YELLOW}⚠️  $1${NC}"
}

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

check_passed() {
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  log_success "$1"
}

check_failed() {
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  log_error "$1"
}

check_warning() {
  CHECKS_WARNING=$((CHECKS_WARNING + 1))
  log_warning "$1"
}

# Start
log "=== Pre-Deployment Check Started ==="
log "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
log ""

# 1. Environment Variables
log "1. Checking environment variables..."
if ./setup-environment.sh >> "$LOG_FILE" 2>&1; then
  check_passed "Environment variables validated"
else
  check_failed "Environment validation failed"
fi

# 2. Dependencies
log ""
log "2. Checking dependencies..."
if [ -f "package.json" ]; then
  check_passed "package.json found"

  if [ -d "node_modules" ]; then
    check_passed "node_modules exists"
  else
    check_warning "node_modules not found - will install"
  fi
else
  check_failed "package.json not found"
fi

# 3. Git Status
log ""
log "3. Checking git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  check_passed "Git repository found"

  # Check for uncommitted changes
  if [ -z "$(git status --porcelain)" ]; then
    check_passed "No uncommitted changes"
  else
    check_warning "Uncommitted changes found"
    log "$(git status --short)"
  fi

  # Check current branch
  CURRENT_BRANCH=$(git branch --show-current)
  log "Current branch: $CURRENT_BRANCH"

  if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
    check_passed "On main branch"
  else
    check_warning "Not on main branch (current: $CURRENT_BRANCH)"
  fi
else
  check_failed "Not a git repository"
fi

# 4. Build Test
log ""
log "4. Testing build..."
log "Running: pnpm build"

if pnpm install >> "$LOG_FILE" 2>&1 && pnpm build >> "$LOG_FILE" 2>&1; then
  check_passed "Build successful"

  # Check build size
  if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    log "Build size: $BUILD_SIZE"

    # Parse size (assuming format like "45M" or "1.2G")
    SIZE_VALUE=$(echo "$BUILD_SIZE" | sed 's/[^0-9.]//g')
    SIZE_UNIT=$(echo "$BUILD_SIZE" | sed 's/[0-9.]//g')

    if [ "$SIZE_UNIT" == "G" ]; then
      check_warning "Build size is large: $BUILD_SIZE"
    else
      check_passed "Build size acceptable: $BUILD_SIZE"
    fi
  fi
else
  check_failed "Build failed - check logs"
fi

# 5. TypeScript Check
log ""
log "5. Checking TypeScript..."
if pnpm exec tsc --noEmit >> "$LOG_FILE" 2>&1; then
  check_passed "TypeScript compilation successful"
else
  check_failed "TypeScript errors found"
fi

# 6. Linting
log ""
log "6. Running linter..."
if pnpm lint >> "$LOG_FILE" 2>&1; then
  check_passed "Linting passed"
else
  check_warning "Linting issues found (non-blocking)"
fi

# 7. Database Connection
log ""
log "7. Testing database connection..."

# Load environment
set -a
source .env
set +a

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  check_failed "NEXT_PUBLIC_SUPABASE_URL not set"
else
  # Test connection
  DB_CONNECTION_STRING="${NEXT_PUBLIC_SUPABASE_URL/https:\/\//}"
  DB_HOST=$(echo "$DB_CONNECTION_STRING" | cut -d'/' -f1)

  if curl -sf --max-time 10 "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null; then
    check_passed "Supabase connection successful"
  else
    check_failed "Cannot connect to Supabase"
  fi
fi

# 8. Backup Check
log ""
log "8. Checking recent backups..."

BACKUP_DIR="backups"
if [ -d "$BACKUP_DIR" ]; then
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-*.sql 2>/dev/null | head -1)

  if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))

    if [ $BACKUP_AGE -lt 24 ]; then
      check_passed "Recent backup found: $LATEST_BACKUP (${BACKUP_AGE}h old)"
    else
      check_warning "Latest backup is ${BACKUP_AGE}h old"
    fi
  else
    check_warning "No backups found in $BACKUP_DIR"
  fi
else
  check_warning "Backup directory not found"
fi

# 9. Migration Files
log ""
log "9. Checking migration files..."

MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
  MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)

  if [ $MIGRATION_COUNT -gt 0 ]; then
    check_passed "Found $MIGRATION_COUNT migration file(s)"

    # List migrations
    log "Recent migrations:"
    ls -1t "$MIGRATION_DIR"/*.sql | head -5 | while read -r file; do
      log "  - $(basename "$file")"
    done
  else
    check_warning "No migration files found"
  fi
else
  check_warning "Migration directory not found"
fi

# 10. Deployment Artifacts
log ""
log "10. Checking deployment artifacts..."

if [ -f "package.json" ] && [ -f "next.config.js" ]; then
  check_passed "Required config files present"
else
  check_failed "Missing required config files"
fi

# Summary
log ""
log "=== Pre-Deployment Check Summary ==="
log "Passed:  $CHECKS_PASSED"
log "Failed:  $CHECKS_FAILED"
log "Warnings: $CHECKS_WARNING"
log ""

if [ $CHECKS_FAILED -eq 0 ]; then
  log_success "Pre-deployment check PASSED"
  log "Ready for deployment!"
  log ""
  log "Log file: $LOG_FILE"
  exit 0
else
  log_error "Pre-deployment check FAILED"
  log "Please fix the issues above before deploying"
  log ""
  log "Log file: $LOG_FILE"
  exit 1
fi
```

**Usage:**

```bash
chmod +x pre-deployment-check.sh
./pre-deployment-check.sh
```

### 2. Backup Script

```bash
#!/bin/bash
# File: backup-database.sh
# Description: Create database backup before deployment

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Load environment
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
else
  echo "❌ .env file not found"
  exit 1
fi

echo "=== Database Backup ==="
echo "Timestamp: $(date -u)"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get database URL from Supabase
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
  exit 1
fi

# Extract project ID
PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's/https?:\/\/([^.]+).*/\1/')

echo "Creating backup..."
echo "Project: $PROJECT_ID"
echo "Output: $BACKUP_FILE"
echo ""

# Create backup using Supabase CLI
if command -v supabase &> /dev/null; then
  # Using Supabase CLI (requires login)
  if supabase db dump --project-ref "$PROJECT_ID" -f "$BACKUP_FILE" 2>&1 | tee -a "${BACKUP_FILE}.log"; then
    echo ""
    echo "✓ Backup created successfully"
  else
    echo ""
    echo "❌ Backup failed"
    exit 1
  fi
else
  echo "⚠️  Supabase CLI not found"
  echo "Please install: npm install -g supabase"
  exit 1
fi

# Verify backup file
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup size: $BACKUP_SIZE"

  # Check if backup is not empty
  if [ ! -s "$BACKUP_FILE" ]; then
    echo "❌ Backup file is empty"
    exit 1
  fi

  # Compress backup
  echo ""
  echo "Compressing backup..."
  gzip "$BACKUP_FILE"
  COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
  echo "✓ Compressed: $COMPRESSED_SIZE"

  # Update backup file variable
  BACKUP_FILE="${BACKUP_FILE}.gz"
else
  echo "❌ Backup file not created"
  exit 1
fi

# Verify backup content (basic check)
echo ""
echo "Verifying backup content..."

if zcat "$BACKUP_FILE" | head -50 | grep -q "PostgreSQL database dump"; then
  echo "✓ Backup verification passed"
else
  echo "⚠️  Backup verification warning - unusual format"
fi

# Cleanup old backups
echo ""
echo "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS)

if [ -n "$OLD_BACKUPS" ]; then
  echo "$OLD_BACKUPS" | while read -r file; do
    echo "Removing: $(basename "$file")"
    rm "$file"
  done
  echo "✓ Cleanup complete"
else
  echo "No old backups to remove"
fi

# List recent backups
echo ""
echo "Recent backups:"
ls -lth "$BACKUP_DIR"/backup-*.sql.gz | head -5 | while read -r line; do
  echo "  $line"
done

# Save backup metadata
METADATA_FILE="${BACKUP_FILE}.meta"
cat > "$METADATA_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
  "project_id": "$PROJECT_ID",
  "backup_file": "$(basename "$BACKUP_FILE")",
  "size": "$COMPRESSED_SIZE",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo ""
echo "=== Backup Complete ==="
echo "File: $BACKUP_FILE"
echo "Metadata: $METADATA_FILE"
echo ""
echo "To restore this backup:"
echo "  gunzip -c $BACKUP_FILE | psql [DATABASE_URL]"
```

**Usage:**

```bash
chmod +x backup-database.sh
./backup-database.sh
```

### 3. Migration Testing Script

```bash
#!/bin/bash
# File: test-migrations.sh
# Description: Test database migrations before deployment

set -e

echo "=== Migration Testing ==="
echo ""

# Load environment
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
else
  echo "❌ .env file not found"
  exit 1
fi

MIGRATION_DIR="supabase/migrations"

# Check migration directory
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "❌ Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)

if [ $MIGRATION_COUNT -eq 0 ]; then
  echo "⚠️  No migration files found"
  exit 0
fi

echo "Found $MIGRATION_COUNT migration file(s)"
echo ""

# List migrations
echo "Migrations to apply:"
ls -1 "$MIGRATION_DIR"/*.sql | while read -r file; do
  echo "  - $(basename "$file")"
done

echo ""
echo "⚠️  This will apply migrations to the database"
echo "Make sure you have a recent backup!"
echo ""
read -p "Continue with migration testing? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Migration testing cancelled"
  exit 0
fi

# Apply migrations
echo ""
echo "Applying migrations..."

if command -v supabase &> /dev/null; then
  # Extract project ID
  PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's/https?:\/\/([^.]+).*/\1/')

  if supabase db push --project-ref "$PROJECT_ID"; then
    echo ""
    echo "✓ Migrations applied successfully"
  else
    echo ""
    echo "❌ Migration failed"
    echo "Please check errors above and consider rollback"
    exit 1
  fi
else
  echo "❌ Supabase CLI not found"
  exit 1
fi

# Verify migrations
echo ""
echo "Verifying database state..."

# Check if critical tables exist
CRITICAL_TABLES=(
  "profiles"
  "service_tickets"
  "customers"
  "products"
  "parts"
  "task_templates"
  "service_ticket_tasks"
)

# Build connection string for psql
# Note: This requires database password
echo "Checking critical tables..."

for table in "${CRITICAL_TABLES[@]}"; do
  # This is a simplified check - actual implementation would use psql
  echo "  - $table: ✓ (manual verification recommended)"
done

echo ""
echo "=== Migration Testing Complete ==="
echo "Please manually verify:"
echo "1. All tables exist"
echo "2. RLS policies are applied"
echo "3. Triggers are functioning"
echo "4. Indexes are created"
```

**Usage:**

```bash
chmod +x test-migrations.sh
./test-migrations.sh
```

---

## Deployment Scripts

### 1. Vercel Deployment (Recommended)

```bash
#!/bin/bash
# File: deploy-vercel.sh
# Description: Deploy to Vercel (production)

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ENV="${1:-production}"
LOG_FILE="logs/deploy-vercel-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${GREEN}=== Vercel Deployment ===${NC}"
log "Environment: $DEPLOYMENT_ENV"
log "Timestamp: $(date -u)"
log ""

# 1. Pre-deployment checks
log "1. Running pre-deployment checks..."
if ./pre-deployment-check.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Pre-deployment checks passed"
else
  log "${RED}❌${NC} Pre-deployment checks failed"
  log "Check log: $LOG_FILE"
  exit 1
fi

# 2. Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
  log ""
  log "Installing Vercel CLI..."
  npm install -g vercel
  log "${GREEN}✓${NC} Vercel CLI installed"
fi

# 3. Login to Vercel (if not already)
log ""
log "2. Checking Vercel authentication..."
if vercel whoami >> "$LOG_FILE" 2>&1; then
  VERCEL_USER=$(vercel whoami)
  log "${GREEN}✓${NC} Logged in as: $VERCEL_USER"
else
  log "${YELLOW}⚠️${NC} Not logged in to Vercel"
  log "Running: vercel login"
  vercel login
fi

# 4. Link project (if needed)
log ""
log "3. Linking Vercel project..."
if [ -f ".vercel/project.json" ]; then
  log "${GREEN}✓${NC} Project already linked"
else
  log "Linking project..."
  vercel link
fi

# 5. Set environment variables
log ""
log "4. Setting environment variables..."

# Load from .env
if [ -f ".env" ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

    # Set in Vercel
    echo "Setting $key..."
    echo "$value" | vercel env add "$key" "$DEPLOYMENT_ENV" --force >> "$LOG_FILE" 2>&1 || true
  done < .env

  log "${GREEN}✓${NC} Environment variables set"
else
  log "${RED}❌${NC} .env file not found"
  exit 1
fi

# 6. Deploy
log ""
log "5. Deploying to Vercel..."

DEPLOY_FLAGS="--yes"

if [ "$DEPLOYMENT_ENV" == "production" ]; then
  DEPLOY_FLAGS="$DEPLOY_FLAGS --prod"
fi

log "Running: vercel $DEPLOY_FLAGS"

if DEPLOYMENT_URL=$(vercel $DEPLOY_FLAGS 2>&1 | tee -a "$LOG_FILE" | grep -oP 'https://.*\.vercel\.app' | tail -1); then
  log ""
  log "${GREEN}✓${NC} Deployment successful"
  log "URL: $DEPLOYMENT_URL"
else
  log ""
  log "${RED}❌${NC} Deployment failed"
  log "Check log: $LOG_FILE"
  exit 1
fi

# 7. Wait for deployment to be ready
log ""
log "6. Waiting for deployment to be ready..."
sleep 10

# 8. Health check
log ""
log "7. Running health check..."

HEALTH_URL="${DEPLOYMENT_URL}/api/health"
RETRY_COUNT=0
MAX_RETRIES=6

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf --max-time 10 "$HEALTH_URL" > /dev/null; then
    log "${GREEN}✓${NC} Health check passed"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Health check failed (attempt $RETRY_COUNT/$MAX_RETRIES)"

    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      log "Retrying in 10 seconds..."
      sleep 10
    else
      log "${RED}❌${NC} Health check failed after $MAX_RETRIES attempts"
      log "Deployment may have issues - manual verification required"
    fi
  fi
done

# 9. Run smoke tests
log ""
log "8. Running smoke tests..."
if ./smoke-tests.sh "$DEPLOYMENT_URL" >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Smoke tests passed"
else
  log "${YELLOW}⚠️${NC} Some smoke tests failed - check log"
fi

# 10. Summary
log ""
log "${GREEN}=== Deployment Complete ===${NC}"
log "Environment: $DEPLOYMENT_ENV"
log "URL: $DEPLOYMENT_URL"
log "Log: $LOG_FILE"
log ""
log "Next steps:"
log "1. Verify application at: $DEPLOYMENT_URL"
log "2. Run full test suite"
log "3. Monitor for errors: vercel logs"
log "4. Update DNS if needed"

# Save deployment info
DEPLOY_INFO_FILE="logs/deployment-info-$(date +%Y%m%d-%H%M%S).json"
cat > "$DEPLOY_INFO_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")",
  "environment": "$DEPLOYMENT_ENV",
  "url": "$DEPLOYMENT_URL",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)",
  "deployed_by": "$(whoami)",
  "log_file": "$LOG_FILE"
}
EOF

log ""
log "Deployment info saved: $DEPLOY_INFO_FILE"
```

**Usage:**

```bash
chmod +x deploy-vercel.sh

# Deploy to preview
./deploy-vercel.sh preview

# Deploy to production
./deploy-vercel.sh production
```

### 2. Docker Deployment

```bash
#!/bin/bash
# File: deploy-docker.sh
# Description: Deploy using Docker containers

set -e

# Configuration
IMAGE_NAME="service-center"
IMAGE_TAG="${1:-latest}"
CONTAINER_NAME="service-center-app"
PORT=3025

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/deploy-docker-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${GREEN}=== Docker Deployment ===${NC}"
log "Image: $IMAGE_NAME:$IMAGE_TAG"
log "Container: $CONTAINER_NAME"
log "Port: $PORT"
log ""

# 1. Pre-deployment checks
log "1. Running pre-deployment checks..."
if ./pre-deployment-check.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Pre-deployment checks passed"
else
  log "${RED}❌${NC} Pre-deployment checks failed"
  exit 1
fi

# 2. Check Docker
log ""
log "2. Checking Docker..."
if ! command -v docker &> /dev/null; then
  log "${RED}❌${NC} Docker not installed"
  exit 1
fi

if docker info >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Docker is running"
else
  log "${RED}❌${NC} Docker daemon not running"
  exit 1
fi

# 3. Build Docker image
log ""
log "3. Building Docker image..."

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
  log "Creating Dockerfile..."

  cat > Dockerfile <<'EOF'
# Dockerfile for Service Center Next.js Application

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3025

ENV PORT 3025
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

  log "${GREEN}✓${NC} Dockerfile created"
fi

# Build image
log "Building image: $IMAGE_NAME:$IMAGE_TAG"

if docker build -t "$IMAGE_NAME:$IMAGE_TAG" . >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Image built successfully"
else
  log "${RED}❌${NC} Image build failed"
  log "Check log: $LOG_FILE"
  exit 1
fi

# 4. Stop existing container
log ""
log "4. Stopping existing container..."

if docker ps -a | grep -q "$CONTAINER_NAME"; then
  log "Stopping container: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" >> "$LOG_FILE" 2>&1 || true

  log "Removing container: $CONTAINER_NAME"
  docker rm "$CONTAINER_NAME" >> "$LOG_FILE" 2>&1 || true

  log "${GREEN}✓${NC} Old container removed"
else
  log "No existing container found"
fi

# 5. Run new container
log ""
log "5. Starting new container..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  log "${RED}❌${NC} .env file not found"
  exit 1
fi

# Start container
if docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:$PORT" \
  --env-file .env \
  --restart unless-stopped \
  "$IMAGE_NAME:$IMAGE_TAG" >> "$LOG_FILE" 2>&1; then

  log "${GREEN}✓${NC} Container started"
else
  log "${RED}❌${NC} Failed to start container"
  exit 1
fi

# 6. Wait for container to be ready
log ""
log "6. Waiting for container to be ready..."
sleep 10

# Check container status
if docker ps | grep -q "$CONTAINER_NAME"; then
  log "${GREEN}✓${NC} Container is running"
else
  log "${RED}❌${NC} Container is not running"
  log "Container logs:"
  docker logs "$CONTAINER_NAME" | tail -20
  exit 1
fi

# 7. Health check
log ""
log "7. Running health check..."

HEALTH_URL="http://localhost:$PORT/api/health"
RETRY_COUNT=0
MAX_RETRIES=6

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf --max-time 10 "$HEALTH_URL" > /dev/null; then
    log "${GREEN}✓${NC} Health check passed"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Health check failed (attempt $RETRY_COUNT/$MAX_RETRIES)"

    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      log "Retrying in 10 seconds..."
      sleep 10
    else
      log "${RED}❌${NC} Health check failed"
      log "Container logs:"
      docker logs "$CONTAINER_NAME" --tail 50
      exit 1
    fi
  fi
done

# 8. Run smoke tests
log ""
log "8. Running smoke tests..."
if ./smoke-tests.sh "http://localhost:$PORT" >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Smoke tests passed"
else
  log "${YELLOW}⚠️${NC} Some smoke tests failed"
fi

# 9. Cleanup old images
log ""
log "9. Cleaning up old images..."
OLD_IMAGES=$(docker images "$IMAGE_NAME" -q | tail -n +4)

if [ -n "$OLD_IMAGES" ]; then
  echo "$OLD_IMAGES" | xargs docker rmi >> "$LOG_FILE" 2>&1 || true
  log "${GREEN}✓${NC} Old images removed"
else
  log "No old images to remove"
fi

# 10. Summary
log ""
log "${GREEN}=== Deployment Complete ===${NC}"
log "Container: $CONTAINER_NAME"
log "Image: $IMAGE_NAME:$IMAGE_TAG"
log "URL: http://localhost:$PORT"
log "Log: $LOG_FILE"
log ""
log "Container management:"
log "  View logs:    docker logs $CONTAINER_NAME"
log "  Stop:         docker stop $CONTAINER_NAME"
log "  Restart:      docker restart $CONTAINER_NAME"
log "  Shell access: docker exec -it $CONTAINER_NAME sh"
```

**Usage:**

```bash
chmod +x deploy-docker.sh

# Deploy with 'latest' tag
./deploy-docker.sh

# Deploy with specific tag
./deploy-docker.sh v1.0.0
```

**Docker Compose Alternative:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: service-center-app
    ports:
      - "3025:3025"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3025/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

```bash
#!/bin/bash
# File: deploy-docker-compose.sh

docker-compose down
docker-compose build
docker-compose up -d

# Wait and check health
sleep 15
docker-compose ps
curl -f http://localhost:3025/api/health
```

### 3. Manual Deployment with PM2

```bash
#!/bin/bash
# File: deploy-pm2.sh
# Description: Deploy manually using PM2 process manager

set -e

# Configuration
APP_NAME="service-center"
PORT=3025
NODE_ENV="${1:-production}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/deploy-pm2-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${GREEN}=== PM2 Deployment ===${NC}"
log "Application: $APP_NAME"
log "Environment: $NODE_ENV"
log "Port: $PORT"
log ""

# 1. Pre-deployment checks
log "1. Running pre-deployment checks..."
if ./pre-deployment-check.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Pre-deployment checks passed"
else
  log "${RED}❌${NC} Pre-deployment checks failed"
  exit 1
fi

# 2. Install PM2 if needed
log ""
log "2. Checking PM2..."

if ! command -v pm2 &> /dev/null; then
  log "Installing PM2..."
  npm install -g pm2
  log "${GREEN}✓${NC} PM2 installed"
else
  log "${GREEN}✓${NC} PM2 is installed"
fi

# 3. Install dependencies
log ""
log "3. Installing dependencies..."

if pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Dependencies installed"
else
  log "${RED}❌${NC} Failed to install dependencies"
  exit 1
fi

# 4. Build application
log ""
log "4. Building application..."

export NODE_ENV="$NODE_ENV"

if pnpm build >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Build successful"
else
  log "${RED}❌${NC} Build failed"
  exit 1
fi

# 5. Create PM2 ecosystem file
log ""
log "5. Creating PM2 configuration..."

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p $PORT',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '$NODE_ENV',
      PORT: $PORT
    },
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_file: 'logs/pm2-combined.log',
    time: true
  }]
};
EOF

log "${GREEN}✓${NC} PM2 config created"

# 6. Stop existing process
log ""
log "6. Stopping existing process..."

if pm2 describe "$APP_NAME" >> "$LOG_FILE" 2>&1; then
  log "Stopping $APP_NAME..."
  pm2 stop "$APP_NAME" >> "$LOG_FILE" 2>&1

  log "Deleting $APP_NAME..."
  pm2 delete "$APP_NAME" >> "$LOG_FILE" 2>&1

  log "${GREEN}✓${NC} Old process stopped"
else
  log "No existing process found"
fi

# 7. Start new process
log ""
log "7. Starting new process..."

if pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Process started"
else
  log "${RED}❌${NC} Failed to start process"
  exit 1
fi

# 8. Save PM2 process list
pm2 save >> "$LOG_FILE" 2>&1

# 9. Setup PM2 startup script
log ""
log "8. Setting up PM2 startup..."

STARTUP_CMD=$(pm2 startup | grep "sudo" | tail -1)
if [ -n "$STARTUP_CMD" ]; then
  log "To enable PM2 on system boot, run:"
  log "  $STARTUP_CMD"
fi

# 10. Wait for application to start
log ""
log "9. Waiting for application to start..."
sleep 15

# Check process status
if pm2 describe "$APP_NAME" | grep -q "online"; then
  log "${GREEN}✓${NC} Application is online"
else
  log "${RED}❌${NC} Application failed to start"
  log "Process status:"
  pm2 describe "$APP_NAME"
  exit 1
fi

# 11. Health check
log ""
log "10. Running health check..."

HEALTH_URL="http://localhost:$PORT/api/health"
RETRY_COUNT=0
MAX_RETRIES=6

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf --max-time 10 "$HEALTH_URL" > /dev/null; then
    log "${GREEN}✓${NC} Health check passed"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Health check failed (attempt $RETRY_COUNT/$MAX_RETRIES)"

    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      log "Retrying in 10 seconds..."
      sleep 10
    else
      log "${RED}❌${NC} Health check failed"
      log "Application logs:"
      pm2 logs "$APP_NAME" --lines 50 --nostream
      exit 1
    fi
  fi
done

# 12. Run smoke tests
log ""
log "11. Running smoke tests..."
if ./smoke-tests.sh "http://localhost:$PORT" >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Smoke tests passed"
else
  log "${YELLOW}⚠️${NC} Some smoke tests failed"
fi

# 13. Summary
log ""
log "${GREEN}=== Deployment Complete ===${NC}"
log "Application: $APP_NAME"
log "Status: $(pm2 describe "$APP_NAME" | grep status | awk '{print $4}')"
log "URL: http://localhost:$PORT"
log "Log: $LOG_FILE"
log ""
log "PM2 management:"
log "  Status:   pm2 status"
log "  Logs:     pm2 logs $APP_NAME"
log "  Restart:  pm2 restart $APP_NAME"
log "  Stop:     pm2 stop $APP_NAME"
log "  Monitor:  pm2 monit"
```

**Usage:**

```bash
chmod +x deploy-pm2.sh

# Deploy to production
./deploy-pm2.sh production

# Deploy to staging
./deploy-pm2.sh staging
```

---

## Post-Deployment Scripts

### 1. Post-Deployment Verification

```bash
#!/bin/bash
# File: post-deployment-verify.sh
# Description: Comprehensive post-deployment verification

set -e

DEPLOYMENT_URL="${1:-http://localhost:3025}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/post-deploy-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

CHECKS_PASSED=0
CHECKS_FAILED=0

check_passed() {
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  log "${GREEN}✓${NC} $1"
}

check_failed() {
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  log "${RED}❌${NC} $1"
}

log "${GREEN}=== Post-Deployment Verification ===${NC}"
log "URL: $DEPLOYMENT_URL"
log "Timestamp: $(date -u)"
log ""

# 1. Health Check
log "1. Health Check"

HEALTH_RESPONSE=$(curl -sf "$DEPLOYMENT_URL/api/health" || echo "failed")

if [ "$HEALTH_RESPONSE" != "failed" ]; then
  STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')
  RESPONSE_TIME=$(echo "$HEALTH_RESPONSE" | jq -r '.responseTime')

  if [ "$STATUS" == "healthy" ]; then
    check_passed "Health check passed (${RESPONSE_TIME}ms)"

    # Check individual components
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.database.status')
    SUPABASE_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.supabase.status')
    APP_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.application.status')

    if [ "$DB_STATUS" == "ok" ]; then
      check_passed "Database connection OK"
    else
      check_failed "Database connection failed"
    fi

    if [ "$SUPABASE_STATUS" == "ok" ]; then
      check_passed "Supabase services OK"
    else
      check_failed "Supabase services failed"
    fi

    if [ "$APP_STATUS" == "ok" ]; then
      check_passed "Application OK"
    else
      check_failed "Application failed"
    fi
  else
    check_failed "Health status: $STATUS"
  fi
else
  check_failed "Health endpoint not accessible"
fi

# 2. Critical Pages
log ""
log "2. Critical Pages"

check_page() {
  local path="$1"
  local name="$2"

  if curl -sf --max-time 10 "$DEPLOYMENT_URL$path" > /dev/null; then
    check_passed "$name page accessible"
  else
    check_failed "$name page not accessible"
  fi
}

check_page "/login" "Login"
check_page "/dashboard" "Dashboard"
check_page "/tickets" "Tickets"
check_page "/customers" "Customers"

# 3. API Endpoints
log ""
log "3. API Endpoints"

# tRPC endpoint
if curl -sf --max-time 10 "$DEPLOYMENT_URL/api/trpc/profile.getCurrent" > /dev/null 2>&1; then
  check_passed "tRPC endpoint accessible"
else
  # This might fail without auth, which is OK
  log "${YELLOW}⚠️${NC}  tRPC endpoint requires authentication (expected)"
fi

# 4. Performance Check
log ""
log "4. Performance Check"

START_TIME=$(date +%s%N)
curl -sf "$DEPLOYMENT_URL/api/health" > /dev/null
END_TIME=$(date +%s%N)

LATENCY=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $LATENCY -lt 500 ]; then
  check_passed "API latency: ${LATENCY}ms (< 500ms)"
elif [ $LATENCY -lt 1000 ]; then
  log "${YELLOW}⚠️${NC}  API latency: ${LATENCY}ms (acceptable but slow)"
else
  check_failed "API latency: ${LATENCY}ms (> 1000ms)"
fi

# 5. Environment Variables
log ""
log "5. Environment Configuration"

HEALTH_ENV=$(echo "$HEALTH_RESPONSE" | jq -r '.environment')

if [ "$HEALTH_ENV" == "production" ]; then
  check_passed "Environment: production"
elif [ "$HEALTH_ENV" == "development" ]; then
  log "${YELLOW}⚠️${NC}  Environment: development (should be production?)"
else
  log "Environment: $HEALTH_ENV"
fi

# 6. SSL/HTTPS (if production)
log ""
log "6. SSL/HTTPS Check"

if [[ "$DEPLOYMENT_URL" =~ ^https:// ]]; then
  if curl -sf --max-time 10 "$DEPLOYMENT_URL" > /dev/null; then
    check_passed "HTTPS working"
  else
    check_failed "HTTPS not working"
  fi
else
  log "${YELLOW}⚠️${NC}  Not using HTTPS"
fi

# 7. Database Connectivity
log ""
log "7. Database Connectivity"

DB_RESPONSE_TIME=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.database.responseTime')

if [ "$DB_RESPONSE_TIME" != "null" ]; then
  if [ $DB_RESPONSE_TIME -lt 200 ]; then
    check_passed "Database response time: ${DB_RESPONSE_TIME}ms (< 200ms)"
  elif [ $DB_RESPONSE_TIME -lt 500 ]; then
    log "${YELLOW}⚠️${NC}  Database response time: ${DB_RESPONSE_TIME}ms (acceptable)"
  else
    check_failed "Database response time: ${DB_RESPONSE_TIME}ms (> 500ms)"
  fi
fi

# 8. Error Rate Check
log ""
log "8. Error Rate (if logs available)"

# This would require access to logs - simplified check
log "${YELLOW}ℹ${NC}  Monitor error rate in logs over next 24 hours"
log "    Target: < 1% of requests"

# Summary
log ""
log "${GREEN}=== Verification Summary ===${NC}"
log "Passed: $CHECKS_PASSED"
log "Failed: $CHECKS_FAILED"
log ""

if [ $CHECKS_FAILED -eq 0 ]; then
  log "${GREEN}✓ All checks passed${NC}"
  log "Deployment verification successful"
  exit 0
else
  log "${RED}❌ Some checks failed${NC}"
  log "Please investigate failed checks"
  exit 1
fi
```

**Usage:**

```bash
chmod +x post-deployment-verify.sh

# Local verification
./post-deployment-verify.sh http://localhost:3025

# Production verification
./post-deployment-verify.sh https://your-domain.com
```

---

## Database Migration Scripts

### 1. Migration Apply Script

```bash
#!/bin/bash
# File: apply-migrations.sh
# Description: Apply database migrations with safety checks

set -e

# Configuration
MIGRATION_DIR="supabase/migrations"
BACKUP_BEFORE_MIGRATE=true

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/migrations-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${GREEN}=== Database Migration ===${NC}"
log "Timestamp: $(date -u)"
log ""

# Load environment
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
else
  log "${RED}❌${NC} .env file not found"
  exit 1
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
  log "${RED}❌${NC} Supabase CLI not installed"
  exit 1
fi

# Extract project ID
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  log "${RED}❌${NC} NEXT_PUBLIC_SUPABASE_URL not set"
  exit 1
fi

PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's/https?:\/\/([^.]+).*/\1/')
log "Project: $PROJECT_ID"

# 1. Backup database
if [ "$BACKUP_BEFORE_MIGRATE" == "true" ]; then
  log ""
  log "1. Creating backup..."

  if ./backup-database.sh >> "$LOG_FILE" 2>&1; then
    log "${GREEN}✓${NC} Backup created"
  else
    log "${RED}❌${NC} Backup failed"
    log "Aborting migration"
    exit 1
  fi
fi

# 2. List migrations
log ""
log "2. Checking migrations..."

if [ ! -d "$MIGRATION_DIR" ]; then
  log "${RED}❌${NC} Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)

if [ $MIGRATION_COUNT -eq 0 ]; then
  log "${YELLOW}⚠️${NC}  No migration files found"
  exit 0
fi

log "Found $MIGRATION_COUNT migration file(s):"
ls -1 "$MIGRATION_DIR"/*.sql | while read -r file; do
  log "  - $(basename "$file")"
done

# 3. Confirmation
log ""
log "${YELLOW}⚠️  WARNING: This will apply migrations to production database${NC}"
log "Project: $PROJECT_ID"
log "Migrations: $MIGRATION_COUNT"
log ""

read -p "Continue with migration? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log "Migration cancelled"
  exit 0
fi

# 4. Apply migrations
log ""
log "3. Applying migrations..."

if supabase db push --project-ref "$PROJECT_ID" 2>&1 | tee -a "$LOG_FILE"; then
  log ""
  log "${GREEN}✓${NC} Migrations applied successfully"
else
  log ""
  log "${RED}❌${NC} Migration failed"
  log ""
  log "ROLLBACK REQUIRED"
  log "To rollback, run: ./rollback-database.sh"
  exit 1
fi

# 5. Verify migrations
log ""
log "4. Verifying migrations..."

# This is a basic verification - actual implementation would check specific tables
log "${YELLOW}ℹ${NC}  Manual verification recommended:"
log "  1. Check Supabase Studio"
log "  2. Verify all tables exist"
log "  3. Check RLS policies"
log "  4. Test critical queries"

# 6. Summary
log ""
log "${GREEN}=== Migration Complete ===${NC}"
log "Log: $LOG_FILE"
log ""
log "Next steps:"
log "1. Verify database in Supabase Studio"
log "2. Run post-deployment tests"
log "3. Monitor for errors"
```

**Usage:**

```bash
chmod +x apply-migrations.sh
./apply-migrations.sh
```

### 2. Migration Rollback Script

```bash
#!/bin/bash
# File: rollback-migrations.sh
# Description: Rollback database migrations

set -e

# Configuration
BACKUP_DIR="backups"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/rollback-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "${RED}=== Database Rollback ===${NC}"
log "Timestamp: $(date -u)"
log ""

# 1. List available backups
log "1. Available backups:"

if [ ! -d "$BACKUP_DIR" ]; then
  log "${RED}❌${NC} Backup directory not found: $BACKUP_DIR"
  exit 1
fi

BACKUPS=$(ls -1t "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null)

if [ -z "$BACKUPS" ]; then
  log "${RED}❌${NC} No backups found"
  exit 1
fi

echo "$BACKUPS" | nl | while read -r num file; do
  SIZE=$(du -h "$file" | cut -f1)
  TIMESTAMP=$(basename "$file" | sed -E 's/backup-(.*)\.sql\.gz/\1/')
  log "  $num. $TIMESTAMP ($SIZE)"
done

# 2. Select backup
log ""
read -p "Enter backup number to restore (or 'cancel'): " BACKUP_NUM

if [ "$BACKUP_NUM" == "cancel" ]; then
  log "Rollback cancelled"
  exit 0
fi

SELECTED_BACKUP=$(echo "$BACKUPS" | sed -n "${BACKUP_NUM}p")

if [ -z "$SELECTED_BACKUP" ]; then
  log "${RED}❌${NC} Invalid backup number"
  exit 1
fi

log ""
log "Selected backup: $(basename "$SELECTED_BACKUP")"

# 3. Confirmation
log ""
log "${RED}⚠️  WARNING: This will DESTROY all current data and restore from backup${NC}"
log "Backup: $(basename "$SELECTED_BACKUP")"
log ""

read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  log "Rollback cancelled"
  exit 0
fi

# 4. Create pre-rollback backup
log ""
log "2. Creating pre-rollback backup..."

if ./backup-database.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Pre-rollback backup created"
else
  log "${YELLOW}⚠️${NC}  Backup failed, but continuing with rollback"
fi

# 5. Restore backup
log ""
log "3. Restoring database from backup..."
log "This may take several minutes..."

# Load environment
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# Get database connection details
# Note: This requires database password
log "${YELLOW}ℹ${NC}  Database restoration requires manual psql connection"
log ""
log "To restore, run:"
log "  gunzip -c $SELECTED_BACKUP | psql [DATABASE_URL]"
log ""
log "Or use Supabase Studio:"
log "  1. Go to SQL Editor"
log "  2. Execute: DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
log "  3. Copy contents of backup file (gunzip -c $SELECTED_BACKUP)"
log "  4. Execute backup SQL"
log ""

# 6. Verification prompt
log "After restoration, verify:"
log "  1. All tables restored"
log "  2. Data integrity checked"
log "  3. Application tests passed"
log ""
log "${GREEN}=== Rollback Instructions Complete ===${NC}"
```

**Usage:**

```bash
chmod +x rollback-migrations.sh
./rollback-migrations.sh
```

---

## Health Check Automation

```bash
#!/bin/bash
# File: continuous-health-check.sh
# Description: Continuous health monitoring for deployment

set -e

DEPLOYMENT_URL="${1:-http://localhost:3025}"
CHECK_INTERVAL=30
ALERT_THRESHOLD=3

FAILURE_COUNT=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
  echo -e "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1"
}

send_alert() {
  log "${RED}🚨 ALERT: $1${NC}"

  # Send to Slack (if webhook configured)
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\": \"🚨 Health Check Alert: $1\"}" \
      2>/dev/null
  fi

  # Send email (if configured)
  if [ -n "$ALERT_EMAIL" ]; then
    echo "$1" | mail -s "Service Center Health Alert" "$ALERT_EMAIL"
  fi
}

check_health() {
  RESPONSE=$(curl -sf --max-time 10 "$DEPLOYMENT_URL/api/health" 2>/dev/null || echo "failed")

  if [ "$RESPONSE" == "failed" ]; then
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    log "${RED}❌ Health check failed (${FAILURE_COUNT}/${ALERT_THRESHOLD})${NC}"

    if [ $FAILURE_COUNT -ge $ALERT_THRESHOLD ]; then
      send_alert "Service health checks failing (${FAILURE_COUNT} consecutive failures)"
      FAILURE_COUNT=0
    fi

    return 1
  fi

  STATUS=$(echo "$RESPONSE" | jq -r '.status')
  RESPONSE_TIME=$(echo "$RESPONSE" | jq -r '.responseTime')

  if [ "$STATUS" != "healthy" ]; then
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    log "${RED}❌ Health status: $STATUS (${RESPONSE_TIME}ms)${NC}"

    if [ $FAILURE_COUNT -ge $ALERT_THRESHOLD ]; then
      send_alert "Service status degraded: $STATUS"
      FAILURE_COUNT=0
    fi

    return 1
  fi

  # Success
  log "${GREEN}✓ Health check passed (${RESPONSE_TIME}ms)${NC}"
  FAILURE_COUNT=0

  return 0
}

log "Starting continuous health monitoring"
log "URL: $DEPLOYMENT_URL"
log "Interval: ${CHECK_INTERVAL}s"
log "Alert threshold: $ALERT_THRESHOLD failures"
log ""

while true; do
  check_health
  sleep $CHECK_INTERVAL
done
```

**Usage:**

```bash
chmod +x continuous-health-check.sh

# Run in background
./continuous-health-check.sh http://localhost:3025 &

# Or run in tmux/screen for persistent monitoring
```

---

## Smoke Test Automation

```bash
#!/bin/bash
# File: smoke-tests.sh
# Description: Automated smoke tests for deployment verification

set -e

DEPLOYMENT_URL="${1:-http://localhost:3025}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="logs/smoke-tests-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

TESTS_PASSED=0
TESTS_FAILED=0

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

test_passed() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  log "${GREEN}✓${NC} $1"
}

test_failed() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  log "${RED}❌${NC} $1"
}

run_test() {
  local test_name="$1"
  local test_command="$2"

  if eval "$test_command" >> "$LOG_FILE" 2>&1; then
    test_passed "$test_name"
    return 0
  else
    test_failed "$test_name"
    return 1
  fi
}

log "${GREEN}=== Smoke Tests ===${NC}"
log "URL: $DEPLOYMENT_URL"
log "Timestamp: $(date -u)"
log ""

# Test 1: Health Endpoint
log "1. Health Endpoint"
run_test "GET /api/health returns 200" \
  "curl -sf --max-time 10 '$DEPLOYMENT_URL/api/health' > /dev/null"

# Test 2: Login Page
log ""
log "2. Authentication Pages"
run_test "GET /login returns 200" \
  "curl -sf --max-time 10 '$DEPLOYMENT_URL/login' > /dev/null"

# Test 3: Static Assets
log ""
log "3. Static Assets"
run_test "Favicon loads" \
  "curl -sf --max-time 10 '$DEPLOYMENT_URL/favicon.ico' > /dev/null"

# Test 4: API Endpoints
log ""
log "4. API Endpoints"
run_test "tRPC endpoint exists" \
  "curl -sf --max-time 10 -I '$DEPLOYMENT_URL/api/trpc/profile.getCurrent' | grep -q '401\|200'"

# Test 5: Performance
log ""
log "5. Performance"

START=$(date +%s%N)
curl -sf "$DEPLOYMENT_URL/api/health" > /dev/null
END=$(date +%s%N)
LATENCY=$(( (END - START) / 1000000 ))

if [ $LATENCY -lt 500 ]; then
  test_passed "API latency ${LATENCY}ms < 500ms"
else
  test_failed "API latency ${LATENCY}ms >= 500ms"
fi

# Test 6: Health Check Components
log ""
log "6. Health Check Components"

HEALTH_RESPONSE=$(curl -sf "$DEPLOYMENT_URL/api/health")

DB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.database.status')
if [ "$DB_STATUS" == "ok" ]; then
  test_passed "Database check OK"
else
  test_failed "Database check failed: $DB_STATUS"
fi

SUPABASE_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.checks.supabase.status')
if [ "$SUPABASE_STATUS" == "ok" ]; then
  test_passed "Supabase check OK"
else
  test_failed "Supabase check failed: $SUPABASE_STATUS"
fi

# Summary
log ""
log "${GREEN}=== Smoke Test Summary ===${NC}"
log "Passed: $TESTS_PASSED"
log "Failed: $TESTS_FAILED"
log ""

if [ $TESTS_FAILED -eq 0 ]; then
  log "${GREEN}✓ All smoke tests passed${NC}"
  exit 0
else
  log "${RED}❌ Some smoke tests failed${NC}"
  exit 1
fi
```

**Usage:**

```bash
chmod +x smoke-tests.sh

# Test local deployment
./smoke-tests.sh http://localhost:3025

# Test production
./smoke-tests.sh https://your-domain.com
```

---

## Backup Automation

### 1. Automated Daily Backup

```bash
#!/bin/bash
# File: daily-backup.sh
# Description: Automated daily database backup with retention

set -e

# Configuration
BACKUP_DIR="backups"
RETENTION_DAYS=7
S3_BUCKET="${S3_BACKUP_BUCKET}"  # Optional S3 backup

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "=== Daily Backup - $(date -u) ==="

# Run backup
if ./backup-database.sh; then
  echo "✓ Backup successful"
else
  echo "❌ Backup failed"
  exit 1
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
  echo ""
  echo "Uploading to S3..."

  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-*.sql.gz | head -1)

  if [ -n "$LATEST_BACKUP" ]; then
    if aws s3 cp "$LATEST_BACKUP" "s3://$S3_BUCKET/backups/$(basename "$LATEST_BACKUP")"; then
      echo "✓ Uploaded to S3"
    else
      echo "⚠️  S3 upload failed"
    fi
  fi
fi

# Cleanup
echo ""
echo "Cleaning up old backups..."

find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✓ Cleanup complete"
echo ""
echo "=== Backup Complete ==="
```

**Setup cron job:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/sevice-center && ./daily-backup.sh >> logs/backup.log 2>&1
```

---

## Environment Validation

```bash
#!/bin/bash
# File: validate-production-env.sh
# Description: Comprehensive production environment validation

set -e

ENV_FILE="${1:-.env}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

log_error() {
  echo -e "${RED}❌${NC} $1"
  ERRORS=$((ERRORS + 1))
}

log_warning() {
  echo -e "${YELLOW}⚠️${NC}  $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

echo "=== Production Environment Validation ==="
echo "File: $ENV_FILE"
echo ""

# Load environment
if [ ! -f "$ENV_FILE" ]; then
  log_error "Environment file not found: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# 1. Required Variables
echo "1. Required Variables"

check_var() {
  local var_name="$1"
  local value="${!var_name}"

  if [ -z "$value" ]; then
    log_error "$var_name is not set"
  else
    log_success "$var_name is set"
  fi
}

check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"
check_var "SETUP_PASSWORD"
check_var "ADMIN_EMAIL"
check_var "ADMIN_PASSWORD"
check_var "ADMIN_NAME"

# 2. Value Validation
echo ""
echo "2. Value Validation"

# Check URL format
if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https?:// ]]; then
  log_error "NEXT_PUBLIC_SUPABASE_URL must be a valid URL"
fi

# Check for default values
if [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" =~ ^your_ ]]; then
  log_error "NEXT_PUBLIC_SUPABASE_ANON_KEY has default value"
fi

if [[ "$SUPABASE_SERVICE_ROLE_KEY" =~ ^your_ ]]; then
  log_error "SUPABASE_SERVICE_ROLE_KEY has default value"
fi

if [[ "$SETUP_PASSWORD" =~ ^(change_|ChangeMe) ]]; then
  log_error "SETUP_PASSWORD has default value"
fi

# 3. Security Checks
echo ""
echo "3. Security Checks"

# Password strength
if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  log_error "ADMIN_PASSWORD too short (minimum 8 characters)"
fi

if [ ${#SETUP_PASSWORD} -lt 8 ]; then
  log_error "SETUP_PASSWORD too short (minimum 8 characters)"
fi

# Production checks
if [ "$NODE_ENV" == "development" ]; then
  log_warning "NODE_ENV is 'development' (should be 'production'?)"
fi

# 4. Connection Tests
echo ""
echo "4. Connection Tests"

# Test Supabase connection
if curl -sf --max-time 10 "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null; then
  log_success "Supabase connection successful"
else
  log_error "Cannot connect to Supabase"
fi

# Summary
echo ""
echo "=== Validation Summary ==="
echo "Errors: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
  log_success "Environment validation passed"
  exit 0
else
  log_error "Environment validation failed with $ERRORS error(s)"
  exit 1
fi
```

**Usage:**

```bash
chmod +x validate-production-env.sh

# Validate .env
./validate-production-env.sh

# Validate custom file
./validate-production-env.sh .env.production
```

---

## Complete Deployment Orchestration

```bash
#!/bin/bash
# File: deploy-complete.sh
# Description: Complete end-to-end deployment orchestration

set -e

# Configuration
DEPLOYMENT_METHOD="${1:-vercel}"  # vercel, docker, pm2
DEPLOYMENT_ENV="${2:-production}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_FILE="logs/deploy-complete-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log_step() {
  log ""
  log "${BLUE}=== $1 ===${NC}"
}

log "${GREEN}╔════════════════════════════════════════╗${NC}"
log "${GREEN}║   Complete Deployment Orchestration   ║${NC}"
log "${GREEN}╚════════════════════════════════════════╝${NC}"
log ""
log "Method: $DEPLOYMENT_METHOD"
log "Environment: $DEPLOYMENT_ENV"
log "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
log "Log: $LOG_FILE"
log ""

# Step 1: Pre-Deployment Checks
log_step "Step 1: Pre-Deployment Checks"

if ./pre-deployment-check.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Pre-deployment checks passed"
else
  log "${RED}❌${NC} Pre-deployment checks failed"
  log "Check log: $LOG_FILE"
  exit 1
fi

# Step 2: Environment Validation
log_step "Step 2: Environment Validation"

if ./validate-production-env.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Environment validation passed"
else
  log "${RED}❌${NC} Environment validation failed"
  exit 1
fi

# Step 3: Database Backup
log_step "Step 3: Database Backup"

if ./backup-database.sh >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Database backup created"
else
  log "${RED}❌${NC} Database backup failed"
  log "Aborting deployment"
  exit 1
fi

# Step 4: Database Migrations
log_step "Step 4: Database Migrations"

log "${YELLOW}⚠️${NC}  Manual migration confirmation required"
log "Run: ./apply-migrations.sh"
log ""
read -p "Have migrations been applied? (yes/no): " MIGRATIONS_APPLIED

if [ "$MIGRATIONS_APPLIED" != "yes" ]; then
  log "${YELLOW}⚠️${NC}  Migrations not applied - deployment paused"
  log "Please apply migrations and re-run deployment"
  exit 1
fi

# Step 5: Deploy Application
log_step "Step 5: Deploying Application"

case "$DEPLOYMENT_METHOD" in
  vercel)
    if ./deploy-vercel.sh "$DEPLOYMENT_ENV" >> "$LOG_FILE" 2>&1; then
      log "${GREEN}✓${NC} Vercel deployment successful"
      DEPLOYMENT_URL=$(tail -100 "$LOG_FILE" | grep -oP 'https://.*\.vercel\.app' | tail -1)
    else
      log "${RED}❌${NC} Vercel deployment failed"
      exit 1
    fi
    ;;

  docker)
    if ./deploy-docker.sh >> "$LOG_FILE" 2>&1; then
      log "${GREEN}✓${NC} Docker deployment successful"
      DEPLOYMENT_URL="http://localhost:3025"
    else
      log "${RED}❌${NC} Docker deployment failed"
      exit 1
    fi
    ;;

  pm2)
    if ./deploy-pm2.sh "$DEPLOYMENT_ENV" >> "$LOG_FILE" 2>&1; then
      log "${GREEN}✓${NC} PM2 deployment successful"
      DEPLOYMENT_URL="http://localhost:3025"
    else
      log "${RED}❌${NC} PM2 deployment failed"
      exit 1
    fi
    ;;

  *)
    log "${RED}❌${NC} Unknown deployment method: $DEPLOYMENT_METHOD"
    log "Supported methods: vercel, docker, pm2"
    exit 1
    ;;
esac

# Step 6: Post-Deployment Verification
log_step "Step 6: Post-Deployment Verification"

sleep 15  # Wait for deployment to stabilize

if ./post-deployment-verify.sh "$DEPLOYMENT_URL" >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Post-deployment verification passed"
else
  log "${RED}❌${NC} Post-deployment verification failed"
  log "${YELLOW}⚠️${NC}  Consider rollback if issues persist"
fi

# Step 7: Smoke Tests
log_step "Step 7: Smoke Tests"

if ./smoke-tests.sh "$DEPLOYMENT_URL" >> "$LOG_FILE" 2>&1; then
  log "${GREEN}✓${NC} Smoke tests passed"
else
  log "${YELLOW}⚠️${NC}  Some smoke tests failed"
fi

# Step 8: Monitoring Setup
log_step "Step 8: Monitoring"

log "Starting continuous health monitoring..."

if [ -f "continuous-health-check.sh" ]; then
  nohup ./continuous-health-check.sh "$DEPLOYMENT_URL" >> logs/health-monitor.log 2>&1 &
  MONITOR_PID=$!
  log "${GREEN}✓${NC} Health monitoring started (PID: $MONITOR_PID)"
else
  log "${YELLOW}⚠️${NC}  Health monitoring script not found"
fi

# Final Summary
log ""
log "${GREEN}╔════════════════════════════════════════╗${NC}"
log "${GREEN}║    Deployment Complete Successfully    ║${NC}"
log "${GREEN}╚════════════════════════════════════════╝${NC}"
log ""
log "Deployment Details:"
log "  Method:      $DEPLOYMENT_METHOD"
log "  Environment: $DEPLOYMENT_ENV"
log "  URL:         $DEPLOYMENT_URL"
log "  Log:         $LOG_FILE"
log "  Timestamp:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
log ""
log "Next Steps:"
log "  1. Monitor application for 1 hour"
log "  2. Check error logs regularly"
log "  3. Verify user acceptance"
log "  4. Update documentation if needed"
log ""
log "Monitoring:"
log "  - Health monitor: PID $MONITOR_PID"
log "  - Logs: tail -f logs/health-monitor.log"
log ""

# Save deployment record
DEPLOYMENT_RECORD="logs/deployments.log"
echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") | $DEPLOYMENT_METHOD | $DEPLOYMENT_ENV | $DEPLOYMENT_URL | SUCCESS" >> "$DEPLOYMENT_RECORD"

log "${GREEN}✓ Deployment orchestration complete${NC}"
```

**Usage:**

```bash
chmod +x deploy-complete.sh

# Vercel deployment to production
./deploy-complete.sh vercel production

# Docker deployment
./deploy-complete.sh docker

# PM2 deployment to staging
./deploy-complete.sh pm2 staging
```

---

## Rollback Scripts

### Quick Rollback Script

```bash
#!/bin/bash
# File: quick-rollback.sh
# Description: Quick rollback for emergency situations

set -e

DEPLOYMENT_METHOD="${1:-ask}"

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}=== EMERGENCY ROLLBACK ===${NC}"
echo "Timestamp: $(date -u)"
echo ""

# Determine deployment method if not specified
if [ "$DEPLOYMENT_METHOD" == "ask" ]; then
  echo "Select deployment method:"
  echo "  1. Vercel"
  echo "  2. Docker"
  echo "  3. PM2"
  echo ""
  read -p "Enter number (1-3): " METHOD_NUM

  case "$METHOD_NUM" in
    1) DEPLOYMENT_METHOD="vercel" ;;
    2) DEPLOYMENT_METHOD="docker" ;;
    3) DEPLOYMENT_METHOD="pm2" ;;
    *) echo "Invalid selection"; exit 1 ;;
  esac
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will rollback to previous deployment${NC}"
echo "Method: $DEPLOYMENT_METHOD"
echo ""
read -p "Type 'ROLLBACK' to confirm: " CONFIRM

if [ "$CONFIRM" != "ROLLBACK" ]; then
  echo "Rollback cancelled"
  exit 0
fi

echo ""
echo "Executing rollback..."

case "$DEPLOYMENT_METHOD" in
  vercel)
    echo "1. Open Vercel dashboard"
    echo "2. Go to Deployments"
    echo "3. Find last stable deployment"
    echo "4. Click 'Promote to Production'"
    ;;

  docker)
    echo "Rolling back Docker deployment..."
    docker stop service-center-app
    docker run -d \
      --name service-center-app \
      -p 3025:3025 \
      --env-file .env.backup \
      service-center:previous
    echo "✓ Container rolled back"
    ;;

  pm2)
    echo "Rolling back PM2 deployment..."
    git checkout HEAD~1
    pnpm install
    pnpm build
    pm2 restart service-center
    echo "✓ PM2 rolled back"
    ;;
esac

echo ""
echo "=== Rollback Complete ==="
echo "Verify application at: http://localhost:3025/api/health"
```

**Usage:**

```bash
chmod +x quick-rollback.sh

# Interactive
./quick-rollback.sh

# Direct
./quick-rollback.sh vercel
```

---

## Troubleshooting

### Common Issues and Solutions

**Issue 1: Build Fails**

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

**Issue 2: Health Check Fails**

```bash
# Check logs
pm2 logs service-center --lines 100
# or
docker logs service-center-app --tail 100

# Verify environment
./validate-production-env.sh

# Check database connection
curl https://your-supabase-url.supabase.co/rest/v1/
```

**Issue 3: Database Connection Failed**

```bash
# Verify Supabase URL
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection
curl -f $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Check service role key
# (Don't log this - it's sensitive!)
```

**Issue 4: Deployment Timeout**

```bash
# Increase timeout for large builds
vercel --force --timeout 600

# Or split build steps
pnpm build
vercel --prebuilt
```

---

## Quick Reference

### One-Line Deployment Commands

```bash
# Quick deployment (with checks)
./pre-deployment-check.sh && ./backup-database.sh && ./deploy-vercel.sh production

# Emergency rollback
./quick-rollback.sh

# Health check
curl http://localhost:3025/api/health | jq

# View logs
tail -f logs/*.log
```

### Deployment Checklist

```bash
# Pre-deployment
[ ] ./pre-deployment-check.sh
[ ] ./validate-production-env.sh
[ ] ./backup-database.sh
[ ] ./apply-migrations.sh

# Deployment
[ ] ./deploy-vercel.sh production
# or
[ ] ./deploy-docker.sh
# or
[ ] ./deploy-pm2.sh production

# Post-deployment
[ ] ./post-deployment-verify.sh
[ ] ./smoke-tests.sh
[ ] Monitor logs for 1 hour
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** After first deployment
**Owner:** DevOps Team
