import { createClient } from "@/lib/supabase/server";

const BUCKET = "note-files";

/**
 * Uploads a file into the user's own folder and returns its storage path.
 *
 * The filename is cleaned up first: odd characters (spaces, symbols like
 * `#` or `?`) get replaced with an underscore so the path stays safe to use.
 * A timestamp is added to the front so two uploads with the same filename
 * never overwrite each other.
 *
 * Returns a plain path, not a link, since the storage bucket is private
 * and has no public URL. Use getSignedNoteFileUrl below to turn this path
 * into something a browser can actually open.
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
 * Gets a temporary link for viewing or downloading a stored file.
 *
 * A fresh link is created every time the page loads, instead of saving
 * one, so an old link can't be copied and shared to read the file later.
 * It lasts one hour: long enough to survive a slow page load, short
 * enough that a leaked link (say, pasted into a chat) stops working soon.
 */

export async function getSignedNoteFileUrl(path: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data) return null;

  return data.signedUrl;
}