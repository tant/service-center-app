-- Align service_request_items with API expectations by storing product metadata

alter table "public"."service_request_items"
  add column "product_brand" text not null default 'Unknown',
  add column "product_model" text not null default 'Unknown';

comment on column "public"."service_request_items"."product_brand" is 'Captured brand label for the requested product';
comment on column "public"."service_request_items"."product_model" is 'Captured model name for the requested product';
