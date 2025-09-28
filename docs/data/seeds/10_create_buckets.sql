-- Use Postgres to create buckets.
insert into storage.buckets
  (id, name)
values
  ('avatars', 'avatars'),
  ('product_images', 'product_images'),
  ('service_media', 'service_media');

-- Storage policies for avatars (per quickstart)
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Storage policies for product_images
create policy "Users can upload product images to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'product_images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own product images"
  on storage.objects for update
  using (
    bucket_id = 'product_images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own product images"
  on storage.objects for delete
  using (
    bucket_id = 'product_images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product_images');

-- Storage policies for service_media (private to the owner)
create policy "Users can upload service media to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'service_media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own service media"
  on storage.objects for update
  using (
    bucket_id = 'service_media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own service media"
  on storage.objects for delete
  using (
    bucket_id = 'service_media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own service media"
  on storage.objects for select
  using (
    bucket_id = 'service_media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );