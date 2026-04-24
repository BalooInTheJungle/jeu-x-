# 📍 PRIMER — État de la Session

> **Ce fichier est réécrit à chaque session.**
> Il dit où on en est, ce qui a été fait, ce qui est cassé, ce qui vient ensuite.
> Claude Code le lit en 2e (après CLAUDE.md) pour se mettre dans le contexte immédiatement.

---

## 🗓️ Session Courante

**Date :** 24/04/2026
**Durée :** ~2 jours (sessions intensives)
**Objectif de la session :** Jeu Undercover complet + fix bugs + relance de manche

---

## ✅ Ce Qui Est Fait (état du projet)

> Mise à jour à chaque fin de session. Ajoute les items, ne les supprime pas.

- [x] Référentiels de documentation créés (PROJECT.md, ARCHITECTURE.md, GAME_CONTRACT.md, etc.)
- [x] CLAUDE.md configuré
- [x] .claudeignore configuré
- [x] PRIMER.md créé (ce fichier)
- [x] Projet Next.js 14 initialisé (package.json, tsconfig, tailwind, shadcn/ui)
- [x] Supabase connecté et testé
- [x] scripts/agent.ts — runner CLI agents via API Anthropic
- [x] Tables plateforme créées et appliquées dans Supabase (rooms, room_players, player_actions)
- [x] Realtime activé sur `rooms` et `room_players` via SQL (`ALTER PUBLICATION`)
- [x] `src/lib/platform/types.ts` — types GameModule, RoomRow, RoomPlayerRow, etc.
- [x] `src/lib/platform/room.ts` — createRoom, joinRoom, getRoom
- [x] `src/lib/platform/game-engine.ts` — startGame, submitAction, advanceToNextRound
- [x] `src/lib/supabase/admin.ts` — client service_role (bypass RLS)
- [x] `src/lib/games/registry.ts` — registre des jeux
- [x] API routes : POST /api/rooms, POST /api/rooms/[code]/join, POST /api/rooms/[code]/start
- [x] UI : page d'accueil, créer une room, rejoindre par code, lobby temps réel
- [x] Flux complet testé : créer → partager code → rejoindre → voir les joueurs en temps réel
- [x] **Repo GitHub** : https://github.com/BalooInTheJungle/jeu-x-
- [x] **Déploiement Vercel** : connecté au repo GitHub, 4 variables d'env configurées
- [x] **shadcn/ui** : Button et Badge installés (`src/components/ui/`)
- [x] **Viewport mobile** ajouté dans `src/app/layout.tsx`
- [x] **Jeu TokTik** — jeu local 2 joueurs, 1 téléphone, duel de précision temporelle
  - [x] `src/lib/games/toktik/logic.ts` — logique pure (types, scoring, formatage)
  - [x] `src/app/games/toktik/page.tsx` — jeu complet avec machine d'états
  - [x] Mode séquentiel : tour par tour, pass-the-phone
  - [x] Mode simultané : split screen, zones tactiles, animation jauge oscillante
  - [x] Setup : choix couleur par joueur, rounds, difficulté, mode
- [x] **Jeu Undercover** — jeu multijoueurs social deduction, système de rooms ✅ COMPLET
  - [x] `src/types/games/undercover.ts` — types TypeScript complets
  - [x] `src/lib/games/undercover/words.ts` — génération LLM (claude-haiku) + fallback DB
  - [x] `src/lib/games/undercover/index.ts` — GameModule enregistré dans le registry
  - [x] `supabase/migrations/20260424000000_undercover.sql` — table + seed 29 paires de mots
  - [x] `src/app/api/rooms/[code]/my-role/route.ts` — rôle privé server-side
  - [x] `src/app/api/rooms/[code]/undercover/start/route.ts` — génère mots + assigne rôles
  - [x] `src/app/api/rooms/[code]/undercover/action/route.ts` — description/vote/guess
  - [x] `src/app/api/rooms/[code]/reset/route.ts` — relance une manche dans la même room
  - [x] `src/components/games/undercover/GameView.tsx` — UI complète (4 phases + écran final)
  - [x] `RoomLobby.tsx` — config Undercover + rendu GameView pour `playing` et `finished`
  - [x] `@anthropic-ai/sdk` installé
  - [x] `docs/games/UNDERCOVER.md` — spec complète
  - [x] Testé en conditions réelles : 3 joueurs, cycle complet, relance de manche ✅
- [x] **Page d'accueil** — cartes TokTik + Undercover + rejoindre par code
- [x] **Rooms/new** — paramètre `?game=` dans l'URL pour présélectionner le jeu

---

## 🔨 Ce Qui Est En Cours

*(Rien — la session s'est terminée proprement)*

---

## 🚧 Blocages Connus

**Migration Supabase** — la table `game_undercover_word_pairs` doit être créée manuellement :
- Ouvrir le dashboard Supabase → SQL Editor
- Coller et exécuter `supabase/migrations/20260424000000_undercover.sql`
- Sans ça, la génération de mots tombe en erreur DB (le LLM prend le relais, mais c'est le fallback)

---

## 📋 À Faire — Session Suivante

**Priorité 1 — Sécurité (urgent) :**
- [ ] **Régénérer la `SUPABASE_SERVICE_ROLE_KEY`** dans le dashboard Supabase (Settings → API → Regenerate)
- [ ] **Régénérer l'`ANTHROPIC_API_KEY`** dans console.anthropic.com
- [ ] Mettre à jour les nouvelles clés dans `.env.local` et dans Vercel (Settings → Environment Variables)
- Raison : `.env.example` contenait les vraies clés — remplacées avant le push mais présentes dans l'historique git

**Priorité 2 — Image Quiz (premier vrai quiz multi-joueurs) :**
- [ ] Lire `agents/ORCHESTRATOR.md` et suivre le flux de création de jeu
- [ ] Créer `docs/games/IMAGE_QUIZ.md` (spec validée par le dev avant de coder)
- [ ] Migration SQL : table `game_image_quiz_questions` + seed de questions
- [ ] Module `GameModule` + routes dédiées
- [ ] UI : ConfigForm dans RoomLobby, GameView, écran de résultats
- [ ] Tester avec plusieurs joueurs

---

## 🧠 Contexte Technique Actuel

### Versions
```
Node.js              : 20.x
Next.js              : 14.x
TypeScript           : 5.x
Supabase JS          : 2.x
@anthropic-ai/sdk    : installé (claude-haiku-4-5-20251001 pour génération de mots)
shadcn/ui            : installé (Button, Badge)
```

### Commandes Utiles
```bash
npm run dev          # Lance le serveur local → http://localhost:3000
npm run build        # Build de production (vérifie les erreurs TypeScript)
npm run lint         # Vérifie le style de code
vercel deploy        # Déploie sur Vercel
bash context/memory.sh  # Injecte le contexte git dans le terminal
```

### URLs Importantes
```
Local         : http://localhost:3000
TokTik local  : http://localhost:3000/games/toktik
Production    : [URL Vercel — à récupérer dans le dashboard Vercel]
Supabase      : dashboard.supabase.com → ton projet
GitHub        : https://github.com/BalooInTheJungle/jeu-x-
Vercel        : vercel.com → projet jeu-x
```

### Structure des fichiers importants
```
src/
├── app/
│   ├── page.tsx                          ← Accueil (cartes TokTik, Undercover, Rejoindre)
│   ├── games/
│   │   └── toktik/page.tsx               ← Jeu TokTik (standalone, pas de rooms)
│   ├── rooms/
│   │   ├── new/page.tsx                  ← Créer une room (?game= présélectionne le jeu)
│   │   ├── join/page.tsx
│   │   └── [code]/
│   │       ├── page.tsx
│   │       └── RoomLobbyClient.tsx
│   └── api/
│       └── rooms/[code]/
│           ├── route.ts
│           ├── join/route.ts
│           ├── start/route.ts
│           ├── action/route.ts
│           ├── next-round/route.ts
│           ├── my-role/route.ts          ← Rôle privé (Undercover)
│           ├── reset/route.ts            ← Relance une manche dans la même room
│           └── undercover/
│               ├── start/route.ts        ← Démarre Undercover (assigne rôles + mots)
│               └── action/route.ts       ← description / vote / guess
├── components/
│   ├── platform/
│   │   └── RoomLobby.tsx                 ← Lobby + dispatch vers GameView selon game_type
│   ├── games/
│   │   └── undercover/
│   │       └── GameView.tsx              ← UI complète Undercover (4 phases)
│   └── ui/
│       ├── button.tsx
│       └── badge.tsx
├── lib/
│   ├── platform/                         ← NE JAMAIS MODIFIER SANS DISCUSSION
│   │   ├── types.ts
│   │   ├── room.ts
│   │   └── game-engine.ts
│   ├── games/
│   │   ├── registry.ts                   ← Map game_id → GameModule
│   │   ├── toktik/logic.ts
│   │   └── undercover/
│   │       ├── index.ts                  ← GameModule (processAction délégue aux routes)
│   │       └── words.ts                  ← Génération LLM + fallback DB
│   └── supabase/
│       ├── client.ts
│       ├── admin.ts
│       └── server.ts
├── types/
│   └── games/
│       └── undercover.ts                 ← UndercoverState, UndercoverRole, etc.
└── supabase/
    └── migrations/
        ├── 20260423_platform_initial.sql ← Tables plateforme (appliquée ✅)
        └── 20260424000000_undercover.sql  ← game_undercover_word_pairs (À APPLIQUER ⚠️)
```

---

## 📝 Notes de Session

### 23/04/2026 — Session bootstrap + rooms
- 8 bugs résolus dans la même session (voir ERRORS.md)
- Le plus vicieux : Next.js 14 cache les `fetch` Supabase → résolu avec `export const dynamic = 'force-dynamic'`
- Race condition sur le join → résolu avec `router.refresh()` + `useRef` guard
- Realtime fonctionne : l'host voit les joueurs arriver en temps réel

### 24/04/2026 — Session Undercover complète
- TokTik créé en standalone (pas de rooms) — décision validée : jeu local = pas de Supabase
- Undercover complet : 13 fichiers créés, 0 erreur TypeScript, testé à 3 joueurs
- Architecture : bypass du game-engine générique — logique dans routes dédiées (voir DECISIONS.md)
- Sécurité rôles : `privateRoles` jamais lu client-side, route `/my-role` server-side uniquement
- Fix clé : `room.code` via Realtime CHAR(4) peut retourner `'C'` → contourné en passant `initialRoom.code` (SSR) comme prop
- Fix FK : `room_players(*)` → ambiguïté PGRST201 → utiliser `room_players!room_players_room_id_fkey(*)`
- `RoomLobby` status `'finished'` affiche toujours le GameView (sinon le lobby réapparaissait)
- `config` et `state` ont des contraintes NOT NULL en DB → reset avec `{}` et non `null`
- `.env.example` contenait de vraies clés → remplacées avant le push → **régénérer les clés** (Priorité 1)
