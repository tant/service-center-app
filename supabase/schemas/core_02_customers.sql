-- Customers table - manages customer information for service center
-- Stores basic customer data with phone as identifier

create table "customers" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "phone" public.phone_number not null,
  "email" public.optional_email_address,
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
  );