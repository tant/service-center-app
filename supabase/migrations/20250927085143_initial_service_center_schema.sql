create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text not null,
    "email" text,
    "address" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."customers" enable row level security;

create table "public"."parts" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "name" text not null,
    "part_number" text,
    "sku" text,
    "description" text,
    "price" numeric(10,2) not null,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."parts" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "sku" text,
    "short_description" text,
    "brand" text,
    "model" text,
    "type" text,
    "primary_image" text,
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

create table "public"."service_ticket_comments" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "user_id" uuid not null,
    "comment_text" text not null,
    "comment_type" text not null default 'note'::text,
    "is_internal" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."service_ticket_comments" enable row level security;

create table "public"."service_ticket_parts" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "part_id" uuid not null,
    "quantity" integer not null default 1,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid
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
    "service_fee" numeric(10,2) not null default 0,
    "diagnosis_fee" numeric(10,2) not null default 0,
    "discount_amount" numeric(10,2) not null default 0,
    "parts_total" numeric(10,2) not null default 0,
    "total_cost" numeric(10,2) not null default 0,
    "received_at" timestamp with time zone not null default now(),
    "estimated_completion" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "assigned_to" uuid
);


alter table "public"."service_tickets" enable row level security;

CREATE INDEX customers_email_idx ON public.customers USING btree (email) WHERE (email IS NOT NULL);

CREATE INDEX customers_name_idx ON public.customers USING btree (name);

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);

CREATE UNIQUE INDEX customers_phone_key ON public.customers USING btree (phone);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE INDEX parts_name_idx ON public.parts USING btree (name);

CREATE INDEX parts_part_number_idx ON public.parts USING btree (part_number) WHERE (part_number IS NOT NULL);

CREATE UNIQUE INDEX parts_part_number_unique_idx ON public.parts USING btree (part_number) WHERE (part_number IS NOT NULL);

CREATE UNIQUE INDEX parts_pkey ON public.parts USING btree (id);

CREATE INDEX parts_price_idx ON public.parts USING btree (price);

CREATE INDEX parts_product_id_idx ON public.parts USING btree (product_id);

CREATE INDEX parts_sku_idx ON public.parts USING btree (sku) WHERE (sku IS NOT NULL);

CREATE UNIQUE INDEX parts_sku_unique_idx ON public.parts USING btree (sku) WHERE (sku IS NOT NULL);

CREATE INDEX products_brand_idx ON public.products USING btree (brand) WHERE (brand IS NOT NULL);

CREATE INDEX products_created_by_idx ON public.products USING btree (created_by);

CREATE INDEX products_name_idx ON public.products USING btree (name);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE INDEX products_sku_idx ON public.products USING btree (sku) WHERE (sku IS NOT NULL);

CREATE UNIQUE INDEX products_sku_unique_idx ON public.products USING btree (sku) WHERE (sku IS NOT NULL);

CREATE INDEX products_type_idx ON public.products USING btree (type) WHERE (type IS NOT NULL);

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);

CREATE INDEX profiles_is_active_idx ON public.profiles USING btree (is_active) WHERE (is_active = true);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_roles_idx ON public.profiles USING gin (roles);

CREATE INDEX profiles_user_id_idx ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);

CREATE INDEX service_ticket_comments_comment_type_idx ON public.service_ticket_comments USING btree (comment_type);

CREATE INDEX service_ticket_comments_created_at_idx ON public.service_ticket_comments USING btree (created_at);

CREATE INDEX service_ticket_comments_is_internal_idx ON public.service_ticket_comments USING btree (is_internal);

CREATE UNIQUE INDEX service_ticket_comments_pkey ON public.service_ticket_comments USING btree (id);

CREATE INDEX service_ticket_comments_public_idx ON public.service_ticket_comments USING btree (ticket_id, created_at) WHERE (is_internal = false);

CREATE INDEX service_ticket_comments_ticket_id_idx ON public.service_ticket_comments USING btree (ticket_id);

CREATE INDEX service_ticket_comments_user_id_idx ON public.service_ticket_comments USING btree (user_id);

CREATE INDEX service_ticket_parts_created_at_idx ON public.service_ticket_parts USING btree (created_at);

CREATE INDEX service_ticket_parts_part_id_idx ON public.service_ticket_parts USING btree (part_id);

CREATE UNIQUE INDEX service_ticket_parts_pkey ON public.service_ticket_parts USING btree (id);

CREATE INDEX service_ticket_parts_ticket_id_idx ON public.service_ticket_parts USING btree (ticket_id);

CREATE UNIQUE INDEX service_ticket_parts_unique ON public.service_ticket_parts USING btree (ticket_id, part_id);

CREATE INDEX service_tickets_assigned_to_idx ON public.service_tickets USING btree (assigned_to) WHERE (assigned_to IS NOT NULL);

CREATE INDEX service_tickets_created_by_idx ON public.service_tickets USING btree (created_by) WHERE (created_by IS NOT NULL);

CREATE INDEX service_tickets_customer_id_idx ON public.service_tickets USING btree (customer_id);

CREATE UNIQUE INDEX service_tickets_pkey ON public.service_tickets USING btree (id);

CREATE INDEX service_tickets_priority_level_idx ON public.service_tickets USING btree (priority_level);

CREATE INDEX service_tickets_product_id_idx ON public.service_tickets USING btree (product_id);

CREATE INDEX service_tickets_received_at_idx ON public.service_tickets USING btree (received_at);

CREATE INDEX service_tickets_status_idx ON public.service_tickets USING btree (status);

CREATE INDEX service_tickets_status_open_idx ON public.service_tickets USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'in_progress'::text]));

CREATE INDEX service_tickets_ticket_number_idx ON public.service_tickets USING btree (ticket_number);

CREATE UNIQUE INDEX service_tickets_ticket_number_key ON public.service_tickets USING btree (ticket_number);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."parts" add constraint "parts_pkey" PRIMARY KEY using index "parts_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_pkey" PRIMARY KEY using index "service_ticket_comments_pkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_pkey" PRIMARY KEY using index "service_ticket_parts_pkey";

alter table "public"."service_tickets" add constraint "service_tickets_pkey" PRIMARY KEY using index "service_tickets_pkey";

alter table "public"."customers" add constraint "customers_email_format_check" CHECK (((email IS NULL) OR (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))) not valid;

alter table "public"."customers" validate constraint "customers_email_format_check";

alter table "public"."customers" add constraint "customers_phone_format_check" CHECK (((phone ~ '^[0-9+\-\s()]+$'::text) AND (length(phone) >= 10))) not valid;

alter table "public"."customers" validate constraint "customers_phone_format_check";

alter table "public"."customers" add constraint "customers_phone_key" UNIQUE using index "customers_phone_key";

alter table "public"."parts" add constraint "parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_created_by_fkey";

alter table "public"."parts" add constraint "parts_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."parts" validate constraint "parts_price_check";

alter table "public"."parts" add constraint "parts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."parts" validate constraint "parts_product_id_fkey";

alter table "public"."parts" add constraint "parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_updated_by_fkey";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."products" add constraint "products_type_check" CHECK ((type = ANY (ARRAY['hardware'::text, 'software'::text, 'accessory'::text]))) not valid;

alter table "public"."products" validate constraint "products_type_check";

alter table "public"."products" add constraint "products_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_updated_by_fkey";

alter table "public"."profiles" add constraint "profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_roles_check" CHECK ((roles <@ ARRAY['admin'::text, 'manager'::text, 'technician'::text, 'reception'::text])) not valid;

alter table "public"."profiles" validate constraint "profiles_roles_check";

alter table "public"."profiles" add constraint "profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_updated_by_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_key" UNIQUE using index "profiles_user_id_key";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_comment_text_check" CHECK ((length(TRIM(BOTH FROM comment_text)) > 0)) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_comment_text_check";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_comment_type_check" CHECK ((comment_type = ANY (ARRAY['note'::text, 'status_change'::text, 'customer_communication'::text, 'diagnosis'::text, 'repair_progress'::text, 'parts_added'::text, 'quality_check'::text, 'customer_approval'::text]))) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_comment_type_check";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_ticket_id_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE RESTRICT not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_user_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_created_by_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_part_id_fkey" FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_part_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_quantity_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_ticket_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_total_price_check" CHECK ((total_price >= (0)::numeric)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_total_price_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unique" UNIQUE using index "service_ticket_parts_unique";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_unit_price_check";

alter table "public"."service_tickets" add constraint "service_tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_assigned_to_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_completion_check" CHECK (((status <> 'completed'::text) OR (completed_at IS NOT NULL))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_completion_check";

alter table "public"."service_tickets" add constraint "service_tickets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_created_by_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_customer_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_diagnosis_fee_check" CHECK ((diagnosis_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_diagnosis_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_discount_amount_check" CHECK ((discount_amount >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_discount_amount_check";

alter table "public"."service_tickets" add constraint "service_tickets_estimated_completion_check" CHECK (((estimated_completion IS NULL) OR (estimated_completion >= received_at))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_estimated_completion_check";

alter table "public"."service_tickets" add constraint "service_tickets_parts_total_check" CHECK ((parts_total >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_parts_total_check";

alter table "public"."service_tickets" add constraint "service_tickets_priority_level_check" CHECK ((priority_level = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_priority_level_check";

alter table "public"."service_tickets" add constraint "service_tickets_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_product_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_service_fee_check" CHECK ((service_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_service_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_status_check";

alter table "public"."service_tickets" add constraint "service_tickets_ticket_number_key" UNIQUE using index "service_tickets_ticket_number_key";

alter table "public"."service_tickets" add constraint "service_tickets_total_cost_check" CHECK ((total_cost >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_total_cost_check";

alter table "public"."service_tickets" add constraint "service_tickets_warranty_type_check" CHECK ((warranty_type = ANY (ARRAY['warranty'::text, 'paid'::text, 'goodwill'::text]))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_warranty_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_total_cost(parts_total_val numeric, service_fee_val numeric, diagnosis_fee_val numeric, discount_amount_val numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
begin
  return parts_total_val + service_fee_val + diagnosis_fee_val - discount_amount_val;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  year_part text := to_char(now(), 'YYYY');
  sequence_num int;
  ticket_num text;
begin
  -- Get the next sequence number for this year
  select coalesce(max(
    cast(
      substring(ticket_number from 'SV-' || year_part || '-(\d+)') as int
    )
  ), 0) + 1
  into sequence_num
  from service_tickets
  where ticket_number ~ ('^SV-' || year_part || '-\d+$');
  
  -- Format as SV-YYYY-NNN
  ticket_num := 'SV-' || year_part || '-' || lpad(sequence_num::text, 3, '0');
  
  return ticket_num;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.log_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Only trigger on status changes
  if OLD.status != NEW.status then
    insert into service_ticket_comments (
      ticket_id,
      user_id,
      comment_text,
      comment_type,
      is_internal
    ) values (
      NEW.id,
      coalesce(NEW.updated_by, auth.uid()),
      format('Trạng thái đã thay đổi từ ''%s'' sang ''%s''', OLD.status, NEW.status),
      'status_change',
      true
    );
  end if;
  
  return NEW;
end;
$function$
;

create or replace view "public"."public_service_ticket_comments" as  SELECT stc.id,
    stc.ticket_id,
    stc.comment_text,
    stc.comment_type,
    stc.created_at,
    p.full_name AS author_name
   FROM (service_ticket_comments stc
     JOIN profiles p ON ((stc.user_id = p.user_id)))
  WHERE (stc.is_internal = false);


CREATE OR REPLACE FUNCTION public.service_ticket_comments_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Trim whitespace from comment_text
  NEW.comment_text := trim(NEW.comment_text);
  
  -- Set user_id to current user if not provided
  if NEW.user_id is null then
    NEW.user_id := auth.uid();
  end if;
  
  return NEW;
end;
$function$
;

create or replace view "public"."service_ticket_comments_with_author" as  SELECT stc.id,
    stc.ticket_id,
    stc.user_id,
    stc.comment_text,
    stc.comment_type,
    stc.is_internal,
    stc.created_at,
    p.full_name AS author_name,
    p.avatar_url AS author_avatar
   FROM (service_ticket_comments stc
     JOIN profiles p ON ((stc.user_id = p.user_id)));


CREATE OR REPLACE FUNCTION public.service_ticket_parts_before_insert_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Calculate total_price
  NEW.total_price := NEW.quantity * NEW.unit_price;
  
  -- Update updated_at
  NEW.updated_at := now();
  
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.service_tickets_before_insert_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Generate ticket number on insert if not provided
  if TG_OP = 'INSERT' and (NEW.ticket_number is null or NEW.ticket_number = '') then
    NEW.ticket_number := generate_ticket_number();
  end if;
  
  -- Calculate total_cost
  NEW.total_cost := calculate_total_cost(
    NEW.parts_total,
    NEW.service_fee,
    NEW.diagnosis_fee,
    NEW.discount_amount
  );
  
  -- Set completed_at when status changes to completed
  if NEW.status = 'completed' and (OLD is null or OLD.status != 'completed') then
    NEW.completed_at := now();
  end if;
  
  -- Clear completed_at if status changes from completed
  if NEW.status != 'completed' and OLD is not null and OLD.status = 'completed' then
    NEW.completed_at := null;
  end if;
  
  -- Update updated_at
  NEW.updated_at := now();
  
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_service_ticket_parts_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  ticket_uuid uuid;
  new_parts_total decimal(10,2);
begin
  -- Get the ticket_id from the affected row
  if TG_OP = 'DELETE' then
    ticket_uuid := OLD.ticket_id;
  else
    ticket_uuid := NEW.ticket_id;
  end if;
  
  -- Calculate new parts_total for the ticket
  select coalesce(sum(total_price), 0)
  into new_parts_total
  from service_ticket_parts
  where ticket_id = ticket_uuid;
  
  -- Update the service_tickets table
  update service_tickets
  set parts_total = new_parts_total,
      updated_at = now()
  where id = ticket_uuid;
  
  return coalesce(NEW, OLD);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
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
  WHERE ((profiles.user_id = auth.uid()) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "customers_insert_policy"
on "public"."customers"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "customers_select_policy"
on "public"."customers"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "customers_update_policy"
on "public"."customers"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "parts_delete_policy"
on "public"."parts"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "parts_insert_policy"
on "public"."parts"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "parts_select_policy"
on "public"."parts"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "parts_update_policy"
on "public"."parts"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "products_delete_policy"
on "public"."products"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (('admin'::text = ANY (profiles.roles)) OR ('manager'::text = ANY (profiles.roles)))))));


create policy "products_insert_policy"
on "public"."products"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "products_select_policy"
on "public"."products"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "products_update_policy"
on "public"."products"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "profiles_delete_policy"
on "public"."profiles"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = auth.uid()) AND ('admin'::text = ANY (profiles_1.roles))))));


create policy "profiles_insert_policy"
on "public"."profiles"
as permissive
for insert
to public
with check (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = auth.uid()) AND ('admin'::text = ANY (profiles_1.roles)))))));


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
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.user_id = auth.uid()) AND ('admin'::text = ANY (profiles_1.roles)))))));


create policy "service_ticket_comments_delete_policy"
on "public"."service_ticket_comments"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND ('admin'::text = ANY (profiles.roles))))));


create policy "service_ticket_comments_insert_policy"
on "public"."service_ticket_comments"
as permissive
for insert
to public
with check (((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE (st.id = service_ticket_comments.ticket_id)))));


create policy "service_ticket_comments_select_policy"
on "public"."service_ticket_comments"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE (st.id = service_ticket_comments.ticket_id)))));


create policy "service_ticket_parts_delete_policy"
on "public"."service_ticket_parts"
as permissive
for delete
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE ((st.id = service_ticket_parts.ticket_id) AND ((st.assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.user_id = auth.uid()) AND (('manager'::text = ANY (p.roles)) OR ('admin'::text = ANY (p.roles))))))))))));


create policy "service_ticket_parts_insert_policy"
on "public"."service_ticket_parts"
as permissive
for insert
to public
with check (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE ((st.id = service_ticket_parts.ticket_id) AND ((st.assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.user_id = auth.uid()) AND (('manager'::text = ANY (p.roles)) OR ('admin'::text = ANY (p.roles))))))))))));


create policy "service_ticket_parts_select_policy"
on "public"."service_ticket_parts"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE (st.id = service_ticket_parts.ticket_id)))));


create policy "service_ticket_parts_update_policy"
on "public"."service_ticket_parts"
as permissive
for update
to public
using (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM service_tickets st
  WHERE ((st.id = service_ticket_parts.ticket_id) AND ((st.assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
           FROM profiles p
          WHERE ((p.user_id = auth.uid()) AND (('manager'::text = ANY (p.roles)) OR ('admin'::text = ANY (p.roles))))))))))));


create policy "service_tickets_delete_policy"
on "public"."service_tickets"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND ('admin'::text = ANY (profiles.roles))))));


create policy "service_tickets_insert_policy"
on "public"."service_tickets"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "service_tickets_select_policy"
on "public"."service_tickets"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "service_tickets_update_policy"
on "public"."service_tickets"
as permissive
for update
to public
using (((auth.role() = 'authenticated'::text) AND ((assigned_to = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (('manager'::text = ANY (profiles.roles)) OR ('admin'::text = ANY (profiles.roles)))))))));


CREATE TRIGGER customers_updated_at_trigger BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER parts_updated_at_trigger BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_updated_at_trigger BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_ticket_comments_before_insert_trigger BEFORE INSERT ON public.service_ticket_comments FOR EACH ROW EXECUTE FUNCTION service_ticket_comments_before_insert();

CREATE TRIGGER service_ticket_parts_after_insert_update_delete_trigger AFTER INSERT OR DELETE OR UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION update_service_ticket_parts_total();

CREATE TRIGGER service_ticket_parts_before_insert_update_trigger BEFORE INSERT OR UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION service_ticket_parts_before_insert_update();

CREATE TRIGGER service_ticket_parts_updated_at_trigger BEFORE UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_tickets_before_insert_update_trigger BEFORE INSERT OR UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION service_tickets_before_insert_update();

CREATE TRIGGER service_tickets_status_change_trigger AFTER UPDATE ON public.service_tickets FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION log_status_change();


