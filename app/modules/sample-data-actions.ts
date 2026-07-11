'use server';

// Lets any signed-in user pull in the same sample data the backfill
// script uses, so a fresh signup never lands on a blank Modules page.
// Runs under the caller's own RLS session - it can only write to itself.

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
