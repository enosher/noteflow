'use client'

// The sign-up page: a simple form for creating a new account.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FlowMark } from '@/components/FlowMark'
import { AuthBrandPanel } from '@/components/AuthBrandPanel'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Account created. Please log in.' })
      setTimeout(() => router.push('/login'), 1500)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel, visual signature - hidden below lg */}
      <AuthBrandPanel
        headline="Turn your notes into a map of what you actually understand."
        subtext="Organise modules, generate practice questions, and let NoteFlow flag the topics that need another look."
        caption="Built for focused study."
      />

      {/* Right: signup form */}
      <div className="flex items-center justify-center bg-surface p-6 sm:p-10">
        <div className="w-full max-w-sm animate-rise-in">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <FlowMark size={84} />
            <span className="font-display text-2xl font-semibold text-ink">
              NoteFlow
            </span>
          </div>

          <div className="rounded-lg border border-line/70 bg-card p-8 sm:p-10">
            <h1 className="font-display text-[26px] font-semibold text-ink">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Free, no credit card - just a study tool.
            </p>

            <form onSubmit={handleSignup} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-muted/70 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-muted/70 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Sign up'}
              </button>

              {message && (
                <div
                  className="text-sm text-center"
                  style={{
                    color:
                      message.type === 'error'
                        ? 'var(--mastery-weak)'
                        : 'var(--mastery-strong)',
                  }}
                >
                  {message.text}
                </div>
              )}

              <p className="pt-1 text-center text-sm text-muted">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-brand hover:text-brand-hover underline underline-offset-2">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
