-- Create bucket for task videos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service_videos', 'service_videos', false, 209715200, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

-- Policies: allow authenticated users to insert/select their own video files under task prefix
-- Adjust as needed for your RBAC rules.
drop policy if exists "service_videos_insert_authenticated" on storage.objects;
drop policy if exists "service_videos_select_authenticated" on storage.objects;
drop policy if exists "service_videos_delete_restricted" on storage.objects;

do $$
begin
  create policy "service_videos_insert_authenticated" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'service_videos'
    );
exception when others then
  -- ignore if policy exists
  null;
end $$;

do $$
begin
  create policy "service_videos_select_authenticated" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'service_videos'
    );
exception when others then
  null;
end $$;

do $$
begin
  create policy "service_videos_delete_restricted" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'service_videos'
      and public.is_admin_or_manager()
    );
exception when others then
  null;
end $$;
