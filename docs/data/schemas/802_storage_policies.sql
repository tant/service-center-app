-- =====================================================
-- 802_storage_policies.sql
-- =====================================================
-- Supabase Storage Bucket Policies
--
-- Storage buckets and RLS policies for:
-- - Avatars
-- - Product images
-- - Service media
-- - Warehouse photos
-- - Serial photos
-- - CSV imports
--
-- ORDER: 800-899 (RLS Policies)
-- DEPENDENCIES: 150 (role functions)
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
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "avatars_select_all" on storage.objects;

create policy "avatars_insert_own" on storage.objects for insert with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_update_own" on storage.objects for update using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_delete_own" on storage.objects for delete using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "avatars_select_all" on storage.objects for select using (bucket_id = 'avatars');

-- =====================================================
-- PRODUCT_IMAGES BUCKET POLICIES (from storage_policies.sql)
-- =====================================================
drop policy if exists "product_images_insert_own" on storage.objects;
drop policy if exists "product_images_update_own" on storage.objects;
drop policy if exists "product_images_delete_own" on storage.objects;
drop policy if exists "product_images_select_all" on storage.objects;

create policy "product_images_insert_own" on storage.objects for insert with check (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_update_own" on storage.objects for update using (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_delete_own" on storage.objects for delete using (bucket_id = 'product_images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "product_images_select_all" on storage.objects for select using (bucket_id = 'product_images');

-- =====================================================
-- SERVICE_MEDIA BUCKET POLICIES (from storage_policies.sql)
-- =====================================================
drop policy if exists "service_media_insert_public" on storage.objects;
drop policy if exists "service_media_update_public" on storage.objects;
drop policy if exists "service_media_delete_restricted" on storage.objects;
drop policy if exists "service_media_select_public" on storage.objects;

create policy "service_media_insert_public" on storage.objects for insert with check (bucket_id = 'service_media');
create policy "service_media_update_public" on storage.objects for update using (bucket_id = 'service_media');
create policy "service_media_delete_restricted" on storage.objects for delete using (bucket_id = 'service_media' and public.is_admin_or_manager());
create policy "service_media_select_public" on storage.objects for select using (bucket_id = 'service_media');

-- =====================================================
-- WAREHOUSE PHOTOS BUCKET POLICIES (from 19_phase2_storage.sql)
-- NOTE: Version e61aeb8 - simpler syntax without (SELECT auth.uid())
-- =====================================================
drop policy if exists "warehouse_photos_authenticated_upload" on storage.objects;
drop policy if exists "warehouse_photos_authenticated_read_own" on storage.objects;
drop policy if exists "warehouse_photos_admin_read_all" on storage.objects;
drop policy if exists "warehouse_photos_authenticated_delete_own" on storage.objects;

CREATE POLICY "warehouse_photos_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "warehouse_photos_authenticated_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: This policy requires profiles table to exist
CREATE POLICY "warehouse_photos_admin_read_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'warehouse-photos' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
  ));

CREATE POLICY "warehouse_photos_authenticated_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'warehouse-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- SERIAL PHOTOS BUCKET POLICIES (from 19_phase2_storage.sql)
-- =====================================================
drop policy if exists "serial_photos_authenticated_upload" on storage.objects;
drop policy if exists "serial_photos_authenticated_read_own" on storage.objects;
drop policy if exists "serial_photos_admin_read_all" on storage.objects;
drop policy if exists "serial_photos_authenticated_delete_own" on storage.objects;

CREATE POLICY "serial_photos_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "serial_photos_authenticated_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: This policy requires profiles table to exist
CREATE POLICY "serial_photos_admin_read_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'serial-photos' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
  ));

CREATE POLICY "serial_photos_authenticated_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'serial-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- CSV IMPORTS BUCKET POLICIES (from 19_phase2_storage.sql)
-- =====================================================
drop policy if exists "csv_imports_admin_upload" on storage.objects;
drop policy if exists "csv_imports_admin_read" on storage.objects;
drop policy if exists "csv_imports_admin_delete" on storage.objects;

-- NOTE: These policies require profiles table to exist
CREATE POLICY "csv_imports_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'csv-imports' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
  ));

CREATE POLICY "csv_imports_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'csv-imports' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
  ));

CREATE POLICY "csv_imports_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'csv-imports' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
  ));
