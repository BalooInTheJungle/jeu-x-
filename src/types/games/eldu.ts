import type { GameState } from '@/lib/platform/types'

export type ElduPhase = 'playing' | 'finished'
export type ElduTheme = 'brawl_stars' | 'flags' | 'rappers_fr'

export interface ElduPublicQuestion {
  id: string
  imageUrl: string
}

export interface ElduHistoryEntry {
  questionId: string
  imageUrl: string
  answer: string
  result: 'correct' | 'passed' | 'timeout'
  playerId: string
}

export interface ElduState extends GameState {
  elduPhase: ElduPhase
  playerOrder: string[]
  playerNames: Record<string, string>
  currentPlayerIndex: number
  timers: Record<string, number>
  timerStartedAt: number
  questions: ElduPublicQuestion[]
  questionIndex: number
  history: ElduHistoryEntry[]
  winner?: string
}

export interface ElduRoomConfig {
  theme: ElduTheme
  durationPerPlayer: number
  difficulty: 'normal' | 'hard'
}
