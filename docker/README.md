# Docker Configuration Files

This directory contains all Docker-related configuration files for the Service Center Management system.

## Directory Structure

```
docker/
├── supabase/                  # Supabase configuration
│   └── kong.yml               # Kong API Gateway config
└── scripts/                   # Helper scripts
    ├── generate-keys.js       # Generate Supabase API keys
    ├── deploy.sh              # Deployment automation
    └── backup.sh              # Backup automation
```

## Files Overview

### Supabase Configuration

**supabase/kong.yml**
- Kong API Gateway declarative configuration
- Routes for REST API, Auth, Realtime, Storage
- CORS configuration
- Key authentication setup

### Helper Scripts

**scripts/generate-keys.js**
- Generates SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
- Uses JWT_SECRET to sign tokens
- Usage: `node scripts/generate-keys.js <JWT_SECRET>`

**scripts/deploy.sh**
- Interactive deployment script
- Options for fresh deploy, update, restart, stop, logs, cleanup
- Validates environment before deployment
- Usage: `./scripts/deploy.sh`

**scripts/backup.sh**
- Automated backup script
- Backs up PostgreSQL database, uploads, and .env file
- Cleans up backups older than 7 days
- Usage: `./scripts/backup.sh`

## Quick Start

1. **Generate environment file:**
   ```bash
   cp .env.docker.example .env
   nano .env  # Fill in your values
   ```

2. **Generate API keys:**
   ```bash
   node docker/scripts/generate-keys.js "<your-jwt-secret>"
   ```

3. **Deploy:**
   ```bash
   ./docker/scripts/deploy.sh
   ```

4. **Setup Cloudflare Tunnel** (see [DEPLOYMENT.md](../DEPLOYMENT.md) for details)

## Customization

### Change Kong Routes

1. Edit `supabase/kong.yml`
2. Restart Kong: `docker compose restart kong`

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

- Never commit .env files to git
- Use strong passwords and secrets (32+ characters)
- All services are bound to localhost only (127.0.0.1)
- Cloudflare Tunnel provides secure external access
- Restrict Studio access in production (use Cloudflare Access)

## Network Architecture

The stack uses **Cloudflare Tunnel** for external access:

```
Internet
    │
    ├─> Cloudflare Tunnel (handles SSL/TLS)
    │
    └─> localhost:3025 (Next.js App)
        └─> localhost:8000 (Kong/Supabase API)
            ├─> PostgreSQL (internal)
            ├─> Auth Service (internal)
            ├─> Storage Service (internal)
            └─> Realtime Service (internal)
```

**Benefits:**
- ✅ No exposed ports (80/443)
- ✅ Automatic SSL/TLS
- ✅ DDoS protection
- ✅ Global CDN
- ✅ Easy to setup

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
