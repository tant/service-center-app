drop trigger if exists "trigger_create_default_virtual_warehouse" on "public"."physical_warehouses";

drop trigger if exists "trigger_update_default_virtual_warehouse_name" on "public"."physical_warehouses";

drop trigger if exists "trigger_product_warehouse_stock_updated_at" on "public"."product_warehouse_stock";

drop trigger if exists "trigger_auto_generate_stock_issue" on "public"."service_tickets";

drop trigger if exists "trigger_generate_issue_number" on "public"."stock_issues";

drop trigger if exists "trigger_stock_issues_updated_at" on "public"."stock_issues";

drop trigger if exists "trigger_stock_receipt_items_updated_at" on "public"."stock_receipt_items";

drop trigger if exists "trigger_generate_receipt_number" on "public"."stock_receipts";

drop trigger if exists "trigger_process_stock_receipt_completion" on "public"."stock_receipts";

drop trigger if exists "trigger_stock_receipts_updated_at" on "public"."stock_receipts";

drop trigger if exists "trigger_auto_complete_transfer_documents" on "public"."stock_transfers";

drop trigger if exists "trigger_auto_generate_transfer_documents" on "public"."stock_transfers";

drop trigger if exists "trigger_generate_transfer_number" on "public"."stock_transfers";

drop trigger if exists "trigger_stock_transfers_updated_at" on "public"."stock_transfers";

drop policy if exists "stock_document_attachments_admin_manager" on "public"."stock_document_attachments";

drop policy if exists "stock_document_attachments_others_read" on "public"."stock_document_attachments";

drop policy if exists "system_settings_admin_all" on "public"."system_settings";

drop policy if exists "system_settings_read" on "public"."system_settings";

drop policy if exists "email_notifications_admin_read" on "public"."email_notifications";

drop policy if exists "email_notifications_system_insert" on "public"."email_notifications";

drop policy if exists "email_notifications_system_update" on "public"."email_notifications";

drop policy if exists "physical_products_admin_all" on "public"."physical_products";

drop policy if exists "physical_products_reception_read" on "public"."physical_products";

drop policy if exists "physical_products_technician_read" on "public"."physical_products";

drop policy if exists "physical_products_technician_update" on "public"."physical_products";

drop policy if exists "physical_warehouses_admin_all" on "public"."physical_warehouses";

drop policy if exists "product_stock_thresholds_admin_all" on "public"."product_stock_thresholds";

drop policy if exists "rma_batches_admin_all" on "public"."rma_batches";

drop policy if exists "rma_batches_staff_read" on "public"."rma_batches";

drop policy if exists "service_requests_staff_update" on "public"."service_requests";

drop policy if exists "service_ticket_tasks_admin_all" on "public"."service_ticket_tasks";

drop policy if exists "service_ticket_tasks_reception_read" on "public"."service_ticket_tasks";

drop policy if exists "service_ticket_tasks_technician_read" on "public"."service_ticket_tasks";

drop policy if exists "service_ticket_tasks_technician_update" on "public"."service_ticket_tasks";

drop policy if exists "stock_movements_staff_insert" on "public"."stock_movements";

drop policy if exists "task_history_system_insert" on "public"."task_history";

drop policy if exists "task_templates_admin_all" on "public"."task_templates";

drop policy if exists "task_templates_staff_read" on "public"."task_templates";

drop policy if exists "task_templates_tasks_admin_all" on "public"."task_templates_tasks";

drop policy if exists "task_templates_tasks_staff_read" on "public"."task_templates_tasks";

drop policy if exists "task_types_admin_all" on "public"."task_types";

drop policy if exists "task_types_staff_read" on "public"."task_types";

drop policy if exists "ticket_template_changes_admin_insert" on "public"."ticket_template_changes";

drop policy if exists "virtual_warehouses_admin_all" on "public"."virtual_warehouses";

revoke delete on table "public"."product_warehouse_stock" from "anon";

revoke insert on table "public"."product_warehouse_stock" from "anon";

revoke references on table "public"."product_warehouse_stock" from "anon";

revoke select on table "public"."product_warehouse_stock" from "anon";

revoke trigger on table "public"."product_warehouse_stock" from "anon";

revoke truncate on table "public"."product_warehouse_stock" from "anon";

revoke update on table "public"."product_warehouse_stock" from "anon";

revoke delete on table "public"."product_warehouse_stock" from "authenticated";

revoke insert on table "public"."product_warehouse_stock" from "authenticated";

revoke references on table "public"."product_warehouse_stock" from "authenticated";

revoke select on table "public"."product_warehouse_stock" from "authenticated";

revoke trigger on table "public"."product_warehouse_stock" from "authenticated";

revoke truncate on table "public"."product_warehouse_stock" from "authenticated";

revoke update on table "public"."product_warehouse_stock" from "authenticated";

revoke delete on table "public"."product_warehouse_stock" from "service_role";

revoke insert on table "public"."product_warehouse_stock" from "service_role";

revoke references on table "public"."product_warehouse_stock" from "service_role";

revoke select on table "public"."product_warehouse_stock" from "service_role";

revoke trigger on table "public"."product_warehouse_stock" from "service_role";

revoke truncate on table "public"."product_warehouse_stock" from "service_role";

revoke update on table "public"."product_warehouse_stock" from "service_role";

revoke delete on table "public"."stock_document_attachments" from "anon";

revoke insert on table "public"."stock_document_attachments" from "anon";

revoke references on table "public"."stock_document_attachments" from "anon";

revoke select on table "public"."stock_document_attachments" from "anon";

revoke trigger on table "public"."stock_document_attachments" from "anon";

revoke truncate on table "public"."stock_document_attachments" from "anon";

revoke update on table "public"."stock_document_attachments" from "anon";

revoke delete on table "public"."stock_document_attachments" from "authenticated";

revoke insert on table "public"."stock_document_attachments" from "authenticated";

revoke references on table "public"."stock_document_attachments" from "authenticated";

revoke select on table "public"."stock_document_attachments" from "authenticated";

revoke trigger on table "public"."stock_document_attachments" from "authenticated";

revoke truncate on table "public"."stock_document_attachments" from "authenticated";

revoke update on table "public"."stock_document_attachments" from "authenticated";

revoke delete on table "public"."stock_document_attachments" from "service_role";

revoke insert on table "public"."stock_document_attachments" from "service_role";

revoke references on table "public"."stock_document_attachments" from "service_role";

revoke select on table "public"."stock_document_attachments" from "service_role";

revoke trigger on table "public"."stock_document_attachments" from "service_role";

revoke truncate on table "public"."stock_document_attachments" from "service_role";

revoke update on table "public"."stock_document_attachments" from "service_role";

revoke delete on table "public"."stock_issue_items" from "anon";

revoke insert on table "public"."stock_issue_items" from "anon";

revoke references on table "public"."stock_issue_items" from "anon";

revoke select on table "public"."stock_issue_items" from "anon";

revoke trigger on table "public"."stock_issue_items" from "anon";

revoke truncate on table "public"."stock_issue_items" from "anon";

revoke update on table "public"."stock_issue_items" from "anon";

revoke delete on table "public"."stock_issue_items" from "authenticated";

revoke insert on table "public"."stock_issue_items" from "authenticated";

revoke references on table "public"."stock_issue_items" from "authenticated";

revoke select on table "public"."stock_issue_items" from "authenticated";

revoke trigger on table "public"."stock_issue_items" from "authenticated";

revoke truncate on table "public"."stock_issue_items" from "authenticated";

revoke update on table "public"."stock_issue_items" from "authenticated";

revoke delete on table "public"."stock_issue_items" from "service_role";

revoke insert on table "public"."stock_issue_items" from "service_role";

revoke references on table "public"."stock_issue_items" from "service_role";

revoke select on table "public"."stock_issue_items" from "service_role";

revoke trigger on table "public"."stock_issue_items" from "service_role";

revoke truncate on table "public"."stock_issue_items" from "service_role";

revoke update on table "public"."stock_issue_items" from "service_role";

revoke delete on table "public"."stock_issue_serials" from "anon";

revoke insert on table "public"."stock_issue_serials" from "anon";

revoke references on table "public"."stock_issue_serials" from "anon";

revoke select on table "public"."stock_issue_serials" from "anon";

revoke trigger on table "public"."stock_issue_serials" from "anon";

revoke truncate on table "public"."stock_issue_serials" from "anon";

revoke update on table "public"."stock_issue_serials" from "anon";

revoke delete on table "public"."stock_issue_serials" from "authenticated";

revoke insert on table "public"."stock_issue_serials" from "authenticated";

revoke references on table "public"."stock_issue_serials" from "authenticated";

revoke select on table "public"."stock_issue_serials" from "authenticated";

revoke trigger on table "public"."stock_issue_serials" from "authenticated";

revoke truncate on table "public"."stock_issue_serials" from "authenticated";

revoke update on table "public"."stock_issue_serials" from "authenticated";

revoke delete on table "public"."stock_issue_serials" from "service_role";

revoke insert on table "public"."stock_issue_serials" from "service_role";

revoke references on table "public"."stock_issue_serials" from "service_role";

revoke select on table "public"."stock_issue_serials" from "service_role";

revoke trigger on table "public"."stock_issue_serials" from "service_role";

revoke truncate on table "public"."stock_issue_serials" from "service_role";

revoke update on table "public"."stock_issue_serials" from "service_role";

revoke delete on table "public"."stock_issues" from "anon";

revoke insert on table "public"."stock_issues" from "anon";

revoke references on table "public"."stock_issues" from "anon";

revoke select on table "public"."stock_issues" from "anon";

revoke trigger on table "public"."stock_issues" from "anon";

revoke truncate on table "public"."stock_issues" from "anon";

revoke update on table "public"."stock_issues" from "anon";

revoke delete on table "public"."stock_issues" from "authenticated";

revoke insert on table "public"."stock_issues" from "authenticated";

revoke references on table "public"."stock_issues" from "authenticated";

revoke select on table "public"."stock_issues" from "authenticated";

revoke trigger on table "public"."stock_issues" from "authenticated";

revoke truncate on table "public"."stock_issues" from "authenticated";

revoke update on table "public"."stock_issues" from "authenticated";

revoke delete on table "public"."stock_issues" from "service_role";

revoke insert on table "public"."stock_issues" from "service_role";

revoke references on table "public"."stock_issues" from "service_role";

revoke select on table "public"."stock_issues" from "service_role";

revoke trigger on table "public"."stock_issues" from "service_role";

revoke truncate on table "public"."stock_issues" from "service_role";

revoke update on table "public"."stock_issues" from "service_role";

revoke delete on table "public"."stock_receipt_items" from "anon";

revoke insert on table "public"."stock_receipt_items" from "anon";

revoke references on table "public"."stock_receipt_items" from "anon";

revoke select on table "public"."stock_receipt_items" from "anon";

revoke trigger on table "public"."stock_receipt_items" from "anon";

revoke truncate on table "public"."stock_receipt_items" from "anon";

revoke update on table "public"."stock_receipt_items" from "anon";

revoke delete on table "public"."stock_receipt_items" from "authenticated";

revoke insert on table "public"."stock_receipt_items" from "authenticated";

revoke references on table "public"."stock_receipt_items" from "authenticated";

revoke select on table "public"."stock_receipt_items" from "authenticated";

revoke trigger on table "public"."stock_receipt_items" from "authenticated";

revoke truncate on table "public"."stock_receipt_items" from "authenticated";

revoke update on table "public"."stock_receipt_items" from "authenticated";

revoke delete on table "public"."stock_receipt_items" from "service_role";

revoke insert on table "public"."stock_receipt_items" from "service_role";

revoke references on table "public"."stock_receipt_items" from "service_role";

revoke select on table "public"."stock_receipt_items" from "service_role";

revoke trigger on table "public"."stock_receipt_items" from "service_role";

revoke truncate on table "public"."stock_receipt_items" from "service_role";

revoke update on table "public"."stock_receipt_items" from "service_role";

revoke delete on table "public"."stock_receipt_serials" from "anon";

revoke insert on table "public"."stock_receipt_serials" from "anon";

revoke references on table "public"."stock_receipt_serials" from "anon";

revoke select on table "public"."stock_receipt_serials" from "anon";

revoke trigger on table "public"."stock_receipt_serials" from "anon";

revoke truncate on table "public"."stock_receipt_serials" from "anon";

revoke update on table "public"."stock_receipt_serials" from "anon";

revoke delete on table "public"."stock_receipt_serials" from "authenticated";

revoke insert on table "public"."stock_receipt_serials" from "authenticated";

revoke references on table "public"."stock_receipt_serials" from "authenticated";

revoke select on table "public"."stock_receipt_serials" from "authenticated";

revoke trigger on table "public"."stock_receipt_serials" from "authenticated";

revoke truncate on table "public"."stock_receipt_serials" from "authenticated";

revoke update on table "public"."stock_receipt_serials" from "authenticated";

revoke delete on table "public"."stock_receipt_serials" from "service_role";

revoke insert on table "public"."stock_receipt_serials" from "service_role";

revoke references on table "public"."stock_receipt_serials" from "service_role";

revoke select on table "public"."stock_receipt_serials" from "service_role";

revoke trigger on table "public"."stock_receipt_serials" from "service_role";

revoke truncate on table "public"."stock_receipt_serials" from "service_role";

revoke update on table "public"."stock_receipt_serials" from "service_role";

revoke delete on table "public"."stock_receipts" from "anon";

revoke insert on table "public"."stock_receipts" from "anon";

revoke references on table "public"."stock_receipts" from "anon";

revoke select on table "public"."stock_receipts" from "anon";

revoke trigger on table "public"."stock_receipts" from "anon";

revoke truncate on table "public"."stock_receipts" from "anon";

revoke update on table "public"."stock_receipts" from "anon";

revoke delete on table "public"."stock_receipts" from "authenticated";

revoke insert on table "public"."stock_receipts" from "authenticated";

revoke references on table "public"."stock_receipts" from "authenticated";

revoke select on table "public"."stock_receipts" from "authenticated";

revoke trigger on table "public"."stock_receipts" from "authenticated";

revoke truncate on table "public"."stock_receipts" from "authenticated";

revoke update on table "public"."stock_receipts" from "authenticated";

revoke delete on table "public"."stock_receipts" from "service_role";

revoke insert on table "public"."stock_receipts" from "service_role";

revoke references on table "public"."stock_receipts" from "service_role";

revoke select on table "public"."stock_receipts" from "service_role";

revoke trigger on table "public"."stock_receipts" from "service_role";

revoke truncate on table "public"."stock_receipts" from "service_role";

revoke update on table "public"."stock_receipts" from "service_role";

revoke delete on table "public"."stock_transfer_items" from "anon";

revoke insert on table "public"."stock_transfer_items" from "anon";

revoke references on table "public"."stock_transfer_items" from "anon";

revoke select on table "public"."stock_transfer_items" from "anon";

revoke trigger on table "public"."stock_transfer_items" from "anon";

revoke truncate on table "public"."stock_transfer_items" from "anon";

revoke update on table "public"."stock_transfer_items" from "anon";

revoke delete on table "public"."stock_transfer_items" from "authenticated";

revoke insert on table "public"."stock_transfer_items" from "authenticated";

revoke references on table "public"."stock_transfer_items" from "authenticated";

revoke select on table "public"."stock_transfer_items" from "authenticated";

revoke trigger on table "public"."stock_transfer_items" from "authenticated";

revoke truncate on table "public"."stock_transfer_items" from "authenticated";

revoke update on table "public"."stock_transfer_items" from "authenticated";

revoke delete on table "public"."stock_transfer_items" from "service_role";

revoke insert on table "public"."stock_transfer_items" from "service_role";

revoke references on table "public"."stock_transfer_items" from "service_role";

revoke select on table "public"."stock_transfer_items" from "service_role";

revoke trigger on table "public"."stock_transfer_items" from "service_role";

revoke truncate on table "public"."stock_transfer_items" from "service_role";

revoke update on table "public"."stock_transfer_items" from "service_role";

revoke delete on table "public"."stock_transfer_serials" from "anon";

revoke insert on table "public"."stock_transfer_serials" from "anon";

revoke references on table "public"."stock_transfer_serials" from "anon";

revoke select on table "public"."stock_transfer_serials" from "anon";

revoke trigger on table "public"."stock_transfer_serials" from "anon";

revoke truncate on table "public"."stock_transfer_serials" from "anon";

revoke update on table "public"."stock_transfer_serials" from "anon";

revoke delete on table "public"."stock_transfer_serials" from "authenticated";

revoke insert on table "public"."stock_transfer_serials" from "authenticated";

revoke references on table "public"."stock_transfer_serials" from "authenticated";

revoke select on table "public"."stock_transfer_serials" from "authenticated";

revoke trigger on table "public"."stock_transfer_serials" from "authenticated";

revoke truncate on table "public"."stock_transfer_serials" from "authenticated";

revoke update on table "public"."stock_transfer_serials" from "authenticated";

revoke delete on table "public"."stock_transfer_serials" from "service_role";

revoke insert on table "public"."stock_transfer_serials" from "service_role";

revoke references on table "public"."stock_transfer_serials" from "service_role";

revoke select on table "public"."stock_transfer_serials" from "service_role";

revoke trigger on table "public"."stock_transfer_serials" from "service_role";

revoke truncate on table "public"."stock_transfer_serials" from "service_role";

revoke update on table "public"."stock_transfer_serials" from "service_role";

revoke delete on table "public"."stock_transfers" from "anon";

revoke insert on table "public"."stock_transfers" from "anon";

revoke references on table "public"."stock_transfers" from "anon";

revoke select on table "public"."stock_transfers" from "anon";

revoke trigger on table "public"."stock_transfers" from "anon";

revoke truncate on table "public"."stock_transfers" from "anon";

revoke update on table "public"."stock_transfers" from "anon";

revoke delete on table "public"."stock_transfers" from "authenticated";

revoke insert on table "public"."stock_transfers" from "authenticated";

revoke references on table "public"."stock_transfers" from "authenticated";

revoke select on table "public"."stock_transfers" from "authenticated";

revoke trigger on table "public"."stock_transfers" from "authenticated";

revoke truncate on table "public"."stock_transfers" from "authenticated";

revoke update on table "public"."stock_transfers" from "authenticated";

revoke delete on table "public"."stock_transfers" from "service_role";

revoke insert on table "public"."stock_transfers" from "service_role";

revoke references on table "public"."stock_transfers" from "service_role";

revoke select on table "public"."stock_transfers" from "service_role";

revoke trigger on table "public"."stock_transfers" from "service_role";

revoke truncate on table "public"."stock_transfers" from "service_role";

revoke update on table "public"."stock_transfers" from "service_role";

revoke delete on table "public"."system_settings" from "anon";

revoke insert on table "public"."system_settings" from "anon";

revoke references on table "public"."system_settings" from "anon";

revoke select on table "public"."system_settings" from "anon";

revoke trigger on table "public"."system_settings" from "anon";

revoke truncate on table "public"."system_settings" from "anon";

revoke update on table "public"."system_settings" from "anon";

revoke delete on table "public"."system_settings" from "authenticated";

revoke insert on table "public"."system_settings" from "authenticated";

revoke references on table "public"."system_settings" from "authenticated";

revoke select on table "public"."system_settings" from "authenticated";

revoke trigger on table "public"."system_settings" from "authenticated";

revoke truncate on table "public"."system_settings" from "authenticated";

revoke update on table "public"."system_settings" from "authenticated";

revoke delete on table "public"."system_settings" from "service_role";

revoke insert on table "public"."system_settings" from "service_role";

revoke references on table "public"."system_settings" from "service_role";

revoke select on table "public"."system_settings" from "service_role";

revoke trigger on table "public"."system_settings" from "service_role";

revoke truncate on table "public"."system_settings" from "service_role";

revoke update on table "public"."system_settings" from "service_role";

alter table "public"."physical_products" drop constraint "physical_products_previous_virtual_warehouse_id_fkey";

alter table "public"."physical_products" drop constraint "physical_products_virtual_warehouse_id_fkey";

alter table "public"."product_warehouse_stock" drop constraint "declared_quantity_non_negative";

alter table "public"."product_warehouse_stock" drop constraint "initial_stock_non_negative";

alter table "public"."product_warehouse_stock" drop constraint "product_warehouse_stock_product_id_fkey";

alter table "public"."product_warehouse_stock" drop constraint "product_warehouse_stock_unique";

alter table "public"."product_warehouse_stock" drop constraint "product_warehouse_stock_virtual_warehouse_id_fkey";

alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_uploaded_by_id_fkey";

alter table "public"."stock_issue_items" drop constraint "issue_items_quantity_not_zero";

alter table "public"."stock_issue_items" drop constraint "stock_issue_items_issue_id_fkey";

alter table "public"."stock_issue_items" drop constraint "stock_issue_items_product_id_fkey";

alter table "public"."stock_issue_serials" drop constraint "issue_serials_unique";

alter table "public"."stock_issue_serials" drop constraint "stock_issue_serials_issue_item_id_fkey";

alter table "public"."stock_issue_serials" drop constraint "stock_issue_serials_physical_product_id_fkey";

alter table "public"."stock_issues" drop constraint "issue_approved_requires_approver";

alter table "public"."stock_issues" drop constraint "issue_completed_requires_completer";

alter table "public"."stock_issues" drop constraint "stock_issues_approved_by_id_fkey";

alter table "public"."stock_issues" drop constraint "stock_issues_completed_by_id_fkey";

alter table "public"."stock_issues" drop constraint "stock_issues_created_by_id_fkey";

alter table "public"."stock_issues" drop constraint "stock_issues_issue_number_key";

alter table "public"."stock_issues" drop constraint "stock_issues_rma_batch_id_fkey";

alter table "public"."stock_issues" drop constraint "stock_issues_ticket_id_fkey";

alter table "public"."stock_issues" drop constraint "stock_issues_virtual_warehouse_id_fkey";

alter table "public"."stock_movements" drop constraint "stock_movements_from_virtual_warehouse_id_fkey";

alter table "public"."stock_movements" drop constraint "stock_movements_to_virtual_warehouse_id_fkey";

alter table "public"."stock_receipt_items" drop constraint "receipt_items_quantity_not_zero";

alter table "public"."stock_receipt_items" drop constraint "receipt_items_serial_count_valid";

alter table "public"."stock_receipt_items" drop constraint "stock_receipt_items_product_id_fkey";

alter table "public"."stock_receipt_items" drop constraint "stock_receipt_items_receipt_id_fkey";

alter table "public"."stock_receipt_serials" drop constraint "receipt_serials_unique";

alter table "public"."stock_receipt_serials" drop constraint "stock_receipt_serials_physical_product_id_fkey";

alter table "public"."stock_receipt_serials" drop constraint "stock_receipt_serials_receipt_item_id_fkey";

alter table "public"."stock_receipts" drop constraint "receipt_approved_requires_approver";

alter table "public"."stock_receipts" drop constraint "receipt_completed_requires_completer";

alter table "public"."stock_receipts" drop constraint "stock_receipts_approved_by_id_fkey";

alter table "public"."stock_receipts" drop constraint "stock_receipts_completed_by_id_fkey";

alter table "public"."stock_receipts" drop constraint "stock_receipts_created_by_id_fkey";

alter table "public"."stock_receipts" drop constraint "stock_receipts_receipt_number_key";

alter table "public"."stock_receipts" drop constraint "stock_receipts_rma_batch_id_fkey";

alter table "public"."stock_receipts" drop constraint "stock_receipts_virtual_warehouse_id_fkey";

alter table "public"."stock_transfer_items" drop constraint "stock_transfer_items_product_id_fkey";

alter table "public"."stock_transfer_items" drop constraint "stock_transfer_items_transfer_id_fkey";

alter table "public"."stock_transfer_items" drop constraint "transfer_items_quantity_positive";

alter table "public"."stock_transfer_serials" drop constraint "stock_transfer_serials_physical_product_id_fkey";

alter table "public"."stock_transfer_serials" drop constraint "stock_transfer_serials_transfer_item_id_fkey";

alter table "public"."stock_transfer_serials" drop constraint "transfer_serials_unique";

alter table "public"."stock_transfers" drop constraint "stock_transfers_approved_by_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_created_by_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_from_virtual_warehouse_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_generated_issue_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_generated_receipt_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_received_by_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_to_virtual_warehouse_id_fkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_transfer_number_key";

alter table "public"."stock_transfers" drop constraint "transfer_approved_requires_approver";

alter table "public"."stock_transfers" drop constraint "transfer_warehouses_different";

alter table "public"."virtual_warehouses" drop constraint "virtual_warehouses_physical_warehouse_id_fkey";

drop function if exists "public"."auto_complete_transfer_documents"();

drop function if exists "public"."auto_generate_stock_issue_from_ticket"();

drop function if exists "public"."auto_generate_transfer_documents"();

drop function if exists "public"."create_default_virtual_warehouse"();

drop function if exists "public"."generate_issue_number"();

drop function if exists "public"."generate_receipt_number"();

drop function if exists "public"."generate_transfer_number"();

drop function if exists "public"."get_aggregated_stock"(search_term text);

drop function if exists "public"."get_inventory_stats"();

drop function if exists "public"."process_stock_issue_completion"();

drop function if exists "public"."process_stock_receipt_completion"();

drop function if exists "public"."update_default_virtual_warehouse_name"();

drop function if exists "public"."update_receipt_item_serial_count"();

drop view if exists "public"."v_pending_approvals";

drop view if exists "public"."v_stock_summary";

drop view if exists "public"."v_low_stock_alerts";

drop view if exists "public"."v_stock_movement_history";

drop view if exists "public"."v_warehouse_stock_levels";

drop view if exists "public"."v_warranty_expiring_soon";

alter table "public"."product_warehouse_stock" drop constraint "product_warehouse_stock_pkey";

alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_pkey";

alter table "public"."stock_issue_items" drop constraint "stock_issue_items_pkey";

alter table "public"."stock_issue_serials" drop constraint "stock_issue_serials_pkey";

alter table "public"."stock_issues" drop constraint "stock_issues_pkey";

alter table "public"."stock_receipt_items" drop constraint "stock_receipt_items_pkey";

alter table "public"."stock_receipt_serials" drop constraint "stock_receipt_serials_pkey";

alter table "public"."stock_receipts" drop constraint "stock_receipts_pkey";

alter table "public"."stock_transfer_items" drop constraint "stock_transfer_items_pkey";

alter table "public"."stock_transfer_serials" drop constraint "stock_transfer_serials_pkey";

alter table "public"."stock_transfers" drop constraint "stock_transfers_pkey";

alter table "public"."system_settings" drop constraint "system_settings_pkey";

drop index if exists "public"."idx_physical_products_virtual_warehouse";

drop index if exists "public"."idx_product_warehouse_stock_product";

drop index if exists "public"."idx_product_warehouse_stock_virtual_warehouse";

drop index if exists "public"."idx_stock_document_attachments_document";

drop index if exists "public"."idx_stock_document_attachments_uploader";

drop index if exists "public"."idx_stock_issue_items_issue";

drop index if exists "public"."idx_stock_issue_items_product";

drop index if exists "public"."idx_stock_issue_serials_item";

drop index if exists "public"."idx_stock_issue_serials_product";

drop index if exists "public"."idx_stock_issues_date";

drop index if exists "public"."idx_stock_issues_status";

drop index if exists "public"."idx_stock_issues_ticket";

drop index if exists "public"."idx_stock_issues_type";

drop index if exists "public"."idx_stock_issues_warehouse";

drop index if exists "public"."idx_stock_movements_from_virtual_warehouse";

drop index if exists "public"."idx_stock_movements_to_virtual_warehouse";

drop index if exists "public"."idx_stock_receipt_items_product";

drop index if exists "public"."idx_stock_receipt_items_receipt";

drop index if exists "public"."idx_stock_receipt_serials_item";

drop index if exists "public"."idx_stock_receipt_serials_serial";

drop index if exists "public"."idx_stock_receipts_created_by";

drop index if exists "public"."idx_stock_receipts_date";

drop index if exists "public"."idx_stock_receipts_status";

drop index if exists "public"."idx_stock_receipts_type";

drop index if exists "public"."idx_stock_receipts_warehouse";

drop index if exists "public"."idx_stock_transfer_items_product";

drop index if exists "public"."idx_stock_transfer_items_transfer";

drop index if exists "public"."idx_stock_transfer_serials_item";

drop index if exists "public"."idx_stock_transfers_from";

drop index if exists "public"."idx_stock_transfers_generated_issue";

drop index if exists "public"."idx_stock_transfers_generated_receipt";

drop index if exists "public"."idx_stock_transfers_status";

drop index if exists "public"."idx_stock_transfers_to";

drop index if exists "public"."issue_serials_unique";

drop index if exists "public"."product_warehouse_stock_pkey";

drop index if exists "public"."product_warehouse_stock_unique";

drop index if exists "public"."receipt_serials_unique";

drop index if exists "public"."stock_document_attachments_pkey";

drop index if exists "public"."stock_issue_items_pkey";

drop index if exists "public"."stock_issue_serials_pkey";

drop index if exists "public"."stock_issues_issue_number_key";

drop index if exists "public"."stock_issues_pkey";

drop index if exists "public"."stock_receipt_items_pkey";

drop index if exists "public"."stock_receipt_serials_pkey";

drop index if exists "public"."stock_receipts_pkey";

drop index if exists "public"."stock_receipts_receipt_number_key";

drop index if exists "public"."stock_transfer_items_pkey";

drop index if exists "public"."stock_transfer_serials_pkey";

drop index if exists "public"."stock_transfers_pkey";

drop index if exists "public"."stock_transfers_transfer_number_key";

drop index if exists "public"."system_settings_pkey";

drop index if exists "public"."transfer_serials_unique";

drop table "public"."product_warehouse_stock";

drop table "public"."stock_document_attachments";

drop table "public"."stock_issue_items";

drop table "public"."stock_issue_serials";

drop table "public"."stock_issues";

drop table "public"."stock_receipt_items";

drop table "public"."stock_receipt_serials";

drop table "public"."stock_receipts";

drop table "public"."stock_transfer_items";

drop table "public"."stock_transfer_serials";

drop table "public"."stock_transfers";

drop table "public"."system_settings";

alter type "public"."warehouse_type" rename to "warehouse_type__old_version_to_be_dropped";

create type "public"."warehouse_type" as enum ('warranty_stock', 'rma_staging', 'dead_stock', 'in_service', 'parts');

alter table "public"."product_stock_thresholds" alter column warehouse_type type "public"."warehouse_type" using warehouse_type::text::"public"."warehouse_type";

alter table "public"."virtual_warehouses" alter column warehouse_type type "public"."warehouse_type" using warehouse_type::text::"public"."warehouse_type";

drop type "public"."warehouse_type__old_version_to_be_dropped";

alter table "public"."physical_products" drop column "manufacturer_warranty_end_date";

alter table "public"."physical_products" drop column "previous_virtual_warehouse_id";

alter table "public"."physical_products" drop column "user_warranty_end_date";

alter table "public"."physical_products" drop column "virtual_warehouse_id";

alter table "public"."physical_products" add column "virtual_warehouse_type" public.warehouse_type not null default 'warranty_stock'::public.warehouse_type;

alter table "public"."physical_products" add column "warranty_end_date" date;

alter table "public"."physical_products" add column "warranty_months" integer;

alter table "public"."physical_products" add column "warranty_start_date" date;

alter table "public"."products" drop column "default_warranty_months";

alter table "public"."products" drop column "end_user_warranty_months";

alter table "public"."rma_batches" drop column "supplier_name";

alter table "public"."stock_movements" drop column "from_virtual_warehouse_id";

alter table "public"."stock_movements" drop column "to_virtual_warehouse_id";

alter table "public"."stock_movements" add column "from_virtual_warehouse" public.warehouse_type;

alter table "public"."stock_movements" add column "to_virtual_warehouse" public.warehouse_type;

alter table "public"."virtual_warehouses" drop column "name";

alter table "public"."virtual_warehouses" drop column "physical_warehouse_id";

alter table "public"."virtual_warehouses" add column "color_code" character varying(7);

alter table "public"."virtual_warehouses" add column "display_name" character varying(255) not null;

drop sequence if exists "public"."issue_number_seq";

drop sequence if exists "public"."receipt_number_seq";

drop sequence if exists "public"."transfer_number_seq";

drop type "public"."stock_document_status";

drop type "public"."stock_issue_type";

drop type "public"."stock_receipt_type";

drop type "public"."transfer_status";

CREATE UNIQUE INDEX virtual_warehouses_warehouse_type_key ON public.virtual_warehouses USING btree (warehouse_type);

alter table "public"."stock_movements" add constraint "stock_movements_virtual_warehouse_changed" CHECK (((from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse) OR (from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id))) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_virtual_warehouse_changed";

alter table "public"."virtual_warehouses" add constraint "virtual_warehouses_warehouse_type_key" UNIQUE using index "virtual_warehouses_warehouse_type_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_physical_product_warranty_end_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_months IS NOT NULL THEN
    NEW.warranty_end_date := NEW.warranty_start_date + (NEW.warranty_months || ' months')::INTERVAL;
  ELSE
    NEW.warranty_end_date := NULL;
  END IF;
  RETURN NEW;
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


create or replace view "public"."v_warehouse_stock_levels" as  SELECT p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    b.name AS brand_name,
    pp.virtual_warehouse_type AS warehouse_type,
    pp.condition,
    count(*) AS quantity,
    count(*) FILTER (WHERE ((pp.warranty_end_date IS NOT NULL) AND (pp.warranty_end_date > (CURRENT_DATE + '30 days'::interval)))) AS active_warranty_count,
    count(*) FILTER (WHERE ((pp.warranty_end_date IS NOT NULL) AND (pp.warranty_end_date > CURRENT_DATE) AND (pp.warranty_end_date <= (CURRENT_DATE + '30 days'::interval)))) AS expiring_soon_count,
    count(*) FILTER (WHERE ((pp.warranty_end_date IS NOT NULL) AND (pp.warranty_end_date <= CURRENT_DATE))) AS expired_count,
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
    pp.warranty_start_date,
    pp.warranty_months,
    pp.warranty_end_date,
        CASE
            WHEN (pp.warranty_end_date IS NULL) THEN 'unknown'::text
            WHEN (pp.warranty_end_date <= CURRENT_DATE) THEN 'expired'::text
            WHEN (pp.warranty_end_date <= (CURRENT_DATE + '30 days'::interval)) THEN 'expiring_soon'::text
            ELSE 'active'::text
        END AS warranty_status,
    (pp.warranty_end_date - CURRENT_DATE) AS days_remaining,
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
  WHERE ((pp.warranty_end_date IS NOT NULL) AND (pp.warranty_end_date > CURRENT_DATE) AND (pp.warranty_end_date <= (CURRENT_DATE + '30 days'::interval)))
  ORDER BY pp.warranty_end_date;



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



  create policy "stock_movements_staff_insert"
  on "public"."stock_movements"
  as permissive
  for insert
  to authenticated
with check (((moved_by_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'technician'::public.user_role])))))));



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


CREATE TRIGGER trigger_physical_products_warranty_calculation BEFORE INSERT OR UPDATE ON public.physical_products FOR EACH ROW EXECUTE FUNCTION public.calculate_physical_product_warranty_end_date();


