-- Service Ticket Comments table - manages comments and notes for service tickets
-- Provides audit trail and communication history for each ticket

create table "service_ticket_comments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "user_id" uuid not null references "profiles"("user_id") on delete restrict,
  "comment_text" text not null check (length(trim(comment_text)) > 0),
  "comment_type" text not null default 'note' check ("comment_type" in (
    'note', 'status_change', 'customer_communication', 'diagnosis', 
    'repair_progress', 'parts_added', 'quality_check', 'customer_approval'
  )),
  "is_internal" boolean not null default true,
  "created_at" timestamptz not null default now(),
  
  constraint "service_ticket_comments_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_ticket_comments_ticket_id_idx" on "service_ticket_comments" using btree ("ticket_id");
create index "service_ticket_comments_user_id_idx" on "service_ticket_comments" using btree ("user_id");
create index "service_ticket_comments_comment_type_idx" on "service_ticket_comments" using btree ("comment_type");
create index "service_ticket_comments_is_internal_idx" on "service_ticket_comments" using btree ("is_internal");
create index "service_ticket_comments_created_at_idx" on "service_ticket_comments" using btree ("created_at");
create index "service_ticket_comments_public_idx" on "service_ticket_comments" using btree ("ticket_id", "created_at") where is_internal = false;

-- Function to validate comment data
create or replace function service_ticket_comments_before_insert()
returns trigger as $$
begin
  -- Trim whitespace from comment_text
  NEW.comment_text := trim(NEW.comment_text);
  
  -- Set user_id to current user if not provided
  if NEW.user_id is null then
    NEW.user_id := auth.uid();
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Trigger for validation
create trigger "service_ticket_comments_before_insert_trigger"
  before insert on "service_ticket_comments"
  for each row
  execute function service_ticket_comments_before_insert();

-- Enable RLS (Row Level Security)
alter table "service_ticket_comments" enable row level security;

-- RLS policies - comments access follows service ticket permissions
create policy "service_ticket_comments_select_policy" on "service_ticket_comments"
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id
    )
  );

create policy "service_ticket_comments_insert_policy" on "service_ticket_comments"
  for insert with check (
    auth.role() = 'authenticated' and
    user_id = auth.uid() and
    exists (
      select 1 from service_tickets st
      where st.id = ticket_id
    )
  );

-- Comments are immutable - no update policy
-- Only admin can delete comments in exceptional cases
create policy "service_ticket_comments_delete_policy" on "service_ticket_comments"
  for delete using (
    exists (
      select 1 from profiles 
      where user_id = auth.uid() and 'admin' = any(roles)
    )
  );

-- Create a view for public comments (customer-facing)
create view "public_service_ticket_comments" as
select 
  stc.id,
  stc.ticket_id,
  stc.comment_text,
  stc.comment_type,
  stc.created_at,
  p.full_name as author_name
from service_ticket_comments stc
join profiles p on stc.user_id = p.user_id
where stc.is_internal = false;

-- Enable RLS on the view
alter view "public_service_ticket_comments" set (security_barrier = true);

-- Create a view for full comment history with author details
create view "service_ticket_comments_with_author" as
select 
  stc.id,
  stc.ticket_id,
  stc.user_id,
  stc.comment_text,
  stc.comment_type,
  stc.is_internal,
  stc.created_at,
  p.full_name as author_name,
  p.avatar_url as author_avatar
from service_ticket_comments stc
join profiles p on stc.user_id = p.user_id;

-- Enable RLS on the view (security barrier for views)
alter view "service_ticket_comments_with_author" set (security_barrier = true);

-- Note: RLS policies cannot be created on views directly
-- Security is handled through the underlying table policies