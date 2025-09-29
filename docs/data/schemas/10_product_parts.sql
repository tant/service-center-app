-- Junction table between products and parts (N:N)
-- Keeps mapping of which parts are associated with which products.

create table "product_parts" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid not null references "products"("id") on delete cascade,
  "part_id" uuid not null references "parts"("id") on delete restrict,
  "created_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  constraint "product_parts_pkey" primary key ("id"),
  constraint "product_parts_unique" unique ("product_id", "part_id")
);

-- Indexes for common lookup patterns
create index "product_parts_product_part_idx" on "product_parts" using btree ("product_id", "part_id");
create index "product_parts_part_product_idx" on "product_parts" using btree ("part_id", "product_id");

-- Trigger to maintain updated_at on related tables if needed (optional)
-- (left out to keep junction table minimal as requested)

-- Enable RLS
alter table "product_parts" enable row level security;

create policy "product_parts_select_policy" on "product_parts"
  for select using (auth.role() = 'authenticated');

create policy "product_parts_insert_policy" on "product_parts"
  for insert with check (auth.role() = 'authenticated');

create policy "product_parts_delete_policy" on "product_parts"
  for delete using (
    exists (
      select 1 from profiles p where p.user_id = auth.uid() and ('manager' = any(p.roles) or 'admin' = any(p.roles))
    )
  );
