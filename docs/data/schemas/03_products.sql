-- Products table - manages product information for service center
-- Stores product data that will be serviced and repaired

create table "products" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "sku" text,
  "short_description" text,
  -- brand is an optional enum-like text column. Add common brands here; leave room for 'Other'.
  "brand" text check ("brand" in ('ZOTAC', 'SSTC', 'Apple', 'Other')),
  "model" text,
  -- type classifies the product. Examples include VGA, MiniPC, Smartphone, etc.
  "type" text check ("type" in ('VGA', 'MiniPC', 'SSD', 'RAM', 'Mainboard', 'Smartphone', 'Other')),
  "primary_image" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),
  
  constraint "products_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "products_name_idx" on "products" using btree ("name");
create index "products_sku_idx" on "products" using btree ("sku") where sku is not null;
create index "products_brand_idx" on "products" using btree ("brand") where brand is not null;
create index "products_type_idx" on "products" using btree ("type") where type is not null;
create index "products_created_by_idx" on "products" using btree ("created_by");

-- Add unique constraint for SKU when it exists
create unique index "products_sku_unique_idx" on "products" ("sku") where "sku" is not null;

-- Trigger to automatically update updated_at on product changes
create trigger "products_updated_at_trigger"
  before update on "products"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "products" enable row level security;

-- RLS policies - products can be accessed by all authenticated staff
create policy "products_select_policy" on "products"
  for select using (auth.role() = 'authenticated');

create policy "products_insert_policy" on "products"
  for insert with check (auth.role() = 'authenticated');

create policy "products_update_policy" on "products"
  for update using (auth.role() = 'authenticated');

create policy "products_delete_policy" on "products"
  for delete using (
    exists (
      select 1 from profiles 
      where user_id = auth.uid() and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );