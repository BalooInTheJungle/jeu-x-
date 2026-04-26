'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinRoomPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !username.trim()) return

    setLoading(true)
    setError('')

    const upperCode = code.trim().toUpperCase()

    try {
      const res = await fetch(`/api/rooms/${upperCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })

      const data = await res.json() as { player?: { id: string }; error?: string }

      if (!res.ok || !data.player) {
        setError(data.error ?? 'Impossible de rejoindre la room')
        return
      }

      localStorage.setItem(`player_${upperCode}`, data.player.id)
      router.push(`/rooms/${upperCode}`)
    } catch {
      setError('Erreur réseau — réessaie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Rejoindre une partie</h1>
        <p className="text-slate-400 mb-8">Demande le code à ton ami qui a créé la room.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Code de la room</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex : XKZP"
              maxLength={4}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-slate-500 uppercase tracking-widest text-center text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Ton pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : Luigi"
              maxLength={20}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !code.trim() || !username.trim()}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </main>
  )
}
