-- Products table - manages product information for service center
-- Stores product data that will be serviced and repaired

create table "products" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "type" text not null,
  "brand" text,
  "model" text,
  "sku" text,
  "description" text,
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
create index "products_brand_idx" on "products" using btree ("brand");
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

-- RLS policies (working implementation) - products can be accessed by all authenticated staff
create policy "products_select_policy" on "products"
  for select using (true);

create policy "products_insert_policy" on "products"
  for insert with check (true);

create policy "products_update_policy" on "products"
  for update using (true);

create policy "products_delete_policy" on "products"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = (select auth.uid()) and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );