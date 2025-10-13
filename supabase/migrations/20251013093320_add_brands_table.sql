drop index if exists "public"."products_brand_idx";

create table "public"."brands" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
);


alter table "public"."brands" enable row level security;

alter table "public"."products" drop column "brand";

alter table "public"."products" add column "brand_id" uuid;

CREATE INDEX brands_is_active_idx ON public.brands USING btree (is_active) WHERE (is_active = true);

CREATE INDEX brands_name_idx ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);

CREATE INDEX products_brand_id_idx ON public.products USING btree (brand_id);

alter table "public"."brands" add constraint "brands_pkey" PRIMARY KEY using index "brands_pkey";

alter table "public"."brands" add constraint "brands_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(user_id) not valid;

alter table "public"."brands" validate constraint "brands_created_by_fkey";

alter table "public"."brands" add constraint "brands_name_key" UNIQUE using index "brands_name_key";

alter table "public"."brands" add constraint "brands_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(user_id) not valid;

alter table "public"."brands" validate constraint "brands_updated_by_fkey";

alter table "public"."products" add constraint "products_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) not valid;

alter table "public"."products" validate constraint "products_brand_id_fkey";

grant delete on table "public"."brands" to "anon";

grant insert on table "public"."brands" to "anon";

grant references on table "public"."brands" to "anon";

grant select on table "public"."brands" to "anon";

grant trigger on table "public"."brands" to "anon";

grant truncate on table "public"."brands" to "anon";

grant update on table "public"."brands" to "anon";

grant delete on table "public"."brands" to "authenticated";

grant insert on table "public"."brands" to "authenticated";

grant references on table "public"."brands" to "authenticated";

grant select on table "public"."brands" to "authenticated";

grant trigger on table "public"."brands" to "authenticated";

grant truncate on table "public"."brands" to "authenticated";

grant update on table "public"."brands" to "authenticated";

grant delete on table "public"."brands" to "service_role";

grant insert on table "public"."brands" to "service_role";

grant references on table "public"."brands" to "service_role";

grant select on table "public"."brands" to "service_role";

grant trigger on table "public"."brands" to "service_role";

grant truncate on table "public"."brands" to "service_role";

grant update on table "public"."brands" to "service_role";

create policy "brands_delete_policy"
on "public"."brands"
as permissive
for delete
to public
using (is_admin_or_manager());


create policy "brands_insert_policy"
on "public"."brands"
as permissive
for insert
to public
with check (true);


create policy "brands_select_policy"
on "public"."brands"
as permissive
for select
to public
using (true);


create policy "brands_update_policy"
on "public"."brands"
as permissive
for update
to public
using (true);


CREATE TRIGGER brands_updated_at_trigger BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


