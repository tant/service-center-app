-- Storage policies for Supabase Storage buckets
-- Note: Buckets must be created first via Supabase Studio Dashboard or seed script
-- This file only contains the RLS policies for storage.objects table

-- ============================================================================
-- AVATARS BUCKET POLICIES
-- ============================================================================
-- Users can upload their own avatar to their folder (user_id/filename.jpg)
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================================
-- PRODUCT_IMAGES BUCKET POLICIES
-- ============================================================================
create policy "product_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "product_images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "product_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'product_images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Anyone can view product images (public bucket)
create policy "product_images_select_all"
  on storage.objects for select
  using (bucket_id = 'product_images');

-- ============================================================================
-- SERVICE_MEDIA BUCKET POLICIES (Public)
-- ============================================================================
-- Simple public policies - anyone can access service ticket images
create policy "service_media_insert_public"
  on storage.objects for insert
  with check (bucket_id = 'service_media');

create policy "service_media_update_public"
  on storage.objects for update
  using (bucket_id = 'service_media');

create policy "service_media_delete_public"
  on storage.objects for delete
  using (bucket_id = 'service_media');

create policy "service_media_select_public"
  on storage.objects for select
  using (bucket_id = 'service_media');
