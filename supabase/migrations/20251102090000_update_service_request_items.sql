-- Migration: enhance service_request_items for per-product service options
-- Adds service_option & warranty_requested, and relaxes brand/model constraints

alter table "public"."service_request_items"
  add column "service_option" public.service_type,
  add column "warranty_requested" boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_requests'
      and column_name = 'service_type'
  ) then
    update "public"."service_request_items" sri
    set service_option = sr.service_type
    from "public"."service_requests" sr
    where sri.request_id = sr.id
      and sri.service_option is null;
  end if;
end $$;

alter table "public"."service_request_items"
  alter column "service_option" set not null,
  alter column "service_option" set default 'warranty'::public.service_type;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_request_items'
      and column_name = 'product_brand'
  ) then
    execute 'alter table "public"."service_request_items"
      alter column "product_brand" drop default,
      alter column "product_brand" drop not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_request_items'
      and column_name = 'product_model'
  ) then
    execute 'alter table "public"."service_request_items"
      alter column "product_model" drop default,
      alter column "product_model" drop not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'service_request_items'
      and column_name = 'issue_description'
  ) then
    execute 'alter table "public"."service_request_items"
      alter column "issue_description" drop not null';
  end if;
end $$;

update "public"."service_request_items" sri
set issue_photos = coalesce(subquery.new_issue_photos, '[]'::jsonb)
from (
  select
    id,
    (
      select jsonb_agg(
        case
          when jsonb_typeof(value) = 'object' then value
          when jsonb_typeof(value) = 'string' then jsonb_build_object('path', value)
          else jsonb_build_object('path', null)
        end
      )
      from jsonb_array_elements(coalesce(issue_photos, '[]'::jsonb)) as value
    ) as new_issue_photos
  from "public"."service_request_items"
) as subquery
where sri.id = subquery.id;

alter table "public"."service_request_items"
  alter column "issue_photos" set default '[]'::jsonb;

comment on column "public"."service_request_items"."issue_photos" is 'Array of attachment metadata for the product issue (path, file info)';

comment on column "public"."service_request_items"."service_option" is 'Selected service handling option for the specific product';
comment on column "public"."service_request_items"."warranty_requested" is 'Indicates whether the customer still wants warranty handling even if ineligible';
