# ARCHITECTURE.md — Schéma & Flux de Données

---

## Tables Plateforme

> Ces 3 tables appartiennent à la plateforme. Ne jamais les modifier sans discussion.
> Les jeux ne les touchent jamais directement — ils passent par les hooks `GameModule`.
>
> **Migration :** `supabase/migrations/20260423_platform_initial.sql`
> **Statut :** ✅ Appliquée

### `rooms`

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | |
| code | CHAR(4) | UNIQUE, généré auto | Code de rejointe (ex: "XKZP") — sans I ni O |
| game_type | VARCHAR(50) | NOT NULL | ID du jeu dans le registre (ex: "undercover") |
| status | TEXT | DEFAULT 'waiting' | `waiting` → `playing` → `finished` |
| config | JSONB | NOT NULL, DEFAULT '{}' | Config choisie par le host (thèmes, options...) |
| state | JSONB | NOT NULL, DEFAULT '{}' | État courant — source de vérité, déclenche Realtime |
| host_id | UUID | FK room_players | Nullable — ajouté après création du joueur |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | AUTO via trigger | Mis à jour automatiquement à chaque UPDATE |

### `room_players`

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | |
| room_id | UUID | FK rooms CASCADE | |
| username | VARCHAR(20) | NOT NULL | Pseudo anonyme V1 (pas de compte) |
| score | INTEGER | DEFAULT 0 | Score total cumulé |
| is_host | BOOLEAN | DEFAULT false | Créateur de la room |
| is_connected | BOOLEAN | DEFAULT true | Présence — mis à jour côté client |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `player_actions`

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| id | UUID | PK | |
| room_id | UUID | FK rooms CASCADE | |
| player_id | UUID | FK room_players CASCADE | |
| round_number | INTEGER | CHECK > 0 | Numéro du round |
| payload | JSONB | NOT NULL | Contenu spécifique au jeu (réponse, vote...) |
| submitted_at | TIMESTAMPTZ | DEFAULT NOW() | Horodatage — base du scoring vitesse |

---

## Tables Spécifiques aux Jeux

Chaque jeu crée ses propres tables avec le préfixe `game_{id}_`.
Ces tables ne sont jamais lues par la plateforme — seulement par le module du jeu.

```
game_undercover_word_pairs   ← paires civil/undercover par thème (29 paires seedées)
game_image_quiz_questions    ← questions du jeu Image Quiz (à créer)
```

**Migration Undercover :** `supabase/migrations/20260424000000_undercover.sql`
**Statut :** ⚠️ À appliquer manuellement dans le dashboard Supabase → SQL Editor

---

## Flux de Données — Cycle de Vie d'une Partie

### Jeux génériques (via game-engine)

```
1. HOST CRÉE LA ROOM
   POST /api/rooms
   → génère un code 4 lettres unique
   → insère dans `rooms` (status: 'waiting')
   → redirige vers /rooms/[code]

2. JOUEURS REJOIGNENT
   POST /api/rooms/[code]/join
   → insère dans `room_players`
   → Realtime: tous les clients voient la liste se mettre à jour

3. HOST CONFIGURE ET DÉMARRE
   POST /api/rooms/[code]/start
   → rooms.status = 'playing'
   → GameModule.initGame(config, players) → rooms.state initialisé
   → GameModule.generateRound(1, config, []) → rooms.state.roundData rempli
   → Realtime déclenche l'affichage chez tous

4. ROUND EN COURS
   Chaque joueur soumet sa réponse :
   POST /api/rooms/[code]/action
   → GameModule.processAction(action, state) → validation
   → insère dans player_actions
   → met à jour rooms.state.answeredPlayers → Realtime propagé

5. FIN DE ROUND
   POST /api/rooms/[code]/next-round
   → GameModule.computeRoundScores → room_players.score mis à jour
   → Si GameModule.isGameOver() → rooms.status = 'finished'
   → Sinon → GameModule.generateRound(n+1)

6. FIN DE PARTIE
   rooms.status = 'finished'
   GameModule.getFinalRanking(state) → classement final affiché

7. RELANCER UNE MANCHE
   POST /api/rooms/[code]/reset (host uniquement)
   → rooms.status = 'waiting', state = {}, config = {}
   → Realtime ramène tout le monde au lobby
```

### Undercover (routes dédiées — bypass game-engine)

Undercover a une logique de phases complexe (description → vote → guess → finished)
qui ne rentre pas dans le modèle round-based du game-engine générique.
Il utilise ses propres routes :

```
POST /api/rooms/[code]/undercover/start   ← génère mots (LLM + DB), assigne rôles
POST /api/rooms/[code]/undercover/action  ← description / vote / guess
GET  /api/rooms/[code]/my-role            ← rôle privé server-side (jamais exposé au client)
POST /api/rooms/[code]/reset              ← commun à tous les jeux, relance le lobby
```

Voir `docs/DECISIONS.md` pour les raisons de ce bypass.

---

## API Routes

```
POST   /api/rooms                              Créer une room
GET    /api/rooms/[code]                       État initial de la room (chargement de page)
POST   /api/rooms/[code]/join                  Rejoindre une room
POST   /api/rooms/[code]/start                 Démarrer la partie (jeux génériques, host uniquement)
POST   /api/rooms/[code]/action                Soumettre une action joueur (jeux génériques)
POST   /api/rooms/[code]/next-round            Passer au round suivant (jeux génériques)
GET    /api/rooms/[code]/my-role               Rôle privé du joueur (Undercover)
POST   /api/rooms/[code]/reset                 Relancer une manche dans la même room (host)
POST   /api/rooms/[code]/undercover/start      Démarrer Undercover (assigne rôles + mots)
POST   /api/rooms/[code]/undercover/action     Action Undercover (description / vote / guess)
```

---

## Realtime — Source de Vérité

La table `rooms` est la source de vérité unique. Les clients s'abonnent aux changements via Supabase Realtime.

```typescript
supabase
  .channel(`room-${roomId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: `id=eq.${roomId}`
  }, (payload) => {
    setStatus(payload.new.status)
    setState(payload.new.state)
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  }, (payload) => updatePlayerList(payload))
  .subscribe()
```

**Attention :** Supabase Realtime sérialise `CHAR(4)` de façon incorrecte dans certains cas.
Toujours utiliser `initialRoom.code` (valeur SSR) comme source de vérité pour le code de room,
pas `payload.new.code`.

---

## Structure des Dossiers Code

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
│   │       ├── page.tsx                  ← SSR : charge la room, redirige si inexistante
│   │       └── RoomLobbyClient.tsx       ← Client : guard join + rendu RoomLobby
│   └── api/
│       └── rooms/[code]/
│           ├── route.ts
│           ├── join/route.ts
│           ├── start/route.ts
│           ├── action/route.ts
│           ├── next-round/route.ts
│           ├── my-role/route.ts          ← Rôle privé (Undercover)
│           ├── reset/route.ts            ← Relance le lobby (tous les jeux)
│           └── undercover/
│               ├── start/route.ts
│               └── action/route.ts
├── components/
│   ├── platform/
│   │   └── RoomLobby.tsx                 ← Lobby + dispatch vers GameView selon game_type
│   ├── games/
│   │   └── undercover/
│   │       └── GameView.tsx              ← UI complète Undercover (4 phases + fin)
│   └── ui/
│       ├── button.tsx                    ← shadcn Button
│       └── badge.tsx                     ← shadcn Badge
├── lib/
│   ├── platform/                         ← NE JAMAIS MODIFIER SANS DISCUSSION
│   │   ├── types.ts                      ← GameModule, RoomRow, RoomPlayerRow, Player...
│   │   ├── room.ts                       ← createRoom, joinRoom, getRoom
│   │   └── game-engine.ts                ← startGame, submitAction, advanceToNextRound
│   ├── games/
│   │   ├── registry.ts                   ← Map game_id → GameModule
│   │   ├── toktik/logic.ts               ← Logique pure TokTik (pas de DB)
│   │   └── undercover/
│   │       ├── index.ts                  ← GameModule (processAction délégue aux routes)
│   │       └── words.ts                  ← Génération LLM (claude-haiku) + fallback DB
│   └── supabase/
│       ├── client.ts                     ← Client Supabase (browser)
│       ├── admin.ts                      ← Client service_role (bypass RLS, server only)
│       └── server.ts                     ← Client Supabase (server components)
├── types/
│   └── games/
│       └── undercover.ts                 ← UndercoverState, UndercoverRole, UndercoverPhase...
└── supabase/
    └── migrations/
        ├── 20260423_platform_initial.sql ← Tables plateforme (appliquée ✅)
        └── 20260424000000_undercover.sql  ← game_undercover_word_pairs (À APPLIQUER ⚠️)
```

---

## Piège FK Supabase — À Retenir

La table `rooms` a deux FK vers `room_players` (`host_id` et la FK inverse `room_id`).
Quand on joint `rooms` avec `room_players`, Supabase ne sait pas quelle FK utiliser → erreur PGRST201.

**Toujours utiliser la FK explicite :**
```typescript
// ❌ Ambigu → PGRST201
supabase.from('rooms').select('*, room_players(*)')

// ✅ Correct
supabase.from('rooms').select('*, room_players!room_players_room_id_fkey(*)')
```
