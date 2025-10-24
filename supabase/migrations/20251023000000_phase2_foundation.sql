-- =====================================================
-- 00_base_types.sql
-- =====================================================
-- Base Types: ENUMs
--
-- This file defines reusable enum types that are used across
-- the entire schema. It should be loaded before all other
-- schema files to ensure types are available.
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- User Role Enum
-- Used in: profiles
drop type if exists public.user_role cascade;
create type public.user_role as enum (
  'admin',
  'manager',
  'technician',
  'reception'
);

comment on type public.user_role is 'User roles in the service center system';

-- Ticket Status Enum
-- Used in: service_tickets
drop type if exists public.ticket_status cascade;
create type public.ticket_status as enum (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

comment on type public.ticket_status is 'Service ticket lifecycle statuses';

-- Priority Level Enum
-- Used in: service_tickets
drop type if exists public.priority_level cascade;
create type public.priority_level as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

comment on type public.priority_level is 'Priority levels for service tickets';

-- Warranty Type Enum
-- Used in: service_tickets
drop type if exists public.warranty_type cascade;
create type public.warranty_type as enum (
  'warranty',
  'paid',
  'goodwill'
);

comment on type public.warranty_type is 'Warranty status of service tickets';

-- Comment Type Enum
-- Used in: service_ticket_comments
drop type if exists public.comment_type cascade;
create type public.comment_type as enum (
  'note',
  'status_change',
  'assignment',
  'system'
);

comment on type public.comment_type is 'Types of comments on service tickets';

-- =====================================================
-- GRANTS
-- =====================================================

-- Types are available to all authenticated users
grant usage on type public.user_role to authenticated;
grant usage on type public.ticket_status to authenticated;
grant usage on type public.priority_level to authenticated;
grant usage on type public.warranty_type to authenticated;
grant usage on type public.comment_type to authenticated;
-- =====================================================
-- 00_base_functions.sql
-- =====================================================
-- Base Helper Functions
--
-- This file defines reusable helper functions used across
-- the schema. These functions must be created before any
-- tables that use them. Load after 00_base_types.sql.
-- =====================================================

-- =====================================================
-- TIMESTAMP FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
-- Used by triggers on all tables to maintain accurate modification timestamps
-- Security: SET search_path = '' prevents schema hijacking vulnerabilities
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';

comment on function update_updated_at_column() is 'Trigger function to automatically update updated_at timestamp';

-- =====================================================
-- RLS HELPER FUNCTIONS
-- =====================================================

-- Check if current user is an admin
-- Used in: RLS policies, storage policies
-- Security: SET search_path = '' prevents schema hijacking vulnerabilities
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = '';

comment on function public.is_admin() is 'Returns true if current user has admin role';

-- Check if current user is an admin or manager
-- Used in: RLS policies, storage policies
-- Security: SET search_path = '' prevents schema hijacking vulnerabilities
create or replace function public.is_admin_or_manager()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role in ('admin', 'manager')
  );
end;
$$ language plpgsql security definer set search_path = '';

comment on function public.is_admin_or_manager() is 'Returns true if current user has admin or manager role';

-- =====================================================
-- GRANTS
-- =====================================================

-- Functions are available to all authenticated users
grant execute on function update_updated_at_column() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_manager() to authenticated;
-- User profiles table - extends Supabase Auth with business logic and roles
-- This table links to auth.users and manages authorization + business information

create table "profiles" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null unique references auth.users(id) on delete cascade,
  "full_name" text not null,
  "avatar_url" text,
  "email" text not null,
  "role" public.user_role not null default 'technician',
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "profiles_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "profiles_user_id_idx" on "profiles" using btree ("user_id");
create index "profiles_email_idx" on "profiles" using btree ("email");
create index "profiles_role_idx" on "profiles" using btree ("role");
create index "profiles_is_active_idx" on "profiles" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on profile changes
create trigger "profiles_updated_at_trigger"
  before update on "profiles"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "profiles" enable row level security;

-- RLS policies (using helper functions for cleaner code)
create policy "profiles_select_policy" on "profiles"
  for select using (true); -- Allow all authenticated users to read profiles

create policy "profiles_insert_policy" on "profiles"
  for insert with check (
    auth.uid() = user_id or public.is_admin()
  );

create policy "profiles_update_policy" on "profiles"
  for update using (
    auth.uid() = user_id or public.is_admin()
  );

create policy "profiles_delete_policy" on "profiles"
  for delete using (
    public.is_admin()
  );-- Customers table - manages customer information for service center
-- Stores basic customer data with phone as identifier

create table "customers" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "phone" text not null,
  "email" text,
  "address" text,
  "notes" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "customers_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "customers_phone_idx" on "customers" using btree ("phone");
create index "customers_email_idx" on "customers" using btree ("email");
create index "customers_name_idx" on "customers" using btree ("name");
create index "customers_is_active_idx" on "customers" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on customer changes
create trigger "customers_updated_at_trigger"
  before update on "customers"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "customers" enable row level security;

-- RLS policies - customers can be accessed by all authenticated staff
create policy "customers_select_policy" on "customers"
  for select using (true);

create policy "customers_insert_policy" on "customers"
  for insert with check (true);

create policy "customers_update_policy" on "customers"
  for update using (true);

create policy "customers_delete_policy" on "customers"
  for delete using (
    public.is_admin_or_manager()
  );-- Brands table - manages product brands for service center
-- Replaces hardcoded brand values with normalized data

create table "brands" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null unique,
  "description" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "brands_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "brands_name_idx" on "brands" using btree ("name");
create index "brands_is_active_idx" on "brands" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on brand changes
create trigger "brands_updated_at_trigger"
  before update on "brands"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "brands" enable row level security;

-- RLS policies - brands can be accessed by all authenticated staff
create policy "brands_select_policy" on "brands"
  for select using (true);

create policy "brands_insert_policy" on "brands"
  for insert with check (true);

create policy "brands_update_policy" on "brands"
  for update using (true);

create policy "brands_delete_policy" on "brands"
  for delete using (
    public.is_admin_or_manager()
  );
-- Products table - manages product information for service center
-- Stores product data that will be serviced and repaired

create table "products" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "type" text not null,
  "brand_id" uuid references "brands"("id"),
  "model" text,
  "sku" text,
  "short_description" text,
  "primary_image" text,
  "warranty_period_months" integer check (warranty_period_months >= 0),
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "products_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "products_name_idx" on "products" using btree ("name");
create index "products_type_idx" on "products" using btree ("type");
create index "products_brand_id_idx" on "products" using btree ("brand_id");
create index "products_model_idx" on "products" using btree ("model");
create index "products_sku_idx" on "products" using btree ("sku");
create index "products_is_active_idx" on "products" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on product changes
create trigger "products_updated_at_trigger"
  before update on "products"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "products" enable row level security;

-- RLS policies - products can be accessed by all authenticated staff
create policy "products_select_policy" on "products"
  for select using (true);

create policy "products_insert_policy" on "products"
  for insert with check (true);

create policy "products_update_policy" on "products"
  for update using (true);

create policy "products_delete_policy" on "products"
  for delete using (
    public.is_admin_or_manager()
  );-- Parts table - manages replacement parts for products
-- Links to products and stores pricing information

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
  "image_url" text,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "parts_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "parts_name_idx" on "parts" using btree ("name");
create index "parts_part_number_idx" on "parts" using btree ("part_number");
create index "parts_sku_idx" on "parts" using btree ("sku");
create index "parts_category_idx" on "parts" using btree ("category");
create index "parts_stock_quantity_idx" on "parts" using btree ("stock_quantity");
create index "parts_is_active_idx" on "parts" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on parts changes
create trigger "parts_updated_at_trigger"
  before update on "parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "parts" enable row level security;

-- RLS policies - parts can be accessed by all authenticated staff
create policy "parts_select_policy" on "parts"
  for select using (true);

create policy "parts_insert_policy" on "parts"
  for insert with check (true);

create policy "parts_update_policy" on "parts"
  for update using (true);

create policy "parts_delete_policy" on "parts"
  for delete using (
    public.is_admin_or_manager()
  );-- Product-Parts junction table - manages the many-to-many relationship between products and parts
-- Links products to their compatible parts with quantity and requirement information

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

-- Create indexes for better performance
create index "product_parts_product_id_idx" on "product_parts" using btree ("product_id");
create index "product_parts_part_id_idx" on "product_parts" using btree ("part_id");

-- Trigger to automatically update updated_at on product parts changes
create trigger "product_parts_updated_at_trigger"
  before update on "product_parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "product_parts" enable row level security;

-- RLS policies (working implementation) - product parts can be accessed by all authenticated staff
create policy "product_parts_select_policy" on "product_parts"
  for select using (true);

create policy "product_parts_insert_policy" on "product_parts"
  for insert with check (true);

create policy "product_parts_update_policy" on "product_parts"
  for update using (true);

create policy "product_parts_delete_policy" on "product_parts"
  for delete using (true);
-- Service tickets table - manages service requests and repairs
-- Core table for tracking service workflow from receipt to completion

create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_number" text not null unique,
  "customer_id" uuid not null references "customers"("id"),
  "product_id" uuid not null references "products"("id"),
  "issue_description" text not null,
  "status" public.ticket_status not null default 'pending',
  "priority_level" public.priority_level not null default 'normal',
  "warranty_type" public.warranty_type,
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

-- Create indexes for better performance
create index "service_tickets_ticket_number_idx" on "service_tickets" using btree ("ticket_number");
create index "service_tickets_customer_id_idx" on "service_tickets" using btree ("customer_id");
create index "service_tickets_product_id_idx" on "service_tickets" using btree ("product_id");
create index "service_tickets_status_idx" on "service_tickets" using btree ("status");
create index "service_tickets_priority_level_idx" on "service_tickets" using btree ("priority_level");
create index "service_tickets_assigned_to_idx" on "service_tickets" using btree ("assigned_to");
create index "service_tickets_created_at_idx" on "service_tickets" using btree ("created_at");

-- Trigger to automatically update updated_at on service ticket changes
create trigger "service_tickets_updated_at_trigger"
  before update on "service_tickets"
  for each row
  execute function update_updated_at_column();

-- Function to generate ticket number in SV-YYYY-NNN format
-- Security: SET search_path prevents schema hijacking by limiting to pg_catalog and public
create or replace function public.generate_ticket_number()
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := to_char(now(), 'YYYY');

  -- Get the highest ticket number for current year using regexp
  select coalesce(
    max(
      (regexp_match(ticket_number, 'SV-' || current_year || '-(\d+)'))[1]::integer
    ), 0
  ) + 1
  into next_number
  from public.service_tickets
  where ticket_number ~ ('SV-' || current_year || '-\d+');

  -- Format as SV-YYYY-NNN (zero-padded to 3 digits)
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');

  return new_ticket_number;
end;
$$;

-- Trigger to automatically generate ticket number on insert
-- Security: SET search_path = '' prevents schema hijacking
create or replace function public.set_ticket_number()
returns trigger as $$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := public.generate_ticket_number();
  end if;
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger "service_tickets_set_number_trigger"
  before insert on "service_tickets"
  for each row
  execute function set_ticket_number();

-- Function to log status changes as comments
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
create or replace function public.log_status_change()
returns trigger as $$
begin
  -- Only log if status actually changed
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
      coalesce(new.updated_by, (select auth.uid()))
    );
  end if;

  return new;
end;
$$ language plpgsql
security definer
set search_path = '';

-- Trigger to log status changes
create trigger "service_tickets_log_status_change_trigger"
  after update on "service_tickets"
  for each row
  execute function log_status_change();

-- Add composite index for common query pattern (status + date filtering)
create index "service_tickets_status_created_at_idx"
  on "service_tickets" using btree ("status", "created_at");

-- Add check constraint for completed_at > started_at
alter table "service_tickets"
  add constraint "service_tickets_dates_check"
  check (completed_at is null or started_at is null or completed_at >= started_at);

-- Enable RLS (Row Level Security)
alter table "service_tickets" enable row level security;

-- RLS policies - service tickets can be accessed by all authenticated staff
create policy "service_tickets_select_policy" on "service_tickets"
  for select using (true);

create policy "service_tickets_insert_policy" on "service_tickets"
  for insert with check (true);

create policy "service_tickets_update_policy" on "service_tickets"
  for update using (true);

create policy "service_tickets_delete_policy" on "service_tickets"
  for delete using (
    public.is_admin_or_manager()
  );-- Service Ticket Parts table - junction table for parts used in service tickets
-- Manages the many-to-many relationship between service tickets and parts

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

-- Create indexes for better performance
create index "service_ticket_parts_ticket_id_idx" on "service_ticket_parts" using btree ("ticket_id");
create index "service_ticket_parts_part_id_idx" on "service_ticket_parts" using btree ("part_id");

-- Trigger to automatically update updated_at on service ticket parts changes
create trigger "service_ticket_parts_updated_at_trigger"
  before update on "service_ticket_parts"
  for each row
  execute function update_updated_at_column();

-- Function to update service ticket parts total
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
create or replace function public.update_service_ticket_parts_total()
returns trigger as $$
begin
  update public.service_tickets
  set parts_total = (
    select coalesce(sum(total_price), 0)
    from public.service_ticket_parts
    where ticket_id = coalesce(new.ticket_id, old.ticket_id)
  )
  where id = coalesce(new.ticket_id, old.ticket_id);

  return coalesce(new, old);
end;
$$ language plpgsql
security definer
set search_path = '';

-- Triggers to update parts total when ticket parts change
create trigger "service_ticket_parts_total_trigger"
  after insert or update or delete on "service_ticket_parts"
  for each row
  execute function update_service_ticket_parts_total();

-- Enable RLS (Row Level Security)
alter table "service_ticket_parts" enable row level security;

-- RLS policies (working implementation) - service ticket parts access follows service ticket permissions
create policy "service_ticket_parts_select_policy" on "service_ticket_parts"
  for select using (true);

create policy "service_ticket_parts_insert_policy" on "service_ticket_parts"
  for insert with check (true);

create policy "service_ticket_parts_update_policy" on "service_ticket_parts"
  for update using (true);

create policy "service_ticket_parts_delete_policy" on "service_ticket_parts"
  for delete using (true);-- Service Ticket Comments table - manages comments and notes for service tickets
-- Provides audit trail and communication history for each ticket

create table "service_ticket_comments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "comment" text not null,
  "comment_type" public.comment_type not null default 'note',
  "is_internal" boolean not null default false,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid not null references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_comments_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_ticket_comments_ticket_id_idx" on "service_ticket_comments" using btree ("ticket_id");
create index "service_ticket_comments_created_by_idx" on "service_ticket_comments" using btree ("created_by");
create index "service_ticket_comments_created_at_idx" on "service_ticket_comments" using btree ("created_at");

-- Trigger to automatically update updated_at on service ticket comments changes
create trigger "service_ticket_comments_updated_at_trigger"
  before update on "service_ticket_comments"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "service_ticket_comments" enable row level security;

-- RLS policies - comments access follows service ticket permissions
create policy "service_ticket_comments_select_policy" on "service_ticket_comments"
  for select using (true);

create policy "service_ticket_comments_insert_policy" on "service_ticket_comments"
  for insert with check (
    auth.uid() = created_by
  );

create policy "service_ticket_comments_update_policy" on "service_ticket_comments"
  for update using (
    auth.uid() = created_by or public.is_admin_or_manager()
  );

create policy "service_ticket_comments_delete_policy" on "service_ticket_comments"
  for delete using (
    auth.uid() = created_by or public.is_admin_or_manager()
  );

-- View for comments with author information
-- Makes it easy to display comments with user details
create or replace view service_ticket_comments_with_author as
select
  c.id,
  c.ticket_id,
  c.comment,
  c.comment_type,
  c.is_internal,
  c.created_at,
  c.updated_at,
  c.created_by,
  c.updated_by,
  p.full_name as author_name,
  p.email as author_email,
  p.avatar_url as author_avatar
from service_ticket_comments c
left join profiles p on p.user_id = c.created_by
order by c.created_at desc;-- Service ticket attachments table - manages images and files attached to tickets
-- Links files stored in Supabase Storage to service tickets

create table "service_ticket_attachments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "file_name" text not null,
  "file_path" text not null, -- Path in storage bucket
  "file_type" text not null, -- MIME type (image/jpeg, image/png, etc)
  "file_size" bigint not null, -- Size in bytes
  "description" text,
  "created_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_attachments_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_ticket_attachments_ticket_id_idx" on "service_ticket_attachments" using btree ("ticket_id");
create index "service_ticket_attachments_created_at_idx" on "service_ticket_attachments" using btree ("created_at");

-- Enable RLS (Row Level Security)
alter table "service_ticket_attachments" enable row level security;

-- RLS policies - attachments can be accessed by all authenticated staff
create policy "service_ticket_attachments_select_policy" on "service_ticket_attachments"
  for select using (true);

create policy "service_ticket_attachments_insert_policy" on "service_ticket_attachments"
  for insert with check (true);

create policy "service_ticket_attachments_update_policy" on "service_ticket_attachments"
  for update using (true);

create policy "service_ticket_attachments_delete_policy" on "service_ticket_attachments"
  for delete using (
    public.is_admin_or_manager()
  );
-- Function to decrease part stock quantity safely
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
CREATE OR REPLACE FUNCTION public.decrease_part_stock(
  part_id UUID,
  quantity_to_decrease INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update stock quantity with atomic check
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - quantity_to_decrease,
    updated_at = now()
  WHERE
    id = part_id
    AND stock_quantity >= quantity_to_decrease;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      part_id,
      coalesce((SELECT stock_quantity FROM public.parts WHERE id = part_id), 0),
      quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to increase part stock quantity (for returns/restocks)
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
CREATE OR REPLACE FUNCTION public.increase_part_stock(
  part_id UUID,
  quantity_to_increase INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update stock quantity
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + quantity_to_increase,
    updated_at = now()
  WHERE id = part_id;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', part_id;
  END IF;

  RETURN TRUE;
END;
$$;-- Phase 2 ENUMs
-- Service Center - Task Workflow, Warehouse, and Service Request Types
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TASK STATUS ENUM
-- =====================================================
-- Status flow for task execution
-- pending → in_progress → completed
--   ↓            ↓
-- blocked      skipped

DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped'
);

COMMENT ON TYPE public.task_status IS 'Task execution status within service ticket workflow';

-- =====================================================
-- WAREHOUSE TYPE ENUM
-- =====================================================
-- Five virtual warehouse types for product categorization

DROP TYPE IF EXISTS public.warehouse_type CASCADE;
CREATE TYPE public.warehouse_type AS ENUM (
  'warranty_stock',
  'rma_staging',
  'dead_stock',
  'in_service',
  'parts'
);

COMMENT ON TYPE public.warehouse_type IS 'Virtual warehouse categories for physical product organization';

-- =====================================================
-- SERVICE REQUEST STATUS ENUM
-- =====================================================
-- Status flow for public service requests
-- submitted → received → processing → completed
--                           ↓
--                       cancelled

DROP TYPE IF EXISTS public.request_status CASCADE;
CREATE TYPE public.request_status AS ENUM (
  'submitted',
  'received',
  'processing',
  'completed',
  'cancelled'
);

COMMENT ON TYPE public.request_status IS 'Status flow for customer service requests from public portal';

-- =====================================================
-- PRODUCT CONDITION ENUM
-- =====================================================
-- Physical condition of serialized products

DROP TYPE IF EXISTS public.product_condition CASCADE;
CREATE TYPE public.product_condition AS ENUM (
  'new',
  'refurbished',
  'used',
  'faulty',
  'for_parts'
);

COMMENT ON TYPE public.product_condition IS 'Physical condition classification for inventory products';

-- =====================================================
-- SERVICE TYPE ENUM (for task templates)
-- =====================================================
-- Service type determines which template to use

DROP TYPE IF EXISTS public.service_type CASCADE;
CREATE TYPE public.service_type AS ENUM (
  'warranty',
  'paid',
  'replacement'
);

COMMENT ON TYPE public.service_type IS 'Service type classification for task template selection';

-- =====================================================
-- DELIVERY METHOD ENUM
-- =====================================================
-- Customer delivery preference

DROP TYPE IF EXISTS public.delivery_method CASCADE;
CREATE TYPE public.delivery_method AS ENUM (
  'pickup',
  'delivery'
);

COMMENT ON TYPE public.delivery_method IS 'Customer product delivery method preference';

-- =====================================================
-- STOCK MOVEMENT TYPE ENUM
-- =====================================================
-- Types of product movements between warehouses

DROP TYPE IF EXISTS public.movement_type CASCADE;
CREATE TYPE public.movement_type AS ENUM (
  'receipt',
  'transfer',
  'assignment',
  'return',
  'disposal'
);

COMMENT ON TYPE public.movement_type IS 'Type of stock movement transaction';
-- Phase 2 Helper Functions
-- Service Center - Auto-generation and Utility Functions
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TRACKING TOKEN GENERATOR
-- =====================================================
-- Generates unique tracking tokens for service requests
-- Format: SR-XXXXXXXXXXXX (12 random alphanumeric characters)

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token VARCHAR(15);
  v_characters VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_token_exists BOOLEAN;
  v_max_attempts INT := 100;
  v_attempt INT := 0;
BEGIN
  -- Skip if tracking_token already set
  IF NEW.tracking_token IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generate unique token with retry logic
  LOOP
    -- Generate 12 random characters
    v_token := 'SR-';
    FOR i IN 1..12 LOOP
      v_token := v_token || SUBSTRING(v_characters FROM (FLOOR(RANDOM() * 36) + 1)::INT FOR 1);
    END LOOP;

    -- Check uniqueness
    SELECT EXISTS(
      SELECT 1 FROM public.service_requests WHERE tracking_token = v_token
    ) INTO v_token_exists;

    EXIT WHEN NOT v_token_exists;

    -- Prevent infinite loop
    v_attempt := v_attempt + 1;
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique tracking token after % attempts', v_max_attempts;
    END IF;
  END LOOP;

  NEW.tracking_token := v_token;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_tracking_token() IS 'Auto-generates unique tracking tokens (SR-XXXXXXXXXXXX) for service requests';

-- =====================================================
-- CALCULATE WARRANTY END DATE
-- =====================================================
-- Helper function to calculate warranty end date

CREATE OR REPLACE FUNCTION public.calculate_warranty_end_date(
  p_start_date DATE,
  p_warranty_months INT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_start_date IS NULL OR p_warranty_months IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN p_start_date + (p_warranty_months || ' months')::INTERVAL;
END;
$$;

COMMENT ON FUNCTION public.calculate_warranty_end_date(DATE, INT) IS 'Calculates warranty end date from start date and warranty duration in months';

-- =====================================================
-- GET WARRANTY STATUS
-- =====================================================
-- Returns warranty status: active, expiring_soon, expired

CREATE OR REPLACE FUNCTION public.get_warranty_status(p_warranty_end_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_days_remaining INT;
BEGIN
  IF p_warranty_end_date IS NULL THEN
    RETURN 'unknown';
  END IF;

  v_days_remaining := p_warranty_end_date - CURRENT_DATE;

  IF v_days_remaining < 0 THEN
    RETURN 'expired';
  ELSIF v_days_remaining <= 30 THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'active';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_warranty_status(DATE) IS 'Returns warranty status: active (>30 days), expiring_soon (≤30 days), expired (<0 days), or unknown';

-- =====================================================
-- AUTO-UPDATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Updates updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- =====================================================
-- RMA BATCH NUMBER GENERATOR
-- =====================================================
-- Generates sequential RMA batch numbers
-- Format: RMA-YYYY-MM-NNN

CREATE OR REPLACE FUNCTION public.generate_rma_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INT;
BEGIN
  -- Skip if batch_number already set
  IF NEW.batch_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get current year and month
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.rma_batches
  WHERE batch_number LIKE 'RMA-' || v_year || '-' || v_month || '-%';

  -- Generate batch number
  NEW.batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_rma_batch_number() IS 'Auto-generates sequential RMA batch numbers (RMA-YYYY-MM-NNN)';
-- Phase 2 Task Workflow Tables
-- Service Center - Task Templates and Execution
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TASK TEMPLATES
-- =====================================================
-- Template definitions for different service types

CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_type UUID REFERENCES public.products(id) ON DELETE CASCADE,
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  strict_sequence BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_templates_name_unique UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_task_templates_product_type ON public.task_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_service_type ON public.task_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON public.task_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE public.task_templates IS 'Task workflow templates for different product and service types';
COMMENT ON COLUMN public.task_templates.strict_sequence IS 'If true, tasks must be completed in order';
COMMENT ON COLUMN public.task_templates.product_type IS 'Optional: Link template to specific product type';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK TYPES
-- =====================================================
-- Library of reusable task definitions

CREATE TABLE IF NOT EXISTS public.task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  estimated_duration_minutes INT,
  requires_notes BOOLEAN NOT NULL DEFAULT false,
  requires_photo BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_types_name_unique UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_task_types_category ON public.task_types(category);
CREATE INDEX IF NOT EXISTS idx_task_types_active ON public.task_types(is_active) WHERE is_active = true;

COMMENT ON TABLE public.task_types IS 'Reusable library of task definitions';
COMMENT ON COLUMN public.task_types.category IS 'Task category: Intake, Diagnosis, Repair, QA, Closing';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_task_types_updated_at
  BEFORE UPDATE ON public.task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK TEMPLATES TASKS (Junction Table)
-- =====================================================
-- Maps task types to templates with sequence order

CREATE TABLE IF NOT EXISTS public.task_templates_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES public.task_types(id) ON DELETE RESTRICT,
  sequence_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_templates_tasks_template_sequence_unique UNIQUE(template_id, sequence_order),
  CONSTRAINT task_templates_tasks_sequence_positive CHECK (sequence_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_template ON public.task_templates_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_type ON public.task_templates_tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_tasks_sequence ON public.task_templates_tasks(template_id, sequence_order);

COMMENT ON TABLE public.task_templates_tasks IS 'Junction table mapping task types to templates with sequence order';
COMMENT ON COLUMN public.task_templates_tasks.sequence_order IS 'Execution order within template (1-based)';

-- =====================================================
-- SERVICE TICKET TASKS
-- =====================================================
-- Task instances created from templates for specific tickets

CREATE TABLE IF NOT EXISTS public.service_ticket_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES public.task_types(id) ON DELETE RESTRICT,
  template_task_id UUID REFERENCES public.task_templates_tasks(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  is_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_ticket_tasks_ticket_sequence_unique UNIQUE(ticket_id, sequence_order),
  CONSTRAINT service_ticket_tasks_sequence_positive CHECK (sequence_order > 0),
  CONSTRAINT service_ticket_tasks_completed_requires_notes CHECK (
    status != 'completed' OR completion_notes IS NOT NULL
  ),
  CONSTRAINT service_ticket_tasks_blocked_requires_reason CHECK (
    status != 'blocked' OR blocked_reason IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_ticket ON public.service_ticket_tasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_type ON public.service_ticket_tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_status ON public.service_ticket_tasks(status);
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_assigned ON public.service_ticket_tasks(assigned_to_id) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_pending ON public.service_ticket_tasks(ticket_id, status) WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE public.service_ticket_tasks IS 'Task instances for specific service tickets';
COMMENT ON COLUMN public.service_ticket_tasks.template_task_id IS 'Reference to template task if created from template';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_service_ticket_tasks_updated_at
  BEFORE UPDATE ON public.service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TASK HISTORY
-- =====================================================
-- Audit trail for task execution events

CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.service_ticket_tasks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_status public.task_status,
  new_status public.task_status NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_ticket ON public.task_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created ON public.task_history(created_at DESC);

COMMENT ON TABLE public.task_history IS 'Immutable audit trail of task status changes';

-- =====================================================
-- TICKET TEMPLATE CHANGES
-- =====================================================
-- Track when ticket template changes during service

CREATE TABLE IF NOT EXISTS public.ticket_template_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  old_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  new_template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_template_changes_ticket ON public.ticket_template_changes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_template_changes_created ON public.ticket_template_changes(created_at DESC);

COMMENT ON TABLE public.ticket_template_changes IS 'Audit trail of template changes during service execution';

-- =====================================================
-- RMA BATCHES
-- =====================================================
-- Return Merchandise Authorization batches

CREATE TABLE IF NOT EXISTS public.rma_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(20) NOT NULL UNIQUE,
  supplier_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  shipping_date DATE,
  tracking_number VARCHAR(255),
  notes TEXT,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_batches_batch_number ON public.rma_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_rma_batches_status ON public.rma_batches(status);
CREATE INDEX IF NOT EXISTS idx_rma_batches_created ON public.rma_batches(created_at DESC);

COMMENT ON TABLE public.rma_batches IS 'Return Merchandise Authorization batches for supplier returns';

-- Trigger: Auto-generate batch number
CREATE TRIGGER trigger_generate_rma_batch_number
  BEFORE INSERT ON public.rma_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_rma_batch_number();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_rma_batches_updated_at
  BEFORE UPDATE ON public.rma_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Phase 2 Warehouse Tables
-- Service Center - Physical and Virtual Warehouse Management
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- PHYSICAL WAREHOUSES
-- =====================================================
-- Physical locations for storing products

CREATE TABLE IF NOT EXISTS public.physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physical_warehouses_code ON public.physical_warehouses(code);
CREATE INDEX IF NOT EXISTS idx_physical_warehouses_active ON public.physical_warehouses(is_active) WHERE is_active = true;

COMMENT ON TABLE public.physical_warehouses IS 'Physical locations for storing products (shelves, rooms, buildings)';
COMMENT ON COLUMN public.physical_warehouses.code IS 'Short code for quick identification (e.g., WH-A, SHELF-01)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_physical_warehouses_updated_at
  BEFORE UPDATE ON public.physical_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VIRTUAL WAREHOUSES
-- =====================================================
-- Virtual categorization of products by status

CREATE TABLE IF NOT EXISTS public.virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_type public.warehouse_type NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  color_code VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_warehouses_type ON public.virtual_warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_virtual_warehouses_active ON public.virtual_warehouses(is_active) WHERE is_active = true;

COMMENT ON TABLE public.virtual_warehouses IS 'Virtual warehouse categories for product state management';
COMMENT ON COLUMN public.virtual_warehouses.warehouse_type IS 'One of: warranty_stock, rma_staging, dead_stock, in_service, parts';
COMMENT ON COLUMN public.virtual_warehouses.color_code IS 'Hex color for UI display (e.g., #10B981)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_virtual_warehouses_updated_at
  BEFORE UPDATE ON public.virtual_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PHYSICAL PRODUCTS
-- =====================================================
-- Serialized products with warranty tracking

CREATE TABLE IF NOT EXISTS public.physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,
  condition public.product_condition NOT NULL DEFAULT 'new',

  -- Warehouse location
  virtual_warehouse_type public.warehouse_type NOT NULL DEFAULT 'warranty_stock',
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Warranty tracking
  warranty_start_date DATE,
  warranty_months INT,
  warranty_end_date DATE,

  -- Service association
  current_ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,

  -- RMA tracking
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  rma_reason TEXT,
  rma_date DATE,

  -- Supplier info
  supplier_id UUID,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT physical_products_serial_unique UNIQUE(serial_number)
);

CREATE INDEX IF NOT EXISTS idx_physical_products_product ON public.physical_products(product_id);
CREATE INDEX IF NOT EXISTS idx_physical_products_serial ON public.physical_products(serial_number);
CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse ON public.physical_products(virtual_warehouse_type);
CREATE INDEX IF NOT EXISTS idx_physical_products_physical_warehouse ON public.physical_products(physical_warehouse_id) WHERE physical_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_condition ON public.physical_products(condition);
CREATE INDEX IF NOT EXISTS idx_physical_products_current_ticket ON public.physical_products(current_ticket_id) WHERE current_ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_rma_batch ON public.physical_products(rma_batch_id) WHERE rma_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_physical_products_warranty_expiring ON public.physical_products(warranty_end_date)
  WHERE warranty_end_date IS NOT NULL;

COMMENT ON TABLE public.physical_products IS 'Serialized product instances with warranty and location tracking';
COMMENT ON COLUMN public.physical_products.virtual_warehouse_type IS 'Current virtual warehouse category';
COMMENT ON COLUMN public.physical_products.warranty_end_date IS 'Auto-calculated from warranty_start_date + warranty_months';
COMMENT ON COLUMN public.physical_products.current_ticket_id IS 'Service ticket this product is currently assigned to';

-- Trigger: Auto-calculate warranty_end_date
CREATE OR REPLACE FUNCTION public.calculate_physical_product_warranty_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_months IS NOT NULL THEN
    NEW.warranty_end_date := NEW.warranty_start_date + (NEW.warranty_months || ' months')::INTERVAL;
  ELSE
    NEW.warranty_end_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_physical_products_warranty_calculation
  BEFORE INSERT OR UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_physical_product_warranty_end_date();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_physical_products_updated_at
  BEFORE UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK MOVEMENTS
-- =====================================================
-- Audit trail for all product movements

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,

  -- Movement type
  movement_type public.movement_type NOT NULL,

  -- Location tracking
  from_virtual_warehouse public.warehouse_type,
  to_virtual_warehouse public.warehouse_type,
  from_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,
  to_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Service ticket association
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,

  -- Metadata
  reason TEXT,
  notes TEXT,
  moved_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_movements_virtual_warehouse_changed CHECK (
    from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse OR
    from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id
  )
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_virtual ON public.stock_movements(from_virtual_warehouse) WHERE from_virtual_warehouse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_virtual ON public.stock_movements(to_virtual_warehouse) WHERE to_virtual_warehouse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_ticket ON public.stock_movements(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_moved_by ON public.stock_movements(moved_by_id);

COMMENT ON TABLE public.stock_movements IS 'Immutable audit trail of all product movements between warehouses';
COMMENT ON COLUMN public.stock_movements.movement_type IS 'Type: receipt, transfer, assignment, return, disposal';
COMMENT ON CONSTRAINT stock_movements_virtual_warehouse_changed ON public.stock_movements IS 'Ensure at least one location changed';

-- =====================================================
-- PRODUCT STOCK THRESHOLDS
-- =====================================================
-- Low stock alert configuration per product

CREATE TABLE IF NOT EXISTS public.product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_type public.warehouse_type NOT NULL,

  -- Threshold levels
  minimum_quantity INT NOT NULL,
  reorder_quantity INT,
  maximum_quantity INT,

  -- Alert settings
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  last_alert_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_stock_thresholds_product_warehouse_unique UNIQUE(product_id, warehouse_type),
  CONSTRAINT product_stock_thresholds_quantities_valid CHECK (
    minimum_quantity >= 0 AND
    (reorder_quantity IS NULL OR reorder_quantity >= minimum_quantity) AND
    (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity)
  )
);

CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_product ON public.product_stock_thresholds(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_warehouse ON public.product_stock_thresholds(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_product_stock_thresholds_alerts_enabled ON public.product_stock_thresholds(alert_enabled, warehouse_type)
  WHERE alert_enabled = true;

COMMENT ON TABLE public.product_stock_thresholds IS 'Low stock alert configuration per product and warehouse type';
COMMENT ON COLUMN public.product_stock_thresholds.minimum_quantity IS 'Alert when stock falls below this level';
COMMENT ON COLUMN public.product_stock_thresholds.reorder_quantity IS 'Suggested reorder quantity';
COMMENT ON COLUMN public.product_stock_thresholds.maximum_quantity IS 'Maximum stock level (for storage planning)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_product_stock_thresholds_updated_at
  BEFORE UPDATE ON public.product_stock_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Phase 2 Service Request Tables
-- Service Center - Public Service Request Portal
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- SERVICE REQUESTS
-- =====================================================
-- Public service requests from customer portal

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(15) NOT NULL UNIQUE,

  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Product information
  product_brand VARCHAR(255) NOT NULL,
  product_model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  purchase_date DATE,

  -- Issue details
  issue_description TEXT NOT NULL,
  issue_photos JSONB DEFAULT '[]'::jsonb,

  -- Service preferences
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  delivery_method public.delivery_method NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,

  -- Status tracking
  status public.request_status NOT NULL DEFAULT 'submitted',
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Service ticket linkage
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Metadata
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT service_requests_rejected_requires_reason CHECK (
    status != 'cancelled' OR rejection_reason IS NOT NULL
  ),
  CONSTRAINT service_requests_converted_requires_ticket CHECK (
    status != 'completed' OR ticket_id IS NOT NULL
  ),
  CONSTRAINT service_requests_delivery_requires_address CHECK (
    delivery_method != 'delivery' OR delivery_address IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_service_requests_tracking_token ON public.service_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_service_requests_email ON public.service_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_service_requests_phone ON public.service_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON public.service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_ticket ON public.service_requests(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_requests_pending ON public.service_requests(status, created_at DESC)
  WHERE status IN ('submitted', 'received');

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal';
COMMENT ON COLUMN public.service_requests.tracking_token IS 'Auto-generated tracking token (SR-XXXXXXXXXXXX)';
COMMENT ON COLUMN public.service_requests.issue_photos IS 'Array of photo URLs from storage bucket';
COMMENT ON COLUMN public.service_requests.status IS 'submitted → received → processing → completed | cancelled';
COMMENT ON COLUMN public.service_requests.ticket_id IS 'Service ticket created from this request';

-- Trigger: Auto-generate tracking token
CREATE TRIGGER trigger_generate_service_request_tracking_token
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_token();

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- EMAIL NOTIFICATIONS
-- =====================================================
-- Audit trail for all email notifications sent

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient information
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Email content
  subject VARCHAR(500) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  template_name VARCHAR(100),

  -- Context
  notification_type VARCHAR(100) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,

  -- Delivery tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,

  -- Error tracking
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON public.email_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_related ON public.email_notifications(related_entity_type, related_entity_id)
  WHERE related_entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON public.email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_pending_retry ON public.email_notifications(status, last_retry_at)
  WHERE status IN ('pending', 'failed') AND retry_count < 3;

COMMENT ON TABLE public.email_notifications IS 'Audit trail and delivery tracking for all email notifications';
COMMENT ON COLUMN public.email_notifications.notification_type IS 'Type: service_request_received, ticket_created, status_updated, etc.';
COMMENT ON COLUMN public.email_notifications.related_entity_type IS 'Entity type: service_request, service_ticket, etc.';
COMMENT ON COLUMN public.email_notifications.related_entity_id IS 'UUID of related entity';
COMMENT ON COLUMN public.email_notifications.status IS 'pending, sent, delivered, opened, clicked, bounced, failed';

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Phase 2 Service Tickets Extensions
-- Service Center - Extend existing service_tickets table
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- EXTEND SERVICE_TICKETS TABLE
-- =====================================================
-- Add Phase 2 columns as nullable to maintain backward compatibility

-- Add task template reference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- Add service request reference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL;

-- Add delivery preference
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS delivery_method public.delivery_method;

-- Add delivery address (required if delivery_method = 'delivery')
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add constraint: delivery address required if delivery method is 'delivery'
ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_delivery_requires_address;

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_delivery_requires_address CHECK (
    delivery_method != 'delivery' OR delivery_address IS NOT NULL
  );

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_service_tickets_template ON public.service_tickets(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_request ON public.service_tickets(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_delivery_method ON public.service_tickets(delivery_method) WHERE delivery_method IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.service_tickets.template_id IS 'Task template used for workflow (Phase 2)';
COMMENT ON COLUMN public.service_tickets.request_id IS 'Service request that created this ticket (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_method IS 'Customer delivery preference: pickup or delivery (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_address IS 'Delivery address if delivery_method = delivery (Phase 2)';
-- Phase 2 RLS Policies
-- Service Center - Row Level Security for Phase 2 Tables
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- ENABLE RLS ON ALL PHASE 2 TABLES
-- =====================================================

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_template_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TASK TEMPLATES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_templates_admin_all
  ON public.task_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_templates_staff_read
  ON public.task_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- TASK TYPES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_types_admin_all
  ON public.task_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_types_staff_read
  ON public.task_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- TASK TEMPLATES TASKS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_templates_tasks_admin_all
  ON public.task_templates_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_templates_tasks_staff_read
  ON public.task_templates_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- SERVICE TICKET TASKS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY service_ticket_tasks_admin_all
  ON public.service_ticket_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician: Read all, update assigned tasks
CREATE POLICY service_ticket_tasks_technician_read
  ON public.service_ticket_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

CREATE POLICY service_ticket_tasks_technician_update
  ON public.service_ticket_tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  )
  WITH CHECK (
    assigned_to_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

-- Reception: Read only
CREATE POLICY service_ticket_tasks_reception_read
  ON public.service_ticket_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'reception'
    )
  );

-- =====================================================
-- TASK HISTORY POLICIES (Audit Trail - Read Only)
-- =====================================================

-- All authenticated users: Read only
CREATE POLICY task_history_authenticated_read
  ON public.task_history
  FOR SELECT
  TO authenticated
  USING (true);

-- System only: Insert (via triggers/procedures)
CREATE POLICY task_history_system_insert
  ON public.task_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'technician')
    )
  );

-- =====================================================
-- TICKET TEMPLATE CHANGES POLICIES (Audit Trail)
-- =====================================================

-- All authenticated users: Read only
CREATE POLICY ticket_template_changes_authenticated_read
  ON public.ticket_template_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager: Insert only
CREATE POLICY ticket_template_changes_admin_insert
  ON public.ticket_template_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- RMA BATCHES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY rma_batches_admin_all
  ON public.rma_batches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY rma_batches_staff_read
  ON public.rma_batches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- PHYSICAL WAREHOUSES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY physical_warehouses_admin_all
  ON public.physical_warehouses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY physical_warehouses_authenticated_read
  ON public.physical_warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- VIRTUAL WAREHOUSES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY virtual_warehouses_admin_all
  ON public.virtual_warehouses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY virtual_warehouses_authenticated_read
  ON public.virtual_warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PHYSICAL PRODUCTS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY physical_products_admin_all
  ON public.physical_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician: Read all, update assigned products
CREATE POLICY physical_products_technician_read
  ON public.physical_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

CREATE POLICY physical_products_technician_update
  ON public.physical_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_ticket_tasks
      WHERE service_ticket_tasks.assigned_to_id = auth.uid()
      AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_ticket_tasks
      WHERE service_ticket_tasks.assigned_to_id = auth.uid()
      AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

-- Reception: Read only
CREATE POLICY physical_products_reception_read
  ON public.physical_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'reception'
    )
  );

-- =====================================================
-- STOCK MOVEMENTS POLICIES (Audit Trail)
-- =====================================================

-- All authenticated users: Read all
CREATE POLICY stock_movements_authenticated_read
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager/Technician: Create movements
CREATE POLICY stock_movements_staff_insert
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    moved_by_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'technician')
    )
  );

-- =====================================================
-- PRODUCT STOCK THRESHOLDS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY product_stock_thresholds_admin_all
  ON public.product_stock_thresholds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY product_stock_thresholds_authenticated_read
  ON public.product_stock_thresholds
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SERVICE REQUESTS POLICIES (PUBLIC PORTAL)
-- =====================================================

-- Public: Insert only (anonymous submissions)
CREATE POLICY service_requests_public_insert
  ON public.service_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public: Read own request by tracking token (no auth required)
-- Note: This is handled via tRPC procedure with tracking token validation

-- Authenticated staff: Read all
CREATE POLICY service_requests_authenticated_read
  ON public.service_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager/Reception: Update requests
CREATE POLICY service_requests_staff_update
  ON public.service_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'reception')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'reception')
    )
  );

-- =====================================================
-- EMAIL NOTIFICATIONS POLICIES (System Only)
-- =====================================================

-- System/Admin only: Read all
CREATE POLICY email_notifications_admin_read
  ON public.email_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- System only: Insert (via procedures/triggers)
CREATE POLICY email_notifications_system_insert
  ON public.email_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- System only: Update (delivery tracking)
CREATE POLICY email_notifications_system_update
  ON public.email_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY task_templates_admin_all ON public.task_templates IS 'Admin/Manager: Full access to task templates';
COMMENT ON POLICY task_templates_staff_read ON public.task_templates IS 'Technician/Reception: Read-only access to task templates';
COMMENT ON POLICY service_requests_public_insert ON public.service_requests IS 'PUBLIC: Anonymous users can submit service requests';
COMMENT ON POLICY service_requests_authenticated_read ON public.service_requests IS 'Authenticated staff: Read all service requests';
-- Phase 2 Database Views
-- Service Center - Analytics and Reporting Views
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- WAREHOUSE STOCK LEVELS VIEW
-- =====================================================
-- Current stock levels by product and warehouse type

CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.virtual_warehouse_type AS warehouse_type,
  pp.condition,

  -- Stock counts
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE + INTERVAL '30 days') AS active_warranty_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days') AS expiring_soon_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date <= CURRENT_DATE) AS expired_count,

  -- Value calculations
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,

  -- Threshold info
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,

  -- Alert status
  CASE
    WHEN pst.minimum_quantity IS NOT NULL AND COUNT(*) < pst.minimum_quantity THEN true
    ELSE false
  END AS is_below_minimum,

  -- Metadata
  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date

FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.warehouse_type = pp.virtual_warehouse_type

GROUP BY
  p.id,
  p.name,
  p.sku,
  b.name,
  pp.virtual_warehouse_type,
  pp.condition,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled

ORDER BY
  b.name,
  p.name,
  pp.virtual_warehouse_type;

COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Real-time stock levels by product, warehouse type, and condition with threshold alerts';

-- =====================================================
-- TASK PROGRESS SUMMARY VIEW
-- =====================================================
-- Task completion progress per service ticket

CREATE OR REPLACE VIEW public.v_task_progress_summary AS
SELECT
  st.id AS ticket_id,
  st.ticket_number,
  st.status AS ticket_status,

  -- Template info
  tt.id AS template_id,
  tt.name AS template_name,
  tt.strict_sequence,

  -- Task counts
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'pending') AS pending_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS in_progress_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'completed') AS completed_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'skipped') AS skipped_tasks,
  COUNT(*) FILTER (WHERE stt.is_required = true) AS required_tasks,
  COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed') AS required_completed,

  -- Progress calculations
  ROUND(
    (COUNT(*) FILTER (WHERE stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS completion_percentage,

  ROUND(
    (COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed')::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE stt.is_required = true), 0)) * 100,
    2
  ) AS required_completion_percentage,

  -- Time tracking
  MIN(stt.started_at) AS first_task_started_at,
  MAX(stt.completed_at) AS last_task_completed_at,
  SUM(
    CASE
      WHEN stt.completed_at IS NOT NULL AND stt.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60
      ELSE 0
    END
  ) AS total_minutes_spent,

  -- Next task info
  (
    SELECT jsonb_build_object(
      'id', stt2.id,
      'name', stt2.name,
      'sequence_order', stt2.sequence_order,
      'assigned_to_id', stt2.assigned_to_id
    )
    FROM public.service_ticket_tasks stt2
    WHERE stt2.ticket_id = st.id
    AND stt2.status = 'pending'
    ORDER BY stt2.sequence_order
    LIMIT 1
  ) AS next_pending_task,

  -- Blocked tasks info
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', stt3.id,
        'name', stt3.name,
        'sequence_order', stt3.sequence_order,
        'blocked_reason', stt3.blocked_reason
      )
      ORDER BY stt3.sequence_order
    )
    FROM public.service_ticket_tasks stt3
    WHERE stt3.ticket_id = st.id
    AND stt3.status = 'blocked'
  ) AS blocked_tasks_detail,

  -- Metadata
  st.created_at AS ticket_created_at,
  st.updated_at AS ticket_updated_at

FROM public.service_tickets st
LEFT JOIN public.task_templates tt ON st.template_id = tt.id
LEFT JOIN public.service_ticket_tasks stt ON stt.ticket_id = st.id

GROUP BY
  st.id,
  st.ticket_number,
  st.status,
  tt.id,
  tt.name,
  tt.strict_sequence,
  st.created_at,
  st.updated_at

ORDER BY st.created_at DESC;

COMMENT ON VIEW public.v_task_progress_summary IS 'Task completion progress summary per service ticket with next/blocked task details';

-- =====================================================
-- WARRANTY EXPIRING SOON VIEW
-- =====================================================
-- Products with warranty expiring within configurable days

CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  pp.virtual_warehouse_type,

  -- Product info
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  -- Warranty info
  pp.warranty_start_date,
  pp.warranty_months,
  pp.warranty_end_date,
  CASE
    WHEN pp.warranty_end_date IS NULL THEN 'unknown'::TEXT
    WHEN pp.warranty_end_date <= CURRENT_DATE THEN 'expired'::TEXT
    WHEN pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'::TEXT
    ELSE 'active'::TEXT
  END AS warranty_status,
  pp.warranty_end_date - CURRENT_DATE AS days_remaining,

  -- Physical location
  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,

  -- Service status
  st.id AS current_ticket_id,
  st.ticket_number AS current_ticket_number,
  st.status AS current_ticket_status,

  -- Metadata
  pp.created_at,
  pp.updated_at

FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.physical_warehouses pw ON pp.physical_warehouse_id = pw.id
LEFT JOIN public.service_tickets st ON pp.current_ticket_id = st.id

WHERE
  pp.warranty_end_date IS NOT NULL
  AND pp.warranty_end_date > CURRENT_DATE
  AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'

ORDER BY pp.warranty_end_date ASC;

COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Products with warranty expiring within 30 days';

-- =====================================================
-- SERVICE REQUEST SUMMARY VIEW
-- =====================================================
-- Service requests with customer and conversion info

CREATE OR REPLACE VIEW public.v_service_request_summary AS
SELECT
  sr.id,
  sr.tracking_token,
  sr.status,

  -- Customer info
  sr.customer_name,
  sr.customer_email,
  sr.customer_phone,

  -- Product info
  sr.product_brand,
  sr.product_model,
  sr.serial_number,
  sr.purchase_date,

  -- Issue info
  sr.issue_description,
  jsonb_array_length(COALESCE(sr.issue_photos, '[]'::jsonb)) AS photo_count,

  -- Service preferences
  sr.service_type,
  sr.delivery_method,
  sr.delivery_address,

  -- Status info
  sr.reviewed_by_id,
  prof.full_name AS reviewed_by_name,
  sr.reviewed_at,
  sr.rejection_reason,

  -- Conversion info
  sr.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,
  sr.converted_at,

  -- Time metrics
  sr.created_at AS submitted_at,
  sr.updated_at,
  CASE
    WHEN sr.reviewed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.reviewed_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_review,
  CASE
    WHEN sr.converted_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.converted_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_conversion,

  -- Request metadata
  sr.submitted_ip,
  sr.user_agent

FROM public.service_requests sr
LEFT JOIN public.profiles prof ON sr.reviewed_by_id = prof.id
LEFT JOIN public.service_tickets st ON sr.ticket_id = st.id

ORDER BY sr.created_at DESC;

COMMENT ON VIEW public.v_service_request_summary IS 'Service requests with customer info, conversion status, and time metrics';

-- =====================================================
-- STOCK MOVEMENT HISTORY VIEW
-- =====================================================
-- Detailed stock movement history with context

CREATE OR REPLACE VIEW public.v_stock_movement_history AS
SELECT
  sm.id AS movement_id,
  sm.movement_type,
  sm.created_at AS moved_at,

  -- Product info
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  -- From location
  sm.from_virtual_warehouse,
  fw.name AS from_physical_warehouse_name,
  fw.code AS from_physical_warehouse_code,

  -- To location
  sm.to_virtual_warehouse,
  tw.name AS to_physical_warehouse_name,
  tw.code AS to_physical_warehouse_code,

  -- Ticket association
  sm.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,

  -- Movement details
  sm.reason,
  sm.notes,

  -- User info
  sm.moved_by_id,
  prof.full_name AS moved_by_name,
  prof.role AS moved_by_role

FROM public.stock_movements sm
JOIN public.physical_products pp ON sm.physical_product_id = pp.id
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id
LEFT JOIN public.physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id
LEFT JOIN public.service_tickets st ON sm.ticket_id = st.id
LEFT JOIN public.profiles prof ON sm.moved_by_id = prof.id

ORDER BY sm.created_at DESC;

COMMENT ON VIEW public.v_stock_movement_history IS 'Detailed stock movement history with product, location, and user context';

-- =====================================================
-- LOW STOCK ALERT VIEW
-- =====================================================
-- Products below minimum stock thresholds

CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  pst.warehouse_type,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,

  -- Current stock
  COALESCE(stock.quantity, 0) AS current_quantity,
  pst.minimum_quantity - COALESCE(stock.quantity, 0) AS quantity_below_minimum,

  -- Alert settings
  pst.alert_enabled,
  pst.last_alert_sent_at,

  -- Metadata
  pst.created_at AS threshold_created_at,
  pst.updated_at AS threshold_updated_at

FROM public.product_stock_thresholds pst
JOIN public.products p ON pst.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN (
  SELECT
    product_id,
    virtual_warehouse_type,
    COUNT(*) AS quantity
  FROM public.physical_products
  GROUP BY product_id, virtual_warehouse_type
) stock ON stock.product_id = p.id AND stock.virtual_warehouse_type = pst.warehouse_type

WHERE
  pst.alert_enabled = true
  AND COALESCE(stock.quantity, 0) < pst.minimum_quantity

ORDER BY
  (pst.minimum_quantity - COALESCE(stock.quantity, 0)) DESC,
  b.name,
  p.name;

COMMENT ON VIEW public.v_low_stock_alerts IS 'Products below minimum stock thresholds requiring reorder';
