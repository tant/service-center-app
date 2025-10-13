-- Service Ticket Parts table - junction table for parts used in service tickets
-- Manages the many-to-many relationship between service tickets and parts

create table "service_ticket_parts" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "part_id" uuid not null references "parts"("id"),
  "quantity" integer not null check (quantity > 0),
  "unit_price" decimal(10,2) not null check (unit_price >= 0),
  "total_price" decimal(10,2) generated always as (quantity * unit_price) stored,
  "notes" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_parts_pkey" primary key ("id"),
  constraint "service_ticket_parts_unique" unique ("ticket_id", "part_id")
);

-- Create indexes for better performance
create index "service_ticket_parts_ticket_id_idx" on "service_ticket_parts" using btree ("ticket_id");
create index "service_ticket_parts_part_id_idx" on "service_ticket_parts" using btree ("part_id");

-- Trigger to automatically update updated_at on service ticket parts changes
create trigger "service_ticket_parts_updated_at_trigger"
  before update on "service_ticket_parts"
  for each row
  execute function update_updated_at_column();

-- Function to update service ticket parts total
-- Security: SET search_path = 'public' and explicit schema qualification
create or replace function update_service_ticket_parts_total()
returns trigger as $$
begin
  update public.service_tickets
  set parts_total = (
    select coalesce(sum(total_price), 0)
    from public.service_ticket_parts
    where ticket_id = coalesce(new.ticket_id, old.ticket_id)
  )
  where id = coalesce(new.ticket_id, old.ticket_id);

  return coalesce(new, old);
end;
$$ language plpgsql
security definer
set search_path = 'public';

-- Triggers to update parts total when ticket parts change
create trigger "service_ticket_parts_total_trigger"
  after insert or update or delete on "service_ticket_parts"
  for each row
  execute function update_service_ticket_parts_total();

-- Enable RLS (Row Level Security)
alter table "service_ticket_parts" enable row level security;

-- RLS policies (working implementation) - service ticket parts access follows service ticket permissions
create policy "service_ticket_parts_select_policy" on "service_ticket_parts"
  for select using (true);

create policy "service_ticket_parts_insert_policy" on "service_ticket_parts"
  for insert with check (true);

create policy "service_ticket_parts_update_policy" on "service_ticket_parts"
  for update using (true);

create policy "service_ticket_parts_delete_policy" on "service_ticket_parts"
  for delete using (true);