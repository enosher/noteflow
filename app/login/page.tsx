'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { demoLogin } from './demo-actions'
import { SubmitButton } from '@/components/SubmitButton'

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
    <main className="flex min-h-screen items-center justify-center p-8">
      {/* Two sibling forms, not one - the demo button posts to a server
          action and can't legally nest inside the credentials form. */}
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Log in</h1>

        <form action={demoLogin}>
          <SubmitButton
            pendingText="Signing in..."
            className="w-full rounded-md bg-brand px-4 py-2 font-medium text-card"
          >
            Try the demo
          </SubmitButton>
          <p className="mt-2 text-center text-sm text-muted">
            One click, no signup - explore a pre-filled account.
          </p>
        </form>

        <div className="flex items-center gap-3 text-sm text-muted">
          <div className="h-px flex-1 bg-line" />
          or log in
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          {error && (
            <div className="text-sm text-center text-red-600">{error}</div>
          )}

          <p className="text-sm text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}