"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// moduleId is bound by the page via createTopic.bind(null, moduleId)
export async function createTopic(moduleId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) throw new Error("Name is required.");

  const { error } = await supabase.from("topics").insert({
    module_id: moduleId,
    name,
    description,
    // M2 doesnt ship manual topic reordering, so every topic gets the
    // same default order_index. The column exists in the schema for
    // a future feature, not because it's used yet.
    order_index: 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleId}`);
  redirect(`/modules/${moduleId}`);
}