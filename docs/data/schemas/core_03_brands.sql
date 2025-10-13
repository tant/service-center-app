-- Brands table - manages product brands for service center
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
