import type {
  GameModule,
  GameState,
  Player,
  PlayerAction,
  ActionResult,
  RankingEntry,
} from '@/lib/platform/types'
import type { IsamState, IsamConfig, IsamActionPayload } from '@/types/games/isam'

const isamConfig = {
  id: 'isam',
  name: 'ISAM',
  description: 'Tu crois le connaître ? Prouve-le.',
  minPlayers: 2,
  maxPlayers: 2,
  estimatedDuration: '5–10 min',
  configSchema: [
    {
      key: 'theme',
      type: 'select' as const,
      label: 'Thème',
      default: 'mix',
      options: [
        { value: 'brawl_stars', label: '🎮 Brawl Stars' },
        { value: 'lifestyle', label: '✨ Lifestyle' },
        { value: 'mix', label: '🎲 Mix' },
      ],
    },
    {
      key: 'answerDuration',
      type: 'number' as const,
      label: 'Durée de réponse (secondes)',
      default: 60,
      min: 30,
      max: 120,
    },
    {
      key: 'questionCount',
      type: 'number' as const,
      label: 'Nombre de questions',
      default: 5,
      min: 3,
      max: 10,
    },
  ],
}

export const isamModule: GameModule = {
  config: isamConfig,

  initGame(roomConfig: unknown, players: Player[]): GameState {
    const cfg = (roomConfig ?? {}) as Partial<IsamConfig>
    const questionCount = cfg.questionCount ?? 5
    const answerDuration = cfg.answerDuration ?? 60

    if (players.length < 2) throw new Error('ISAM requiert exactement 2 joueurs')

    const player1Id = players[0].id
    const player2Id = players[1].id
    const deadline = new Date(Date.now() + answerDuration * 1000).toISOString()

    const state: IsamState = {
      currentRound: 1,
      totalRounds: questionCount * 2,
      scores: { [player1Id]: 0, [player2Id]: 0 },
      roundScores: { [player1Id]: 0, [player2Id]: 0 },
      status: 'playing',
      answeredPlayers: [],
      subPhase: 'm1_answer',
      questionIndex: 0,
      questionCount,
      manche1Questions: [],
      manche2Questions: [],
      player1Id,
      player2Id,
      activePlayerId: player1Id,
      manche1Answers: [],
      manche2Answers: [],
      manche1Results: [],
      manche2Results: [],
      questionDeadline: deadline,
    }

    return state
  },

  async generateRound(): Promise<Record<string, unknown>> {
    return {}
  },

  async processAction(action: PlayerAction, state: GameState): Promise<ActionResult> {
    const s = state as IsamState
    const payload = action.payload as IsamActionPayload

    if (s.status !== 'playing') {
      return { isCorrect: false, pointsEarned: 0, feedback: 'Partie terminée' }
    }

    if (payload.advance) {
      return { isCorrect: false, pointsEarned: 0, feedback: 'Avance' }
    }

    if (action.playerId !== s.activePlayerId) {
      return { isCorrect: false, pointsEarned: 0, feedback: "Ce n'est pas ton tour" }
    }

    if (s.answeredPlayers.includes(action.playerId)) {
      return { isCorrect: false, pointsEarned: 0, feedback: 'Déjà répondu' }
    }

    return { isCorrect: false, pointsEarned: 0, feedback: 'OK' }
  },

  isRoundOver(state: GameState): boolean {
    const s = state as IsamState
    if (s.subPhase === 'm1_reveal' || s.subPhase === 'm2_reveal' || s.subPhase === 'mid_ranking') {
      return s.phaseDeadline ? new Date() > new Date(s.phaseDeadline) : false
    }
    if (s.answeredPlayers.includes(s.activePlayerId)) return true
    if (s.questionDeadline && new Date() > new Date(s.questionDeadline)) return true
    return false
  },

  computeRoundScores(state: GameState): Record<string, number> {
    return { ...state.roundScores }
  },

  isGameOver(state: GameState): boolean {
    return state.status === 'finished'
  },

  getFinalRanking(state: GameState): RankingEntry[] {
    const s = state as IsamState
    return Object.entries(s.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, score], index) => ({
        playerId,
        username: '',
        score,
        rank: index + 1,
      }))
  },
}
