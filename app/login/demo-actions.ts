'use server';

// Logs in as the shared demo account, so visitors can try the app
// without signing up first.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { seedDemoAccountData } from '@/lib/seed-demo-data';

export async function demoLogin() {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Demo login is not configured. DEMO_EMAIL and DEMO_PASSWORD must be set.'
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {

    throw new Error(
      'The demo account is unavailable right now. You can still sign up for a free account below.'
    );
  }

  redirect('/dashboard');
}

// Resets the shared demo account back to its seeded starting state.
// Called right before logout, only when the signed-in user IS the demo
// account - a visitor's own graded reviews, added notes, etc. would
// otherwise persist and leak into the next person's "first look" at the
// app, which is exactly the staleness bug M3 QA caught (see manual-test-log.md).
//
// Runs as the caller's own authenticated session, not service-role: RLS
// already scopes every delete/insert to auth.uid(), so this can only ever
// reset the account that's actually logged in right now, never anyone else's.
export async function resetDemoAccountIfNeeded(): Promise<void> {
  const email = process.env.DEMO_EMAIL;
  if (!email) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== email) return;

  await seedDemoAccountData(supabase, user.id);
}