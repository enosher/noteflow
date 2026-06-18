import { createClient } from "@/lib/supabase/server";

const BUCKET = "note-files";

/**
 * Upload a file into the user's own folder and return the storage path.
 *
 * Why sanitize the filename: user-supplied filenames can contain spaces,
 * unicode, or characters like `#` and `?` that are valid in a filesystem
 * but get mangled or misinterpreted once they're part of a storage path /
 * URL. Replace anything outside [a-z A-Z 0-9.\-_] with an underscore.
 *
 * Why prefix with Date.now(): two different uploads of a file with the same
 * original name (e.g. re-uploading "lecture4.pdf" after editing it locally)
 * would otherwise collide on the exact same path. The timestamp prefix
 * makes every upload's path unique without us having to track or check for
 * existing files first.
 *
 * Why return a bare path rather than a URL: the bucket is private, so there
 * is no public URL to hand back. The path is only useful in combination
 * with getSignedNoteFileUrl below. Keeping that distinction explicit in
 * the return type (string, not "url") is meant to stop anyone from
 * accidentally rendering this value directly as an <a href>.
 */
export async function uploadNoteFile(file: File, userId: string): Promise<string> {
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(`File upload failed: ${error.message}`);

  return path;
}

/**
 * Get a temporary signed URL for displaying/downloading a stored file.
 *
 * Why generate this fresh on every view instead of storing a URL: anyone 
 * holding a sgned url can read the file until it expires, bypassing RLS entirely (intended). 
 * Storing one in the notes table would mean either it goes stale uselessly fast (waste of space), 
 * or it lives long enough to be a leak if the note row were ever exposed. 
 * Generating it on demand, scoped to a single page render, 
 * keeps the actual "is this allowed" check anchored to RLS at
 * upload/delete time and to this function's auth.uid() check implicitly
 * (createClient() here carries the signed-in user's session, so the
 * createSignedUrl call itself only succeeds for objects under that user's
 * RLS-permitted paths).
 *
 * Why 1 hour life-span: long enough that a slow page load or a student changing tabs away
 * middle-revision-session doesn't break the link, short enough that a leaked
 * URL (copied into a whatsapp message) isn't a standing liability.
 */

export async function getSignedNoteFileUrl(path: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data) return null;

  return data.signedUrl;
}