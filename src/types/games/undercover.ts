import type { GameState } from '@/lib/platform/types'

export type UndercoverRole = 'civil' | 'undercover' | 'mr_white'
export type UndercoverPhase = 'description' | 'vote' | 'guess' | 'finished'

export interface UndercoverRoomConfig {
  theme: string
  mrWhiteEnabled: boolean
  hostIsSpectator: boolean
  civilWord: string
  undercoverWord: string
  customWords?: { civil: string; undercover: string }
}

export interface EliminatedEntry {
  playerId: string
  username: string
  role: UndercoverRole
  cycle: number
}

export interface UndercoverState extends GameState {
  undercoverPhase: UndercoverPhase
  cycle: number
  alivePlayers: string[]
  privateRoles: Record<string, { role: UndercoverRole; word: string }>
  playerNames: Record<string, string>
  descriptions: Record<string, string>
  votes: Record<string, string>
  eliminated: EliminatedEntry[]
  pendingGuesser?: string
  winner?: 'civils' | 'undercover' | 'mr_white'
  winnerPlayerIds?: string[]
  speakingOrder: string[]
  currentSpeaker?: string
}
