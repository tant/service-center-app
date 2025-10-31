-- =====================================================
-- 01_users_and_customers.sql
-- =====================================================
-- Tables for managing users (profiles) and customers.
-- =====================================================

-- =====================================================
-- PROFILES TABLE (from core_01_profiles.sql)
-- =====================================================
-- User profiles table - extends Supabase Auth with business logic and roles
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

-- Indexes
create index "profiles_user_id_idx" on "profiles" using btree ("user_id");
create index "profiles_email_idx" on "profiles" using btree ("email");
create index "profiles_role_idx" on "profiles" using btree ("role");
create index "profiles_is_active_idx" on "profiles" using btree ("is_active") where is_active = true;

-- Triggers
create trigger "profiles_updated_at_trigger"
  before update on "profiles"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "profiles" enable row level security;
create policy "profiles_select_policy" on "profiles" for select using (true);
create policy "profiles_insert_policy" on "profiles" for insert with check ((SELECT auth.uid()) = user_id or public.is_admin());
create policy "profiles_update_policy" on "profiles" for update using ((SELECT auth.uid()) = user_id or public.is_admin());
create policy "profiles_delete_policy" on "profiles" for delete using (public.is_admin());

-- =====================================================
-- CUSTOMERS TABLE (from core_02_customers.sql)
-- =====================================================
-- Customers table - manages customer information for service center
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

-- Indexes
create index "customers_phone_idx" on "customers" using btree ("phone");
create index "customers_email_idx" on "customers" using btree ("email");
create index "customers_name_idx" on "customers" using btree ("name");
create index "customers_is_active_idx" on "customers" using btree ("is_active") where is_active = true;

-- Triggers
create trigger "customers_updated_at_trigger"
  before update on "customers"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "customers" enable row level security;
create policy "customers_select_policy" on "customers" for select using (true);
create policy "customers_insert_policy" on "customers" for insert with check (true);
create policy "customers_update_policy" on "customers" for update using (true);
create policy "customers_delete_policy" on "customers" for delete using (public.is_admin_or_manager());
