# 📍 PRIMER — État de la Session

> **Ce fichier est réécrit à chaque session.**
> Il dit où on en est, ce qui a été fait, ce qui est cassé, ce qui vient ensuite.
> Claude Code le lit en 2e (après CLAUDE.md) pour se mettre dans le contexte immédiatement.

---

## 🗓️ Session Courante

**Date :** 24/04/2026
**Durée :** ~1 journée (session intensive)
**Objectif de la session :** Déployer sur Vercel + créer le premier jeu TokTik

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
- [x] `src/lib/games/registry.ts` — registre des jeux (vide, prêt à accueillir les jeux)
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
- [x] **Jeu Undercover** — jeu multijoueurs social deduction, système de rooms
  - [x] `src/types/games/undercover.ts` — types TypeScript complets
  - [x] `src/lib/games/undercover/words.ts` — génération LLM (claude-haiku) + fallback DB
  - [x] `src/lib/games/undercover/index.ts` — GameModule enregistré dans le registry
  - [x] `supabase/migrations/20260424000000_undercover.sql` — table + seed 29 paires de mots
  - [x] `src/app/api/rooms/[code]/my-role/route.ts` — rôle privé server-side
  - [x] `src/app/api/rooms/[code]/undercover/start/route.ts` — génère mots + assigne rôles
  - [x] `src/app/api/rooms/[code]/undercover/action/route.ts` — description/vote/guess
  - [x] `src/components/games/undercover/GameView.tsx` — UI complète (4 phases + écran final)
  - [x] `RoomLobby.tsx` modifié — config Undercover + rendu GameView quand playing
  - [x] `@anthropic-ai/sdk` installé
  - [x] `docs/games/UNDERCOVER.md` — spec complète

---

## 🔨 Ce Qui Est En Cours

*(Rien — la session s'est terminée proprement)*

---

## 🚧 Blocages Connus

*(Aucun — tout fonctionne en local et sur Vercel)*

---

## 📋 À Faire — Session Suivante

**Priorité 1 — Appliquer la migration Supabase Undercover :**
- [ ] Ouvrir le dashboard Supabase → SQL Editor
- [ ] Coller et exécuter `supabase/migrations/20260424000000_undercover.sql`
- [ ] Vérifier que la table `game_undercover_word_pairs` contient les 29 paires

**Priorité 2 — Tester Undercover en local :**
- [ ] Créer une room avec `game_type: 'undercover'`
- [ ] Tester avec 3+ joueurs (différents onglets)
- [ ] Vérifier que les rôles sont bien privés (my-role route)
- [ ] Vérifier les phases : description → vote → élimination → fin

**Priorité 3 — Lier les jeux à la page d'accueil :**
- [ ] Ajouter une carte "TokTik" sur `/` avec lien vers `/games/toktik`
- [ ] Ajouter une carte "Undercover" sur `/` avec lien vers création de room
- [ ] Section "Jeux disponibles" sur l'accueil

**Priorité 4 — Image Quiz (second jeu multi-joueurs) :**
- [ ] Lire `agents/ORCHESTRATOR.md` et suivre le flux
- [ ] Créer `docs/games/IMAGE_QUIZ.md` (spec validée par le dev)

---

## 🧠 Contexte Technique Actuel

### Versions
```
Node.js     : 20.x
Next.js     : 14.x
TypeScript  : 5.x
Supabase JS : 2.x
shadcn/ui   : installé (Button, Badge)
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
│   ├── page.tsx                        ← Accueil (Créer / Rejoindre)
│   ├── games/
│   │   └── toktik/
│   │       └── page.tsx                ← Jeu TokTik (standalone, pas de rooms)
│   ├── rooms/
│   │   ├── new/page.tsx
│   │   ├── join/page.tsx
│   │   └── [code]/
│   │       ├── page.tsx
│   │       └── RoomLobbyClient.tsx
│   └── api/
│       ├── rooms/route.ts
│       └── rooms/[code]/
│           ├── join/route.ts
│           ├── start/route.ts
│           ├── action/route.ts
│           └── next-round/route.ts
├── components/
│   ├── platform/
│   │   └── RoomLobby.tsx
│   └── ui/
│       ├── button.tsx                  ← shadcn Button
│       └── badge.tsx                   ← shadcn Badge
└── lib/
    ├── platform/
    │   ├── types.ts                    ← GameModule + types DB
    │   ├── room.ts
    │   └── game-engine.ts
    ├── games/
    │   ├── registry.ts                 ← Map des jeux (vide pour l'instant)
    │   └── toktik/
    │       └── logic.ts                ← Logique pure TokTik
    └── supabase/
        ├── client.ts
        ├── admin.ts
        └── server.ts
```

---

## 📝 Notes de Session

### 23/04/2026 — Session bootstrap + rooms
- 8 bugs résolus dans la même session (voir ERRORS.md)
- Le plus vicieux : Next.js 14 cache les `fetch` Supabase → résolu avec `export const dynamic = 'force-dynamic'`
- Race condition sur le join → résolu avec `router.refresh()` + `useRef` guard
- Realtime fonctionne : l'host voit les joueurs arriver en temps réel

### 24/04/2026 (suite) — Session Undercover
- GitHub push réussi sur `BalooInTheJungle/jeu-x-`
- Vercel déployé proprement (4 variables d'env : SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)
- TokTik créé en standalone (pas de rooms) — décision validée : jeu local = pas de Supabase
- Jauge oscillante en mode simultané : CSS transitions sur position du divider + sequence de setTimeout
- shadcn/ui installé (Button, Badge)
- Viewport mobile ajouté au layout global
- Bug CSS : `bg-[#0f0f0f]` (valeur arbitraire Tailwind) ne s'appliquait pas → remplacé par `bg-zinc-950`

### 24/04/2026 (suite) — Session Undercover (continuation)
- `@anthropic-ai/sdk` installé
- Undercover complet : 11 fichiers créés/modifiés, 0 erreur TypeScript
- Architecture : bypass du game-engine générique — logique dans routes dédiées
- Sécurité rôles privés : `rooms.state.privateRoles` jamais lu client-side, route `/my-role` server-side
- Migration SQL avec 29 paires de mots (général, One Piece, Brawl Stars) — À APPLIQUER dans Supabase
- Mr. White activé seulement si ≥ 4 joueurs actifs (sinon trop facile à identifier)
- `RoomLobby.tsx` : config Undercover intégrée (thème, Mr. White, spectateur, mots perso)
