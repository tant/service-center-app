-- Product-Parts junction table - manages the many-to-many relationship between products and parts
-- Links products to their compatible parts with quantity and requirement information

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

-- Create indexes for better performance
create index "product_parts_product_id_idx" on "product_parts" using btree ("product_id");
create index "product_parts_part_id_idx" on "product_parts" using btree ("part_id");

-- Trigger to automatically update updated_at on product parts changes
create trigger "product_parts_updated_at_trigger"
  before update on "product_parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "product_parts" enable row level security;

-- RLS policies (working implementation) - product parts can be accessed by all authenticated staff
create policy "product_parts_select_policy" on "product_parts"
  for select using (true);

create policy "product_parts_insert_policy" on "product_parts"
  for insert with check (true);

create policy "product_parts_update_policy" on "product_parts"
  for update using (true);

create policy "product_parts_delete_policy" on "product_parts"
  for delete using (true);
