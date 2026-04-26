import type { GameModule, GameState, Player } from '@/lib/platform/types'
import type { ElduState } from '@/types/games/eldu'

export const elduModule: GameModule = {
  config: {
    id: 'eldu',
    name: 'ELDU',
    description: 'Reconnais le personnage, le drapeau ou le rappeur avant ton adversaire',
    minPlayers: 3,
    maxPlayers: 10,
    estimatedDuration: '5-15 min',
    configSchema: [
      {
        key: 'theme',
        type: 'select',
        label: 'Thème',
        default: 'brawl_stars',
        options: [
          { value: 'brawl_stars', label: 'Brawl Stars' },
          { value: 'flags', label: 'Drapeaux' },
          { value: 'rappers_fr', label: 'Rappeurs FR' },
        ],
      },
      {
        key: 'durationPerPlayer',
        type: 'select',
        label: 'Temps par joueur',
        default: 60,
        options: [
          { value: 30, label: '30 secondes' },
          { value: 60, label: '60 secondes' },
          { value: 90, label: '90 secondes' },
        ],
      },
      {
        key: 'difficulty',
        type: 'select',
        label: 'Difficulté',
        default: 'normal',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'hard', label: 'Difficile (image floue)' },
        ],
      },
    ],
  },

  initGame(_config: unknown, players: Player[]): GameState {
    const allIds = players.map(p => p.id)
    const state: ElduState = {
      currentRound: 1,
      totalRounds: 1,
      scores: Object.fromEntries(allIds.map(id => [id, 0])),
      roundScores: Object.fromEntries(allIds.map(id => [id, 0])),
      status: 'playing',
      answeredPlayers: [],
      elduPhase: 'playing',
      playerOrder: [],
      playerNames: {},
      currentPlayerIndex: 0,
      timers: {},
      timerStartedAt: Date.now(),
      questions: [],
      questionIndex: 0,
      history: [],
    }
    return state
  },

  async generateRound() { return {} },
  async processAction() { throw new Error('ELDU : utiliser POST /api/rooms/[code]/eldu/action') },
  isRoundOver() { return false },
  computeRoundScores() { return {} },

  isGameOver(state: GameState): boolean {
    return (state as ElduState).elduPhase === 'finished'
  },

  getFinalRanking(state: GameState) {
    const s = state as ElduState
    const winnerId = s.winner
    return Object.entries(s.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, score], index) => ({
        playerId,
        username: s.playerNames?.[playerId] ?? playerId,
        score,
        rank: playerId === winnerId ? 1 : index + 2,
      }))
  },
}
