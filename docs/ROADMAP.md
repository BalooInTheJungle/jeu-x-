# ROADMAP.md

> L'objectif de chaque version est de livrer quelque chose de jouable et testable en vrai.

---

## V1 — La Plateforme + 2 Jeux Multijoueurs

**Objectif :** Valider que la plateforme fonctionne de bout en bout avec de vrais joueurs.

### Plateforme ✅ COMPLÈTE
- [x] Initialisation du projet Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [x] Connexion Supabase — tables plateforme + migrations
- [x] Système de rooms (création, code 4 lettres, rejoindre)
- [x] Présence des joueurs en temps réel (Supabase Realtime)
- [x] Interface `GameModule` implémentée dans `src/lib/platform/`
- [x] Registre des jeux (`registry.ts`)
- [x] Premier déploiement Vercel fonctionnel
- [x] Page d'accueil avec cartes des jeux disponibles
- [x] `rooms/new?game=` — création de room avec jeu présélectionné
- [x] `POST /api/rooms/[code]/reset` — relance une manche dans la même room

### Jeu 1 — TokTik ✅ COMPLET
Jeu local, pas de rooms. 2 joueurs, 1 téléphone, duel de précision temporelle.
- [x] Logique pure (`src/lib/games/toktik/logic.ts`)
- [x] UI complète avec machine d'états
- [x] Mode séquentiel + mode simultané (split screen)
- [x] Setup paramétrable (couleur, rounds, difficulté, mode)

### Jeu 2 — Undercover ✅ COMPLET
Jeu multijoueurs (3-10 joueurs) de déduction sociale.
- [x] Spec validée (`docs/games/UNDERCOVER.md`)
- [x] Migration SQL + seed 29 paires de mots (général, One Piece, Brawl Stars)
- [x] Génération de mots via Claude Haiku + fallback DB
- [x] Rôles : civil, undercover, mr_white (assignés aléatoirement)
- [x] Phases : description → vote → (guess) → finished
- [x] Sécurité : rôles privés server-side, jamais exposés au client
- [x] UI complète avec avatars colorés, animations, écran de fin
- [x] Config host : thème, Mr. White, mode spectateur, mots personnalisés
- [x] Relance de manche dans la même room
- [x] Testé en conditions réelles à 3 joueurs ✅

### Jeu 3 — Image Quiz 🔲 PROCHAIN
Premier jeu avec questions multijoueurs synchronisées.
- [ ] Spec validée (`docs/games/IMAGE_QUIZ.md`)
- [ ] Migration SQL + seed de questions (min. 50 par thème)
- [ ] Module `GameModule` complet (utilise le game-engine générique)
- [ ] UI : ConfigForm, GameView, RoundDisplay, écran de résultats
- [ ] Testé en local à plusieurs joueurs
- [ ] Déployé et jouable en production

---

## V2 — Comptes & Intelligence

**Objectif :** Enrichir la plateforme et automatiser la création de contenu.

- Comptes optionnels (Supabase Auth) — historique des parties, stats par joueur
- Agent `CONTENT_ENRICHER` branché sur Anthropic API — génère de nouvelles questions
- Dashboard admin — valider le contenu généré avant publication
- Statistiques des parties (questions les plus ratées, temps moyen de réponse...)
- Amélioration de l'expérience host (aperçu avant lancement, kick d'un joueur)
- Nouveaux thèmes pour Undercover (générés par IA)

---

## V3 — Ouverture

**Objectif :** Permettre à la communauté de contribuer.

- API publique pour soumettre des jeux ou des questions
- Mode spectateur (voir une partie sans y jouer)
- Thèmes visuels par jeu
- Système de saisons / événements thématiques
- PWA — jouable hors-ligne pour certains jeux

---

## Ce Qui Ne Sera Jamais Fait

- App native iOS/Android
- Monétisation (pub, premium, microtransactions)
- Serveur backend custom (on reste sur Vercel + Supabase)
