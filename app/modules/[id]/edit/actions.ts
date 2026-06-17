"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateModule(moduleId: string, formData: FormData) {
  const supabase = await createClient();

  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!code || !name) throw new Error("Code and name are required.");

  const { error } = await supabase
    .from("modules")
    .update({ code, name, description })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/modules");
  revalidatePath(`/modules/${moduleId}`);
  redirect(`/modules/${moduleId}`);
}

export async function deleteModule(moduleId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath("/modules");
  redirect("/modules");
}