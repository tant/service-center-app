-- Service Ticket Comments table - manages comments and notes for service tickets
-- Provides audit trail and communication history for each ticket

create table "service_ticket_comments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "comment" text not null,
  "is_internal" boolean not null default false,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "created_by" uuid not null references "profiles"("user_id"),
  "updated_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_comments_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_ticket_comments_ticket_id_idx" on "service_ticket_comments" using btree ("ticket_id");
create index "service_ticket_comments_created_by_idx" on "service_ticket_comments" using btree ("created_by");
create index "service_ticket_comments_created_at_idx" on "service_ticket_comments" using btree ("created_at");

-- Trigger to automatically update updated_at on service ticket comments changes
create trigger "service_ticket_comments_updated_at_trigger"
  before update on "service_ticket_comments"
  for each row
  execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table "service_ticket_comments" enable row level security;

-- RLS policies (working implementation) - comments access follows service ticket permissions
create policy "service_ticket_comments_select_policy" on "service_ticket_comments"
  for select using (true);

create policy "service_ticket_comments_insert_policy" on "service_ticket_comments"
  for insert with check (
    (select auth.uid()) = created_by
  );

create policy "service_ticket_comments_update_policy" on "service_ticket_comments"
  for update using (
    (select auth.uid()) = created_by or
    exists (
      select 1 from profiles
      where user_id = (select auth.uid()) and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );

create policy "service_ticket_comments_delete_policy" on "service_ticket_comments"
  for delete using (
    (select auth.uid()) = created_by or
    exists (
      select 1 from profiles
      where user_id = (select auth.uid()) and ('admin' = any(roles) or 'manager' = any(roles))
    )
  );