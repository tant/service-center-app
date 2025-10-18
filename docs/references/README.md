# Reference Configuration Files

This directory contains clean reference copies of all configuration files needed for fresh deployments.

## Purpose

These files serve as the **source of truth** for initial deployment configuration. When starting a fresh deployment, copy these files to the appropriate locations in your project.

## Contents

### 1. Environment Templates

- `.env.docker.example` - Template for Docker deployment
- `.env.example` - Template for local development with Supabase CLI

### 2. Volume Configuration Files

```
volumes/
├── api/
│   └── kong.yml              # Kong API Gateway configuration
├── db/
│   ├── _supabase.sql         # Supabase core schema
│   ├── init/data.sql         # Initial database data
│   ├── jwt.sql               # JWT configuration
│   ├── logs.sql              # Logging configuration
│   ├── pooler.sql            # Connection pooler setup
│   ├── realtime.sql          # Realtime configuration
│   ├── roles.sql             # Database roles
│   └── webhooks.sql          # Webhook configuration
├── functions/
│   ├── hello/index.ts        # Example edge function
│   └── main/index.ts         # Main edge function
├── logs/
│   └── vector.yml            # Vector logging configuration
└── pooler/
    └── pooler.exs            # Supavisor pooler configuration
```

## Usage for Fresh Deployment

### Quick Start

```bash
# 1. Copy volume configuration files
cp -r docs/references/volumes/* volumes/

# 2. Copy environment template
cp docs/references/.env.docker.example .env

# 3. Generate secrets (see DEPLOYMENT.md Step 2.3)
openssl rand -base64 32  # For passwords and keys

# 4. Generate API keys (see DEPLOYMENT.md Step 2.4)
node docker/scripts/generate-keys.js "$(grep ^JWT_SECRET .env | cut -d '=' -f2)"

# 5. Build and start services
docker compose build
docker compose up -d

# 6. Apply database schema
./docker/scripts/apply-schema.sh
```

### Detailed Instructions

For complete deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md)

## Maintenance

These reference files should be updated when:

1. Configuration formats change
2. New required configuration files are added
3. Default values need to be updated
4. Security best practices evolve

## Notes

- ⚠️ **Never** store actual secrets in this directory
- ✅ These files are tracked in git
- ✅ Safe to share publicly (no sensitive data)
- 🔄 Keep synchronized with `volumes/` when making configuration changes
