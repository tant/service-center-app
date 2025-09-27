-- User profiles table - extends Supabase Auth with business logic and roles
-- This table links to auth.users and manages authorization + business information

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

-- Create indexes for better performance
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

-- Trigger to automatically update updated_at on profile changes
create trigger "profiles_updated_at_trigger"
  before update on "profiles"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "profiles" enable row level security;

-- RLS policies (basic - will need refinement based on business rules)
create policy "profiles_select_policy" on "profiles"
  for select using (true); -- Allow all authenticated users to read profiles

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