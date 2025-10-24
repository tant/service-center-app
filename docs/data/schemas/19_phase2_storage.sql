-- Phase 2 Storage Buckets
-- Service Center - Supabase Storage Configuration
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Warehouse reception photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'warehouse-photos',
  'warehouse-photos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Serial number verification photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'serial-photos',
  'serial-photos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- CSV import files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'csv-imports',
  'csv-imports',
  false,
  10485760, -- 10MB
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- WAREHOUSE PHOTOS STORAGE POLICIES
-- =====================================================

-- Allow authenticated users to upload
CREATE POLICY "warehouse_photos_authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'warehouse-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own uploads
CREATE POLICY "warehouse_photos_authenticated_read_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'warehouse-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admin/manager to read all warehouse photos
CREATE POLICY "warehouse_photos_admin_read_all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'warehouse-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "warehouse_photos_authenticated_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'warehouse-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- SERIAL PHOTOS STORAGE POLICIES
-- =====================================================

-- Allow authenticated users to upload
CREATE POLICY "serial_photos_authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'serial-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own uploads
CREATE POLICY "serial_photos_authenticated_read_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'serial-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admin/manager to read all serial photos
CREATE POLICY "serial_photos_admin_read_all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'serial-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "serial_photos_authenticated_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'serial-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- CSV IMPORTS STORAGE POLICIES
-- =====================================================

-- Allow admin/manager to upload CSV files
CREATE POLICY "csv_imports_admin_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Allow admin/manager to read all CSV imports
CREATE POLICY "csv_imports_admin_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Allow admin/manager to delete CSV imports
CREATE POLICY "csv_imports_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "warehouse_photos_authenticated_upload" ON storage.objects IS 'Authenticated users can upload warehouse photos to their own folder';
COMMENT ON POLICY "warehouse_photos_admin_read_all" ON storage.objects IS 'Admin/Manager can read all warehouse photos';
COMMENT ON POLICY "serial_photos_authenticated_upload" ON storage.objects IS 'Authenticated users can upload serial verification photos to their own folder';
COMMENT ON POLICY "serial_photos_admin_read_all" ON storage.objects IS 'Admin/Manager can read all serial verification photos';
COMMENT ON POLICY "csv_imports_admin_upload" ON storage.objects IS 'Admin/Manager can upload CSV import files';
