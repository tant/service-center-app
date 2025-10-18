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
- Generates Supabase API keys from JWT_SECRET
- **Generates:**
  - `SUPABASE_ANON_KEY` - For Docker Compose services (Kong, Analytics, etc.)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For Next.js browser + server client access (same value as SUPABASE_ANON_KEY)
  - `SUPABASE_SERVICE_ROLE_KEY` - For server-side admin operations (bypasses RLS)
- **Note:** SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY have the **same value** but different purposes:
  - SUPABASE_ANON_KEY: Used in docker-compose.yml for Supabase services
  - NEXT_PUBLIC_SUPABASE_ANON_KEY: Used by Next.js (accessible to browser via NEXT_PUBLIC_ prefix)
- Uses JWT_SECRET to sign tokens with 10-year expiration
- Called automatically by `setup-instance.sh`
- Manual usage: `node docker/scripts/generate-keys.js <JWT_SECRET>`

**scripts/deploy.sh** ⭐ **MAIN ENTRY POINT**
- **Primary deployment script** - handles complete deployment workflow
- Interactive menu with 7 options:
  1. **🆕 Complete fresh deployment** - Runs entire workflow (setup → build → deploy → schema)
  2. **🏗️ Build and deploy only** - Requires existing .env file
  3. **🔄 Update application only** - Rebuild app container
  4. **♻️ Restart all services** - Restart without rebuild
  5. **📋 View logs** - Stream container logs
  6. **🛑 Stop all services** - Stop all containers
  7. **🧹 Clean up** - Remove containers, volumes, .env, INSTANCE_INFO.txt
- **Option 1 (Complete fresh deployment)** automatically:
  - Runs setup-instance.sh (generate secrets, create .env)
  - Builds Docker images
  - Starts all services
  - Waits for database to be ready
  - Applies database schema automatically
  - Displays access information and next steps
- Usage: `./docker/scripts/deploy.sh`

**scripts/backup.sh**
- Automated backup script
- Backs up PostgreSQL database, uploads, and .env file
- Cleans up backups older than 7 days
- Usage: `./docker/scripts/backup.sh`

## Quick Start

### ⭐ Automated Deployment (Recommended - ONE COMMAND!)

**Easiest way** - Use the deploy script which handles everything:

1. **Edit configuration:**
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
   SETUP_PASSWORD=""                  # Auto-generated if empty

   # Admin account (created via /setup endpoint)
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="YourSecurePassword"
   ADMIN_NAME="System Administrator"

   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   # ... etc
   ```

2. **Run deployment script:**
   ```bash
   chmod +x docker/scripts/deploy.sh
   ./docker/scripts/deploy.sh

   # Select option 1: Complete fresh deployment
   ```

   The script will automatically:
   - ✅ **Step 1/4**: Run setup-instance.sh
     - Generate all secrets (hex format, URL-safe)
     - Copy configuration files
     - Create .env and INSTANCE_INFO.txt
     - Generate Supabase API keys
   - ✅ **Step 2/4**: Build Docker images
   - ✅ **Step 3/4**: Start all services and wait for database
   - ✅ **Step 4/4**: Apply database schema automatically
   - ✅ Display access information and next steps

3. **Setup Cloudflare Tunnel** (production mode only - see [DEPLOYMENT.md](../DEPLOYMENT.md) for details)

4. **Access setup page to create admin account:**
   - **Local mode**: `http://localhost:3025/setup`
   - **Production mode**: `https://yourdomain.com/setup`
   - Enter the setup password (from INSTANCE_INFO.txt)
   - This creates the admin account with your configured credentials

5. **Login with admin account:**
   - **Local mode**: `http://localhost:3025/login`
   - **Production mode**: `https://yourdomain.com/login`
   - Use ADMIN_EMAIL and ADMIN_PASSWORD from your configuration

### Manual Setup (Advanced)

If you prefer manual configuration or need more control over individual steps:

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
- ✅ Each instance has isolated database and network

### Supabase Studio Security

**Studio Authentication:**
- Studio is protected by **HTTP Basic Auth** when accessed through Kong Gateway
- Credentials: `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` (auto-generated by setup script)
- Access Studio via Kong URL (e.g., `https://sv3.tantran.dev`) - requires authentication

**Production Recommendations:**
- ⚠️ **Access Studio ONLY through Kong Gateway URL** (with authentication)
- ⚠️ **Firewall direct port access** (STUDIO_PORT) in production - only allow localhost
- ✅ Consider adding **Cloudflare Access** for additional layer of protection
- ✅ Rotate Studio password regularly
- ✅ Use strong password (setup script auto-generates 16-byte hex string)

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

## Environment Variables

### Supabase Configuration

The application uses a **consolidated environment variable scheme** to eliminate redundancy:

**Required Variables:**

1. **`NEXT_PUBLIC_SUPABASE_URL`** - Public Supabase URL
   - Browser and server-side access
   - Local: `http://localhost:8000` (matches KONG_PORT)
   - Production: `https://api.yourdomain.com` (via Cloudflare Tunnel)

2. **`SUPABASE_ANON_KEY`** - Anon/Public key (Docker services)
   - Used by Docker Compose services (Kong, Analytics, Vector)
   - Respects Row Level Security (RLS)
   - Generated from JWT_SECRET

3. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Anon/Public key (Next.js)
   - Same value as SUPABASE_ANON_KEY
   - Accessible to browser via NEXT_PUBLIC_ prefix
   - Used by all Supabase client code (browser, server, middleware)
   - Respects Row Level Security (RLS)

4. **`SUPABASE_SERVICE_ROLE_KEY`** - Service role key (Server-side only)
   - Server-side admin operations only
   - **Bypasses RLS** - never expose to client
   - Used by admin client and tRPC procedures
   - Generated from JWT_SECRET

5. **`SUPABASE_URL`** - Internal Docker network URL
   - Server-side code running inside Docker containers
   - Always `http://kong:8000` (internal network)
   - Fallback to NEXT_PUBLIC_SUPABASE_URL if not set

**Why two ANON_KEY variables?**

These have the **same value** but serve different purposes:
- `SUPABASE_ANON_KEY` → Referenced in `docker-compose.yml` for Supabase infrastructure services
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Used by Next.js application (accessible in browser)

**Example .env snippet:**
```bash
# Supabase Keys (same value, different purposes)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# Service role key (server-side only, never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# URLs
SUPABASE_URL=http://kong:8000
NEXT_PUBLIC_SUPABASE_URL=https://api.yourdomain.com
```

**Code Usage:**
- Browser client (`src/utils/supabase/client.ts`): Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server client (`src/utils/supabase/server.ts`): Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Middleware (`src/utils/supabase/middleware.ts`): Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Admin client (`src/utils/supabase/admin.ts`): Uses `SUPABASE_SERVICE_ROLE_KEY`
- Docker services (`docker-compose.yml`): Use `SUPABASE_ANON_KEY`

### No Fallback Logic

The application uses **single, well-defined variables** with no fallback logic. This ensures:
- ✅ Clear error messages if variables are missing
- ✅ No confusion about which variable is being used
- ✅ Easier debugging and maintenance
- ✅ Scripts automatically generate all required variables

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
