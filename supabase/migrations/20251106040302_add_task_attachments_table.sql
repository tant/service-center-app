alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_type_check";


  create table "public"."task_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "file_name" character varying(255) not null,
    "file_path" text not null,
    "file_size_bytes" integer not null,
    "mime_type" character varying(100) not null,
    "uploaded_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


CREATE INDEX idx_task_attachments_task_id ON public.task_attachments USING btree (task_id);

CREATE UNIQUE INDEX task_attachments_pkey ON public.task_attachments USING btree (id);

alter table "public"."task_attachments" add constraint "task_attachments_pkey" PRIMARY KEY using index "task_attachments_pkey";

alter table "public"."task_attachments" add constraint "task_attachments_file_size_positive" CHECK ((file_size_bytes > 0)) not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_file_size_positive";

alter table "public"."task_attachments" add constraint "task_attachments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.entity_tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_task_id_fkey";

alter table "public"."task_attachments" add constraint "task_attachments_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_uploaded_by_fkey";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";

grant delete on table "public"."task_attachments" to "anon";

grant insert on table "public"."task_attachments" to "anon";

grant references on table "public"."task_attachments" to "anon";

grant select on table "public"."task_attachments" to "anon";

grant trigger on table "public"."task_attachments" to "anon";

grant truncate on table "public"."task_attachments" to "anon";

grant update on table "public"."task_attachments" to "anon";

grant delete on table "public"."task_attachments" to "authenticated";

grant insert on table "public"."task_attachments" to "authenticated";

grant references on table "public"."task_attachments" to "authenticated";

grant select on table "public"."task_attachments" to "authenticated";

grant trigger on table "public"."task_attachments" to "authenticated";

grant truncate on table "public"."task_attachments" to "authenticated";

grant update on table "public"."task_attachments" to "authenticated";

grant delete on table "public"."task_attachments" to "service_role";

grant insert on table "public"."task_attachments" to "service_role";

grant references on table "public"."task_attachments" to "service_role";

grant select on table "public"."task_attachments" to "service_role";

grant trigger on table "public"."task_attachments" to "service_role";

grant truncate on table "public"."task_attachments" to "service_role";

grant update on table "public"."task_attachments" to "service_role";


