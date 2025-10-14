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
  );