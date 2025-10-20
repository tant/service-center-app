# Hướng Dẫn Triển Khai Production

Tài liệu này hướng dẫn triển khai Service Center Management lên production server với **hai phương pháp**: tự động hoàn toàn hoặc thủ công từng bước.

## 🌟 Ưu Điểm

✅ **Docker-based**: Dễ dàng deploy và scale
✅ **Isolated instances**: Mỗi khách hàng có database riêng
✅ **Multi-tenant ready**: Chạy nhiều instances trên 1 server
✅ **Self-contained**: Tất cả services trong Docker
✅ **Easy backup**: Database và files dễ dàng backup
✅ **Automated deployment**: Script tự động hóa toàn bộ quá trình

---

## 📋 Mục Lục

### Phần I: Chuẩn Bị
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Phần Mềm](#cài-đặt-phần-mềm)
- [Hiểu Về URL Architecture](#url-architecture--deployment-modes)

### Phần II: Triển Khai
- [🚀 Phương Pháp A: Tự Động Hoàn Toàn (Khuyến Nghị)](#phương-pháp-a-tự-động-hoàn-toàn-khuyến-nghị)
- [🔧 Phương Pháp B: Thủ Công Từng Bước](#phương-pháp-b-thủ-công-từng-bước)

### Phần III: Quản Lý & Vận Hành
- [Initial Setup](#initial-setup)
- [Bảo Mật Supabase Studio](#bảo-mật-supabase-studio)
- [Quản Lý Services](#quản-lý-services)
- [Multi-Instance Deployment](#multi-instance-deployment)
- [Backup & Monitoring](#backup--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

### Server Specifications

| Thành Phần | Yêu Cầu Tối Thiểu | Khuyến Nghị |
|------------|-------------------|-------------|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS trở lên |
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4GB | 8GB+ |
| **Disk** | 40GB SSD | 80GB+ SSD |
| **Network** | Internet connection | Stable connection |
| **Access** | SSH với sudo | SSH key authentication |

### Cài Đặt Phần Mềm

Các phần mềm sau **BẮT BUỘC** phải được cài đặt trước:

#### 1. Docker & Docker Compose

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user vào docker group
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

#### 2. Git

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y git

# Verify
git --version
```

#### 3. Node.js 18+ (để generate API keys)

```bash
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

#### 4. User Setup (Recommended)

```bash
# Tạo deploy user (recommended cho production)
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Switch to deploy user
su - deploy
```

---

## URL Architecture & Deployment Modes

Hệ thống hỗ trợ **2 deployment modes** với URL architecture khác nhau:

### 🏠 Local Development Mode

**Khi nào dùng:** Test local trên máy development, không cần public domain

**URLs:**
- App: `http://localhost:3025`
- Supabase API: `http://localhost:8000` (Kong Gateway)
- Supabase Studio: `http://localhost:3000`

**Đặc điểm:**
- ✅ Không cần Cloudflare Tunnel
- ✅ Access trực tiếp qua localhost
- ✅ Setup đơn giản, nhanh chóng

**Server-side (internal Docker):** `http://kong:8000`

---

### 🌐 Production Mode

**Khi nào dùng:** Deploy lên server production với public domain

**YÊU CẦU:** Phải setup Cloudflare Tunnel trước khi deploy

**URL Pattern:** `subdomain` + `port last digit` + `base domain`

**Ví dụ với domain `service.example.com`:**

1. **Main Application**
   - URL: `https://service.example.com`
   - Tunnel: `service.example.com` → `localhost:3025`

2. **Supabase API** ⚠️ **BẮT BUỘC**
   - URL: `https://service8.example.com` (sv + 8 từ port 8000)
   - Tunnel: `service8.example.com` → `localhost:8000`
   - Browser cần access Kong để auth, storage, realtime, REST API

3. **Supabase Studio**
   - URL: `https://service3.example.com` (sv + 3 từ port 3000)
   - Tunnel: `service3.example.com` → `localhost:3000`

**Port Auto-calculation:**
- `STUDIO_PORT = 3000 + (APP_PORT - 3025) × 100`
- `KONG_PORT = 8000 + (APP_PORT - 3025)`

**Ví dụ:**
```
APP_PORT=3025 → STUDIO_PORT=3000, KONG_PORT=8000
APP_PORT=3026 → STUDIO_PORT=3100, KONG_PORT=8001
APP_PORT=3027 → STUDIO_PORT=3200, KONG_PORT=8002
```

---

# PHẦN II: TRIỂN KHAI

## Phương Pháp A: Tự Động Hoàn Toàn (Khuyến Nghị)

Phương pháp này sử dụng script tự động hóa để thực hiện **TẤT CẢ CÁC BƯỚC** chỉ với **MỘT LỆNH DUY NHẤT**.

### ⏱️ Thời gian ước tính: 10-15 phút

### 📝 Bước 1: Clone Repository

```bash
cd ~
git clone https://github.com/tant/service-center-app.git
cd service-center-app
```

### 🎯 Bước 2: Cấu Hình Instance

Bạn có **HAI CÁCH** để cấu hình:

#### **Cách 2.1: Cấu Hình Tự Động (Interactive) - ⭐ KHUYẾN NGHỊ**

Chạy script với flag `--interactive` để được hỏi từng bước:

```bash
chmod +x docker/scripts/setup-instance.sh
./docker/scripts/setup-instance.sh --interactive
```

Script sẽ hỏi bạn:
- Center Name
- Application Port (mặc định: 3025)
- Deployment Mode (local hoặc production)
- Production Domain (nếu chọn production)
- Admin Account (email, password, name)
- SMTP Configuration (nếu chọn production)

**Ví dụ tương tác:**
```
📝 Interactive Configuration Mode

Press Enter to use default values shown in [brackets]

Center Name [My Service Center]: Trung Tâm Sửa Chữa ABC
Application Port [3025]: 3025

Deployment Mode:
  1) local - For local development (no Cloudflare Tunnel needed)
  2) production - For public deployment (requires Cloudflare Tunnel)
Select mode [1-2]: 2

Production Domain (e.g., service.example.com) [service.example.com]: abc.tantran.dev

Admin Account Configuration:
Admin Email [admin@example.com]: admin@abc.com
Admin Password [ChangeThisPassword123!]: MySecurePass2024!
Admin Name [System Administrator]: Nguyen Van A

SMTP Configuration (for production):
Use custom SMTP? [y/N]: n
```

#### **Cách 2.2: Cấu Hình Thủ Công (Edit Script)**

Mở và chỉnh sửa file script:

```bash
nano docker/scripts/setup-instance.sh
```

Tìm section `DEFAULT CONFIGURATION` và chỉnh sửa các giá trị:

```bash
# Instance Information
CENTER_NAME="Trung Tâm Sửa Chữa ABC"
APP_PORT=3025

# Deployment Mode
DEPLOYMENT_MODE=production  # Đổi thành 'local' nếu test local

# Production Domain (chỉ dùng khi DEPLOYMENT_MODE=production)
PRODUCTION_DOMAIN=abc.tantran.dev  # KHÔNG bao gồm http:// hay https://

# Admin Account Configuration
ADMIN_EMAIL="admin@abc.com"
ADMIN_PASSWORD="MySecurePass2024!"
ADMIN_NAME="Nguyen Van A"

# SMTP Configuration (để mặc định nếu dùng local mode)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@abc.com"
SMTP_PASS="your-smtp-app-password"
```

**Lưu file** (Ctrl+X, Y, Enter nếu dùng nano)

### 🚀 Bước 3: Chạy Deployment Script (MỘT LỆNH DUY NHẤT!)

```bash
chmod +x docker/scripts/deploy.sh
./docker/scripts/deploy.sh
```

Chọn option **1** (Complete fresh deployment):

```
Select deployment action:
  1) 🆕 Complete fresh deployment (setup + pull + build + deploy + schema)
  2) 🏗️  Build and deploy only (requires existing .env)
  3) 🔄 Update application only (rebuild app container)
  4) ♻️  Restart all services
  5) 📋 View logs
  6) 🛑 Stop all services
  7) 🧹 Clean up (remove containers and volumes)

Enter choice [1-7]: 1
```

### ✨ Script Sẽ Tự Động Thực Hiện:

**Step 1/5: Instance Setup**
- ✅ Generate tất cả secrets (passwords, keys, tokens)
- ✅ Copy configuration files (kong.yml, vector.yml)
- ✅ Tạo file .env với đầy đủ cấu hình
- ✅ Generate Supabase API keys (anon + service_role)
- ✅ Tạo file INSTANCE_INFO.txt chứa tất cả thông tin

**Step 2/5: Pull Docker Images**
- ✅ Download tất cả Docker images từ registry
- ✅ Tránh phải chờ lâu khi start services

**Step 3/5: Build Docker Images**
- ✅ Build custom application image
- ✅ Verify configuration files

**Step 4/5: Start All Services**
- ✅ Start tất cả containers
- ✅ Wait for database ready
- ✅ Health checks

**Step 5/5: Apply Database Schema**
- ✅ Apply tất cả schema files theo đúng thứ tự
- ✅ Create storage buckets
- ✅ Setup RLS policies

### 🎉 Kết Quả Output

```
==========================================
🎉 DEPLOYMENT COMPLETE!
==========================================

📋 Access Information:

  🌐 Application:
     https://abc.tantran.dev

  🔧 Supabase API:
     https://abc8.tantran.dev

  📊 Supabase Studio (with authentication):
     https://abc3.tantran.dev

==========================================
📝 Next Steps:
==========================================

1️⃣  Access the setup page:
   https://abc.tantran.dev/setup
   Password: a1b2c3d4e5f6...

2️⃣  This will create your admin account with:
   Email: admin@abc.com
   Password: MySecurePass2024!

3️⃣  Login to the application:
   https://abc.tantran.dev/login

📄 For more details, see: INSTANCE_INFO.txt

🔍 Check status: docker compose ps
📋 View logs:    docker compose logs -f
```

### 📄 Review Credentials

Tất cả thông tin quan trọng được lưu trong file `INSTANCE_INFO.txt`:

```bash
cat INSTANCE_INFO.txt
```

File này chứa:
- ✅ URLs và domains
- ✅ Setup password
- ✅ Admin credentials
- ✅ Database password
- ✅ Supabase API keys
- ✅ Studio credentials
- ✅ Cloudflare Tunnel configuration (nếu production)

⚠️ **LƯU Ý:** Backup file này và **KHÔNG commit** lên git!

### ✅ Verify Deployment

```bash
# Check services status
docker compose ps

# Tất cả containers phải là "Up" hoặc "Up (healthy)"
# Nếu có container nào "Exited" hoặc "Unhealthy", xem phần Troubleshooting

# Test application
curl http://localhost:3025/api/health

# Xem logs nếu có vấn đề
docker compose logs -f app
```

### ➡️ Bước Tiếp Theo

Chuyển đến phần [Initial Setup](#initial-setup) để hoàn tất cấu hình ban đầu.

---

## Phương Pháp B: Thủ Công Từng Bước

Phương pháp này cho phép bạn **kiểm soát và kiểm tra** từng bước deployment.

### ⏱️ Thời gian ước tính: 20-30 phút

### 📝 Bước 1: Clone Repository

```bash
cd ~
git clone https://github.com/tant/service-center-app.git
cd service-center-app
```

### 🔧 Bước 2: Generate Configuration

#### Option 2A: Dùng Setup Script (Tự Động Tạo Config)

**Khuyến nghị:** Dùng setup script nhưng KHÔNG deploy ngay

```bash
chmod +x docker/scripts/setup-instance.sh

# Chạy với interactive mode
./docker/scripts/setup-instance.sh --interactive

# HOẶC edit script trước rồi chạy
nano docker/scripts/setup-instance.sh  # Edit configuration
./docker/scripts/setup-instance.sh
```

Script sẽ:
- ✅ Generate secrets
- ✅ Copy config files
- ✅ Tạo .env file
- ✅ Generate API keys
- ✅ Tạo INSTANCE_INFO.txt

**Output:**
```
✅ Setup completed successfully!

Next Steps:
  1. Review instance info: cat INSTANCE_INFO.txt
  2. Review .env file: nano .env
  3. Build and start services:
     docker compose build
     docker compose up -d
  4. Apply database schema:
     ./docker/scripts/apply-schema.sh
```

#### Option 2B: Manual Configuration (Hoàn Toàn Thủ Công)

**Bước 2B.1: Copy và Edit .env**

```bash
cp .env.docker.example .env
nano .env
```

**Các giá trị BẮT BUỘC phải thay đổi:**

```bash
# Generate secrets
POSTGRES_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
SETUP_PASSWORD=$(openssl rand -hex 16)
DASHBOARD_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY_BASE=$(openssl rand -hex 64)
VAULT_ENC_KEY=$(openssl rand -hex 32)
PG_META_CRYPTO_KEY=$(openssl rand -hex 32)

# Instance ports
APP_PORT=3025
KONG_PORT=8000  # Auto: 8000 + (APP_PORT - 3025)
STUDIO_PORT=3000  # Auto: 3000 + (APP_PORT - 3025) * 100

# URLs (tuỳ theo deployment mode)
# Local mode:
SITE_URL=http://localhost:3025
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000

# Production mode:
SITE_URL=https://abc.tantran.dev
NEXT_PUBLIC_SUPABASE_URL=https://abc8.tantran.dev

# Admin account
ADMIN_EMAIL=admin@abc.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Administrator
```

**Bước 2B.2: Generate Supabase API Keys**

```bash
# Install jsonwebtoken if needed
npm install jsonwebtoken

# Generate keys
node docker/scripts/generate-keys.js "$(grep ^JWT_SECRET .env | cut -d'=' -f2)"
```

Copy output và update .env:
```bash
SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Same as SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Bước 2B.3: Setup Volume Directories**

```bash
# Create volumes structure
mkdir -p volumes/db/data volumes/storage

# Copy configuration files
cp -r docs/references/volumes/* volumes/

# Verify critical files
ls -lh volumes/logs/vector.yml
ls -lh volumes/api/kong.yml
```

### 📥 Bước 3: Pull Docker Images

**MỚI:** Pull images trước để tránh chờ lâu khi start

```bash
docker compose pull
```

Output sẽ hiển thị download progress:
```
[+] Pulling 12/12
 ✔ supabase/postgres:15.1.1.54    Pulled
 ✔ supabase/studio:latest         Pulled
 ✔ supabase/kong:latest           Pulled
 ...
```

⏱️ Thời gian: 5-10 phút (tuỳ network speed)

### 🏗️ Bước 4: Build Docker Images

```bash
# Build tất cả images
docker compose build

# Hoặc build riêng app image (nếu đã pull)
docker compose build app
```

⏱️ Thời gian: 3-5 phút

### 🚀 Bước 5: Start Services

```bash
# Start tất cả containers
docker compose up -d

# Xem logs realtime
docker compose logs -f
```

### ⏳ Bước 6: Wait for Database Ready

```bash
# Wait for database
echo "Waiting for database..."
until docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
  echo "  Waiting..."
  sleep 2
done
echo "✅ Database is ready!"
```

### 📊 Bước 7: Apply Database Schema

```bash
chmod +x docker/scripts/apply-schema.sh
./docker/scripts/apply-schema.sh
```

Script sẽ:
- ✅ Check database connection
- ✅ Apply schema files theo thứ tự
- ✅ Create storage buckets
- ✅ Verify deployment

**Output:**
```
🚀 Service Center - Schema Deployment
======================================

📊 Database Status:
NAME             IMAGE                           STATUS
supabase-db      supabase/postgres:15.1.1.54    Up (healthy)

Continue? [y/N]: y

📦 Applying schema files...
→ Applying 00_base_types.sql...
  ✓ 00_base_types.sql applied successfully
→ Applying 00_base_functions.sql...
  ✓ 00_base_functions.sql applied successfully
...
🎉 Schema deployment completed!
```

### ✅ Bước 8: Verify Deployment

```bash
# Check all containers
docker compose ps

# Expected: All containers "Up" or "Up (healthy)"

# Test application
curl http://localhost:3025/api/health

# Check specific logs
docker compose logs app
docker compose logs db
docker compose logs kong
```

### ➡️ Bước Tiếp Theo

Chuyển đến phần [Initial Setup](#initial-setup) để hoàn tất cấu hình ban đầu.

---

# PHẦN III: QUẢN LÝ & VẬN HÀNH

## Initial Setup

Sau khi deployment hoàn tất, bạn cần tạo admin account đầu tiên.

### 1. Access Setup Page

Mở browser và truy cập:

**Local mode:**
```
http://localhost:3025/setup
```

**Production mode:**
```
https://abc.tantran.dev/setup
```

### 2. Enter Setup Password

Nhập `SETUP_PASSWORD` từ:
- File `INSTANCE_INFO.txt`, hoặc
- File `.env` (dòng `SETUP_PASSWORD=...`)

```bash
# Xem setup password
grep "^SETUP_PASSWORD=" .env | cut -d'=' -f2
# hoặc
grep "Setup Password:" INSTANCE_INFO.txt
```

### 3. Complete Setup

Click **"Complete Setup"** button.

Hệ thống sẽ tự động tạo admin account với credentials đã cấu hình:
- Email: `ADMIN_EMAIL` (vd: admin@abc.com)
- Password: `ADMIN_PASSWORD`
- Name: `ADMIN_NAME`

### 4. Login

Truy cập trang login:

**Local mode:**
```
http://localhost:3025/login
```

**Production mode:**
```
https://abc.tantran.dev/login
```

Đăng nhập với:
- **Email:** Email bạn đã config (vd: admin@abc.com)
- **Password:** Password bạn đã config

### 5. Test Chức Năng

Sau khi login, test các chức năng chính:

- ✅ **Dashboard** - Xem tổng quan
- ✅ **Create Ticket** - Tạo phiếu sửa chữa mới
- ✅ **Upload Images** - Upload hình ảnh cho ticket
- ✅ **Add Customer** - Thêm khách hàng
- ✅ **Add Parts** - Thêm linh kiện
- ✅ **Manage Team** - Quản lý nhân viên

Nếu tất cả hoạt động OK → **Deployment thành công!** 🎉

---

## Bảo Mật Supabase Studio

### Studio Authentication

Supabase Studio được bảo vệ bằng **HTTP Basic Authentication** khi truy cập qua Kong Gateway.

**Credentials:**
- Username: `DASHBOARD_USERNAME` (mặc định: `supabase`)
- Password: `DASHBOARD_PASSWORD` (auto-generated)
- Xem trong file `INSTANCE_INFO.txt`

**URLs:**
- ✅ **Production (có authentication):** `https://abc3.tantran.dev` (qua Kong)
- ⚠️ **Direct access (KHÔNG có authentication):** `http://localhost:3000`

### Khuyến Nghị Bảo Mật Production

#### 1. Chỉ Truy Cập Studio Qua Kong Gateway

**Production:** Luôn dùng URL có authentication
```
https://abc3.tantran.dev  ✅ Secure
http://localhost:3000     ❌ Insecure (chỉ dùng local)
```

#### 2. Firewall Direct Port Access

Block direct access tới STUDIO_PORT từ bên ngoài:

```bash
# Chỉ cho phép localhost access STUDIO_PORT
sudo ufw allow 22        # SSH
sudo ufw allow 80        # HTTP (Cloudflare Tunnel)
sudo ufw allow 443       # HTTPS (Cloudflare Tunnel)
sudo ufw allow 3025      # App port (or your APP_PORT)
sudo ufw allow 8000      # Kong port (or your KONG_PORT)
sudo ufw deny 3000       # Block Studio port
sudo ufw enable
```

#### 3. Rotate Password Định Kỳ

```bash
# Generate password mới
NEW_PASSWORD=$(openssl rand -hex 16)

# Update .env
sed -i "s/^DASHBOARD_PASSWORD=.*/DASHBOARD_PASSWORD=${NEW_PASSWORD}/" .env

# Restart Kong để apply
docker compose restart kong

# Update INSTANCE_INFO.txt
echo "New Studio Password: ${NEW_PASSWORD}" >> INSTANCE_INFO.txt
```

#### 4. Thêm Cloudflare Access (Optional - Khuyến Nghị)

Thêm layer authentication thứ 2 cho Studio URL:

1. Vào Cloudflare Dashboard → Access
2. Tạo Application cho Studio domain (`abc3.tantran.dev`)
3. Set policies (email domain, specific emails, etc.)
4. User phải authenticate qua Cloudflare trước khi vào Studio

#### 5. Monitor Studio Access

```bash
# Xem Kong logs để monitor Studio access
docker compose logs -f kong | grep dashboard

# Xem failed authentication attempts
docker compose logs kong | grep "401"
```

---

## Quản Lý Services

### View Status & Logs

```bash
# View status
docker compose ps

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f db
docker compose logs -f kong

# View last 100 lines
docker compose logs --tail=100 app
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart kong

# Force recreate
docker compose up -d --force-recreate app
```

### Stop & Start

```bash
# Stop all services (giữ lại volumes/data)
docker compose stop

# Start all services
docker compose start

# Stop và xóa containers (GIỮ volumes/data)
docker compose down

# Start lại từ đầu
docker compose up -d
```

### Update Application

Khi có code mới:

#### Option A: Dùng Deploy Script

```bash
git pull
./docker/scripts/deploy.sh
# Chọn option 3: Update application only
```

#### Option B: Manual

```bash
# Pull latest code
git pull

# Rebuild app container
docker compose build app

# Restart app
docker compose up -d app

# Check logs
docker compose logs -f app
```

### Clean Restart (Nếu Có Issues)

```bash
# Stop and remove containers
docker compose down

# Optional: Clear volumes (⚠️ XÓA DATA!)
docker compose down -v

# Restart
docker compose up -d

# Verify
docker compose ps
```

---

## Multi-Instance Deployment

Bạn có thể chạy **nhiều instances** trên cùng 1 server để phục vụ nhiều khách hàng.

### Cách Deploy Multiple Instances

Mỗi instance cần:
- ✅ Directory riêng
- ✅ APP_PORT riêng (3025, 3026, 3027, ...)
- ✅ Domains riêng (nếu production)

### Ví Dụ: Deploy 3 Instances

#### Instance 1 - Customer A (Port 3025)

```bash
cd /home/deploy
git clone https://github.com/your-org/service-center.git customer-a
cd customer-a

# Edit configuration
nano docker/scripts/setup-instance.sh
# Set: CENTER_NAME="Customer A"
# Set: APP_PORT=3025 (auto: STUDIO_PORT=3000, KONG_PORT=8000)
# Set: DEPLOYMENT_MODE=production
# Set: PRODUCTION_DOMAIN=customer-a.example.com
# Set: ADMIN_EMAIL=admin@customer-a.com

# Deploy
./docker/scripts/deploy.sh
# Select option 1

# URLs:
# - App:    https://customer-a.example.com
# - API:    https://customer-a8.example.com
# - Studio: https://customer-a3.example.com
```

#### Instance 2 - Customer B (Port 3026)

```bash
cd /home/deploy
git clone https://github.com/your-org/service-center.git customer-b
cd customer-b

# Edit configuration
nano docker/scripts/setup-instance.sh
# Set: CENTER_NAME="Customer B"
# Set: APP_PORT=3026 (auto: STUDIO_PORT=3100, KONG_PORT=8001)
# Set: DEPLOYMENT_MODE=production
# Set: PRODUCTION_DOMAIN=customer-b.example.com
# Set: ADMIN_EMAIL=admin@customer-b.com

# Deploy
./docker/scripts/deploy.sh
# Select option 1

# URLs:
# - App:    https://customer-b.example.com
# - API:    https://customer-b8.example.com
# - Studio: https://customer-b3.example.com
```

#### Instance 3 - Customer C (Port 3027)

```bash
cd /home/deploy
git clone https://github.com/your-org/service-center.git customer-c
cd customer-c

# Edit configuration
nano docker/scripts/setup-instance.sh
# Set: CENTER_NAME="Customer C"
# Set: APP_PORT=3027 (auto: STUDIO_PORT=3200, KONG_PORT=8002)
# Set: DEPLOYMENT_MODE=production
# Set: PRODUCTION_DOMAIN=customer-c.example.com
# Set: ADMIN_EMAIL=admin@customer-c.com

# Deploy
./docker/scripts/deploy.sh
# Select option 1

# URLs:
# - App:    https://customer-c.example.com
# - API:    https://customer-c8.example.com
# - Studio: https://customer-c3.example.com
```

### Cloudflare Tunnel Configuration

Mỗi instance cần **3 tunnels** trong config:

**File:** `~/.cloudflared/config.yml`

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Customer A - Ports 3025, 8000, 3000
  - hostname: customer-a.example.com
    service: http://localhost:3025
  - hostname: customer-a8.example.com
    service: http://localhost:8000
  - hostname: customer-a3.example.com
    service: http://localhost:3000

  # Customer B - Ports 3026, 8001, 3100
  - hostname: customer-b.example.com
    service: http://localhost:3026
  - hostname: customer-b8.example.com
    service: http://localhost:8001
  - hostname: customer-b3.example.com
    service: http://localhost:3100

  # Customer C - Ports 3027, 8002, 3200
  - hostname: customer-c.example.com
    service: http://localhost:3027
  - hostname: customer-c8.example.com
    service: http://localhost:8002
  - hostname: customer-c3.example.com
    service: http://localhost:3200

  # Catch-all
  - service: http_status:404
```

### Quản Lý Instances

```bash
# Start/Stop/Restart instance
cd /home/deploy/customer-a
docker compose up -d
docker compose down
docker compose restart

# View status
cd /home/deploy/customer-a
docker compose ps

# View logs
cd /home/deploy/customer-a
docker compose logs -f app

# Access database
cd /home/deploy/customer-a
docker compose exec db psql -U postgres

# Backup database
cd /home/deploy/customer-a
docker compose exec -T db pg_dump -U postgres postgres > backup-customer-a-$(date +%Y%m%d).sql
```

### Network Isolation

Mỗi instance có Docker network riêng:
- `customer-a_default`
- `customer-b_default`
- `customer-c_default`

**Hoàn toàn isolated!** Không có data/service nào share giữa các instances.

### Resource Planning

Mỗi instance sử dụng khoảng:
- **RAM**: 2-3 GB
- **Disk**: 500 MB + data growth
- **CPU**: Moderate

**Khuyến nghị:**

| RAM Server | Số Instances Khuyến Nghị |
|------------|-------------------------|
| 8 GB       | 1-2 instances           |
| 16 GB      | 4-6 instances           |
| 32 GB      | 10-12 instances         |
| 64 GB      | 20-25 instances         |

---

## Backup & Monitoring

### Automated Backup Script

```bash
# Run backup script
./docker/scripts/backup.sh

# Setup cron for daily backup at 2 AM
crontab -e

# Add line:
0 2 * * * cd /home/deploy/service-center-app && ./docker/scripts/backup.sh >> logs/backup.log 2>&1
```

### Manual Backup

#### Database Backup

```bash
# Full database backup
docker compose exec -T db pg_dump -U postgres postgres | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema only
docker compose exec -T db pg_dump -U postgres --schema-only postgres > schema_backup.sql

# Data only
docker compose exec -T db pg_dump -U postgres --data-only postgres > data_backup.sql
```

#### Restore Database

```bash
# Stop application first
docker compose stop app

# Restore from backup
gunzip -c backup_20241020_020000.sql.gz | docker compose exec -T db psql -U postgres postgres

# Or without gzip
docker compose exec -T db psql -U postgres postgres < backup.sql

# Restart application
docker compose start app
```

#### Uploads/Storage Backup

```bash
# Backup storage volumes
tar -czf storage_backup_$(date +%Y%m%d).tar.gz volumes/storage

# Backup entire volumes directory
tar -czf volumes_backup_$(date +%Y%m%d).tar.gz volumes/
```

#### Configuration Backup

```bash
# Backup .env and INSTANCE_INFO.txt
cp .env .env.backup.$(date +%Y%m%d)
cp INSTANCE_INFO.txt INSTANCE_INFO.backup.$(date +%Y%m%d).txt

# Or create full config backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env INSTANCE_INFO.txt volumes/api/ volumes/logs/
```

### Monitoring

#### Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats service-center-app
```

#### Disk Usage

```bash
# System disk usage
df -h

# Docker disk usage
docker system df

# Detailed breakdown
docker system df -v

# Volume sizes
du -sh volumes/*
```

#### Application Logs

```bash
# Follow all logs
docker compose logs -f

# Application logs only
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Filter by time
docker compose logs --since 30m app
docker compose logs --since 2024-10-20T10:00:00 app

# Search in logs
docker compose logs app | grep ERROR
docker compose logs app | grep "500"
```

#### Health Checks

```bash
# Check service health
docker compose ps

# Application health endpoint
curl http://localhost:3025/api/health

# Database health
docker compose exec db pg_isready -U postgres

# Kong health
curl http://localhost:8000/status
```

---

## Troubleshooting

### Application Not Starting

#### Check Logs

```bash
# View application logs
docker compose logs app

# Common issues:
# - Database connection error
# - Missing environment variables
# - Port already in use
```

#### Database Connection Issues

```bash
# Verify database is running
docker compose ps db

# Test connection
docker compose exec db psql -U postgres -c "SELECT version();"

# Check .env file
grep "POSTGRES_" .env

# Verify internal hostname (should be "db" not "localhost")
grep "POSTGRES_HOST" .env  # Should be: POSTGRES_HOST=db
```

#### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3025
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process or change APP_PORT in configuration
```

### Kong/Supabase API Errors

```bash
# Check Kong logs
docker compose logs kong

# Verify Kong config
docker compose exec kong cat /var/lib/kong/kong.yml

# Test Kong endpoint
curl http://localhost:8000/status

# Restart Kong
docker compose restart kong
```

### Cannot Access Studio

#### Check Studio Container

```bash
# Verify Studio is running
docker compose ps studio

# View logs
docker compose logs studio

# Test direct access
curl http://localhost:3000
```

#### Verify Port Exposure

```bash
# Check docker-compose.yml
grep -A 5 "studio:" docker-compose.yml

# Should have:
# studio:
#   ports:
#     - "${STUDIO_PORT}:3000"

# Check .env
grep "STUDIO_PORT" .env
```

#### Verify Cloudflare Tunnel (Production)

```bash
# Check tunnel status
cloudflared tunnel list
cloudflared tunnel info your-tunnel-name

# Test tunnel
curl https://abc3.tantran.dev

# Check tunnel config
cat ~/.cloudflared/config.yml
```

### Vector Container Issues

**Symptom:**
```bash
docker compose ps
# Shows: supabase-vector is unhealthy or restarting
```

**Check logs:**
```bash
docker logs supabase-vector --tail 20
# Error: Configuration error. error=Is a directory (os error 21)
```

**Solution:**

```bash
# Stop containers
docker compose down

# Verify vector.yml is a FILE, not directory
ls -lh volumes/logs/vector.yml

# If it's a directory or missing:
rm -rf volumes/logs/vector.yml
mkdir -p volumes/logs

# Copy from docs/references
cp docs/references/volumes/logs/vector.yml volumes/logs/

# Verify it's a file
test -f volumes/logs/vector.yml && echo "OK" || echo "FAILED"

# Start containers
docker compose up -d

# Check vector status
docker compose ps vector
docker logs supabase-vector --tail 10
```

### Realtime Container Unhealthy

**Issue:** `realtime-dev` container shows "unhealthy"

**Normal behavior:**
- May take 1-2 minutes to become healthy
- Not critical if application is responding

**Check:**
```bash
docker compose logs realtime

# If persistent unhealthy:
docker compose restart realtime

# Monitor
docker compose logs -f realtime
```

### Pooler Issues (Supavisor)

**Note:** Supavisor pooler is **disabled** by default.

**Root cause:**
- Encryption key compatibility issue
- Not critical for deployment

**Impact:**
- No impact on application
- App connects directly to PostgreSQL

**If you want to enable:**
```bash
# Uncomment supavisor in docker-compose.yml
nano docker-compose.yml

# Restart
docker compose up -d
```

### Out of Memory

**Symptoms:**
- Containers keep restarting
- OOM (Out of Memory) errors in logs

**Check:**
```bash
# System memory
free -h

# Docker stats
docker stats

# Check if swap is enabled
swapon --show
```

**Solutions:**

1. **Enable swap:**
```bash
# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **Reduce memory usage:**
```bash
# Stop unused instances
cd /home/deploy/customer-b
docker compose down

# Adjust worker processes (edit docker-compose.yml)
# Reduce POOLER_DEFAULT_POOL_SIZE in .env
```

3. **Upgrade server:**
- Consider upgrading to more RAM

### Out of Disk Space

**Check:**
```bash
# System disk
df -h

# Docker disk usage
docker system df
```

**Clean up:**

```bash
# Remove unused Docker resources
docker system prune -a -f

# Remove unused volumes (⚠️ Careful!)
docker volume prune -f

# Clean old backups
rm -f backup_*.sql.gz
rm -f *_backup_*.tar.gz

# Clean logs
docker compose exec db psql -U postgres -c "SELECT pg_rotate_logfile();"
```

### SSL/Certificate Errors (Production)

**Verify Cloudflare Tunnel:**

```bash
# Check tunnel is running
ps aux | grep cloudflared

# Check tunnel status
cloudflared tunnel list

# View tunnel logs
journalctl -u cloudflared -f  # If running as service

# Test DNS resolution
nslookup abc.tantran.dev
dig abc.tantran.dev
```

**Verify SSL Settings:**

1. Cloudflare Dashboard → SSL/TLS
2. Set to "Full" or "Full (strict)"
3. Check DNS records are proxied (orange cloud)

**Test endpoints:**

```bash
# Test from external
curl -I https://abc.tantran.dev
curl -I https://abc8.tantran.dev

# Should return 200 OK or 302 redirect
```

### Schema Apply Errors

**Issue:** Schema script fails

**Common causes:**

1. **Wrong order:**
```bash
# Schema files must be applied in order
# Fix: Check apply-schema.sh applies files in correct sequence
```

2. **Database not ready:**
```bash
# Wait for database
docker compose exec db pg_isready -U postgres
```

3. **Permission issues:**
```bash
# Make sure using postgres user
docker compose exec -T db psql -U postgres
```

**Re-apply schema:**

```bash
# Drop and recreate (⚠️ LOSES DATA!)
docker compose exec db psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply schema again
./docker/scripts/apply-schema.sh
```

---

## FAQ

**Q: Cần expose ports nào?**
A: Cần expose 3 ports: `APP_PORT` (3025), `KONG_PORT` (8000), và `STUDIO_PORT` (3000). Kong port cần thiết để browser access Supabase.

**Q: Có thể chạy nhiều instances không?**
A: Có! Mỗi instance chỉ cần thay đổi `APP_PORT`. Ports khác tự động calculate. Xem [Multi-Instance Deployment](#multi-instance-deployment).

**Q: Database có share giữa các instances không?**
A: Không! Mỗi instance có database riêng, hoàn toàn isolated.

**Q: Cần setup Cloudflare Tunnel như thế nào?**
A: Xem [URL Architecture](#url-architecture--deployment-modes) và [Multi-Instance Deployment](#multi-instance-deployment). Mỗi instance cần 3 tunnels (app, api, studio).

**Q: Secrets có cần URL-safe không?**
A: Có! Setup script tự động generate tất cả secrets ở hex format, hoàn toàn URL-safe.

**Q: Downtime khi update application?**
A: Minimal. Build image mới, restart container với `docker compose up -d app`. Khoảng 10-30 giây.

**Q: Có thể restrict access không?**
A: Có! Dùng Cloudflare Access, firewall rules, hoặc IP whitelist.

**Q: Làm sao để backup tự động?**
A: Dùng backup script với cron job. Xem [Backup & Monitoring](#backup--monitoring).

**Q: RAM/CPU cần bao nhiêu?**
A: Minimum 4GB RAM, 2 CPU cores. Khuyến nghị 8GB+ RAM, 4+ cores. Xem [Resource Planning](#resource-planning).

**Q: Làm sao migrate từ local sang production?**
A:
1. Backup database local: `docker compose exec -T db pg_dump -U postgres postgres > local_backup.sql`
2. Setup production instance với DEPLOYMENT_MODE=production
3. Restore database: `cat local_backup.sql | docker compose exec -T db psql -U postgres postgres`
4. Copy uploads: `rsync -avz volumes/storage/ user@production:/path/volumes/storage/`

---

## Commands Reference

### 🚀 Main Deployment (Khuyến Nghị)

```bash
# Deploy script - Interactive menu
./docker/scripts/deploy.sh

# Options:
#   1) Complete fresh deployment (setup + pull + build + deploy + schema)
#   2) Build and deploy only (requires existing .env)
#   3) Update application only
#   4) Restart all services
#   5) View logs
#   6) Stop all services
#   7) Clean up (remove containers and volumes)
```

### 🔧 Individual Scripts

```bash
# Setup instance with interactive prompts
./docker/scripts/setup-instance.sh --interactive

# Setup instance with script defaults
./docker/scripts/setup-instance.sh

# Apply database schema
./docker/scripts/apply-schema.sh

# Backup script
./docker/scripts/backup.sh
```

### 🐳 Docker Management

```bash
# Status
docker compose ps

# Logs
docker compose logs -f
docker compose logs -f app
docker compose logs --tail=100 app

# Restart
docker compose restart
docker compose restart app

# Stop/Start
docker compose stop
docker compose start
docker compose up -d

# Clean restart
docker compose down
docker compose up -d
```

### 🗄️ Database Operations

```bash
# Connect to database
docker compose exec db psql -U postgres

# Backup database
docker compose exec -T db pg_dump -U postgres postgres > backup.sql
docker compose exec -T db pg_dump -U postgres postgres | gzip > backup.sql.gz

# Restore database
docker compose exec -T db psql -U postgres postgres < backup.sql
gunzip -c backup.sql.gz | docker compose exec -T db psql -U postgres postgres

# Check database size
docker compose exec db psql -U postgres -c "SELECT pg_database_size('postgres');"
```

### 🔄 Update Application

```bash
# Method 1: Use deploy script (recommended)
git pull
./docker/scripts/deploy.sh  # Select option 3

# Method 2: Manual
git pull
docker compose build app
docker compose up -d app
```

### 🧹 Cleanup

```bash
# Remove unused Docker resources
docker system prune -a -f

# Remove unused volumes
docker volume prune -f

# Full cleanup (⚠️ removes everything)
./docker/scripts/deploy.sh  # Select option 7
```

---

## Support & Resources

**Documentation:**
- Project README: [README.md](README.md)
- Database Schema: [docs/data/schemas/](docs/data/schemas/)
- Docker Setup: [docker/README.md](docker/README.md)

**Getting Help:**
- Report issues: [GitHub Issues](https://github.com/your-org/service-center/issues)
- Logs: `docker compose logs`

---

**Chúc mừng! 🎉**

Bạn đã hoàn tất việc triển khai Service Center Management!

**Key Takeaways:**
- ✅ **Phương pháp A (Tự động)** - 1 lệnh, 10-15 phút, khuyến nghị cho mọi người
- ✅ **Phương pháp B (Thủ công)** - Kiểm soát từng bước, 20-30 phút, cho advanced users
- ✅ **Docker-based** - Dễ scale và maintain
- ✅ **Multi-instance ready** - Phục vụ nhiều customers trên 1 server
- ✅ **Complete isolation** - Mỗi instance hoàn toàn độc lập

**Enjoy! 🚀**
