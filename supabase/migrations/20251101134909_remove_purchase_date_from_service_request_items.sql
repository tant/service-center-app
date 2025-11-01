alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_type_check";

alter table "public"."service_request_items" drop column "purchase_date";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";


  create policy "avatars_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "avatars_insert_own"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "avatars_select_all"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "avatars_update_own"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "csv_imports_admin_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'csv-imports'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "csv_imports_admin_read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'csv-imports'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "csv_imports_admin_upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'csv-imports'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "product_images_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'product_images'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "product_images_insert_own"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'product_images'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "product_images_select_all"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'product_images'::text));



  create policy "product_images_update_own"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'product_images'::text) AND ((( SELECT auth.uid() AS uid))::text = (storage.foldername(name))[1])));



  create policy "serial_photos_admin_read_all"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'serial-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "serial_photos_authenticated_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'serial-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "serial_photos_authenticated_read_own"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'serial-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "serial_photos_authenticated_upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'serial-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "service_media_delete_restricted"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'service_media'::text) AND public.is_admin_or_manager()));



  create policy "service_media_insert_public"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'service_media'::text));



  create policy "service_media_select_public"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'service_media'::text));



  create policy "service_media_update_public"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'service_media'::text));



  create policy "warehouse_photos_admin_read_all"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'warehouse-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));



  create policy "warehouse_photos_authenticated_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'warehouse-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "warehouse_photos_authenticated_read_own"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'warehouse-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "warehouse_photos_authenticated_upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'warehouse-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



