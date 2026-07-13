// The site's home page. Right now it just checks that Supabase is connected.
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold mb-4">NoteFlow</h1>
        <p className="text-muted mb-4">Supabase connection test</p>
        <div className="text-sm text-left bg-surface p-4 rounded">
          <div>Session: {data.session ? '✅ logged in' : '❌ null (correct)'}</div>
          <div>Error: {error ? `❌ ${error.message}` : '✅ null (good)'}</div>
        </div>
      </div>
    </main>
  )
}