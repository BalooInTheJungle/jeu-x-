# 🕵️ Undercover — Spec du Jeu

> **Jeu multijoueur temps réel — utilise le système de rooms.**
> Minimum 3 joueurs, maximum 10.

---

## Concept

Chaque joueur reçoit un mot secret. La majorité reçoit le **mot civil**. Un joueur reçoit le **mot undercover** (proche mais différent). Optionnellement, un joueur reçoit **rien du tout** (Mr. White).

Les joueurs donnent chacun une description de leur mot à tour de rôle. Puis tout le monde vote pour éliminer un suspect. L'undercover doit rester discret ; les civils doivent le débusquer.

---

## Rôles

| Rôle | Reçoit | Objectif |
|------|--------|----------|
| **Civil** | Le mot civil | Éliminer tous les undercoverts |
| **Undercover** | Un mot proche | Survivre jusqu'à ≥ autant de civils vivants |
| **Mr. White** | Rien | Survivre et, si éliminé, deviner le mot civil |

---

## Déroulement d'un Cycle

1. **Description** — chaque joueur vivant décrit son mot en un mot ou courte expression (dans un ordre aléatoire fixé au démarrage)
2. **Vote** — tout le monde vote pour éliminer un joueur
3. **Élimination** — le joueur avec le plus de votes est éliminé
   - Si c'est Mr. White → **phase Guess** : il tente de deviner le mot civil
   - Sinon → vérifier les conditions de victoire

### Répétition
Les cycles se répètent jusqu'à une condition de victoire.

---

## Conditions de Victoire

| Condition | Gagnant |
|-----------|---------|
| Plus aucun undercover vivant | Civils |
| Undercover ≥ civils vivants | Undercover |
| Mr. White éliminé + devine le mot civil | Mr. White |
| Mr. White éliminé + rate la devinette | Civils (ou continue si undercover encore en jeu) |

---

## Configuration (choisie par le host)

| Option | Valeurs | Défaut |
|--------|---------|--------|
| **Thème** | Général / One Piece / Brawl Stars / Mots perso | Général |
| **Mr. White** | Activé / Désactivé | Activé (si ≥ 4 joueurs) |
| **Host spectateur** | Oui / Non | Non |
| **Mots perso** | Texte libre (si thème = perso) | — |

---

## Génération des Mots

**Ordre de priorité :**
1. Mots personnalisés (si le host les saisit)
2. LLM Anthropic (`claude-haiku-4-5`) avec le thème choisi
3. Base de données (`game_undercover_word_pairs`) si LLM échoue

---

## Structure Technique

### Routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/rooms/[code]/undercover/start` | POST | Génère les mots + assigne les rôles + démarre |
| `/api/rooms/[code]/undercover/action` | POST | Actions : description / vote / guess |
| `/api/rooms/[code]/my-role` | GET | Retourne le rôle privé du joueur (server-side uniquement) |

### Fichiers

```
src/
├── types/games/undercover.ts              ← Types TypeScript
├── lib/games/undercover/
│   ├── index.ts                           ← GameModule (minimal — logique dans routes)
│   └── words.ts                           ← Génération LLM + fallback DB
├── app/api/rooms/[code]/
│   ├── my-role/route.ts                   ← GET rôle privé
│   └── undercover/
│       ├── start/route.ts                 ← POST démarrage
│       └── action/route.ts                ← POST actions
└── components/games/undercover/
    └── GameView.tsx                       ← UI du jeu (phases + écran final)
```

### Sécurité : rôles privés

`rooms.state.privateRoles` contient les rôles de TOUS les joueurs. Ce champ est dans le JSONB Supabase et broadcast via Realtime — **le client NE DOIT PAS lire ce champ directement**.

Chaque joueur appelle `GET /api/rooms/[code]/my-role?playerId=xxx` qui retourne uniquement son propre rôle, server-side, via le client admin Supabase.

### État du jeu (UndercoverState)

```typescript
interface UndercoverState extends GameState {
  undercoverPhase: 'description' | 'vote' | 'guess' | 'finished'
  cycle: number
  alivePlayers: string[]        // player IDs encore en jeu
  privateRoles: Record<string, { role: UndercoverRole; word: string }>
  descriptions: Record<string, string>  // réinitialisé chaque cycle
  votes: Record<string, string>          // réinitialisé chaque cycle
  eliminated: EliminatedEntry[]
  pendingGuesser?: string        // ID de Mr. White en phase guess
  winner?: 'civils' | 'undercover' | 'mr_white'
  winnerPlayerIds?: string[]
  speakingOrder: string[]        // ordre fixé au démarrage
  currentSpeaker?: string        // en phase description uniquement
}
```

---

## Table Supabase

```
game_undercover_word_pairs
├── id           uuid PK
├── theme        text  (general | one_piece | brawl_stars)
├── civil_word   text
├── undercover_word text
└── created_at   timestamptz
```

Migration : `supabase/migrations/20260424000000_undercover.sql`

---

## Décision importante

Ce jeu **bypass le game-engine générique** (`src/lib/platform/game-engine.ts`). La logique d'état est entièrement gérée dans les routes API `/undercover/start` et `/undercover/action`. Le `GameModule` (dans `registry.ts`) expose les métadonnées du jeu et `getFinalRanking` mais ses hooks `processAction` / `isRoundOver` ne sont pas utilisés.

→ Voir `docs/DECISIONS.md` pour le détail de cette décision.
