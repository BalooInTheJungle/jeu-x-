export const PLAYER_COLORS = [
  { label: 'Rouge',  hex: '#EF4444' },
  { label: 'Bleu',   hex: '#3B82F6' },
  { label: 'Vert',   hex: '#22C55E' },
  { label: 'Jaune',  hex: '#EAB308' },
  { label: 'Violet', hex: '#A855F7' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Rose',   hex: '#EC4899' },
  { label: 'Cyan',   hex: '#06B6D4' },
] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]
export type Difficulty = 'easy' | 'hard'
export type GameMode = 'sequential' | 'simultaneous'

export interface GameConfig {
  totalRounds: number
  difficulty: Difficulty
  colors: [PlayerColor, PlayerColor]
  mode: GameMode
}

export interface RoundResult {
  round: number
  targetMs: number
  tapMs: [number, number]
  diffMs: [number, number]
  points: [number, number]
  winner: 0 | 1 | 'tie'
}

export interface GameState {
  config: GameConfig
  currentRound: number
  scores: [number, number]
  results: RoundResult[]
}

const DIFFICULTY_RANGE: Record<Difficulty, [number, number]> = {
  easy: [3000, 8000],
  hard: [8000, 20000],
}

export function generateTargetMs(difficulty: Difficulty): number {
  const [min, max] = DIFFICULTY_RANGE[difficulty]
  return Math.floor(Math.random() * (max - min) + min)
}

export function computePoints(diffMs: number): number {
  return Math.max(0, 100 - Math.floor(diffMs / 10))
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${s}s${cs.toString().padStart(2, '0')}`
}

export function buildRoundResult(
  round: number,
  targetMs: number,
  tapMs: [number, number],
): RoundResult {
  const diffMs: [number, number] = [
    Math.abs(tapMs[0] - targetMs),
    Math.abs(tapMs[1] - targetMs),
  ]
  const points: [number, number] = [computePoints(diffMs[0]), computePoints(diffMs[1])]
  const winner: 0 | 1 | 'tie' =
    diffMs[0] < diffMs[1] ? 0 : diffMs[1] < diffMs[0] ? 1 : 'tie'
  return { round, targetMs, tapMs, diffMs, points, winner }
}

export function initGame(config: GameConfig): GameState {
  return { config, currentRound: 1, scores: [0, 0], results: [] }
}
