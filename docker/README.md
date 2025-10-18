# Docker Configuration Files

This directory contains all Docker-related configuration files for the Service Center Management system.

## Directory Structure

```
docker/
└── scripts/                   # Helper scripts
    ├── setup-instance.sh      # Automated instance setup (Step 1.2-1.6)
    ├── apply-schema.sh        # Database schema deployment
    ├── generate-keys.js       # Generate Supabase API keys
    ├── deploy.sh              # Deployment automation
    └── backup.sh              # Backup automation
```

**Note:** Configuration files (kong.yml, vector.yml, etc.) are located in:
- **Reference copies:** `docs/references/volumes/`
- **Active copies:** `volumes/` (created by setup script)

## Files Overview

### Configuration Files Location

All Supabase configuration files are managed through the volumes system:

**volumes/api/kong.yml**
- Kong API Gateway declarative configuration
- Routes for REST API, Auth, Realtime, Storage
- CORS configuration
- Key authentication setup
- **Reference copy:** `docs/references/volumes/api/kong.yml`
- **Automatically copied** by `setup-instance.sh`

**volumes/logs/vector.yml**
- Vector logging configuration
- **Reference copy:** `docs/references/volumes/logs/vector.yml`

**volumes/db/*.sql**
- Database initialization scripts
- **Reference copies:** `docs/references/volumes/db/`

To modify configuration:
1. Edit files in `docs/references/volumes/` (source of truth)
2. Re-run setup script OR manually copy to `volumes/`

### Helper Scripts

**scripts/setup-instance.sh** ⭐ **NEW - Automated Setup**
- **Main setup script** - Automates DEPLOYMENT.md Steps 1.2-1.6
- Generates all secrets in hex format (URL-safe)
- Copies configuration files from `docs/references/volumes/`
- Creates `.env` file with all settings
- Generates Supabase API keys automatically
- Usage:
  ```bash
  # 1. Edit configuration in the script
  nano docker/scripts/setup-instance.sh

  # 2. Run the script
  ./docker/scripts/setup-instance.sh
  ```
- Configuration variables (only these need to be set):
  - `CENTER_NAME` - Service center name
  - `APP_PORT` - Application port (3025, 3026, 3027...)
  - `SITE_URL` - Domain (e.g., `sv.mydomain.com` or `localhost`)
  - `SMTP_*` - Email configuration
  - `SETUP_PASSWORD` - Setup page password (auto-generated if empty)
- Auto-calculated values (derived from APP_PORT):
  - `STUDIO_PORT = 3000 + (APP_PORT - 3025) × 100`
  - `KONG_PORT = 8000 + (APP_PORT - 3025)`
  - URLs (api.domain, supabase.domain) auto-derived from SITE_URL

**scripts/apply-schema.sh**
- Applies database schema to running instance
- Validates database is running before applying
- Applies schema files in correct order
- Creates storage buckets
- Verifies deployment success
- Usage: `./docker/scripts/apply-schema.sh`

**scripts/generate-keys.js**
- Generates SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
- Uses JWT_SECRET to sign tokens
- Called automatically by `setup-instance.sh`
- Manual usage: `node docker/scripts/generate-keys.js <JWT_SECRET>`

**scripts/deploy.sh**
- Interactive deployment script
- Options for fresh deploy, update, restart, stop, logs, cleanup
- Validates environment before deployment
- Usage: `./docker/scripts/deploy.sh`

**scripts/backup.sh**
- Automated backup script
- Backs up PostgreSQL database, uploads, and .env file
- Cleans up backups older than 7 days
- Usage: `./docker/scripts/backup.sh`

## Quick Start

### Automated Setup (Recommended)

1. **Edit setup script configuration:**
   ```bash
   nano docker/scripts/setup-instance.sh
   ```

   Configure these values:
   ```bash
   CENTER_NAME="Your Service Center"
   APP_PORT=3025              # Only port you need to configure!
   SITE_URL="sv.yourdomain.com"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   # ... etc
   ```

   **Note:** Script automatically calculates and derives:
   - `STUDIO_PORT = 3000` (from APP_PORT 3025)
   - `KONG_PORT = 8000` (from APP_PORT 3025)
   - App URL: `https://sv.yourdomain.com`
   - API URL: `https://api.sv.yourdomain.com`
   - Studio URL: `https://supabase.sv.yourdomain.com`

2. **Run setup script:**
   ```bash
   chmod +x docker/scripts/setup-instance.sh
   ./docker/scripts/setup-instance.sh
   ```

   The script will automatically:
   - ✅ Generate all secrets (hex format, URL-safe)
   - ✅ Copy configuration files from `docs/references/volumes/`
   - ✅ Create `.env` file with all settings
   - ✅ Generate Supabase API keys
   - ✅ Create `INSTANCE_INFO.txt` with all configuration details
   - ✅ Display setup password

3. **Build and deploy:**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Apply database schema:**
   ```bash
   ./docker/scripts/apply-schema.sh
   ```

5. **Setup Cloudflare Tunnel** (see [DEPLOYMENT.md](../DEPLOYMENT.md) for details)

6. **Access setup page:**
   - Visit: `https://yourdomain.com/setup`
   - Use the setup password from step 2

### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Generate environment file:**
   ```bash
   cp .env.docker.example .env
   nano .env  # Fill in your values (use hex secrets!)
   ```

2. **Generate secrets (hex format):**
   ```bash
   openssl rand -hex 32  # For passwords and keys
   ```

3. **Generate API keys:**
   ```bash
   node docker/scripts/generate-keys.js "<your-jwt-secret>"
   ```

4. **Copy configuration files:**
   ```bash
   cp -r docs/references/volumes/* volumes/
   ```

5. **Deploy:**
   ```bash
   ./docker/scripts/deploy.sh
   ```

## Customization

### Change Kong Routes

1. Edit the reference file: `docs/references/volumes/api/kong.yml`
2. Copy to active location: `cp docs/references/volumes/api/kong.yml volumes/api/kong.yml`
3. Restart Kong: `docker compose restart kong`

**Note:** Changes to `volumes/api/kong.yml` directly will be lost when you re-run setup script.

### Add New Scripts

Create new scripts in `scripts/` directory and make them executable:
```bash
chmod +x docker/scripts/your-script.sh
```

## Maintenance

### View Service Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
docker compose logs -f kong
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart app
```

### Database Operations
```bash
# Connect to database
docker compose exec db psql -U postgres

# Backup database
docker compose exec -T db pg_dump -U postgres postgres > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U postgres
```

## Security Notes

- ✅ Never commit .env files to git
- ✅ Use hex-format secrets (URL-safe, no special characters)
- ✅ Setup script generates 32-byte secrets automatically
- ✅ All services are bound to localhost only (127.0.0.1)
- ✅ Cloudflare Tunnel provides secure external access
- ✅ Restrict Studio access in production (use Cloudflare Access)
- ✅ Each instance has isolated database and network

## Network Architecture

The stack uses **Cloudflare Tunnel** for external access:

```
Internet
    │
    ├─> Cloudflare Tunnel (handles SSL/TLS)
    │
    ├─> localhost:3025 (Next.js App)              ← APP_PORT (configurable)
    │   └─> kong:8000 (internal network)
    │
    ├─> localhost:8000 (Kong/Supabase API)        ← KONG_PORT (configurable)
    │   ├─> db:5432 (PostgreSQL - internal)
    │   ├─> auth (GoTrue - internal)
    │   ├─> storage (Storage API - internal)
    │   └─> realtime (Realtime - internal)
    │
    └─> localhost:3000 (Supabase Studio)          ← STUDIO_PORT (configurable)
```

**Port Configuration:**
- `APP_PORT` - Application port (you configure this)
- `STUDIO_PORT` - Auto-calculated: `3000 + (APP_PORT - 3025) × 100`
- `KONG_PORT` - Auto-calculated: `8000 + (APP_PORT - 3025)` - **Required for browser access**
- Multi-instance: Just change APP_PORT, everything else auto-calculates
  - Instance 1: APP_PORT=3025 → STUDIO_PORT=3000, KONG_PORT=8000
  - Instance 2: APP_PORT=3026 → STUDIO_PORT=3100, KONG_PORT=8001
  - Instance 3: APP_PORT=3027 → STUDIO_PORT=3200, KONG_PORT=8002

**Benefits:**
- ✅ No exposed ports (80/443)
- ✅ Automatic SSL/TLS
- ✅ DDoS protection
- ✅ Global CDN
- ✅ Easy to setup
- ✅ Multi-instance support

## Documentation

For complete deployment guide, see:
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Production deployment with Cloudflare Tunnel
- **[DEVELOPMENT.md](../DEVELOPMENT.md)** - Local development guide
- **[README.md](../README.md)** - Project overview

## Support

If you encounter issues:
1. Check logs: `docker compose logs <service>`
2. Refer to [Troubleshooting section](../DEPLOYMENT.md#troubleshooting)
3. Open an issue on GitHub
