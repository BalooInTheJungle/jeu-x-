# GAME_CONTRACT.md — Interface TypeScript des Jeux

> **Ce fichier est la référence absolue.**
> Tout jeu DOIT implémenter cette interface exactement.
> Tout agent qui crée un jeu DOIT lire ce fichier en premier.
> La plateforme ne connaît pas les jeux — elle appelle uniquement ces hooks.

---

## L'Interface Principale

```typescript
// src/lib/platform/types.ts

export interface GameModule {
  /** Métadonnées et schéma de configuration */
  config: GameConfig

  /** Initialise l'état de jeu quand le host démarre */
  initGame(roomConfig: unknown, players: Player[]): GameState

  /** Génère les données d'un round (question, image, etc.) */
  generateRound(
    roundNumber: number,
    config: unknown,
    previousRounds: RoundData[]
  ): Promise<RoundData>

  /** Traite la réponse d'un joueur */
  processAction(action: PlayerAction, state: GameState): Promise<ActionResult>

  /** Vérifie si le round est terminé */
  isRoundOver(state: GameState): boolean

  /** Calcule les scores du round écoulé */
  computeRoundScores(
    state: GameState,
    actions: PlayerAction[]
  ): Record<string, number>

  /** Vérifie si la partie est terminée */
  isGameOver(state: GameState): boolean

  /** Retourne le classement final trié */
  getFinalRanking(state: GameState): RankingEntry[]
}
```

---

## Types Associés

```typescript
// Métadonnées et configuration du jeu
export interface GameConfig {
  id: string              // snake_case unique — ex: "image_quiz"
  name: string            // Nom affiché — ex: "Image Quiz"
  description: string     // 1-2 phrases pour la page d'accueil
  minPlayers: number
  maxPlayers: number
  estimatedDuration: string   // ex: "15-30 min"
  configSchema: ConfigField[] // Options que le host peut régler avant la partie
}

// Un champ de configuration paramétrable par le host
export interface ConfigField {
  key: string
  type: 'number' | 'select' | 'boolean' | 'multiselect'
  label: string
  description?: string
  default: unknown
  options?: { value: unknown; label: string }[]
  min?: number  // pour type 'number'
  max?: number  // pour type 'number'
}

// État courant de la partie — commun à tous les jeux
// Stocké dans rooms.state (JSONB) — doit être sérialisable
export interface GameState {
  currentRound: number
  totalRounds: number
  scores: Record<string, number>       // playerId → score total cumulé
  roundScores: Record<string, number>  // playerId → score du round actuel seulement
  status: 'playing' | 'round_end' | 'finished'
  roundData?: RoundData                // contenu du round en cours (visible par les joueurs)
  roundAnswer?: unknown                // réponse attendue (JAMAIS envoyée au client)
  roundDeadline?: string               // ISO 8601 — timestamp de fin du timer
  answeredPlayers: string[]            // playerIds ayant déjà soumis une réponse ce round
}

// Contenu affiché pendant un round — défini par chaque jeu
// Règle : ne jamais inclure la réponse dans roundData
export type RoundData = Record<string, unknown>

// Une action soumise par un joueur (réponse, vote...)
export interface PlayerAction {
  playerId: string
  roomId: string
  roundNumber: number
  payload: unknown       // contenu spécifique au jeu (ex: { answer: "GTA 5" })
  submittedAt: string    // ISO 8601 — utilisé pour le scoring vitesse
}

// Résultat retourné après traitement d'une action
export interface ActionResult {
  isCorrect: boolean
  pointsEarned: number
  feedback?: string       // message affiché au joueur (ex: "Bonne réponse !")
  correctAnswer?: string  // révélé après soumission
}

// Un joueur dans la room
export interface Player {
  id: string
  username: string
  isHost: boolean
}

// Une entrée dans le classement final
export interface RankingEntry {
  playerId: string
  username: string
  score: number
  rank: number  // 1 = premier
}
```

---

## Règles d'Implémentation

### `initGame`
- Retourne un `GameState` avec `currentRound: 1`, `scores: {}` pour tous les joueurs, `status: 'playing'`
- Ne génère PAS le premier round — c'est la plateforme qui appelle `generateRound` ensuite
- `answeredPlayers` doit être un tableau vide `[]`

### `generateRound`
- Toujours `async` — peut faire des requêtes Supabase pour piocher des questions
- Utiliser `previousRounds` pour éviter de répéter une question déjà posée
- `roundData` ne doit jamais contenir la réponse (stocker dans `roundAnswer` séparément)
- En cas d'impossibilité de générer un round unique → lever une erreur explicite

### `processAction`
- Vérifier que le round est encore actif (`state.status === 'playing'`)
- Vérifier que ce joueur n'a pas déjà répondu (`!state.answeredPlayers.includes(action.playerId)`)
- Mettre à jour `state.answeredPlayers` en ajoutant le playerId
- Retourner un `ActionResult` complet avec `isCorrect` et `pointsEarned`

### `computeRoundScores`
- Initialiser à `0` les joueurs qui n'ont pas répondu (pas d'oubli)
- Ne jamais retourner un score négatif
- Utiliser `action.submittedAt` pour calculer le bonus de vitesse
- Retourne `Record<string, number>` — playerId → points gagnés CE round uniquement

### `isRoundOver`
- `true` quand tous les joueurs ont répondu OU que `roundDeadline` est dépassé
- Ne pas dépendre d'un état externe — uniquement `state` en paramètre

### `isGameOver`
- `true` quand `state.currentRound >= state.totalRounds`

### `getFinalRanking`
- Triée par score décroissant
- En cas d'égalité : ordre alphabétique du `username`
- `rank` commence à 1

---

## Exemple Minimal

```typescript
// src/lib/games/my-game/index.ts

import type { GameModule, GameState, GameConfig } from '@/lib/platform/types'

const config: GameConfig = {
  id: 'my_game',
  name: 'Mon Jeu',
  description: 'Description courte pour la page d\'accueil.',
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: '10-20 min',
  configSchema: [
    {
      key: 'totalRounds',
      type: 'number',
      label: 'Nombre de rounds',
      default: 10,
      min: 5,
      max: 20,
    },
  ],
}

export const myGameModule: GameModule = {
  config,

  initGame(roomConfig, players) {
    const cfg = roomConfig as { totalRounds: number }
    return {
      currentRound: 1,
      totalRounds: cfg.totalRounds ?? 10,
      scores: Object.fromEntries(players.map((p) => [p.id, 0])),
      roundScores: Object.fromEntries(players.map((p) => [p.id, 0])),
      status: 'playing',
      answeredPlayers: [],
    }
  },

  async generateRound(roundNumber, config, previousRounds) {
    // Récupérer une question depuis Supabase
    // Retourner UNIQUEMENT ce que les joueurs peuvent voir
    return { /* roundData sans la réponse */ }
  },

  async processAction(action, state) {
    return {
      isCorrect: false,
      pointsEarned: 0,
    }
  },

  isRoundOver(state) {
    return state.answeredPlayers.length >= Object.keys(state.scores).length
  },

  computeRoundScores(state, actions) {
    return Object.fromEntries(
      Object.keys(state.scores).map((id) => [id, 0])
    )
  },

  isGameOver(state) {
    return state.currentRound >= state.totalRounds
  },

  getFinalRanking(state) {
    return Object.entries(state.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, score], index) => ({
        playerId,
        username: '',  // enrichi par la plateforme
        score,
        rank: index + 1,
      }))
  },
}
```

---

## Ajouter un Jeu au Registre

```typescript
// src/lib/games/registry.ts
import { imageQuizModule } from './image-quiz'
import { myGameModule } from './my-game'

export const gameRegistry = new Map([
  ['image_quiz', imageQuizModule],
  ['my_game', myGameModule],   // ← ajouter ici
])
```
