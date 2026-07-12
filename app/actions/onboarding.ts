'use server';

import { createClient } from '@/lib/supabase/server';

export type OnboardingStatus = {
  hasModule: boolean;
  hasNote: boolean;
  hasQuestion: boolean;
  hasAttempt: boolean;
};

// Four count queries, head-only so they're cheap enough to run on
// every dashboard load. When all four are true we stop rendering
// the checklist.
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [modules, notes, questions, attempts] = await Promise.all([
    supabase.from('modules').select('id', { count: 'exact', head: true }),
    supabase.from('notes').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return {
    hasModule: (modules.count ?? 0) > 0,
    hasNote: (notes.count ?? 0) > 0,
    hasQuestion: (questions.count ?? 0) > 0,
    hasAttempt: (attempts.count ?? 0) > 0,
  };
}