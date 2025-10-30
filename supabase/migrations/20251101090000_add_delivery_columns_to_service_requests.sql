-- Story 1.11/1.12 schema alignment: add delivery columns to service_requests
-- Ensures API insert fields (service_type, delivery_method, delivery_address) exist

alter table "public"."service_requests"
  add column "service_type" public.service_type not null default 'warranty'::public.service_type,
  add column "delivery_method" public.delivery_method not null default 'pickup'::public.delivery_method,
  add column "delivery_address" text;

alter table "public"."service_requests"
  add constraint "service_requests_delivery_requires_address"
  check (("delivery_method" <> 'delivery'::public.delivery_method) or ("delivery_address" is not null));

comment on column "public"."service_requests"."service_type" is 'Type of service requested (warranty, paid, replacement)';
comment on column "public"."service_requests"."delivery_method" is 'Preferred delivery method for handling the service request';
comment on column "public"."service_requests"."delivery_address" is 'Customer delivery address when delivery_method = delivery';
