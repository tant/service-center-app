-- Service Ticket Parts table - junction table for parts used in service tickets
-- Manages the many-to-many relationship between service tickets and parts

create table "service_ticket_parts" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "part_id" uuid not null references "parts"("id") on delete restrict,
  "quantity" integer not null default 1 check (quantity > 0),
  "unit_price" decimal(10,2) not null check (unit_price >= 0),
  "total_price" decimal(10,2) not null check (total_price >= 0),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  
  constraint "service_ticket_parts_pkey" primary key ("id"),
  constraint "service_ticket_parts_unique" unique ("ticket_id", "part_id")
);

-- Create indexes for better performance
create index "service_ticket_parts_ticket_id_idx" on "service_ticket_parts" using btree ("ticket_id");
create index "service_ticket_parts_part_id_idx" on "service_ticket_parts" using btree ("part_id");
create index "service_ticket_parts_created_at_idx" on "service_ticket_parts" using btree ("created_at");

-- Function to validate and calculate total_price
create or replace function service_ticket_parts_before_insert_update()
returns trigger as $$
begin
  -- Calculate total_price
  NEW.total_price := NEW.quantity * NEW.unit_price;
  
  -- Update updated_at
  NEW.updated_at := now();
  
  return NEW;
end;
$$ language plpgsql;

-- Function to update parts_total in service_tickets
create or replace function update_service_ticket_parts_total()
returns trigger as $$
declare
  ticket_uuid uuid;
  new_parts_total decimal(10,2);
begin
  -- Get the ticket_id from the affected row
  if TG_OP = 'DELETE' then
    ticket_uuid := OLD.ticket_id;
  else
    ticket_uuid := NEW.ticket_id;
  end if;
  
  -- Calculate new parts_total for the ticket
  select coalesce(sum(total_price), 0)
  into new_parts_total
  from service_ticket_parts
  where ticket_id = ticket_uuid;
  
  -- Update the service_tickets table
  update service_tickets
  set parts_total = new_parts_total,
      updated_at = now()
  where id = ticket_uuid;
  
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Triggers
create trigger "service_ticket_parts_before_insert_update_trigger"
  before insert or update on "service_ticket_parts"
  for each row
  execute function service_ticket_parts_before_insert_update();

create trigger "service_ticket_parts_after_insert_update_delete_trigger"
  after insert or update or delete on "service_ticket_parts"
  for each row
  execute function update_service_ticket_parts_total();

create trigger "service_ticket_parts_updated_at_trigger"
  before update on "service_ticket_parts"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "service_ticket_parts" enable row level security;

-- RLS policies - service ticket parts access follows service ticket permissions
create policy "service_ticket_parts_select_policy" on "service_ticket_parts"
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id
    )
  );

create policy "service_ticket_parts_insert_policy" on "service_ticket_parts"
  for insert with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id and (
        st.assigned_to = auth.uid() or
        'manager' = any((select roles from profiles where user_id = auth.uid())) or
        'admin' = any((select roles from profiles where user_id = auth.uid()))
      )
    )
  );

create policy "service_ticket_parts_update_policy" on "service_ticket_parts"
  for update using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id and (
        st.assigned_to = auth.uid() or
        'manager' = any((select roles from profiles where user_id = auth.uid())) or
        'admin' = any((select roles from profiles where user_id = auth.uid()))
      )
    )
  );

create policy "service_ticket_parts_delete_policy" on "service_ticket_parts"
  for delete using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id and (
        st.assigned_to = auth.uid() or
        'manager' = any((select roles from profiles where user_id = auth.uid())) or
        'admin' = any((select roles from profiles where user_id = auth.uid()))
      )
    )
  );