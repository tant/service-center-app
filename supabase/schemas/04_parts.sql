-- Parts table - manages replacement parts for products
-- Links to products and stores pricing information

create table "parts" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid not null references "products"("id") on delete cascade,
  "name" text not null,
  "part_number" text,
  "sku" text,
  "description" text,
  "price" decimal(10,2) not null check (price >= 0),
  "image_url" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),
  
  constraint "parts_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "parts_product_id_idx" on "parts" using btree ("product_id");
create index "parts_name_idx" on "parts" using btree ("name");
create index "parts_part_number_idx" on "parts" using btree ("part_number") where part_number is not null;
create index "parts_sku_idx" on "parts" using btree ("sku") where sku is not null;
create index "parts_price_idx" on "parts" using btree ("price");

-- Add unique constraints for part_number and sku when they exist
create unique index "parts_part_number_unique_idx" on "parts" ("part_number") 
  where "part_number" is not null;
create unique index "parts_sku_unique_idx" on "parts" ("sku") 
  where "sku" is not null;

-- Trigger to automatically update updated_at on parts changes
create trigger "parts_updated_at_trigger"
  before update on "parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "parts" enable row level security;

-- RLS policies - parts can be accessed by all authenticated staff
create policy "parts_select_policy" on "parts"
  for select using (auth.role() = 'authenticated');

create policy "parts_insert_policy" on "parts"
  for insert with check (auth.role() = 'authenticated');

create policy "parts_update_policy" on "parts"
  for update using (auth.role() = 'authenticated');

create policy "parts_delete_policy" on "parts"
  for delete using (
    exists (
      select 1 from profiles 
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );