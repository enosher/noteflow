'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Success! Check your email for the confirmation link!')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Sign Up for NoteFlow</h1>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.5rem', color: '#000', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.5rem', color: '#000', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Up
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem', textAlign: 'center', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  )
}