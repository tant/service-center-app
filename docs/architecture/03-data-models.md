# 3. Data Models & Database Schema

[← Previous: Technology Stack](02-technology-stack.md) | [Back to Index](../architecture.md) | [Next: Component Architecture →](04-component-architecture.md)

---

## 3.1 Schema Organization

Database schemas are organized in **dependency order** in `docs/data/schemas/`:

```mermaid
graph TB
    START[Schema Loading Order]

    START --> TYPES[00_base_types.sql<br/>ENUMs & Domain Types]
    TYPES --> FUNCS[00_base_functions.sql<br/>Helper Functions]
    FUNCS --> CORE[Core Tables<br/>01-10]

    CORE --> P[01_profiles.sql<br/>User profiles & roles]
    CORE --> C[02_customers.sql<br/>Customer records]
    CORE --> B[03_brands.sql<br/>Product brands]
    CORE --> PR[04_products.sql<br/>Product catalog]
    CORE --> PA[05_parts.sql<br/>Parts inventory]
    CORE --> PP[06_product_parts.sql<br/>Compatibility]
    CORE --> ST[07_service_tickets.sql<br/>Main tickets]
    CORE --> STP[08_service_ticket_parts.sql<br/>Ticket parts]
    CORE --> STC[09_service_ticket_comments.sql<br/>Comments]
    CORE --> STA[10_service_ticket_attachments.sql<br/>Files]

    ST --> STORAGE[storage_policies.sql<br/>File policies]

    style START fill:#FFD700
    style TYPES fill:#FF6B6B
    style FUNCS fill:#FF6B6B
    style ST fill:#4A90E2
    style STORAGE fill:#50C878
```

**Critical:** Files must be loaded in this exact order due to foreign key dependencies.

---

## 3.2 Core Data Models

### 3.2.1 ENUMs and Types

```mermaid
graph LR
    subgraph "User Management"
        UR[user_role<br/>admin, manager,<br/>technician, reception]
    end

    subgraph "Ticket Lifecycle"
        TS[ticket_status<br/>pending, in_progress,<br/>completed, cancelled]
        PL[priority_level<br/>low, normal,<br/>high, urgent]
    end

    subgraph "Business"
        WT[warranty_type<br/>manufacturer, store,<br/>extended, none]
        PS[payment_status<br/>unpaid, partial,<br/>paid, refunded]
    end

    style UR fill:#4A90E2
    style TS fill:#50C878
    style PL fill:#FFD700
    style WT fill:#FF8C00
    style PS fill:#9370DB
```

**User Roles:**
```sql
create type public.user_role as enum (
  'admin',      -- Full system access
  'manager',    -- Manage tickets, customers, products
  'technician', -- Work on assigned tickets
  'reception'   -- Create tickets, view customers
);
```

**Ticket Lifecycle:**
```sql
create type public.ticket_status as enum (
  'pending',      -- Initial state, awaiting assignment
  'in_progress',  -- Technician working on repair
  'completed',    -- Repair finished
  'cancelled'     -- Ticket cancelled
);

create type public.priority_level as enum (
  'low', 'normal', 'high', 'urgent'
);
```

**Business Types:**
```sql
create type public.warranty_type as enum (
  'manufacturer',  -- Manufacturer warranty
  'store',         -- Store warranty
  'extended',      -- Extended warranty plan
  'none'          -- Out of warranty
);

create type public.payment_status as enum (
  'unpaid', 'partial', 'paid', 'refunded'
);
```

### 3.2.2 Service Tickets Table (Core)

```sql
create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_number" text not null unique,  -- Auto: SV-YYYY-NNN
  "customer_id" uuid not null references "customers"("id"),
  "product_id" uuid not null references "products"("id"),
  "issue_description" text not null,
  "status" public.ticket_status not null default 'pending',
  "priority_level" public.priority_level not null default 'normal',
  "warranty_type" public.warranty_type,
  "assigned_to" uuid references "profiles"("user_id"),

  -- Financial (auto-calculated total)
  "service_fee" decimal(10,2) not null default 0 check (service_fee >= 0),
  "diagnosis_fee" decimal(10,2) not null default 0 check (diagnosis_fee >= 0),
  "parts_total" decimal(10,2) not null default 0 check (parts_total >= 0),
  "discount_amount" decimal(10,2) not null default 0 check (discount_amount >= 0),
  "total_cost" decimal(10,2) generated always as
    (service_fee + diagnosis_fee + parts_total - discount_amount) stored,

  -- Timestamps
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- Audit trail
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),
  "notes" text,

  constraint "service_tickets_pkey" primary key ("id"),
  constraint "service_tickets_dates_check" check (
    completed_at is null or started_at is null or completed_at >= started_at
  )
);
```

---

## 3.3 Database Triggers & Automation

```mermaid
sequenceDiagram
    participant App as Application
    participant DB as Database
    participant Trigger1 as Ticket Number Trigger
    participant Trigger2 as Status Log Trigger
    participant Trigger3 as Parts Total Trigger

    App->>DB: INSERT new ticket
    DB->>Trigger1: BEFORE INSERT
    Trigger1->>Trigger1: Generate SV-2025-001
    Trigger1-->>DB: Set ticket_number
    DB-->>App: Ticket created

    App->>DB: UPDATE ticket status
    DB->>Trigger2: AFTER UPDATE
    Trigger2->>Trigger2: Status changed?
    Trigger2->>DB: INSERT comment
    DB-->>App: Status updated

    App->>DB: INSERT ticket part
    DB->>Trigger3: AFTER INSERT
    Trigger3->>Trigger3: Sum all parts
    Trigger3->>DB: UPDATE parts_total
    DB-->>App: Part added
```

### Auto-Generate Ticket Numbers

```sql
-- Function to generate ticket numbers: SV-YYYY-NNN
create or replace function public.generate_ticket_number()
returns text as $$
declare
  current_year text;
  next_number integer;
begin
  current_year := to_char(now(), 'YYYY');

  select coalesce(
    max((regexp_match(ticket_number, 'SV-' || current_year || '-(\d+)'))[1]::integer),
    0
  ) + 1
  into next_number
  from public.service_tickets;

  return 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');
end;
$$ language plpgsql security definer set search_path = pg_catalog, public;

-- Trigger to call function before insert
create trigger "service_tickets_set_number_trigger"
  before insert on "service_tickets"
  for each row
  execute function set_ticket_number();
```

**Examples:**
- First ticket of 2025: `SV-2025-001`
- 142nd ticket of 2025: `SV-2025-142`
- First ticket of 2026: `SV-2026-001` (counter resets)

### Auto-Log Status Changes

```sql
create or replace function public.log_status_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.service_ticket_comments (
      ticket_id,
      comment,
      comment_type,
      is_internal,
      created_by
    ) values (
      new.id,
      'Status changed from "' || old.status || '" to "' || new.status || '"',
      'status_change',
      false,
      coalesce(new.updated_by, auth.uid())
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';
```

---

## 3.4 Row Level Security (RLS)

```mermaid
graph TB
    subgraph "RLS Enforcement Flow"
        Query[Database Query]
        RLS{RLS Enabled?}
        Policy{Policy Check}
        Func[Helper Function<br/>is_admin?, etc.]
        Result[Filtered Results]

        Query --> RLS
        RLS -->|Yes| Policy
        RLS -->|No| Result
        Policy --> Func
        Func -->|Pass| Result
        Func -->|Fail| Deny[Access Denied]
    end

    subgraph "Helper Functions"
        Admin[is_admin<br/>role = 'admin']
        Manager[is_admin_or_manager<br/>role in admin,manager]
    end

    Policy -.-> Admin
    Policy -.-> Manager

    style RLS fill:#FF6B6B
    style Policy fill:#FFD700
    style Func fill:#4A90E2
    style Result fill:#50C878
```

### RLS Helper Functions

```sql
-- Check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = '';

-- Check if current user is admin or manager
create or replace function public.is_admin_or_manager()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role in ('admin', 'manager')
  );
end;
$$ language plpgsql security definer set search_path = '';
```

### RLS Policies Example

```sql
-- Enable RLS
alter table "service_tickets" enable row level security;

-- All authenticated users can view tickets
create policy "service_tickets_select_policy" on "service_tickets"
  for select using (true);

-- All authenticated users can create tickets
create policy "service_tickets_insert_policy" on "service_tickets"
  for insert with check (true);

-- All authenticated users can update tickets
create policy "service_tickets_update_policy" on "service_tickets"
  for update using (true);

-- Only admins and managers can delete tickets
create policy "service_tickets_delete_policy" on "service_tickets"
  for delete using (public.is_admin_or_manager());
```

---

## 3.5 Entity Relationship Diagram

```mermaid
erDiagram
    profiles ||--o{ service_tickets : creates
    profiles ||--o{ service_tickets : "assigned to"
    customers ||--o{ service_tickets : has
    products ||--o{ service_tickets : "being repaired"
    brands ||--o{ products : manufactures
    service_tickets ||--o{ service_ticket_parts : contains
    service_tickets ||--o{ service_ticket_comments : has
    service_tickets ||--o{ service_ticket_attachments : has
    parts ||--o{ service_ticket_parts : "used in"
    products ||--o{ product_parts : "compatible with"
    parts ||--o{ product_parts : "compatible with"

    profiles {
        uuid id PK
        uuid user_id FK "Supabase Auth"
        text full_name
        user_role role
        text phone
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    customers {
        uuid id PK
        text name
        text phone
        text email
        text address
        timestamptz created_at
    }

    brands {
        uuid id PK
        text name
        text description
        timestamptz created_at
    }

    products {
        uuid id PK
        uuid brand_id FK
        text name
        text model
        text category
        text description
        timestamptz created_at
    }

    parts {
        uuid id PK
        text part_number
        text name
        text description
        decimal unit_price
        integer stock_quantity
        integer min_stock_level
        timestamptz created_at
    }

    service_tickets {
        uuid id PK
        text ticket_number "Auto: SV-YYYY-NNN"
        uuid customer_id FK
        uuid product_id FK
        text issue_description
        ticket_status status
        priority_level priority_level
        warranty_type warranty_type
        uuid assigned_to FK
        decimal service_fee
        decimal diagnosis_fee
        decimal parts_total "Auto-calculated"
        decimal discount_amount
        decimal total_cost "Generated column"
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        uuid updated_by FK
    }

    service_ticket_parts {
        uuid id PK
        uuid ticket_id FK
        uuid part_id FK
        integer quantity
        decimal unit_price
        decimal total_price "quantity * unit_price"
        timestamptz created_at
    }

    service_ticket_comments {
        uuid id PK
        uuid ticket_id FK
        text comment
        text comment_type "status_change, note, etc"
        boolean is_internal
        uuid created_by FK
        timestamptz created_at
    }

    service_ticket_attachments {
        uuid id PK
        uuid ticket_id FK
        text file_name
        text file_path
        text file_type
        integer file_size
        uuid uploaded_by FK
        timestamptz created_at
    }

    product_parts {
        uuid id PK
        uuid product_id FK
        uuid part_id FK
        timestamptz created_at
    }
```

---

## 3.6 Schema Dependency Flow

```mermaid
graph TB
    subgraph "Foundation Layer"
        AUTH[auth.users<br/>Supabase Auth]
        TYPES[ENUMs<br/>user_role, ticket_status, etc.]
        FUNCS[Helper Functions<br/>is_admin, update_timestamp]
    end

    subgraph "Base Tables"
        PROF[profiles]
        CUST[customers]
        BRANDS[brands]
    end

    subgraph "Catalog Tables"
        PROD[products]
        PARTS[parts]
    end

    subgraph "Junction Tables"
        PP[product_parts]
    end

    subgraph "Transaction Tables"
        TICKETS[service_tickets]
    end

    subgraph "Related Tables"
        STP[service_ticket_parts]
        STC[service_ticket_comments]
        STA[service_ticket_attachments]
    end

    AUTH --> PROF
    TYPES --> PROF
    TYPES --> TICKETS
    FUNCS --> PROF
    FUNCS --> TICKETS

    PROF --> TICKETS
    CUST --> TICKETS
    BRANDS --> PROD
    PROD --> TICKETS
    PROD --> PP
    PARTS --> PP
    PARTS --> STP

    TICKETS --> STP
    TICKETS --> STC
    TICKETS --> STA

    style AUTH fill:#FF6B6B
    style TYPES fill:#FF6B6B
    style FUNCS fill:#FF6B6B
    style TICKETS fill:#4A90E2
    style PROF fill:#50C878
```

---

## 3.7 Phase 2 Schema Expansion (✅ Complete - Oct 2025)

**Status:** All Phase 2 tables implemented (18/21 stories complete - 86%)

### 3.7.1 New ENUMs Added

```sql
-- Task workflow management
create type public.task_status as enum (
  'pending', 'in_progress', 'completed', 'cancelled', 'blocked'
);

-- Warehouse management
create type public.warehouse_type as enum (
  'warranty_stock', 'rma_staging', 'dead_stock', 'in_service', 'parts'
);

create type public.product_condition as enum (
  'new', 'refurbished', 'defective', 'parts_only'
);

create type public.stock_movement_type as enum (
  'receiving', 'transfer', 'assignment', 'disposal', 'return'
);

-- Service request management
create type public.request_status as enum (
  'pending', 'verified', 'converted', 'rejected', 'expired'
);

create type public.delivery_method as enum (
  'self_pickup', 'delivery_requested', 'delivered'
);
```

### 3.7.2 RBAC Helper Functions (Story 01.00)

```sql
-- Role-based access control helpers
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where user_id = auth.uid()
$$ language sql security definer;

create or replace function has_role(required_role user_role)
returns boolean as $$
  select role = required_role from profiles where user_id = auth.uid()
$$ language sql security definer;

create or replace function has_any_role(required_roles user_role[])
returns boolean as $$
  select role = any(required_roles) from profiles where user_id = auth.uid()
$$ language sql security definer;

create or replace function is_manager_or_above()
returns boolean as $$
  select role in ('admin', 'manager') from profiles where user_id = auth.uid()
$$ language sql security definer;

create or replace function is_admin_only()
returns boolean as $$
  select role = 'admin' from profiles where user_id = auth.uid()
$$ language sql security definer;

create or replace function is_technician_assigned_to_ticket(ticket_id uuid)
returns boolean as $$
  select assigned_to = auth.uid() from service_tickets where id = ticket_id
$$ language sql security definer;
```

### 3.7.3 Phase 2 Tables Added

**Task Workflow System (Stories 01.02-01.05, 01.17):**
- `task_templates` - Workflow templates for different service types
- `task_types` - Library of pre-defined task types
- `task_templates_tasks` - Junction table linking templates to tasks
- `service_ticket_tasks` - Task instances for each ticket
- `task_history` - Audit trail for task execution
- `ticket_template_changes` - Log of dynamic template switches

**Warehouse Management (Stories 01.06-01.10):**
- `physical_warehouses` - Physical warehouse locations
- `virtual_warehouses` - Virtual warehouse zones within physical warehouses
- `physical_products` - Physical products with serial numbers
- `stock_movements` - Product movement history
- `product_stock_thresholds` - Low-stock alert thresholds

**Service Requests (Stories 01.11-01.13):**
- `service_requests` - Public service requests with tracking tokens
- `email_notifications` - Email notification queue and log

**Audit Logging (Story 01.00):**
- `audit_logs` - Immutable audit trail for all permission-sensitive operations

---

## 3.8 All Database Tables

**Phase 1 - Core System (10 tables):**

| Table | Rows | Purpose | Key Features |
|-------|------|---------|--------------|
| **profiles** | ~10-100 | User profiles & roles | Links to auth.users, role-based access |
| **customers** | ~1000+ | Customer records | Name, phone, email, address |
| **brands** | ~20-50 | Product brands | Manufacturer information |
| **products** | ~100-500 | Product catalog | Brand, model, category |
| **parts** | ~500-2000 | Parts inventory | Stock tracking, pricing |
| **product_parts** | ~1000+ | Product-parts compatibility | Junction table |
| **service_tickets** | ~5000+ | Main service tickets | Auto-numbering, workflow |
| **service_ticket_parts** | ~10000+ | Parts used in tickets | Quantity, pricing |
| **service_ticket_comments** | ~20000+ | Ticket comments/notes | Status changes, notes |
| **service_ticket_attachments** | ~5000+ | Ticket file uploads | Images, documents |

**Phase 2 - Enhanced Features (14 tables) - ✅ Complete:**

| Table | Rows | Purpose | Story |
|-------|------|---------|-------|
| **task_templates** | ~20-50 | Workflow templates | 01.02 |
| **task_types** | ~15-30 | Task library | 01.02 |
| **task_templates_tasks** | ~200-500 | Template-task junction | 01.02 |
| **service_ticket_tasks** | ~50000+ | Task instances | 01.03-01.05 |
| **task_history** | ~100000+ | Task execution audit | 01.04 |
| **ticket_template_changes** | ~1000+ | Template switch log | 01.17 |
| **physical_warehouses** | ~5-20 | Warehouse locations | 01.06 |
| **virtual_warehouses** | ~20-100 | Virtual zones | 01.06 |
| **physical_products** | ~5000+ | Serial-tracked products | 01.07 |
| **stock_movements** | ~50000+ | Movement history | 01.08 |
| **product_stock_thresholds** | ~100-500 | Low-stock alerts | 01.09 |
| **service_requests** | ~2000+ | Public service requests | 01.11-01.13 |
| **email_notifications** | ~10000+ | Email queue/log | 01.15 |
| **audit_logs** | ~50000+ | Security audit trail | 01.00 |

**Total Tables:** 24 (10 Phase 1 + 14 Phase 2)

---

## Next Steps

Continue to [Component Architecture →](04-component-architecture.md) to understand how the application layers interact with this database schema.

---

[← Previous: Technology Stack](02-technology-stack.md) | [Back to Index](../architecture.md) | [Next: Component Architecture →](04-component-architecture.md)
