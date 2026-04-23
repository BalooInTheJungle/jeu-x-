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
| game_type | VARCHAR(50) | NOT NULL | ID du jeu dans le registre (ex: "image_quiz") |
| status | TEXT | DEFAULT 'waiting' | `waiting` → `playing` → `finished` |
| config | JSONB | DEFAULT '{}' | Config choisie par le host (thèmes, nb rounds...) |
| state | JSONB | DEFAULT '{}' | État courant — source de vérité, déclenche Realtime |
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
game_image_quiz_questions   ← questions du jeu Image Quiz
game_flag_quiz_flags        ← données du jeu Flag Quiz
```

---

## Flux de Données — Cycle de Vie d'une Partie

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
   → rooms.updated_at mis à jour → Realtime déclenche l'affichage chez tous

4. ROUND EN COURS
   Chaque client est abonné à rooms via Realtime
   Il voit rooms.state.roundData → affiche la question/image

   Chaque joueur soumet sa réponse :
   POST /api/rooms/[code]/action
   → GameModule.processAction(action, state) → validation
   → insère dans player_actions
   → met à jour rooms.state.answeredPlayers
   → Realtime propagé → les autres voient "X joueurs ont répondu"

5. FIN DE ROUND
   Condition : isRoundOver() = true (tous ont répondu OU timer expiré)
   POST /api/rooms/[code]/next-round (déclenché par le host ou automatiquement)
   → GameModule.computeRoundScores(state, actions) → room_players.score mis à jour
   → rooms.state.status = 'round_end' → affichage des scores intermédiaires
   → Si GameModule.isGameOver() → rooms.status = 'finished'
   → Sinon → GameModule.generateRound(n+1) → round suivant

6. FIN DE PARTIE
   rooms.status = 'finished'
   GameModule.getFinalRanking(state) → classement final affiché
```

---

## API Routes

```
POST   /api/rooms                     Créer une room
GET    /api/rooms/[code]              État initial de la room (chargement de page)
POST   /api/rooms/[code]/join         Rejoindre une room
POST   /api/rooms/[code]/start        Démarrer la partie (host uniquement)
POST   /api/rooms/[code]/action       Soumettre une action joueur
POST   /api/rooms/[code]/next-round   Passer au round suivant
GET    /api/rooms/[code]/state        État courant (fallback si Realtime ko)
```

---

## Realtime — Source de Vérité

La table `rooms` est la source de vérité unique. Les clients s'abonnent aux changements via Supabase Realtime.

```typescript
supabase
  .channel(`room:${code}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: `code=eq.${code}`
  }, (payload) => updateGameState(payload.new.state))
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  }, (payload) => updatePlayerList(payload))
  .subscribe()
```

---

## Structure des Dossiers Code

```
src/
├── app/
│   ├── page.tsx                     Accueil — liste des jeux disponibles
│   ├── rooms/
│   │   ├── new/page.tsx             Créer une room
│   │   └── [code]/page.tsx          Vue de la room (waiting + jeu + fin)
│   └── api/
│       └── rooms/
│           ├── route.ts             POST /api/rooms
│           └── [code]/
│               ├── route.ts         GET /api/rooms/[code]
│               ├── join/route.ts
│               ├── start/route.ts
│               ├── action/route.ts
│               └── next-round/route.ts
├── lib/
│   ├── platform/                    ← NE JAMAIS MODIFIER SANS DISCUSSION
│   │   ├── types.ts                 Interfaces GameModule, GameState, etc.
│   │   ├── room.ts                  Logique de création/gestion des rooms
│   │   └── game-engine.ts           Orchestrateur du cycle de vie du jeu
│   ├── games/
│   │   ├── registry.ts              Map game_id → GameModule
│   │   └── image-quiz/
│   │       ├── index.ts             Implémentation GameModule
│   │       └── generator.ts         Logique de génération des rounds
│   └── supabase/
│       ├── client.ts                Client Supabase (browser)
│       └── server.ts                Client Supabase (server)
└── components/
    ├── platform/                    Composants partagés (Room, Lobby, Scoreboard)
    └── games/
        └── image-quiz/
            ├── ConfigForm.tsx
            ├── GameView.tsx
            └── RoundDisplay.tsx
```
