-- Customers table - manages customer information for service center
-- Stores basic customer data with phone as unique identifier

create table "customers" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "phone" text not null unique,
  "email" text,
  "address" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  
  constraint "customers_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "customers_phone_idx" on "customers" using btree ("phone");
create index "customers_name_idx" on "customers" using btree ("name");
create index "customers_email_idx" on "customers" using btree ("email") where email is not null;

-- Add constraints for data validation
alter table "customers" add constraint "customers_phone_format_check" 
  check (phone ~ '^[0-9+\-\s()]+$' and length(phone) >= 10);

alter table "customers" add constraint "customers_email_format_check" 
  check (email is null or email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Trigger to automatically update updated_at on customer changes
create trigger "customers_updated_at_trigger"
  before update on "customers"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "customers" enable row level security;

-- RLS policies - customers can be accessed by all authenticated staff
create policy "customers_select_policy" on "customers"
  for select using (auth.role() = 'authenticated');

create policy "customers_insert_policy" on "customers"
  for insert with check (auth.role() = 'authenticated');

create policy "customers_update_policy" on "customers"
  for update using (auth.role() = 'authenticated');

create policy "customers_delete_policy" on "customers"
  for delete using (
    exists (
      select 1 from profiles 
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );