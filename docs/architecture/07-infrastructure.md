# 7. Infrastructure & Deployment

[← Previous: Source Tree](06-source-tree.md) | [Back to Index](../architecture.md) | [Next: Coding Standards →](08-coding-standards.md)

---

## 7.1 Overview

The Service Center application uses a **multi-tenant Docker Compose architecture** for local development and deployment, with **Supabase local stack** providing PostgreSQL, Auth, and Realtime services.

```mermaid
graph TB
    subgraph "Multi-Tenant Deployment"
        Instance1[Instance 1<br/>Ports: 3000-3999]
        Instance2[Instance 2<br/>Ports: 4000-4999]
        Instance3[Instance 3<br/>Ports: 5000-5999]
    end

    subgraph "Instance 1 Services"
        Next1[Next.js<br/>:3025]
        Supabase1[Supabase Stack<br/>:54321-54324]
        Postgres1[PostgreSQL<br/>:54322]
    end

    subgraph "Instance 2 Services"
        Next2[Next.js<br/>:4025]
        Supabase2[Supabase Stack<br/>:55321-55324]
        Postgres2[PostgreSQL<br/>:55322]
    end

    Instance1 --> Next1
    Instance1 --> Supabase1
    Instance1 --> Postgres1

    Instance2 --> Next2
    Instance2 --> Supabase2
    Instance2 --> Postgres2

    style Instance1 fill:#4A90E2
    style Instance2 fill:#50C878
    style Instance3 fill:#FFD700
```

**Key Features:**
- **Port-based isolation** - Each instance uses calculated port ranges
- **Independent databases** - No data sharing between instances
- **Automated setup** - Script-based instance creation
- **Supabase local** - No cloud dependency for development

---

## 7.2 Multi-Tenant Architecture

### 7.2.1 Port Calculation Strategy

```mermaid
graph LR
    Input[INSTANCE_ID]
    Calc{Port Calculation}
    Range[Port Range]

    Input -->|1| Calc
    Input -->|2| Calc
    Input -->|N| Calc

    Calc -->|INSTANCE_ID=1| Range1[Base: 3000<br/>Next.js: 3025<br/>Supabase API: 54321<br/>Studio: 54323<br/>Postgres: 54322]

    Calc -->|INSTANCE_ID=2| Range2[Base: 4000<br/>Next.js: 4025<br/>Supabase API: 55321<br/>Studio: 55323<br/>Postgres: 55322]

    Calc -->|INSTANCE_ID=N| RangeN[Base: N*1000<br/>Next.js: N*1000+25<br/>Supabase API: 54321+N*1000<br/>...]

    style Calc fill:#FFD700
    style Range1 fill:#4A90E2
    style Range2 fill:#50C878
```

**Port Formula:**

```bash
# Base port calculation
BASE_PORT = (INSTANCE_ID * 1000) + 3000

# Service-specific ports
NEXT_JS_PORT = BASE_PORT + 25          # 3025, 4025, 5025, ...
SUPABASE_API = 54321 + (INSTANCE_ID - 1) * 1000
SUPABASE_STUDIO = 54323 + (INSTANCE_ID - 1) * 1000
POSTGRES_PORT = 54322 + (INSTANCE_ID - 1) * 1000
```

**Example Calculation:**

```bash
# Instance 1 (INSTANCE_ID=1)
NEXT_JS_PORT=3025
SUPABASE_API=54321
SUPABASE_STUDIO=54323
POSTGRES_PORT=54322

# Instance 2 (INSTANCE_ID=2)
NEXT_JS_PORT=4025
SUPABASE_API=55321
SUPABASE_STUDIO=55323
POSTGRES_PORT=55322

# Instance 3 (INSTANCE_ID=3)
NEXT_JS_PORT=5025
SUPABASE_API=56321
SUPABASE_STUDIO=56323
POSTGRES_PORT=56322
```

### 7.2.2 Instance Isolation

```mermaid
graph TB
    subgraph "Instance 1 (Store A)"
        DB1[(Database 1)]
        Auth1[Auth Service 1]
        Storage1[Storage 1]
    end

    subgraph "Instance 2 (Store B)"
        DB2[(Database 2)]
        Auth2[Auth Service 2]
        Storage2[Storage 2]
    end

    subgraph "Instance 3 (Store C)"
        DB3[(Database 3)]
        Auth3[Auth Service 3]
        Storage3[Storage 3]
    end

    User1[Store A Users] --> DB1
    User2[Store B Users] --> DB2
    User3[Store C Users] --> DB3

    style DB1 fill:#4A90E2
    style DB2 fill:#50C878
    style DB3 fill:#FFD700
```

**Isolation Guarantees:**
- **Data isolation** - Separate PostgreSQL databases
- **Auth isolation** - Independent user tables
- **Storage isolation** - Separate file storage buckets
- **Network isolation** - Different port ranges prevent conflicts

---

## 7.3 Supabase Local Stack

```mermaid
graph TB
    subgraph "Supabase Services (Docker Compose)"
        Kong[Kong API Gateway<br/>:54321]
        Studio[Studio UI<br/>:54323]
        Auth[GoTrue Auth<br/>:9999]
        Realtime[Realtime Server<br/>:4000]
        Storage[Storage API<br/>:5000]
        Postgres[(PostgreSQL 15<br/>:54322)]
        Imgproxy[Image Proxy<br/>:5001]
        Meta[Meta API<br/>:8080]
    end

    Client[Client Application] --> Kong
    Developer[Developer] --> Studio

    Kong --> Auth
    Kong --> Realtime
    Kong --> Storage
    Kong --> Meta

    Auth --> Postgres
    Realtime --> Postgres
    Storage --> Postgres
    Meta --> Postgres

    Storage --> Imgproxy

    style Kong fill:#FFD700
    style Postgres fill:#4A90E2
    style Studio fill:#50C878
```

**Service Roles:**

| Service | Port | Purpose |
|---------|------|---------|
| **Kong** | 54321 | API Gateway (routes all requests) |
| **Studio** | 54323 | Web UI for database management |
| **Auth (GoTrue)** | 9999 | Authentication & user management |
| **PostgreSQL** | 54322 | Main database |
| **Realtime** | 4000 | WebSocket subscriptions |
| **Storage** | 5000 | File upload/download |
| **Meta** | 8080 | Database metadata API |
| **Imgproxy** | 5001 | Image transformation |

**Startup Command:**
```bash
pnpx supabase start
```

**Output:**
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 7.4 Docker Compose Configuration

**File:** `docker-compose.yml` (generated by Supabase CLI)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: supabase/postgres:15.1.1.54
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - ./volumes/db/data:/var/lib/postgresql/data

  # Kong API Gateway
  kong:
    image: kong:2.8.1
    ports:
      - "54321:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml

  # GoTrue Auth Service
  auth:
    image: supabase/gotrue:v2.132.3
    ports:
      - "9999:9999"
    environment:
      GOTRUE_SITE_URL: http://localhost:3025
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_DB_DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres

  # Realtime Service
  realtime:
    image: supabase/realtime:v2.25.35
    ports:
      - "4000:4000"
    environment:
      DB_HOST: db
      DB_PORT: 5432

  # Storage Service
  storage:
    image: supabase/storage-api:v0.43.11
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800  # 50MB

  # Studio (Web UI)
  studio:
    image: supabase/studio:20240101-6ab1c00
    ports:
      - "54323:3000"
    environment:
      SUPABASE_URL: http://kong:8000
      STUDIO_PG_META_URL: http://meta:8080
```

---

## 7.5 Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Script as setup-instance.sh
    participant Env as .env File
    participant Docker as Docker Compose
    participant Supabase as Supabase CLI
    participant DB as PostgreSQL

    Dev->>Script: ./setup-instance.sh 1
    Script->>Script: Calculate ports (INSTANCE_ID=1)
    Script->>Env: Create/Update .env
    Env-->>Script: Environment configured

    Script->>Supabase: pnpx supabase start
    Supabase->>Docker: docker compose up
    Docker->>DB: Start PostgreSQL
    Docker->>Docker: Start Kong, Auth, Realtime, etc.
    DB-->>Supabase: Database ready
    Supabase-->>Script: Services started

    Script->>Supabase: pnpx supabase db reset
    Supabase->>DB: Run migrations
    DB-->>Supabase: Schema created
    Supabase-->>Script: Database initialized

    Script->>Script: pnpm install
    Script->>Script: pnpm dev
    Script-->>Dev: Instance running at :3025
```

**Setup Script:** `scripts/setup-instance.sh`

```bash
#!/bin/bash

INSTANCE_ID=${1:-1}
BASE_PORT=$((3000 + INSTANCE_ID * 1000))
NEXT_PORT=$((BASE_PORT + 25))

echo "Setting up instance $INSTANCE_ID"
echo "Next.js will run on port: $NEXT_PORT"

# Create .env file
cat > .env <<EOF
INSTANCE_ID=$INSTANCE_ID
NEXT_PUBLIC_PORT=$NEXT_PORT

# Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}

# Setup
SETUP_PASSWORD=changeme123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
ADMIN_NAME=Administrator
EOF

# Start Supabase services
echo "Starting Supabase services..."
pnpx supabase start

# Run migrations
echo "Running database migrations..."
pnpx supabase db reset

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start Next.js
echo "Starting Next.js on port $NEXT_PORT..."
pnpm dev
```

**Usage:**
```bash
# Setup instance 1 (ports 3025, 54321-54324)
./scripts/setup-instance.sh 1

# Setup instance 2 (ports 4025, 55321-55324)
./scripts/setup-instance.sh 2

# Setup instance 3 (ports 5025, 56321-56324)
./scripts/setup-instance.sh 3
```

---

## 7.6 Environment Configuration

**File:** `.env` (NOT `.env.local`)

```bash
# Instance Configuration
INSTANCE_ID=1
NEXT_PUBLIC_PORT=3025

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Setup Password (for /setup endpoint)
SETUP_PASSWORD=your_secure_setup_password

# Admin Account (created via /setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_admin_password_here
ADMIN_NAME=Administrator

# Optional: Database Direct Access
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Important Notes:**
- Use `.env` (NOT `.env.local`) for local development
- Copy keys from `pnpx supabase start` output
- Never commit `.env` to version control (already in `.gitignore`)

---

## 7.7 Database Migration Workflow

```mermaid
graph LR
    subgraph "Schema Definition"
        Schemas[docs/data/schemas/<br/>SQL files]
        Script[setup_schema.sh]
    end

    subgraph "Supabase Migrations"
        Copy[Copy to supabase/schemas/]
        Diff[supabase db diff]
        Migration[supabase/migrations/<br/>timestamp_name.sql]
    end

    subgraph "Application"
        Apply[supabase db reset]
        DB[(PostgreSQL)]
    end

    Schemas --> Script
    Script --> Copy
    Copy --> Diff
    Diff --> Migration
    Migration --> Apply
    Apply --> DB

    style Schemas fill:#FFD700
    style Migration fill:#4A90E2
    style DB fill:#50C878
```

**Workflow Steps:**

1. **Edit Schema Files:**
   ```bash
   # Edit source of truth
   vi docs/data/schemas/07_service_tickets.sql
   ```

2. **Run Setup Script:**
   ```bash
   ./docs/data/schemas/setup_schema.sh
   ```
   - Copies schemas to `supabase/schemas/`
   - Generates migration with `supabase db diff -f migration_name`

3. **Apply Migration:**
   ```bash
   pnpx supabase db reset  # Rebuilds database from migrations
   ```

4. **Verify:**
   ```bash
   pnpx supabase db status  # Check migration status
   ```

**Migration File Example:**

```sql
-- supabase/migrations/20250115_add_priority_level.sql

alter table service_tickets
  add column priority_level public.priority_level not null default 'normal';

create index idx_tickets_priority
  on service_tickets(priority_level);
```

---

## 7.8 Service Topology

```mermaid
graph TB
    subgraph "Frontend Layer"
        Browser[Browser Client]
        ServerComp[Server Components]
    end

    subgraph "Application Layer"
        Next[Next.js Server<br/>:3025]
        API[/api/trpc/*<br/>tRPC Endpoints]
    end

    subgraph "Data Layer"
        Kong[Kong Gateway<br/>:54321]
        Auth[GoTrue Auth]
        Postgres[(PostgreSQL<br/>:54322)]
    end

    Browser -->|HTTP/WS| Next
    ServerComp -->|Direct| Postgres
    Next --> API
    API -->|Service Role| Kong
    Kong --> Auth
    Kong --> Postgres
    Auth --> Postgres

    style Next fill:#4A90E2
    style Kong fill:#FFD700
    style Postgres fill:#50C878
```

**Request Paths:**

1. **Browser → Next.js → tRPC → Supabase → PostgreSQL**
   - Client Component interactions
   - Forms, mutations, queries

2. **Server Component → PostgreSQL (Direct)**
   - Initial page loads
   - SSR data fetching
   - Bypasses API layer for performance

3. **Auth Requests → Kong → GoTrue → PostgreSQL**
   - Login, signup, password reset
   - JWT token issuance

---

## 7.9 Storage Configuration

**Supabase Storage Buckets:**

```sql
-- Created via Supabase Studio or SQL
insert into storage.buckets (id, name, public)
values ('service-ticket-attachments', 'service-ticket-attachments', false);

-- Storage policies (RLS for files)
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'service-ticket-attachments');

create policy "Users can view their uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'service-ticket-attachments');
```

**File Upload Flow:**

```typescript
// Client uploads file to Supabase Storage
const { data, error } = await supabase.storage
  .from('service-ticket-attachments')
  .upload(`${ticketId}/${fileName}`, file);

// Store metadata in database
await supabase.from('service_ticket_attachments').insert({
  ticket_id: ticketId,
  file_name: fileName,
  file_path: data.path,
  file_size: file.size,
  file_type: file.type,
});
```

---

## 7.10 Development vs Production

| Aspect | Development (Local) | Production (Deployment) |
|--------|---------------------|-------------------------|
| **Database** | Supabase Local (Docker) | Supabase Cloud / Self-hosted |
| **Ports** | 3025, 54321-54324 | 80/443 (HTTP/HTTPS) |
| **Environment** | `.env` file | Environment variables |
| **Supabase CLI** | `pnpx supabase start` | Managed service |
| **Migrations** | `db reset` (destructive) | `db push` (safe) |
| **Instance Count** | Multiple (port-isolated) | Single or load-balanced |
| **Authentication** | Local GoTrue | Cloud GoTrue / OAuth |
| **Storage** | Local volumes | Cloud storage / S3 |

**Production Deployment (Example):**

```bash
# Build Next.js
pnpm build

# Start production server
pnpm start

# Or use Docker
docker build -t service-center .
docker run -p 3025:3025 -e DATABASE_URL=... service-center
```

---

## 7.11 Monitoring & Health Checks

**Health Check Endpoint:**

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const supabase = getAdminClient();

  try {
    // Check database connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) throw error;

    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

**Access:**
```bash
curl http://localhost:3025/api/health
```

---

## 7.12 Backup & Recovery

**Database Backup:**

```bash
# Local backup
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > backup.sql

# Restore
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

**Supabase Cloud Backup:**
- Automatic daily backups (7-day retention)
- Point-in-time recovery (PITR) available on Pro plan
- Manual backups via Supabase CLI: `supabase db dump`

---

## Next Steps

Continue to [Coding Standards →](08-coding-standards.md) to understand the project's development practices and conventions.

---

[← Previous: Source Tree](06-source-tree.md) | [Back to Index](../architecture.md) | [Next: Coding Standards →](08-coding-standards.md)
