# ✅ SKILL : validate-contract

> **Usage :** Appelle ce skill quand tu veux vérifier qu'un jeu respecte bien le contrat.
> Court par défaut — détaillé seulement si un point est complexe.

---

## Ce Que Ce Skill Vérifie

Quand Claude Code applique ce skill, il passe le code d'un jeu à travers
cette checklist dans l'ordre. Il s'arrête et signale dès qu'un point échoue.

---

## Checklist de Validation

### 1. Structure des fichiers
```
src/lib/games/[game-id]/
  ├── index.ts       ← existe et exporte GameModule ?
  └── generator.ts   ← existe ?

src/components/games/[game-id]/
  ├── GameView.tsx    ← existe ?
  ├── RoundDisplay.tsx ← existe ?
  └── ConfigForm.tsx  ← existe ?

src/app/games/[game-id]/
  └── page.tsx        ← existe ?

supabase/migrations/
  └── *_[game-id].sql ← existe ?

docs/games/
  └── [GAME_ID].md    ← existe ?
```

### 2. Interface GameModule — méthodes obligatoires

Vérifie que chaque méthode est implémentée et correctement typée :

| Méthode | Signature attendue | Erreurs fréquentes |
|---------|-------------------|-------------------|
| `config` | `GameConfig` | Champs manquants : minPlayers, maxPlayers, configSchema |
| `initGame` | `(roomConfig, players) → GameState` | Oubli de `scores: {}` dans le state initial |
| `generateRound` | `async (n, config, prev) → unknown` | Pas async, ou répétition possible des questions |
| `processAction` | `async (action, state) → ActionResult` | Pas de vérification que le round est actif |
| `isRoundOver` | `(state) → boolean` | Logique inversée (true quand faux) |
| `computeRoundScores` | `(state, actions) → Record<string, number>` | Oubli des joueurs sans réponse (score 0) |
| `isGameOver` | `(state) → boolean` | Ne vérifie pas `currentRound >= totalRounds` |
| `getFinalRanking` | `(state) → {playerId, score}[]` | Pas trié par score décroissant |

### 3. TypeScript — zéro tolérance

```bash
# Commande à lancer pour vérifier
npx tsc --noEmit
```

Signaux d'alerte :
- `any` dans le fichier du jeu → ❌ refuser
- `@ts-ignore` → ❌ refuser sauf exception documentée
- `as unknown as X` → ⚠️ vérifier si c'est justifié

### 4. Base de données

- [ ] Table avec préfixe `game_{id}_` ?
- [ ] RLS policy présente ?
- [ ] Index sur les colonnes fréquemment filtrées (`theme`, `difficulty`) ?
- [ ] Données de seed incluses dans la migration ?

### 5. Registre

```typescript
// src/lib/games/registry.ts
// Le jeu doit être listé ici
import { flagQuizModule } from './flag-quiz'
import { [nouveauJeu]Module } from './[game-id]'  // ← vérifie que c'est là

export const gameRegistry = new Map([
  ['flag_quiz', flagQuizModule],
  ['[game-id]', [nouveauJeu]Module],  // ← et ici
])
```

---

## Format de Rapport

Si tout est bon :
```
✅ [Nom du jeu] — Contrat validé
Tous les points de la checklist sont au vert.
```

Si un point échoue :
```
❌ [Nom du jeu] — Problème détecté

Problème : [description simple du problème]
Fichier : [chemin/fichier.ts]
Ligne : [numéro si possible]

Ce que ça risque de causer : [conséquence concrète]

Fix suggéré : [code ou explication]
```