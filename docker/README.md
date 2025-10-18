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
- **Supports 2 deployment modes**: Local and Production
- Usage:
  ```bash
  # 1. Edit configuration in the script
  nano docker/scripts/setup-instance.sh

  # 2. Run the script
  ./docker/scripts/setup-instance.sh
  ```
- **Deployment Modes:**
  - `DEPLOYMENT_MODE=local` - Local development (http://localhost, no Cloudflare Tunnel)
  - `DEPLOYMENT_MODE=production` - Production with public domain (https://, requires Cloudflare Tunnel)
- Configuration variables (only these need to be set):
  - `DEPLOYMENT_MODE` - Choose `local` or `production`
  - `CENTER_NAME` - Service center name
  - `APP_PORT` - Application port (3025, 3026, 3027...)
  - `PRODUCTION_DOMAIN` - Domain for production mode (e.g., `sv.mydomain.com`)
  - `SETUP_PASSWORD` - Setup page password (auto-generated if empty)
  - `ADMIN_EMAIL` - Email for first admin account
  - `ADMIN_PASSWORD` - Password for first admin account
  - `ADMIN_NAME` - Full name for first admin account
  - `SMTP_*` - Email configuration
- Auto-calculated values (derived from APP_PORT and DEPLOYMENT_MODE):
  - `STUDIO_PORT = 3000 + (APP_PORT - 3025) × 100`
  - `KONG_PORT = 8000 + (APP_PORT - 3025)`
  - URLs based on mode:
    - **Local**: `http://localhost:{PORT}`
    - **Production**: `https://{domain}`, `https://api.{domain}`, `https://supabase.{domain}`

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
   # Choose deployment mode
   DEPLOYMENT_MODE=local              # Use 'local' or 'production'

   CENTER_NAME="Your Service Center"
   APP_PORT=3025                      # Only port you need to configure!

   # For production mode only
   PRODUCTION_DOMAIN="sv.yourdomain.com"

   # Setup password (for /setup endpoint)
   SETUP_PASSWORD=your-setup-password

   # Admin account (created via /setup endpoint)
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="YourSecurePassword"
   ADMIN_NAME="System Administrator"

   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   # ... etc
   ```

   **Note:** Script automatically calculates and derives:
   - `STUDIO_PORT = 3000` (from APP_PORT 3025)
   - `KONG_PORT = 8000` (from APP_PORT 3025)
   - URLs based on DEPLOYMENT_MODE:
     - **Local mode**: `http://localhost:3025`, `http://localhost:8000`, `http://localhost:3000`
     - **Production mode**: `https://sv.yourdomain.com`, `https://api.sv.yourdomain.com`, `https://supabase.sv.yourdomain.com`

2. **Run setup script:**
   ```bash
   chmod +x docker/scripts/setup-instance.sh
   ./docker/scripts/setup-instance.sh
   ```

   The script will automatically:
   - ✅ Generate all secrets (hex format, URL-safe)
   - ✅ Copy configuration files from `docs/references/volumes/`
   - ✅ Create `.env` file with all settings (including admin credentials)
   - ✅ Generate Supabase API keys
   - ✅ Create `INSTANCE_INFO.txt` with all configuration details
   - ✅ Display setup password and admin credentials

3. **Build and deploy:**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Apply database schema:**
   ```bash
   ./docker/scripts/apply-schema.sh
   ```

5. **Setup Cloudflare Tunnel** (production mode only - see [DEPLOYMENT.md](../DEPLOYMENT.md) for details)

6. **Access setup page to create admin account:**
   - **Local mode**: `http://localhost:3025/setup`
   - **Production mode**: `https://yourdomain.com/setup`
   - Enter the setup password from step 2
   - This creates the admin account with the credentials you configured (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)

7. **Login with admin account:**
   - **Local mode**: `http://localhost:3025/login`
   - **Production mode**: `https://yourdomain.com/login`
   - Use ADMIN_EMAIL and ADMIN_PASSWORD from your configuration

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

The stack supports **two access modes**:

### 🏠 Local Development Mode
```
Browser (localhost)
    │
    ├─> http://localhost:3025 (Next.js App)       ← APP_PORT
    │   └─> kong:8000 (internal Docker network)
    │
    ├─> http://localhost:8000 (Kong/Supabase API) ← KONG_PORT
    │   ├─> db:5432 (PostgreSQL - internal)
    │   ├─> auth (GoTrue - internal)
    │   ├─> storage (Storage API - internal)
    │   └─> realtime (Realtime - internal)
    │
    └─> http://localhost:3000 (Supabase Studio)   ← STUDIO_PORT
```

### 🌐 Production Mode (with Cloudflare Tunnel)
```
Internet
    │
    ├─> Cloudflare Tunnel (handles SSL/TLS)
    │
    ├─> localhost:3025 (Next.js App)              ← APP_PORT (configurable)
    │   └─> kong:8000 (internal Docker network)
    │
    ├─> localhost:8000 (Kong/Supabase API)        ← KONG_PORT (configurable)
    │   ├─> db:5432 (PostgreSQL - internal)
    │   ├─> auth (GoTrue - internal)
    │   ├─> storage (Storage API - internal)
    │   └─> realtime (Realtime - internal)
    │
    └─> localhost:3000 (Supabase Studio)          ← STUDIO_PORT (configurable)
```

**Important URLs:**
- **Server-side (inside Docker)**: Always uses `http://kong:8000` (internal network)
- **Client-side (browser)**:
  - Local: `http://localhost:8000`
  - Production: `https://api.yourdomain.com` (via Cloudflare Tunnel)

**Port Configuration:**
- `APP_PORT` - Application port (you configure this)
- `STUDIO_PORT` - Auto-calculated: `3000 + (APP_PORT - 3025) × 100`
- `KONG_PORT` - Auto-calculated: `8000 + (APP_PORT - 3025)` - **Required for browser access**
- Multi-instance: Just change APP_PORT, everything else auto-calculates
  - Instance 1: APP_PORT=3025 → STUDIO_PORT=3000, KONG_PORT=8000
  - Instance 2: APP_PORT=3026 → STUDIO_PORT=3100, KONG_PORT=8001
  - Instance 3: APP_PORT=3027 → STUDIO_PORT=3200, KONG_PORT=8002

**Benefits:**
- ✅ **Local mode**: Quick testing without Cloudflare setup
- ✅ **Production mode**: Secure external access via Cloudflare Tunnel
- ✅ No exposed ports (80/443) in production
- ✅ Automatic SSL/TLS in production
- ✅ DDoS protection (production)
- ✅ Global CDN (production)
- ✅ Easy to setup both modes
- ✅ Multi-instance support
- ✅ Seamless transition from local to production

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
