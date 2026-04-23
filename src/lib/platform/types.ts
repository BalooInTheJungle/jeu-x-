// Interfaces du contrat GameModule — source de vérité : docs/GAME_CONTRACT.md
// Ne jamais modifier sans mettre à jour la documentation en parallèle

export interface GameModule {
  config: GameConfig
  initGame(roomConfig: unknown, players: Player[]): GameState
  generateRound(roundNumber: number, config: unknown, previousRounds: RoundData[]): Promise<RoundData>
  processAction(action: PlayerAction, state: GameState): Promise<ActionResult>
  isRoundOver(state: GameState): boolean
  computeRoundScores(state: GameState, actions: PlayerAction[]): Record<string, number>
  isGameOver(state: GameState): boolean
  getFinalRanking(state: GameState): RankingEntry[]
}

export interface GameConfig {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  estimatedDuration: string
  configSchema: ConfigField[]
}

export interface ConfigField {
  key: string
  type: 'number' | 'select' | 'boolean' | 'multiselect'
  label: string
  description?: string
  default: unknown
  options?: { value: unknown; label: string }[]
  min?: number
  max?: number
}

export interface GameState {
  currentRound: number
  totalRounds: number
  scores: Record<string, number>
  roundScores: Record<string, number>
  status: 'playing' | 'round_end' | 'finished'
  roundData?: RoundData
  roundAnswer?: unknown    // réponse attendue — jamais envoyée au client
  roundDeadline?: string   // ISO 8601
  answeredPlayers: string[]
}

export type RoundData = Record<string, unknown>

export interface PlayerAction {
  playerId: string
  roomId: string
  roundNumber: number
  payload: unknown
  submittedAt: string // ISO 8601
}

export interface ActionResult {
  isCorrect: boolean
  pointsEarned: number
  feedback?: string
  correctAnswer?: string
}

export interface Player {
  id: string
  username: string
  isHost: boolean
}

export interface RankingEntry {
  playerId: string
  username: string
  score: number
  rank: number
}

// Types des lignes DB
export interface RoomRow {
  id: string
  code: string
  game_type: string
  status: 'waiting' | 'playing' | 'finished'
  config: Record<string, unknown>
  state: Partial<GameState>
  host_id: string | null
  created_at: string
  updated_at: string
}

export interface RoomPlayerRow {
  id: string
  room_id: string
  username: string
  score: number
  is_host: boolean
  is_connected: boolean
  joined_at: string
}

export interface PlayerActionRow {
  id: string
  room_id: string
  player_id: string
  round_number: number
  payload: unknown
  submitted_at: string
}
