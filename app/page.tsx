import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">NoteFlow</h1>
        <p className="text-gray-600 mb-4">Supabase connection test</p>
        <div className="text-sm text-left bg-gray-100 p-4 rounded">
          <div>Session: {data.session ? '✅ logged in' : '❌ null (correct)'}</div>
          <div>Error: {error ? `❌ ${error.message}` : '✅ null (good)'}</div>
        </div>
      </div>
    </main>
  )
}