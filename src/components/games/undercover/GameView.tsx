'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { UndercoverState, UndercoverRole, EliminatedEntry } from '@/types/games/undercover'

interface Props {
  room: RoomRow & { room_players: RoomPlayerRow[] }
  roomCode: string
  currentPlayerId: string
}

interface MyRole {
  role: UndercoverRole
  word: string
}

const AVATAR_BG = [
  '#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981',
  '#f59e0b', '#f97316', '#14b8a6', '#ec4899',
]

const ROLE_LABELS: Record<UndercoverRole, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mr_white: 'Mr. White',
}

const ROLE_PILL: Record<UndercoverRole, string> = {
  civil: 'bg-emerald-900 text-emerald-300 border border-emerald-700',
  undercover: 'bg-red-900 text-red-300 border border-red-700',
  mr_white: 'bg-zinc-800 text-slate-300 border border-zinc-600',
}

function playerColor(id: string, order: string[]): string {
  const i = order.indexOf(id)
  return AVATAR_BG[(i >= 0 ? i : 0) % AVATAR_BG.length]
}

function Avatar({ id, order, name, size = 'md' }: { id: string; order: string[]; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = playerColor(id, order)
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div
      style={{ backgroundColor: color }}
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function UndercoverGameView({ room, roomCode, currentPlayerId }: Props) {
  const isHost = room.room_players.some(p => p.id === currentPlayerId && p.is_host)
  const [state, setState] = useState<UndercoverState>(room.state as UndercoverState)
  const [myRole, setMyRole] = useState<MyRole | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)
  const [descriptionText, setDescriptionText] = useState('')
  const [guessText, setGuessText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getUsername = useCallback((id: string) => state.playerNames?.[id] ?? id, [state.playerNames])
  const order = state.speakingOrder

  useEffect(() => {
    const active = state.alivePlayers.includes(currentPlayerId) ||
      state.eliminated.some(e => e.playerId === currentPlayerId)
    if (!active) { setLoadingRole(false); return }

    fetch(`/api/rooms/${roomCode}/my-role?playerId=${currentPlayerId}`)
      .then(r => r.json())
      .then((data: MyRole) => setMyRole(data))
      .catch(() => setMyRole(null))
      .finally(() => setLoadingRole(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`undercover-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => { setState(payload.new.state as UndercoverState) })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [room.id])

  const submitAction = useCallback(async (payload: Record<string, unknown>) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/undercover/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, ...payload }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Erreur inconnue')
    } catch { setError('Erreur réseau') }
    finally { setSubmitting(false) }
  }, [roomCode, currentPlayerId])

  if (loadingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm">Chargement de ton rôle…</p>
      </div>
    )
  }

  if (state.undercoverPhase === 'finished') {
    return (
      <FinishedScreen
        state={state}
        myRole={myRole}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        roomCode={roomCode}
        getUsername={getUsername}
        order={order}
      />
    )
  }

  const isAlive = state.alivePlayers.includes(currentPlayerId)
  const isSpectator = !isAlive && state.pendingGuesser !== currentPlayerId
  const myColor = playerColor(currentPlayerId, order)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* ── Header : rôle + mot ── */}
      <div className="px-4 pt-safe pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
            Cycle {state.cycle}
          </span>
          {myRole && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_PILL[myRole.role]}`}>
              {ROLE_LABELS[myRole.role]}
            </span>
          )}
        </div>

        {myRole?.word ? (
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Ton mot</p>
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color: myColor }}
            >
              {myRole.word}
            </p>
          </div>
        ) : myRole?.role === 'mr_white' ? (
          <div className="text-center py-1">
            <p className="text-2xl font-black text-zinc-600">???</p>
            <p className="text-xs text-zinc-500 mt-1">Tu n&apos;as pas de mot — bluff !</p>
          </div>
        ) : null}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 px-4 py-5 overflow-y-auto flex flex-col gap-4">
        {isSpectator && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center text-zinc-500 text-sm">
            Tu es éliminé · mode spectateur
          </div>
        )}

        {state.undercoverPhase === 'description' && (
          <DescriptionPhase
            state={state}
            currentPlayerId={currentPlayerId}
            isAlive={isAlive}
            descriptionText={descriptionText}
            setDescriptionText={setDescriptionText}
            submitting={submitting}
            getUsername={getUsername}
            order={order}
            onSubmit={() => {
              if (!descriptionText.trim()) return
              void submitAction({ type: 'description', text: descriptionText })
              setDescriptionText('')
            }}
          />
        )}

        {state.undercoverPhase === 'vote' && (
          <VotePhase
            state={state}
            currentPlayerId={currentPlayerId}
            isAlive={isAlive}
            submitting={submitting}
            getUsername={getUsername}
            order={order}
            onVote={(targetId) => void submitAction({ type: 'vote', targetId })}
          />
        )}

        {state.undercoverPhase === 'guess' && (
          <GuessPhase
            state={state}
            currentPlayerId={currentPlayerId}
            guessText={guessText}
            setGuessText={setGuessText}
            submitting={submitting}
            getUsername={getUsername}
            order={order}
            onSubmit={() => {
              if (!guessText.trim()) return
              void submitAction({ type: 'guess', word: guessText })
              setGuessText('')
            }}
          />
        )}

        {error && (
          <div className="bg-red-950/60 border border-red-800 rounded-2xl p-3 text-red-400 text-sm text-center animate-pulse">
            {error}
          </div>
        )}
      </div>

      {/* ── Footer : joueurs ── */}
      <div className="px-4 pb-8 pt-3 border-t border-zinc-800/60">
        <div className="flex gap-2 flex-wrap">
          {state.alivePlayers.map(id => (
            <div key={id} className="flex items-center gap-1.5 bg-zinc-900 rounded-full px-3 py-1.5">
              <Avatar id={id} order={order} name={getUsername(id)} size="sm" />
              <span className="text-xs text-zinc-300 font-medium">
                {id === currentPlayerId ? `${getUsername(id)} (toi)` : getUsername(id)}
              </span>
            </div>
          ))}
          {state.eliminated.map(e => (
            <div key={e.playerId} className="flex items-center gap-1.5 bg-zinc-900/40 rounded-full px-3 py-1.5 opacity-40">
              <Avatar id={e.playerId} order={order} name={getUsername(e.playerId)} size="sm" />
              <span className="text-xs text-zinc-500 font-medium line-through">{getUsername(e.playerId)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Phase description ────────────────────────────────────────────────────────

interface DescriptionPhaseProps {
  state: UndercoverState
  currentPlayerId: string
  isAlive: boolean
  descriptionText: string
  setDescriptionText: (v: string) => void
  submitting: boolean
  getUsername: (id: string) => string
  order: string[]
  onSubmit: () => void
}

function DescriptionPhase({ state, currentPlayerId, isAlive, descriptionText, setDescriptionText, submitting, getUsername, order, onSubmit }: DescriptionPhaseProps) {
  const isMyTurn = state.currentSpeaker === currentPlayerId
  const aliveInOrder = state.speakingOrder.filter(id => state.alivePlayers.includes(id))

  return (
    <div className="flex flex-col gap-4">
      {/* Banner */}
      <div className={`rounded-2xl px-4 py-3 text-center ${isMyTurn ? 'bg-indigo-950 border border-indigo-700' : 'bg-zinc-900 border border-zinc-800'}`}>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Tour de parole</p>
        {isMyTurn ? (
          <p className="text-lg font-bold text-indigo-300 animate-pulse">C&apos;est ton tour !</p>
        ) : (
          <p className="text-base font-semibold text-zinc-300">
            <span style={{ color: playerColor(state.currentSpeaker ?? '', order) }}>
              {getUsername(state.currentSpeaker ?? '')}
            </span>
            {' '}parle…
          </p>
        )}
      </div>

      {/* Ordre de passage */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {aliveInOrder.map(id => {
          const done = !!state.descriptions[id]
          const current = state.currentSpeaker === id
          return (
            <div
              key={id}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all ${
                done ? 'bg-zinc-900 border-zinc-700 opacity-50' :
                current ? 'bg-indigo-950 border-indigo-600' :
                'bg-zinc-900 border-zinc-800'
              }`}
            >
              <Avatar id={id} order={order} name={getUsername(id)} size="sm" />
              <span className="text-xs font-medium text-zinc-300">{getUsername(id)}</span>
              {done && <span className="text-emerald-500 text-xs">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Descriptions soumises */}
      {Object.entries(state.descriptions).map(([pid, desc]) => (
        <div key={pid} className="flex items-start gap-3 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
          <Avatar id={pid} order={order} name={getUsername(pid)} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">{pid === currentPlayerId ? `${getUsername(pid)} (toi)` : getUsername(pid)}</p>
            <p className="text-white font-semibold">{desc}</p>
          </div>
        </div>
      ))}

      {/* Input */}
      {isMyTurn && isAlive && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={descriptionText}
            onChange={e => setDescriptionText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="Un seul mot ou courte expression…"
            maxLength={40}
            autoFocus
            className="w-full bg-zinc-900 border border-indigo-600 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <Button
            onClick={onSubmit}
            disabled={submitting || !descriptionText.trim()}
            className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-2xl"
          >
            {submitting ? 'Envoi…' : 'Valider'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Phase vote ───────────────────────────────────────────────────────────────

interface VotePhaseProps {
  state: UndercoverState
  currentPlayerId: string
  isAlive: boolean
  submitting: boolean
  getUsername: (id: string) => string
  order: string[]
  onVote: (targetId: string) => void
}

function VotePhase({ state, currentPlayerId, isAlive, submitting, getUsername, order, onVote }: VotePhaseProps) {
  const hasVoted = !!state.votes[currentPlayerId]
  const waitingFor = state.alivePlayers.filter(id => !state.votes[id])
  const voteTarget = state.votes[currentPlayerId]

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-red-950/50 border border-red-900 rounded-2xl px-4 py-3 text-center">
        <p className="text-xs text-red-400/70 uppercase tracking-widest mb-0.5">Vote</p>
        <p className="text-lg font-bold text-red-300">Qui est l&apos;espion ?</p>
      </div>

      {/* Descriptions */}
      <div className="flex flex-col gap-2">
        {Object.entries(state.descriptions).map(([pid, desc]) => (
          <div key={pid} className="flex items-start gap-3 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
            <Avatar id={pid} order={order} name={getUsername(pid)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-0.5">
                {pid === currentPlayerId ? `${getUsername(pid)} (toi)` : getUsername(pid)}
              </p>
              <p className="text-white font-semibold">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vote buttons */}
      {isAlive && !hasVoted && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-xs text-zinc-500 uppercase tracking-widest text-center">Ton vote</p>
          {state.alivePlayers.filter(id => id !== currentPlayerId).map(id => (
            <button
              key={id}
              onClick={() => !submitting && onVote(id)}
              disabled={submitting}
              className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 hover:bg-red-950/50 hover:border-red-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Avatar id={id} order={order} name={getUsername(id)} />
              <span className="font-semibold text-zinc-200 flex-1 text-left">{getUsername(id)}</span>
              <span className="text-red-500 text-sm">Éliminer →</span>
            </button>
          ))}
        </div>
      )}

      {hasVoted && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-xs text-zinc-500 mb-1">Tu as voté</p>
          <div className="flex items-center justify-center gap-2">
            <Avatar id={voteTarget} order={order} name={getUsername(voteTarget)} size="sm" />
            <span className="font-bold text-white">{getUsername(voteTarget)}</span>
          </div>
          {waitingFor.length > 0 && (
            <p className="text-xs text-zinc-600 mt-2">
              En attente de : {waitingFor.map(id => getUsername(id)).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Phase guess ──────────────────────────────────────────────────────────────

interface GuessPhaseProps {
  state: UndercoverState
  currentPlayerId: string
  guessText: string
  setGuessText: (v: string) => void
  submitting: boolean
  getUsername: (id: string) => string
  order: string[]
  onSubmit: () => void
}

function GuessPhase({ state, currentPlayerId, guessText, setGuessText, submitting, getUsername, order, onSubmit }: GuessPhaseProps) {
  const isGuesser = state.pendingGuesser === currentPlayerId

  return (
    <div className="flex flex-col items-center gap-6 pt-4">
      <div className="text-6xl animate-bounce">🕵️</div>
      <div className="text-center">
        {isGuesser ? (
          <>
            <p className="text-2xl font-black mb-2">Dernière chance.</p>
            <p className="text-zinc-400 text-sm">Tu as été éliminé, mais si tu devines le mot civil — tu gagnes.</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold mb-1">
              <span style={{ color: playerColor(state.pendingGuesser ?? '', order) }}>
                {getUsername(state.pendingGuesser ?? '')}
              </span>
              {' '}tente sa chance…
            </p>
            <p className="text-zinc-500 text-sm">Croisez les doigts !</p>
          </>
        )}
      </div>

      {isGuesser && (
        <div className="flex flex-col gap-3 w-full">
          <input
            type="text"
            value={guessText}
            onChange={e => setGuessText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="Ton mot…"
            maxLength={40}
            autoFocus
            className="w-full bg-zinc-900 border border-amber-600 rounded-2xl px-4 py-4 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl font-bold"
          />
          <Button
            onClick={onSubmit}
            disabled={submitting || !guessText.trim()}
            className="w-full h-12 text-base font-semibold bg-amber-600 hover:bg-amber-500 rounded-2xl"
          >
            {submitting ? 'Vérification…' : 'Je tente ma chance'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Écran de fin ─────────────────────────────────────────────────────────────

interface FinishedScreenProps {
  state: UndercoverState
  myRole: MyRole | null
  currentPlayerId: string
  isHost: boolean
  roomCode: string
  getUsername: (id: string) => string
  order: string[]
}

const WINNER_CONFIG: Record<string, { emoji: string; title: string; subtitle: string; color: string }> = {
  civils: {
    emoji: '🎉',
    title: 'Les Civils gagnent !',
    subtitle: 'L\'espion a été démasqué.',
    color: 'text-emerald-400',
  },
  undercover: {
    emoji: '🕵️',
    title: 'L\'Undercover gagne !',
    subtitle: 'Personne ne l\'a vu venir.',
    color: 'text-red-400',
  },
  mr_white: {
    emoji: '🃏',
    title: 'Mr. White gagne !',
    subtitle: 'Il a deviné le mot secret.',
    color: 'text-amber-400',
  },
}

function FinishedScreen({ state, myRole, currentPlayerId, isHost, roomCode, getUsername, order }: FinishedScreenProps) {
  const router = useRouter()
  const [restarting, setRestarting] = useState(false)
  const winner = state.winner ?? 'civils'

  async function handleRestart() {
    setRestarting(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) alert(data.error ?? 'Erreur')
      // Le Realtime dans RoomLobby détecte status → 'waiting' et affiche le lobby
    } catch {
      alert('Erreur réseau')
    } finally {
      setRestarting(false)
    }
  }
  const cfg = WINNER_CONFIG[winner] ?? WINNER_CONFIG.civils
  const isWinner = state.winnerPlayerIds?.includes(currentPlayerId) ?? false
  const winnerIds = state.winnerPlayerIds ?? []

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-950 text-white px-4 pt-12 pb-10">

      {/* Hero */}
      <div className="text-7xl mb-4 animate-bounce">{cfg.emoji}</div>
      <h1 className={`text-3xl font-black text-center mb-1 ${cfg.color}`}>{cfg.title}</h1>
      <p className="text-zinc-500 text-center mb-3">{cfg.subtitle}</p>

      {/* Résultat perso */}
      <div className={`px-4 py-2 rounded-full text-sm font-bold mb-8 ${
        isWinner
          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
      }`}>
        {isWinner ? '🏆 Tu as gagné !' : '💀 Tu as perdu cette fois'}
      </div>

      {/* Révélation des rôles */}
      <div className="w-full max-w-sm mb-6">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3 text-center">Révélation des rôles</p>
        <div className="flex flex-col gap-2">
          {Object.entries(state.privateRoles)
            .sort(([a], [b]) => {
              const aWin = winnerIds.includes(a) ? 0 : 1
              const bWin = winnerIds.includes(b) ? 0 : 1
              return aWin - bWin
            })
            .map(([pid, { role }]) => {
              const isP = pid === currentPlayerId
              const isW = winnerIds.includes(pid)
              return (
                <div
                  key={pid}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                    isW
                      ? 'bg-zinc-900 border-zinc-600'
                      : 'bg-zinc-950 border-zinc-800 opacity-60'
                  }`}
                >
                  <Avatar id={pid} order={order} name={getUsername(pid)} />
                  <span className={`font-semibold flex-1 ${isP ? 'text-white' : 'text-zinc-300'}`}>
                    {getUsername(pid)}{isP ? ' (toi)' : ''}
                  </span>
                  {isW && <span className="text-yellow-400 text-base">🏆</span>}
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${ROLE_PILL[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {/* Ordre d'élimination */}
      {state.eliminated.length > 0 && (
        <div className="w-full max-w-sm mb-8">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3 text-center">Ordre d&apos;élimination</p>
          <div className="flex flex-col gap-1">
            {state.eliminated.map((e: EliminatedEntry, i: number) => (
              <div key={e.playerId} className="flex items-center gap-3 py-2 border-b border-zinc-900 last:border-0">
                <span className="text-zinc-700 text-xs w-5 text-right shrink-0">#{i + 1}</span>
                <Avatar id={e.playerId} order={order} name={getUsername(e.playerId)} size="sm" />
                <span className="text-zinc-400 flex-1 text-sm">{getUsername(e.playerId)}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${ROLE_PILL[e.role]}`}>
                  {ROLE_LABELS[e.role]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-auto">
        {isHost ? (
          <Button
            onClick={handleRestart}
            disabled={restarting}
            className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-500 rounded-2xl"
          >
            {restarting ? 'Relance…' : 'Nouvelle manche 🔄'}
          </Button>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-zinc-500 text-sm animate-pulse">
            En attente que le host relance…
          </div>
        )}
        <button
          onClick={() => router.push('/')}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors text-center"
        >
          Quitter la room
        </button>
      </div>
    </div>
  )
}
