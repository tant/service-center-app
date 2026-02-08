# Docker Separated Architecture

## Tổng Quan

Hệ thống được tách thành **2 stacks độc lập**:

```
┌─────────────────────────┐          ┌──────────────────────┐
│  Supabase Infrastructure│          │  Application Stack   │
│  (Backend Services)     │◄─────────┤  (Next.js App)       │
├─────────────────────────┤          ├──────────────────────┤
│ • PostgreSQL            │          │ • service-center-app │
│ • Kong Gateway          │          │                      │
│ • Auth (GoTrue)         │          │                      │
│ • REST API (PostgREST)  │          │                      │
│ • Realtime              │          │                      │
│ • Storage API           │          │                      │
│ • Studio UI             │          │                      │
│ • Analytics             │          │                      │
│ • ... (13 services)     │          │                      │
└─────────────────────────┘          └──────────────────────┘
         ▲                                      │
         │            supabase-public           │
         └──────────────network────────────────┘
```

---

## Lợi Ích Của Kiến Trúc Tách Riêng

### ✅ **1. Independent Deployment**
- Deploy Supabase infrastructure một lần, dùng cho nhiều apps
- Update app không cần restart Supabase
- Update Supabase không ảnh hưởng app (nếu backward compatible)

### ✅ **2. Independent Scaling**
```bash
# Scale app only
docker compose -f docker-compose.app.yml up -d --scale app=3

# Supabase vẫn chạy bình thường
```

### ✅ **3. Resource Isolation**
- Supabase có resource limits riêng
- App có resource limits riêng
- Dễ monitor và debug từng stack

### ✅ **4. Security Separation**
- Database trong `supabase-internal` network (KHÔNG expose)
- App chỉ access qua Kong Gateway (`supabase-public` network)
- Clear security boundaries

### ✅ **5. Multi-App Support**
```
One Supabase Stack → Multiple Apps

┌─────────────────┐
│  Supabase       │
│  Infrastructure │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
  App 1     App 2     App 3    Mobile App
  :3025     :3026     :3027
```

### ✅ **6. Development Workflow**
```bash
# Developer chỉ cần rebuild app
./manage-stack.sh app rebuild

# Supabase vẫn chạy (không downtime)
```

---

## Cấu Trúc Files

```
service-center-app/
├── docker-compose.supabase.yml    # Supabase infrastructure
├── docker-compose.app.yml         # Application only
├── .env.supabase                  # Supabase configs
├── .env.app                       # App configs
├── manage-stack.sh                # Management script
├── Dockerfile                     # App image
└── volumes/                       # Persistent data
    ├── db/data/                   # PostgreSQL data
    ├── storage/                   # User uploads
    └── ...
```

---

## Quick Start

### 1️⃣ Setup Environment Files

```bash
# Copy templates
cp .env.supabase.example .env.supabase
cp .env.app.example .env.app

# Generate secrets (Linux/Mac)
openssl rand -hex 32  # For passwords, JWT_SECRET, etc.

# Edit files
nano .env.supabase
nano .env.app
```

### 2️⃣ Start Complete Stack

```bash
# Start everything (recommended)
./manage-stack.sh all start

# Or manually:
# Step 1: Start Supabase
./manage-stack.sh supabase start

# Step 2: Wait for healthy, then start app
./manage-stack.sh app start
```

### 3️⃣ Verify Services

```bash
# Check status
./manage-stack.sh status

# Expected output:
# Supabase Infrastructure Status
# ✓ supabase-db          (healthy)
# ✓ supabase-kong        (healthy)
# ✓ supabase-auth        (healthy)
# ...
# Application Status
# ✓ service-center-app   (healthy)
```

### 4️⃣ Access Services

```
🌐 Application:       http://localhost:3025
🔌 API Gateway:       http://localhost:8000
🎨 Supabase Studio:   http://localhost:3000
```

---

## Network Architecture

### **supabase-internal** (Private Network)

```yaml
networks:
  supabase-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

**Services:**
- `db` (PostgreSQL)
- `auth` (GoTrue)
- `rest` (PostgREST)
- `realtime`
- `storage`
- `imgproxy`
- `meta`
- `functions`
- `analytics`
- `vector`

**Security:**
- Internal communication only
- Database KHÔNG expose port ra ngoài
- Chỉ access qua Kong Gateway

### **supabase-public** (Shared Network)

```yaml
networks:
  supabase-public:
    external: false
    name: supabase-public  # Fixed name
```

**Services:**
- `kong` (API Gateway) - Port 8000
- `studio` (UI) - Port 3000
- `app` (từ app stack) - Connect vào network này

**Purpose:**
- Bridge giữa Supabase và external apps
- App access Supabase qua Kong: `http://supabase-kong:8000`

### **app-internal** (App Private Network)

```yaml
networks:
  app-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

**Purpose:**
- Future-proofing: Thêm services cho app (Redis, queue, etc.)
- App có network riêng, isolated từ Supabase

---

## Environment Variables Strategy

### Supabase Stack (.env.supabase)

```bash
# Infrastructure secrets
POSTGRES_PASSWORD=xxx
JWT_SECRET=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Ports
KONG_PORT=8000
STUDIO_PORT=3000

# Database
POSTGRES_HOST=db  # Container name trong supabase-internal
```

### App Stack (.env.app)

```bash
# App port
APP_PORT=3025

# Supabase connection
SUPABASE_URL=http://supabase-kong:8000  # Internal network
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000  # Browser access

# Keys (MUST match .env.supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Critical:**
- `SUPABASE_URL` dùng container name: `supabase-kong`
- `NEXT_PUBLIC_SUPABASE_URL` dùng `localhost` hoặc domain (browser access)

---

## Management Script Usage

### Start/Stop Operations

```bash
# Start everything
./manage-stack.sh all start

# Start individually
./manage-stack.sh supabase start
./manage-stack.sh app start

# Stop
./manage-stack.sh all stop
./manage-stack.sh supabase stop
./manage-stack.sh app stop

# Restart
./manage-stack.sh all restart
./manage-stack.sh app restart  # Restart app only
```

### Monitoring

```bash
# Show status
./manage-stack.sh status

# View logs
./manage-stack.sh supabase logs -f     # Follow Supabase logs
./manage-stack.sh app logs -f          # Follow app logs
./manage-stack.sh logs                 # All logs combined
```

### Development Workflow

```bash
# Code changes → Rebuild app
./manage-stack.sh app rebuild
./manage-stack.sh app restart

# Supabase migrations
docker exec supabase-db psql -U postgres -d postgres -f /path/to/migration.sql
```

---

## Production Deployment Scenarios

### Scenario 1: Single Host (Current Setup)

```
┌──────────────────────────────────────┐
│  Server (192.168.1.100)              │
│  ┌────────────┐    ┌──────────────┐ │
│  │ Supabase   │◄───┤ App          │ │
│  │ :8000      │    │ :3025        │ │
│  └────────────┘    └──────────────┘ │
└──────────────────────────────────────┘
         ▲
         │
    Internet (via reverse proxy)
```

**Nginx/Caddy Reverse Proxy:**
```nginx
# App
server {
    listen 443 ssl;
    server_name app.example.com;
    location / {
        proxy_pass http://localhost:3025;
    }
}

# Supabase API
server {
    listen 443 ssl;
    server_name api.example.com;
    location / {
        proxy_pass http://localhost:8000;
    }
}
```

### Scenario 2: Separate Hosts

```
┌─────────────────────┐         ┌──────────────────┐
│  Supabase Server    │         │  App Server      │
│  (192.168.1.100)    │◄────────┤  (192.168.1.101) │
│  :8000              │         │  :3025           │
└─────────────────────┘         └──────────────────┘
```

**App .env.app:**
```bash
# Point to Supabase server
SUPABASE_URL=http://192.168.1.100:8000
NEXT_PUBLIC_SUPABASE_URL=https://api.example.com
```

**Network:**
- Remove `supabase-public` network
- App connects qua IP/domain
- Firewall: Chỉ allow app server → supabase port 8000

### Scenario 3: Multiple Apps (Shared Supabase)

```
┌─────────────────────┐
│  Supabase Server    │
│  (Shared Backend)   │
└──────────┬──────────┘
           │
    ┌──────┼──────┬──────────┐
    │      │      │          │
  App1   App2   App3    Mobile API
  :3025  :3026  :3027
```

**Each app:**
```bash
# App 1
APP_PORT=3025
SUPABASE_URL=http://supabase.internal:8000

# App 2
APP_PORT=3026
SUPABASE_URL=http://supabase.internal:8000

# Shared Supabase = Cost savings!
```

---

## Troubleshooting

### App Cannot Connect to Supabase

**Symptom:**
```
Error: connect ECONNREFUSED supabase-kong:8000
```

**Solution:**
```bash
# 1. Check Supabase is running
./manage-stack.sh supabase status

# 2. Check network exists
docker network ls | grep supabase-public

# 3. Check app is in network
docker inspect service-center-app | grep -A 10 Networks

# 4. Restart with proper order
./manage-stack.sh all stop
./manage-stack.sh all start
```

### Network Not Found

**Symptom:**
```
Error: network supabase-public not found
```

**Solution:**
```bash
# Start Supabase first (creates network)
./manage-stack.sh supabase start

# Then start app
./manage-stack.sh app start
```

### Port Conflicts

**Symptom:**
```
Error: port 8000 already allocated
```

**Solution:**
```bash
# Change ports in .env files
# .env.supabase
KONG_PORT=8001

# .env.app
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8001
```

### Database Connection Issues

**Check database health:**
```bash
docker exec supabase-db pg_isready -U postgres
# Should output: postgres:5432 - accepting connections

# Check from app container
docker exec service-center-app nc -zv supabase-kong 8000
# Should output: supabase-kong (172.20.0.X:8000) open
```

---

## Migration from Monolithic Setup

### Current Setup → Separated Setup

```bash
# 1. Stop current monolithic stack
docker compose down

# 2. Setup new files
cp .env.supabase.example .env.supabase
cp .env.app.example .env.app

# 3. Copy secrets from .env to new files
# Copy JWT_SECRET, POSTGRES_PASSWORD, SUPABASE_*_KEY to .env.supabase
# Copy same keys to .env.app

# 4. Start new separated stack
./manage-stack.sh all start

# 5. Verify
./manage-stack.sh status
```

**Data Migration:**
- Database data in `./volumes/db/data/` persists automatically
- No data loss if volumes path stays the same

---

## Best Practices

### ✅ DO

1. **Start Supabase before App**
   ```bash
   ./manage-stack.sh all start  # Correct order
   ```

2. **Use management script**
   ```bash
   ./manage-stack.sh app rebuild  # Easier than docker compose commands
   ```

3. **Keep keys synchronized**
   ```bash
   # .env.supabase và .env.app phải có cùng:
   # - SUPABASE_ANON_KEY
   # - SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Monitor both stacks**
   ```bash
   ./manage-stack.sh status  # Regular checks
   ```

### ❌ DON'T

1. **Don't expose database port**
   ```yaml
   # NEVER do this in production
   db:
     ports:
       - "5432:5432"  # Security risk!
   ```

2. **Don't start app before Supabase**
   ```bash
   # BAD - will fail
   ./manage-stack.sh app start  # Error: network not found
   ```

3. **Don't hard-code URLs in code**
   ```typescript
   // BAD
   const supabaseUrl = "http://localhost:8000"

   // GOOD
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
   ```

---

## Performance Tuning

### Resource Limits

**Supabase Stack:**
```yaml
# Add to docker-compose.supabase.yml
db:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

**App Stack:**
```yaml
# Add to docker-compose.app.yml
app:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

### Connection Pooling

Enable Supavisor (currently disabled) for production:
```yaml
# Uncomment in docker-compose.supabase.yml
supavisor:
  # ... (lines 501-550)
```

---

## Security Checklist

```
☑ Database không expose port ra Internet
☑ Chỉ Kong Gateway (port 8000) exposed
☑ Secrets trong .env files (KHÔNG commit git)
☑ App connects qua internal network
☑ RLS policies enabled trên database
☑ HTTPS termination ở reverse proxy layer
☑ Regular backups của volumes/db/data
```

---

## Backup & Recovery

### Backup Database

```bash
# Automated backup
docker exec supabase-db pg_dump -U postgres postgres > backup-$(date +%Y%m%d).sql

# Backup volumes
tar -czf backup-volumes-$(date +%Y%m%d).tar.gz ./volumes/
```

### Restore

```bash
# Restore database
cat backup-20260208.sql | docker exec -i supabase-db psql -U postgres postgres

# Restore volumes
tar -xzf backup-volumes-20260208.tar.gz
```

---

## Monitoring

### Health Checks

```bash
# Check all containers
./manage-stack.sh status

# Check Kong API
curl http://localhost:8000/health

# Check App
curl http://localhost:3025/api/health
```

### Logs Collection

```bash
# Real-time monitoring
./manage-stack.sh logs

# Export logs
docker compose -f docker-compose.supabase.yml logs > supabase.log
docker compose -f docker-compose.app.yml logs > app.log
```

---

## Kết Luận

**Khi nào dùng separated architecture:**
- ✅ Production deployment
- ✅ Multiple apps sharing Supabase
- ✅ Need independent scaling
- ✅ Team có dedicated DevOps

**Khi nào dùng monolithic (original docker-compose.yml):**
- ✅ Local development (đơn giản hơn)
- ✅ Proof of concept
- ✅ Single app, simple deployment

**Recommended:** Start monolithic → Migrate to separated khi cần scale
