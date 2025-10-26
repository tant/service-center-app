-- =====================================================
-- 02_products_and_inventory.sql
-- =====================================================
-- Tables for managing products, brands, parts, and
-- their relationships.
-- =====================================================

-- =====================================================
-- BRANDS TABLE (from core_03_brands.sql)
-- =====================================================
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

-- Indexes
create index "brands_name_idx" on "brands" using btree ("name");
create index "brands_is_active_idx" on "brands" using btree ("is_active") where is_active = true;

-- Triggers
create trigger "brands_updated_at_trigger"
  before update on "brands"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "brands" enable row level security;
create policy "brands_select_policy" on "brands" for select using (true);
create policy "brands_insert_policy" on "brands" for insert with check (true);
create policy "brands_update_policy" on "brands" for update using (true);
create policy "brands_delete_policy" on "brands" for delete using (public.is_admin_or_manager());

-- =====================================================
-- PRODUCTS TABLE (from core_04_products.sql)
-- =====================================================
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

-- Indexes
create index "products_name_idx" on "products" using btree ("name");
create index "products_type_idx" on "products" using btree ("type");
create index "products_brand_id_idx" on "products" using btree ("brand_id");
create index "products_model_idx" on "products" using btree ("model");
create index "products_sku_idx" on "products" using btree ("sku");
create index "products_is_active_idx" on "products" using btree ("is_active") where is_active = true;

-- Triggers
create trigger "products_updated_at_trigger"
  before update on "products"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "products" enable row level security;
create policy "products_select_policy" on "products" for select using (true);
create policy "products_insert_policy" on "products" for insert with check (true);
create policy "products_update_policy" on "products" for update using (true);
create policy "products_delete_policy" on "products" for delete using (public.is_admin_or_manager());

-- =====================================================
-- PARTS TABLE (from core_05_parts.sql)
-- =====================================================
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

-- Indexes
create index "parts_name_idx" on "parts" using btree ("name");
create index "parts_part_number_idx" on "parts" using btree ("part_number");
create index "parts_sku_idx" on "parts" using btree ("sku");
create index "parts_category_idx" on "parts" using btree ("category");
create index "parts_stock_quantity_idx" on "parts" using btree ("stock_quantity");
create index "parts_is_active_idx" on "parts" using btree ("is_active") where is_active = true;

-- Triggers
create trigger "parts_updated_at_trigger"
  before update on "parts"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "parts" enable row level security;
create policy "parts_select_policy" on "parts" for select using (true);
create policy "parts_insert_policy" on "parts" for insert with check (true);
create policy "parts_update_policy" on "parts" for update using (true);
create policy "parts_delete_policy" on "parts" for delete using (public.is_admin_or_manager());

-- =====================================================
-- PRODUCT_PARTS JUNCTION TABLE (from core_06_product_parts.sql)
-- =====================================================
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

-- Indexes
create index "product_parts_product_id_idx" on "product_parts" using btree ("product_id");
create index "product_parts_part_id_idx" on "product_parts" using btree ("part_id");

-- Triggers
create trigger "product_parts_updated_at_trigger"
  before update on "product_parts"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "product_parts" enable row level security;
create policy "product_parts_select_policy" on "product_parts" for select using (true);
create policy "product_parts_insert_policy" on "product_parts" for insert with check (true);
create policy "product_parts_update_policy" on "product_parts" for update using (true);
create policy "product_parts_delete_policy" on "product_parts" for delete using (true);
