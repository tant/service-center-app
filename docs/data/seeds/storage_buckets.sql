-- Storage Buckets Seed Data
-- This file creates the initial storage buckets for file uploads
--
-- This script is automatically run by setup_schema.sh
-- The storage policies are managed separately in schemas/storage_policies.sql

-- Create storage buckets
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),           -- Public: User profile pictures
  ('product_images', 'product_images', true),  -- Public: Product catalog images
  ('service_media', 'service_media', false);   -- Private: Service ticket attachments

-- Note: Storage RLS policies are defined in schemas/storage_policies.sql
-- Run migrations after creating buckets to apply the policies
