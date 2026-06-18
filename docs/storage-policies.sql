-- This ran once in the Supabase SQL editor when the note-files bucket is created.
-- Kept here so the ownership model is reviewable in code, not just in the dashboard. 
-- See lib/storage.ts for the upload/signed-URL helpers that rely on this path convention.

-- Why our path convention matters:
-- storage.objects is Supabase's own internal table, but it has no concept of "which file belongs to which user" 
-- the way our app tables do via user_id columns and joins. The only way to express ownership here is through the object's path itself. 
-- By uploading every file as `<userId>/<filename>`, storage.foldername(name) (which splits the path on '/') returns an array, whose first element is the uploader's user id, so we can compare that against auth.uid() the same way we'd compare a user_id column anywhere else. This is the standard Supabase Storage pattern for private per-user buckets.

create policy "Users can upload own note files"
  on storage.objects for insert
  with check (
    bucket_id = 'note-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own note files"
  on storage.objects for select
  using (
    bucket_id = 'note-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own note files"
  on storage.objects for delete
  using (
    bucket_id = 'note-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- No update policy: we never overwrite a stored file in place. Re-uploading
-- (replacing an attachment on an edited note) creates a new path with a fresh Date.now() prefix instead of mutating the old object. 
-- This avoids many problems — a signed URL someone has open referencing an
-- in-flight overwrite, partial-write race conditions, etc. , at the cost of old files lingering in storage until something explicitly deletes them.
-- We deem it an acceptable tradeoff for M2