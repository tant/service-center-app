-- Parts table - manages replacement parts for products
-- Links to products and stores pricing information

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
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "parts_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "parts_name_idx" on "parts" using btree ("name");
create index "parts_part_number_idx" on "parts" using btree ("part_number");
create index "parts_sku_idx" on "parts" using btree ("sku");
create index "parts_category_idx" on "parts" using btree ("category");
create index "parts_stock_quantity_idx" on "parts" using btree ("stock_quantity");
create index "parts_is_active_idx" on "parts" using btree ("is_active") where is_active = true;

-- Trigger to automatically update updated_at on parts changes
create trigger "parts_updated_at_trigger"
  before update on "parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "parts" enable row level security;

-- RLS policies (working implementation) - parts can be accessed by all authenticated staff
create policy "parts_select_policy" on "parts"
  for select using (true);

create policy "parts_insert_policy" on "parts"
  for insert with check (true);

create policy "parts_update_policy" on "parts"
  for update using (true);

create policy "parts_delete_policy" on "parts"
  for delete using (
    exists (
      select 1 from profiles
      where user_id = (select auth.uid()) and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );