import type { GameState } from '@/lib/platform/types'

export type ImageQuizPhase = 'playing' | 'finished'

export interface ImageQuizPublicQuestion {
  id: string
  imageUrl: string
}

export interface ImageQuizHistoryEntry {
  questionId: string
  imageUrl: string
  answer: string
  result: 'correct' | 'passed' | 'timeout'
  playerId: string
}

export interface ImageQuizState extends GameState {
  imageQuizPhase: ImageQuizPhase
  playerOrder: string[]              // [player1Id, player2Id] — les 2 compétiteurs
  playerNames: Record<string, string>
  currentPlayerIndex: number         // 0 ou 1
  timers: Record<string, number>     // ms restants par joueur
  timerStartedAt: number             // Date.now() serveur quand le tour courant a démarré
  questions: ImageQuizPublicQuestion[] // imageUrl seulement — jamais la réponse
  questionIndex: number
  history: ImageQuizHistoryEntry[]
  winner?: string
}

export interface ImageQuizRoomConfig {
  theme: 'brawl_stars'
  durationPerPlayer: number  // secondes : 30 | 60 | 90
  difficulty: 'normal' | 'hard'
}
