-- =====================================================
-- 03_service_tickets.sql
-- =====================================================
-- Core tables for the service ticket workflow, including
-- tickets, parts, comments, and attachments.
-- Merged with Phase 2 extensions.
-- =====================================================

-- =====================================================
-- SERVICE_TICKETS TABLE (from core_07_service_tickets.sql & 16_extend_service_tickets.sql)
-- =====================================================
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

  -- Phase 2 columns
  "template_id" uuid references public.task_templates(id) on delete set null,
  "request_id" uuid references public.service_requests(id) on delete set null,
  "delivery_method" public.delivery_method,
  "delivery_address" text,

  constraint "service_tickets_pkey" primary key ("id"),
  constraint "service_tickets_dates_check" check (completed_at is null or started_at is null or completed_at >= started_at),
  constraint "service_tickets_delivery_requires_address" check (delivery_method != 'delivery' or delivery_address is not null)
);

comment on column public.service_tickets.template_id is 'Task template used for workflow (Phase 2)';
comment on column public.service_tickets.request_id is 'Service request that created this ticket (Phase 2)';
comment on column public.service_tickets.delivery_method is 'Customer delivery preference: pickup or delivery (Phase 2)';
comment on column public.service_tickets.delivery_address is 'Delivery address if delivery_method = delivery (Phase 2)';

-- Indexes
create index "service_tickets_ticket_number_idx" on "service_tickets" using btree ("ticket_number");
create index "service_tickets_customer_id_idx" on "service_tickets" using btree ("customer_id");
create index "service_tickets_product_id_idx" on "service_tickets" using btree ("product_id");
create index "service_tickets_status_idx" on "service_tickets" using btree ("status");
create index "service_tickets_priority_level_idx" on "service_tickets" using btree ("priority_level");
create index "service_tickets_assigned_to_idx" on "service_tickets" using btree ("assigned_to");
create index "service_tickets_created_at_idx" on "service_tickets" using btree ("created_at");
create index "service_tickets_status_created_at_idx" on "service_tickets" using btree ("status", "created_at");
-- Phase 2 indexes
create index if not exists idx_service_tickets_template on public.service_tickets(template_id) where template_id is not null;
create index if not exists idx_service_tickets_request on public.service_tickets(request_id) where request_id is not null;
create index if not exists idx_service_tickets_delivery_method on public.service_tickets(delivery_method) where delivery_method is not null;

-- Triggers
create trigger "service_tickets_updated_at_trigger"
  before update on "service_tickets"
  for each row
  execute function update_updated_at_column();

-- Functions & Triggers for Ticket Number Generation
create or replace function public.generate_ticket_number()
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := to_char(now(), 'YYYY');
  select coalesce(max((regexp_match(ticket_number, 'SV-' || current_year || '-(\d+)'))[1]::integer), 0) + 1
  into next_number
  from public.service_tickets
  where ticket_number ~ ('SV-' || current_year || '-\d+');
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');
  return new_ticket_number;
end;
$$;

create or replace function public.set_ticket_number()
returns trigger as $$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := public.generate_ticket_number();
  end if;
  return new;
end;
$$ language plpgsql set search_path = '';

create trigger "service_tickets_set_number_trigger"
  before insert on "service_tickets"
  for each row
  execute function set_ticket_number();

-- Function & Trigger for Logging Status Changes
create or replace function public.log_status_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.service_ticket_comments (ticket_id, comment, comment_type, is_internal, created_by)
    values (new.id, 'Status changed from "' || old.status || '" to "' || new.status || '"', 'status_change', false, coalesce(new.updated_by, (select auth.uid())));
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger "service_tickets_log_status_change_trigger"
  after update on "service_tickets"
  for each row
  execute function log_status_change();

-- RLS
alter table "service_tickets" enable row level security;
create policy "service_tickets_select_policy" on "service_tickets" for select using (true);
create policy "service_tickets_insert_policy" on "service_tickets" for insert with check (true);
create policy "service_tickets_update_policy" on "service_tickets" for update using (true);
create policy "service_tickets_delete_policy" on "service_tickets" for delete using (public.is_admin_or_manager());

-- =====================================================
-- SERVICE_TICKET_PARTS TABLE (from core_08_service_ticket_parts.sql)
-- =====================================================
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

-- Indexes
create index "service_ticket_parts_ticket_id_idx" on "service_ticket_parts" using btree ("ticket_id");
create index "service_ticket_parts_part_id_idx" on "service_ticket_parts" using btree ("part_id");

-- Triggers
create trigger "service_ticket_parts_updated_at_trigger"
  before update on "service_ticket_parts"
  for each row
  execute function update_updated_at_column();

-- Function & Trigger to update parts total on service_tickets
create or replace function public.update_service_ticket_parts_total()
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
$$ language plpgsql security definer set search_path = '';

create trigger "service_ticket_parts_total_trigger"
  after insert or update or delete on "service_ticket_parts"
  for each row
  execute function update_service_ticket_parts_total();

-- RLS
alter table "service_ticket_parts" enable row level security;
create policy "service_ticket_parts_select_policy" on "service_ticket_parts" for select using (true);
create policy "service_ticket_parts_insert_policy" on "service_ticket_parts" for insert with check (true);
create policy "service_ticket_parts_update_policy" on "service_ticket_parts" for update using (true);
create policy "service_ticket_parts_delete_policy" on "service_ticket_parts" for delete using (true);

-- =====================================================
-- SERVICE_TICKET_COMMENTS TABLE (from core_09_service_ticket_comments.sql)
-- =====================================================
create table "service_ticket_comments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "comment" text not null,
  "comment_type" public.comment_type not null default 'note',
  "is_internal" boolean not null default false,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid not null references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_comments_pkey" primary key ("id")
);

-- Indexes
create index "service_ticket_comments_ticket_id_idx" on "service_ticket_comments" using btree ("ticket_id");
create index "service_ticket_comments_created_by_idx" on "service_ticket_comments" using btree ("created_by");
create index "service_ticket_comments_created_at_idx" on "service_ticket_comments" using btree ("created_at");

-- Triggers
create trigger "service_ticket_comments_updated_at_trigger"
  before update on "service_ticket_comments"
  for each row
  execute function update_updated_at_column();

-- RLS
alter table "service_ticket_comments" enable row level security;
create policy "service_ticket_comments_select_policy" on "service_ticket_comments" for select using (true);
create policy "service_ticket_comments_insert_policy" on "service_ticket_comments" for insert with check (auth.uid() = created_by);
create policy "service_ticket_comments_update_policy" on "service_ticket_comments" for update using (auth.uid() = created_by or public.is_admin_or_manager());
create policy "service_ticket_comments_delete_policy" on "service_ticket_comments" for delete using (auth.uid() = created_by or public.is_admin_or_manager());

-- View for comments with author info
create or replace view service_ticket_comments_with_author as
select
  c.id, c.ticket_id, c.comment, c.comment_type, c.is_internal, c.created_at, c.updated_at, c.created_by, c.updated_by,
  p.full_name as author_name, p.email as author_email, p.avatar_url as author_avatar
from service_ticket_comments c
left join profiles p on p.user_id = c.created_by
order by c.created_at desc;

-- =====================================================
-- SERVICE_TICKET_ATTACHMENTS TABLE (from core_10_service_ticket_attachments.sql)
-- =====================================================
create table "service_ticket_attachments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "file_name" text not null,
  "file_path" text not null,
  "file_type" text not null,
  "file_size" bigint not null,
  "description" text,
  "created_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_attachments_pkey" primary key ("id")
);

-- Indexes
create index "service_ticket_attachments_ticket_id_idx" on "service_ticket_attachments" using btree ("ticket_id");
create index "service_ticket_attachments_created_at_idx" on "service_ticket_attachments" using btree ("created_at");

-- RLS
alter table "service_ticket_attachments" enable row level security;
create policy "service_ticket_attachments_select_policy" on "service_ticket_attachments" for select using (true);
create policy "service_ticket_attachments_insert_policy" on "service_ticket_attachments" for insert with check (true);
create policy "service_ticket_attachments_update_policy" on "service_ticket_attachments" for update using (true);
create policy "service_ticket_attachments_delete_policy" on "service_ticket_attachments" for delete using (public.is_admin_or_manager());
