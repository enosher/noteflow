"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { friendlyMessage } from "@/lib/errors";

/**
 * createModule - server action called when the new module form is submitted.
 *
 * revalidatePath("/modules") clears the cached module list so the new
 * module appears immediately when we redirect back there.
 */
export async function createModule(formData: FormData) {
  const supabase = await createClient();

  // Confirm the user is signed in before touching the database.
  // Middleware should catch unauthenticated users before they reach this
  // page, but we check here too as a safety net.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  // Basic server-side validation. The form has required attributes too,
  // but those are bypassable - always validate on the server.
  if (!code || !name) {
    throw new Error("Code and name are required.");
  }

  const { error } = await supabase.from("modules").insert({
    user_id: user.id,
    code,
    name,
    description,
  });

  // !!!!! Will be replaced with form-level error display in Week 4 polish.
  if (error) {
    console.error("[createModule] Insert failed:", error.message);
    throw new Error(friendlyMessage(error));
  }

  revalidatePath("/modules");
  redirect("/modules");
}