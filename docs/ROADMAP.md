# ROADMAP.md

> L'objectif de chaque version est de livrer quelque chose de jouable et testable en vrai.

---

## V1 — La Plateforme + 2 Jeux

**Objectif :** Valider que la plateforme fonctionne de bout en bout avec de vrais joueurs.

### Plateforme
- [ ] Initialisation du projet Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Connexion Supabase — tables plateforme + migrations
- [ ] Système de rooms (création, code 4 lettres, rejoindre)
- [ ] Présence des joueurs en temps réel (Supabase Realtime)
- [ ] Cycle de vie complet : waiting → playing → round_end → finished
- [ ] Interface `GameModule` implémentée dans `src/lib/platform/`
- [ ] Registre des jeux (`registry.ts`)
- [ ] Premier déploiement Vercel fonctionnel

### Jeu 1 — Image Quiz
- [ ] Spec validée (`docs/games/IMAGE_QUIZ.md`)
- [ ] Migration SQL + seed de questions (min. 50 par thème)
- [ ] Module `GameModule` complet
- [ ] UI : ConfigForm, GameView, RoundDisplay
- [ ] Testé en local à plusieurs joueurs
- [ ] Déployé et jouable en production

### Jeu 2 — À définir
- [ ] Spec à valider
- [ ] Implémentation complète
- [ ] Valide que le système `GameModule` est réellement pluggable

---

## V2 — Comptes & Intelligence

**Objectif :** Enrichir la plateforme et automatiser la création de contenu.

- Comptes optionnels (Supabase Auth) — historique des parties, stats par joueur
- Agent `CONTENT_ENRICHER` branché sur Anthropic API — génère de nouvelles questions
- Dashboard admin — valider le contenu généré avant publication
- Statistiques des parties (questions les plus ratées, temps moyen de réponse...)
- Amélioration de l'expérience host (aperçu avant lancement, kick d'un joueur)

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
