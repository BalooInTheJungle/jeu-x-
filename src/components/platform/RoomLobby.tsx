'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import UndercoverGameView from '@/components/games/undercover/GameView'
import ElduGameView from '@/components/games/eldu/GameView'
import type { RoomPlayerRow, RoomRow } from '@/lib/platform/types'

interface Props {
  initialRoom: RoomRow & { room_players: RoomPlayerRow[] }
  currentPlayerId: string
}

export default function RoomLobby({ initialRoom, currentPlayerId }: Props) {
  const [players, setPlayers] = useState<RoomPlayerRow[]>(initialRoom.room_players)
  const [status, setStatus] = useState(initialRoom.status)
  const [room, setRoom] = useState(initialRoom)
  const [starting, setStarting] = useState(false)

  const isHost = initialRoom.host_id === currentPlayerId
  const code = initialRoom.code

  useEffect(() => {
    const supabase = createClient()

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
          console.log('[RoomLobby] room update:', payload.new.status)
          setStatus(payload.new.status as RoomRow['status'])
          setRoom(prev => ({ ...prev, ...(payload.new as RoomRow) }))
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [initialRoom.id])

  if (status === 'playing' || status === 'finished') {
    const liveRoom = { ...room, room_players: players }

    if (room.game_type === 'undercover') {
      return <UndercoverGameView room={liveRoom} roomCode={code} currentPlayerId={currentPlayerId} />
    }

    if (room.game_type === 'eldu') {
      return <ElduGameView room={liveRoom} roomCode={code} currentPlayerId={currentPlayerId} />
    }

    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-indigo-400">La partie commence !</p>
        <p className="mt-2 text-slate-400">Interface du jeu en cours de chargement...</p>
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
        <p className="text-sm text-slate-400 mb-3">
          {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}
        </p>
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

      {/* Config + actions */}
      {isHost ? (
        room.game_type === 'undercover' ? (
          <UndercoverConfig code={code} playerId={currentPlayerId} players={players} />
        ) : room.game_type === 'eldu' ? (
          <ElduConfig code={code} playerId={currentPlayerId} players={players} />
        ) : (
          <GenericStartButton
            onStart={async () => {
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
            }}
            disabled={starting || players.length < 1}
            loading={starting}
          />
        )
      ) : (
        <p className="text-center text-slate-400">En attente que le host démarre...</p>
      )}
    </div>
  )
}

// — Bouton de démarrage générique —

function GenericStartButton({
  onStart,
  disabled,
  loading,
}: {
  onStart: () => void
  disabled: boolean
  loading: boolean
}) {
  return (
    <Button onClick={onStart} disabled={disabled} className="w-full py-4 text-lg">
      {loading ? 'Démarrage...' : 'Démarrer la partie'}
    </Button>
  )
}

// — Config Undercover —

interface UndercoverConfigProps {
  code: string
  playerId: string
  players: RoomPlayerRow[]
}

type Theme = 'general' | 'one_piece' | 'brawl_stars' | 'custom'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'one_piece', label: 'One Piece' },
  { value: 'brawl_stars', label: 'Brawl Stars' },
  { value: 'custom', label: 'Mots perso' },
]

function UndercoverConfig({ code, playerId, players }: UndercoverConfigProps) {
  const [theme, setTheme] = useState<Theme>('general')
  const [mrWhite, setMrWhite] = useState(true)
  const [hostSpectator, setHostSpectator] = useState(false)
  const [civilWord, setCivilWord] = useState('')
  const [undercoverWord, setUndercoverWord] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (players.length < 3) {
      setError('Il faut au moins 3 joueurs')
      return
    }
    setStarting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        playerId,
        theme,
        mrWhiteEnabled: mrWhite,
        hostIsSpectator: hostSpectator,
      }
      if (theme === 'custom') {
        if (!civilWord.trim() || !undercoverWord.trim()) {
          setError('Les deux mots sont requis en mode personnalisé')
          setStarting(false)
          return
        }
        body.customWords = { civil: civilWord.trim(), undercover: undercoverWord.trim() }
      }

      const res = await fetch(`/api/rooms/${code}/undercover/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur de démarrage')
    } catch {
      setError('Erreur réseau')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Thème */}
      <div>
        <p className="text-sm text-slate-400 mb-2">Thème</p>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                theme === t.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mots personnalisés */}
      {theme === 'custom' && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={civilWord}
            onChange={e => setCivilWord(e.target.value)}
            placeholder="Mot des civils"
            className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={undercoverWord}
            onChange={e => setUndercoverWord(e.target.value)}
            placeholder="Mot de l'undercover"
            className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Options */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer">
          <div>
            <p className="font-medium text-sm">Mr. White</p>
            <p className="text-xs text-slate-500">Un joueur sans mot qui doit bluffer</p>
          </div>
          <button
            role="switch"
            aria-checked={mrWhite}
            onClick={() => setMrWhite(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${mrWhite ? 'bg-indigo-600' : 'bg-zinc-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${mrWhite ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>

        <label className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer">
          <div>
            <p className="font-medium text-sm">Je suis spectateur</p>
            <p className="text-xs text-slate-500">Tu animes la partie sans jouer</p>
          </div>
          <button
            role="switch"
            aria-checked={hostSpectator}
            onClick={() => setHostSpectator(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${hostSpectator ? 'bg-indigo-600' : 'bg-zinc-600'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${hostSpectator ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <Button
        onClick={handleStart}
        disabled={starting || players.length < 3}
        className="w-full py-4 text-lg mt-2"
      >
        {starting ? 'Génération des mots...' : 'Lancer Undercover'}
      </Button>

      {players.length < 3 && (
        <p className="text-center text-slate-500 text-sm">
          Encore {3 - players.length} joueur{3 - players.length > 1 ? 's' : ''} pour démarrer
        </p>
      )}
    </div>
  )
}

// — Config Image Quiz —

const ELDU_THEMES = [
  { value: 'brawl_stars', label: '🎮 Brawl Stars' },
  { value: 'flags', label: '🌍 Drapeaux' },
  { value: 'rappers_fr', label: '🎤 Rappeurs FR' },
] as const

function ElduConfig({ code, playerId, players }: UndercoverConfigProps) {
  const nonHostPlayers = players.filter(p => !p.is_host)
  const [theme, setTheme] = useState<'brawl_stars' | 'flags' | 'rappers_fr'>('brawl_stars')
  const [duration, setDuration] = useState(60)
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (nonHostPlayers.length < 2) {
      setError('Il faut au moins 2 joueurs (hors arbitre)')
      return
    }
    setStarting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${code}/eldu/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, theme, durationPerPlayer: duration, difficulty }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur de démarrage')
    } catch {
      setError('Erreur réseau')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Rôle arbitre */}
      <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-amber-300">Tu es l&apos;arbitre 🎯</p>
        <p className="text-xs text-amber-500/80 mt-0.5">Tu vois les réponses et tu valides à la voix</p>
      </div>

      {/* Thème */}
      <div>
        <p className="text-sm text-slate-400 mb-2">Thème</p>
        <div className="grid grid-cols-3 gap-2">
          {ELDU_THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                theme === t.value ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div>
        <p className="text-sm text-slate-400 mb-2">Temps par joueur</p>
        <div className="grid grid-cols-3 gap-2">
          {[30, 60, 90].map(s => (
            <button
              key={s}
              onClick={() => setDuration(s)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                duration === s ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>

      {/* Difficulté */}
      <div>
        <p className="text-sm text-slate-400 mb-2">Difficulté</p>
        <div className="grid grid-cols-2 gap-2">
          {([['normal', 'Normal'], ['hard', 'Difficile 🌫️']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDifficulty(val)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                difficulty === val ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <Button
        onClick={handleStart}
        disabled={starting || nonHostPlayers.length < 2}
        className="w-full py-4 text-lg mt-2"
      >
        {starting ? 'Chargement des images...' : 'Lancer ELDU'}
      </Button>

      {nonHostPlayers.length < 2 && (
        <p className="text-center text-slate-500 text-sm">
          Encore {2 - nonHostPlayers.length} joueur{2 - nonHostPlayers.length > 1 ? 's' : ''} pour démarrer
        </p>
      )}
    </div>
  )
}
