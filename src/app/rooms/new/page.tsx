'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { GAME_THEMES, DEFAULT_THEME } from '@/lib/games/theme'

function NewRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameType = searchParams.get('game') ?? 'undercover'
  const theme = GAME_THEMES[gameType] ?? DEFAULT_THEME

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
    <main style={{
      minHeight: '100vh', background: '#FAFAF8',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header band with game gradient */}
      <div style={{
        background: theme.gradient,
        padding: '48px 24px 36px',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-10, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>

        <div style={{
          fontSize: 64, lineHeight: 1, marginBottom: 12,
          animation: `${theme.floatAnimation} 3s ease-in-out infinite`,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))',
        }}>
          {theme.emoji}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>
          Nouvelle partie
        </h1>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
          {theme.name} · Tu seras le host
        </p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1A1A2E', marginBottom: 6 }}>
              Ton pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : Mario"
              maxLength={20}
              autoFocus
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
            disabled={loading || !username.trim()}
            style={{
              width: '100%', padding: 18,
              borderRadius: 20, border: 'none',
              background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
              color: '#FFF', fontSize: 17, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
              cursor: 'pointer',
              opacity: (loading || !username.trim()) ? 0.5 : 1,
              marginTop: 8,
            }}
          >
            {loading ? 'Création...' : '🚀 Créer la room'}
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
