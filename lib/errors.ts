// Postgres error codes are stable and documented; Supabase passes them
// through on the error object. We translate the few a user can actually
// cause from the UI and let everything else fall through verbatim.
const FRIENDLY: Record<string, string> = {
  '23505': 'That already exists — try a different name.',
  '23503': 'Something this depends on is missing. Refresh and try again.',
  '23514': "That input isn't valid here. Check the form and try again.",
  '42501': "You don't have access to that item.",
};

export function friendlyMessage(error: {
  code?: string;
  message: string;
}): string {
  return (error.code && FRIENDLY[error.code]) || error.message;
}