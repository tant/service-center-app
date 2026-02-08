# Docker Quick Reference - Separated Architecture

## 📋 Cheat Sheet

### Setup Lần Đầu

```bash
# 1. Copy environment templates
cp .env.supabase.example .env.supabase
cp .env.app.example .env.app

# 2. Generate secrets
openssl rand -hex 32  # Use for passwords, JWT_SECRET

# 3. Edit configs
nano .env.supabase  # Fill in secrets
nano .env.app       # Fill in secrets (same keys!)

# 4. Start everything
./manage-stack.sh all start
```

---

## 🚀 Common Commands

| Task | Command |
|------|---------|
| **Start everything** | `./manage-stack.sh all start` |
| **Stop everything** | `./manage-stack.sh all stop` |
| **Restart app only** | `./manage-stack.sh app restart` |
| **View status** | `./manage-stack.sh status` |
| **View logs** | `./manage-stack.sh logs` |
| **Rebuild app** | `./manage-stack.sh app rebuild` |

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:3025 | Main app |
| **API Gateway** | http://localhost:8000 | Supabase Kong |
| **Studio UI** | http://localhost:3000 | Database admin |

---

## 🔗 Network Architecture

```
┌──────────────────────┐
│ supabase-internal    │  ← Private (DB, Auth, etc.)
└──────────────────────┘
          ▲
          │
┌──────────────────────┐
│ supabase-public      │  ← Shared (Kong, Studio, App)
└──────────────────────┘
          ▲
          │
┌──────────────────────┐
│ app-internal         │  ← App private network
└──────────────────────┘
```

---

## 🔑 Environment Variables

### Must Match in Both Files

```bash
# These MUST be identical in .env.supabase AND .env.app:
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Supabase Only (.env.supabase)

```bash
POSTGRES_PASSWORD=xxx
JWT_SECRET=xxx
KONG_PORT=8000
STUDIO_PORT=3000
```

### App Only (.env.app)

```bash
APP_PORT=3025
SUPABASE_URL=http://supabase-kong:8000  # Internal
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000  # Browser
```

---

## 🐛 Troubleshooting

### "Network not found"

```bash
# Solution: Start Supabase first
./manage-stack.sh supabase start
./manage-stack.sh app start
```

### "Connection refused to supabase-kong"

```bash
# Check Supabase is healthy
docker exec supabase-kong kong health

# Restart in correct order
./manage-stack.sh all restart
```

### "Port already allocated"

```bash
# Change ports in .env files
# .env.supabase
KONG_PORT=8001
STUDIO_PORT=3001

# .env.app
APP_PORT=3026
```

---

## 📊 Monitoring

```bash
# Quick health check
./manage-stack.sh status

# Detailed logs
./manage-stack.sh supabase logs -f
./manage-stack.sh app logs -f

# Check specific service
docker logs supabase-kong -f
docker logs service-center-app -f
```

---

## 🔄 Development Workflow

```bash
# 1. Code changes
# ... edit src/ files ...

# 2. Rebuild app
./manage-stack.sh app rebuild

# 3. Restart app
./manage-stack.sh app restart

# 4. Check logs
./manage-stack.sh app logs -f
```

---

## 💾 Backup & Restore

### Backup

```bash
# Database
docker exec supabase-db pg_dump -U postgres postgres > backup.sql

# Volumes
tar -czf backup-volumes.tar.gz ./volumes/
```

### Restore

```bash
# Database
cat backup.sql | docker exec -i supabase-db psql -U postgres

# Volumes
tar -xzf backup-volumes.tar.gz
```

---

## 🔒 Security Checklist

```
☑ .env.supabase NOT in git
☑ .env.app NOT in git
☑ Database port NOT exposed (no 5432:5432)
☑ Strong passwords in .env files
☑ HTTPS in production (via reverse proxy)
```

---

## 📁 File Structure

```
service-center-app/
├── docker-compose.supabase.yml  ← Supabase stack
├── docker-compose.app.yml       ← App stack
├── .env.supabase                ← Supabase config
├── .env.app                     ← App config
├── manage-stack.sh              ← Management script
└── volumes/
    ├── db/data/                 ← PostgreSQL data
    └── storage/                 ← User uploads
```

---

## 🎯 Production Deployment

### Same Host (Recommended)

```nginx
# Nginx reverse proxy
server {
    server_name app.example.com;
    location / {
        proxy_pass http://localhost:3025;
    }
}

server {
    server_name api.example.com;
    location / {
        proxy_pass http://localhost:8000;
    }
}
```

### Update .env.app for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=https://api.example.com
SUPABASE_URL=http://supabase-kong:8000  # Internal stays same
```

---

## ⚡ Performance Tips

1. **Resource Limits** (add to compose files):
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

2. **Enable Connection Pooling** (Supavisor in docker-compose.supabase.yml)

3. **Regular cleanup**:
   ```bash
   docker system prune -f
   ```

---

## 🆘 Emergency Recovery

```bash
# Nuclear option: Reset everything
./manage-stack.sh all stop
docker system prune -af
rm -rf volumes/db/data/*  # ⚠️ DELETES ALL DATA
./manage-stack.sh all start
```

---

## 📞 Get Help

```bash
# Show all options
./manage-stack.sh help

# Check documentation
cat DOCKER-SEPARATED-ARCHITECTURE.md
```

---

## 🎓 Learning Path

1. ✅ Start with monolithic setup (`docker-compose.yml`)
2. ✅ Understand how services connect
3. ✅ Migrate to separated architecture (this setup)
4. ✅ Scale horizontally
5. ✅ Add monitoring (Grafana, Prometheus)
6. ✅ Kubernetes (advanced)
