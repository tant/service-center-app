-- Service ticket attachments table - manages images and files attached to tickets
-- Links files stored in Supabase Storage to service tickets

create table "service_ticket_attachments" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null references "service_tickets"("id") on delete cascade,
  "file_name" text not null,
  "file_path" text not null, -- Path in storage bucket
  "file_type" text not null, -- MIME type (image/jpeg, image/png, etc)
  "file_size" bigint not null, -- Size in bytes
  "description" text,
  "created_at" timestamptz not null default now(),
  "created_by" uuid references "profiles"("user_id"),

  constraint "service_ticket_attachments_pkey" primary key ("id")
);

-- Create indexes for better performance
create index "service_ticket_attachments_ticket_id_idx" on "service_ticket_attachments" using btree ("ticket_id");
create index "service_ticket_attachments_created_at_idx" on "service_ticket_attachments" using btree ("created_at");

-- Enable RLS (Row Level Security)
alter table "service_ticket_attachments" enable row level security;

-- RLS policies - attachments can be accessed by all authenticated staff
create policy "service_ticket_attachments_select_policy" on "service_ticket_attachments"
  for select using (true);

create policy "service_ticket_attachments_insert_policy" on "service_ticket_attachments"
  for insert with check (true);

create policy "service_ticket_attachments_update_policy" on "service_ticket_attachments"
  for update using (true);

create policy "service_ticket_attachments_delete_policy" on "service_ticket_attachments"
  for delete using (
    public.is_admin_or_manager()
  );
