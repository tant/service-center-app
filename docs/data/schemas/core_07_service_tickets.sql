-- Service tickets table - manages service requests and repairs
-- Core table for tracking service workflow from receipt to completion

create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_number" text not null unique,
  "customer_id" uuid not null references "customers"("id"),
  "product_id" uuid not null references "products"("id"),
  "issue_description" text not null,
  "status" public.ticket_status not null default 'pending',
  "priority_level" public.priority_level not null default 'normal',
  "warranty_type" public.warranty_type,
  "assigned_to" uuid references "profiles"("user_id"),
  "service_fee" decimal(10,2) not null default 0 check (service_fee >= 0),
  "diagnosis_fee" decimal(10,2) not null default 0 check (diagnosis_fee >= 0),
  "parts_total" decimal(10,2) not null default 0 check (parts_total >= 0),
  "discount_amount" decimal(10,2) not null default 0 check (discount_amount >= 0),
  "total_cost" decimal(10,2) generated always as (service_fee + diagnosis_fee + parts_total - discount_amount) stored,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "notes" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_tickets_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_tickets_ticket_number_idx" on "service_tickets" using btree ("ticket_number");
create index "service_tickets_customer_id_idx" on "service_tickets" using btree ("customer_id");
create index "service_tickets_product_id_idx" on "service_tickets" using btree ("product_id");
create index "service_tickets_status_idx" on "service_tickets" using btree ("status");
create index "service_tickets_priority_level_idx" on "service_tickets" using btree ("priority_level");
create index "service_tickets_assigned_to_idx" on "service_tickets" using btree ("assigned_to");
create index "service_tickets_created_at_idx" on "service_tickets" using btree ("created_at");

-- Trigger to automatically update updated_at on service ticket changes
create trigger "service_tickets_updated_at_trigger"
  before update on "service_tickets"
  for each row
  execute function update_updated_at_column();

-- Function to generate ticket number in SV-YYYY-NNN format
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
create or replace function generate_ticket_number()
returns text as $$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := pg_catalog.to_char(pg_catalog.now(), 'YYYY');

  -- Get the highest ticket number for current year
  select pg_catalog.coalesce(
    pg_catalog.max(
      pg_catalog.cast(
        pg_catalog.substring(ticket_number from 'SV-' || current_year || '-(\d+)') as pg_catalog.int4
      )
    ), 0
  ) + 1
  into next_number
  from public.service_tickets
  where ticket_number like 'SV-' || current_year || '-%';

  -- Format as SV-YYYY-NNN (zero-padded to 3 digits)
  new_ticket_number := 'SV-' || current_year || '-' || pg_catalog.lpad(next_number::pg_catalog.text, 3, '0');

  return new_ticket_number;
end;
$$ language plpgsql
security definer
set search_path = '';

-- Trigger to automatically generate ticket number on insert
-- Security: SET search_path = '' prevents schema hijacking
create or replace function set_ticket_number()
returns trigger as $$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := public.generate_ticket_number();
  end if;
  return new;
end;
$$ language plpgsql
set search_path = '';

create trigger "service_tickets_set_number_trigger"
  before insert on "service_tickets"
  for each row
  execute function set_ticket_number();

-- Function to log status changes as comments
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
create or replace function log_status_change()
returns trigger as $$
begin
  -- Only log if status actually changed
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.service_ticket_comments (
      ticket_id,
      comment,
      comment_type,
      is_internal,
      created_by
    ) values (
      new.id,
      'Status changed from "' || old.status || '" to "' || new.status || '"',
      'status_change',
      false,
      pg_catalog.coalesce(new.updated_by, (select auth.uid()))
    );
  end if;

  return new;
end;
$$ language plpgsql
security definer
set search_path = '';

-- Trigger to log status changes
create trigger "service_tickets_log_status_change_trigger"
  after update on "service_tickets"
  for each row
  execute function log_status_change();

-- Add composite index for common query pattern (status + date filtering)
create index "service_tickets_status_created_at_idx"
  on "service_tickets" using btree ("status", "created_at");

-- Add check constraint for completed_at > started_at
alter table "service_tickets"
  add constraint "service_tickets_dates_check"
  check (completed_at is null or started_at is null or completed_at >= started_at);

-- Enable RLS (Row Level Security)
alter table "service_tickets" enable row level security;

-- RLS policies - service tickets can be accessed by all authenticated staff
create policy "service_tickets_select_policy" on "service_tickets"
  for select using (true);

create policy "service_tickets_insert_policy" on "service_tickets"
  for insert with check (true);

create policy "service_tickets_update_policy" on "service_tickets"
  for update using (true);

create policy "service_tickets_delete_policy" on "service_tickets"
  for delete using (
    public.is_admin_or_manager()
  );