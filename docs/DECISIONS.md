# 🧭 DECISIONS — Journal des Choix d'Architecture

> **Ce fichier répond à la question "pourquoi" pour chaque choix technique important.**
> Quand tu reviens après 3 mois, quand un agent crée un nouveau jeu,
> quand tu te demandes "mais pourquoi j'ai fait ça" — la réponse est ici.
>
> Claude Code met ce fichier à jour quand une décision importante est prise.

---

## Format d'une Décision

```
### [Titre court de la décision]
**Date :** JJ/MM/AAAA
**Contexte :** Pourquoi cette décision s'est posée
**Choix :** Ce qui a été décidé
**Pourquoi :** La raison principale (1-3 phrases)
**Alternatives rejetées :** Ce qui a été envisagé mais pas choisi, et pourquoi
**Conséquences :** Ce que ça implique pour la suite
```

---

## Décisions Initiales

---

### Stack : Next.js + Supabase + Vercel
**Date :** Initialisation du projet
**Contexte :** Choix de la stack technique pour la plateforme
**Choix :** Next.js 14 App Router + TypeScript + Supabase + Vercel
**Pourquoi :** Cette combinaison permet d'aller vite sans gérer de serveur. Supabase donne le temps réel natif, l'auth, le stockage et la base de données en un seul outil. Vercel déploie Next.js parfaitement. Tout s'intègre sans friction.
**Alternatives rejetées :**
- Firebase — moins bon SQL, vendor lock-in Google plus risqué
- Prisma + serveur Express — trop de infrastructure à gérer pour un solo dev
- PlanetScale — pas de temps réel natif, une brique de plus
**Conséquences :** On est lié à Supabase pour le temps réel et l'auth. Migration difficile si besoin de changer. Acceptable pour un side project.

---

### Architecture : Platform-first avec GameModule contract
**Date :** Initialisation du projet
**Contexte :** Comment structurer pour que les jeux soient ajoutables facilement
**Choix :** Interface TypeScript `GameModule` que tout jeu doit implémenter. La plateforme ne sait pas ce qu'est un jeu — elle appelle juste les hooks.
**Pourquoi :** Permet à un agent IA d'ajouter un jeu sans toucher au code de la plateforme. Chaque jeu est une boîte noire indépendante.
**Alternatives rejetées :**
- Un gros switch/case par type de jeu — impossible à scaler
- Héritage de classes — plus rigide, moins naturel en TypeScript moderne
**Conséquences :** Overhead initial plus important, mais chaque nouveau jeu prend moins de temps que le précédent. Bon investissement.

---

### Auth : Anonyme en V1, comptes en V2
**Date :** Initialisation du projet
**Contexte :** Est-ce qu'on oblige les joueurs à créer un compte ?
**Choix :** V1 = pseudo temporaire sans compte. V2 = comptes optionnels pour l'historique.
**Pourquoi :** La friction d'inscription tue les jeux de soirée. On veut "entrez le code et jouez" en 30 secondes. Les comptes sont un bonus, pas un prérequis.
**Alternatives rejetées :**
- Compte obligatoire dès V1 — trop de friction pour une soirée spontanée
- Pas de comptes du tout — empêche l'historique et les stats en V2
**Conséquences :** Les pseudos V1 ne sont pas persistants entre les sessions. Acceptable.

---

### Gratuit pour toujours — pas de monétisation
**Date :** Initialisation du projet
**Contexte :** Modèle économique du projet
**Choix :** Gratuit, sans pub, sans premium.
**Pourquoi :** C'est un side project fait pour s'amuser entre amis. Introduire de l'argent changerait les priorités et créerait de la pression. Le plaisir de construire prime.
**Alternatives rejetées :**
- Freemium — complexifie l'architecture (gates, quotas, paiements)
- Donations — négligeable en termes de revenus, pas la motivation
**Conséquences :** Pas de pression de revenus. Les coûts Supabase/Vercel restent dans les tiers gratuits tant que le trafic est modeste.

---

### Temps réel : Supabase Realtime (postgres_changes) plutôt que WebSocket custom
**Date :** Initialisation du projet
**Contexte :** Comment synchroniser l'état du jeu entre les joueurs en temps réel
**Choix :** Supabase Realtime avec `postgres_changes` — les clients s'abonnent aux changements de tables.
**Pourquoi :** Pas de serveur WebSocket à gérer. La source de vérité est la base de données — pas de désynchronisation possible. Gratuit jusqu'à 200 connexions simultanées.
**Alternatives rejetées :**
- Socket.io avec serveur Express — infrastructure supplémentaire à déployer et maintenir
- Pusher / Ably — coût et dépendance externe supplémentaire
- Polling — mauvaise expérience utilisateur, trop de requêtes
**Conséquences :** Si on dépasse 200 connexions simultanées, il faut passer au plan Supabase Pro. Acceptable pour un side project.

---

### Mobile : Web uniquement, pas d'app native
**Date :** Initialisation du projet
**Contexte :** Est-ce qu'on développe une app mobile ?
**Choix :** Web uniquement. Mobile-first dans le CSS mais pas d'app native.
**Pourquoi :** Un jeu de soirée se partage par lien. Personne ne va installer une app pour jouer une fois. Le web est la plateforme naturelle. PWA si besoin plus tard.
**Alternatives rejetées :**
- React Native — double codebase, beaucoup plus de complexité
- Expo — même problème, plus l'overhead de la publication sur les stores
**Conséquences :** Certaines fonctionnalités natives (vibrations, notifications push) ne sont pas disponibles. Acceptable.

---

---

## Décisions — Session 23/04/2026

---

### `force-dynamic` sur toutes les pages temps réel
**Date :** 23/04/2026
**Contexte :** La page `/rooms/[code]` retournait toujours les mêmes données même après de nouveaux joueurs en DB
**Choix :** Ajouter `export const dynamic = 'force-dynamic'` sur toutes les pages qui affichent des données qui changent en temps réel
**Pourquoi :** Next.js 14 App Router met en cache les appels `fetch` des Server Components, y compris ceux faits par le SDK Supabase. Sans ce flag, les données sont figées au premier rendu.
**Alternatives rejetées :**
- `revalidate = 0` — même effet mais sémantique moins claire
- Passer toute la page en Client Component — perd les bénéfices du SSR
**Conséquences :** Les pages avec `force-dynamic` ne sont jamais pré-rendues (pas de cache). Coût en performance négligeable pour un jeu de soirée.

---

### FK explicite dans les requêtes Supabase multi-relations
**Date :** 23/04/2026
**Contexte :** `rooms` a deux FK vers `room_players` (`room_players.room_id` et `rooms.host_id`), ce qui rend la syntaxe `room_players(*)` ambiguë
**Choix :** Toujours utiliser la syntaxe `table!nom_de_la_fk(*)` dès qu'il y a plusieurs FK entre deux tables
**Pourquoi :** PostgREST (la couche API de Supabase) refuse d'exécuter une requête ambiguë et retourne une erreur PGRST201.
**Alternatives rejetées :**
- Supprimer l'une des FK — on perd l'intégrité référentielle sur `host_id`
**Conséquences :** La requête devient `room_players!room_players_room_id_fkey(*)`. À documenter pour les prochains jeux qui ajouteront des tables.

---

### Gestion de la race condition join → redirect → SSR
**Date :** 23/04/2026
**Contexte :** Un joueur qui rejoint une room ne se voyait pas dans la liste (SSR plus rapide que le commit DB)
**Choix :** `RoomLobbyClient` détecte si le joueur courant est absent de la liste initiale et appelle `router.refresh()` une seule fois (guard `useRef`)
**Pourquoi :** Solution légère, sans état serveur supplémentaire. Le `router.refresh()` force un nouveau cycle SSR qui, combiné à `force-dynamic`, retourne les données fraîches.
**Alternatives rejetées :**
- Stocker la liste initiale des joueurs dans localStorage — fragile, données dupliquées
- Attendre avec un `setTimeout` avant de rediriger — hacky, délai arbitraire
**Conséquences :** Un seul aller-retour réseau supplémentaire dans le cas de la race condition. Invisible pour l'utilisateur.

---

## Décisions — Session 24/04/2026

---

### TokTik : jeu standalone sans rooms ni Supabase
**Date :** 24/04/2026
**Contexte :** TokTik est un jeu à 2 joueurs sur 1 seul téléphone. Le système de rooms suppose un appareil par joueur.
**Choix :** TokTik est une page Next.js autonome (`/games/toktik`) avec état React local uniquement. Aucune dépendance à Supabase, à l'API rooms, ou au GameModule.
**Pourquoi :** Un jeu local n'a pas besoin de réseau. Utiliser les rooms aurait créé une complexité inutile et une dépendance Supabase pour un jeu hors-ligne. La plateforme accueille les deux paradigmes : jeux multijoueurs (rooms) et jeux locaux (pages standalone).
**Alternatives rejetées :**
- Rooms avec 2 joueurs sur le même appareil — overhead inutile, authentification locale compliquée
- Adapter GameModule pour le local — sur-ingénierie pour un jeu sans état serveur
**Conséquences :** TokTik n'est pas dans `src/lib/games/registry.ts`. Les futurs jeux locaux suivront le même pattern. Les jeux nécessitant Supabase restent dans le système de rooms.

---

### TokTik mode simultané : détection de zone par coordonnée Y
**Date :** 24/04/2026
**Contexte :** En mode simultané, 2 joueurs tapent le même écran. Il faut savoir quel joueur a tapé.
**Choix :** Chaque `pointerdown` donne `e.clientY`. Si `clientY < window.innerHeight / 2` → Joueur 0 (haut), sinon → Joueur 1 (bas).
**Pourquoi :** L'API `PointerEvent` est native au web et précise à quelques pixels. Pas de bibliothèque supplémentaire, fonctionne sur tous les mobiles modernes. La coupure au milieu de l'écran est naturelle avec le split 50/50.
**Alternatives rejetées :**
- Deux boutons distincts — moins immersif, prend de la place
- `TouchEvent` avec `identifier` — plus complexe, `PointerEvent` est le standard moderne
**Conséquences :** Si un joueur tape accidentellement dans la zone de l'autre, ça compte pour lui. Acceptable — la mécanique de jeu encourage à rester dans sa zone.

---

### TokTik animation jauge : transitions CSS sur position du divider
**Date :** 24/04/2026
**Contexte :** L'animation "jauge qui oscille puis remplit la zone du gagnant" devait être fluide et sans bibliothèque d'animation.
**Choix :** La ligne séparatrice est un `div` absolu dont la position (`top` en %) est contrôlée par un state React. Les zones P0 et P1 ont `height` et `top` qui dépendent de cette valeur. Séquence d'oscillation via `setTimeout`, snap final avec transition CSS 700ms.
**Pourquoi :** CSS `transition` sur des valeurs numériques simples est plus performant que framer-motion pour ce cas. Le rendu reste sur le thread principal GPU. La séquence de setTimeout est lisible et maintenable.
**Alternatives rejetées :**
- framer-motion — overhead de dépendance pour un effet simple
- Canvas/WebGL — sur-ingénierie totale
- `requestAnimationFrame` manuel — plus complexe sans gain visible
**Conséquences :** L'animation dépend de `setTimeout` — sur appareil très lent, le timing peut légèrement dériver. Imperceptible en pratique pour un jeu de soirée.

---

## Décisions — Session 24/04/2026 (suite) — Undercover

---

### Undercover : bypass du game-engine générique pour la logique d'état
**Date :** 24/04/2026
**Contexte :** Le jeu Undercover a une machine d'états complexe (description → vote → élimination → guess → fin) qui ne rentre pas dans le modèle round-by-round du game-engine générique. `processAction` dans le game-engine ne permet pas de muter l'état librement.
**Choix :** Routes API dédiées `/api/rooms/[code]/undercover/start` et `/api/rooms/[code]/undercover/action` qui lisent et écrivent `rooms.state` directement. Le `GameModule` est enregistré dans le registry pour les métadonnées mais ses hooks `processAction`/`isRoundOver` ne sont pas utilisés.
**Alternatives rejetées :**
- Adapter le game-engine pour supporter la mutation d'état — changerait l'interface pour tous les jeux futurs
- Encoder chaque phase comme un "round" — trop artificiel, rompt la sémantique des rounds
**Conséquences :** Les jeux avec logique complexe (social deduction, bluff) suivront ce pattern. Les jeux simples (quiz) continuent d'utiliser le game-engine. C'est un pattern admis dans la plateforme.

---

### Undercover : rôles privés dans rooms.state mais jamais lus côté client
**Date :** 24/04/2026
**Contexte :** `rooms.state` est broadcast via Supabase Realtime à tous les joueurs. Mettre les rôles directement dans l'état exposé révélerait qui est l'undercover.
**Choix :** `rooms.state.privateRoles` contient les rôles de tous les joueurs, mais le composant client `GameView.tsx` ne lit **jamais** ce champ. Chaque joueur appelle `GET /api/rooms/[code]/my-role?playerId=xxx` qui retourne uniquement son propre rôle — cette route utilise le client admin Supabase (bypass RLS) et ne retourne que les données du joueur demandeur.
**Alternatives rejetées :**
- Stocker les rôles dans une table séparée avec RLS — plus propre architecturalement mais complexité supplémentaire pour V1
- Chiffrer les rôles dans le state — complexité côté client sans gain réel
**Conséquences :** Si un joueur inspecte le réseau Realtime, il verra `privateRoles` dans le payload. Acceptable pour un jeu de soirée entre amis. En V2, migrer vers une table séparée avec RLS si nécessaire.

---

### Undercover : Mr. White activé seulement si ≥ 4 joueurs actifs
**Date :** 24/04/2026
**Contexte :** Avec 3 joueurs, si Mr. White est présent : 1 civil, 1 undercover, 1 mr_white. Mr. White n'a pas de mot donc se distingue immédiatement à la phase description.
**Choix :** Dans la route `/undercover/start`, Mr. White n'est assigné que si `activePlayers.length >= 4`, même si l'option est activée dans la config.
**Pourquoi :** Le jeu ne fonctionne pas avec 3 joueurs + Mr. White — trop facile à identifier. 4 joueurs minimum garantit 2 civils pour masquer Mr. White.
**Conséquences :** Le host peut activer Mr. White avec 3 joueurs mais il ne sera pas assigné. L'UI ne prévient pas encore de ce cas — à améliorer.