-- Migration: extend service_requests with delivery metadata and drop legacy service_type

alter table "public"."service_requests"
  drop constraint if exists "service_requests_delivery_requires_address";

alter table "public"."service_requests"
  add column if not exists "preferred_schedule" date,
  add column if not exists "pickup_notes" text,
  add column if not exists "contact_notes" text,
  add column if not exists "preferred_delivery_method" public.delivery_method default 'pickup'::public.delivery_method;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_requests'
      and column_name = 'delivery_method'
  ) then
    update "public"."service_requests"
    set preferred_delivery_method = delivery_method
    where preferred_delivery_method is null;
  end if;
end $$;

alter table "public"."service_requests"
  alter column "preferred_delivery_method" set not null,
  drop column if exists "delivery_method",
  drop column if exists "service_type";

alter table "public"."service_requests"
  add constraint "service_requests_delivery_requires_address"
  check ((preferred_delivery_method <> 'delivery'::public.delivery_method) or (delivery_address is not null));
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_requests'
      and column_name = 'issue_description'
  ) then
    alter table "public"."service_requests"
      alter column "issue_description" drop not null;
  end if;
end $$;

comment on column "public"."service_requests"."preferred_schedule" is 'Requested date for pickup/delivery if applicable';
comment on column "public"."service_requests"."pickup_notes" is 'Additional notes when customer drops off the product';
comment on column "public"."service_requests"."contact_notes" is 'Preferred channel or extra contact information';
