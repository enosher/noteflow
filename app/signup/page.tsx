'use client'

// The sign-up page: a simple form for creating a new account.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
    <main className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-bold text-ink">Create account</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-line bg-transparent px-4 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-line bg-transparent px-4 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Sign up'}
        </button>

        {message && (
          <div className={`text-center text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message.text}
          </div>
        )}

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  )
}