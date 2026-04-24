import type { GameModule, GameState, Player } from '@/lib/platform/types'
import type { UndercoverState } from '@/types/games/undercover'

export const undercoverModule: GameModule = {
  config: {
    id: 'undercover',
    name: 'Undercover',
    description: 'Trouve l\'espion parmi vous avant qu\'il ne vous découvre',
    minPlayers: 3,
    maxPlayers: 10,
    estimatedDuration: '15-30 min',
    configSchema: [
      {
        key: 'theme',
        type: 'select',
        label: 'Thème',
        default: 'general',
        options: [
          { value: 'general', label: 'Général' },
          { value: 'one_piece', label: 'One Piece' },
          { value: 'brawl_stars', label: 'Brawl Stars' },
          { value: 'custom', label: 'Mots personnalisés' },
        ],
      },
      {
        key: 'mrWhiteEnabled',
        type: 'boolean',
        label: 'Activer Mr. White',
        description: 'Un joueur ne reçoit aucun mot et doit bluffer',
        default: true,
      },
      {
        key: 'hostIsSpectator',
        type: 'boolean',
        label: 'Host en spectateur',
        description: 'Le host ne joue pas — utile si tu veux animer la partie',
        default: false,
      },
    ],
  },

  initGame(_roomConfig: unknown, players: Player[]): GameState {
    const allIds = players.map(p => p.id)
    const shuffled = [...allIds].sort(() => Math.random() - 0.5)

    const state: UndercoverState = {
      currentRound: 1,
      totalRounds: 1,
      scores: Object.fromEntries(allIds.map(id => [id, 0])),
      roundScores: Object.fromEntries(allIds.map(id => [id, 0])),
      status: 'playing',
      answeredPlayers: [],
      undercoverPhase: 'description',
      cycle: 1,
      alivePlayers: allIds,
      privateRoles: {},
      playerNames: {},
      descriptions: {},
      votes: {},
      eliminated: [],
      speakingOrder: shuffled,
      currentSpeaker: shuffled[0],
    }
    return state
  },

  async generateRound() {
    return {}
  },

  async processAction() {
    throw new Error('Undercover : utiliser POST /api/rooms/[code]/undercover/action')
  },

  isRoundOver() {
    return false
  },

  computeRoundScores() {
    return {}
  },

  isGameOver(state: GameState): boolean {
    const s = state as UndercoverState
    return s.undercoverPhase === 'finished'
  },

  getFinalRanking(state: GameState) {
    const s = state as UndercoverState
    const winnerIds = s.winnerPlayerIds ?? []
    return Object.entries(s.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, score], index) => ({
        playerId,
        username: playerId,
        score,
        rank: winnerIds.includes(playerId) ? 1 : index + 2,
      }))
  },
}
