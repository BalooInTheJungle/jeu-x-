'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { ElduState, ElduHistoryEntry } from '@/types/games/eldu'

interface Props {
  room: RoomRow & { room_players: RoomPlayerRow[] }
  roomCode: string
  currentPlayerId: string
}

const PLAYER_COLORS = ['#8b5cf6', '#0ea5e9']

function getPlayerColor(playerId: string, playerOrder: string[]): string {
  const i = playerOrder.indexOf(playerId)
  return PLAYER_COLORS[i >= 0 ? i : 0]
}

function formatMs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${s}s`
}

function computeDisplayedTime(state: ElduState, playerId: string): number {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex]
  if (playerId === currentPlayerId) {
    return Math.max(0, state.timers[playerId] - (Date.now() - state.timerStartedAt))
  }
  return Math.max(0, state.timers[playerId] ?? 0)
}

export default function ElduGameView({ room, roomCode, currentPlayerId }: Props) {
  const isHost = room.room_players.some(p => p.id === currentPlayerId && p.is_host)
  const [state, setState] = useState<ElduState>(room.state as ElduState)
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [tick, setTick] = useState(0)
  const timeoutFiredRef = useRef(false)
  const config = room.config as { difficulty?: string; durationPerPlayer?: number }

  const getUsername = useCallback((id: string) => state.playerNames?.[id] ?? id, [state.playerNames])

  // Tick toutes les 100ms pour mettre à jour les timers affichés
  useEffect(() => {
    if (state.elduPhase !== 'playing') return
    const id = setInterval(() => setTick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [state.elduPhase])

  // Reset du guard timeout à chaque changement de question
  useEffect(() => {
    timeoutFiredRef.current = false
  }, [state.questionIndex])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`eldu-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => { setState(payload.new.state as ElduState) })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [room.id])

  // Fetch la réponse pour l'arbitre à chaque changement de question
  useEffect(() => {
    if (!isHost || state.elduPhase !== 'playing') return
    setCurrentAnswer(null)
    fetch(`/api/rooms/${roomCode}/eldu/current-answer?playerId=${currentPlayerId}`)
      .then(r => r.json())
      .then((d: { answer?: string }) => setCurrentAnswer(d.answer ?? null))
      .catch(() => setCurrentAnswer(null))
  }, [state.questionIndex, isHost, state.elduPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitAction = useCallback(async (type: 'correct' | 'pass' | 'timeout') => {
    if (submitting) return
    setSubmitting(true)
    try {
      await fetch(`/api/rooms/${roomCode}/eldu/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, type }),
      })
    } finally {
      setSubmitting(false)
    }
  }, [roomCode, currentPlayerId, submitting])

  // Auto-timeout : l'arbitre détecte quand le timer tombe à 0
  useEffect(() => {
    if (!isHost || state.elduPhase !== 'playing' || timeoutFiredRef.current || submitting) return
    const currentPlayerId_ = state.playerOrder[state.currentPlayerIndex]
    const remaining = computeDisplayedTime(state, currentPlayerId_)
    if (remaining <= 0) {
      timeoutFiredRef.current = true
      void submitAction('timeout')
    }
  }, [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state.elduPhase === 'finished') {
    return (
      <FinishedScreen
        state={state}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        roomCode={roomCode}
        getUsername={getUsername}
      />
    )
  }

  const currentQuestion = state.questions[state.questionIndex]
  const isHard = config.difficulty === 'hard'
  const totalDurationMs = (config.durationPerPlayer ?? 60) * 1000

  if (isHost) {
    return (
      <ArbitreView
        state={state}
        currentQuestion={currentQuestion}
        currentAnswer={currentAnswer}
        submitting={submitting}
        isHard={isHard}
        totalDurationMs={totalDurationMs}
        tick={tick}
        getUsername={getUsername}
        onCorrect={() => void submitAction('correct')}
        onPass={() => void submitAction('pass')}
      />
    )
  }

  return (
    <PlayerView
      state={state}
      currentPlayerId={currentPlayerId}
      currentQuestion={currentQuestion}
      isHard={isHard}
      totalDurationMs={totalDurationMs}
      tick={tick}
      getUsername={getUsername}
    />
  )
}

// ─── Timer Bar ────────────────────────────────────────────────────────────────

function TimerBar({
  remaining,
  total,
  color,
  label,
  active,
}: {
  remaining: number
  total: number
  color: string
  label: string
  active: boolean
}) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100))
  const isLow = remaining < 10_000

  return (
    <div className={`flex-1 flex flex-col gap-1 rounded-2xl p-3 border transition-all ${active ? 'bg-zinc-900 border-zinc-600' : 'bg-zinc-950 border-zinc-800 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 truncate max-w-[80px]">{label}</span>
        <span
          className={`text-xl font-black tabular-nums ${isLow && active ? 'text-red-400 animate-pulse' : ''}`}
          style={active && !isLow ? { color } : undefined}
        >
          {formatMs(remaining)}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: active ? 1 : 0.4 }}
        />
      </div>
    </div>
  )
}

// ─── Vue Arbitre ──────────────────────────────────────────────────────────────

function ArbitreView({
  state, currentQuestion, currentAnswer, submitting, isHard,
  totalDurationMs, tick: _tick, getUsername,
  onCorrect, onPass,
}: {
  state: ElduState
  currentQuestion: { id: string; imageUrl: string } | undefined
  currentAnswer: string | null
  submitting: boolean
  isHard: boolean
  totalDurationMs: number
  tick: number
  getUsername: (id: string) => string
  onCorrect: () => void
  onPass: () => void
}) {
  const [p0, p1] = state.playerOrder
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex]
  const r0 = computeDisplayedTime(state, p0)
  const r1 = computeDisplayedTime(state, p1)
  const total = state.questions.length

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Timers */}
      <div className="px-4 pt-5 pb-3 flex gap-3">
        <TimerBar remaining={r0} total={totalDurationMs} color={PLAYER_COLORS[0]} label={getUsername(p0)} active={currentPlayerId === p0} />
        <TimerBar remaining={r1} total={totalDurationMs} color={PLAYER_COLORS[1]} label={getUsername(p1)} active={currentPlayerId === p1} />
      </div>

      {/* Progression */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-zinc-600 uppercase tracking-widest">Arbitre</span>
        <span className="text-xs text-zinc-500">{state.questionIndex + 1} / {total}</span>
      </div>

      {/* Image */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {currentQuestion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentQuestion.imageUrl}
            alt="?"
            className="w-48 h-48 object-contain rounded-2xl"
            style={isHard ? { filter: 'blur(10px)' } : undefined}
          />
        ) : (
          <div className="w-48 h-48 bg-zinc-900 rounded-2xl animate-pulse" />
        )}

        {/* Réponse — visible uniquement pour l'arbitre */}
        <div className="bg-zinc-900 border border-amber-600/50 rounded-2xl px-6 py-4 text-center w-full max-w-xs">
          <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">Réponse</p>
          <p className="text-2xl font-black text-amber-400">
            {currentAnswer ?? '…'}
          </p>
        </div>

        {/* Tour de qui */}
        <div className="text-center">
          <p className="text-xs text-zinc-600 mb-0.5">C&apos;est le tour de</p>
          <p className="text-lg font-bold" style={{ color: getPlayerColor(currentPlayerId, state.playerOrder) }}>
            {getUsername(currentPlayerId)}
          </p>
        </div>
      </div>

      {/* Boutons arbitre */}
      <div className="px-4 pb-8 pt-4 flex gap-3">
        <button
          onClick={onPass}
          disabled={submitting}
          className="flex-1 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-base hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-50"
        >
          Passer →
        </button>
        <button
          onClick={onCorrect}
          disabled={submitting}
          className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base active:scale-95 transition-all disabled:opacity-50"
        >
          ✓ Correct !
        </button>
      </div>
    </div>
  )
}

// ─── Vue Joueur ───────────────────────────────────────────────────────────────

function PlayerView({
  state, currentPlayerId, currentQuestion, isHard,
  totalDurationMs, tick: _tick, getUsername,
}: {
  state: ElduState
  currentPlayerId: string
  currentQuestion: { id: string; imageUrl: string } | undefined
  isHard: boolean
  totalDurationMs: number
  tick: number
  getUsername: (id: string) => string
}) {
  const [p0, p1] = state.playerOrder
  const activePlayerId = state.playerOrder[state.currentPlayerIndex]
  const isMyTurn = activePlayerId === currentPlayerId
  const r0 = computeDisplayedTime(state, p0)
  const r1 = computeDisplayedTime(state, p1)
  const total = state.questions.length
  const isSpectator = !state.playerOrder.includes(currentPlayerId)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Timers */}
      <div className="px-4 pt-5 pb-3 flex gap-3">
        <TimerBar remaining={r0} total={totalDurationMs} color={PLAYER_COLORS[0]} label={getUsername(p0)} active={activePlayerId === p0} />
        <TimerBar remaining={r1} total={totalDurationMs} color={PLAYER_COLORS[1]} label={getUsername(p1)} active={activePlayerId === p1} />
      </div>

      <div className="px-4 pb-3 flex items-center justify-between">
        {isSpectator && <span className="text-xs text-zinc-600 uppercase tracking-widest">Spectateur</span>}
        <span className="text-xs text-zinc-500 ml-auto">{state.questionIndex + 1} / {total}</span>
      </div>

      {/* Image */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {currentQuestion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentQuestion.imageUrl}
            alt="?"
            className="w-64 h-64 object-contain rounded-2xl"
            style={isHard ? { filter: 'blur(10px)' } : undefined}
          />
        ) : (
          <div className="w-64 h-64 bg-zinc-900 rounded-2xl animate-pulse" />
        )}

        {/* Statut du tour */}
        <div className={`rounded-2xl px-5 py-3 text-center border ${
          isMyTurn
            ? 'bg-indigo-950 border-indigo-700'
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          {isMyTurn ? (
            <p className="text-lg font-black text-indigo-300 animate-pulse">C&apos;est ton tour — réponds à voix haute !</p>
          ) : (
            <p className="text-base font-semibold text-zinc-400">
              <span style={{ color: getPlayerColor(activePlayerId, state.playerOrder) }}>
                {getUsername(activePlayerId)}
              </span>
              {' '}est en train de répondre…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Écran de fin ─────────────────────────────────────────────────────────────

function FinishedScreen({
  state, currentPlayerId, isHost, roomCode, getUsername,
}: {
  state: ElduState
  currentPlayerId: string
  isHost: boolean
  roomCode: string
  getUsername: (id: string) => string
}) {
  const router = useRouter()
  const [restarting, setRestarting] = useState(false)
  const winnerId = state.winner
  const isWinner = winnerId === currentPlayerId
  const [p0, p1] = state.playerOrder

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
    } catch {
      alert('Erreur réseau')
    } finally {
      setRestarting(false)
    }
  }

  const correctByPlayer: Record<string, number> = {}
  const passedByPlayer: Record<string, number> = {}
  for (const entry of state.history) {
    if (entry.result === 'correct') correctByPlayer[entry.playerId] = (correctByPlayer[entry.playerId] ?? 0) + 1
    if (entry.result === 'passed') passedByPlayer[entry.playerId] = (passedByPlayer[entry.playerId] ?? 0) + 1
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-zinc-950 text-white px-4 pt-10 pb-10">
      {/* Hero */}
      <div className="text-6xl mb-4 animate-bounce">🏆</div>
      <h1 className="text-3xl font-black text-center mb-1 text-indigo-400">
        {winnerId ? getUsername(winnerId) : '?'} gagne !
      </h1>
      <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold mb-8 ${
        isWinner
          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
      }`}>
        {isHost ? '🎯 Partie arbitrée' : isWinner ? '🏆 Tu as gagné !' : '💀 Tu as perdu'}
      </div>

      {/* Scores */}
      <div className="w-full max-w-sm flex gap-3 mb-6">
        {[p0, p1].map((pid, i) => {
          const isW = pid === winnerId
          const timeLeft = formatMs(Math.max(0, state.timers[pid] ?? 0))
          return (
            <div
              key={pid}
              className={`flex-1 rounded-2xl p-4 border text-center ${isW ? 'bg-zinc-900 border-zinc-600' : 'bg-zinc-950 border-zinc-800 opacity-60'}`}
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: PLAYER_COLORS[i] }}>
                {getUsername(pid).charAt(0).toUpperCase()}
              </div>
              <p className="text-xs text-zinc-400 truncate mb-2">{getUsername(pid)}</p>
              <p className="text-2xl font-black">{correctByPlayer[pid] ?? 0}</p>
              <p className="text-xs text-zinc-600">bonnes réponses</p>
              <p className="text-xs text-zinc-600 mt-1">{timeLeft} restants</p>
              {isW && <p className="text-yellow-400 text-base mt-1">🏆</p>}
            </div>
          )
        })}
      </div>

      {/* Historique des images */}
      {state.history.length > 0 && (
        <div className="w-full max-w-sm mb-8">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3 text-center">Questions jouées</p>
          <div className="grid grid-cols-4 gap-2">
            {state.history.map((entry: ElduHistoryEntry, i: number) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.imageUrl}
                  alt={entry.answer}
                  className="w-full aspect-square object-contain rounded-xl bg-zinc-900"
                />
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  entry.result === 'correct' ? 'bg-emerald-600' :
                  entry.result === 'timeout' ? 'bg-red-600' : 'bg-zinc-600'
                }`}>
                  {entry.result === 'correct' ? '✓' : entry.result === 'timeout' ? '⏱' : '→'}
                </div>
                <p className="text-xs text-zinc-600 text-center mt-1 truncate">{entry.answer}</p>
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
            En attente que l&apos;arbitre relance…
          </div>
        )}
        <button onClick={() => router.push('/')} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors text-center">
          Quitter la room
        </button>
      </div>
    </div>
  )
}
