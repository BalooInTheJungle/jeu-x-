# GAME_CREATOR — Générateur de Jeu Complet

> **Tu es l'agent DEV de Kclo Games.**
> Tu reçois une spec validée ET un brief design.
> Tu génères tous les fichiers nécessaires pour qu'un nouveau jeu soit jouable.
> TypeScript strict partout. Inline styles uniquement. Jamais de `any`.

---

## Lecture Obligatoire (avant toute chose)

Lis ces fichiers dans **cet ordre exact** — tous, sans exception :

1. `docs/GAME_CONTRACT.md` — interface TypeScript que tu DOIS respecter
2. `docs/ARCHITECTURE.md` — schéma BDD et flux de données
3. `docs/DESIGN_SYSTEM.md` — DA de référence (obligatoire avant toute UI)
4. `docs/games/[game-id].md` — spec validée du jeu
5. `docs/games/[game-id]_design.md` — brief design (couleurs, écrans, composants)
6. `src/lib/games/eldu/index.ts` — exemple de GameModule à imiter
7. `src/components/games/eldu/GameView.tsx` — exemple de GameView à imiter
8. `src/components/platform/RoomLobby.tsx` — pour savoir où brancher le jeu

Si un de ces fichiers est absent : STOP — signale-le immédiatement.

---

## Ordre de Génération

Génère les fichiers dans cet ordre, un par un.

### Fichier 1 — Spec documentée
`docs/games/[game-id].md`
La spec validée, mise en forme propre depuis le template `docs/games/_template.md`.
(Si le fichier existe déjà depuis PIPELINE Phase 2, saute ce fichier.)

---

### Fichier 2 — Migration SQL
`supabase/migrations/[YYYYMMDD]000000_[game-id].sql`

Contient :
- `CREATE TABLE IF NOT EXISTS game_[id]_[nom]` (préfixe obligatoire)
- Index sur les colonnes filtrées (theme, difficulty...)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Policy `SELECT` pour les requêtes publiques
- Seed de développement minimum 20 entrées réalistes
- Commentaire en tête de fichier : `-- Migration: [game-id] initial`

Exemple de structure :
```sql
-- Migration: [game-id] initial

CREATE TABLE IF NOT EXISTS game_[id]_[nom] (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme      TEXT NOT NULL,
  -- colonnes métier
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_[id]_theme ON game_[id]_[nom](theme);

ALTER TABLE game_[id]_[nom] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON game_[id]_[nom]
  FOR SELECT USING (true);

-- Seed de développement
INSERT INTO game_[id]_[nom] (...) VALUES
  (...),
  ...
;
```

---

### Fichier 3 — Types TypeScript
`src/types/games/[game-id].ts`

Contient au minimum :
- `[GameId]Phase` — type union de toutes les phases
- `[GameId]State` — extension de `GameState`
- `[GameId]RoundData` — ce que les joueurs voient (jamais la réponse)
- `[GameId]Config` — configuration host
- `[GameId]ActionPayload` — payload d'une action joueur

Zéro `any`. Tout est explicitement typé.

---

### Fichier 4 — GameModule
`src/lib/games/[game-id]/index.ts`

Implémente **exactement** l'interface `GameModule` de `docs/GAME_CONTRACT.md`.

Points critiques :
- `initGame` : retourner `const state: [GameId]State = { ... }` (pas de return direct d'objet literal)
- `generateRound` : piocher depuis Supabase, jamais répéter une question (utiliser `previousRounds`)
- `processAction` : vérifier `!state.answeredPlayers.includes(action.playerId)`
- `isRoundOver` : uniquement basé sur `state`, pas d'état externe
- `getFinalRanking` : triée par score décroissant, égalité = ordre alphabétique username

Enregistrer dans `src/lib/games/registry.ts` :
```typescript
import { [gameId]Module } from './[game-id]'
// dans la Map :
['[game_id]', [gameId]Module],
```

---

### Fichier 5 — Routes API
`src/app/api/rooms/[code]/[game-id]/start/route.ts`
`src/app/api/rooms/[code]/[game-id]/action/route.ts`

Pattern à imiter : `src/app/api/rooms/[code]/eldu/start/route.ts`

Règles :
- `export const dynamic = 'force-dynamic'`
- Utiliser `supabaseAdmin` (client service_role) pour les opérations d'écriture
- Logs sur chaque entrée et sortie : `console.log('[route] input:', {...})`
- Retourner `{ error: 'message' }` avec le bon status HTTP en cas d'erreur

La route `start` :
- Vérifie que le demandeur est le host
- Initialise l'état via `[gameId]Module.initGame()`
- Génère le premier round via `[gameId]Module.generateRound()`
- Met à jour `rooms.state`, `rooms.status = 'playing'`

La route `action` :
- Vérifie que la room est en status `playing`
- Appelle `[gameId]Module.processAction()`
- Met à jour `rooms.state`
- Si `isRoundOver()` → calcule scores, avance au round suivant ou passe à `finished`

---

### Fichier 6 — GameView
`src/components/games/[game-id]/GameView.tsx`

**C'est le fichier le plus important.** Il gère toute l'UI du jeu.

Structure attendue :
```tsx
'use client'

// Imports: useState, useEffect, useRef, useCallback
// PAS d'import shadcn/ui — inline styles uniquement

export default function [GameId]GameView({ room, player, players }: GameViewProps) {
  // Machine d'états locale (useReducer ou useState)
  // Récupère l'état depuis room.state
  // Rend l'écran correspondant à la phase courante
}

// Composants d'écrans en dessous
function [Screen](...) { ... }
```

**Règles UI — toutes issues de `docs/DESIGN_SYSTEM.md` :**
- `fontFamily: "'Nunito', sans-serif"` sur tout composant racine
- Fond de page : `background: '#FAFAF8'`
- Texte principal : `color: '#1A1A2E'`
- CTA : `background: 'linear-gradient(90deg, #FF6035, #FF8C60)'`, `borderRadius: 20`, `boxShadow: '0 8px 28px rgba(255,96,53,0.45)'`
- Header lobby : gradient du jeu depuis `src/lib/games/theme.ts`
- Avatars : `getAvatarColor(index)` + `getAvatarEmoji(username)` depuis `src/lib/utils/avatar.ts`
- Zéro `className` avec couleurs Tailwind (`bg-zinc-*`, `text-white`, etc.)

Implémenter **exactement** les écrans décrits dans `docs/games/[game-id]_design.md`.

---

### Fichier 7 — Intégration Lobby
Modifier `src/components/platform/RoomLobby.tsx` :

**Dans la section config (phase `waiting`) :**
```tsx
{room.game_type === '[game_id]' && (
  <[GameId]Config room={room} isHost={player.isHost} onStart={handleStart} />
)}
```

**Dans le dispatch vers GameView (phases `playing` / `finished`) :**
```tsx
{room.game_type === '[game_id]' && (
  <[GameId]GameView room={room} player={player} players={players} />
)}
```

---

### Fichier 8 — Page d'accueil
Modifier `src/app/page.tsx` :

Ajouter l'entrée dans le tableau `GAMES` avec les valeurs du brief design :
```typescript
{
  id: '[game_id]',
  name: '[Nom]',
  description: '[description]',
  badge: '[badge]',
  href: '/rooms/new?game=[game_id]',
  gradient: '[gradient du theme]',
  emoji: '[emoji]',
  floatAnim: '[animation] 3s ease-in-out infinite',
},
```

---

### Fichier 9 — Thème
Modifier `src/lib/games/theme.ts` :

Ajouter l'entrée dans `GAME_THEMES` avec les valeurs du brief design (Section 1 de `[game-id]_design.md`) :
```typescript
[game_id]: {
  gradient: '...',
  primary: '...',
  light: '...',
  emoji: '...',
  floatAnimation: '...',
  badge: '...',
  name: '...',
},
```

---

## Validation Finale

Après avoir généré tous les fichiers, applique `skills/validate-contract.md`.

Si ❌ : corrige toi-même. Maximum 2 tentatives. Si toujours ❌ : signale précisément ce qui bloque.

---

## Rapport de Livraison

Termine en affichant :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Nom du Jeu] — Prêt à tester
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Fichiers créés
  docs/games/[game-id].md
  supabase/migrations/[timestamp]_[game-id].sql
  src/types/games/[game-id].ts
  src/lib/games/[game-id]/index.ts
  src/app/api/rooms/[code]/[game-id]/start/route.ts
  src/app/api/rooms/[code]/[game-id]/action/route.ts
  src/components/games/[game-id]/GameView.tsx

📝 Fichiers mis à jour
  src/lib/games/registry.ts
  src/lib/games/theme.ts
  src/app/page.tsx
  src/components/platform/RoomLobby.tsx
  context/PRIMER.md

🗄️ À faire manuellement
  1. Supabase dashboard → SQL Editor → coller la migration
  2. npm run build
  3. Tester une partie complète en local

💾 Commit suggéré
  git add . && git commit -m "feat: add [game-id] game"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Règles Absolues

### À faire
- Inline styles partout dans l'UI — zéro class Tailwind avec couleurs
- TypeScript strict — interfaces explicites, jamais `any`
- Logs sur chaque route API : `console.log('[route] input:', ...)` + `console.log('[route] result:', ...)`
- Imiter les patterns existants (ELDU > Undercover comme référence)
- `export const dynamic = 'force-dynamic'` sur toutes les routes API

### À ne jamais faire
- Modifier `src/lib/platform/` — c'est le cœur de la plateforme, intouchable
- Créer une table SQL sans le préfixe `game_{id}_`
- Utiliser `any` en TypeScript
- Utiliser `bg-zinc-*`, `text-white`, `rounded-xl` ou toute couleur Tailwind
- Générer un jeu similaire à un existant sans le signaler
- Mettre un fond sombre sur toute la page — seul le header a le gradient du jeu
