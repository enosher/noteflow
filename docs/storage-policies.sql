-- Ran once in the Supabase SQL editor when the note-files bucket was
-- created. Kept here so the ownership model is reviewable in code, not
-- just the dashboard - see lib/storage.ts for the matching upload helpers.

-- storage.objects has no concept of "which file belongs to which user"
-- the way our app tables do via user_id columns. Uploading every file as
-- `<userId>/<filename>` lets storage.foldername(name) recover that user
-- id for comparison against auth.uid() - the standard Supabase pattern.

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

-- No update policy: re-uploading an attachment creates a new path (a
-- fresh Date.now() prefix) instead of mutating the old object, avoiding
-- races like an open signed URL hitting an in-flight overwrite. Old files
-- linger until explicitly deleted - an acceptable tradeoff for M2.