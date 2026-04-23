'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRoomPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'image_quiz', hostUsername: username.trim() }),
      })

      const data = await res.json() as { room?: { code: string }; player?: { id: string }; error?: string }

      if (!res.ok || !data.room || !data.player) {
        setError(data.error ?? 'Impossible de créer la room')
        return
      }

      // Stocke l'ID joueur pour savoir qui "je" suis dans la room
      localStorage.setItem(`player_${data.room.code}`, data.player.id)
      router.push(`/rooms/${data.room.code}`)
    } catch {
      setError('Erreur réseau — réessaie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Nouvelle partie</h1>
        <p className="text-slate-400 mb-8">Tu seras le host — tu partages le code avec tes amis.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ton pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : Mario"
              maxLength={20}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Création...' : 'Créer la room'}
          </button>
        </form>
      </div>
    </main>
  )
}
