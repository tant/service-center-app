create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text not null,
    "email" text,
    "address" text,
    "notes" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."customers" enable row level security;

create table "public"."parts" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "part_number" text,
    "sku" text,
    "description" text,
    "category" text,
    "price" numeric(10,2) not null,
    "cost_price" numeric(10,2),
    "stock_quantity" integer not null default 0,
    "min_stock_level" integer default 0,
    "supplier" text,
    "image_url" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."parts" enable row level security;

create table "public"."product_parts" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "part_id" uuid not null,
    "quantity_per_unit" integer not null default 1,
    "is_required" boolean not null default false,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."product_parts" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "type" text not null,
    "brand" text,
    "model" text,
    "sku" text,
    "short_description" text,
    "primary_image" text,
    "warranty_period_months" integer,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."products" enable row level security;

create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "full_name" text not null,
    "avatar_url" text,
    "email" text not null,
    "roles" text[] not null default ARRAY[]::text[],
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."profiles" enable row level security;

create table "public"."service_ticket_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "file_name" text not null,
    "file_path" text not null,
    "file_type" text not null,
    "file_size" bigint not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid
);


alter table "public"."service_ticket_attachments" enable row level security;

create table "public"."service_ticket_comments" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "comment" text not null,
    "comment_type" text not null default 'note'::text,
    "is_internal" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "updated_by" uuid
);


alter table "public"."service_ticket_comments" enable row level security;

create table "public"."service_ticket_parts" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "part_id" uuid not null,
    "quantity" integer not null,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) generated always as (((quantity)::numeric * unit_price)) stored,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."service_ticket_parts" enable row level security;

create table "public"."service_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_number" text not null,
    "customer_id" uuid not null,
    "product_id" uuid not null,
    "issue_description" text not null,
    "status" text not null default 'pending'::text,
    "priority_level" text not null default 'normal'::text,
    "warranty_type" text,
    "assigned_to" uuid,
    "service_fee" numeric(10,2) not null default 0,
    "diagnosis_fee" numeric(10,2) not null default 0,
    "parts_total" numeric(10,2) not null default 0,
    "discount_amount" numeric(10,2) not null default 0,
    "total_cost" numeric(10,2) generated always as ((((service_fee + diagnosis_fee) + parts_total) - discount_amount)) stored,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."service_tickets" enable row level security;

CREATE INDEX customers_email_idx ON public.customers USING btree (email);

CREATE INDEX customers_is_active_idx ON public.customers USING btree (is_active) WHERE (is_active = true);

CREATE INDEX customers_name_idx ON public.customers USING btree (name);

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE INDEX parts_category_idx ON public.parts USING btree (category);

CREATE INDEX parts_is_active_idx ON public.parts USING btree (is_active) WHERE (is_active = true);

CREATE INDEX parts_name_idx ON public.parts USING btree (name);

CREATE INDEX parts_part_number_idx ON public.parts USING btree (part_number);

CREATE UNIQUE INDEX parts_pkey ON public.parts USING btree (id);

CREATE INDEX parts_sku_idx ON public.parts USING btree (sku);

CREATE INDEX parts_stock_quantity_idx ON public.parts USING btree (stock_quantity);

CREATE INDEX product_parts_part_id_idx ON public.product_parts USING btree (part_id);

CREATE UNIQUE INDEX product_parts_pkey ON public.product_parts USING btree (id);

CREATE INDEX product_parts_product_id_idx ON public.product_parts USING btree (product_id);

CREATE UNIQUE INDEX product_parts_unique ON public.product_parts USING btree (product_id, part_id);

CREATE INDEX products_brand_idx ON public.products USING btree (brand);

CREATE INDEX products_is_active_idx ON public.products USING btree (is_active) WHERE (is_active = true);

CREATE INDEX products_model_idx ON public.products USING btree (model);

CREATE INDEX products_name_idx ON public.products USING btree (name);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE INDEX products_sku_idx ON public.products USING btree (sku);

CREATE INDEX products_type_idx ON public.products USING btree (type);

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);

CREATE INDEX profiles_is_active_idx ON public.profiles USING btree (is_active) WHERE (is_active = true);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_roles_idx ON public.profiles USING gin (roles);

CREATE INDEX profiles_user_id_idx ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);

CREATE INDEX service_ticket_attachments_created_at_idx ON public.service_ticket_attachments USING btree (created_at);

CREATE UNIQUE INDEX service_ticket_attachments_pkey ON public.service_ticket_attachments USING btree (id);

CREATE INDEX service_ticket_attachments_ticket_id_idx ON public.service_ticket_attachments USING btree (ticket_id);

CREATE INDEX service_ticket_comments_created_at_idx ON public.service_ticket_comments USING btree (created_at);

CREATE INDEX service_ticket_comments_created_by_idx ON public.service_ticket_comments USING btree (created_by);

CREATE UNIQUE INDEX service_ticket_comments_pkey ON public.service_ticket_comments USING btree (id);

CREATE INDEX service_ticket_comments_ticket_id_idx ON public.service_ticket_comments USING btree (ticket_id);

CREATE INDEX service_ticket_parts_part_id_idx ON public.service_ticket_parts USING btree (part_id);

CREATE UNIQUE INDEX service_ticket_parts_pkey ON public.service_ticket_parts USING btree (id);

CREATE INDEX service_ticket_parts_ticket_id_idx ON public.service_ticket_parts USING btree (ticket_id);

CREATE UNIQUE INDEX service_ticket_parts_unique ON public.service_ticket_parts USING btree (ticket_id, part_id);

CREATE INDEX service_tickets_assigned_to_idx ON public.service_tickets USING btree (assigned_to);

CREATE INDEX service_tickets_created_at_idx ON public.service_tickets USING btree (created_at);

CREATE INDEX service_tickets_customer_id_idx ON public.service_tickets USING btree (customer_id);

CREATE UNIQUE INDEX service_tickets_pkey ON public.service_tickets USING btree (id);

CREATE INDEX service_tickets_priority_level_idx ON public.service_tickets USING btree (priority_level);

CREATE INDEX service_tickets_product_id_idx ON public.service_tickets USING btree (product_id);

CREATE INDEX service_tickets_status_created_at_idx ON public.service_tickets USING btree (status, created_at);

CREATE INDEX service_tickets_status_idx ON public.service_tickets USING btree (status);

CREATE INDEX service_tickets_ticket_number_idx ON public.service_tickets USING btree (ticket_number);

CREATE UNIQUE INDEX service_tickets_ticket_number_key ON public.service_tickets USING btree (ticket_number);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."parts" add constraint "parts_pkey" PRIMARY KEY using index "parts_pkey";

alter table "public"."product_parts" add constraint "product_parts_pkey" PRIMARY KEY using index "product_parts_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_pkey" PRIMARY KEY using index "service_ticket_attachments_pkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_pkey" PRIMARY KEY using index "service_ticket_comments_pkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_pkey" PRIMARY KEY using index "service_ticket_parts_pkey";

alter table "public"."service_tickets" add constraint "service_tickets_pkey" PRIMARY KEY using index "service_tickets_pkey";

alter table "public"."customers" add constraint "customers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."customers" validate constraint "customers_created_by_fkey";

alter table "public"."customers" add constraint "customers_email_check" CHECK (((email = ''::text) OR (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::text))) not valid;

alter table "public"."customers" validate constraint "customers_email_check";

alter table "public"."customers" add constraint "customers_phone_check" CHECK (((phone ~ '^[0-9+\-\s()]+'::text) AND (length(phone) >= 10))) not valid;

alter table "public"."customers" validate constraint "customers_phone_check";

alter table "public"."customers" add constraint "customers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."customers" validate constraint "customers_updated_by_fkey";

alter table "public"."parts" add constraint "parts_cost_price_check" CHECK ((cost_price >= (0)::numeric)) not valid;

alter table "public"."parts" validate constraint "parts_cost_price_check";

alter table "public"."parts" add constraint "parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_created_by_fkey";

alter table "public"."parts" add constraint "parts_min_stock_level_check" CHECK ((min_stock_level >= 0)) not valid;

alter table "public"."parts" validate constraint "parts_min_stock_level_check";

alter table "public"."parts" add constraint "parts_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."parts" validate constraint "parts_price_check";

alter table "public"."parts" add constraint "parts_stock_quantity_check" CHECK ((stock_quantity >= 0)) not valid;

alter table "public"."parts" validate constraint "parts_stock_quantity_check";

alter table "public"."parts" add constraint "parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_updated_by_fkey";

alter table "public"."product_parts" add constraint "product_parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."product_parts" validate constraint "product_parts_created_by_fkey";

alter table "public"."product_parts" add constraint "product_parts_part_id_fkey" FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE not valid;

alter table "public"."product_parts" validate constraint "product_parts_part_id_fkey";

alter table "public"."product_parts" add constraint "product_parts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."product_parts" validate constraint "product_parts_product_id_fkey";

alter table "public"."product_parts" add constraint "product_parts_quantity_per_unit_check" CHECK ((quantity_per_unit > 0)) not valid;

alter table "public"."product_parts" validate constraint "product_parts_quantity_per_unit_check";

alter table "public"."product_parts" add constraint "product_parts_unique" UNIQUE using index "product_parts_unique";

alter table "public"."product_parts" add constraint "product_parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."product_parts" validate constraint "product_parts_updated_by_fkey";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."products" add constraint "products_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_updated_by_fkey";

alter table "public"."products" add constraint "products_warranty_period_months_check" CHECK ((warranty_period_months >= 0)) not valid;

alter table "public"."products" validate constraint "products_warranty_period_months_check";

alter table "public"."profiles" add constraint "profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_email_check" CHECK ((email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_email_check";

alter table "public"."profiles" add constraint "profiles_roles_check" CHECK ((roles <@ ARRAY['admin'::text, 'manager'::text, 'technician'::text, 'reception'::text])) not valid;

alter table "public"."profiles" validate constraint "profiles_roles_check";

alter table "public"."profiles" add constraint "profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_updated_by_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_key" UNIQUE using index "profiles_user_id_key";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_attachments" validate constraint "service_ticket_attachments_created_by_fkey";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_attachments" validate constraint "service_ticket_attachments_ticket_id_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_comment_type_check" CHECK ((comment_type = ANY (ARRAY['note'::text, 'status_change'::text, 'assignment'::text, 'system'::text]))) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_comment_type_check";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_created_by_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_ticket_id_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_updated_by_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_created_by_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_part_id_fkey" FOREIGN KEY (part_id) REFERENCES parts(id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_part_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_quantity_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_ticket_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unique" UNIQUE using index "service_ticket_parts_unique";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_unit_price_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_updated_by_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_assigned_to_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_created_by_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_customer_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_dates_check" CHECK (((completed_at IS NULL) OR (started_at IS NULL) OR (completed_at >= started_at))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_dates_check";

alter table "public"."service_tickets" add constraint "service_tickets_diagnosis_fee_check" CHECK ((diagnosis_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_diagnosis_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_discount_amount_check" CHECK ((discount_amount >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_discount_amount_check";

alter table "public"."service_tickets" add constraint "service_tickets_parts_total_check" CHECK ((parts_total >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_parts_total_check";

alter table "public"."service_tickets" add constraint "service_tickets_priority_level_check" CHECK ((priority_level = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_priority_level_check";

alter table "public"."service_tickets" add constraint "service_tickets_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_product_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_service_fee_check" CHECK ((service_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_service_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_status_check";

alter table "public"."service_tickets" add constraint "service_tickets_ticket_number_key" UNIQUE using index "service_tickets_ticket_number_key";

alter table "public"."service_tickets" add constraint "service_tickets_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_updated_by_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_warranty_type_check" CHECK ((warranty_type = ANY (ARRAY['warranty'::text, 'paid'::text, 'goodwill'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_warranty_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrease_part_stock(part_id uuid, quantity_to_decrease integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stock quantity with atomic check
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - quantity_to_decrease,
    updated_at = NOW()
  WHERE
    id = part_id
    AND stock_quantity >= quantity_to_decrease;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      part_id,
      COALESCE((SELECT stock_quantity FROM public.parts WHERE id = part_id), 0),
      quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := to_char(now(), 'YYYY');

  -- Get the highest ticket number for current year
  select coalesce(
    max(
      cast(
        substring(ticket_number from 'SV-' || current_year || '-(\d+)') as integer
      )
    ), 0
  ) + 1
  into next_number
  from public.service_tickets
  where ticket_number like 'SV-' || current_year || '-%';

  -- Format as SV-YYYY-NNN (zero-padded to 3 digits)
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');

  return new_ticket_number;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increase_part_stock(part_id uuid, quantity_to_increase integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stock quantity
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + quantity_to_increase,
    updated_at = NOW()
  WHERE id = part_id;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', part_id;
  END IF;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Only log if status actually changed
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.service_ticket_comments (
      ticket_id,
      comment,
      comment_type,
      is_internal,
      created_by
    ) values (
      new.id,
      'Status changed from "' || old.status || '" to "' || new.status || '"',
      'status_change',
      false,
      coalesce(new.updated_by, (select auth.uid()))
    );
  end if;

  return new;
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


CREATE OR REPLACE FUNCTION public.set_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := generate_ticket_number();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_service_ticket_parts_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."parts" to "anon";

grant insert on table "public"."parts" to "anon";

grant references on table "public"."parts" to "anon";

grant select on table "public"."parts" to "anon";

grant trigger on table "public"."parts" to "anon";

grant truncate on table "public"."parts" to "anon";

grant update on table "public"."parts" to "anon";

grant delete on table "public"."parts" to "authenticated";

grant insert on table "public"."parts" to "authenticated";

grant references on table "public"."parts" to "authenticated";

grant select on table "public"."parts" to "authenticated";

grant trigger on table "public"."parts" to "authenticated";

grant truncate on table "public"."parts" to "authenticated";

grant update on table "public"."parts" to "authenticated";

grant delete on table "public"."parts" to "service_role";

grant insert on table "public"."parts" to "service_role";

grant references on table "public"."parts" to "service_role";

grant select on table "public"."parts" to "service_role";

grant trigger on table "public"."parts" to "service_role";

grant truncate on table "public"."parts" to "service_role";

grant update on table "public"."parts" to "service_role";

grant delete on table "public"."product_parts" to "anon";

grant insert on table "public"."product_parts" to "anon";

grant references on table "public"."product_parts" to "anon";

grant select on table "public"."product_parts" to "anon";

grant trigger on table "public"."product_parts" to "anon";

grant truncate on table "public"."product_parts" to "anon";

grant update on table "public"."product_parts" to "anon";

grant delete on table "public"."product_parts" to "authenticated";

grant insert on table "public"."product_parts" to "authenticated";

grant references on table "public"."product_parts" to "authenticated";

grant select on table "public"."product_parts" to "authenticated";

grant trigger on table "public"."product_parts" to "authenticated";

grant truncate on table "public"."product_parts" to "authenticated";

grant update on table "public"."product_parts" to "authenticated";

grant delete on table "public"."product_parts" to "service_role";

grant insert on table "public"."product_parts" to "service_role";

grant references on table "public"."product_parts" to "service_role";

grant select on table "public"."product_parts" to "service_role";

grant trigger on table "public"."product_parts" to "service_role";

grant truncate on table "public"."product_parts" to "service_role";

grant update on table "public"."product_parts" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."service_ticket_attachments" to "anon";

grant insert on table "public"."service_ticket_attachments" to "anon";

grant references on table "public"."service_ticket_attachments" to "anon";

grant select on table "public"."service_ticket_attachments" to "anon";

grant trigger on table "public"."service_ticket_attachments" to "anon";

grant truncate on table "public"."service_ticket_attachments" to "anon";

grant update on table "public"."service_ticket_attachments" to "anon";

grant delete on table "public"."service_ticket_attachments" to "authenticated";

grant insert on table "public"."service_ticket_attachments" to "authenticated";

grant references on table "public"."service_ticket_attachments" to "authenticated";

grant select on table "public"."service_ticket_attachments" to "authenticated";

grant trigger on table "public"."service_ticket_attachments" to "authenticated";

grant truncate on table "public"."service_ticket_attachments" to "authenticated";

grant update on table "public"."service_ticket_attachments" to "authenticated";

grant delete on table "public"."service_ticket_attachments" to "service_role";

grant insert on table "public"."service_ticket_attachments" to "service_role";

grant references on table "public"."service_ticket_attachments" to "service_role";

grant select on table "public"."service_ticket_attachments" to "service_role";

grant trigger on table "public"."service_ticket_attachments" to "service_role";

grant truncate on table "public"."service_ticket_attachments" to "service_role";

grant update on table "public"."service_ticket_attachments" to "service_role";

grant delete on table "public"."service_ticket_comments" to "anon";

grant insert on table "public"."service_ticket_comments" to "anon";

grant references on table "public"."service_ticket_comments" to "anon";

grant select on table "public"."service_ticket_comments" to "anon";

grant trigger on table "public"."service_ticket_comments" to "anon";

grant truncate on table "public"."service_ticket_comments" to "anon";

grant update on table "public"."service_ticket_comments" to "anon";

grant delete on table "public"."service_ticket_comments" to "authenticated";

grant insert on table "public"."service_ticket_comments" to "authenticated";

grant references on table "public"."service_ticket_comments" to "authenticated";

grant select on table "public"."service_ticket_comments" to "authenticated";

grant trigger on table "public"."service_ticket_comments" to "authenticated";

grant truncate on table "public"."service_ticket_comments" to "authenticated";

grant update on table "public"."service_ticket_comments" to "authenticated";

grant delete on table "public"."service_ticket_comments" to "service_role";

grant insert on table "public"."service_ticket_comments" to "service_role";

grant references on table "public"."service_ticket_comments" to "service_role";

grant select on table "public"."service_ticket_comments" to "service_role";

grant trigger on table "public"."service_ticket_comments" to "service_role";

grant truncate on table "public"."service_ticket_comments" to "service_role";

grant update on table "public"."service_ticket_comments" to "service_role";

grant delete on table "public"."service_ticket_parts" to "anon";

grant insert on table "public"."service_ticket_parts" to "anon";

grant references on table "public"."service_ticket_parts" to "anon";

grant select on table "public"."service_ticket_parts" to "anon";

grant trigger on table "public"."service_ticket_parts" to "anon";

grant truncate on table "public"."service_ticket_parts" to "anon";

grant update on table "public"."service_ticket_parts" to "anon";

grant delete on table "public"."service_ticket_parts" to "authenticated";

grant insert on table "public"."service_ticket_parts" to "authenticated";

grant references on table "public"."service_ticket_parts" to "authenticated";

grant select on table "public"."service_ticket_parts" to "authenticated";

grant trigger on table "public"."service_ticket_parts" to "authenticated";

grant truncate on table "public"."service_ticket_parts" to "authenticated";

grant update on table "public"."service_ticket_parts" to "authenticated";

grant delete on table "public"."service_ticket_parts" to "service_role";

grant insert on table "public"."service_ticket_parts" to "service_role";

grant references on table "public"."service_ticket_parts" to "service_role";

grant select on table "public"."service_ticket_parts" to "service_role";

grant trigger on table "public"."service_ticket_parts" to "service_role";

grant truncate on table "public"."service_ticket_parts" to "service_role";

grant update on table "public"."service_ticket_parts" to "service_role";

grant delete on table "public"."service_tickets" to "anon";

grant insert on table "public"."service_tickets" to "anon";

grant references on table "public"."service_tickets" to "anon";

grant select on table "public"."service_tickets" to "anon";

grant trigger on table "public"."service_tickets" to "anon";

grant truncate on table "public"."service_tickets" to "anon";

grant update on table "public"."service_tickets" to "anon";

grant delete on table "public"."service_tickets" to "authenticated";

grant insert on table "public"."service_tickets" to "authenticated";

grant references on table "public"."service_tickets" to "authenticated";

grant select on table "public"."service_tickets" to "authenticated";

grant trigger on table "public"."service_tickets" to "authenticated";

grant truncate on table "public"."service_tickets" to "authenticated";

grant update on table "public"."service_tickets" to "authenticated";

grant delete on table "public"."service_tickets" to "service_role";

grant insert on table "public"."service_tickets" to "service_role";

grant references on table "public"."service_tickets" to "service_role";

grant select on table "public"."service_tickets" to "service_role";

grant trigger on table "public"."service_tickets" to "service_role";

grant truncate on table "public"."service_tickets" to "service_role";

grant update on table "public"."service_tickets" to "service_role";

create policy "customers_delete_policy"
on "public"."customers"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "customers_insert_policy"
on "public"."customers"
as permissive
for insert
to public
with check (true);


create policy "customers_select_policy"
on "public"."customers"
as permissive
for select
to public
using (true);


create policy "customers_update_policy"
on "public"."customers"
as permissive
for update
to public
using (true);


create policy "parts_delete_policy"
on "public"."parts"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "parts_insert_policy"
on "public"."parts"
as permissive
for insert
to public
with check (true);


create policy "parts_select_policy"
on "public"."parts"
as permissive
for select
to public
using (true);


create policy "parts_update_policy"
on "public"."parts"
as permissive
for update
to public
using (true);


create policy "product_parts_delete_policy"
on "public"."product_parts"
as permissive
for delete
to public
using (true);


create policy "product_parts_insert_policy"
on "public"."product_parts"
as permissive
for insert
to public
with check (true);


create policy "product_parts_select_policy"
on "public"."product_parts"
as permissive
for select
to public
using (true);


create policy "product_parts_update_policy"
on "public"."product_parts"
as permissive
for update
to public
using (true);


create policy "products_delete_policy"
on "public"."products"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "products_insert_policy"
on "public"."products"
as permissive
for insert
to public
with check (true);


create policy "products_select_policy"
on "public"."products"
as permissive
for select
to public
using (true);


create policy "products_update_policy"
on "public"."products"
as permissive
for update
to public
using (true);


create policy "profiles_delete_policy"
on "public"."profiles"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = ( SELECT auth.uid() AS uid)) AND ('admin'::text = ANY (profiles_1.roles))))));


create policy "profiles_insert_policy"
on "public"."profiles"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = ( SELECT auth.uid() AS uid)) AND ('admin'::text = ANY (profiles_1.roles)))))));


create policy "profiles_select_policy"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "profiles_update_policy"
on "public"."profiles"
as permissive
for update
to public
using (((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = ( SELECT auth.uid() AS uid)) AND ('admin'::text = ANY (profiles_1.roles)))))));


create policy "service_ticket_attachments_delete_policy"
on "public"."service_ticket_attachments"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "service_ticket_attachments_insert_policy"
on "public"."service_ticket_attachments"
as permissive
for insert
to public
with check (true);


create policy "service_ticket_attachments_select_policy"
on "public"."service_ticket_attachments"
as permissive
for select
to public
using (true);


create policy "service_ticket_attachments_update_policy"
on "public"."service_ticket_attachments"
as permissive
for update
to public
using (true);


create policy "service_ticket_comments_delete_policy"
on "public"."service_ticket_comments"
as permissive
for delete
to public
using (((( SELECT auth.uid() AS uid) = created_by) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles))))))));


create policy "service_ticket_comments_insert_policy"
on "public"."service_ticket_comments"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = created_by));


create policy "service_ticket_comments_select_policy"
on "public"."service_ticket_comments"
as permissive
for select
to public
using (true);


create policy "service_ticket_comments_update_policy"
on "public"."service_ticket_comments"
as permissive
for update
to public
using (((( SELECT auth.uid() AS uid) = created_by) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles))))))));


create policy "service_ticket_parts_delete_policy"
on "public"."service_ticket_parts"
as permissive
for delete
to public
using (true);


create policy "service_ticket_parts_insert_policy"
on "public"."service_ticket_parts"
as permissive
for insert
to public
with check (true);


create policy "service_ticket_parts_select_policy"
on "public"."service_ticket_parts"
as permissive
for select
to public
using (true);


create policy "service_ticket_parts_update_policy"
on "public"."service_ticket_parts"
as permissive
for update
to public
using (true);


create policy "service_tickets_delete_policy"
on "public"."service_tickets"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = ( SELECT auth.uid() AS uid)) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "service_tickets_insert_policy"
on "public"."service_tickets"
as permissive
for insert
to public
with check (true);


create policy "service_tickets_select_policy"
on "public"."service_tickets"
as permissive
for select
to public
using (true);


create policy "service_tickets_update_policy"
on "public"."service_tickets"
as permissive
for update
to public
using (true);


CREATE TRIGGER customers_updated_at_trigger BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER parts_updated_at_trigger BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER product_parts_updated_at_trigger BEFORE UPDATE ON public.product_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_updated_at_trigger BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_ticket_comments_updated_at_trigger BEFORE UPDATE ON public.service_ticket_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_ticket_parts_total_trigger AFTER INSERT OR DELETE OR UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION update_service_ticket_parts_total();

CREATE TRIGGER service_ticket_parts_updated_at_trigger BEFORE UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_tickets_log_status_change_trigger AFTER UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION log_status_change();

CREATE TRIGGER service_tickets_set_number_trigger BEFORE INSERT ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

CREATE TRIGGER service_tickets_updated_at_trigger BEFORE UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


