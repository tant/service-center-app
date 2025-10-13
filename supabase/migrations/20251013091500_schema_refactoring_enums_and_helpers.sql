-- Create enum types
create type "public"."comment_type" as enum ('note', 'status_change', 'assignment', 'system');

create type "public"."priority_level" as enum ('low', 'normal', 'high', 'urgent');

create type "public"."ticket_status" as enum ('pending', 'in_progress', 'completed', 'cancelled');

create type "public"."user_role" as enum ('admin', 'manager', 'technician', 'reception');

create type "public"."warranty_type" as enum ('warranty', 'paid', 'goodwill');

-- Create domain types
create domain "public"."email_address" as text
  check (value ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

create domain "public"."optional_email_address" as text
  check (value is null or value = '' or value ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

create domain "public"."phone_number" as text
  check (value ~ '^\d{10,11}$' and value like '0%');

drop policy "customers_delete_policy" on "public"."customers";

drop policy "parts_delete_policy" on "public"."parts";

drop policy "products_delete_policy" on "public"."products";

drop policy "profiles_delete_policy" on "public"."profiles";

drop policy "profiles_insert_policy" on "public"."profiles";

drop policy "profiles_update_policy" on "public"."profiles";

drop policy "service_ticket_attachments_delete_policy" on "public"."service_ticket_attachments";

drop policy "service_ticket_comments_delete_policy" on "public"."service_ticket_comments";

drop policy "service_ticket_comments_insert_policy" on "public"."service_ticket_comments";

drop policy "service_ticket_comments_update_policy" on "public"."service_ticket_comments";

drop policy "service_tickets_delete_policy" on "public"."service_tickets";

alter table "public"."customers" drop constraint "customers_email_check";

alter table "public"."customers" drop constraint "customers_phone_check";

alter table "public"."profiles" drop constraint "profiles_email_check";

alter table "public"."profiles" drop constraint "profiles_roles_check";

alter table "public"."service_ticket_comments" drop constraint "service_ticket_comments_comment_type_check";

alter table "public"."service_tickets" drop constraint "service_tickets_priority_level_check";

alter table "public"."service_tickets" drop constraint "service_tickets_status_check";

alter table "public"."service_tickets" drop constraint "service_tickets_warranty_type_check";

drop view if exists "public"."service_ticket_comments_with_author";

alter table "public"."customers" alter column "email" set data type optional_email_address using "email"::optional_email_address;

alter table "public"."customers" alter column "phone" set data type phone_number using "phone"::phone_number;

alter table "public"."profiles" alter column "email" set data type email_address using "email"::email_address;

alter table "public"."profiles" alter column "roles" set default ARRAY[]::user_role[];

alter table "public"."profiles" alter column "roles" set data type user_role[] using "roles"::user_role[];

alter table "public"."service_ticket_comments" alter column "comment_type" set default 'note'::comment_type;

alter table "public"."service_ticket_comments" alter column "comment_type" set data type comment_type using "comment_type"::comment_type;

alter table "public"."service_tickets" alter column "priority_level" set default 'normal'::priority_level;

alter table "public"."service_tickets" alter column "priority_level" set data type priority_level using "priority_level"::priority_level;

alter table "public"."service_tickets" alter column "status" set default 'pending'::ticket_status;

alter table "public"."service_tickets" alter column "status" set data type ticket_status using "status"::ticket_status;

alter table "public"."service_tickets" alter column "warranty_type" set data type warranty_type using "warranty_type"::warranty_type;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and 'admin' = any(roles)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and ('admin' = any(roles) or 'manager' = any(roles))
  );
end;
$function$
;

create or replace view "public"."service_ticket_comments_with_author" as  SELECT c.id,
    c.ticket_id,
    c.comment,
    c.comment_type,
    c.is_internal,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.updated_by,
    p.full_name AS author_name,
    p.email AS author_email,
    p.avatar_url AS author_avatar
   FROM (service_ticket_comments c
     LEFT JOIN profiles p ON ((p.user_id = c.created_by)))
  ORDER BY c.created_at DESC;


create policy "customers_delete_policy"
on "public"."customers"
as permissive
for delete
to public
using (is_admin_or_manager());


create policy "parts_delete_policy"
on "public"."parts"
as permissive
for delete
to public
using (is_admin_or_manager());


create policy "products_delete_policy"
on "public"."products"
as permissive
for delete
to public
using (is_admin_or_manager());


create policy "profiles_delete_policy"
on "public"."profiles"
as permissive
for delete
to public
using (is_admin());


create policy "profiles_insert_policy"
on "public"."profiles"
as permissive
for insert
to public
with check (((auth.uid() = user_id) OR is_admin()));


create policy "profiles_update_policy"
on "public"."profiles"
as permissive
for update
to public
using (((auth.uid() = user_id) OR is_admin()));


create policy "service_ticket_attachments_delete_policy"
on "public"."service_ticket_attachments"
as permissive
for delete
to public
using (is_admin_or_manager());


create policy "service_ticket_comments_delete_policy"
on "public"."service_ticket_comments"
as permissive
for delete
to public
using (((auth.uid() = created_by) OR is_admin_or_manager()));


create policy "service_ticket_comments_insert_policy"
on "public"."service_ticket_comments"
as permissive
for insert
to public
with check ((auth.uid() = created_by));


create policy "service_ticket_comments_update_policy"
on "public"."service_ticket_comments"
as permissive
for update
to public
using (((auth.uid() = created_by) OR is_admin_or_manager()));


create policy "service_tickets_delete_policy"
on "public"."service_tickets"
as permissive
for delete
to public
using (is_admin_or_manager());



