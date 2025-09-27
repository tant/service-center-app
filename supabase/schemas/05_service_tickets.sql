-- Service tickets table - manages service requests and repairs
-- Core table for tracking service workflow from receipt to completion

create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_number" text not null unique,
  "customer_id" uuid not null references "customers"("id") on delete restrict,
  "product_id" uuid not null references "products"("id") on delete restrict,
  "issue_description" text not null,
  "status" text not null default 'pending' check ("status" in ('pending', 'in_progress', 'completed', 'cancelled')),
  "priority_level" text not null default 'normal' check ("priority_level" in ('low', 'normal', 'high', 'urgent')),
  "warranty_type" text check ("warranty_type" in ('warranty', 'paid', 'goodwill')),
  "service_fee" decimal(10,2) not null default 0 check (service_fee >= 0),
  "diagnosis_fee" decimal(10,2) not null default 0 check (diagnosis_fee >= 0),
  "discount_amount" decimal(10,2) not null default 0 check (discount_amount >= 0),
  "parts_total" decimal(10,2) not null default 0 check (parts_total >= 0),
  "total_cost" decimal(10,2) not null default 0 check (total_cost >= 0),
  "received_at" timestamptz not null default now(),
  "estimated_completion" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),
  "assigned_to" uuid references "profiles"("user_id"),
  
  constraint "service_tickets_pkey" primary key ("id"),
  constraint "service_tickets_completion_check" check (
    (status != 'completed') or (completed_at is not null)
  ),
  constraint "service_tickets_estimated_completion_check" check (
    estimated_completion is null or estimated_completion >= received_at
  )
);

-- Create indexes for better performance
create index "service_tickets_ticket_number_idx" on "service_tickets" using btree ("ticket_number");
create index "service_tickets_customer_id_idx" on "service_tickets" using btree ("customer_id");
create index "service_tickets_product_id_idx" on "service_tickets" using btree ("product_id");
create index "service_tickets_status_idx" on "service_tickets" using btree ("status");
create index "service_tickets_priority_level_idx" on "service_tickets" using btree ("priority_level");
create index "service_tickets_assigned_to_idx" on "service_tickets" using btree ("assigned_to") where assigned_to is not null;
create index "service_tickets_created_by_idx" on "service_tickets" using btree ("created_by") where created_by is not null;
create index "service_tickets_received_at_idx" on "service_tickets" using btree ("received_at");
create index "service_tickets_status_open_idx" on "service_tickets" using btree ("status") where status in ('pending', 'in_progress');

-- Function to generate unique ticket number
create or replace function generate_ticket_number()
returns text as $$
declare
  year_part text := to_char(now(), 'YYYY');
  sequence_num int;
  ticket_num text;
begin
  -- Get the next sequence number for this year
  select coalesce(max(
    cast(
      substring(ticket_number from 'SV-' || year_part || '-(\d+)') as int
    )
  ), 0) + 1
  into sequence_num
  from service_tickets
  where ticket_number ~ ('^SV-' || year_part || '-\d+$');
  
  -- Format as SV-YYYY-NNN
  ticket_num := 'SV-' || year_part || '-' || lpad(sequence_num::text, 3, '0');
  
  return ticket_num;
end;
$$ language plpgsql;

-- Function to calculate total cost
create or replace function calculate_total_cost(
  parts_total_val decimal(10,2),
  service_fee_val decimal(10,2),
  diagnosis_fee_val decimal(10,2),
  discount_amount_val decimal(10,2)
)
returns decimal(10,2) as $$
begin
  return parts_total_val + service_fee_val + diagnosis_fee_val - discount_amount_val;
end;
$$ language plpgsql immutable;

-- Function to automatically set ticket_number and total_cost
create or replace function service_tickets_before_insert_update()
returns trigger as $$
begin
  -- Generate ticket number on insert if not provided
  if TG_OP = 'INSERT' and (NEW.ticket_number is null or NEW.ticket_number = '') then
    NEW.ticket_number := generate_ticket_number();
  end if;
  
  -- Calculate total_cost
  NEW.total_cost := calculate_total_cost(
    NEW.parts_total,
    NEW.service_fee,
    NEW.diagnosis_fee,
    NEW.discount_amount
  );
  
  -- Set completed_at when status changes to completed
  if NEW.status = 'completed' and (OLD is null or OLD.status != 'completed') then
    NEW.completed_at := now();
  end if;
  
  -- Clear completed_at if status changes from completed
  if NEW.status != 'completed' and OLD is not null and OLD.status = 'completed' then
    NEW.completed_at := null;
  end if;
  
  -- Update updated_at
  NEW.updated_at := now();
  
  return NEW;
end;
$$ language plpgsql;

-- Function to log status changes
create or replace function log_status_change()
returns trigger as $$
begin
  -- Only trigger on status changes
  if OLD.status != NEW.status then
    insert into service_ticket_comments (
      ticket_id,
      user_id,
      comment_text,
      comment_type,
      is_internal
    ) values (
      NEW.id,
      coalesce(NEW.updated_by, auth.uid()),
      format('Trạng thái đã thay đổi từ ''%s'' sang ''%s''', OLD.status, NEW.status),
      'status_change',
      true
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Triggers
create trigger "service_tickets_before_insert_update_trigger"
  before insert or update on "service_tickets"
  for each row
  execute function service_tickets_before_insert_update();

create trigger "service_tickets_status_change_trigger"
  after update on "service_tickets"
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function log_status_change();

-- Enable RLS (Row Level Security)
alter table "service_tickets" enable row level security;

-- RLS policies - service tickets can be accessed by all authenticated staff
create policy "service_tickets_select_policy" on "service_tickets"
  for select using (auth.role() = 'authenticated');

create policy "service_tickets_insert_policy" on "service_tickets"
  for insert with check (auth.role() = 'authenticated');

create policy "service_tickets_update_policy" on "service_tickets"
  for update using (
    auth.role() = 'authenticated' and (
      -- Technicians can only update tickets assigned to them
      assigned_to = auth.uid() or
      -- Managers and admins can update any ticket
      exists (
        select 1 from profiles 
        where user_id = auth.uid() and ('manager' = any(roles) or 'admin' = any(roles))
      )
    )
  );

create policy "service_tickets_delete_policy" on "service_tickets"
  for delete using (
    exists (
      select 1 from profiles 
      where user_id = auth.uid() and 'admin' = any(roles)
    )
  );