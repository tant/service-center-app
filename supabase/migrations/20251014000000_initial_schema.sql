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
$$ language plpgsql security definer set search_path = 'public';

comment on function public.is_admin() is 'Returns true if current user has admin role';

-- Check if current user is an admin or manager
-- Used in: RLS policies, storage policies
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
$$ language plpgsql security definer set search_path = 'public';

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
-- Security: SET search_path = 'public' and explicit schema qualification
create or replace function generate_ticket_number()
returns text as $$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := to_char(now(), 'YYYY');

  -- Get the highest ticket number for current year
  select coalesce(
    max(
      cast(
        substring(ticket_number from 'SV-' || current_year || '-(\d+)') as integer
      )
    ), 0
  ) + 1
  into next_number
  from public.service_tickets
  where ticket_number like 'SV-' || current_year || '-%';

  -- Format as SV-YYYY-NNN (zero-padded to 3 digits)
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');

  return new_ticket_number;
end;
$$ language plpgsql
security definer
set search_path = 'public';

-- Trigger to automatically generate ticket number on insert
create or replace function set_ticket_number()
returns trigger as $$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := generate_ticket_number();
  end if;
  return new;
end;
$$ language plpgsql
set search_path = 'public';

create trigger "service_tickets_set_number_trigger"
  before insert on "service_tickets"
  for each row
  execute function set_ticket_number();

-- Function to log status changes as comments
-- Security: SET search_path = 'public' and explicit schema qualification
create or replace function log_status_change()
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
set search_path = 'public';

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
-- Security: SET search_path = 'public' and explicit schema qualification
create or replace function update_service_ticket_parts_total()
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
set search_path = 'public';

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
-- Security: SET search_path = 'public' and explicit schema qualification
CREATE OR REPLACE FUNCTION decrease_part_stock(
  part_id UUID,
  quantity_to_decrease INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update stock quantity with atomic check
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - quantity_to_decrease,
    updated_at = NOW()
  WHERE
    id = part_id
    AND stock_quantity >= quantity_to_decrease;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      part_id,
      COALESCE((SELECT stock_quantity FROM public.parts WHERE id = part_id), 0),
      quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to increase part stock quantity (for returns/restocks)
-- Security: SET search_path = 'public' and explicit schema qualification
CREATE OR REPLACE FUNCTION increase_part_stock(
  part_id UUID,
  quantity_to_increase INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update stock quantity
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + quantity_to_increase,
    updated_at = NOW()
  WHERE id = part_id;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', part_id;
  END IF;

  RETURN TRUE;
END;
$$;-- Storage policies for Supabase Storage buckets
-- Note: Buckets must be created first via Supabase Studio Dashboard or seed script
-- This file only contains the RLS policies for storage.objects table

-- ============================================================================
-- AVATARS BUCKET POLICIES
-- ============================================================================
-- Users can upload their own avatar to their folder (user_id/filename.jpg)
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================================
-- PRODUCT_IMAGES BUCKET POLICIES
-- ============================================================================
create policy "product_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "product_images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "product_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Anyone can view product images (public bucket)
create policy "product_images_select_all"
  on storage.objects for select
  using (bucket_id = 'product_images');

-- ============================================================================
-- SERVICE_MEDIA BUCKET POLICIES (Public)
-- ============================================================================
-- Public access for viewing and uploading, but restricted delete
create policy "service_media_insert_public"
  on storage.objects for insert
  with check (bucket_id = 'service_media');

create policy "service_media_update_public"
  on storage.objects for update
  using (bucket_id = 'service_media');

-- Only admin/manager can delete service media files
create policy "service_media_delete_restricted"
  on storage.objects for delete
  using (
    bucket_id = 'service_media'
    and public.is_admin_or_manager()
  );

create policy "service_media_select_public"
  on storage.objects for select
  using (bucket_id = 'service_media');
