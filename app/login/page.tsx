'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { demoLogin } from './demo-actions'
import { SubmitButton } from '@/components/SubmitButton'
import { FlowMark } from '@/components/FlowMark'
import { AuthBrandPanel } from '@/components/AuthBrandPanel'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel, visual signature - hidden below lg */}
      <AuthBrandPanel
        headline="Know exactly what you know - and what to study next."
        subtext="NoteFlow tracks your quiz performance topic by topic, so practice time goes where it actually helps."
      />

      {/* Right: auth form */}
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
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Log in to pick up where you left off.
            </p>

            <form action={demoLogin} className="mt-7">
              <SubmitButton
                pendingText="Signing in..."
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/30"
              >
                Try the demo
              </SubmitButton>
              <p className="mt-2 text-center text-xs text-muted">
                One click, no signup - explore a pre-filled account.
              </p>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
              <div className="h-px flex-1 bg-line" />
              or log in
              <div className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-muted/70 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>

              {error && (
                <div className="text-sm text-center text-mastery-weak">{error}</div>
              )}

              <p className="pt-1 text-center text-sm text-muted">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-brand hover:text-brand-hover underline underline-offset-2">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
