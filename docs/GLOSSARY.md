# 📖 GLOSSARY — Dictionnaire des Termes du Projet

> **Ce fichier définit chaque terme utilisé dans le projet.**
> Technique ET produit — ce que le code appelle les choses ET ce que les joueurs voient.
> Quand un terme est ambigu, ce fichier fait foi.
>
> Claude Code consulte ce fichier quand un terme n'est pas clair.
> Il le met à jour quand un nouveau concept est introduit.

---

## Comment Lire Ce Fichier

Chaque terme a :
- **Ce que c'est** — définition simple en 1-2 phrases
- **Côté technique** — comment c'est appelé dans le code
- **Côté joueur** — comment le joueur le voit dans l'interface
- **Ne pas confondre avec** — les termes proches qui sont différents

---

## Termes de la Plateforme

---

### Platform (Plateforme)
**Ce que c'est :** L'ensemble du système — le site web, la base de données, les rooms, les joueurs. C'est le "conteneur" qui accueille tous les jeux.
**Côté technique :** Tout ce qui est dans `src/lib/platform/` et les tables `rooms`, `room_players`, `player_actions`
**Côté joueur :** Le site web lui-même — la page d'accueil, le lobby, le scoreboard
**Ne pas confondre avec :** Un jeu spécifique (Flag Quiz, etc.) qui est un module dans la plateforme

---

### Room
**Ce que c'est :** Une session de jeu éphémère. Quand tu crées une partie, une Room est créée. Elle disparaît (ou est archivée) quand la partie est terminée.
**Côté technique :** Table `rooms` en base de données. Identifiée par un UUID interne et un `code` lisible par les humains.
**Côté joueur :** "La partie" — identifiée par le code à 6 caractères qu'on partage aux amis (ex: `XKTR42`)
**Ne pas confondre avec :** Le jeu lui-même (Flag Quiz) — une Room *joue* à un jeu, elle n'est pas un jeu

---

### Room Code
**Ce que c'est :** Le code à 6 caractères qui identifie une Room de façon lisible. C'est ce qu'on partage aux amis pour qu'ils rejoignent.
**Côté technique :** Champ `code` dans la table `rooms`. Généré aléatoirement, unique, en majuscules. Ex: `XKTR42`
**Côté joueur :** "Le code de la partie" — ce qu'on tape pour rejoindre
**Ne pas confondre avec :** L'UUID interne de la Room (jamais visible par les joueurs)

---

### Host
**Ce que c'est :** Le joueur qui a créé la Room. Il a des droits supplémentaires : configurer la partie, la lancer, la terminer.
**Côté technique :** `room_players.is_host = true`. Le `host_id` est aussi stocké dans `rooms`.
**Côté joueur :** "Celui qui a créé la partie" — voit un bouton "Lancer" que les autres ne voient pas
**Ne pas confondre avec :** Un administrateur du site (qui n'existe pas dans ce projet)

---

### Player (Joueur)
**Ce que c'est :** Une personne dans une Room. Peut être anonyme (juste un pseudo) ou connectée avec un compte.
**Côté technique :** Ligne dans la table `room_players`. Identifié par un UUID. Peut avoir un `user_id` si connecté, ou juste un `username` si anonyme.
**Côté joueur :** Son pseudo affiché pendant la partie
**Ne pas confondre avec :** Un `user` (compte Supabase Auth persistant) — en V1, tous les joueurs sont anonymes

---

### Lobby
**Ce que c'est :** L'écran d'attente avant que la partie commence. Les joueurs arrivent, voient qui est là, et attendent que le Host lance.
**Côté technique :** État `rooms.status = 'waiting'`. C'est la même page que le jeu — elle change d'affichage selon le status.
**Côté joueur :** "La salle d'attente" — on voit les avatars des autres joueurs arriver en temps réel
**Ne pas confondre avec :** Le menu principal (page d'accueil du site)

---

### Game (Jeu)
**Ce que c'est :** Un type de jeu disponible sur la plateforme. Flag Quiz est un jeu. Undercover sera un jeu. Chaque jeu a ses propres règles, composants, et données.
**Côté technique :** Un module qui implémente l'interface `GameModule`. Identifié par un `game_id` en snake_case (ex: `flag_quiz`). Vit dans `src/lib/games/[game-id]/`
**Côté joueur :** Ce qu'on choisit sur la page d'accueil avant de créer une partie
**Ne pas confondre avec :** Une Room (qui est *une instance* d'un jeu) ou un Round (qui est *une unité* dans une partie)

---

### GameModule
**Ce que c'est :** L'interface TypeScript que chaque jeu doit implémenter. C'est le "contrat" entre la plateforme et un jeu. La plateforme appelle les méthodes du GameModule sans savoir comment elles fonctionnent à l'intérieur.
**Côté technique :** Interface définie dans `src/types/games.ts`. Méthodes : `initGame`, `generateRound`, `processAction`, `isRoundOver`, `computeRoundScores`, `isGameOver`, `getFinalRanking`
**Côté joueur :** Invisible — c'est de la plomberie interne
**Ne pas confondre avec :** Un composant React (qui gère l'affichage) ou une API route (qui gère les requêtes HTTP)

---

### Round
**Ce que c'est :** Une unité de jeu. Une partie = N rounds. Chaque round a une question/challenge, un timer, et des réponses des joueurs.
**Côté technique :** Pas une table dédiée — c'est un concept géré dans `rooms.game_state.currentRound`. Les données d'un round sont dans `game_state.roundData`.
**Côté joueur :** "Une question" ou "un tour" — ex: "Drapeau 3 sur 10"
**Ne pas confondre avec :** Une partie entière (qui contient plusieurs rounds) ou une action (qui est la réponse d'un joueur dans un round)

---

### Action
**Ce que c'est :** Ce qu'un joueur fait pendant un round. Soumettre une réponse, cliquer sur une option, voter — tout ça c'est une action.
**Côté technique :** Ligne insérée dans la table `player_actions`. A un `action_type` (ex: `submit_answer`) et un `payload` (les données de l'action).
**Côté joueur :** "Répondre" — taper son réponse et appuyer sur Entrée
**Ne pas confondre avec :** Un événement Realtime (qui notifie les autres joueurs) ou un résultat (qui est calculé après l'action)

---

### Score
**Ce que c'est :** Le nombre de points d'un joueur. Augmente au fil des rounds selon les règles du jeu.
**Côté technique :** Champ `score` dans `room_players`. Mis à jour après chaque round via `computeRoundScores`.
**Côté joueur :** Le nombre affiché sur le scoreboard
**Ne pas confondre avec :** Le résultat d'un round (qui est le score *gagné* dans ce round) ou le classement final (qui est l'ordre trié des scores)

---

### Scoreboard
**Ce que c'est :** L'affichage des scores de tous les joueurs, en temps réel pendant la partie.
**Côté technique :** Composant `src/components/platform/Scoreboard.tsx`. Lit `room_players` via Supabase Realtime.
**Côté joueur :** "Le classement" — visible pendant et après la partie
**Ne pas confondre avec :** Le résumé de fin de partie (qui est le classement final figé)

---

### GameState
**Ce que c'est :** La photographie complète de l'état d'une partie à un instant T. Contient le round en cours, les scores, le statut, et les données spécifiques au round.
**Côté technique :** Champ JSONB `rooms.game_state`. Structure définie par l'interface `GameState` dans `src/types/games.ts`.
**Côté joueur :** Invisible — c'est ce que la plateforme lit pour savoir quoi afficher
**Ne pas confondre avec :** La config de la partie (choisie avant le lancement) ou les actions des joueurs (qui sont dans une table séparée)

---

### Config (Configuration)
**Ce que c'est :** Les paramètres choisis par le Host avant de lancer la partie. Nombre de rounds, thèmes, durée par round, difficulté — tout ce qui est réglable.
**Côté technique :** Champ JSONB `rooms.config`. Structure définie par `configSchema` dans `GameConfig`.
**Côté joueur :** "Les réglages" — le formulaire que le Host remplit dans le Lobby avant de lancer
**Ne pas confondre avec :** Le GameState (qui change pendant la partie) ou les règles (qui sont fixes dans le GameModule)

---

### Theme (Thème)
**Ce que c'est :** Une catégorie de contenu dans un jeu. Pour Flag Quiz : "Europe", "Monde", "Afrique". Pour un quiz : "Jeux vidéo", "Pop culture", "BD".
**Côté technique :** Champ `theme` dans les tables de contenu des jeux (ex: `game_flag_quiz_questions.theme`)
**Côté joueur :** Les cases à cocher dans les réglages — "Quels thèmes vous voulez jouer ?"
**Ne pas confondre avec :** Un jeu entier (Flag Quiz est un jeu, "Europe" est un thème dans ce jeu)

---

### Registry (Registre)
**Ce que c'est :** La liste de tous les jeux disponibles sur la plateforme. C'est là que la plateforme sait quels jeux existent.
**Côté technique :** `src/lib/games/registry.ts` — une Map qui associe chaque `game_id` à son `GameModule`
**Côté joueur :** La page d'accueil qui liste les jeux disponibles
**Ne pas confondre avec :** Un jeu individuel ou la base de données

---

## Termes des Agents IA

---

### Agent
**Ce que c'est :** Un assistant IA spécialisé avec un rôle précis. Chaque agent a son propre fichier de prompt dans `agents/`. Il lit les docs du projet et travaille dans son domaine.
**Exemples :** GAME_CREATOR crée des jeux, DEBUG résout les bugs, CONTENT_ENRICHER ajoute du contenu
**Ne pas confondre avec :** Claude Code en général (qui est l'outil) ou un bot (qui est automatique sans supervision)

---

### Skill
**Ce que c'est :** Un module réutilisable qu'un agent peut appliquer. Une liste de règles et de patterns pour une tâche précise.
**Côté technique :** Fichiers dans `skills/` — `validate-contract.md`, `generate-migration.md`, `create-component.md`
**Ne pas confondre avec :** Un agent (qui a un rôle global) ou une doc (qui décrit l'architecture)

---

### Session
**Ce que c'est :** Une période de travail avec Claude Code. Commence quand tu ouvres Claude Code, finit quand tu le fermes. Peut durer 1h ou un weekend entier.
**Côté technique :** Entrée dans `context/SESSION_LOG.md` et mise à jour de `context/PRIMER.md`
**Ne pas confondre avec :** Une Room de jeu (qui est une session de JEU pour les joueurs)

---

*Nouveaux termes ajoutés par Claude Code au fil des sessions.*