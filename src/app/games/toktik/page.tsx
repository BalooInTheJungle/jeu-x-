'use client'

import {
  useState, useEffect, useRef, useCallback,
  type CSSProperties, type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  | 'playing'       // mode séquentiel
  | 'handover'      // mode séquentiel
  | 'playing_both'  // mode simultané
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

  // Tap en mode séquentiel
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
      <div className="flex flex-col items-center gap-4">
        <span className="text-white/40 text-xs tracking-[0.3em] uppercase">Mémorise</span>
        <span className="text-white font-black leading-none" style={{ fontSize: '4.5rem' }}>
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
      <div className="flex flex-col items-center gap-6">
        <span className="text-white/40 text-sm">Joueur {i + 1}</span>
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
          style={{ backgroundColor: config.colors[i].hex }}
        >
          <span className="text-white font-black text-6xl">{countdown}</span>
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
        <span className="text-white/70 text-xl font-medium pointer-events-none">
          Joueur {activePlayer + 1}
        </span>
        <span className="text-white font-black pointer-events-none mt-2" style={{ fontSize: '5.5rem', lineHeight: 1 }}>
          TAP
        </span>
        <span className="text-white/40 text-sm mt-8 pointer-events-none">
          Touche quand le temps est écoulé
        </span>
      </FullScreen>
    )
  }

  if (phase === 'handover' && config.mode === 'sequential') {
    const color = config.colors[1].hex
    return (
      <FullScreen bg="#09090b">
        <div className="flex flex-col items-center gap-6 px-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <p className="text-zinc-300 text-2xl font-semibold leading-snug">
            Passe le téléphone à<br />
            <span className="font-black" style={{ color }}>Joueur 2</span>
          </p>
          <p className="text-zinc-600 text-sm">La partie reprend dans 3 secondes</p>
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
      <FullScreen bg={winnerColor}>
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <span className="text-white/70 text-lg font-medium">Fin de partie</span>
          <span className="text-white font-black text-5xl">
            {winner !== null ? `Joueur ${winner + 1} gagne !` : 'Égalité !'}
          </span>
        </div>
        <div className="flex gap-12 mt-12">
          {([0, 1] as const).map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full ring-2 ring-white/30" style={{ backgroundColor: config.colors[i].hex }} />
              <span className="text-white/60 text-sm">Joueur {i + 1}</span>
              <span className="text-white font-black text-4xl">{game.scores[i]}</span>
            </div>
          ))}
        </div>
        <Button
          className="mt-14 bg-white/20 hover:bg-white/30 text-white border-0 px-10 py-6 text-lg font-bold rounded-2xl"
          onPointerDown={() => { setGame(null); setPhase('setup') }}
        >
          Rejouer
        </Button>
      </FullScreen>
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
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: bg, ...style }}
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
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors[0].hex }}>
        <div style={{ transform: 'rotate(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {top}
        </div>
      </div>
      <div className="h-1 bg-black/50 z-10 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors[1].hex }}>
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
  const [tapStates, setTapStates]           = useState<[boolean, boolean]>([false, false])
  const [dividerPos, setDividerPos]         = useState(50)
  const [dividerDuration, setDividerDuration] = useState(200)
  const [oscStarted, setOscStarted]         = useState(false)

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

  // Quand les deux ont tapé → lancer l'animation
  useEffect(() => {
    if (!tapStates[0] || !tapStates[1] || oscStarted) return
    setOscStarted(true)

    const [t0, t1] = localTapsRef.current
    if (t0 === null || t1 === null) return

    const d0 = Math.abs(t0 - targetMs)
    const d1 = Math.abs(t1 - targetMs)
    // P0 gagne → sa zone (haut) grandit → dividerPos → 93
    // P1 gagne → sa zone (bas) grandit → dividerPos → 7
    const finalPos = d0 < d1 ? 93 : d1 < d0 ? 7 : 50

    // Séquence d'oscillation (descend d'abord, puis monte, décroit)
    const steps = [38, 62, 43, 57, 47, 53]
    steps.forEach((pos, i) => {
      later(() => {
        setDividerDuration(200)
        setDividerPos(pos)
      }, i * 230)
    })

    // Snap final vers le gagnant
    later(() => {
      setDividerDuration(700)
      setDividerPos(finalPos)
    }, steps.length * 230 + 80)

    // Notifier le parent après l'animation
    later(() => {
      onDoneRef.current([t0, t1])
    }, steps.length * 230 + 900)
  }, [tapStates, oscStarted, targetMs])

  const p0 = config.colors[0].hex
  const p1 = config.colors[1].hex

  return (
    <div
      className="fixed inset-0"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
    >
      {/* Zone joueur 0 — haut, contenu retourné */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: `${dividerPos}%`,
          backgroundColor: p0,
          filter: tapStates[0] ? 'none' : 'grayscale(1) brightness(0.25)',
          transition: `height ${dividerDuration}ms ease-in-out, filter 0.35s ease`,
        }}
      >
        <div
          className="h-full flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ transform: 'rotate(180deg)' }}
        >
          {tapStates[0] ? (
            <CheckedState label="Joueur 1" />
          ) : (
            <TapPrompt label="Joueur 1" />
          )}
        </div>
      </div>

      {/* Ligne de séparation animée */}
      <div
        className="absolute inset-x-0 z-10"
        style={{
          top: `${dividerPos}%`,
          height: '4px',
          backgroundColor: 'rgba(0,0,0,0.55)',
          transform: 'translateY(-50%)',
          transition: `top ${dividerDuration}ms ease-in-out`,
        }}
      />

      {/* Zone joueur 1 — bas */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          top: `${dividerPos}%`,
          backgroundColor: p1,
          filter: tapStates[1] ? 'none' : 'grayscale(1) brightness(0.25)',
          transition: `top ${dividerDuration}ms ease-in-out, filter 0.35s ease`,
        }}
      >
        <div className="h-full flex flex-col items-center justify-center gap-3 pointer-events-none">
          {tapStates[1] ? (
            <CheckedState label="Joueur 2" />
          ) : (
            <TapPrompt label="Joueur 2" />
          )}
        </div>
      </div>
    </div>
  )
}

function TapPrompt({ label }: { label: string }) {
  return (
    <>
      <span className="text-white/50 text-sm font-medium">{label}</span>
      <span className="text-white font-black" style={{ fontSize: '4.5rem', lineHeight: 1 }}>
        TAP
      </span>
      <span className="text-white/30 text-xs">Touche ta zone</span>
    </>
  )
}

function CheckedState({ label }: { label: string }) {
  return (
    <>
      <span className="text-white/60 text-sm">{label}</span>
      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-white/60 text-xs">En attente...</span>
    </>
  )
}

// ── SETUP ─────────────────────────────────────────────────────────────────────

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
    sequential:    'Chacun joue à son tour — passe le téléphone',
    simultaneous:  'Les deux jouent en même temps, chacun dans sa zone',
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col px-5 py-10 gap-7">
      <div className="flex flex-col gap-1 pt-4">
        <h1 className="text-white font-black text-4xl tracking-tight">TokTik</h1>
        <p className="text-zinc-500 text-sm">Duel de précision · 1 téléphone</p>
      </div>

      {/* Mode de jeu */}
      <div className="flex flex-col gap-3">
        <span className="text-zinc-400 text-sm font-medium">Mode de jeu</span>
        <div className="grid grid-cols-2 gap-2">
          {(['sequential', 'simultaneous'] as const).map((m) => (
            <Button
              key={m}
              variant="outline"
              onPointerDown={() => setMode(m)}
              className={
                mode === m
                  ? 'bg-white text-zinc-950 border-white font-bold hover:bg-white hover:text-zinc-950 flex flex-col h-auto py-3'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white flex flex-col h-auto py-3'
              }
            >
              <span className="font-semibold text-sm">
                {m === 'sequential' ? 'Tour par tour' : 'Simultané'}
              </span>
              <span className="text-xs opacity-60 font-normal leading-tight mt-0.5 whitespace-normal text-center">
                {modeDescriptions[m]}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Couleurs joueurs */}
      <div className="flex flex-col gap-5">
        {([
          { idx: 0 as const, color: p1color, other: p2color, set: setP1color },
          { idx: 1 as const, color: p2color, other: p1color, set: setP2color },
        ]).map(({ idx, color, other, set }) => (
          <div key={idx} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: color.hex }} />
              <span className="text-zinc-400 text-sm font-medium">Joueur {idx + 1}</span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {PLAYER_COLORS.map((c) => {
                const taken    = c.hex === other.hex
                const isActive = c.hex === color.hex
                return (
                  <button
                    key={c.hex}
                    disabled={taken}
                    onPointerDown={() => !taken && set(c)}
                    className="aspect-square rounded-lg transition-all duration-150"
                    style={{
                      backgroundColor: c.hex,
                      opacity: taken ? 0.15 : 1,
                      outline: isActive ? '2px solid white' : '2px solid transparent',
                      outlineOffset: '2px',
                      transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Rounds */}
      <div className="flex flex-col gap-3">
        <span className="text-zinc-400 text-sm font-medium">Nombre de rounds</span>
        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 15].map((n) => (
            <Button
              key={n}
              variant="outline"
              onPointerDown={() => setRounds(n)}
              className={
                rounds === n
                  ? 'bg-white text-zinc-950 border-white font-bold hover:bg-white hover:text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulté */}
      <div className="flex flex-col gap-3">
        <span className="text-zinc-400 text-sm font-medium">Difficulté</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['easy',  'Facile',    '3s – 8s'],
            ['hard',  'Difficile', '8s – 20s'],
          ] as const).map(([val, label, range]) => (
            <Button
              key={val}
              variant="outline"
              onPointerDown={() => setDifficulty(val)}
              className={
                difficulty === val
                  ? 'bg-white text-zinc-950 border-white font-bold hover:bg-white hover:text-zinc-950 flex flex-col h-auto py-3'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white flex flex-col h-auto py-3'
              }
            >
              <span className="font-semibold">{label}</span>
              <span className="text-xs opacity-60 font-normal">{range}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Jouer */}
      <div className="mt-auto pt-2">
        <Button
          className="w-full py-6 text-lg font-black bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl"
          onPointerDown={() =>
            onStart({ totalRounds: rounds, difficulty, colors: [p1color, p2color], mode })
          }
        >
          Jouer
        </Button>
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: winnerColor }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <Badge className="bg-white/20 text-white border-0 text-xs">
          Round {currentRound} / {totalRounds}
        </Badge>
        <p className="text-white font-black text-4xl text-center leading-tight">
          {result.winner === 'tie' ? 'Égalité !' : `Joueur ${result.winner + 1} gagne !`}
        </p>
        <p className="text-white/60 text-sm">
          Cible : <span className="font-bold text-white/80">{formatTime(result.targetMs)}</span>
        </p>
      </div>

      <div className="bg-zinc-950/60 backdrop-blur-sm rounded-t-3xl p-6 flex flex-col gap-4">
        {([0, 1] as const).map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/20" style={{ backgroundColor: config.colors[i].hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-zinc-400 text-xs mb-0.5">Joueur {i + 1}</p>
              <p className="text-white text-sm">
                tapé à <span className="font-bold">{formatTime(result.tapMs[i])}</span>
                <span className="text-zinc-400"> · écart </span>
                <span className="font-bold">{formatTime(result.diffMs[i])}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold">+{result.points[i]} pts</p>
              <p className="text-zinc-400 text-xs">{scores[i]} total</p>
            </div>
          </div>
        ))}

        <Button
          className="w-full mt-2 py-6 bg-white/10 hover:bg-white/20 text-white border-0 font-bold text-base rounded-2xl"
          onPointerDown={onNext}
        >
          {isLast ? 'Voir les résultats →' : 'Round suivant →'}
        </Button>
      </div>
    </div>
  )
}
