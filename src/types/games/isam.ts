import type { GameState, RoundData } from '@/lib/platform/types'

// ─── Sous-phases ──────────────────────────────────────────────────────────────

export type IsamSubPhase =
  | 'm1_answer'    // Manche 1 : J1 répond aux questions une par une
  | 'm1_guess'     // Manche 1 : J2 devine les réponses de J1 une par une
  | 'm1_reveal'    // Manche 1 : écran résultat après chaque guess (auto-avance 3s)
  | 'mid_ranking'  // Classement intermédiaire entre les deux manches (auto-avance 5s)
  | 'm2_answer'    // Manche 2 : J2 répond à de nouvelles questions une par une
  | 'm2_guess'     // Manche 2 : J1 devine les réponses de J2 une par une
  | 'm2_reveal'    // Manche 2 : écran résultat (auto-avance 3s)

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface IsamQuestion {
  id: string
  theme: string
  imageUrl: string | null
  questionText: string
}

export interface IsamResult {
  questionText: string
  imageUrl: string | null
  prediction: string
  realAnswer: string
  isCorrect: boolean
}

// ─── Config host ──────────────────────────────────────────────────────────────

export interface IsamConfig {
  theme: 'brawl_stars' | 'lifestyle' | 'mix'
  answerDuration: number   // secondes, défaut 60
  questionCount: number    // par manche, défaut 5
}

// ─── Payload action joueur ────────────────────────────────────────────────────

export interface IsamActionPayload {
  answer?: string    // texte libre (réponse ou prédiction)
  advance?: boolean  // true pour les auto-avances (reveal, ranking)
}

// ─── État complet du jeu ──────────────────────────────────────────────────────

export interface IsamState extends GameState {
  subPhase: IsamSubPhase
  questionIndex: number    // 0-based, question courante dans la sous-phase
  questionCount: number    // nombre de questions par manche

  // Questions choisies au démarrage (deux sets différents, même thème)
  manche1Questions: IsamQuestion[]  // questions de J1
  manche2Questions: IsamQuestion[]  // questions de J2

  player1Id: string  // répond en manche 1, devine en manche 2
  player2Id: string  // devine en manche 1, répond en manche 2
  activePlayerId: string

  // Réponses stockées (jamais visibles par l'adversaire avant la révélation)
  manche1Answers: string[]   // réponses de J1
  manche2Answers: string[]   // réponses de J2

  // Résultats des devinages
  manche1Results: IsamResult[]  // devinages de J2 sur J1
  manche2Results: IsamResult[]  // devinages de J1 sur J2

  questionDeadline: string      // deadline réponse/guess courant
  phaseDeadline?: string        // deadline auto-avance (reveal / ranking)
}

// ─── RoundData (visible par les joueurs) ─────────────────────────────────────

export interface IsamRevealData {
  questionText: string
  imageUrl: string | null
  prediction: string
  realAnswer: string
  isCorrect: boolean
}

export interface IsamRoundData extends RoundData {
  subPhase: IsamSubPhase
  questionIndex: number
  questionCount: number
  player1Id: string
  player2Id: string
  activePlayerId: string
  scores: Record<string, number>

  // Phases réponse et devinage
  question?: IsamQuestion
  questionDeadline?: string

  // Phases reveal
  reveal?: IsamRevealData
  phaseDeadline?: string

  // Classements
  manche1Results?: IsamResult[]
  manche2Results?: IsamResult[]
}
