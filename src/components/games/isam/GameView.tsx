'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { IsamState, IsamRoundData, IsamResult } from '@/types/games/isam'
import { getAvatarColor, getAvatarEmoji } from '@/lib/utils/avatar'

interface Props {
  room: RoomRow & { room_players: RoomPlayerRow[] }
  roomCode: string
  currentPlayerId: string
}

const ISAM_PRIMARY  = '#C2185B'
const ISAM_GRADIENT = 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)'
const CORAL_GRADIENT = 'linear-gradient(90deg, #FF6035, #FF8C60)'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function playerIdx(playerId: string, players: RoomPlayerRow[]) {
  return players.findIndex(p => p.id === playerId)
}

function playerName(playerId: string, players: RoomPlayerRow[]) {
  return players.find(p => p.id === playerId)?.username ?? '…'
}

// ─── GameView principal ───────────────────────────────────────────────────────

export default function IsamGameView({ room, roomCode, currentPlayerId }: Props) {
  const [roundData, setRoundData] = useState<IsamRoundData | null>(
    (room.state as IsamState)?.roundData as IsamRoundData ?? null
  )
  const [gameStatus, setGameStatus] = useState<string>(
    (room.state as IsamState)?.status ?? 'playing'
  )
  const [fullState, setFullState] = useState<IsamState>(room.state as IsamState)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`isam-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}`,
      }, (payload) => {
        const newRoom = payload.new as RoomRow
        const newState = newRoom.state as IsamState
        console.log('[IsamGameView] realtime update: subPhase=', newState?.subPhase, 'status=', newRoom.status)
        setFullState(newState)
        setRoundData(newState?.roundData as IsamRoundData ?? null)
        setGameStatus(newRoom.status)
        setAnswer('')
        setSubmitting(false)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [room.id])

  // Timer sur questionDeadline
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const deadline = roundData?.questionDeadline
    if (!deadline || gameStatus === 'finished') return
    const update = () => {
      setTimeLeft(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)))
    }
    update()
    timerRef.current = setInterval(update, 500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [roundData?.questionDeadline, gameStatus])

  // Auto-avance côté client après phaseDeadline
  useEffect(() => {
    if (!roundData?.phaseDeadline) return
    const delay = new Date(roundData.phaseDeadline).getTime() - Date.now()
    if (delay < 0) return
    const tid = setTimeout(() => { void sendAdvance() }, delay + 200)
    return () => clearTimeout(tid)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundData?.phaseDeadline])

  async function sendAction(payload: { answer?: string; advance?: boolean }) {
    console.log('[IsamGameView] action:', { playerId: currentPlayerId, ...payload })
    try {
      const res = await fetch(`/api/rooms/${roomCode}/isam/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayerId, ...payload }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) console.error('[IsamGameView] action error:', data.error)
    } catch (err) {
      console.error('[IsamGameView] network error:', err)
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    await sendAction({ answer: answer.trim() })
    setSubmitting(false)
  }

  async function sendAdvance() {
    await sendAction({ advance: true })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitAnswer() }
  }

  if (gameStatus === 'finished' || roundData?.subPhase === undefined) {
    if (gameStatus === 'finished') {
      return <FinishedScreen state={fullState} players={room.room_players} currentPlayerId={currentPlayerId} />
    }
    return <Loading />
  }

  const subPhase = roundData.subPhase
  const isActive = currentPlayerId === roundData.activePlayerId

  // ─── Dispatch par sous-phase ──────────────────────────────────────────────

  if (subPhase === 'm1_answer' || subPhase === 'm2_answer') {
    if (isActive) {
      return (
        <AnswerScreen
          roundData={roundData}
          answer={answer} setAnswer={setAnswer}
          onSubmit={submitAnswer} onKey={handleKey}
          submitting={submitting} timeLeft={timeLeft}
          players={room.room_players}
        />
      )
    }
    return <WaitingScreen roundData={roundData} players={room.room_players} />
  }

  if (subPhase === 'm1_guess' || subPhase === 'm2_guess') {
    if (isActive) {
      return (
        <GuessScreen
          roundData={roundData}
          answer={answer} setAnswer={setAnswer}
          onSubmit={submitAnswer} onKey={handleKey}
          submitting={submitting} timeLeft={timeLeft}
          players={room.room_players}
          currentPlayerId={currentPlayerId}
        />
      )
    }
    return <WatchGuessScreen roundData={roundData} players={room.room_players} scores={roundData.scores} />
  }

  if (subPhase === 'm1_reveal' || subPhase === 'm2_reveal') {
    return (
      <RevealScreen
        roundData={roundData}
        players={room.room_players}
        currentPlayerId={currentPlayerId}
      />
    )
  }

  if (subPhase === 'mid_ranking') {
    return <MidRankingScreen roundData={roundData} players={room.room_players} />
  }

  return <Loading />
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function Loading() {
  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif" }}>
      <p style={{ fontSize:17, fontWeight:900, color:ISAM_PRIMARY }}>Chargement…</p>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function GameHeader({ label, questionIndex, questionCount }: { label: string; questionIndex: number; questionCount: number }) {
  const progress = questionCount > 0 ? (questionIndex + 1) / questionCount : 0
  return (
    <div style={{ background: ISAM_GRADIENT, borderRadius:'0 0 16px 16px', padding:'16px 20px 14px' }}>
      <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, margin:'0 0 4px' }}>
        {label}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:900, color:'#FFF' }}>Question {questionIndex + 1} / {questionCount}</span>
        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>🫀 ISAM</span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.25)', borderRadius:100, height:4, overflow:'hidden' }}>
        <div style={{ width:`${progress * 100}%`, height:'100%', background:'rgba(255,255,255,0.9)', borderRadius:100, transition:'width 0.4s' }}/>
      </div>
    </div>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ scores, players }: { scores: Record<string, number>; players: RoomPlayerRow[] }) {
  return (
    <div style={{ background:'#FFF', borderRadius:16, padding:'12px 16px', display:'flex', justifyContent:'space-around', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
      {players.slice(0, 2).map((p, i) => (
        <div key={p.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:getAvatarColor(i), display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
            {getAvatarEmoji(p.username)}
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:'rgba(26,26,46,0.5)' }}>{p.username}</span>
          <span style={{ fontSize:22, fontWeight:900, color:ISAM_PRIMARY }}>{scores[p.id] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({ roundData, subtitle }: { roundData: IsamRoundData; subtitle?: string }) {
  const q = roundData.question
  return (
    <>
      <div style={{ display:'flex', justifyContent:'center' }}>
        {q?.imageUrl ? (
          <img src={q.imageUrl} alt="" style={{ width:160, height:160, borderRadius:16, objectFit:'contain', background:'rgba(26,26,46,0.04)' }} />
        ) : (
          <div style={{ width:120, height:120, borderRadius:16, background:'rgba(194,24,91,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>
            {q?.theme === 'brawl_stars' ? '🎮' : '✨'}
          </div>
        )}
      </div>
      <div style={{ background:'#FFF', borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.08)', padding:'18px 20px' }}>
        {subtitle && (
          <p style={{ fontSize:11, fontWeight:800, color:ISAM_PRIMARY, textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 6px' }}>{subtitle}</p>
        )}
        <p style={{ fontSize:19, fontWeight:900, color:'#1A1A2E', margin:0, lineHeight:1.4 }}>
          {q?.questionText ?? '…'}
        </p>
      </div>
    </>
  )
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function TimerBar({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const isLow = timeLeft < 10
  const color = isLow ? '#D32F2F' : ISAM_PRIMARY
  const fill  = isLow ? '#FF6035' : ISAM_PRIMARY
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(26,26,46,0.5)' }}>Temps restant</span>
        <span style={{ fontSize:14, fontWeight:900, color }}>{timeLeft}s</span>
      </div>
      <div style={{ background:'rgba(194,24,91,0.15)', borderRadius:100, height:5, overflow:'hidden' }}>
        <div style={{ width:`${Math.min(100, (timeLeft / maxTime) * 100)}%`, height:'100%', background:fill, borderRadius:100, transition:'width 0.5s' }}/>
      </div>
    </div>
  )
}

// ─── TextField ───────────────────────────────────────────────────────────────

function TextField({ value, onChange, onKey, placeholder }: {
  value: string
  onChange: (v: string) => void
  onKey: (e: React.KeyboardEvent) => void
  placeholder: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKey}
      placeholder={placeholder}
      rows={3}
      style={{
        width:'100%', boxSizing:'border-box' as const,
        background:'#FFF', border:`2px solid ${ISAM_PRIMARY}`,
        borderRadius:20, padding:16,
        fontSize:16, fontWeight:700, color:'#1A1A2E',
        fontFamily:"'Nunito',sans-serif",
        outline:'none', resize:'none',
      }}
    />
  )
}

// ─── SubmitButton ─────────────────────────────────────────────────────────────

function SubmitButton({ disabled, loading, label }: { disabled: boolean; loading: boolean; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        padding:18, borderRadius:20, border:'none',
        background: CORAL_GRADIENT,
        color:'#FFF', fontSize:17, fontWeight:900,
        fontFamily:"'Nunito',sans-serif",
        boxShadow:'0 8px 28px rgba(255,96,53,0.45)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        width:'100%',
      }}
    >
      {loading ? 'Envoi…' : label}
    </button>
  )
}

// ─── AnswerScreen ─────────────────────────────────────────────────────────────

function AnswerScreen({ roundData, answer, setAnswer, onSubmit, onKey, submitting, timeLeft, players }: {
  roundData: IsamRoundData
  answer: string; setAnswer: (v: string) => void
  onSubmit: () => void; onKey: (e: React.KeyboardEvent) => void
  submitting: boolean; timeLeft: number
  players: RoomPlayerRow[]
}) {
  const manche = roundData.subPhase === 'm1_answer' ? 'Manche 1' : 'Manche 2'
  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <GameHeader
        label={`${manche} · À toi de répondre`}
        questionIndex={roundData.questionIndex}
        questionCount={roundData.questionCount}
      />
      <div style={{ padding:'20px 20px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        <QuestionCard roundData={roundData} />
        <TextField value={answer} onChange={setAnswer} onKey={onKey} placeholder="Ta réponse…" />
        <TimerBar timeLeft={timeLeft} maxTime={90} />
        <div onClick={onSubmit}>
          <SubmitButton disabled={!answer.trim()} loading={submitting} label="✅ Valider ma réponse" />
        </div>
        <ScoreBar scores={roundData.scores} players={players} />
      </div>
    </div>
  )
}

// ─── WaitingScreen ────────────────────────────────────────────────────────────

function WaitingScreen({ roundData, players }: { roundData: IsamRoundData; players: RoomPlayerRow[] }) {
  const idx = playerIdx(roundData.activePlayerId, players)
  const name = playerName(roundData.activePlayerId, players)
  const manche = roundData.subPhase === 'm1_answer' ? 'Manche 1' : 'Manche 2'
  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <GameHeader label={`${manche} · En attente…`} questionIndex={roundData.questionIndex} questionCount={roundData.questionCount} />
      <div style={{ padding:'40px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        <div style={{ fontSize:60 }}>🫀</div>
        <div style={{ background:'#FFF', borderRadius:24, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', padding:'28px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, width:'100%', maxWidth:320 }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:getAvatarColor(idx >= 0 ? idx : 0), display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, boxShadow:`0 6px 20px ${getAvatarColor(idx >= 0 ? idx : 0)}66` }}>
              {getAvatarEmoji(name)}
            </div>
            <div style={{ position:'absolute', bottom:2, right:2, width:18, height:18, borderRadius:'50%', background:'#00E676', border:'3px solid #FFF' }}/>
          </div>
          <p style={{ fontSize:17, fontWeight:900, color:'#1A1A2E', margin:0, textAlign:'center' }}>
            {name} répond aux questions…
          </p>
          <div style={{ display:'flex', gap:4 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width:8, height:8, borderRadius:'50%', background:ISAM_PRIMARY, display:'inline-block' }}/>
            ))}
          </div>
        </div>
        <div style={{ background:'#F0EDFF', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:10, width:'100%', maxWidth:320 }}>
          <span style={{ fontSize:22 }}>🔒</span>
          <p style={{ fontSize:13, fontWeight:700, color:'#6A1B9A', margin:0 }}>
            Ses réponses te seront révélées une par une lors du devinage
          </p>
        </div>
        <ScoreBar scores={roundData.scores} players={players} />
      </div>
    </div>
  )
}

// ─── GuessScreen ──────────────────────────────────────────────────────────────

function GuessScreen({ roundData, answer, setAnswer, onSubmit, onKey, submitting, timeLeft, players, currentPlayerId }: {
  roundData: IsamRoundData
  answer: string; setAnswer: (v: string) => void
  onSubmit: () => void; onKey: (e: React.KeyboardEvent) => void
  submitting: boolean; timeLeft: number
  players: RoomPlayerRow[]
  currentPlayerId: string
}) {
  const adversaryId = roundData.subPhase === 'm1_guess' ? roundData.player1Id : roundData.player2Id
  const adversaryName = playerName(adversaryId, players)
  const adversaryIdx = playerIdx(adversaryId, players)
  const manche = roundData.subPhase === 'm1_guess' ? 'Manche 1' : 'Manche 2'
  const results = roundData.subPhase === 'm1_guess' ? roundData.manche1Results : roundData.manche2Results

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <GameHeader label={`${manche} · Devinage`} questionIndex={roundData.questionIndex} questionCount={roundData.questionCount} />
      <div style={{ padding:'16px 20px 40px', display:'flex', flexDirection:'column', gap:14 }}>
        <QuestionCard
          roundData={roundData}
          subtitle={`Qu'a répondu ${adversaryName} ?`}
        />
        <TextField value={answer} onChange={setAnswer} onKey={onKey} placeholder="Ta prédiction…" />
        <TimerBar timeLeft={timeLeft} maxTime={90} />
        <div onClick={onSubmit}>
          <SubmitButton disabled={!answer.trim()} loading={submitting} label="🔮 Soumettre ma prédiction" />
        </div>
        {results && results.length > 0 && (
          <ResultsList results={results} title="Résultats précédents" />
        )}
        <ScoreBar scores={roundData.scores} players={players} />
      </div>
    </div>
  )
}

// ─── WatchGuessScreen ─────────────────────────────────────────────────────────

function WatchGuessScreen({ roundData, players, scores }: { roundData: IsamRoundData; players: RoomPlayerRow[]; scores: Record<string, number> }) {
  const activeName = playerName(roundData.activePlayerId, players)
  const activeIdx = playerIdx(roundData.activePlayerId, players)
  const manche = roundData.subPhase === 'm1_guess' ? 'Manche 1' : 'Manche 2'
  const results = roundData.subPhase === 'm1_guess' ? roundData.manche1Results : roundData.manche2Results

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <GameHeader label={`${manche} · ${activeName} devine…`} questionIndex={roundData.questionIndex} questionCount={roundData.questionCount} />
      <div style={{ padding:'24px 20px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ background:'#FFF', borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.08)', padding:'24px', textAlign:'center' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:getAvatarColor(activeIdx >= 0 ? activeIdx : 0), display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>
            {getAvatarEmoji(activeName)}
          </div>
          <p style={{ fontSize:16, fontWeight:900, color:'#1A1A2E', margin:'0 0 8px' }}>
            {activeName} essaie de deviner ta réponse…
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:5 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width:8, height:8, borderRadius:'50%', background:ISAM_PRIMARY, display:'inline-block' }}/>
            ))}
          </div>
        </div>
        {results && results.length > 0 && (
          <ResultsList results={results} title="Résultats" />
        )}
        <ScoreBar scores={scores} players={players} />
      </div>
    </div>
  )
}

// ─── RevealScreen ─────────────────────────────────────────────────────────────

function RevealScreen({ roundData, players, currentPlayerId }: { roundData: IsamRoundData; players: RoomPlayerRow[]; currentPlayerId: string }) {
  const reveal = roundData.reveal
  if (!reveal) return <Loading />

  const guesserName = playerName(roundData.activePlayerId, players)
  const answererName = playerName(
    roundData.subPhase === 'm1_reveal' ? roundData.player1Id : roundData.player2Id,
    players
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <div style={{ background: ISAM_GRADIENT, borderRadius:'0 0 16px 16px', padding:'18px 20px', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, margin:'0 0 4px' }}>Résultat</p>
        <p style={{ fontSize:32, margin:0 }}>{reveal.isCorrect ? '✅' : '❌'}</p>
      </div>

      <div style={{ padding:'20px 20px 40px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Image */}
        {reveal.imageUrl && (
          <div style={{ display:'flex', justifyContent:'center' }}>
            <img src={reveal.imageUrl} alt="" style={{ width:120, height:120, borderRadius:16, objectFit:'contain' }} />
          </div>
        )}

        {/* Question */}
        <div style={{ background:'#FFF', borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.08)', padding:'16px 20px' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'rgba(26,26,46,0.45)', margin:'0 0 6px' }}>La question</p>
          <p style={{ fontSize:16, fontWeight:900, color:'#1A1A2E', margin:0, lineHeight:1.4 }}>
            {reveal.questionText}
          </p>
        </div>

        {/* Prédiction vs Réalité */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:'rgba(194,24,91,0.06)', borderRadius:16, padding:'14px' }}>
            <p style={{ fontSize:11, fontWeight:800, color:ISAM_PRIMARY, textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 4px' }}>
              {guesserName} a prédit
            </p>
            <p style={{ fontSize:15, fontWeight:900, color:'#1A1A2E', margin:0 }}>
              &quot;{reveal.prediction}&quot;
            </p>
          </div>
          <div style={{ background: reveal.isCorrect ? 'rgba(0,200,83,0.08)' : 'rgba(26,26,46,0.06)', borderRadius:16, padding:'14px' }}>
            <p style={{ fontSize:11, fontWeight:800, color: reveal.isCorrect ? '#00C853' : 'rgba(26,26,46,0.5)', textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 4px' }}>
              {answererName} a répondu
            </p>
            <p style={{ fontSize:15, fontWeight:900, color:'#1A1A2E', margin:0 }}>
              &quot;{reveal.realAnswer}&quot;
            </p>
          </div>
        </div>

        {reveal.isCorrect && (
          <div style={{ background:'rgba(0,200,83,0.10)', borderRadius:16, padding:'12px 16px', textAlign:'center' }}>
            <p style={{ fontSize:15, fontWeight:900, color:'#00C853', margin:0 }}>+1 point pour {guesserName} 🎉</p>
          </div>
        )}

        <ScoreBar scores={roundData.scores} players={players} />

        <p style={{ fontSize:12, fontWeight:700, color:'rgba(26,26,46,0.35)', textAlign:'center', margin:0 }}>
          Passage automatique dans quelques secondes…
        </p>
      </div>
    </div>
  )
}

// ─── MidRankingScreen ─────────────────────────────────────────────────────────

function MidRankingScreen({ roundData, players }: { roundData: IsamRoundData; players: RoomPlayerRow[] }) {
  const results = roundData.manche1Results ?? []
  const correct = results.filter(r => r.isCorrect).length
  const guesserName = playerName(roundData.player2Id, players)

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <div style={{ background: ISAM_GRADIENT, borderRadius:'0 0 20px 20px', padding:'24px 20px', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, margin:'0 0 4px' }}>
          Mi-temps 🫀
        </p>
        <p style={{ fontSize:26, fontWeight:900, color:'#FFF', margin:'0 0 4px' }}>
          {guesserName} : {correct}/{results.length}
        </p>
        <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)', margin:0 }}>
          Manche 2 dans quelques secondes…
        </p>
      </div>

      <div style={{ padding:'20px 20px 40px', display:'flex', flexDirection:'column', gap:10 }}>
        <ScoreBar scores={roundData.scores} players={players} />
        {results.length > 0 && (
          <ResultsList results={results} title="Bilan manche 1" />
        )}
      </div>
    </div>
  )
}

// ─── ResultsList ─────────────────────────────────────────────────────────────

function ResultsList({ results, title }: { results: IsamResult[]; title: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:12, fontWeight:800, color:'rgba(26,26,46,0.4)', textTransform:'uppercase', letterSpacing:1, margin:0 }}>
        {title}
      </p>
      {results.map((r, i) => (
        <div key={i} style={{ background:'#FFF', borderRadius:14, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{r.isCorrect ? '✅' : '❌'}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(26,26,46,0.4)', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {r.questionText}
            </p>
            <p style={{ fontSize:12, fontWeight:700, color:'rgba(26,26,46,0.45)', margin:'0 0 2px' }}>
              Prédit : &quot;{r.prediction}&quot;
            </p>
            <p style={{ fontSize:13, fontWeight:800, color: r.isCorrect ? '#00C853' : '#1A1A2E', margin:0 }}>
              → &quot;{r.realAnswer}&quot;
            </p>
          </div>
          {r.isCorrect && (
            <span style={{ background:'rgba(194,24,91,0.12)', borderRadius:100, padding:'2px 8px', fontSize:11, fontWeight:900, color:ISAM_PRIMARY, flexShrink:0 }}>+1</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── FinishedScreen ───────────────────────────────────────────────────────────

function FinishedScreen({ state, players, currentPlayerId }: { state: IsamState; players: RoomPlayerRow[]; currentPlayerId: string }) {
  const p1Score = state.scores[state.player1Id] ?? 0
  const p2Score = state.scores[state.player2Id] ?? 0
  const tied = p1Score === p2Score
  const winnerId = tied ? null : (p1Score > p2Score ? state.player1Id : state.player2Id)
  const isWinner = !tied && winnerId === currentPlayerId

  const p1 = players.find(p => p.id === state.player1Id)
  const p2 = players.find(p => p.id === state.player2Id)

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Nunito',sans-serif", color:'#1A1A2E' }}>
      <div style={{ background: ISAM_GRADIENT, borderRadius:'0 0 20px 20px', padding:'28px 20px 32px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>
        <p style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, margin:'0 0 6px' }}>ISAM 🫀</p>
        <p style={{ fontSize:28, fontWeight:900, color:'#FFF', margin:0 }}>
          {tied ? '🤝 Match nul !' : isWinner ? '🏆 Tu as gagné !' : '😅 Dommage !'}
        </p>
      </div>

      <div style={{ padding:'24px 20px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Scores face à face */}
        <div style={{ background:'#FFF', borderRadius:20, boxShadow:'0 4px 16px rgba(0,0,0,0.08)', padding:'24px', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
          {[{ player: p1, score: p1Score, idx: playerIdx(state.player1Id, players) }, { player: p2, score: p2Score, idx: playerIdx(state.player2Id, players) }].map(({ player, score, idx }, i) => {
            if (!player) return null
            const isTop = !tied && score === Math.max(p1Score, p2Score)
            return (
              <div key={player.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:72, height:72, borderRadius:'50%', background:getAvatarColor(idx >= 0 ? idx : i), display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, boxShadow:`0 6px 20px ${getAvatarColor(idx >= 0 ? idx : i)}66`, border: isTop ? `3px solid ${ISAM_PRIMARY}` : '3px solid transparent' }}>
                    {getAvatarEmoji(player.username)}
                  </div>
                  {isTop && <div style={{ position:'absolute', top:-8, right:-4, fontSize:20 }}>🏆</div>}
                </div>
                <p style={{ fontSize:14, fontWeight:800, color:'#1A1A2E', margin:0 }}>{player.username}</p>
                <p style={{ fontSize:36, fontWeight:900, color: isTop ? ISAM_PRIMARY : 'rgba(26,26,46,0.35)', margin:0 }}>{score}</p>
                <p style={{ fontSize:12, fontWeight:700, color:'rgba(26,26,46,0.4)', margin:0 }}>point{score !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>

        {tied && (
          <div style={{ background:'#F0EDFF', borderRadius:16, padding:'14px 16px', textAlign:'center' }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#6A1B9A', margin:0 }}>Match parfait — vous vous connaissez vraiment bien !</p>
          </div>
        )}

        {/* Récap des deux manches */}
        {state.manche1Results && state.manche1Results.length > 0 && (
          <ResultsList results={state.manche1Results} title={`Manche 1 — ${playerName(state.player2Id, players)} devinait`} />
        )}
        {state.manche2Results && state.manche2Results.length > 0 && (
          <ResultsList results={state.manche2Results} title={`Manche 2 — ${playerName(state.player1Id, players)} devinait`} />
        )}
      </div>
    </div>
  )
}
