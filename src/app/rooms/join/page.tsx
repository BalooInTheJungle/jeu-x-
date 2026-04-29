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
    <main style={{
      minHeight: '100vh', background: '#FAFAF8',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A2E', margin: '0 0 8px' }}>
          Rejoindre une partie
        </h1>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#999', marginBottom: 32 }}>
          Demande le code à ton ami qui a créé la room.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1A1A2E', marginBottom: 6 }}>
              Code de la room
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XKZP"
              maxLength={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                borderRadius: 16, border: '2px solid #E8E8E8',
                background: '#FFF',
                padding: '14px 20px',
                fontSize: 28, fontWeight: 900, color: '#1A1A2E',
                textAlign: 'center', letterSpacing: 8,
                textTransform: 'uppercase',
                fontFamily: "'Nunito', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1A1A2E', marginBottom: 6 }}>
              Ton pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : Luigi"
              maxLength={20}
              style={{
                width: '100%', boxSizing: 'border-box',
                borderRadius: 16, border: '2px solid #E8E8E8',
                background: '#FFF',
                padding: '14px 20px',
                fontSize: 16, fontWeight: 700, color: '#1A1A2E',
                fontFamily: "'Nunito', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E53935', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || !username.trim()}
            style={{
              width: '100%', padding: 18,
              borderRadius: 20, border: 'none',
              background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
              color: '#FFF', fontSize: 17, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
              cursor: 'pointer',
              opacity: (loading || !code.trim() || !username.trim()) ? 0.5 : 1,
            }}
          >
            {loading ? 'Connexion...' : '🚀 Rejoindre'}
          </button>
        </form>
      </div>
    </main>
  )
}
