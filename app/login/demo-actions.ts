'use server';

// Logs in as the shared demo account, so visitors can try the app
// without signing up first.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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