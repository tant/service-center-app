-- Complete database schema setup for SSTC Service Center
-- This migration sets up all tables, relationships, and constraints from docs/data/schemas

-- 1. Profiles table (extends Supabase Auth)
create table "profiles" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null unique references auth.users(id) on delete cascade,
  "full_name" text not null,
  "avatar_url" text,
  "email" text not null,
  "roles" text[] not null default array[]::text[],
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "profiles_pkey" primary key ("id")
);

-- Create indexes for profiles
create index "profiles_user_id_idx" on "profiles" using btree ("user_id");
create index "profiles_email_idx" on "profiles" using btree ("email");
create index "profiles_roles_idx" on "profiles" using gin ("roles");
create index "profiles_is_active_idx" on "profiles" using btree ("is_active") where is_active = true;

-- Add constraints for role validation
alter table "profiles" add constraint "profiles_roles_check"
  check ("roles" <@ array['admin', 'manager', 'technician', 'reception']);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles
create trigger "profiles_updated_at_trigger"
  before update on "profiles"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for profiles
alter table "profiles" enable row level security;

-- RLS policies for profiles
create policy "profiles_select_policy" on "profiles"
  for select using (true);

create policy "profiles_insert_policy" on "profiles"
  for insert with check (
    auth.uid() = user_id or
    exists (
      select 1 from profiles
      where user_id = auth.uid() and 'admin' = any(roles)
    )
  );

create policy "profiles_update_policy" on "profiles"
  for update using (
    auth.uid() = user_id or
    exists (
      select 1 from profiles
      where user_id = auth.uid() and 'admin' = any(roles)
    )
  );

create policy "profiles_delete_policy" on "profiles"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = auth.uid() and 'admin' = any(roles)
    )
  );

-- 2. Customers table
create table "customers" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "phone" text not null check (phone ~ '^[0-9+\-\s()]+' and length(phone) >= 10),
  "email" text check (email = '' or email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
  "address" text,
  "notes" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "customers_pkey" primary key ("id")
);

-- Create indexes for customers
create index "customers_phone_idx" on "customers" using btree ("phone");
create index "customers_email_idx" on "customers" using btree ("email");
create index "customers_name_idx" on "customers" using btree ("name");
create index "customers_is_active_idx" on "customers" using btree ("is_active") where is_active = true;

-- Trigger for customers
create trigger "customers_updated_at_trigger"
  before update on "customers"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for customers
alter table "customers" enable row level security;

-- RLS policies for customers
create policy "customers_select_policy" on "customers"
  for select using (true);

create policy "customers_insert_policy" on "customers"
  for insert with check (true);

create policy "customers_update_policy" on "customers"
  for update using (true);

create policy "customers_delete_policy" on "customers"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

-- 3. Parts table
create table "parts" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "part_number" text,
  "sku" text,
  "description" text,
  "category" text,
  "price" decimal(10,2) not null check (price >= 0),
  "cost_price" decimal(10,2) check (cost_price >= 0),
  "stock_quantity" integer not null default 0 check (stock_quantity >= 0),
  "min_stock_level" integer default 0 check (min_stock_level >= 0),
  "supplier" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "parts_pkey" primary key ("id")
);

-- Create indexes for parts
create index "parts_name_idx" on "parts" using btree ("name");
create index "parts_part_number_idx" on "parts" using btree ("part_number");
create index "parts_sku_idx" on "parts" using btree ("sku");
create index "parts_category_idx" on "parts" using btree ("category");
create index "parts_stock_quantity_idx" on "parts" using btree ("stock_quantity");
create index "parts_is_active_idx" on "parts" using btree ("is_active") where is_active = true;

-- Trigger for parts
create trigger "parts_updated_at_trigger"
  before update on "parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for parts
alter table "parts" enable row level security;

-- RLS policies for parts
create policy "parts_select_policy" on "parts"
  for select using (true);

create policy "parts_insert_policy" on "parts"
  for insert with check (true);

create policy "parts_update_policy" on "parts"
  for update using (true);

create policy "parts_delete_policy" on "parts"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

-- 4. Products table
create table "products" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "type" text not null,
  "brand" text,
  "model" text,
  "sku" text,
  "description" text,
  "warranty_period_months" integer check (warranty_period_months >= 0),
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "products_pkey" primary key ("id")
);

-- Create indexes for products
create index "products_name_idx" on "products" using btree ("name");
create index "products_type_idx" on "products" using btree ("type");
create index "products_brand_idx" on "products" using btree ("brand");
create index "products_model_idx" on "products" using btree ("model");
create index "products_sku_idx" on "products" using btree ("sku");
create index "products_is_active_idx" on "products" using btree ("is_active") where is_active = true;

-- Trigger for products
create trigger "products_updated_at_trigger"
  before update on "products"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for products
alter table "products" enable row level security;

-- RLS policies for products
create policy "products_select_policy" on "products"
  for select using (true);

create policy "products_insert_policy" on "products"
  for insert with check (true);

create policy "products_update_policy" on "products"
  for update using (true);

create policy "products_delete_policy" on "products"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

-- 5. Product-Parts junction table
create table "product_parts" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid not null references "products"("id") on delete cascade,
  "part_id" uuid not null references "parts"("id") on delete cascade,
  "quantity_per_unit" integer not null default 1 check (quantity_per_unit > 0),
  "is_required" boolean not null default false,
  "notes" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "product_parts_pkey" primary key ("id"),
  constraint "product_parts_unique" unique ("product_id", "part_id")
);

-- Create indexes for product_parts
create index "product_parts_product_id_idx" on "product_parts" using btree ("product_id");
create index "product_parts_part_id_idx" on "product_parts" using btree ("part_id");

-- Trigger for product_parts
create trigger "product_parts_updated_at_trigger"
  before update on "product_parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for product_parts
alter table "product_parts" enable row level security;

-- RLS policies for product_parts
create policy "product_parts_select_policy" on "product_parts"
  for select using (true);

create policy "product_parts_insert_policy" on "product_parts"
  for insert with check (true);

create policy "product_parts_update_policy" on "product_parts"
  for update using (true);

create policy "product_parts_delete_policy" on "product_parts"
  for delete using (true);

-- 6. Service Tickets table
create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_number" text not null unique,
  "customer_id" uuid not null references "customers"("id"),
  "product_id" uuid not null references "products"("id"),
  "issue_description" text not null,
  "status" text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  "priority_level" text not null default 'normal' check (priority_level in ('low', 'normal', 'high', 'urgent')),
  "warranty_type" text check (warranty_type in ('warranty', 'paid', 'goodwill')),
  "assigned_to" uuid references "profiles"("user_id"),
  "service_fee" decimal(10,2) not null default 0 check (service_fee >= 0),
  "diagnosis_fee" decimal(10,2) not null default 0 check (diagnosis_fee >= 0),
  "parts_total" decimal(10,2) not null default 0 check (parts_total >= 0),
  "discount_amount" decimal(10,2) not null default 0 check (discount_amount >= 0),
  "total_cost" decimal(10,2) generated always as (service_fee + diagnosis_fee + parts_total - discount_amount) stored,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "notes" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_tickets_pkey" primary key ("id")
);

-- Create indexes for service_tickets
create index "service_tickets_ticket_number_idx" on "service_tickets" using btree ("ticket_number");
create index "service_tickets_customer_id_idx" on "service_tickets" using btree ("customer_id");
create index "service_tickets_product_id_idx" on "service_tickets" using btree ("product_id");
create index "service_tickets_status_idx" on "service_tickets" using btree ("status");
create index "service_tickets_priority_level_idx" on "service_tickets" using btree ("priority_level");
create index "service_tickets_assigned_to_idx" on "service_tickets" using btree ("assigned_to");
create index "service_tickets_created_at_idx" on "service_tickets" using btree ("created_at");

-- Trigger for service_tickets
create trigger "service_tickets_updated_at_trigger"
  before update on "service_tickets"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for service_tickets
alter table "service_tickets" enable row level security;

-- RLS policies for service_tickets
create policy "service_tickets_select_policy" on "service_tickets"
  for select using (true);

create policy "service_tickets_insert_policy" on "service_tickets"
  for insert with check (true);

create policy "service_tickets_update_policy" on "service_tickets"
  for update using (true);

create policy "service_tickets_delete_policy" on "service_tickets"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

-- 7. Service Ticket Parts table
create table "service_ticket_parts" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "part_id" uuid not null references "parts"("id"),
  "quantity" integer not null check (quantity > 0),
  "unit_price" decimal(10,2) not null check (unit_price >= 0),
  "total_price" decimal(10,2) generated always as (quantity * unit_price) stored,
  "notes" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_parts_pkey" primary key ("id"),
  constraint "service_ticket_parts_unique" unique ("ticket_id", "part_id")
);

-- Create indexes for service_ticket_parts
create index "service_ticket_parts_ticket_id_idx" on "service_ticket_parts" using btree ("ticket_id");
create index "service_ticket_parts_part_id_idx" on "service_ticket_parts" using btree ("part_id");

-- Trigger for service_ticket_parts
create trigger "service_ticket_parts_updated_at_trigger"
  before update on "service_ticket_parts"
  for each row
  execute function update_updated_at_column();

-- Function to update service ticket parts total
create or replace function update_service_ticket_parts_total()
returns trigger as $$
begin
  update service_tickets
  set parts_total = (
    select coalesce(sum(total_price), 0)
    from service_ticket_parts
    where ticket_id = coalesce(new.ticket_id, old.ticket_id)
  )
  where id = coalesce(new.ticket_id, old.ticket_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Triggers to update parts total when ticket parts change
create trigger "service_ticket_parts_total_trigger"
  after insert or update or delete on "service_ticket_parts"
  for each row
  execute function update_service_ticket_parts_total();

-- Enable RLS for service_ticket_parts
alter table "service_ticket_parts" enable row level security;

-- RLS policies for service_ticket_parts
create policy "service_ticket_parts_select_policy" on "service_ticket_parts"
  for select using (true);

create policy "service_ticket_parts_insert_policy" on "service_ticket_parts"
  for insert with check (true);

create policy "service_ticket_parts_update_policy" on "service_ticket_parts"
  for update using (true);

create policy "service_ticket_parts_delete_policy" on "service_ticket_parts"
  for delete using (true);

-- 8. Service Ticket Comments table
create table "service_ticket_comments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "comment" text not null,
  "is_internal" boolean not null default false,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid not null references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_comments_pkey" primary key ("id")
);

-- Create indexes for service_ticket_comments
create index "service_ticket_comments_ticket_id_idx" on "service_ticket_comments" using btree ("ticket_id");
create index "service_ticket_comments_created_by_idx" on "service_ticket_comments" using btree ("created_by");
create index "service_ticket_comments_created_at_idx" on "service_ticket_comments" using btree ("created_at");

-- Trigger for service_ticket_comments
create trigger "service_ticket_comments_updated_at_trigger"
  before update on "service_ticket_comments"
  for each row
  execute function update_updated_at_column();

-- Enable RLS for service_ticket_comments
alter table "service_ticket_comments" enable row level security;

-- RLS policies for service_ticket_comments
create policy "service_ticket_comments_select_policy" on "service_ticket_comments"
  for select using (true);

create policy "service_ticket_comments_insert_policy" on "service_ticket_comments"
  for insert with check (
    auth.uid() = created_by
  );

create policy "service_ticket_comments_update_policy" on "service_ticket_comments"
  for update using (
    auth.uid() = created_by or
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

create policy "service_ticket_comments_delete_policy" on "service_ticket_comments"
  for delete using (
    auth.uid() = created_by or
    exists (
      select 1 from profiles
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

-- Function to decrease part stock (for service tickets)
create or replace function decrease_part_stock(part_id uuid, quantity_to_decrease integer)
returns void as $$
begin
  update parts
  set stock_quantity = greatest(0, stock_quantity - quantity_to_decrease)
  where id = part_id;
end;
$$ language plpgsql;