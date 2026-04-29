export interface GameTheme {
  gradient: string
  primary: string
  light: string
  emoji: string
  floatAnimation: string
  badge: string
  name: string
}

export const GAME_THEMES: Record<string, GameTheme> = {
  undercover: {
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 50%, #CE93D8 100%)',
    primary: '#9C27B0',
    light: '#CE93D8',
    emoji: '🕵️',
    floatAnimation: 'float',
    badge: '3–10 joueurs',
    name: 'Undercover',
  },
  eldu: {
    gradient: 'linear-gradient(135deg, #E65100 0%, #FF6035 50%, #FFAB76 100%)',
    primary: '#FF6035',
    light: '#FFAB76',
    emoji: '🏆',
    floatAnimation: 'floatB',
    badge: '2 joueurs + 1 arbitre',
    name: 'ELDU',
  },
  toktik: {
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)',
    primary: '#2E7D32',
    light: '#66BB6A',
    emoji: '⏱️',
    floatAnimation: 'floatC',
    badge: '2 joueurs · 1 téléphone',
    name: 'TokTik',
  },
  isam: {
    gradient: 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)',
    primary: '#C2185B',
    light: '#F48FB1',
    emoji: '🫀',
    floatAnimation: 'floatB',
    badge: '2 joueurs · duel intime',
    name: 'ISAM',
  },
}

export const DEFAULT_THEME: GameTheme = GAME_THEMES.undercover
