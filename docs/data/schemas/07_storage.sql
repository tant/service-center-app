-- =====================================================
-- 07_storage.sql
-- =====================================================
-- Configuration and RLS policies for Supabase Storage.
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS (from 19_phase2_storage.sql)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('warehouse-photos', 'warehouse-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('serial-photos', 'serial-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('csv-imports', 'csv-imports', false, 10485760, ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AVATARS BUCKET POLICIES (from storage_policies.sql)
-- =====================================================
create policy "avatars_insert_own" on storage.objects for insert with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_update_own" on storage.objects for update using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_delete_own" on storage.objects for delete using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_select_all" on storage.objects for select using (bucket_id = 'avatars');

-- =====================================================
-- PRODUCT_IMAGES BUCKET POLICIES (from storage_policies.sql)
-- =====================================================
create policy "product_images_insert_own" on storage.objects for insert with check (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_update_own" on storage.objects for update using (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_delete_own" on storage.objects for delete using (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_select_all" on storage.objects for select using (bucket_id = 'product_images');

-- =====================================================
-- SERVICE_MEDIA BUCKET POLICIES (from storage_policies.sql)
-- =====================================================
create policy "service_media_insert_public" on storage.objects for insert with check (bucket_id = 'service_media');
create policy "service_media_update_public" on storage.objects for update using (bucket_id = 'service_media');
create policy "service_media_delete_restricted" on storage.objects for delete using (bucket_id = 'service_media' and public.is_admin_or_manager());
create policy "service_media_select_public" on storage.objects for select using (bucket_id = 'service_media');

-- =====================================================
-- WAREHOUSE PHOTOS BUCKET POLICIES (from 19_phase2_storage.sql)
-- =====================================================
CREATE POLICY "warehouse_photos_authenticated_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "warehouse_photos_authenticated_read_own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "warehouse_photos_admin_read_all" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'warehouse-photos' AND public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY "warehouse_photos_authenticated_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- =====================================================
-- SERIAL PHOTOS BUCKET POLICIES (from 19_phase2_storage.sql)
-- =====================================================
CREATE POLICY "serial_photos_authenticated_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "serial_photos_authenticated_read_own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "serial_photos_admin_read_all" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'serial-photos' AND public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY "serial_photos_authenticated_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- =====================================================
-- CSV IMPORTS BUCKET POLICIES (from 19_phase2_storage.sql)
-- =====================================================
CREATE POLICY "csv_imports_admin_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'csv-imports' AND public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY "csv_imports_admin_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'csv-imports' AND public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY "csv_imports_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'csv-imports' AND public.has_any_role(ARRAY['admin', 'manager']));
