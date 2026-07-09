'use server';

// Self-service half of "seed all accounts, current and new". Lets any
// signed-in user pull in the same sample dataset the backfill script
// uses, so a fresh signup (an evaluator who skips the demo login, or
// a real student poking around) is never stuck at a blank Modules
// page. Runs under the caller's own RLS-scoped session — it can only
// ever write into the account that called it.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { seedAccountData } from '@/lib/seed-data';
import { friendlyMessage } from '@/lib/errors';

export async function loadSampleData(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  try {
    await seedAccountData(supabase, user.id);
  } catch (error) {
    throw new Error(
      friendlyMessage(error as { code?: string; message: string })
    );
  }

  revalidatePath('/modules');
  revalidatePath('/dashboard');
}
