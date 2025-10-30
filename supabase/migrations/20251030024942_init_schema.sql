create type "public"."comment_type" as enum ('note', 'status_change', 'assignment', 'system');

create type "public"."delivery_method" as enum ('pickup', 'delivery');

create type "public"."movement_type" as enum ('receipt', 'transfer', 'assignment', 'return', 'disposal');

create type "public"."priority_level" as enum ('low', 'normal', 'high', 'urgent');

create type "public"."product_condition" as enum ('new', 'refurbished', 'used', 'faulty', 'for_parts');

create type "public"."request_status" as enum ('submitted', 'pickingup', 'received', 'processing', 'completed', 'cancelled');

create type "public"."service_type" as enum ('warranty', 'paid', 'replacement');

create type "public"."stock_document_status" as enum ('draft', 'pending_approval', 'approved', 'completed', 'cancelled');

create type "public"."stock_issue_type" as enum ('normal', 'adjustment');

create type "public"."stock_receipt_type" as enum ('normal', 'adjustment');

create type "public"."task_status" as enum ('pending', 'in_progress', 'completed', 'blocked', 'skipped');

create type "public"."ticket_status" as enum ('pending', 'in_progress', 'completed', 'cancelled');

create type "public"."transfer_status" as enum ('draft', 'pending_approval', 'approved', 'completed', 'cancelled');

create type "public"."user_role" as enum ('admin', 'manager', 'technician', 'reception');

create type "public"."warehouse_type" as enum ('main', 'warranty_stock', 'rma_staging', 'dead_stock', 'in_service', 'parts', 'customer_installed');

create type "public"."warranty_type" as enum ('warranty', 'paid', 'goodwill');

create sequence "public"."issue_number_seq";

create sequence "public"."receipt_number_seq";

create sequence "public"."transfer_number_seq";


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "user_role" text not null,
    "user_email" text,
    "action" text not null,
    "resource_type" text not null,
    "resource_id" text not null,
    "old_values" jsonb,
    "new_values" jsonb,
    "changes" jsonb,
    "reason" text,
    "ip_address" inet,
    "user_agent" text,
    "metadata" jsonb
      );


alter table "public"."audit_logs" enable row level security;


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


  create table "public"."email_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "recipient_email" character varying(255) not null,
    "recipient_name" character varying(255),
    "subject" character varying(500) not null,
    "body_text" text,
    "body_html" text,
    "template_name" character varying(100),
    "notification_type" character varying(100) not null,
    "related_entity_type" character varying(50),
    "related_entity_id" uuid,
    "status" character varying(50) not null default 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "bounced_at" timestamp with time zone,
    "bounce_reason" text,
    "error_message" text,
    "retry_count" integer not null default 0,
    "last_retry_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."email_notifications" enable row level security;


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


  create table "public"."physical_products" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "serial_number" character varying(255) not null,
    "condition" public.product_condition not null default 'new'::public.product_condition,
    "virtual_warehouse_type" public.warehouse_type not null default 'warranty_stock'::public.warehouse_type,
    "physical_warehouse_id" uuid,
    "previous_virtual_warehouse_type" public.warehouse_type,
    "manufacturer_warranty_end_date" date,
    "user_warranty_end_date" date,
    "current_ticket_id" uuid,
    "rma_batch_id" uuid,
    "rma_reason" text,
    "rma_date" date,
    "supplier_id" uuid,
    "purchase_date" date,
    "purchase_price" numeric(10,2),
    "last_known_customer_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."physical_products" enable row level security;


  create table "public"."physical_warehouses" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "code" character varying(20) not null,
    "location" text,
    "description" text,
    "is_active" boolean not null default true,
    "is_system_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."physical_warehouses" enable row level security;


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


  create table "public"."product_stock_thresholds" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "warehouse_type" public.warehouse_type not null,
    "minimum_quantity" integer not null,
    "reorder_quantity" integer,
    "maximum_quantity" integer,
    "alert_enabled" boolean not null default true,
    "last_alert_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."product_stock_thresholds" enable row level security;


  create table "public"."product_warehouse_stock" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "virtual_warehouse_id" uuid not null,
    "declared_quantity" integer not null default 0,
    "initial_stock_entry" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "type" text not null,
    "brand_id" uuid,
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
    "role" public.user_role not null default 'technician'::public.user_role,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."profiles" enable row level security;


  create table "public"."rma_batches" (
    "id" uuid not null default gen_random_uuid(),
    "batch_number" character varying(20) not null,
    "supplier_id" uuid,
    "status" character varying(50) not null default 'draft'::character varying,
    "shipping_date" date,
    "tracking_number" character varying(255),
    "notes" text,
    "created_by_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."rma_batches" enable row level security;


  create table "public"."service_request_items" (
    "id" uuid not null default gen_random_uuid(),
    "request_id" uuid not null,
    "serial_number" character varying(255) not null,
    "purchase_date" date,
    "issue_description" text,
    "issue_photos" jsonb default '[]'::jsonb,
    "ticket_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."service_requests" (
    "id" uuid not null default gen_random_uuid(),
    "tracking_token" character varying(15) not null,
    "customer_name" character varying(255) not null,
    "customer_email" character varying(255) not null,
    "customer_phone" character varying(50),
    "customer_address" text,
    "issue_description" text not null,
    "status" public.request_status not null default 'submitted'::public.request_status,
    "reviewed_by_id" uuid,
    "reviewed_at" timestamp with time zone,
    "rejection_reason" text,
    "converted_at" timestamp with time zone,
    "submitted_ip" character varying(45),
    "user_agent" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."service_requests" enable row level security;


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
    "comment_type" public.comment_type not null default 'note'::public.comment_type,
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


  create table "public"."service_ticket_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "task_type_id" uuid not null,
    "template_task_id" uuid,
    "name" character varying(255) not null,
    "description" text,
    "sequence_order" integer not null,
    "status" public.task_status not null default 'pending'::public.task_status,
    "is_required" boolean not null default true,
    "assigned_to_id" uuid,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "completion_notes" text,
    "blocked_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."service_ticket_tasks" enable row level security;


  create table "public"."service_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_number" text not null,
    "customer_id" uuid not null,
    "product_id" uuid not null,
    "issue_description" text not null,
    "status" public.ticket_status not null default 'pending'::public.ticket_status,
    "priority_level" public.priority_level not null default 'normal'::public.priority_level,
    "warranty_type" public.warranty_type,
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
    "updated_by" uuid,
    "template_id" uuid,
    "request_id" uuid,
    "delivery_method" public.delivery_method,
    "delivery_address" text
      );


alter table "public"."service_tickets" enable row level security;


  create table "public"."stock_document_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "document_type" character varying(50) not null,
    "document_id" uuid not null,
    "file_name" character varying(255) not null,
    "file_path" text not null,
    "file_size" integer,
    "mime_type" character varying(100),
    "uploaded_by_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."stock_document_attachments" enable row level security;


  create table "public"."stock_issue_items" (
    "id" uuid not null default gen_random_uuid(),
    "issue_id" uuid not null,
    "product_id" uuid not null,
    "quantity" integer not null,
    "unit_price" numeric(12,2),
    "total_price" numeric(12,2) generated always as (((quantity)::numeric * COALESCE(unit_price, (0)::numeric))) stored,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_issue_serials" (
    "id" uuid not null default gen_random_uuid(),
    "issue_item_id" uuid not null,
    "physical_product_id" uuid not null,
    "serial_number" character varying(255) not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_issues" (
    "id" uuid not null default gen_random_uuid(),
    "issue_number" character varying(50) not null,
    "issue_type" public.stock_issue_type not null default 'normal'::public.stock_issue_type,
    "status" public.stock_document_status not null default 'draft'::public.stock_document_status,
    "virtual_warehouse_id" uuid not null,
    "issue_date" date not null default CURRENT_DATE,
    "completed_at" timestamp with time zone,
    "ticket_id" uuid,
    "rma_batch_id" uuid,
    "reference_document_number" character varying(100),
    "created_by_id" uuid not null,
    "approved_by_id" uuid,
    "approved_at" timestamp with time zone,
    "completed_by_id" uuid,
    "auto_generated" boolean not null default false,
    "auto_approve_threshold" numeric(12,2),
    "notes" text,
    "rejection_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_movements" (
    "id" uuid not null default gen_random_uuid(),
    "physical_product_id" uuid not null,
    "movement_type" public.movement_type not null,
    "from_virtual_warehouse" public.warehouse_type,
    "to_virtual_warehouse" public.warehouse_type,
    "from_physical_warehouse_id" uuid,
    "to_physical_warehouse_id" uuid,
    "ticket_id" uuid,
    "reason" text,
    "notes" text,
    "moved_by_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."stock_movements" enable row level security;


  create table "public"."stock_receipt_items" (
    "id" uuid not null default gen_random_uuid(),
    "receipt_id" uuid not null,
    "product_id" uuid not null,
    "declared_quantity" integer not null,
    "serial_count" integer not null default 0,
    "unit_price" numeric(12,2),
    "total_price" numeric(12,2) generated always as (((declared_quantity)::numeric * COALESCE(unit_price, (0)::numeric))) stored,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_receipt_serials" (
    "id" uuid not null default gen_random_uuid(),
    "receipt_item_id" uuid not null,
    "serial_number" character varying(255) not null,
    "physical_product_id" uuid,
    "manufacturer_warranty_end_date" date,
    "user_warranty_end_date" date,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_receipts" (
    "id" uuid not null default gen_random_uuid(),
    "receipt_number" character varying(50) not null,
    "receipt_type" public.stock_receipt_type not null default 'normal'::public.stock_receipt_type,
    "status" public.stock_document_status not null default 'draft'::public.stock_document_status,
    "virtual_warehouse_id" uuid not null,
    "receipt_date" date not null default CURRENT_DATE,
    "expected_date" date,
    "completed_at" timestamp with time zone,
    "supplier_id" uuid,
    "rma_batch_id" uuid,
    "reference_document_number" character varying(100),
    "created_by_id" uuid not null,
    "approved_by_id" uuid,
    "approved_at" timestamp with time zone,
    "completed_by_id" uuid,
    "notes" text,
    "rejection_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_transfer_items" (
    "id" uuid not null default gen_random_uuid(),
    "transfer_id" uuid not null,
    "product_id" uuid not null,
    "quantity" integer not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_transfer_serials" (
    "id" uuid not null default gen_random_uuid(),
    "transfer_item_id" uuid not null,
    "physical_product_id" uuid not null,
    "serial_number" character varying(255) not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."stock_transfers" (
    "id" uuid not null default gen_random_uuid(),
    "transfer_number" character varying(50) not null,
    "status" public.transfer_status not null default 'draft'::public.transfer_status,
    "from_virtual_warehouse_id" uuid not null,
    "to_virtual_warehouse_id" uuid not null,
    "transfer_date" date not null default CURRENT_DATE,
    "expected_delivery_date" date,
    "completed_at" timestamp with time zone,
    "created_by_id" uuid not null,
    "approved_by_id" uuid,
    "approved_at" timestamp with time zone,
    "received_by_id" uuid,
    "generated_issue_id" uuid,
    "generated_receipt_id" uuid,
    "customer_id" uuid,
    "notes" text,
    "rejection_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."task_history" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "ticket_id" uuid not null,
    "old_status" public.task_status,
    "new_status" public.task_status not null,
    "changed_by_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."task_history" enable row level security;


  create table "public"."task_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "description" text,
    "product_type" uuid,
    "service_type" public.service_type not null default 'warranty'::public.service_type,
    "strict_sequence" boolean not null default false,
    "is_active" boolean not null default true,
    "created_by_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."task_templates" enable row level security;


  create table "public"."task_templates_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "template_id" uuid not null,
    "task_type_id" uuid not null,
    "sequence_order" integer not null,
    "is_required" boolean not null default true,
    "custom_instructions" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."task_templates_tasks" enable row level security;


  create table "public"."task_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "description" text,
    "category" character varying(100),
    "estimated_duration_minutes" integer,
    "requires_notes" boolean not null default false,
    "requires_photo" boolean not null default false,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."task_types" enable row level security;


  create table "public"."ticket_template_changes" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "old_template_id" uuid,
    "new_template_id" uuid,
    "reason" text not null,
    "changed_by_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."ticket_template_changes" enable row level security;


  create table "public"."virtual_warehouses" (
    "id" uuid not null default gen_random_uuid(),
    "warehouse_type" public.warehouse_type not null,
    "name" character varying(255) not null,
    "description" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "physical_warehouse_id" uuid not null
      );


alter table "public"."virtual_warehouses" enable row level security;

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE INDEX brands_is_active_idx ON public.brands USING btree (is_active) WHERE (is_active = true);

CREATE INDEX brands_name_idx ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);

CREATE INDEX customers_email_idx ON public.customers USING btree (email);

CREATE INDEX customers_is_active_idx ON public.customers USING btree (is_active) WHERE (is_active = true);

CREATE INDEX customers_name_idx ON public.customers USING btree (name);

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX email_notifications_pkey ON public.email_notifications USING btree (id);

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);

CREATE INDEX idx_audit_logs_changes ON public.audit_logs USING gin (changes);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);

CREATE INDEX idx_audit_logs_new_values ON public.audit_logs USING gin (new_values);

CREATE INDEX idx_audit_logs_old_values ON public.audit_logs USING gin (old_values);

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_audit_logs_user_role ON public.audit_logs USING btree (user_role);

CREATE INDEX idx_physical_products_last_customer ON public.physical_products USING btree (last_known_customer_id) WHERE (last_known_customer_id IS NOT NULL);

CREATE INDEX idx_product_warehouse_stock_product ON public.product_warehouse_stock USING btree (product_id);

CREATE INDEX idx_product_warehouse_stock_virtual_warehouse ON public.product_warehouse_stock USING btree (virtual_warehouse_id);

CREATE INDEX idx_service_request_items_request_id ON public.service_request_items USING btree (request_id);

CREATE INDEX idx_service_request_items_serial_number ON public.service_request_items USING btree (serial_number);

CREATE INDEX idx_service_request_items_ticket_id ON public.service_request_items USING btree (ticket_id);

CREATE INDEX idx_service_tickets_delivery_method ON public.service_tickets USING btree (delivery_method) WHERE (delivery_method IS NOT NULL);

CREATE INDEX idx_service_tickets_request ON public.service_tickets USING btree (request_id) WHERE (request_id IS NOT NULL);

CREATE INDEX idx_service_tickets_template ON public.service_tickets USING btree (template_id) WHERE (template_id IS NOT NULL);

CREATE INDEX idx_stock_document_attachments_document ON public.stock_document_attachments USING btree (document_type, document_id);

CREATE INDEX idx_stock_document_attachments_uploader ON public.stock_document_attachments USING btree (uploaded_by_id);

CREATE INDEX idx_stock_issue_items_issue ON public.stock_issue_items USING btree (issue_id);

CREATE INDEX idx_stock_issue_items_product ON public.stock_issue_items USING btree (product_id);

CREATE INDEX idx_stock_issue_serials_item ON public.stock_issue_serials USING btree (issue_item_id);

CREATE INDEX idx_stock_issue_serials_product ON public.stock_issue_serials USING btree (physical_product_id);

CREATE INDEX idx_stock_issues_date ON public.stock_issues USING btree (issue_date);

CREATE INDEX idx_stock_issues_status ON public.stock_issues USING btree (status);

CREATE INDEX idx_stock_issues_ticket ON public.stock_issues USING btree (ticket_id);

CREATE INDEX idx_stock_issues_type ON public.stock_issues USING btree (issue_type);

CREATE INDEX idx_stock_issues_warehouse ON public.stock_issues USING btree (virtual_warehouse_id);

CREATE INDEX idx_stock_receipt_items_product ON public.stock_receipt_items USING btree (product_id);

CREATE INDEX idx_stock_receipt_items_receipt ON public.stock_receipt_items USING btree (receipt_id);

CREATE INDEX idx_stock_receipt_serials_item ON public.stock_receipt_serials USING btree (receipt_item_id);

CREATE INDEX idx_stock_receipt_serials_serial ON public.stock_receipt_serials USING btree (serial_number);

CREATE INDEX idx_stock_receipts_created_by ON public.stock_receipts USING btree (created_by_id);

CREATE INDEX idx_stock_receipts_date ON public.stock_receipts USING btree (receipt_date);

CREATE INDEX idx_stock_receipts_status ON public.stock_receipts USING btree (status);

CREATE INDEX idx_stock_receipts_type ON public.stock_receipts USING btree (receipt_type);

CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts USING btree (virtual_warehouse_id);

CREATE INDEX idx_stock_transfer_items_product ON public.stock_transfer_items USING btree (product_id);

CREATE INDEX idx_stock_transfer_items_transfer ON public.stock_transfer_items USING btree (transfer_id);

CREATE INDEX idx_stock_transfer_serials_item ON public.stock_transfer_serials USING btree (transfer_item_id);

CREATE INDEX idx_stock_transfers_customer ON public.stock_transfers USING btree (customer_id) WHERE (customer_id IS NOT NULL);

CREATE INDEX idx_stock_transfers_from ON public.stock_transfers USING btree (from_virtual_warehouse_id);

CREATE INDEX idx_stock_transfers_generated_issue ON public.stock_transfers USING btree (generated_issue_id);

CREATE INDEX idx_stock_transfers_generated_receipt ON public.stock_transfers USING btree (generated_receipt_id);

CREATE INDEX idx_stock_transfers_status ON public.stock_transfers USING btree (status);

CREATE INDEX idx_stock_transfers_to ON public.stock_transfers USING btree (to_virtual_warehouse_id);

CREATE UNIQUE INDEX issue_serials_unique ON public.stock_issue_serials USING btree (issue_item_id, physical_product_id);

CREATE INDEX parts_category_idx ON public.parts USING btree (category);

CREATE INDEX parts_is_active_idx ON public.parts USING btree (is_active) WHERE (is_active = true);

CREATE INDEX parts_name_idx ON public.parts USING btree (name);

CREATE INDEX parts_part_number_idx ON public.parts USING btree (part_number);

CREATE UNIQUE INDEX parts_pkey ON public.parts USING btree (id);

CREATE INDEX parts_sku_idx ON public.parts USING btree (sku);

CREATE INDEX parts_stock_quantity_idx ON public.parts USING btree (stock_quantity);

CREATE UNIQUE INDEX physical_products_pkey ON public.physical_products USING btree (id);

CREATE UNIQUE INDEX physical_products_serial_unique ON public.physical_products USING btree (serial_number);

CREATE UNIQUE INDEX physical_warehouses_code_key ON public.physical_warehouses USING btree (code);

CREATE UNIQUE INDEX physical_warehouses_pkey ON public.physical_warehouses USING btree (id);

CREATE UNIQUE INDEX physical_warehouses_system_default_unique ON public.physical_warehouses USING btree (is_system_default) WHERE (is_system_default = true);

CREATE INDEX product_parts_part_id_idx ON public.product_parts USING btree (part_id);

CREATE UNIQUE INDEX product_parts_pkey ON public.product_parts USING btree (id);

CREATE INDEX product_parts_product_id_idx ON public.product_parts USING btree (product_id);

CREATE UNIQUE INDEX product_parts_unique ON public.product_parts USING btree (product_id, part_id);

CREATE UNIQUE INDEX product_stock_thresholds_pkey ON public.product_stock_thresholds USING btree (id);

CREATE UNIQUE INDEX product_stock_thresholds_product_warehouse_unique ON public.product_stock_thresholds USING btree (product_id, warehouse_type);

CREATE UNIQUE INDEX product_warehouse_stock_pkey ON public.product_warehouse_stock USING btree (id);

CREATE UNIQUE INDEX product_warehouse_stock_unique ON public.product_warehouse_stock USING btree (product_id, virtual_warehouse_id);

CREATE INDEX products_brand_id_idx ON public.products USING btree (brand_id);

CREATE INDEX products_is_active_idx ON public.products USING btree (is_active) WHERE (is_active = true);

CREATE INDEX products_model_idx ON public.products USING btree (model);

CREATE INDEX products_name_idx ON public.products USING btree (name);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE INDEX products_sku_idx ON public.products USING btree (sku);

CREATE INDEX products_type_idx ON public.products USING btree (type);

CREATE INDEX profiles_email_idx ON public.profiles USING btree (email);

CREATE INDEX profiles_is_active_idx ON public.profiles USING btree (is_active) WHERE (is_active = true);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_role_idx ON public.profiles USING btree (role);

CREATE INDEX profiles_user_id_idx ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX receipt_serials_unique ON public.stock_receipt_serials USING btree (receipt_item_id, serial_number);

CREATE UNIQUE INDEX rma_batches_batch_number_key ON public.rma_batches USING btree (batch_number);

CREATE UNIQUE INDEX rma_batches_pkey ON public.rma_batches USING btree (id);

CREATE UNIQUE INDEX service_request_items_pkey ON public.service_request_items USING btree (id);

CREATE UNIQUE INDEX service_requests_pkey ON public.service_requests USING btree (id);

CREATE UNIQUE INDEX service_requests_tracking_token_key ON public.service_requests USING btree (tracking_token);

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

CREATE UNIQUE INDEX service_ticket_tasks_pkey ON public.service_ticket_tasks USING btree (id);

CREATE UNIQUE INDEX service_ticket_tasks_ticket_sequence_unique ON public.service_ticket_tasks USING btree (ticket_id, sequence_order);

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

CREATE UNIQUE INDEX stock_document_attachments_pkey ON public.stock_document_attachments USING btree (id);

CREATE UNIQUE INDEX stock_issue_items_pkey ON public.stock_issue_items USING btree (id);

CREATE UNIQUE INDEX stock_issue_serials_pkey ON public.stock_issue_serials USING btree (id);

CREATE UNIQUE INDEX stock_issues_issue_number_key ON public.stock_issues USING btree (issue_number);

CREATE UNIQUE INDEX stock_issues_pkey ON public.stock_issues USING btree (id);

CREATE UNIQUE INDEX stock_movements_pkey ON public.stock_movements USING btree (id);

CREATE UNIQUE INDEX stock_receipt_items_pkey ON public.stock_receipt_items USING btree (id);

CREATE UNIQUE INDEX stock_receipt_serials_pkey ON public.stock_receipt_serials USING btree (id);

CREATE UNIQUE INDEX stock_receipts_pkey ON public.stock_receipts USING btree (id);

CREATE UNIQUE INDEX stock_receipts_receipt_number_key ON public.stock_receipts USING btree (receipt_number);

CREATE UNIQUE INDEX stock_transfer_items_pkey ON public.stock_transfer_items USING btree (id);

CREATE UNIQUE INDEX stock_transfer_serials_pkey ON public.stock_transfer_serials USING btree (id);

CREATE UNIQUE INDEX stock_transfers_pkey ON public.stock_transfers USING btree (id);

CREATE UNIQUE INDEX stock_transfers_transfer_number_key ON public.stock_transfers USING btree (transfer_number);

CREATE UNIQUE INDEX task_history_pkey ON public.task_history USING btree (id);

CREATE UNIQUE INDEX task_templates_name_unique ON public.task_templates USING btree (name);

CREATE UNIQUE INDEX task_templates_pkey ON public.task_templates USING btree (id);

CREATE UNIQUE INDEX task_templates_tasks_pkey ON public.task_templates_tasks USING btree (id);

CREATE UNIQUE INDEX task_templates_tasks_template_sequence_unique ON public.task_templates_tasks USING btree (template_id, sequence_order);

CREATE UNIQUE INDEX task_types_name_unique ON public.task_types USING btree (name);

CREATE UNIQUE INDEX task_types_pkey ON public.task_types USING btree (id);

CREATE UNIQUE INDEX ticket_template_changes_pkey ON public.ticket_template_changes USING btree (id);

CREATE UNIQUE INDEX transfer_serials_unique ON public.stock_transfer_serials USING btree (transfer_item_id, physical_product_id);

CREATE UNIQUE INDEX virtual_warehouses_pkey ON public.virtual_warehouses USING btree (id);

CREATE UNIQUE INDEX virtual_warehouses_warehouse_type_unique ON public.virtual_warehouses USING btree (warehouse_type);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."brands" add constraint "brands_pkey" PRIMARY KEY using index "brands_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."email_notifications" add constraint "email_notifications_pkey" PRIMARY KEY using index "email_notifications_pkey";

alter table "public"."parts" add constraint "parts_pkey" PRIMARY KEY using index "parts_pkey";

alter table "public"."physical_products" add constraint "physical_products_pkey" PRIMARY KEY using index "physical_products_pkey";

alter table "public"."physical_warehouses" add constraint "physical_warehouses_pkey" PRIMARY KEY using index "physical_warehouses_pkey";

alter table "public"."product_parts" add constraint "product_parts_pkey" PRIMARY KEY using index "product_parts_pkey";

alter table "public"."product_stock_thresholds" add constraint "product_stock_thresholds_pkey" PRIMARY KEY using index "product_stock_thresholds_pkey";

alter table "public"."product_warehouse_stock" add constraint "product_warehouse_stock_pkey" PRIMARY KEY using index "product_warehouse_stock_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."rma_batches" add constraint "rma_batches_pkey" PRIMARY KEY using index "rma_batches_pkey";

alter table "public"."service_request_items" add constraint "service_request_items_pkey" PRIMARY KEY using index "service_request_items_pkey";

alter table "public"."service_requests" add constraint "service_requests_pkey" PRIMARY KEY using index "service_requests_pkey";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_pkey" PRIMARY KEY using index "service_ticket_attachments_pkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_pkey" PRIMARY KEY using index "service_ticket_comments_pkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_pkey" PRIMARY KEY using index "service_ticket_parts_pkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_pkey" PRIMARY KEY using index "service_ticket_tasks_pkey";

alter table "public"."service_tickets" add constraint "service_tickets_pkey" PRIMARY KEY using index "service_tickets_pkey";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_pkey" PRIMARY KEY using index "stock_document_attachments_pkey";

alter table "public"."stock_issue_items" add constraint "stock_issue_items_pkey" PRIMARY KEY using index "stock_issue_items_pkey";

alter table "public"."stock_issue_serials" add constraint "stock_issue_serials_pkey" PRIMARY KEY using index "stock_issue_serials_pkey";

alter table "public"."stock_issues" add constraint "stock_issues_pkey" PRIMARY KEY using index "stock_issues_pkey";

alter table "public"."stock_movements" add constraint "stock_movements_pkey" PRIMARY KEY using index "stock_movements_pkey";

alter table "public"."stock_receipt_items" add constraint "stock_receipt_items_pkey" PRIMARY KEY using index "stock_receipt_items_pkey";

alter table "public"."stock_receipt_serials" add constraint "stock_receipt_serials_pkey" PRIMARY KEY using index "stock_receipt_serials_pkey";

alter table "public"."stock_receipts" add constraint "stock_receipts_pkey" PRIMARY KEY using index "stock_receipts_pkey";

alter table "public"."stock_transfer_items" add constraint "stock_transfer_items_pkey" PRIMARY KEY using index "stock_transfer_items_pkey";

alter table "public"."stock_transfer_serials" add constraint "stock_transfer_serials_pkey" PRIMARY KEY using index "stock_transfer_serials_pkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_pkey" PRIMARY KEY using index "stock_transfers_pkey";

alter table "public"."task_history" add constraint "task_history_pkey" PRIMARY KEY using index "task_history_pkey";

alter table "public"."task_templates" add constraint "task_templates_pkey" PRIMARY KEY using index "task_templates_pkey";

alter table "public"."task_templates_tasks" add constraint "task_templates_tasks_pkey" PRIMARY KEY using index "task_templates_tasks_pkey";

alter table "public"."task_types" add constraint "task_types_pkey" PRIMARY KEY using index "task_types_pkey";

alter table "public"."ticket_template_changes" add constraint "ticket_template_changes_pkey" PRIMARY KEY using index "ticket_template_changes_pkey";

alter table "public"."virtual_warehouses" add constraint "virtual_warehouses_pkey" PRIMARY KEY using index "virtual_warehouses_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_action_check" CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'login'::text, 'logout'::text, 'failed_login'::text, 'template_switch'::text, 'role_change'::text, 'stock_movement'::text, 'rma_create'::text, 'rma_send'::text, 'approve'::text, 'reject'::text, 'assign'::text, 'reassign'::text, 'status_change'::text, 'export_data'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_action_check";

alter table "public"."audit_logs" add constraint "audit_logs_resource_type_check" CHECK ((resource_type = ANY (ARRAY['ticket'::text, 'task'::text, 'user'::text, 'profile'::text, 'customer'::text, 'product'::text, 'part'::text, 'stock'::text, 'template'::text, 'warehouse'::text, 'rma_batch'::text, 'system'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_resource_type_check";

alter table "public"."audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_user_id_fkey";

alter table "public"."brands" add constraint "brands_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."brands" validate constraint "brands_created_by_fkey";

alter table "public"."brands" add constraint "brands_name_key" UNIQUE using index "brands_name_key";

alter table "public"."brands" add constraint "brands_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."brands" validate constraint "brands_updated_by_fkey";

alter table "public"."customers" add constraint "customers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."customers" validate constraint "customers_created_by_fkey";

alter table "public"."customers" add constraint "customers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."customers" validate constraint "customers_updated_by_fkey";

alter table "public"."parts" add constraint "parts_cost_price_check" CHECK ((cost_price >= (0)::numeric)) not valid;

alter table "public"."parts" validate constraint "parts_cost_price_check";

alter table "public"."parts" add constraint "parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_created_by_fkey";

alter table "public"."parts" add constraint "parts_min_stock_level_check" CHECK ((min_stock_level >= 0)) not valid;

alter table "public"."parts" validate constraint "parts_min_stock_level_check";

alter table "public"."parts" add constraint "parts_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."parts" validate constraint "parts_price_check";

alter table "public"."parts" add constraint "parts_stock_quantity_check" CHECK ((stock_quantity >= 0)) not valid;

alter table "public"."parts" validate constraint "parts_stock_quantity_check";

alter table "public"."parts" add constraint "parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."parts" validate constraint "parts_updated_by_fkey";

alter table "public"."physical_products" add constraint "physical_products_current_ticket_id_fkey" FOREIGN KEY (current_ticket_id) REFERENCES public.service_tickets(id) ON DELETE SET NULL not valid;

alter table "public"."physical_products" validate constraint "physical_products_current_ticket_id_fkey";

alter table "public"."physical_products" add constraint "physical_products_last_known_customer_id_fkey" FOREIGN KEY (last_known_customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."physical_products" validate constraint "physical_products_last_known_customer_id_fkey";

alter table "public"."physical_products" add constraint "physical_products_physical_warehouse_id_fkey" FOREIGN KEY (physical_warehouse_id) REFERENCES public.physical_warehouses(id) ON DELETE SET NULL not valid;

alter table "public"."physical_products" validate constraint "physical_products_physical_warehouse_id_fkey";

alter table "public"."physical_products" add constraint "physical_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."physical_products" validate constraint "physical_products_product_id_fkey";

alter table "public"."physical_products" add constraint "physical_products_rma_batch_id_fkey" FOREIGN KEY (rma_batch_id) REFERENCES public.rma_batches(id) ON DELETE SET NULL not valid;

alter table "public"."physical_products" validate constraint "physical_products_rma_batch_id_fkey";

alter table "public"."physical_products" add constraint "physical_products_serial_unique" UNIQUE using index "physical_products_serial_unique";

alter table "public"."physical_warehouses" add constraint "physical_warehouses_code_key" UNIQUE using index "physical_warehouses_code_key";

alter table "public"."product_parts" add constraint "product_parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."product_parts" validate constraint "product_parts_created_by_fkey";

alter table "public"."product_parts" add constraint "product_parts_part_id_fkey" FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE not valid;

alter table "public"."product_parts" validate constraint "product_parts_part_id_fkey";

alter table "public"."product_parts" add constraint "product_parts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_parts" validate constraint "product_parts_product_id_fkey";

alter table "public"."product_parts" add constraint "product_parts_quantity_per_unit_check" CHECK ((quantity_per_unit > 0)) not valid;

alter table "public"."product_parts" validate constraint "product_parts_quantity_per_unit_check";

alter table "public"."product_parts" add constraint "product_parts_unique" UNIQUE using index "product_parts_unique";

alter table "public"."product_parts" add constraint "product_parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."product_parts" validate constraint "product_parts_updated_by_fkey";

alter table "public"."product_stock_thresholds" add constraint "product_stock_thresholds_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_stock_thresholds" validate constraint "product_stock_thresholds_product_id_fkey";

alter table "public"."product_stock_thresholds" add constraint "product_stock_thresholds_product_warehouse_unique" UNIQUE using index "product_stock_thresholds_product_warehouse_unique";

alter table "public"."product_stock_thresholds" add constraint "product_stock_thresholds_quantities_valid" CHECK (((minimum_quantity >= 0) AND ((reorder_quantity IS NULL) OR (reorder_quantity >= minimum_quantity)) AND ((maximum_quantity IS NULL) OR (maximum_quantity >= minimum_quantity)))) not valid;

alter table "public"."product_stock_thresholds" validate constraint "product_stock_thresholds_quantities_valid";

alter table "public"."product_warehouse_stock" add constraint "declared_quantity_non_negative" CHECK ((declared_quantity >= 0)) not valid;

alter table "public"."product_warehouse_stock" validate constraint "declared_quantity_non_negative";

alter table "public"."product_warehouse_stock" add constraint "initial_stock_non_negative" CHECK ((initial_stock_entry >= 0)) not valid;

alter table "public"."product_warehouse_stock" validate constraint "initial_stock_non_negative";

alter table "public"."product_warehouse_stock" add constraint "product_warehouse_stock_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."product_warehouse_stock" validate constraint "product_warehouse_stock_product_id_fkey";

alter table "public"."product_warehouse_stock" add constraint "product_warehouse_stock_unique" UNIQUE using index "product_warehouse_stock_unique";

alter table "public"."product_warehouse_stock" add constraint "product_warehouse_stock_virtual_warehouse_id_fkey" FOREIGN KEY (virtual_warehouse_id) REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."product_warehouse_stock" validate constraint "product_warehouse_stock_virtual_warehouse_id_fkey";

alter table "public"."products" add constraint "products_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES public.brands(id) not valid;

alter table "public"."products" validate constraint "products_brand_id_fkey";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."products" add constraint "products_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."products" validate constraint "products_updated_by_fkey";

alter table "public"."products" add constraint "products_warranty_period_months_check" CHECK ((warranty_period_months >= 0)) not valid;

alter table "public"."products" validate constraint "products_warranty_period_months_check";

alter table "public"."profiles" add constraint "profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."profiles" validate constraint "profiles_updated_by_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_key" UNIQUE using index "profiles_user_id_key";

alter table "public"."rma_batches" add constraint "rma_batches_batch_number_key" UNIQUE using index "rma_batches_batch_number_key";

alter table "public"."rma_batches" add constraint "rma_batches_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."rma_batches" validate constraint "rma_batches_created_by_id_fkey";

alter table "public"."service_request_items" add constraint "service_request_items_request_id_fkey" FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE not valid;

alter table "public"."service_request_items" validate constraint "service_request_items_request_id_fkey";

alter table "public"."service_request_items" add constraint "service_request_items_serial_format" CHECK ((length((serial_number)::text) >= 5)) not valid;

alter table "public"."service_request_items" validate constraint "service_request_items_serial_format";

alter table "public"."service_request_items" add constraint "service_request_items_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE SET NULL not valid;

alter table "public"."service_request_items" validate constraint "service_request_items_ticket_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_rejected_requires_reason" CHECK (((status <> 'cancelled'::public.request_status) OR (rejection_reason IS NOT NULL))) not valid;

alter table "public"."service_requests" validate constraint "service_requests_rejected_requires_reason";

alter table "public"."service_requests" add constraint "service_requests_reviewed_by_id_fkey" FOREIGN KEY (reviewed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."service_requests" validate constraint "service_requests_reviewed_by_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_tracking_token_key" UNIQUE using index "service_requests_tracking_token_key";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_ticket_attachments" validate constraint "service_ticket_attachments_created_by_fkey";

alter table "public"."service_ticket_attachments" add constraint "service_ticket_attachments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_attachments" validate constraint "service_ticket_attachments_ticket_id_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_created_by_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_ticket_id_fkey";

alter table "public"."service_ticket_comments" add constraint "service_ticket_comments_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_ticket_comments" validate constraint "service_ticket_comments_updated_by_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_created_by_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_part_id_fkey" FOREIGN KEY (part_id) REFERENCES public.parts(id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_part_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_quantity_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_ticket_id_fkey";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unique" UNIQUE using index "service_ticket_parts_unique";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_unit_price_check";

alter table "public"."service_ticket_parts" add constraint "service_ticket_parts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_ticket_parts" validate constraint "service_ticket_parts_updated_by_fkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_assigned_to_id_fkey" FOREIGN KEY (assigned_to_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_assigned_to_id_fkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_blocked_requires_reason" CHECK (((status <> 'blocked'::public.task_status) OR (blocked_reason IS NOT NULL))) not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_blocked_requires_reason";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_completed_requires_notes" CHECK (((status <> 'completed'::public.task_status) OR (completion_notes IS NOT NULL))) not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_completed_requires_notes";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_sequence_positive" CHECK ((sequence_order > 0)) not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_sequence_positive";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_task_type_id_fkey" FOREIGN KEY (task_type_id) REFERENCES public.task_types(id) ON DELETE RESTRICT not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_task_type_id_fkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_template_task_id_fkey" FOREIGN KEY (template_task_id) REFERENCES public.task_templates_tasks(id) ON DELETE SET NULL not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_template_task_id_fkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."service_ticket_tasks" validate constraint "service_ticket_tasks_ticket_id_fkey";

alter table "public"."service_ticket_tasks" add constraint "service_ticket_tasks_ticket_sequence_unique" UNIQUE using index "service_ticket_tasks_ticket_sequence_unique";

alter table "public"."service_tickets" add constraint "service_tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_assigned_to_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_created_by_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_customer_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_dates_check" CHECK (((completed_at IS NULL) OR (started_at IS NULL) OR (completed_at >= started_at))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_dates_check";

alter table "public"."service_tickets" add constraint "service_tickets_delivery_requires_address" CHECK (((delivery_method <> 'delivery'::public.delivery_method) OR (delivery_address IS NOT NULL))) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_delivery_requires_address";

alter table "public"."service_tickets" add constraint "service_tickets_diagnosis_fee_check" CHECK ((diagnosis_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_diagnosis_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_discount_amount_check" CHECK ((discount_amount >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_discount_amount_check";

alter table "public"."service_tickets" add constraint "service_tickets_parts_total_check" CHECK ((parts_total >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_parts_total_check";

alter table "public"."service_tickets" add constraint "service_tickets_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_product_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_request_id_fkey" FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE SET NULL not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_request_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_service_fee_check" CHECK ((service_fee >= (0)::numeric)) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_service_fee_check";

alter table "public"."service_tickets" add constraint "service_tickets_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_template_id_fkey";

alter table "public"."service_tickets" add constraint "service_tickets_ticket_number_key" UNIQUE using index "service_tickets_ticket_number_key";

alter table "public"."service_tickets" add constraint "service_tickets_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."service_tickets" validate constraint "service_tickets_updated_by_fkey";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_uploaded_by_id_fkey" FOREIGN KEY (uploaded_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_uploaded_by_id_fkey";

alter table "public"."stock_issue_items" add constraint "issue_items_quantity_not_zero" CHECK ((quantity <> 0)) not valid;

alter table "public"."stock_issue_items" validate constraint "issue_items_quantity_not_zero";

alter table "public"."stock_issue_items" add constraint "stock_issue_items_issue_id_fkey" FOREIGN KEY (issue_id) REFERENCES public.stock_issues(id) ON DELETE CASCADE not valid;

alter table "public"."stock_issue_items" validate constraint "stock_issue_items_issue_id_fkey";

alter table "public"."stock_issue_items" add constraint "stock_issue_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_issue_items" validate constraint "stock_issue_items_product_id_fkey";

alter table "public"."stock_issue_serials" add constraint "issue_serials_unique" UNIQUE using index "issue_serials_unique";

alter table "public"."stock_issue_serials" add constraint "stock_issue_serials_issue_item_id_fkey" FOREIGN KEY (issue_item_id) REFERENCES public.stock_issue_items(id) ON DELETE CASCADE not valid;

alter table "public"."stock_issue_serials" validate constraint "stock_issue_serials_issue_item_id_fkey";

alter table "public"."stock_issue_serials" add constraint "stock_issue_serials_physical_product_id_fkey" FOREIGN KEY (physical_product_id) REFERENCES public.physical_products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_issue_serials" validate constraint "stock_issue_serials_physical_product_id_fkey";

alter table "public"."stock_issues" add constraint "issue_approved_requires_approver" CHECK (((status <> 'approved'::public.stock_document_status) OR (approved_by_id IS NOT NULL))) not valid;

alter table "public"."stock_issues" validate constraint "issue_approved_requires_approver";

alter table "public"."stock_issues" add constraint "issue_completed_requires_completer" CHECK (((status <> 'completed'::public.stock_document_status) OR (completed_by_id IS NOT NULL))) not valid;

alter table "public"."stock_issues" validate constraint "issue_completed_requires_completer";

alter table "public"."stock_issues" add constraint "stock_issues_approved_by_id_fkey" FOREIGN KEY (approved_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_approved_by_id_fkey";

alter table "public"."stock_issues" add constraint "stock_issues_completed_by_id_fkey" FOREIGN KEY (completed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_completed_by_id_fkey";

alter table "public"."stock_issues" add constraint "stock_issues_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_created_by_id_fkey";

alter table "public"."stock_issues" add constraint "stock_issues_issue_number_key" UNIQUE using index "stock_issues_issue_number_key";

alter table "public"."stock_issues" add constraint "stock_issues_rma_batch_id_fkey" FOREIGN KEY (rma_batch_id) REFERENCES public.rma_batches(id) ON DELETE SET NULL not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_rma_batch_id_fkey";

alter table "public"."stock_issues" add constraint "stock_issues_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE SET NULL not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_ticket_id_fkey";

alter table "public"."stock_issues" add constraint "stock_issues_virtual_warehouse_id_fkey" FOREIGN KEY (virtual_warehouse_id) REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_issues" validate constraint "stock_issues_virtual_warehouse_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_from_physical_warehouse_id_fkey" FOREIGN KEY (from_physical_warehouse_id) REFERENCES public.physical_warehouses(id) ON DELETE SET NULL not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_from_physical_warehouse_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_moved_by_id_fkey" FOREIGN KEY (moved_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_moved_by_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_physical_product_id_fkey" FOREIGN KEY (physical_product_id) REFERENCES public.physical_products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_physical_product_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE SET NULL not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_ticket_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_to_physical_warehouse_id_fkey" FOREIGN KEY (to_physical_warehouse_id) REFERENCES public.physical_warehouses(id) ON DELETE SET NULL not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_to_physical_warehouse_id_fkey";

alter table "public"."stock_movements" add constraint "stock_movements_virtual_warehouse_changed" CHECK (((from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse) OR (from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id))) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_virtual_warehouse_changed";

alter table "public"."stock_receipt_items" add constraint "receipt_items_quantity_not_zero" CHECK ((declared_quantity <> 0)) not valid;

alter table "public"."stock_receipt_items" validate constraint "receipt_items_quantity_not_zero";

alter table "public"."stock_receipt_items" add constraint "receipt_items_serial_count_valid" CHECK (((serial_count >= 0) AND (serial_count <= abs(declared_quantity)))) not valid;

alter table "public"."stock_receipt_items" validate constraint "receipt_items_serial_count_valid";

alter table "public"."stock_receipt_items" add constraint "stock_receipt_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_receipt_items" validate constraint "stock_receipt_items_product_id_fkey";

alter table "public"."stock_receipt_items" add constraint "stock_receipt_items_receipt_id_fkey" FOREIGN KEY (receipt_id) REFERENCES public.stock_receipts(id) ON DELETE CASCADE not valid;

alter table "public"."stock_receipt_items" validate constraint "stock_receipt_items_receipt_id_fkey";

alter table "public"."stock_receipt_serials" add constraint "receipt_serials_unique" UNIQUE using index "receipt_serials_unique";

alter table "public"."stock_receipt_serials" add constraint "stock_receipt_serials_physical_product_id_fkey" FOREIGN KEY (physical_product_id) REFERENCES public.physical_products(id) ON DELETE SET NULL not valid;

alter table "public"."stock_receipt_serials" validate constraint "stock_receipt_serials_physical_product_id_fkey";

alter table "public"."stock_receipt_serials" add constraint "stock_receipt_serials_receipt_item_id_fkey" FOREIGN KEY (receipt_item_id) REFERENCES public.stock_receipt_items(id) ON DELETE CASCADE not valid;

alter table "public"."stock_receipt_serials" validate constraint "stock_receipt_serials_receipt_item_id_fkey";

alter table "public"."stock_receipts" add constraint "receipt_approved_requires_approver" CHECK (((status <> 'approved'::public.stock_document_status) OR (approved_by_id IS NOT NULL))) not valid;

alter table "public"."stock_receipts" validate constraint "receipt_approved_requires_approver";

alter table "public"."stock_receipts" add constraint "receipt_completed_requires_completer" CHECK (((status <> 'completed'::public.stock_document_status) OR (completed_by_id IS NOT NULL))) not valid;

alter table "public"."stock_receipts" validate constraint "receipt_completed_requires_completer";

alter table "public"."stock_receipts" add constraint "stock_receipts_approved_by_id_fkey" FOREIGN KEY (approved_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_receipts" validate constraint "stock_receipts_approved_by_id_fkey";

alter table "public"."stock_receipts" add constraint "stock_receipts_completed_by_id_fkey" FOREIGN KEY (completed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_receipts" validate constraint "stock_receipts_completed_by_id_fkey";

alter table "public"."stock_receipts" add constraint "stock_receipts_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_receipts" validate constraint "stock_receipts_created_by_id_fkey";

alter table "public"."stock_receipts" add constraint "stock_receipts_receipt_number_key" UNIQUE using index "stock_receipts_receipt_number_key";

alter table "public"."stock_receipts" add constraint "stock_receipts_rma_batch_id_fkey" FOREIGN KEY (rma_batch_id) REFERENCES public.rma_batches(id) ON DELETE SET NULL not valid;

alter table "public"."stock_receipts" validate constraint "stock_receipts_rma_batch_id_fkey";

alter table "public"."stock_receipts" add constraint "stock_receipts_virtual_warehouse_id_fkey" FOREIGN KEY (virtual_warehouse_id) REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_receipts" validate constraint "stock_receipts_virtual_warehouse_id_fkey";

alter table "public"."stock_transfer_items" add constraint "stock_transfer_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_transfer_items" validate constraint "stock_transfer_items_product_id_fkey";

alter table "public"."stock_transfer_items" add constraint "stock_transfer_items_transfer_id_fkey" FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id) ON DELETE CASCADE not valid;

alter table "public"."stock_transfer_items" validate constraint "stock_transfer_items_transfer_id_fkey";

alter table "public"."stock_transfer_items" add constraint "transfer_items_quantity_positive" CHECK ((quantity > 0)) not valid;

alter table "public"."stock_transfer_items" validate constraint "transfer_items_quantity_positive";

alter table "public"."stock_transfer_serials" add constraint "stock_transfer_serials_physical_product_id_fkey" FOREIGN KEY (physical_product_id) REFERENCES public.physical_products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_transfer_serials" validate constraint "stock_transfer_serials_physical_product_id_fkey";

alter table "public"."stock_transfer_serials" add constraint "stock_transfer_serials_transfer_item_id_fkey" FOREIGN KEY (transfer_item_id) REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE not valid;

alter table "public"."stock_transfer_serials" validate constraint "stock_transfer_serials_transfer_item_id_fkey";

alter table "public"."stock_transfer_serials" add constraint "transfer_serials_unique" UNIQUE using index "transfer_serials_unique";

alter table "public"."stock_transfers" add constraint "stock_transfers_approved_by_id_fkey" FOREIGN KEY (approved_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_approved_by_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_created_by_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_customer_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_from_virtual_warehouse_id_fkey" FOREIGN KEY (from_virtual_warehouse_id) REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_from_virtual_warehouse_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_generated_issue_id_fkey" FOREIGN KEY (generated_issue_id) REFERENCES public.stock_issues(id) ON DELETE SET NULL not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_generated_issue_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_generated_receipt_id_fkey" FOREIGN KEY (generated_receipt_id) REFERENCES public.stock_receipts(id) ON DELETE SET NULL not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_generated_receipt_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_received_by_id_fkey" FOREIGN KEY (received_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_received_by_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_to_virtual_warehouse_id_fkey" FOREIGN KEY (to_virtual_warehouse_id) REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_transfers" validate constraint "stock_transfers_to_virtual_warehouse_id_fkey";

alter table "public"."stock_transfers" add constraint "stock_transfers_transfer_number_key" UNIQUE using index "stock_transfers_transfer_number_key";

alter table "public"."stock_transfers" add constraint "transfer_approved_requires_approver" CHECK (((status <> 'approved'::public.transfer_status) OR (approved_by_id IS NOT NULL))) not valid;

alter table "public"."stock_transfers" validate constraint "transfer_approved_requires_approver";

alter table "public"."stock_transfers" add constraint "transfer_warehouses_different" CHECK ((from_virtual_warehouse_id <> to_virtual_warehouse_id)) not valid;

alter table "public"."stock_transfers" validate constraint "transfer_warehouses_different";

alter table "public"."task_history" add constraint "task_history_changed_by_id_fkey" FOREIGN KEY (changed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."task_history" validate constraint "task_history_changed_by_id_fkey";

alter table "public"."task_history" add constraint "task_history_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.service_ticket_tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_history" validate constraint "task_history_task_id_fkey";

alter table "public"."task_history" add constraint "task_history_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."task_history" validate constraint "task_history_ticket_id_fkey";

alter table "public"."task_templates" add constraint "task_templates_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."task_templates" validate constraint "task_templates_created_by_id_fkey";

alter table "public"."task_templates" add constraint "task_templates_name_unique" UNIQUE using index "task_templates_name_unique";

alter table "public"."task_templates" add constraint "task_templates_product_type_fkey" FOREIGN KEY (product_type) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."task_templates" validate constraint "task_templates_product_type_fkey";

alter table "public"."task_templates_tasks" add constraint "task_templates_tasks_sequence_positive" CHECK ((sequence_order > 0)) not valid;

alter table "public"."task_templates_tasks" validate constraint "task_templates_tasks_sequence_positive";

alter table "public"."task_templates_tasks" add constraint "task_templates_tasks_task_type_id_fkey" FOREIGN KEY (task_type_id) REFERENCES public.task_types(id) ON DELETE RESTRICT not valid;

alter table "public"."task_templates_tasks" validate constraint "task_templates_tasks_task_type_id_fkey";

alter table "public"."task_templates_tasks" add constraint "task_templates_tasks_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE not valid;

alter table "public"."task_templates_tasks" validate constraint "task_templates_tasks_template_id_fkey";

alter table "public"."task_templates_tasks" add constraint "task_templates_tasks_template_sequence_unique" UNIQUE using index "task_templates_tasks_template_sequence_unique";

alter table "public"."task_types" add constraint "task_types_name_unique" UNIQUE using index "task_types_name_unique";

alter table "public"."ticket_template_changes" add constraint "ticket_template_changes_changed_by_id_fkey" FOREIGN KEY (changed_by_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."ticket_template_changes" validate constraint "ticket_template_changes_changed_by_id_fkey";

alter table "public"."ticket_template_changes" add constraint "ticket_template_changes_new_template_id_fkey" FOREIGN KEY (new_template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL not valid;

alter table "public"."ticket_template_changes" validate constraint "ticket_template_changes_new_template_id_fkey";

alter table "public"."ticket_template_changes" add constraint "ticket_template_changes_old_template_id_fkey" FOREIGN KEY (old_template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL not valid;

alter table "public"."ticket_template_changes" validate constraint "ticket_template_changes_old_template_id_fkey";

alter table "public"."ticket_template_changes" add constraint "ticket_template_changes_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."ticket_template_changes" validate constraint "ticket_template_changes_ticket_id_fkey";

alter table "public"."virtual_warehouses" add constraint "virtual_warehouses_physical_warehouse_id_fkey" FOREIGN KEY (physical_warehouse_id) REFERENCES public.physical_warehouses(id) ON DELETE CASCADE not valid;

alter table "public"."virtual_warehouses" validate constraint "virtual_warehouses_physical_warehouse_id_fkey";

alter table "public"."virtual_warehouses" add constraint "virtual_warehouses_warehouse_type_unique" UNIQUE using index "virtual_warehouses_warehouse_type_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_complete_service_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_request_id UUID;
  v_all_completed BOOLEAN;
BEGIN
  -- Get the request_id from the ticket
  v_request_id := NEW.request_id;

  -- If ticket is not linked to a request, skip
  IF v_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if all tickets for this request are completed or cancelled
  SELECT bool_and(st.status IN ('completed', 'cancelled'))
  INTO v_all_completed
  FROM public.service_request_items sri
  LEFT JOIN public.service_tickets st ON st.id = sri.ticket_id
  WHERE sri.request_id = v_request_id;

  -- If all tickets are done, mark request as completed
  IF v_all_completed THEN
    UPDATE public.service_requests
    SET status = 'completed'
    WHERE id = v_request_id AND status != 'completed';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_complete_transfer_documents()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.generated_issue_id IS NOT NULL THEN
      UPDATE public.stock_issues
      SET status = 'completed', completed_by_id = NEW.received_by_id, completed_at = NEW.completed_at
      WHERE id = NEW.generated_issue_id;
    END IF;

    IF NEW.generated_receipt_id IS NOT NULL THEN
      UPDATE public.stock_receipts
      SET status = 'completed', completed_by_id = NEW.received_by_id, completed_at = NEW.completed_at
      WHERE id = NEW.generated_receipt_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_create_tickets_on_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_customer_id UUID;
  v_product_id UUID;
  v_ticket_id UUID;
  v_item RECORD;
BEGIN
  -- Only trigger when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status IN ('submitted', 'pickingup')) THEN

    -- Find or create customer
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE email = NEW.customer_email
    LIMIT 1;

    -- If customer doesn't exist, create one
    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (
        name,
        email,
        phone,
        created_by_id
      ) VALUES (
        NEW.customer_name,
        NEW.customer_email,
        NEW.customer_phone,
        NEW.reviewed_by_id
      )
      RETURNING id INTO v_customer_id;
    END IF;

    -- Create a ticket for each item in the request
    FOR v_item IN
      SELECT * FROM public.service_request_items
      WHERE request_id = NEW.id AND ticket_id IS NULL
    LOOP
      -- Find product_id from serial_number
      v_product_id := NULL;

      SELECT product_id INTO v_product_id
      FROM public.physical_products
      WHERE serial_number = v_item.serial_number
      LIMIT 1;

      -- Skip if product not found
      IF v_product_id IS NULL THEN
        RAISE NOTICE 'Product not found for serial number: %', v_item.serial_number;
        CONTINUE;
      END IF;

      -- Create service ticket
      INSERT INTO public.service_tickets (
        customer_id,
        product_id,
        issue_description,
        status,
        request_id,
        created_by_id
      ) VALUES (
        v_customer_id,
        v_product_id,
        COALESCE(v_item.issue_description, NEW.issue_description),
        'pending',
        NEW.id,
        NEW.reviewed_by_id
      )
      RETURNING id INTO v_ticket_id;

      -- Link ticket back to item
      UPDATE public.service_request_items
      SET ticket_id = v_ticket_id
      WHERE id = v_item.id;

      -- Add initial comment
      INSERT INTO public.service_ticket_comments (
        ticket_id,
        comment,
        created_by_id
      ) VALUES (
        v_ticket_id,
        format('Auto-created from service request %s - Serial: %s',
          NEW.tracking_token,
          v_item.serial_number
        ),
        NEW.reviewed_by_id
      );

    END LOOP;

    -- Update request status to processing
    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_generate_transfer_documents()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_issue_id UUID;
  v_receipt_id UUID;
  v_transfer_item RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.generated_issue_id IS NULL THEN

    -- Create Issue Document
    INSERT INTO public.stock_issues (
      issue_type, status, virtual_warehouse_id, issue_date,
      reference_document_number, created_by_id, approved_by_id,
      approved_at, auto_generated, notes
    ) VALUES (
      'normal', 'approved', NEW.from_virtual_warehouse_id, NEW.transfer_date,
      'PC-' || NEW.transfer_number, NEW.created_by_id, NEW.approved_by_id,
      NEW.approved_at, true, 'Phiếu xuất tự động từ ' || NEW.transfer_number
    ) RETURNING id INTO v_issue_id;

    -- Create Receipt Document
    INSERT INTO public.stock_receipts (
      receipt_type, status, virtual_warehouse_id, receipt_date,
      reference_document_number, created_by_id, approved_by_id,
      approved_at, notes
    ) VALUES (
      'normal', 'approved', NEW.to_virtual_warehouse_id, NEW.transfer_date,
      'PC-' || NEW.transfer_number, NEW.created_by_id, NEW.approved_by_id,
      NEW.approved_at, 'Phiếu nhập tự động từ ' || NEW.transfer_number
    ) RETURNING id INTO v_receipt_id;

    -- Copy items
    FOR v_transfer_item IN
      SELECT product_id, quantity, notes
      FROM public.stock_transfer_items
      WHERE transfer_id = NEW.id
    LOOP
      INSERT INTO public.stock_issue_items (issue_id, product_id, quantity, notes)
      VALUES (v_issue_id, v_transfer_item.product_id, v_transfer_item.quantity, v_transfer_item.notes);

      INSERT INTO public.stock_receipt_items (receipt_id, product_id, declared_quantity, notes)
      VALUES (v_receipt_id, v_transfer_item.product_id, v_transfer_item.quantity, v_transfer_item.notes);
    END LOOP;

    -- Copy serials
    INSERT INTO public.stock_issue_serials (issue_item_id, physical_product_id, serial_number)
    SELECT sii.id, sts.physical_product_id, sts.serial_number
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_issue_items sii ON sii.issue_id = v_issue_id AND sii.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    INSERT INTO public.stock_receipt_serials (receipt_item_id, serial_number, physical_product_id)
    SELECT sri.id, sts.serial_number, sts.physical_product_id
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_receipt_items sri ON sri.receipt_id = v_receipt_id AND sri.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    NEW.generated_issue_id := v_issue_id;
    NEW.generated_receipt_id := v_receipt_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_warranty_end_date(p_start_date date, p_warranty_months integer)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
BEGIN
  IF p_start_date IS NULL OR p_warranty_months IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_start_date + (p_warranty_months || ' months')::INTERVAL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_virtual_warehouse()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Create a default "Main Storage" virtual warehouse for the new physical warehouse
  INSERT INTO public.virtual_warehouses (
    warehouse_type,
    name,
    description,
    physical_warehouse_id,
    is_active
  ) VALUES (
    'main', -- Default type for main storage (updated 2025-10-29 - Gap 1 fix)
    NEW.name || ' - Kho Chính',
    'Kho chính của ' || NEW.name,
    NEW.id,
    NEW.is_active
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_physical_product_from_receipt_serial()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
BEGIN
  -- Get product_id and virtual_warehouse_id from receipt
  SELECT
    sri.product_id,
    sr.virtual_warehouse_id
  INTO
    v_product_id,
    v_virtual_warehouse_id
  FROM stock_receipt_items sri
  JOIN stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  -- Create physical product
  INSERT INTO public.physical_products (
    product_id,
    serial_number,
    virtual_warehouse_id,
    condition,
    manufacturer_warranty_end_date,
    user_warranty_end_date
  ) VALUES (
    v_product_id,
    NEW.serial_number,
    v_virtual_warehouse_id,
    'new',
    NEW.manufacturer_warranty_end_date,
    NEW.user_warranty_end_date
  )
  RETURNING id INTO v_physical_product_id;

  -- Update serial record with physical_product_id
  NEW.physical_product_id := v_physical_product_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.decrease_part_stock(p_part_id uuid, p_quantity_to_decrease integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - p_quantity_to_decrease,
    updated_at = now()
  WHERE
    id = p_part_id
    AND stock_quantity >= p_quantity_to_decrease;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      p_part_id,
      coalesce((SELECT stock_quantity FROM public.parts WHERE id = p_part_id), 0),
      p_quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_physical_product_on_issue()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Delete the physical product (it's being issued out)
  DELETE FROM public.physical_products
  WHERE id = NEW.physical_product_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_issue_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.issue_number IS NULL THEN
    NEW.issue_number := 'PX-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('issue_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'PN-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('receipt_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_rma_batch_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INT;
BEGIN
  IF NEW.batch_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.rma_batches
  WHERE batch_number LIKE 'RMA-' || v_year || '-' || v_month || '-%';
  NEW.batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  current_year text;
  next_number integer;
  new_ticket_number text;
begin
  current_year := to_char(now(), 'YYYY');
  select coalesce(max((regexp_match(ticket_number, 'SV-' || current_year || '-(\d+)'))[1]::integer), 0) + 1
  into next_number
  from public.service_tickets
  where ticket_number ~ ('SV-' || current_year || '-\d+');
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');
  return new_ticket_number;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_token VARCHAR(15);
  v_characters VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_token_exists BOOLEAN;
  v_max_attempts INT := 100;
  v_attempt INT := 0;
BEGIN
  IF NEW.tracking_token IS NOT NULL THEN
    RETURN NEW;
  END IF;
  LOOP
    v_token := 'SR-';
    FOR i IN 1..12 LOOP
      v_token := v_token || SUBSTRING(v_characters FROM (FLOOR(RANDOM() * 36) + 1)::INT FOR 1);
    END LOOP;
    SELECT EXISTS(
      SELECT 1 FROM public.service_requests WHERE tracking_token = v_token
    ) INTO v_token_exists;
    EXIT WHEN NOT v_token_exists;
    v_attempt := v_attempt + 1;
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique tracking token after % attempts', v_max_attempts;
    END IF;
  END LOOP;
  NEW.tracking_token := v_token;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_transfer_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'PC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('transfer_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role::TEXT
  FROM public.profiles
  WHERE user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_warranty_status(p_warranty_end_date date)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE
  v_days_remaining INT;
BEGIN
  IF p_warranty_end_date IS NULL THEN
    RETURN 'unknown';
  END IF;
  v_days_remaining := p_warranty_end_date - CURRENT_DATE;
  IF v_days_remaining < 0 THEN
    RETURN 'expired';
  ELSIF v_days_remaining <= 30 THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'active';
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role::TEXT = ANY(required_roles)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role::TEXT = required_role
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increase_part_stock(p_part_id uuid, p_quantity_to_increase integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + p_quantity_to_increase,
    updated_at = now()
  WHERE id = p_part_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', p_part_id;
  END IF;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role in ('admin', 'manager')
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_manager_or_above()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN public.has_any_role(ARRAY['admin', 'manager']);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_reception()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN public.has_role('reception');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_technician()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN public.has_role('technician');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit(p_action text, p_resource_type text, p_resource_id text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_reason text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_audit_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
  v_changes JSONB;
BEGIN
  -- Get user info from profiles
  SELECT p.role::TEXT, u.email
  INTO v_user_role, v_user_email
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = auth.uid();

  -- If user not found (shouldn't happen), use defaults
  IF v_user_role IS NULL THEN
    v_user_role := 'unknown';
    v_user_email := 'unknown@system';
  END IF;

  -- Compute changes (simple diff - can be enhanced)
  -- This creates a JSONB object with only changed fields
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    v_changes := jsonb_object_agg(
      key,
      jsonb_build_object('old', p_old_values->key, 'new', p_new_values->key)
    )
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->key IS DISTINCT FROM p_new_values->key;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_role,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    changes,
    reason,
    metadata
  ) VALUES (
    auth.uid(),
    v_user_role,
    v_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    v_changes,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into public.service_ticket_comments (ticket_id, comment, comment_type, is_internal, created_by)
    values (new.id, 'Status changed from "' || old.status || '" to "' || new.status || '"', 'status_change', false, coalesce(new.updated_by, (select auth.uid())));
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.log_template_switch(p_ticket_id uuid, p_old_template_id uuid, p_new_template_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_audit_id UUID;
  v_old_template_name TEXT;
  v_new_template_name TEXT;
BEGIN
  -- Validate reason (must be at least 10 characters)
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Template switch requires a detailed reason (minimum 10 characters)'
      USING HINT = 'Please provide a clear explanation for why the template is being changed.';
  END IF;

  -- Get template names for better audit trail
  SELECT name INTO v_old_template_name
  FROM public.task_templates
  WHERE id = p_old_template_id;

  SELECT name INTO v_new_template_name
  FROM public.task_templates
  WHERE id = p_new_template_id;

  -- Log the action
  v_audit_id := public.log_audit(
    p_action := 'template_switch',
    p_resource_type := 'ticket',
    p_resource_id := p_ticket_id::TEXT,
    p_old_values := jsonb_build_object(
      'template_id', p_old_template_id,
      'template_name', v_old_template_name
    ),
    p_new_values := jsonb_build_object(
      'template_id', p_new_template_id,
      'template_name', v_new_template_name
    ),
    p_reason := p_reason
  );

  -- Also insert into ticket_template_changes for backward compatibility
  INSERT INTO public.ticket_template_changes (
    ticket_id,
    old_template_id,
    new_template_id,
    reason,
    changed_by_id
  ) VALUES (
    p_ticket_id,
    p_old_template_id,
    p_new_template_id,
    p_reason,
    auth.uid()
  );

  RETURN v_audit_id;
END;
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
   FROM (public.service_ticket_comments c
     LEFT JOIN public.profiles p ON ((p.user_id = c.created_by)))
  ORDER BY c.created_at DESC;


CREATE OR REPLACE FUNCTION public.set_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := public.generate_ticket_number();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_default_virtual_warehouse_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the default virtual warehouse name when physical warehouse name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE public.virtual_warehouses
    SET
      name = NEW.name || ' - Kho Chính',
      description = 'Kho chính của ' || NEW.name
    WHERE physical_warehouse_id = NEW.id
      AND name = OLD.name || ' - Kho Chính'; -- Only update the default one
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_physical_product_warehouse_on_transfer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
BEGIN
  -- Get source and destination warehouse IDs
  SELECT
    st.from_virtual_warehouse_id,
    st.to_virtual_warehouse_id
  INTO
    v_from_warehouse_id,
    v_to_warehouse_id
  FROM stock_transfer_items sti
  JOIN stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  -- Update physical product location
  UPDATE public.physical_products
  SET
    previous_virtual_warehouse_id = v_from_warehouse_id,
    virtual_warehouse_id = v_to_warehouse_id,
    updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_service_ticket_parts_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.update_stock_on_issue_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_item RECORD;
BEGIN
  -- Only trigger when transitioning to approved status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    -- Update stock for each item in the issue
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.stock_issue_items
      WHERE issue_id = NEW.id
    LOOP
      -- Decrement stock (multiply by -1, quantity can be negative for adjustments)
      PERFORM public.upsert_product_stock(
        v_item.product_id,
        NEW.virtual_warehouse_id,
        -1 * v_item.quantity
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_stock_on_receipt_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_item RECORD;
BEGIN
  -- Only trigger when transitioning to approved status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    -- Update stock for each item in the receipt
    FOR v_item IN
      SELECT product_id, declared_quantity
      FROM public.stock_receipt_items
      WHERE receipt_id = NEW.id
    LOOP
      -- Increment stock (declared_quantity can be negative for adjustments)
      PERFORM public.upsert_product_stock(
        v_item.product_id,
        NEW.virtual_warehouse_id,
        v_item.declared_quantity
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
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

CREATE OR REPLACE FUNCTION public.upsert_product_stock(p_product_id uuid, p_warehouse_id uuid, p_quantity_delta integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert or update stock record
  INSERT INTO public.product_warehouse_stock (
    product_id,
    virtual_warehouse_id,
    declared_quantity,
    initial_stock_entry
  ) VALUES (
    p_product_id,
    p_warehouse_id,
    p_quantity_delta,
    0
  )
  ON CONFLICT (product_id, virtual_warehouse_id)
  DO UPDATE SET
    declared_quantity = public.product_warehouse_stock.declared_quantity + p_quantity_delta,
    updated_at = NOW();
END;
$function$
;

create or replace view "public"."v_low_stock_alerts" as  SELECT p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    b.name AS brand_name,
    pst.warehouse_type,
    pst.minimum_quantity,
    pst.reorder_quantity,
    pst.maximum_quantity,
    COALESCE(stock.quantity, (0)::bigint) AS current_quantity,
    (pst.minimum_quantity - COALESCE(stock.quantity, (0)::bigint)) AS quantity_below_minimum,
    pst.alert_enabled,
    pst.last_alert_sent_at,
    pst.created_at AS threshold_created_at,
    pst.updated_at AS threshold_updated_at
   FROM (((public.product_stock_thresholds pst
     JOIN public.products p ON ((pst.product_id = p.id)))
     JOIN public.brands b ON ((p.brand_id = b.id)))
     LEFT JOIN ( SELECT physical_products.product_id,
            physical_products.virtual_warehouse_type,
            count(*) AS quantity
           FROM public.physical_products
          GROUP BY physical_products.product_id, physical_products.virtual_warehouse_type) stock ON (((stock.product_id = p.id) AND (stock.virtual_warehouse_type = pst.warehouse_type))))
  WHERE ((pst.alert_enabled = true) AND (COALESCE(stock.quantity, (0)::bigint) < pst.minimum_quantity))
  ORDER BY (pst.minimum_quantity - COALESCE(stock.quantity, (0)::bigint)) DESC, b.name, p.name;


create or replace view "public"."v_stock_movement_history" as  SELECT sm.id AS movement_id,
    sm.movement_type,
    sm.created_at AS moved_at,
    pp.id AS physical_product_id,
    pp.serial_number,
    pp.condition,
    p.name AS product_name,
    p.sku AS product_sku,
    b.name AS brand_name,
    sm.from_virtual_warehouse,
    fw.name AS from_physical_warehouse_name,
    fw.code AS from_physical_warehouse_code,
    sm.to_virtual_warehouse,
    tw.name AS to_physical_warehouse_name,
    tw.code AS to_physical_warehouse_code,
    sm.ticket_id,
    st.ticket_number,
    st.status AS ticket_status,
    sm.reason,
    sm.notes,
    sm.moved_by_id,
    prof.full_name AS moved_by_name,
    prof.role AS moved_by_role
   FROM (((((((public.stock_movements sm
     JOIN public.physical_products pp ON ((sm.physical_product_id = pp.id)))
     JOIN public.products p ON ((pp.product_id = p.id)))
     JOIN public.brands b ON ((p.brand_id = b.id)))
     LEFT JOIN public.physical_warehouses fw ON ((sm.from_physical_warehouse_id = fw.id)))
     LEFT JOIN public.physical_warehouses tw ON ((sm.to_physical_warehouse_id = tw.id)))
     LEFT JOIN public.service_tickets st ON ((sm.ticket_id = st.id)))
     LEFT JOIN public.profiles prof ON ((sm.moved_by_id = prof.id)))
  ORDER BY sm.created_at DESC;


create or replace view "public"."v_task_progress_summary" as  SELECT st.id AS ticket_id,
    st.ticket_number,
    st.status AS ticket_status,
    tt.id AS template_id,
    tt.name AS template_name,
    tt.strict_sequence,
    count(*) AS total_tasks,
    count(*) FILTER (WHERE (stt.status = 'pending'::public.task_status)) AS pending_tasks,
    count(*) FILTER (WHERE (stt.status = 'in_progress'::public.task_status)) AS in_progress_tasks,
    count(*) FILTER (WHERE (stt.status = 'completed'::public.task_status)) AS completed_tasks,
    count(*) FILTER (WHERE (stt.status = 'blocked'::public.task_status)) AS blocked_tasks,
    count(*) FILTER (WHERE (stt.status = 'skipped'::public.task_status)) AS skipped_tasks,
    count(*) FILTER (WHERE (stt.is_required = true)) AS required_tasks,
    count(*) FILTER (WHERE ((stt.is_required = true) AND (stt.status = 'completed'::public.task_status))) AS required_completed,
    round((((count(*) FILTER (WHERE (stt.status = 'completed'::public.task_status)))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS completion_percentage,
    round((((count(*) FILTER (WHERE ((stt.is_required = true) AND (stt.status = 'completed'::public.task_status))))::numeric / (NULLIF(count(*) FILTER (WHERE (stt.is_required = true)), 0))::numeric) * (100)::numeric), 2) AS required_completion_percentage,
    min(stt.started_at) AS first_task_started_at,
    max(stt.completed_at) AS last_task_completed_at,
    sum(
        CASE
            WHEN ((stt.completed_at IS NOT NULL) AND (stt.started_at IS NOT NULL)) THEN (EXTRACT(epoch FROM (stt.completed_at - stt.started_at)) / (60)::numeric)
            ELSE (0)::numeric
        END) AS total_minutes_spent,
    ( SELECT jsonb_build_object('id', stt2.id, 'name', stt2.name, 'sequence_order', stt2.sequence_order, 'assigned_to_id', stt2.assigned_to_id) AS jsonb_build_object
           FROM public.service_ticket_tasks stt2
          WHERE ((stt2.ticket_id = st.id) AND (stt2.status = 'pending'::public.task_status))
          ORDER BY stt2.sequence_order
         LIMIT 1) AS next_pending_task,
    ( SELECT jsonb_agg(jsonb_build_object('id', stt3.id, 'name', stt3.name, 'sequence_order', stt3.sequence_order, 'blocked_reason', stt3.blocked_reason) ORDER BY stt3.sequence_order) AS jsonb_agg
           FROM public.service_ticket_tasks stt3
          WHERE ((stt3.ticket_id = st.id) AND (stt3.status = 'blocked'::public.task_status))) AS blocked_tasks_detail,
    st.created_at AS ticket_created_at,
    st.updated_at AS ticket_updated_at
   FROM ((public.service_tickets st
     LEFT JOIN public.task_templates tt ON ((st.template_id = tt.id)))
     LEFT JOIN public.service_ticket_tasks stt ON ((stt.ticket_id = st.id)))
  GROUP BY st.id, st.ticket_number, st.status, tt.id, tt.name, tt.strict_sequence, st.created_at, st.updated_at
  ORDER BY st.created_at DESC;


create or replace view "public"."v_warehouse_stock_levels" as  SELECT p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    b.name AS brand_name,
    pp.virtual_warehouse_type AS warehouse_type,
    pp.condition,
    count(*) AS quantity,
    count(*) FILTER (WHERE (((pp.user_warranty_end_date IS NOT NULL) AND (pp.user_warranty_end_date > (CURRENT_DATE + '30 days'::interval))) OR ((pp.user_warranty_end_date IS NULL) AND (pp.manufacturer_warranty_end_date IS NOT NULL) AND (pp.manufacturer_warranty_end_date > (CURRENT_DATE + '30 days'::interval))))) AS active_warranty_count,
    count(*) FILTER (WHERE (((pp.user_warranty_end_date IS NOT NULL) AND (pp.user_warranty_end_date > CURRENT_DATE) AND (pp.user_warranty_end_date <= (CURRENT_DATE + '30 days'::interval))) OR ((pp.user_warranty_end_date IS NULL) AND (pp.manufacturer_warranty_end_date IS NOT NULL) AND (pp.manufacturer_warranty_end_date > CURRENT_DATE) AND (pp.manufacturer_warranty_end_date <= (CURRENT_DATE + '30 days'::interval))))) AS expiring_soon_count,
    count(*) FILTER (WHERE (((pp.user_warranty_end_date IS NOT NULL) AND (pp.user_warranty_end_date <= CURRENT_DATE)) OR ((pp.user_warranty_end_date IS NULL) AND (pp.manufacturer_warranty_end_date IS NOT NULL) AND (pp.manufacturer_warranty_end_date <= CURRENT_DATE)))) AS expired_count,
    sum(pp.purchase_price) AS total_purchase_value,
    avg(pp.purchase_price) AS avg_purchase_price,
    pst.minimum_quantity,
    pst.reorder_quantity,
    pst.maximum_quantity,
    pst.alert_enabled,
        CASE
            WHEN ((pst.minimum_quantity IS NOT NULL) AND (count(*) < pst.minimum_quantity)) THEN true
            ELSE false
        END AS is_below_minimum,
    min(pp.created_at) AS oldest_stock_date,
    max(pp.created_at) AS newest_stock_date
   FROM (((public.physical_products pp
     JOIN public.products p ON ((pp.product_id = p.id)))
     JOIN public.brands b ON ((p.brand_id = b.id)))
     LEFT JOIN public.product_stock_thresholds pst ON (((pst.product_id = p.id) AND (pst.warehouse_type = pp.virtual_warehouse_type))))
  GROUP BY p.id, p.name, p.sku, b.name, pp.virtual_warehouse_type, pp.condition, pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, pst.alert_enabled
  ORDER BY b.name, p.name, pp.virtual_warehouse_type;


create or replace view "public"."v_warranty_expiring_soon" as  SELECT pp.id AS physical_product_id,
    pp.serial_number,
    pp.condition,
    pp.virtual_warehouse_type,
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    b.name AS brand_name,
    pp.manufacturer_warranty_end_date,
    pp.user_warranty_end_date,
        CASE
            WHEN (pp.user_warranty_end_date IS NOT NULL) THEN 'user'::text
            WHEN (pp.manufacturer_warranty_end_date IS NOT NULL) THEN 'manufacturer'::text
            ELSE 'none'::text
        END AS warranty_type,
        CASE
            WHEN (pp.user_warranty_end_date IS NOT NULL) THEN (pp.user_warranty_end_date - CURRENT_DATE)
            WHEN (pp.manufacturer_warranty_end_date IS NOT NULL) THEN (pp.manufacturer_warranty_end_date - CURRENT_DATE)
            ELSE NULL::integer
        END AS days_remaining,
        CASE
            WHEN ((pp.user_warranty_end_date IS NOT NULL) AND (pp.user_warranty_end_date <= CURRENT_DATE)) THEN 'expired'::text
            WHEN ((pp.manufacturer_warranty_end_date IS NOT NULL) AND (pp.manufacturer_warranty_end_date <= CURRENT_DATE)) THEN 'expired'::text
            WHEN ((pp.user_warranty_end_date IS NOT NULL) AND (pp.user_warranty_end_date <= (CURRENT_DATE + '30 days'::interval))) THEN 'expiring_soon'::text
            WHEN ((pp.manufacturer_warranty_end_date IS NOT NULL) AND (pp.manufacturer_warranty_end_date <= (CURRENT_DATE + '30 days'::interval))) THEN 'expiring_soon'::text
            ELSE 'active'::text
        END AS warranty_status,
    pw.name AS physical_warehouse_name,
    pw.code AS physical_warehouse_code,
    st.id AS current_ticket_id,
    st.ticket_number AS current_ticket_number,
    st.status AS current_ticket_status,
    pp.created_at,
    pp.updated_at
   FROM ((((public.physical_products pp
     JOIN public.products p ON ((pp.product_id = p.id)))
     JOIN public.brands b ON ((p.brand_id = b.id)))
     LEFT JOIN public.physical_warehouses pw ON ((pp.physical_warehouse_id = pw.id)))
     LEFT JOIN public.service_tickets st ON ((pp.current_ticket_id = st.id)))
  WHERE (((pp.user_warranty_end_date IS NOT NULL) AND ((pp.user_warranty_end_date >= CURRENT_DATE) AND (pp.user_warranty_end_date <= (CURRENT_DATE + '30 days'::interval)))) OR ((pp.user_warranty_end_date IS NULL) AND (pp.manufacturer_warranty_end_date IS NOT NULL) AND ((pp.manufacturer_warranty_end_date >= CURRENT_DATE) AND (pp.manufacturer_warranty_end_date <= (CURRENT_DATE + '30 days'::interval)))))
  ORDER BY
        CASE
            WHEN (pp.user_warranty_end_date IS NOT NULL) THEN pp.user_warranty_end_date
            ELSE pp.manufacturer_warranty_end_date
        END;


grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

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

grant delete on table "public"."email_notifications" to "anon";

grant insert on table "public"."email_notifications" to "anon";

grant references on table "public"."email_notifications" to "anon";

grant select on table "public"."email_notifications" to "anon";

grant trigger on table "public"."email_notifications" to "anon";

grant truncate on table "public"."email_notifications" to "anon";

grant update on table "public"."email_notifications" to "anon";

grant delete on table "public"."email_notifications" to "authenticated";

grant insert on table "public"."email_notifications" to "authenticated";

grant references on table "public"."email_notifications" to "authenticated";

grant select on table "public"."email_notifications" to "authenticated";

grant trigger on table "public"."email_notifications" to "authenticated";

grant truncate on table "public"."email_notifications" to "authenticated";

grant update on table "public"."email_notifications" to "authenticated";

grant delete on table "public"."email_notifications" to "service_role";

grant insert on table "public"."email_notifications" to "service_role";

grant references on table "public"."email_notifications" to "service_role";

grant select on table "public"."email_notifications" to "service_role";

grant trigger on table "public"."email_notifications" to "service_role";

grant truncate on table "public"."email_notifications" to "service_role";

grant update on table "public"."email_notifications" to "service_role";

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

grant delete on table "public"."physical_products" to "anon";

grant insert on table "public"."physical_products" to "anon";

grant references on table "public"."physical_products" to "anon";

grant select on table "public"."physical_products" to "anon";

grant trigger on table "public"."physical_products" to "anon";

grant truncate on table "public"."physical_products" to "anon";

grant update on table "public"."physical_products" to "anon";

grant delete on table "public"."physical_products" to "authenticated";

grant insert on table "public"."physical_products" to "authenticated";

grant references on table "public"."physical_products" to "authenticated";

grant select on table "public"."physical_products" to "authenticated";

grant trigger on table "public"."physical_products" to "authenticated";

grant truncate on table "public"."physical_products" to "authenticated";

grant update on table "public"."physical_products" to "authenticated";

grant delete on table "public"."physical_products" to "service_role";

grant insert on table "public"."physical_products" to "service_role";

grant references on table "public"."physical_products" to "service_role";

grant select on table "public"."physical_products" to "service_role";

grant trigger on table "public"."physical_products" to "service_role";

grant truncate on table "public"."physical_products" to "service_role";

grant update on table "public"."physical_products" to "service_role";

grant delete on table "public"."physical_warehouses" to "anon";

grant insert on table "public"."physical_warehouses" to "anon";

grant references on table "public"."physical_warehouses" to "anon";

grant select on table "public"."physical_warehouses" to "anon";

grant trigger on table "public"."physical_warehouses" to "anon";

grant truncate on table "public"."physical_warehouses" to "anon";

grant update on table "public"."physical_warehouses" to "anon";

grant delete on table "public"."physical_warehouses" to "authenticated";

grant insert on table "public"."physical_warehouses" to "authenticated";

grant references on table "public"."physical_warehouses" to "authenticated";

grant select on table "public"."physical_warehouses" to "authenticated";

grant trigger on table "public"."physical_warehouses" to "authenticated";

grant truncate on table "public"."physical_warehouses" to "authenticated";

grant update on table "public"."physical_warehouses" to "authenticated";

grant delete on table "public"."physical_warehouses" to "service_role";

grant insert on table "public"."physical_warehouses" to "service_role";

grant references on table "public"."physical_warehouses" to "service_role";

grant select on table "public"."physical_warehouses" to "service_role";

grant trigger on table "public"."physical_warehouses" to "service_role";

grant truncate on table "public"."physical_warehouses" to "service_role";

grant update on table "public"."physical_warehouses" to "service_role";

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

grant delete on table "public"."product_stock_thresholds" to "anon";

grant insert on table "public"."product_stock_thresholds" to "anon";

grant references on table "public"."product_stock_thresholds" to "anon";

grant select on table "public"."product_stock_thresholds" to "anon";

grant trigger on table "public"."product_stock_thresholds" to "anon";

grant truncate on table "public"."product_stock_thresholds" to "anon";

grant update on table "public"."product_stock_thresholds" to "anon";

grant delete on table "public"."product_stock_thresholds" to "authenticated";

grant insert on table "public"."product_stock_thresholds" to "authenticated";

grant references on table "public"."product_stock_thresholds" to "authenticated";

grant select on table "public"."product_stock_thresholds" to "authenticated";

grant trigger on table "public"."product_stock_thresholds" to "authenticated";

grant truncate on table "public"."product_stock_thresholds" to "authenticated";

grant update on table "public"."product_stock_thresholds" to "authenticated";

grant delete on table "public"."product_stock_thresholds" to "service_role";

grant insert on table "public"."product_stock_thresholds" to "service_role";

grant references on table "public"."product_stock_thresholds" to "service_role";

grant select on table "public"."product_stock_thresholds" to "service_role";

grant trigger on table "public"."product_stock_thresholds" to "service_role";

grant truncate on table "public"."product_stock_thresholds" to "service_role";

grant update on table "public"."product_stock_thresholds" to "service_role";

grant delete on table "public"."product_warehouse_stock" to "anon";

grant insert on table "public"."product_warehouse_stock" to "anon";

grant references on table "public"."product_warehouse_stock" to "anon";

grant select on table "public"."product_warehouse_stock" to "anon";

grant trigger on table "public"."product_warehouse_stock" to "anon";

grant truncate on table "public"."product_warehouse_stock" to "anon";

grant update on table "public"."product_warehouse_stock" to "anon";

grant delete on table "public"."product_warehouse_stock" to "authenticated";

grant insert on table "public"."product_warehouse_stock" to "authenticated";

grant references on table "public"."product_warehouse_stock" to "authenticated";

grant select on table "public"."product_warehouse_stock" to "authenticated";

grant trigger on table "public"."product_warehouse_stock" to "authenticated";

grant truncate on table "public"."product_warehouse_stock" to "authenticated";

grant update on table "public"."product_warehouse_stock" to "authenticated";

grant delete on table "public"."product_warehouse_stock" to "service_role";

grant insert on table "public"."product_warehouse_stock" to "service_role";

grant references on table "public"."product_warehouse_stock" to "service_role";

grant select on table "public"."product_warehouse_stock" to "service_role";

grant trigger on table "public"."product_warehouse_stock" to "service_role";

grant truncate on table "public"."product_warehouse_stock" to "service_role";

grant update on table "public"."product_warehouse_stock" to "service_role";

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

grant delete on table "public"."rma_batches" to "anon";

grant insert on table "public"."rma_batches" to "anon";

grant references on table "public"."rma_batches" to "anon";

grant select on table "public"."rma_batches" to "anon";

grant trigger on table "public"."rma_batches" to "anon";

grant truncate on table "public"."rma_batches" to "anon";

grant update on table "public"."rma_batches" to "anon";

grant delete on table "public"."rma_batches" to "authenticated";

grant insert on table "public"."rma_batches" to "authenticated";

grant references on table "public"."rma_batches" to "authenticated";

grant select on table "public"."rma_batches" to "authenticated";

grant trigger on table "public"."rma_batches" to "authenticated";

grant truncate on table "public"."rma_batches" to "authenticated";

grant update on table "public"."rma_batches" to "authenticated";

grant delete on table "public"."rma_batches" to "service_role";

grant insert on table "public"."rma_batches" to "service_role";

grant references on table "public"."rma_batches" to "service_role";

grant select on table "public"."rma_batches" to "service_role";

grant trigger on table "public"."rma_batches" to "service_role";

grant truncate on table "public"."rma_batches" to "service_role";

grant update on table "public"."rma_batches" to "service_role";

grant delete on table "public"."service_request_items" to "anon";

grant insert on table "public"."service_request_items" to "anon";

grant references on table "public"."service_request_items" to "anon";

grant select on table "public"."service_request_items" to "anon";

grant trigger on table "public"."service_request_items" to "anon";

grant truncate on table "public"."service_request_items" to "anon";

grant update on table "public"."service_request_items" to "anon";

grant delete on table "public"."service_request_items" to "authenticated";

grant insert on table "public"."service_request_items" to "authenticated";

grant references on table "public"."service_request_items" to "authenticated";

grant select on table "public"."service_request_items" to "authenticated";

grant trigger on table "public"."service_request_items" to "authenticated";

grant truncate on table "public"."service_request_items" to "authenticated";

grant update on table "public"."service_request_items" to "authenticated";

grant delete on table "public"."service_request_items" to "service_role";

grant insert on table "public"."service_request_items" to "service_role";

grant references on table "public"."service_request_items" to "service_role";

grant select on table "public"."service_request_items" to "service_role";

grant trigger on table "public"."service_request_items" to "service_role";

grant truncate on table "public"."service_request_items" to "service_role";

grant update on table "public"."service_request_items" to "service_role";

grant delete on table "public"."service_requests" to "anon";

grant insert on table "public"."service_requests" to "anon";

grant references on table "public"."service_requests" to "anon";

grant select on table "public"."service_requests" to "anon";

grant trigger on table "public"."service_requests" to "anon";

grant truncate on table "public"."service_requests" to "anon";

grant update on table "public"."service_requests" to "anon";

grant delete on table "public"."service_requests" to "authenticated";

grant insert on table "public"."service_requests" to "authenticated";

grant references on table "public"."service_requests" to "authenticated";

grant select on table "public"."service_requests" to "authenticated";

grant trigger on table "public"."service_requests" to "authenticated";

grant truncate on table "public"."service_requests" to "authenticated";

grant update on table "public"."service_requests" to "authenticated";

grant delete on table "public"."service_requests" to "service_role";

grant insert on table "public"."service_requests" to "service_role";

grant references on table "public"."service_requests" to "service_role";

grant select on table "public"."service_requests" to "service_role";

grant trigger on table "public"."service_requests" to "service_role";

grant truncate on table "public"."service_requests" to "service_role";

grant update on table "public"."service_requests" to "service_role";

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

grant delete on table "public"."service_ticket_tasks" to "anon";

grant insert on table "public"."service_ticket_tasks" to "anon";

grant references on table "public"."service_ticket_tasks" to "anon";

grant select on table "public"."service_ticket_tasks" to "anon";

grant trigger on table "public"."service_ticket_tasks" to "anon";

grant truncate on table "public"."service_ticket_tasks" to "anon";

grant update on table "public"."service_ticket_tasks" to "anon";

grant delete on table "public"."service_ticket_tasks" to "authenticated";

grant insert on table "public"."service_ticket_tasks" to "authenticated";

grant references on table "public"."service_ticket_tasks" to "authenticated";

grant select on table "public"."service_ticket_tasks" to "authenticated";

grant trigger on table "public"."service_ticket_tasks" to "authenticated";

grant truncate on table "public"."service_ticket_tasks" to "authenticated";

grant update on table "public"."service_ticket_tasks" to "authenticated";

grant delete on table "public"."service_ticket_tasks" to "service_role";

grant insert on table "public"."service_ticket_tasks" to "service_role";

grant references on table "public"."service_ticket_tasks" to "service_role";

grant select on table "public"."service_ticket_tasks" to "service_role";

grant trigger on table "public"."service_ticket_tasks" to "service_role";

grant truncate on table "public"."service_ticket_tasks" to "service_role";

grant update on table "public"."service_ticket_tasks" to "service_role";

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

grant delete on table "public"."stock_document_attachments" to "anon";

grant insert on table "public"."stock_document_attachments" to "anon";

grant references on table "public"."stock_document_attachments" to "anon";

grant select on table "public"."stock_document_attachments" to "anon";

grant trigger on table "public"."stock_document_attachments" to "anon";

grant truncate on table "public"."stock_document_attachments" to "anon";

grant update on table "public"."stock_document_attachments" to "anon";

grant delete on table "public"."stock_document_attachments" to "authenticated";

grant insert on table "public"."stock_document_attachments" to "authenticated";

grant references on table "public"."stock_document_attachments" to "authenticated";

grant select on table "public"."stock_document_attachments" to "authenticated";

grant trigger on table "public"."stock_document_attachments" to "authenticated";

grant truncate on table "public"."stock_document_attachments" to "authenticated";

grant update on table "public"."stock_document_attachments" to "authenticated";

grant delete on table "public"."stock_document_attachments" to "service_role";

grant insert on table "public"."stock_document_attachments" to "service_role";

grant references on table "public"."stock_document_attachments" to "service_role";

grant select on table "public"."stock_document_attachments" to "service_role";

grant trigger on table "public"."stock_document_attachments" to "service_role";

grant truncate on table "public"."stock_document_attachments" to "service_role";

grant update on table "public"."stock_document_attachments" to "service_role";

grant delete on table "public"."stock_issue_items" to "anon";

grant insert on table "public"."stock_issue_items" to "anon";

grant references on table "public"."stock_issue_items" to "anon";

grant select on table "public"."stock_issue_items" to "anon";

grant trigger on table "public"."stock_issue_items" to "anon";

grant truncate on table "public"."stock_issue_items" to "anon";

grant update on table "public"."stock_issue_items" to "anon";

grant delete on table "public"."stock_issue_items" to "authenticated";

grant insert on table "public"."stock_issue_items" to "authenticated";

grant references on table "public"."stock_issue_items" to "authenticated";

grant select on table "public"."stock_issue_items" to "authenticated";

grant trigger on table "public"."stock_issue_items" to "authenticated";

grant truncate on table "public"."stock_issue_items" to "authenticated";

grant update on table "public"."stock_issue_items" to "authenticated";

grant delete on table "public"."stock_issue_items" to "service_role";

grant insert on table "public"."stock_issue_items" to "service_role";

grant references on table "public"."stock_issue_items" to "service_role";

grant select on table "public"."stock_issue_items" to "service_role";

grant trigger on table "public"."stock_issue_items" to "service_role";

grant truncate on table "public"."stock_issue_items" to "service_role";

grant update on table "public"."stock_issue_items" to "service_role";

grant delete on table "public"."stock_issue_serials" to "anon";

grant insert on table "public"."stock_issue_serials" to "anon";

grant references on table "public"."stock_issue_serials" to "anon";

grant select on table "public"."stock_issue_serials" to "anon";

grant trigger on table "public"."stock_issue_serials" to "anon";

grant truncate on table "public"."stock_issue_serials" to "anon";

grant update on table "public"."stock_issue_serials" to "anon";

grant delete on table "public"."stock_issue_serials" to "authenticated";

grant insert on table "public"."stock_issue_serials" to "authenticated";

grant references on table "public"."stock_issue_serials" to "authenticated";

grant select on table "public"."stock_issue_serials" to "authenticated";

grant trigger on table "public"."stock_issue_serials" to "authenticated";

grant truncate on table "public"."stock_issue_serials" to "authenticated";

grant update on table "public"."stock_issue_serials" to "authenticated";

grant delete on table "public"."stock_issue_serials" to "service_role";

grant insert on table "public"."stock_issue_serials" to "service_role";

grant references on table "public"."stock_issue_serials" to "service_role";

grant select on table "public"."stock_issue_serials" to "service_role";

grant trigger on table "public"."stock_issue_serials" to "service_role";

grant truncate on table "public"."stock_issue_serials" to "service_role";

grant update on table "public"."stock_issue_serials" to "service_role";

grant delete on table "public"."stock_issues" to "anon";

grant insert on table "public"."stock_issues" to "anon";

grant references on table "public"."stock_issues" to "anon";

grant select on table "public"."stock_issues" to "anon";

grant trigger on table "public"."stock_issues" to "anon";

grant truncate on table "public"."stock_issues" to "anon";

grant update on table "public"."stock_issues" to "anon";

grant delete on table "public"."stock_issues" to "authenticated";

grant insert on table "public"."stock_issues" to "authenticated";

grant references on table "public"."stock_issues" to "authenticated";

grant select on table "public"."stock_issues" to "authenticated";

grant trigger on table "public"."stock_issues" to "authenticated";

grant truncate on table "public"."stock_issues" to "authenticated";

grant update on table "public"."stock_issues" to "authenticated";

grant delete on table "public"."stock_issues" to "service_role";

grant insert on table "public"."stock_issues" to "service_role";

grant references on table "public"."stock_issues" to "service_role";

grant select on table "public"."stock_issues" to "service_role";

grant trigger on table "public"."stock_issues" to "service_role";

grant truncate on table "public"."stock_issues" to "service_role";

grant update on table "public"."stock_issues" to "service_role";

grant delete on table "public"."stock_movements" to "anon";

grant insert on table "public"."stock_movements" to "anon";

grant references on table "public"."stock_movements" to "anon";

grant select on table "public"."stock_movements" to "anon";

grant trigger on table "public"."stock_movements" to "anon";

grant truncate on table "public"."stock_movements" to "anon";

grant update on table "public"."stock_movements" to "anon";

grant delete on table "public"."stock_movements" to "authenticated";

grant insert on table "public"."stock_movements" to "authenticated";

grant references on table "public"."stock_movements" to "authenticated";

grant select on table "public"."stock_movements" to "authenticated";

grant trigger on table "public"."stock_movements" to "authenticated";

grant truncate on table "public"."stock_movements" to "authenticated";

grant update on table "public"."stock_movements" to "authenticated";

grant delete on table "public"."stock_movements" to "service_role";

grant insert on table "public"."stock_movements" to "service_role";

grant references on table "public"."stock_movements" to "service_role";

grant select on table "public"."stock_movements" to "service_role";

grant trigger on table "public"."stock_movements" to "service_role";

grant truncate on table "public"."stock_movements" to "service_role";

grant update on table "public"."stock_movements" to "service_role";

grant delete on table "public"."stock_receipt_items" to "anon";

grant insert on table "public"."stock_receipt_items" to "anon";

grant references on table "public"."stock_receipt_items" to "anon";

grant select on table "public"."stock_receipt_items" to "anon";

grant trigger on table "public"."stock_receipt_items" to "anon";

grant truncate on table "public"."stock_receipt_items" to "anon";

grant update on table "public"."stock_receipt_items" to "anon";

grant delete on table "public"."stock_receipt_items" to "authenticated";

grant insert on table "public"."stock_receipt_items" to "authenticated";

grant references on table "public"."stock_receipt_items" to "authenticated";

grant select on table "public"."stock_receipt_items" to "authenticated";

grant trigger on table "public"."stock_receipt_items" to "authenticated";

grant truncate on table "public"."stock_receipt_items" to "authenticated";

grant update on table "public"."stock_receipt_items" to "authenticated";

grant delete on table "public"."stock_receipt_items" to "service_role";

grant insert on table "public"."stock_receipt_items" to "service_role";

grant references on table "public"."stock_receipt_items" to "service_role";

grant select on table "public"."stock_receipt_items" to "service_role";

grant trigger on table "public"."stock_receipt_items" to "service_role";

grant truncate on table "public"."stock_receipt_items" to "service_role";

grant update on table "public"."stock_receipt_items" to "service_role";

grant delete on table "public"."stock_receipt_serials" to "anon";

grant insert on table "public"."stock_receipt_serials" to "anon";

grant references on table "public"."stock_receipt_serials" to "anon";

grant select on table "public"."stock_receipt_serials" to "anon";

grant trigger on table "public"."stock_receipt_serials" to "anon";

grant truncate on table "public"."stock_receipt_serials" to "anon";

grant update on table "public"."stock_receipt_serials" to "anon";

grant delete on table "public"."stock_receipt_serials" to "authenticated";

grant insert on table "public"."stock_receipt_serials" to "authenticated";

grant references on table "public"."stock_receipt_serials" to "authenticated";

grant select on table "public"."stock_receipt_serials" to "authenticated";

grant trigger on table "public"."stock_receipt_serials" to "authenticated";

grant truncate on table "public"."stock_receipt_serials" to "authenticated";

grant update on table "public"."stock_receipt_serials" to "authenticated";

grant delete on table "public"."stock_receipt_serials" to "service_role";

grant insert on table "public"."stock_receipt_serials" to "service_role";

grant references on table "public"."stock_receipt_serials" to "service_role";

grant select on table "public"."stock_receipt_serials" to "service_role";

grant trigger on table "public"."stock_receipt_serials" to "service_role";

grant truncate on table "public"."stock_receipt_serials" to "service_role";

grant update on table "public"."stock_receipt_serials" to "service_role";

grant delete on table "public"."stock_receipts" to "anon";

grant insert on table "public"."stock_receipts" to "anon";

grant references on table "public"."stock_receipts" to "anon";

grant select on table "public"."stock_receipts" to "anon";

grant trigger on table "public"."stock_receipts" to "anon";

grant truncate on table "public"."stock_receipts" to "anon";

grant update on table "public"."stock_receipts" to "anon";

grant delete on table "public"."stock_receipts" to "authenticated";

grant insert on table "public"."stock_receipts" to "authenticated";

grant references on table "public"."stock_receipts" to "authenticated";

grant select on table "public"."stock_receipts" to "authenticated";

grant trigger on table "public"."stock_receipts" to "authenticated";

grant truncate on table "public"."stock_receipts" to "authenticated";

grant update on table "public"."stock_receipts" to "authenticated";

grant delete on table "public"."stock_receipts" to "service_role";

grant insert on table "public"."stock_receipts" to "service_role";

grant references on table "public"."stock_receipts" to "service_role";

grant select on table "public"."stock_receipts" to "service_role";

grant trigger on table "public"."stock_receipts" to "service_role";

grant truncate on table "public"."stock_receipts" to "service_role";

grant update on table "public"."stock_receipts" to "service_role";

grant delete on table "public"."stock_transfer_items" to "anon";

grant insert on table "public"."stock_transfer_items" to "anon";

grant references on table "public"."stock_transfer_items" to "anon";

grant select on table "public"."stock_transfer_items" to "anon";

grant trigger on table "public"."stock_transfer_items" to "anon";

grant truncate on table "public"."stock_transfer_items" to "anon";

grant update on table "public"."stock_transfer_items" to "anon";

grant delete on table "public"."stock_transfer_items" to "authenticated";

grant insert on table "public"."stock_transfer_items" to "authenticated";

grant references on table "public"."stock_transfer_items" to "authenticated";

grant select on table "public"."stock_transfer_items" to "authenticated";

grant trigger on table "public"."stock_transfer_items" to "authenticated";

grant truncate on table "public"."stock_transfer_items" to "authenticated";

grant update on table "public"."stock_transfer_items" to "authenticated";

grant delete on table "public"."stock_transfer_items" to "service_role";

grant insert on table "public"."stock_transfer_items" to "service_role";

grant references on table "public"."stock_transfer_items" to "service_role";

grant select on table "public"."stock_transfer_items" to "service_role";

grant trigger on table "public"."stock_transfer_items" to "service_role";

grant truncate on table "public"."stock_transfer_items" to "service_role";

grant update on table "public"."stock_transfer_items" to "service_role";

grant delete on table "public"."stock_transfer_serials" to "anon";

grant insert on table "public"."stock_transfer_serials" to "anon";

grant references on table "public"."stock_transfer_serials" to "anon";

grant select on table "public"."stock_transfer_serials" to "anon";

grant trigger on table "public"."stock_transfer_serials" to "anon";

grant truncate on table "public"."stock_transfer_serials" to "anon";

grant update on table "public"."stock_transfer_serials" to "anon";

grant delete on table "public"."stock_transfer_serials" to "authenticated";

grant insert on table "public"."stock_transfer_serials" to "authenticated";

grant references on table "public"."stock_transfer_serials" to "authenticated";

grant select on table "public"."stock_transfer_serials" to "authenticated";

grant trigger on table "public"."stock_transfer_serials" to "authenticated";

grant truncate on table "public"."stock_transfer_serials" to "authenticated";

grant update on table "public"."stock_transfer_serials" to "authenticated";

grant delete on table "public"."stock_transfer_serials" to "service_role";

grant insert on table "public"."stock_transfer_serials" to "service_role";

grant references on table "public"."stock_transfer_serials" to "service_role";

grant select on table "public"."stock_transfer_serials" to "service_role";

grant trigger on table "public"."stock_transfer_serials" to "service_role";

grant truncate on table "public"."stock_transfer_serials" to "service_role";

grant update on table "public"."stock_transfer_serials" to "service_role";

grant delete on table "public"."stock_transfers" to "anon";

grant insert on table "public"."stock_transfers" to "anon";

grant references on table "public"."stock_transfers" to "anon";

grant select on table "public"."stock_transfers" to "anon";

grant trigger on table "public"."stock_transfers" to "anon";

grant truncate on table "public"."stock_transfers" to "anon";

grant update on table "public"."stock_transfers" to "anon";

grant delete on table "public"."stock_transfers" to "authenticated";

grant insert on table "public"."stock_transfers" to "authenticated";

grant references on table "public"."stock_transfers" to "authenticated";

grant select on table "public"."stock_transfers" to "authenticated";

grant trigger on table "public"."stock_transfers" to "authenticated";

grant truncate on table "public"."stock_transfers" to "authenticated";

grant update on table "public"."stock_transfers" to "authenticated";

grant delete on table "public"."stock_transfers" to "service_role";

grant insert on table "public"."stock_transfers" to "service_role";

grant references on table "public"."stock_transfers" to "service_role";

grant select on table "public"."stock_transfers" to "service_role";

grant trigger on table "public"."stock_transfers" to "service_role";

grant truncate on table "public"."stock_transfers" to "service_role";

grant update on table "public"."stock_transfers" to "service_role";

grant delete on table "public"."task_history" to "anon";

grant insert on table "public"."task_history" to "anon";

grant references on table "public"."task_history" to "anon";

grant select on table "public"."task_history" to "anon";

grant trigger on table "public"."task_history" to "anon";

grant truncate on table "public"."task_history" to "anon";

grant update on table "public"."task_history" to "anon";

grant delete on table "public"."task_history" to "authenticated";

grant insert on table "public"."task_history" to "authenticated";

grant references on table "public"."task_history" to "authenticated";

grant select on table "public"."task_history" to "authenticated";

grant trigger on table "public"."task_history" to "authenticated";

grant truncate on table "public"."task_history" to "authenticated";

grant update on table "public"."task_history" to "authenticated";

grant delete on table "public"."task_history" to "service_role";

grant insert on table "public"."task_history" to "service_role";

grant references on table "public"."task_history" to "service_role";

grant select on table "public"."task_history" to "service_role";

grant trigger on table "public"."task_history" to "service_role";

grant truncate on table "public"."task_history" to "service_role";

grant update on table "public"."task_history" to "service_role";

grant delete on table "public"."task_templates" to "anon";

grant insert on table "public"."task_templates" to "anon";

grant references on table "public"."task_templates" to "anon";

grant select on table "public"."task_templates" to "anon";

grant trigger on table "public"."task_templates" to "anon";

grant truncate on table "public"."task_templates" to "anon";

grant update on table "public"."task_templates" to "anon";

grant delete on table "public"."task_templates" to "authenticated";

grant insert on table "public"."task_templates" to "authenticated";

grant references on table "public"."task_templates" to "authenticated";

grant select on table "public"."task_templates" to "authenticated";

grant trigger on table "public"."task_templates" to "authenticated";

grant truncate on table "public"."task_templates" to "authenticated";

grant update on table "public"."task_templates" to "authenticated";

grant delete on table "public"."task_templates" to "service_role";

grant insert on table "public"."task_templates" to "service_role";

grant references on table "public"."task_templates" to "service_role";

grant select on table "public"."task_templates" to "service_role";

grant trigger on table "public"."task_templates" to "service_role";

grant truncate on table "public"."task_templates" to "service_role";

grant update on table "public"."task_templates" to "service_role";

grant delete on table "public"."task_templates_tasks" to "anon";

grant insert on table "public"."task_templates_tasks" to "anon";

grant references on table "public"."task_templates_tasks" to "anon";

grant select on table "public"."task_templates_tasks" to "anon";

grant trigger on table "public"."task_templates_tasks" to "anon";

grant truncate on table "public"."task_templates_tasks" to "anon";

grant update on table "public"."task_templates_tasks" to "anon";

grant delete on table "public"."task_templates_tasks" to "authenticated";

grant insert on table "public"."task_templates_tasks" to "authenticated";

grant references on table "public"."task_templates_tasks" to "authenticated";

grant select on table "public"."task_templates_tasks" to "authenticated";

grant trigger on table "public"."task_templates_tasks" to "authenticated";

grant truncate on table "public"."task_templates_tasks" to "authenticated";

grant update on table "public"."task_templates_tasks" to "authenticated";

grant delete on table "public"."task_templates_tasks" to "service_role";

grant insert on table "public"."task_templates_tasks" to "service_role";

grant references on table "public"."task_templates_tasks" to "service_role";

grant select on table "public"."task_templates_tasks" to "service_role";

grant trigger on table "public"."task_templates_tasks" to "service_role";

grant truncate on table "public"."task_templates_tasks" to "service_role";

grant update on table "public"."task_templates_tasks" to "service_role";

grant delete on table "public"."task_types" to "anon";

grant insert on table "public"."task_types" to "anon";

grant references on table "public"."task_types" to "anon";

grant select on table "public"."task_types" to "anon";

grant trigger on table "public"."task_types" to "anon";

grant truncate on table "public"."task_types" to "anon";

grant update on table "public"."task_types" to "anon";

grant delete on table "public"."task_types" to "authenticated";

grant insert on table "public"."task_types" to "authenticated";

grant references on table "public"."task_types" to "authenticated";

grant select on table "public"."task_types" to "authenticated";

grant trigger on table "public"."task_types" to "authenticated";

grant truncate on table "public"."task_types" to "authenticated";

grant update on table "public"."task_types" to "authenticated";

grant delete on table "public"."task_types" to "service_role";

grant insert on table "public"."task_types" to "service_role";

grant references on table "public"."task_types" to "service_role";

grant select on table "public"."task_types" to "service_role";

grant trigger on table "public"."task_types" to "service_role";

grant truncate on table "public"."task_types" to "service_role";

grant update on table "public"."task_types" to "service_role";

grant delete on table "public"."ticket_template_changes" to "anon";

grant insert on table "public"."ticket_template_changes" to "anon";

grant references on table "public"."ticket_template_changes" to "anon";

grant select on table "public"."ticket_template_changes" to "anon";

grant trigger on table "public"."ticket_template_changes" to "anon";

grant truncate on table "public"."ticket_template_changes" to "anon";

grant update on table "public"."ticket_template_changes" to "anon";

grant delete on table "public"."ticket_template_changes" to "authenticated";

grant insert on table "public"."ticket_template_changes" to "authenticated";

grant references on table "public"."ticket_template_changes" to "authenticated";

grant select on table "public"."ticket_template_changes" to "authenticated";

grant trigger on table "public"."ticket_template_changes" to "authenticated";

grant truncate on table "public"."ticket_template_changes" to "authenticated";

grant update on table "public"."ticket_template_changes" to "authenticated";

grant delete on table "public"."ticket_template_changes" to "service_role";

grant insert on table "public"."ticket_template_changes" to "service_role";

grant references on table "public"."ticket_template_changes" to "service_role";

grant select on table "public"."ticket_template_changes" to "service_role";

grant trigger on table "public"."ticket_template_changes" to "service_role";

grant truncate on table "public"."ticket_template_changes" to "service_role";

grant update on table "public"."ticket_template_changes" to "service_role";

grant delete on table "public"."virtual_warehouses" to "anon";

grant insert on table "public"."virtual_warehouses" to "anon";

grant references on table "public"."virtual_warehouses" to "anon";

grant select on table "public"."virtual_warehouses" to "anon";

grant trigger on table "public"."virtual_warehouses" to "anon";

grant truncate on table "public"."virtual_warehouses" to "anon";

grant update on table "public"."virtual_warehouses" to "anon";

grant delete on table "public"."virtual_warehouses" to "authenticated";

grant insert on table "public"."virtual_warehouses" to "authenticated";

grant references on table "public"."virtual_warehouses" to "authenticated";

grant select on table "public"."virtual_warehouses" to "authenticated";

grant trigger on table "public"."virtual_warehouses" to "authenticated";

grant truncate on table "public"."virtual_warehouses" to "authenticated";

grant update on table "public"."virtual_warehouses" to "authenticated";

grant delete on table "public"."virtual_warehouses" to "service_role";

grant insert on table "public"."virtual_warehouses" to "service_role";

grant references on table "public"."virtual_warehouses" to "service_role";

grant select on table "public"."virtual_warehouses" to "service_role";

grant trigger on table "public"."virtual_warehouses" to "service_role";

grant truncate on table "public"."virtual_warehouses" to "service_role";

grant update on table "public"."virtual_warehouses" to "service_role";


  create policy "audit_logs_admin_select"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using (public.is_admin());



  create policy "audit_logs_authenticated_insert"
  on "public"."audit_logs"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "brands_delete_policy"
  on "public"."brands"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



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



  create policy "customers_delete_policy"
  on "public"."customers"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



  create policy "customers_insert_policy"
  on "public"."customers"
  as permissive
  for insert
  to authenticated
with check (public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]));



  create policy "customers_select_policy"
  on "public"."customers"
  as permissive
  for select
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (id IN ( SELECT st.customer_id
   FROM (public.service_tickets st
     JOIN public.service_ticket_tasks stt ON ((stt.ticket_id = st.id)))
  WHERE (stt.assigned_to_id = auth.uid()))))));



  create policy "customers_update_policy"
  on "public"."customers"
  as permissive
  for update
  to authenticated
using (public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]));



  create policy "email_notifications_admin_read"
  on "public"."email_notifications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "email_notifications_system_insert"
  on "public"."email_notifications"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "email_notifications_system_update"
  on "public"."email_notifications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "parts_delete_policy"
  on "public"."parts"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



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



  create policy "physical_products_admin_all"
  on "public"."physical_products"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "physical_products_reception_read"
  on "public"."physical_products"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'reception'::public.user_role)))));



  create policy "physical_products_technician_read"
  on "public"."physical_products"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role)))));



  create policy "physical_products_technician_update"
  on "public"."physical_products"
  as permissive
  for update
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.service_ticket_tasks
  WHERE ((service_ticket_tasks.assigned_to_id = auth.uid()) AND (service_ticket_tasks.ticket_id = physical_products.current_ticket_id)))) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role))))))
with check (((EXISTS ( SELECT 1
   FROM public.service_ticket_tasks
  WHERE ((service_ticket_tasks.assigned_to_id = auth.uid()) AND (service_ticket_tasks.ticket_id = physical_products.current_ticket_id)))) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role))))));



  create policy "physical_warehouses_admin_all"
  on "public"."physical_warehouses"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "physical_warehouses_authenticated_read"
  on "public"."physical_warehouses"
  as permissive
  for select
  to authenticated
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



  create policy "product_stock_thresholds_admin_all"
  on "public"."product_stock_thresholds"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "product_stock_thresholds_authenticated_read"
  on "public"."product_stock_thresholds"
  as permissive
  for select
  to authenticated
using (true);



  create policy "products_delete_policy"
  on "public"."products"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



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
using (public.is_admin());



  create policy "profiles_insert_policy"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id) OR public.is_admin()));



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
using (((auth.uid() = user_id) OR public.is_admin()));



  create policy "rma_batches_admin_all"
  on "public"."rma_batches"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "rma_batches_staff_read"
  on "public"."rma_batches"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['technician'::public.user_role, 'reception'::public.user_role]))))));



  create policy "service_requests_authenticated_read"
  on "public"."service_requests"
  as permissive
  for select
  to authenticated
using (true);



  create policy "service_requests_public_insert"
  on "public"."service_requests"
  as permissive
  for insert
  to anon
with check (true);



  create policy "service_requests_staff_update"
  on "public"."service_requests"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'reception'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'reception'::public.user_role]))))));



  create policy "service_ticket_attachments_delete_policy"
  on "public"."service_ticket_attachments"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



  create policy "service_ticket_attachments_insert_policy"
  on "public"."service_ticket_attachments"
  as permissive
  for insert
  to authenticated
with check ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_attachments_select_policy"
  on "public"."service_ticket_attachments"
  as permissive
  for select
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



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
using (((auth.uid() = created_by) OR public.is_admin_or_manager()));



  create policy "service_ticket_comments_insert_policy"
  on "public"."service_ticket_comments"
  as permissive
  for insert
  to authenticated
with check ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_comments_select_policy"
  on "public"."service_ticket_comments"
  as permissive
  for select
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_comments_update_policy"
  on "public"."service_ticket_comments"
  as permissive
  for update
  to public
using (((auth.uid() = created_by) OR public.is_admin_or_manager()));



  create policy "service_ticket_parts_delete_policy"
  on "public"."service_ticket_parts"
  as permissive
  for delete
  to authenticated
using (public.is_admin_or_manager());



  create policy "service_ticket_parts_insert_policy"
  on "public"."service_ticket_parts"
  as permissive
  for insert
  to authenticated
with check ((public.has_any_role(ARRAY['admin'::text, 'manager'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_parts_select_policy"
  on "public"."service_ticket_parts"
  as permissive
  for select
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_parts_update_policy"
  on "public"."service_ticket_parts"
  as permissive
  for update
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text]) OR (public.is_technician() AND (ticket_id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_ticket_tasks_admin_all"
  on "public"."service_ticket_tasks"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "service_ticket_tasks_reception_read"
  on "public"."service_ticket_tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'reception'::public.user_role)))));



  create policy "service_ticket_tasks_technician_read"
  on "public"."service_ticket_tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role)))));



  create policy "service_ticket_tasks_technician_update"
  on "public"."service_ticket_tasks"
  as permissive
  for update
  to authenticated
using (((assigned_to_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role))))))
with check (((assigned_to_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'technician'::public.user_role))))));



  create policy "service_tickets_delete_policy"
  on "public"."service_tickets"
  as permissive
  for delete
  to public
using (public.is_admin_or_manager());



  create policy "service_tickets_insert_policy"
  on "public"."service_tickets"
  as permissive
  for insert
  to authenticated
with check (public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]));



  create policy "service_tickets_select_policy"
  on "public"."service_tickets"
  as permissive
  for select
  to authenticated
using ((public.has_any_role(ARRAY['admin'::text, 'manager'::text, 'reception'::text]) OR (public.is_technician() AND (id IN ( SELECT service_ticket_tasks.ticket_id
   FROM public.service_ticket_tasks
  WHERE (service_ticket_tasks.assigned_to_id = auth.uid()))))));



  create policy "service_tickets_update_policy"
  on "public"."service_tickets"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR (public.has_role('manager'::text) AND (status <> 'cancelled'::public.ticket_status)) OR (public.is_reception() AND (status = 'pending'::public.ticket_status))));



  create policy "stock_document_attachments_admin_all"
  on "public"."stock_document_attachments"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "stock_document_attachments_technician_insert"
  on "public"."stock_document_attachments"
  as permissive
  for insert
  to authenticated
with check (((uploaded_by_id = ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'technician'::public.user_role))))));



  create policy "stock_document_attachments_technician_view"
  on "public"."stock_document_attachments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'technician'::public.user_role)))));



  create policy "stock_movements_authenticated_read"
  on "public"."stock_movements"
  as permissive
  for select
  to authenticated
using (true);



  create policy "stock_movements_staff_insert"
  on "public"."stock_movements"
  as permissive
  for insert
  to authenticated
with check (((moved_by_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'technician'::public.user_role])))))));



  create policy "task_history_authenticated_read"
  on "public"."task_history"
  as permissive
  for select
  to authenticated
using (true);



  create policy "task_history_system_insert"
  on "public"."task_history"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'technician'::public.user_role]))))));



  create policy "task_templates_admin_all"
  on "public"."task_templates"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "task_templates_staff_read"
  on "public"."task_templates"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['technician'::public.user_role, 'reception'::public.user_role]))))));



  create policy "task_templates_tasks_admin_all"
  on "public"."task_templates_tasks"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "task_templates_tasks_staff_read"
  on "public"."task_templates_tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['technician'::public.user_role, 'reception'::public.user_role]))))));



  create policy "task_types_admin_all"
  on "public"."task_types"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "task_types_staff_read"
  on "public"."task_types"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['technician'::public.user_role, 'reception'::public.user_role]))))));



  create policy "ticket_template_changes_admin_insert"
  on "public"."ticket_template_changes"
  as permissive
  for insert
  to authenticated
with check (((changed_by_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "ticket_template_changes_authenticated_read"
  on "public"."ticket_template_changes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "virtual_warehouses_admin_all"
  on "public"."virtual_warehouses"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))));



  create policy "virtual_warehouses_authenticated_read"
  on "public"."virtual_warehouses"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER brands_updated_at_trigger BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER customers_updated_at_trigger BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER parts_updated_at_trigger BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_physical_products_updated_at BEFORE UPDATE ON public.physical_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_create_default_virtual_warehouse AFTER INSERT ON public.physical_warehouses FOR EACH ROW EXECUTE FUNCTION public.create_default_virtual_warehouse();

CREATE TRIGGER trigger_physical_warehouses_updated_at BEFORE UPDATE ON public.physical_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_default_virtual_warehouse_name AFTER UPDATE ON public.physical_warehouses FOR EACH ROW WHEN (((old.name)::text IS DISTINCT FROM (new.name)::text)) EXECUTE FUNCTION public.update_default_virtual_warehouse_name();

CREATE TRIGGER product_parts_updated_at_trigger BEFORE UPDATE ON public.product_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_product_stock_thresholds_updated_at BEFORE UPDATE ON public.product_stock_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_product_warehouse_stock_updated_at BEFORE UPDATE ON public.product_warehouse_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER products_updated_at_trigger BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER profiles_updated_at_trigger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_generate_rma_batch_number BEFORE INSERT ON public.rma_batches FOR EACH ROW EXECUTE FUNCTION public.generate_rma_batch_number();

CREATE TRIGGER trigger_rma_batches_updated_at BEFORE UPDATE ON public.rma_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_service_request_items_updated_at BEFORE UPDATE ON public.service_request_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_auto_create_tickets BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.auto_create_tickets_on_received();

CREATE TRIGGER trigger_generate_service_request_tracking_token BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();

CREATE TRIGGER trigger_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER service_ticket_comments_updated_at_trigger BEFORE UPDATE ON public.service_ticket_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER service_ticket_parts_total_trigger AFTER INSERT OR DELETE OR UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION public.update_service_ticket_parts_total();

CREATE TRIGGER service_ticket_parts_updated_at_trigger BEFORE UPDATE ON public.service_ticket_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_service_ticket_tasks_updated_at BEFORE UPDATE ON public.service_ticket_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER service_tickets_log_status_change_trigger AFTER UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.log_status_change();

CREATE TRIGGER service_tickets_set_number_trigger BEFORE INSERT ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();

CREATE TRIGGER service_tickets_updated_at_trigger BEFORE UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_auto_complete_request AFTER UPDATE OF status ON public.service_tickets FOR EACH ROW WHEN ((new.status = ANY (ARRAY['completed'::public.ticket_status, 'cancelled'::public.ticket_status]))) EXECUTE FUNCTION public.auto_complete_service_request();

CREATE TRIGGER trigger_delete_physical_product_on_issue AFTER INSERT ON public.stock_issue_serials FOR EACH ROW EXECUTE FUNCTION public.delete_physical_product_on_issue();

CREATE TRIGGER trigger_generate_issue_number BEFORE INSERT ON public.stock_issues FOR EACH ROW WHEN ((new.issue_number IS NULL)) EXECUTE FUNCTION public.generate_issue_number();

CREATE TRIGGER trigger_stock_issues_updated_at BEFORE UPDATE ON public.stock_issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_stock_on_issue_approval AFTER UPDATE ON public.stock_issues FOR EACH ROW WHEN (((new.status = 'approved'::public.stock_document_status) AND (old.status <> 'approved'::public.stock_document_status))) EXECUTE FUNCTION public.update_stock_on_issue_approval();

CREATE TRIGGER trigger_stock_receipt_items_updated_at BEFORE UPDATE ON public.stock_receipt_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_create_physical_product_from_receipt_serial BEFORE INSERT ON public.stock_receipt_serials FOR EACH ROW EXECUTE FUNCTION public.create_physical_product_from_receipt_serial();

CREATE TRIGGER trigger_generate_receipt_number BEFORE INSERT ON public.stock_receipts FOR EACH ROW WHEN ((new.receipt_number IS NULL)) EXECUTE FUNCTION public.generate_receipt_number();

CREATE TRIGGER trigger_stock_receipts_updated_at BEFORE UPDATE ON public.stock_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_stock_on_receipt_approval AFTER UPDATE ON public.stock_receipts FOR EACH ROW WHEN (((new.status = 'approved'::public.stock_document_status) AND (old.status <> 'approved'::public.stock_document_status))) EXECUTE FUNCTION public.update_stock_on_receipt_approval();

CREATE TRIGGER trigger_update_physical_product_warehouse_on_transfer AFTER INSERT ON public.stock_transfer_serials FOR EACH ROW EXECUTE FUNCTION public.update_physical_product_warehouse_on_transfer();

CREATE TRIGGER trigger_auto_complete_transfer_documents AFTER UPDATE ON public.stock_transfers FOR EACH ROW WHEN (((new.status = 'completed'::public.transfer_status) AND (old.status <> 'completed'::public.transfer_status))) EXECUTE FUNCTION public.auto_complete_transfer_documents();

CREATE TRIGGER trigger_auto_generate_transfer_documents BEFORE UPDATE ON public.stock_transfers FOR EACH ROW WHEN (((new.status = 'approved'::public.transfer_status) AND (old.status <> 'approved'::public.transfer_status))) EXECUTE FUNCTION public.auto_generate_transfer_documents();

CREATE TRIGGER trigger_generate_transfer_number BEFORE INSERT ON public.stock_transfers FOR EACH ROW WHEN ((new.transfer_number IS NULL)) EXECUTE FUNCTION public.generate_transfer_number();

CREATE TRIGGER trigger_stock_transfers_updated_at BEFORE UPDATE ON public.stock_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_task_templates_updated_at BEFORE UPDATE ON public.task_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_task_types_updated_at BEFORE UPDATE ON public.task_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_virtual_warehouses_updated_at BEFORE UPDATE ON public.virtual_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


