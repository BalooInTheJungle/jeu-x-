import type { GameModule, GameState, Player } from '@/lib/platform/types'
import type { ImageQuizState } from '@/types/games/image-quiz'

export const imageQuizModule: GameModule = {
  config: {
    id: 'image_quiz',
    name: 'Image Quiz',
    description: 'Reconnais le personnage avant que ton adversaire ne le fasse',
    minPlayers: 3,
    maxPlayers: 10,
    estimatedDuration: '5-15 min',
    configSchema: [
      {
        key: 'theme',
        type: 'select',
        label: 'Thème',
        default: 'brawl_stars',
        options: [{ value: 'brawl_stars', label: 'Brawl Stars' }],
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
    const state: ImageQuizState = {
      currentRound: 1,
      totalRounds: 1,
      scores: Object.fromEntries(allIds.map(id => [id, 0])),
      roundScores: Object.fromEntries(allIds.map(id => [id, 0])),
      status: 'playing',
      answeredPlayers: [],
      imageQuizPhase: 'playing',
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

  async processAction() {
    throw new Error('Image Quiz : utiliser POST /api/rooms/[code]/image-quiz/action')
  },

  isRoundOver() { return false },
  computeRoundScores() { return {} },

  isGameOver(state: GameState): boolean {
    return (state as ImageQuizState).imageQuizPhase === 'finished'
  },

  getFinalRanking(state: GameState) {
    const s = state as ImageQuizState
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
