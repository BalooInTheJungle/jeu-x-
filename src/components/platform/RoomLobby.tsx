'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RoomPlayerRow, RoomRow } from '@/lib/platform/types'

interface Props {
  initialRoom: RoomRow & { room_players: RoomPlayerRow[] }
  currentPlayerId: string
}

export default function RoomLobby({ initialRoom, currentPlayerId }: Props) {
  const [players, setPlayers] = useState<RoomPlayerRow[]>(initialRoom.room_players)
  const [status, setStatus] = useState(initialRoom.status)
  const [starting, setStarting] = useState(false)

  const isHost = initialRoom.host_id === currentPlayerId
  const code = initialRoom.code

  useEffect(() => {
    const supabase = createClient()

    // Abonnement aux nouveaux joueurs
    const channel = supabase
      .channel(`room-${initialRoom.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${initialRoom.id}` },
        (payload) => {
          console.log('[RoomLobby] player change:', payload.eventType)
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as RoomPlayerRow])
          }
          if (payload.eventType === 'UPDATE') {
            setPlayers((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as RoomPlayerRow) : p)))
          }
          if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${initialRoom.id}` },
        (payload) => {
          console.log('[RoomLobby] room status change:', payload.new.status)
          setStatus(payload.new.status as RoomRow['status'])
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [initialRoom.id])

  async function handleStart() {
    setStarting(true)
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Impossible de démarrer')
      }
    } finally {
      setStarting(false)
    }
  }

  if (status === 'playing') {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-indigo-400">La partie commence !</p>
        <p className="mt-2 text-slate-400">L&apos;interface du jeu arrive bientôt...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Code de la room */}
      <div className="text-center mb-8">
        <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Code de la room</p>
        <p className="text-6xl font-bold tracking-widest text-indigo-400">{code}</p>
        <p className="mt-2 text-slate-500 text-sm">Partage ce code avec tes amis</p>
      </div>

      {/* Liste des joueurs */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-slate-400 mb-3">{players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}</p>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-medium">{p.username}</span>
              {p.is_host && <span className="text-xs text-slate-400 ml-auto">host</span>}
              {p.id === currentPlayerId && <span className="text-xs text-indigo-400 ml-auto">toi</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {isHost ? (
        <button
          onClick={handleStart}
          disabled={starting || players.length < 1}
          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? 'Démarrage...' : 'Démarrer la partie'}
        </button>
      ) : (
        <p className="text-center text-slate-400">En attente que le host démarre...</p>
      )}
    </div>
  )
}
