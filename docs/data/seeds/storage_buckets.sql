-- Storage Buckets Seed Data
-- This file creates the initial storage buckets for file uploads
--
-- This script is automatically run by setup_schema.sh
-- The storage policies are managed separately in schemas/storage_policies.sql

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),           -- Public: User profile pictures (5MB limit)
  ('product_images', 'product_images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),  -- Public: Product catalog images (5MB limit)
  ('service_media', 'service_media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);   -- Public: Service ticket attachments (10MB limit)

-- Note: Storage RLS policies are defined in schemas/storage_policies.sql
-- Run migrations after creating buckets to apply the policies
