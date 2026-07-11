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
        <h1 className="text-2xl font-bold text-center">Create account</h1>

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
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Sign up'}
        </button>

        {message && (
          <div className={`text-sm text-center ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </div>
        )}

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  )
}