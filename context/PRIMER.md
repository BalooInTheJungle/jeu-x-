# 📍 PRIMER — État de la Session

> **Ce fichier est réécrit à chaque session.**
> Il dit où on en est, ce qui a été fait, ce qui est cassé, ce qui vient ensuite.
> Claude Code le lit en 2e (après CLAUDE.md) pour se mettre dans le contexte immédiatement.

---

## 🗓️ Session Courante

**Date :** 23/04/2026
**Durée :** ~1 journée (session intensive)
**Objectif de la session :** Bootstrapper le projet Next.js et faire fonctionner le système de rooms de bout en bout

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
- [ ] Premier déploiement Vercel
- [ ] Image Quiz jouable en local

---

## 🔨 Ce Qui Est En Cours

*(Rien — la session s'est terminée proprement)*

---

## 🚧 Blocages Connus

*(Aucun — tout fonctionne en local)*

---

## 📋 À Faire — Session Suivante

**Priorité 1 — Déploiement Vercel :**
- [ ] Connecter le repo GitHub à Vercel
- [ ] Configurer les variables d'environnement dans Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Premier déploiement et test en production

**Priorité 2 — Image Quiz (premier jeu) :**
- [ ] Lire `agents/ORCHESTRATOR.md` et suivre le flux
- [ ] Créer `docs/games/IMAGE_QUIZ.md` (spec du jeu)
- [ ] Créer `src/lib/games/image-quiz/` (module GameModule)
- [ ] Créer les tables Supabase `game_image_quiz_*`
- [ ] UI du jeu (affichage image, input réponse, timer, scoreboard)

---

## 🧠 Contexte Technique Actuel

### Versions
```
Node.js     : 20.x
Next.js     : 14.x
TypeScript  : 5.x
Supabase JS : 2.x
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
Production    : [à remplir après premier déploiement]
Supabase      : dashboard.supabase.com → ton projet
Vercel        : [à remplir après connexion]
```

### Structure des fichiers importants
```
src/
├── app/
│   ├── page.tsx                        ← Accueil (Créer / Rejoindre)
│   ├── rooms/
│   │   ├── new/page.tsx                ← Formulaire créer une room
│   │   ├── join/page.tsx               ← Formulaire rejoindre par code
│   │   └── [code]/
│   │       ├── page.tsx                ← Server component (force-dynamic)
│   │       └── RoomLobbyClient.tsx     ← Lit localStorage, gère race condition
│   └── api/
│       ├── rooms/route.ts              ← POST créer une room
│       └── rooms/[code]/
│           ├── join/route.ts           ← POST rejoindre
│           └── start/route.ts          ← POST démarrer la partie
├── components/
│   └── platform/
│       └── RoomLobby.tsx               ← Lobby temps réel (Realtime Supabase)
└── lib/
    ├── platform/
    │   ├── types.ts                    ← GameModule + types DB
    │   ├── room.ts                     ← Logique rooms
    │   └── game-engine.ts              ← Moteur de jeu
    ├── supabase/
    │   ├── client.ts                   ← Client anon (front)
    │   └── admin.ts                    ← Client service_role (back)
    └── games/
        └── registry.ts                 ← Map des jeux enregistrés
```

---

## 📝 Notes de Session

### 23/04/2026 — Session bootstrap + rooms
- 8 bugs résolus dans la même session (voir ERRORS.md)
- Le plus vicieux : Next.js 14 cache les `fetch` Supabase → résolu avec `export const dynamic = 'force-dynamic'`
- Race condition sur le join → résolu avec `router.refresh()` + `useRef` guard
- Realtime fonctionne : l'host voit les joueurs arriver en temps réel
- Tout fonctionne en local, prochaine étape : Vercel + Image Quiz
