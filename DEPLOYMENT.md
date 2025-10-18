# Hướng Dẫn Triển Khai Production

Tài liệu này hướng dẫn triển khai Service Center Management lên production với Cloudflare Tunnel. Không cần Nginx reverse proxy, không cần SSL certificate trên server, không cần mở port 80/443.

## 🌟 Ưu Điểm

✅ **Không cần mở port**: Không cần expose port 80/443 ra internet
✅ **SSL tự động**: Cloudflare xử lý SSL/TLS certificate
✅ **DDoS protection**: Cloudflare tự động bảo vệ khỏi DDoS
✅ **CDN tích hợp**: Static assets được cache tự động
✅ **Zero Trust**: Có thể thêm authentication layer
✅ **Không cần public IP**: Hoạt động ngay cả sau NAT/firewall
✅ **Đơn giản**: Không cần quản lý Nginx, Let's Encrypt

---

## Mục Lục

- [Yêu Cầu](#yêu-cầu)
- [Bước 1: Chuẩn Bị Server](#bước-1-chuẩn-bị-server)
- [Bước 2: Clone và Cấu Hình](#bước-2-clone-và-cấu-hình)
- [Bước 3: Deploy Docker Stack](#bước-3-deploy-docker-stack)
- [Bước 4: Setup Cloudflare Tunnel](#bước-4-setup-cloudflare-tunnel)
- [Bước 5: Deploy Database Schema](#bước-5-deploy-database-schema)
- [Bước 6: Initial Setup](#bước-6-initial-setup)
- [Quản Lý](#quản-lý)
- [Backup & Monitoring](#backup--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Yêu Cầu

### Server
- **OS**: Ubuntu 22.04 LTS hoặc mới hơn
- **CPU**: 2+ cores (khuyến nghị 4+)
- **RAM**: 4GB minimum (khuyến nghị 8GB+)
- **Disk**: 40GB+ SSD
- **Network**: Internet connection (không cần public IP)

### Phần Mềm
- Docker Engine 20.10+
- Docker Compose v2.0+
- Git
- Node.js 18+ (để chạy script generate API keys)

### Cloudflare
- Tài khoản Cloudflare (miễn phí)
- Domain đã add vào Cloudflare (nameservers đã trỏ về Cloudflare)
- Cloudflared CLI sẽ cài trong quá trình setup

---

## Bước 1: Chuẩn Bị Server

### 1.1 Kết Nối Server
```bash
ssh root@your-server-ip
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
apt install -y git curl wget
```

### 1.3 Cài Đặt Node.js
```bash
# Install Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

### 1.4 Cài Đặt Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify
docker --version
docker compose version
```

### 1.5 Firewall (Optional - Tunnel không cần mở port 80/443)
```bash
# Chỉ cần allow SSH
ufw allow 22/tcp
ufw enable

# Không cần allow 80/443 vì dùng Cloudflare Tunnel!
```

### 1.6 Tạo Deploy User
```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to deploy user
su - deploy
```

---

## Bước 2: Clone và Cấu Hình

### 2.1 Clone Repository
```bash
cd ~
git clone https://github.com/tant/service-center-app.git
cd service-center-app
```

### 2.2 Generate Secrets
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Postgres Password
openssl rand -base64 32

# PG Meta Crypto Key (32+ characters)
openssl rand -base64 32

# Setup Password
openssl rand -base64 16
```

### 2.3 Cấu Hình .env
```bash
cp .env.docker.example .env
nano .env
```

**Điền các giá trị:**

```env
############################################
# Application Settings
############################################
SETUP_PASSWORD=<your-generated-setup-password>

# Public URLs (sẽ là Cloudflare URLs)
SITE_URL=https://service-center.yourdomain.com
SUPABASE_PUBLIC_URL=https://supabase-api.yourdomain.com

############################################
# Supabase Configuration
############################################

# Internal Docker network (không thay đổi)
NEXT_PUBLIC_SUPABASE_URL=http://kong:8000

# Database
POSTGRES_PASSWORD=<your-generated-postgres-password>

# JWT Secret
JWT_SECRET=<your-generated-jwt-secret>

# PG Meta Crypto Key (for Supabase Studio)
PG_META_CRYPTO_KEY=<your-generated-pg-meta-crypto-key>

# API Keys (sẽ generate ở bước tiếp theo)
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

############################################
# SMTP (Optional - có thể cấu hình sau)
############################################
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_SENDER_NAME=Service Center

############################################
# Studio
############################################
STUDIO_DEFAULT_ORGANIZATION=Service Center
STUDIO_DEFAULT_PROJECT=Production

############################################
# Auth
############################################
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
```

### 2.4 Install Dependencies & Generate API Keys
```bash
# Install jsonwebtoken for key generation
npm install jsonwebtoken

# Generate Supabase keys
node docker/scripts/generate-keys.js "$(grep JWT_SECRET .env | cut -d '=' -f2)"

# Output sẽ hiển thị 2 keys:
# SUPABASE_ANON_KEY=eyJhbG...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Copy output vào .env
nano .env
# Paste SUPABASE_ANON_KEY và SUPABASE_SERVICE_ROLE_KEY
```

---

## Bước 3: Deploy Docker Stack

### 3.1 Deploy với Script
```bash
chmod +x docker/scripts/deploy.sh
./docker/scripts/deploy.sh

# Chọn option 1: Fresh deployment
```

### 3.2 Hoặc Deploy Manual
```bash
# Build images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### 3.3 Verify Services
```bash
# All containers should be running and healthy
docker compose ps

# Test locally
curl http://localhost:3025/api/health
curl http://localhost:8000/rest/v1/
curl http://localhost:3001
```

**Expected Ports (localhost only):**
- App: `localhost:3025`
- Supabase API (Kong): `localhost:8000`
- Supabase Studio: `localhost:3001`
- PostgreSQL: `localhost:5432`

---

## Bước 4: Setup Cloudflare Tunnel

### 4.1 Cài Đặt Cloudflared
```bash
# Download và cài đặt
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared --version
```

### 4.2 Login Cloudflare
```bash
cloudflared tunnel login
```

Lệnh này sẽ mở browser và yêu cầu bạn login Cloudflare. Sau khi login, cert file sẽ được lưu tại `~/.cloudflared/cert.pem`

### 4.3 Tạo Tunnel
```bash
# Tạo tunnel mới
cloudflared tunnel create service-center

# Lưu lại Tunnel ID được hiển thị (dạng: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```

### 4.4 Tạo Config File
```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Nội dung config:**

```yaml
tunnel: service-center
credentials-file: /home/deploy/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  # Main application
  - hostname: service-center.yourdomain.com
    service: http://localhost:3025
    originRequest:
      noTLSVerify: true

  # Supabase API
  - hostname: supabase-api.yourdomain.com
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s

  # Supabase Studio (optional - có thể restrict access)
  - hostname: studio.yourdomain.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # Catch-all rule (required)
  - service: http_status:404
```

**Lưu ý:** Thay `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` bằng Tunnel ID của bạn, và thay `yourdomain.com` bằng domain của bạn.

### 4.5 Cấu Hình DNS Routes
```bash
# Route cho app
cloudflared tunnel route dns service-center service-center.yourdomain.com

# Route cho Supabase API
cloudflared tunnel route dns service-center supabase-api.yourdomain.com

# Route cho Studio (optional)
cloudflared tunnel route dns service-center studio.yourdomain.com
```

### 4.6 Test Tunnel
```bash
# Chạy tunnel trong foreground để test
cloudflared tunnel run service-center

# Mở browser và test:
# - https://service-center.yourdomain.com
# - https://supabase-api.yourdomain.com
# - https://studio.yourdomain.com

# Nếu OK, dừng bằng Ctrl+C
```

### 4.7 Cài Đặt Tunnel Service (Auto-start)
```bash
# Install as systemd service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### 4.8 Verify
Mở browser và truy cập:
- `https://service-center.yourdomain.com` - **Lưu ý:** App sẽ báo lỗi vì chưa có schema (bước tiếp theo)
- `https://supabase-api.yourdomain.com/rest/v1/` - Nên thấy response từ Supabase
- `https://studio.yourdomain.com` - Nên thấy Supabase Studio

**Nếu app báo lỗi "relation does not exist"** - Đây là bình thường! Tiếp tục Bước 5 để deploy schema.

---

## Bước 5: Deploy Database Schema

**Đơn giản nhất** - Chạy 1 script tự động:

```bash
# Make script executable (chỉ cần 1 lần)
chmod +x docker/scripts/apply-schema.sh

# Run schema deployment script
./docker/scripts/apply-schema.sh
```

Script này sẽ:
- ✅ Kiểm tra database đang chạy
- ✅ Apply tất cả schema files theo đúng thứ tự
- ✅ Tạo storage buckets
- ✅ Verify deployment thành công

**Output mẫu:**
```
🚀 Service Center - Schema Deployment
======================================

📊 Database Status:
NAME             IMAGE                           STATUS
supabase-db      supabase/postgres:15.1.1.54    Up (healthy)

⚠️  This will apply schema files to the production database
   Make sure you have a backup before proceeding!

Continue? [y/N]: y

📦 Applying schema files...

→ Applying 00_base_types.sql...
  ✓ 00_base_types.sql applied successfully
→ Applying 00_base_functions.sql...
  ✓ 00_base_functions.sql applied successfully
...

🪣 Creating storage buckets...
  ✓ Storage buckets created

🔍 Verifying deployment...

Tables created:
  profiles, customers, products, parts, service_tickets...

Storage policies:
  Found 6 storage policies

🎉 Schema deployment completed!
```

### Manual Verification (Optional)

Nếu muốn kiểm tra manual:

```bash
# Check tables
docker compose exec db psql -U postgres -c "\dt"

# Check RLS policies
docker compose exec db psql -U postgres -c "SELECT tablename, policyname FROM pg_policies;"

# Connect to database
docker compose exec db psql -U postgres
```

---

## Bước 6: Initial Setup

### 6.1 Access Setup Page
Mở browser:
```
https://service-center.yourdomain.com/setup
```

### 6.2 Create Admin User
1. Nhập `SETUP_PASSWORD` (từ .env)
2. Điền thông tin admin:
   - Email
   - Password
   - Full name
3. Submit

### 6.3 Login
```
https://service-center.yourdomain.com/login
```

Test đầy đủ các chức năng:
- ✅ Create service ticket
- ✅ Upload images
- ✅ Add customer
- ✅ Add parts
- ✅ Check dashboard

---

## Quản Lý

### Docker Services

**View Status:**
```bash
docker compose ps
docker compose logs -f
```

**Restart:**
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

**Update Application:**
```bash
git pull
docker compose build app
docker compose up -d app
```

**Stop/Start:**
```bash
# Stop all
docker compose stop

# Start all
docker compose up -d
```

### Cloudflare Tunnel

**Status:**
```bash
sudo systemctl status cloudflared
```

**Logs:**
```bash
sudo journalctl -u cloudflared -f
```

**Restart:**
```bash
sudo systemctl restart cloudflared
```

**Update Config:**
```bash
nano ~/.cloudflared/config.yml
sudo systemctl restart cloudflared
```

**List Tunnels:**
```bash
cloudflared tunnel list
```

**Delete Tunnel:**
```bash
# Stop service first
sudo systemctl stop cloudflared

# Delete tunnel
cloudflared tunnel delete service-center
```

---

## Backup & Monitoring

### Automated Backup
```bash
# Run backup script
./docker/scripts/backup.sh

# Setup cron for daily backup
crontab -e

# Add line:
0 2 * * * cd /home/deploy/service-center-app && ./docker/scripts/backup.sh >> logs/backup.log 2>&1
```

### Manual Backup

**Database:**
```bash
docker compose exec -T db pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Uploads:**
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads
```

**Config:**
```bash
cp .env .env.backup
cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup
```

### Monitoring

**Docker Stats:**
```bash
docker stats
```

**Disk Usage:**
```bash
df -h
docker system df
```

**Application Logs:**
```bash
docker compose logs -f app
docker compose logs --tail=100 app
```

**Cloudflare Tunnel Logs:**
```bash
sudo journalctl -u cloudflared -f
```

---

## Troubleshooting

### Tunnel Không Kết Nối

**Check status:**
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

**Common issues:**

1. **Credentials file not found**
   ```bash
   # Check if credentials file exists
   ls -la ~/.cloudflared/*.json

   # Update config.yml with correct path
   nano ~/.cloudflared/config.yml
   ```

2. **DNS not configured**
   ```bash
   # Re-run DNS route commands
   cloudflared tunnel route dns service-center service-center.yourdomain.com
   ```

3. **Service not accessible**
   ```bash
   # Test local service first
   curl http://localhost:3025/api/health

   # If OK, problem is with tunnel
   # If not OK, problem is with Docker
   ```

### Application Errors

**Check logs:**
```bash
docker compose logs app
docker compose logs db
docker compose logs kong
```

**Database connection issues:**
```bash
# Verify database is running
docker compose ps db

# Test connection
docker compose exec db psql -U postgres -c "SELECT version();"
```

**Kong/Supabase API errors:**
```bash
# Check Kong logs
docker compose logs kong

# Verify Kong config
docker compose exec kong cat /var/lib/kong/kong.yml

# Restart Kong
docker compose restart kong
```

### Cannot Access Studio

**Check if Studio is running:**
```bash
docker compose ps studio
docker compose logs studio
```

**Test locally:**
```bash
curl http://localhost:3001
```

**If local works but tunnel doesn't:**
```bash
# Check tunnel config
cat ~/.cloudflared/config.yml

# Verify hostname is correct
# Restart tunnel
sudo systemctl restart cloudflared
```

### SSL/Certificate Errors

**Cloudflare Tunnel handles SSL automatically**, nhưng nếu gặp lỗi:

1. **Check SSL mode in Cloudflare Dashboard:**
   - Go to SSL/TLS settings
   - Set to "Full" (not "Full Strict")

2. **Verify tunnel is running:**
   ```bash
   sudo systemctl status cloudflared
   ```

3. **Check browser console for errors**

### Out of Memory/Disk

**Check resources:**
```bash
free -h
df -h
```

**Clean up Docker:**
```bash
docker system prune -a
docker volume prune
```

**Restart services:**
```bash
docker compose restart
sudo systemctl restart cloudflared
```

---

## Cloudflare Dashboard Configuration

### Khuyến Nghị Security Settings

1. **SSL/TLS:**
   - Mode: Full
   - Min TLS Version: 1.2
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On

2. **Firewall Rules (Optional):**
   - Block countries bạn không serve
   - Rate limiting: 100 requests/10 minutes/IP
   - Challenge score under 30

3. **Page Rules (Optional):**
   - Cache static assets: `*/_next/static/*`
   - Cache Level: Standard
   - Browser TTL: 4 hours

4. **Access (Optional - Restrict Studio):**
   - Setup Access policy cho studio.yourdomain.com
   - Require email OTP hoặc Google login
   - Whitelist specific emails

---

## Performance Tips

### Cloudflare Optimization

1. **Enable Argo Smart Routing** (paid)
   - Giảm latency ~30%
   - Worth it for production

2. **Enable Caching:**
   - Cache static assets
   - Edge cache TTL

3. **Enable Brotli Compression:**
   - Dashboard → Speed → Optimization
   - Enable Brotli

### Application Optimization

1. **Database Connection Pooling:**
   - Already configured in Supabase

2. **Scale App Containers:**
   ```yaml
   # In docker-compose.yml
   app:
     deploy:
       replicas: 2
   ```

3. **Use CDN for uploads:**
   - Store uploads in Supabase Storage
   - Or use Cloudflare R2

---

## Migration từ Traditional Setup

Nếu đang dùng Nginx trên VPS:

1. **Backup everything:**
   ```bash
   pg_dump > backup.sql
   tar czf uploads.tar.gz uploads/
   cp .env .env.backup
   ```

2. **Stop old services:**
   ```bash
   pm2 stop all
   sudo systemctl stop nginx
   ```

3. **Follow guide này từ Bước 2**

4. **Restore data:**
   ```bash
   cat backup.sql | docker compose exec -T db psql -U postgres
   tar xzf uploads.tar.gz
   ```

5. **Setup Cloudflare Tunnel**

6. **Delete old Nginx config và SSL certs** (không cần nữa!)

---

## Cost Analysis

### Cloudflare Tunnel
- **Free Tier:** Unlimited tunnels, unlimited bandwidth ✅
- **Argo Smart Routing:** $5/month + $0.10/GB (optional)
- **Access:** $3/user/month (optional, for Studio restriction)

### Server
- **Basic VPS:** $5-10/month
- **Production VPS:** $20-40/month

**Total: $5-10/month** (với Free Cloudflare) 🎉

---

## FAQ

**Q: Có cần public IP không?**
A: Không! Cloudflare Tunnel hoạt động qua outbound connection.

**Q: Có cần mở port 80/443 không?**
A: Không! Chỉ cần port 22 (SSH) để quản lý.

**Q: SSL certificate tự động renew không?**
A: Có! Cloudflare quản lý SSL certificate tự động.

**Q: Có thể dùng multiple tunnels không?**
A: Có! Free tier cho phép unlimited tunnels.

**Q: Performance so với Nginx?**
A: Tương đương hoặc tốt hơn (nhờ Cloudflare CDN).

**Q: Downtime khi update?**
A: Minimal. Cloudflare có reconnection tự động.

**Q: Có thể restrict access không?**
A: Có! Dùng Cloudflare Access (3$/user/month) hoặc firewall rules.

---

## Commands Reference

```bash
# Docker
docker compose ps                          # Status
docker compose logs -f app                 # Logs
docker compose restart app                 # Restart
./docker/scripts/deploy.sh                 # Deploy
./docker/scripts/backup.sh                 # Backup

# Cloudflare Tunnel
sudo systemctl status cloudflared          # Status
sudo systemctl restart cloudflared         # Restart
sudo journalctl -u cloudflared -f          # Logs
cloudflared tunnel list                    # List tunnels
cloudflared tunnel info service-center     # Tunnel info

# Database
docker compose exec db psql -U postgres    # Connect
docker compose exec -T db pg_dump -U postgres postgres > backup.sql
./docker/scripts/apply-schema.sh           # Apply schema

# Update
git pull && docker compose build app && docker compose up -d app
```

---

## Support

**Cloudflare:**
- Community: https://community.cloudflare.com/
- Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

**Application:**
- Issues: https://github.com/tant/service-center-app/issues
- Logs: `docker compose logs`

---

**Chúc mừng! 🎉**

Bạn đã triển khai thành công Service Center Management lên production!

**Benefits bạn đang có:**
- ✅ Zero public ports exposed
- ✅ Free SSL/TLS certificates
- ✅ DDoS protection
- ✅ Global CDN
- ✅ No Nginx management
- ✅ Auto-reconnect và high availability
- ✅ Easy to manage và monitor

Enjoy! 🚀
