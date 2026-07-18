'use client'

// A button that signs the user out and sends them back to the login page.
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resetDemoAccountIfNeeded } from '@/app/login/demo-actions'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    // Reset the demo account back to its seeded state before signing out,
    // while the session can still prove it's the demo account (RLS-scoped -
    // a no-op for every other user). Keeps the demo consistent for whoever
    // clicks "Try the demo" next, instead of inheriting this session's
    // graded reviews/added notes/etc.
    await resetDemoAccountIfNeeded()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-line/30"
    >
      Log out
    </button>
  )
}