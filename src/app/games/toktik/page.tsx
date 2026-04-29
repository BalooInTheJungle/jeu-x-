'use client'

import {
  useState, useEffect, useRef, useCallback,
  type CSSProperties, type ReactNode,
} from 'react'
import {
  PLAYER_COLORS,
  type GameConfig,
  type GameState,
  type PlayerColor,
  type Difficulty,
  type GameMode,
  type RoundResult,
  generateTargetMs,
  formatTime,
  buildRoundResult,
  initGame,
} from '@/lib/games/toktik/logic'

type Phase =
  | 'setup'
  | 'show_target'
  | 'countdown'
  | 'playing'
  | 'handover'
  | 'playing_both'
  | 'round_result'
  | 'game_over'

const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 5,
  difficulty: 'easy',
  colors: [PLAYER_COLORS[0], PLAYER_COLORS[1]],
  mode: 'sequential',
}

export default function TokTikPage() {
  const [phase, setPhase]               = useState<Phase>('setup')
  const [config, setConfig]             = useState<GameConfig>(DEFAULT_CONFIG)
  const [game, setGame]                 = useState<GameState | null>(null)
  const [targetMs, setTargetMs]         = useState(0)
  const [activePlayer, setActivePlayer] = useState<0 | 1>(0)
  const [countdown, setCountdown]       = useState(3)

  const timerStartRef = useRef(0)
  const tapsRef       = useRef<[number | null, number | null]>([null, null])

  // show_target → countdown après 3s
  useEffect(() => {
    if (phase !== 'show_target') return
    const t = setTimeout(() => {
      setActivePlayer(0)
      setCountdown(3)
      setPhase('countdown')
    }, 3000)
    return () => clearTimeout(t)
  }, [phase])

  // countdown 3→2→1→0 puis playing ou playing_both
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      timerStartRef.current = performance.now()
      setPhase(config.mode === 'simultaneous' ? 'playing_both' : 'playing')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, config.mode])

  // handover → countdown joueur 1 (séquentiel)
  useEffect(() => {
    if (phase !== 'handover') return
    const t = setTimeout(() => {
      setActivePlayer(1)
      setCountdown(3)
      setPhase('countdown')
    }, 3000)
    return () => clearTimeout(t)
  }, [phase])

  const startGame = useCallback((cfg: GameConfig) => {
    console.log('[toktik] startGame', { cfg })
    tapsRef.current = [null, null]
    setConfig(cfg)
    setGame(initGame(cfg))
    setTargetMs(generateTargetMs(cfg.difficulty))
    setPhase('show_target')
  }, [])

  const handleSequentialTap = useCallback(() => {
    if (phase !== 'playing') return
    const elapsed = Math.round(performance.now() - timerStartRef.current)
    console.log('[toktik] sequential tap', { player: activePlayer, elapsed })
    if (activePlayer === 0) {
      tapsRef.current = [elapsed, null]
      setPhase('handover')
    } else {
      tapsRef.current = [tapsRef.current[0], elapsed]
      setPhase('round_result')
    }
  }, [phase, activePlayer])

  const handleNextRound = useCallback(() => {
    if (!game) return
    const [t0, t1] = tapsRef.current
    if (t0 === null || t1 === null) return
    const result = buildRoundResult(game.currentRound, targetMs, [t0, t1])
    console.log('[toktik] roundResult', result)
    const newScores: [number, number] = [
      game.scores[0] + result.points[0],
      game.scores[1] + result.points[1],
    ]
    const newGame: GameState = {
      ...game,
      currentRound: game.currentRound + 1,
      scores: newScores,
      results: [...game.results, result],
    }
    if (game.currentRound >= game.config.totalRounds) {
      setGame(newGame)
      setPhase('game_over')
    } else {
      tapsRef.current = [null, null]
      setGame(newGame)
      setTargetMs(generateTargetMs(game.config.difficulty))
      setPhase('show_target')
    }
  }, [game, targetMs])

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return <SetupScreen defaultConfig={config} onStart={startGame} />
  }

  if (phase === 'show_target') {
    const content = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Mémorise
        </span>
        <span style={{ color: '#FFF', fontWeight: 900, fontSize: '4.5rem', lineHeight: 1, fontFamily: "'Nunito', sans-serif" }}>
          {formatTime(targetMs)}
        </span>
      </div>
    )
    return config.mode === 'simultaneous'
      ? <SplitScreen colors={config.colors} top={content} bottom={content} />
      : <FullScreen bg="#09090b">{content}</FullScreen>
  }

  if (phase === 'countdown') {
    const content = (i: 0 | 1) => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>
          Joueur {i + 1}
        </span>
        <div style={{
          width: 112, height: 112, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: config.colors[i].hex,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: '#FFF', fontWeight: 900, fontSize: '3.5rem', fontFamily: "'Nunito', sans-serif" }}>
            {countdown}
          </span>
        </div>
      </div>
    )
    return config.mode === 'simultaneous'
      ? <SplitScreen colors={config.colors} top={content(0)} bottom={content(1)} />
      : <FullScreen bg="#09090b">{content(activePlayer)}</FullScreen>
  }

  if (phase === 'playing' && config.mode === 'sequential') {
    return (
      <FullScreen
        bg={config.colors[activePlayer].hex}
        onPointerDown={handleSequentialTap}
        style={{ cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontFamily: "'Nunito', sans-serif", fontWeight: 600, pointerEvents: 'none' }}>
          Joueur {activePlayer + 1}
        </span>
        <span style={{ color: '#FFF', fontWeight: 900, fontSize: '5.5rem', lineHeight: 1, fontFamily: "'Nunito', sans-serif", marginTop: 8, pointerEvents: 'none' }}>
          TAP
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 32, pointerEvents: 'none', fontFamily: "'Nunito', sans-serif" }}>
          Touche quand le temps est écoulé
        </span>
      </FullScreen>
    )
  }

  if (phase === 'handover' && config.mode === 'sequential') {
    const color = config.colors[1].hex
    return (
      <FullScreen bg="#09090b">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '0 32px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: color + '22' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: color }} />
          </div>
          <p style={{ color: '#D4D4D8', fontSize: 22, fontWeight: 600, lineHeight: 1.4, margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            Passe le téléphone à<br />
            <span style={{ fontWeight: 900, color }}>Joueur 2</span>
          </p>
          <p style={{ color: '#52525B', fontSize: 13, margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            La partie reprend dans 3 secondes
          </p>
        </div>
      </FullScreen>
    )
  }

  if (phase === 'playing_both' && config.mode === 'simultaneous') {
    return (
      <SimultaneousScreen
        config={config}
        targetMs={targetMs}
        timerStartRef={timerStartRef}
        onDone={(taps) => {
          console.log('[toktik] simultaneous done', { taps })
          tapsRef.current = taps
          setPhase('round_result')
        }}
      />
    )
  }

  if (phase === 'round_result' && game) {
    const [t0, t1] = tapsRef.current
    if (t0 === null || t1 === null) return null
    const result = buildRoundResult(game.currentRound, targetMs, [t0, t1])
    const pendingScores: [number, number] = [
      game.scores[0] + result.points[0],
      game.scores[1] + result.points[1],
    ]
    return (
      <RoundResultScreen
        result={result}
        config={config}
        scores={pendingScores}
        currentRound={game.currentRound}
        totalRounds={game.config.totalRounds}
        isLast={game.currentRound >= game.config.totalRounds}
        onNext={handleNextRound}
      />
    )
  }

  if (phase === 'game_over' && game) {
    const [s0, s1] = game.scores
    const winner = s0 > s1 ? 0 : s1 > s0 ? 1 : null
    const winnerColor = winner !== null ? config.colors[winner].hex : '#6b7280'
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: winnerColor, fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 24px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600 }}>Fin de partie</span>
          <span style={{ color: '#FFF', fontWeight: 900, fontSize: '2.8rem', textAlign: 'center', lineHeight: 1.1 }}>
            {winner !== null ? `Joueur ${winner + 1} gagne !` : 'Égalité !'}
          </span>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px 40px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 8 }}>
            {([0, 1] as const).map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: config.colors[i].hex, boxShadow: '0 0 0 3px rgba(255,255,255,0.3)' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Joueur {i + 1}</span>
                <span style={{ color: '#FFF', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1 }}>{game.scores[i]}</span>
              </div>
            ))}
          </div>

          <button
            onPointerDown={() => { setGame(null); setPhase('setup') }}
            style={{
              width: '100%', padding: '18px',
              borderRadius: 20, border: 'none',
              background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
              color: '#FFF', fontSize: 17, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
              cursor: 'pointer',
            }}
          >
            🔁 Rejouer
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ── COMPOSANTS PARTAGÉS ───────────────────────────────────────────────────────

function FullScreen({
  bg, children, onPointerDown, style,
}: {
  bg: string; children: ReactNode; onPointerDown?: () => void; style?: CSSProperties
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg, fontFamily: "'Nunito', sans-serif",
        ...style,
      }}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  )
}

function SplitScreen({
  colors, top, bottom,
}: {
  colors: [PlayerColor, PlayerColor]; top: ReactNode; bottom: ReactNode
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors[0].hex }}>
        <div style={{ transform: 'rotate(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {top}
        </div>
      </div>
      <div style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.5)', flexShrink: 0, zIndex: 10 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors[1].hex }}>
        {bottom}
      </div>
    </div>
  )
}

// ── ÉCRAN SIMULTANÉ ───────────────────────────────────────────────────────────

function SimultaneousScreen({
  config, targetMs, timerStartRef, onDone,
}: {
  config: GameConfig
  targetMs: number
  timerStartRef: React.MutableRefObject<number>
  onDone: (taps: [number, number]) => void
}) {
  const [tapStates, setTapStates]             = useState<[boolean, boolean]>([false, false])
  const [dividerPos, setDividerPos]           = useState(50)
  const [dividerDuration, setDividerDuration] = useState(200)
  const [oscStarted, setOscStarted]           = useState(false)

  const localTapsRef = useRef<[number | null, number | null]>([null, null])
  const onDoneRef    = useRef(onDone)
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([])
  onDoneRef.current  = onDone

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timeoutsRef.current.push(t)
  }

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (oscStarted) return
    const playerIndex: 0 | 1 = e.clientY < window.innerHeight / 2 ? 0 : 1
    if (localTapsRef.current[playerIndex] !== null) return

    const elapsed = Math.round(performance.now() - timerStartRef.current)
    console.log('[toktik] tap simultané', { player: playerIndex, elapsed })

    localTapsRef.current = [
      playerIndex === 0 ? elapsed : localTapsRef.current[0],
      playerIndex === 1 ? elapsed : localTapsRef.current[1],
    ]
    setTapStates(prev => [
      playerIndex === 0 ? true : prev[0],
      playerIndex === 1 ? true : prev[1],
    ])
  }, [oscStarted, timerStartRef])

  useEffect(() => {
    if (!tapStates[0] || !tapStates[1] || oscStarted) return
    setOscStarted(true)

    const [t0, t1] = localTapsRef.current
    if (t0 === null || t1 === null) return

    const d0 = Math.abs(t0 - targetMs)
    const d1 = Math.abs(t1 - targetMs)
    const finalPos = d0 < d1 ? 93 : d1 < d0 ? 7 : 50

    const steps = [38, 62, 43, 57, 47, 53]
    steps.forEach((pos, i) => {
      later(() => {
        setDividerDuration(200)
        setDividerPos(pos)
      }, i * 230)
    })

    later(() => {
      setDividerDuration(700)
      setDividerPos(finalPos)
    }, steps.length * 230 + 80)

    later(() => {
      onDoneRef.current([t0, t1])
    }, steps.length * 230 + 900)
  }, [tapStates, oscStarted, targetMs])

  const p0 = config.colors[0].hex
  const p1 = config.colors[1].hex

  return (
    <div
      style={{ position: 'fixed', inset: 0, touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
    >
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          height: `${dividerPos}%`,
          backgroundColor: p0,
          filter: tapStates[0] ? 'none' : 'grayscale(1) brightness(0.25)',
          transition: `height ${dividerDuration}ms ease-in-out, filter 0.35s ease`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, transform: 'rotate(180deg)', pointerEvents: 'none' }}>
          {tapStates[0] ? <CheckedState label="Joueur 1" /> : <TapPrompt label="Joueur 1" />}
        </div>
      </div>

      <div
        style={{
          position: 'absolute', left: 0, right: 0, zIndex: 10,
          top: `${dividerPos}%`,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.55)',
          transform: 'translateY(-50%)',
          transition: `top ${dividerDuration}ms ease-in-out`,
        }}
      />

      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          top: `${dividerPos}%`,
          backgroundColor: p1,
          filter: tapStates[1] ? 'none' : 'grayscale(1) brightness(0.25)',
          transition: `top ${dividerDuration}ms ease-in-out, filter 0.35s ease`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
          {tapStates[1] ? <CheckedState label="Joueur 2" /> : <TapPrompt label="Joueur 2" />}
        </div>
      </div>
    </div>
  )
}

function TapPrompt({ label }: { label: string }) {
  return (
    <>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#FFF', fontWeight: 900, fontSize: '4.5rem', lineHeight: 1, fontFamily: "'Nunito', sans-serif" }}>TAP</span>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>Touche ta zone</span>
    </>
  )
}

function CheckedState({ label }: { label: string }) {
  return (
    <>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>{label}</span>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: "'Nunito', sans-serif" }}>En attente...</span>
    </>
  )
}

// ── SETUP ─────────────────────────────────────────────────────────────────────

function SetupSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </span>
      {children}
    </div>
  )
}

function SetupScreen({
  defaultConfig, onStart,
}: {
  defaultConfig: GameConfig
  onStart: (config: GameConfig) => void
}) {
  const [p1color, setP1color]       = useState<PlayerColor>(defaultConfig.colors[0])
  const [p2color, setP2color]       = useState<PlayerColor>(defaultConfig.colors[1])
  const [rounds, setRounds]         = useState(defaultConfig.totalRounds)
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultConfig.difficulty)
  const [mode, setMode]             = useState<GameMode>(defaultConfig.mode)

  const modeDescriptions: Record<GameMode, string> = {
    sequential:   'Tour par tour · passe le téléphone',
    simultaneous: 'Les deux jouent en même temps',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header gradient TokTik */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)',
        padding: '48px 24px 36px',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12, animation: 'floatC 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}>
          ⏱️
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>TokTik</h1>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
          Duel de précision · 2 joueurs · 1 téléphone
        </p>
      </div>

      {/* Form body */}
      <div style={{ flex: 1, padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Mode de jeu */}
        <SetupSection title="Mode de jeu">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['sequential', 'simultaneous'] as const).map((m) => (
              <button
                key={m}
                onPointerDown={() => setMode(m)}
                style={{
                  padding: '14px 12px',
                  borderRadius: 16,
                  border: mode === m ? '2px solid #2E7D32' : '2px solid #E8E8E8',
                  background: mode === m ? '#F1F8E9' : '#FFF',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: mode === m ? '#2E7D32' : '#1A1A2E', marginBottom: 4 }}>
                  {m === 'sequential' ? 'Tour par tour' : 'Simultané'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: mode === m ? '#2E7D32' : '#999', lineHeight: 1.3 }}>
                  {modeDescriptions[m]}
                </div>
              </button>
            ))}
          </div>
        </SetupSection>

        <div style={{ height: 1, background: '#E8E8E8' }} />

        {/* Couleurs joueurs */}
        {([
          { idx: 0 as const, color: p1color, other: p2color, set: setP1color },
          { idx: 1 as const, color: p2color, other: p1color, set: setP2color },
        ]).map(({ idx, color, other, set }) => (
          <SetupSection key={idx} title={`Joueur ${idx + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color.hex, boxShadow: '0 0 0 2px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>{color.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {PLAYER_COLORS.map((c) => {
                const taken    = c.hex === other.hex
                const isActive = c.hex === color.hex
                return (
                  <button
                    key={c.hex}
                    disabled={taken}
                    onPointerDown={() => !taken && set(c)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: c.hex,
                      opacity: taken ? 0.15 : 1,
                      outline: isActive ? '2px solid #1A1A2E' : '2px solid transparent',
                      outlineOffset: 2,
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                      cursor: taken ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.15s',
                    }}
                  />
                )
              })}
            </div>
          </SetupSection>
        ))}

        <div style={{ height: 1, background: '#E8E8E8' }} />

        {/* Rounds */}
        <SetupSection title="Nombre de rounds">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                onPointerDown={() => setRounds(n)}
                style={{
                  padding: '14px 0',
                  borderRadius: 14,
                  border: rounds === n ? '2px solid #FF6035' : '2px solid #E8E8E8',
                  background: rounds === n ? '#FFF5F2' : '#FFF',
                  fontSize: 18, fontWeight: 900,
                  color: rounds === n ? '#FF6035' : '#1A1A2E',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </SetupSection>

        {/* Difficulté */}
        <SetupSection title="Difficulté">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              ['easy', 'Facile',    '3s – 8s'],
              ['hard', 'Difficile', '8s – 20s'],
            ] as const).map(([val, label, range]) => (
              <button
                key={val}
                onPointerDown={() => setDifficulty(val)}
                style={{
                  padding: '14px 12px',
                  borderRadius: 16,
                  border: difficulty === val ? '2px solid #FF6035' : '2px solid #E8E8E8',
                  background: difficulty === val ? '#FFF5F2' : '#FFF',
                  cursor: 'pointer', textAlign: 'center',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: difficulty === val ? '#FF6035' : '#1A1A2E' }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: difficulty === val ? '#FF8C60' : '#999', marginTop: 2 }}>{range}</div>
              </button>
            ))}
          </div>
        </SetupSection>

        {/* CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button
            onPointerDown={() => onStart({ totalRounds: rounds, difficulty, colors: [p1color, p2color], mode })}
            style={{
              width: '100%', padding: 18,
              borderRadius: 20, border: 'none',
              background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
              color: '#FFF', fontSize: 17, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
              cursor: 'pointer',
            }}
          >
            🚀 Jouer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── RÉSULTAT ──────────────────────────────────────────────────────────────────

function RoundResultScreen({
  result, config, scores, currentRound, totalRounds, isLast, onNext,
}: {
  result: RoundResult
  config: GameConfig
  scores: [number, number]
  currentRound: number
  totalRounds: number
  isLast: boolean
  onNext: () => void
}) {
  const winnerColor = result.winner === 'tie' ? '#6b7280' : config.colors[result.winner].hex

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: winnerColor, fontFamily: "'Nunito', sans-serif" }}>

      {/* Zone colorée avec le résultat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 24px' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 100, padding: '4px 14px',
          fontSize: 12, fontWeight: 800, color: '#FFF',
        }}>
          Round {currentRound} / {totalRounds}
        </div>
        <p style={{ color: '#FFF', fontWeight: 900, fontSize: '2.5rem', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
          {result.winner === 'tie' ? 'Égalité !' : `Joueur ${result.winner + 1} gagne !`}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
          Cible : <span style={{ fontWeight: 900, color: 'rgba(255,255,255,0.85)' }}>{formatTime(result.targetMs)}</span>
        </p>
      </div>

      {/* Panel blanc arrondi */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        borderRadius: '28px 28px 0 0',
        padding: '24px 20px 40px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {([0, 1] as const).map((i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '14px 16px',
          }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, backgroundColor: config.colors[i].hex, boxShadow: '0 0 0 2px rgba(255,255,255,0.3)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 2px', fontWeight: 700 }}>Joueur {i + 1}</p>
              <p style={{ color: '#FFF', fontSize: 13, margin: 0 }}>
                tapé à <span style={{ fontWeight: 900 }}>{formatTime(result.tapMs[i])}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}> · écart </span>
                <span style={{ fontWeight: 900 }}>{formatTime(result.diffMs[i])}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ color: '#FFF', fontWeight: 900, margin: '0 0 2px', fontSize: 15 }}>+{result.points[i]} pts</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{scores[i]} total</p>
            </div>
          </div>
        ))}

        <button
          onPointerDown={onNext}
          style={{
            width: '100%', padding: '18px',
            borderRadius: 20, border: 'none', marginTop: 4,
            background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
            color: '#FFF', fontSize: 16, fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
            cursor: 'pointer',
          }}
        >
          {isLast ? 'Voir les résultats →' : 'Round suivant →'}
        </button>
      </div>
    </div>
  )
}
