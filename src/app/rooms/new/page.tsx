'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const GAME_LABELS: Record<string, string> = {
  undercover: 'Undercover',
  image_quiz: 'Image Quiz',
}

function NewRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameType = searchParams.get('game') ?? 'undercover'
  const gameLabel = GAME_LABELS[gameType] ?? gameType

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
        body: JSON.stringify({ gameType, hostUsername: username.trim() }),
      })

      const data = await res.json() as { room?: { code: string }; player?: { id: string }; error?: string }

      if (!res.ok || !data.room || !data.player) {
        setError(data.error ?? 'Impossible de créer la room')
        return
      }

      localStorage.setItem(`player_${data.room.code}`, data.player.id)
      router.push(`/rooms/${data.room.code}`)
    } catch {
      setError('Erreur réseau — réessaie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-sm">
        <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">{gameLabel}</p>
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
              autoFocus
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Création...' : 'Créer la room'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function NewRoomPage() {
  return (
    <Suspense>
      <NewRoomForm />
    </Suspense>
  )
}
