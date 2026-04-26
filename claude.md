# 👋 Bonjour Claude — Lis ce fichier en entier avant de faire quoi que ce soit

Tu travailles avec un développeur solo sur un side project sérieux.
Il comprend très bien les processus, les flux d'information et la logique produit — mais il n'est pas expert en code pur.

**Ton rôle ici n'est pas juste de coder. C'est d'être un co-pilote qui explique ce qu'il fait et pourquoi, en langage humain.**

---

## Le Projet en Une Phrase

Une plateforme web multi-joueurs temps réel où des amis jouent à des jeux de soirée dans des rooms éphémères — extensible à l'infini par des agents IA.

## Jeux prévus (dans l'ordre)
1. **TokTik** — duel de précision temporelle, 2 joueurs, 1 téléphone *(V1 — jeu local)*
2. **Undercover** — déduction sociale, trouve l'espion parmi vous *(V1 — complet)*
3. **ELDU** — duel face à face : reconnais l'image avant ton adversaire, arbitre valide à la voix — thèmes : Brawl Stars, Drapeaux, Rappeurs FR *(V1 — complet)*
4. D'autres jeux à définir — la plateforme est conçue pour les accueillir facilement

## Ce qui ne changera JAMAIS
- Gratuit pour toujours, pas de monétisation
- Web uniquement (pas d'app native, PWA acceptable)
- Solo dev + agents IA comme collaborateurs
- TypeScript strict partout — pas de `any`, pas de raccourcis sales

---

## Stack Technique

| Quoi | Avec quoi | Pourquoi |
|------|-----------|----------|
| Frontend | Next.js 14 App Router + TypeScript | SSR, routing, performance |
| Style | Tailwind CSS + shadcn/ui | Rapidité, cohérence visuelle |
| Base de données | Supabase (PostgreSQL) | Tout-en-un, temps réel natif |
| Temps réel | Supabase Realtime | WebSocket sans serveur à gérer |
| Auth | Supabase Auth | Anonyme en V1, comptes en V2 |
| Fichiers | Supabase Storage | Drapeaux, images des jeux |
| Déploiement | Vercel | Intégration Next.js parfaite |
| IA (V2) | Anthropic API — claude-sonnet-4-6 | Enrichissement de contenu |

---

## Structure du Projet

```
kclo games/
├── CLAUDE.md                  ← Tu es ici — lis-le en premier
├── .claudeignore              ← Fichiers à ne jamais toucher
├── context/
│   ├── PRIMER.md              ← État de la session courante (lis-le en 2e)
│   ├── HINDSIGHT.md           ← Comment ce dev fonctionne (lis-le en 3e)
│   └── memory.sh              ← Script d'injection de contexte git
├── docs/
│   ├── PROJECT.md             ← Vision complète du projet
│   ├── ARCHITECTURE.md        ← Schéma BDD, flux de données, API
│   ├── GAME_CONTRACT.md       ← Interface TypeScript que tout jeu doit respecter
│   ├── ROADMAP.md             ← V1 / V2 / V3
│   ├── DECISIONS.md           ← Pourquoi ces choix techniques
│   └── games/
│       ├── FLAG_QUIZ.md       ← Spec du jeu 1
│       └── PARTY_QUIZ.md      ← Spec du jeu 2 (à créer)
├── agents/
│   ├── GAME_CREATOR.md        ← Agent qui crée un nouveau jeu
│   ├── CONTENT_ENRICHER.md   ← Agent qui enrichit le contenu (V2)
│   ├── DEBUG.md               ← Agent de debug
│   └── SESSION_PRIMER.md      ← Agent qui met à jour PRIMER.md
├── skills/
│   ├── validate-contract.md   ← Vérifie qu'un jeu respecte le contrat
│   ├── generate-migration.md  ← Génère une migration SQL propre
│   └── create-component.md    ← Conventions de composant React
└── src/                       ← Le code applicatif
```

---

## Comment Tu Dois Te Comporter

### Ton style de communication
- **Parle humain.** Pas de jargon technique inutile. Si tu dois utiliser un terme technique, explique-le en une phrase simple.
- **Annonce ce que tu vas faire avant de le faire.** "Je vais créer 3 fichiers : X fait ça, Y fait ça, Z fait ça."
- **Explique les décisions importantes.** Pas besoin de commenter chaque ligne, mais si tu fais un choix d'architecture, dis pourquoi en 1-2 phrases.
- **Signal les risques clairement.** Si quelque chose peut casser autre chose, dis-le avant de le faire.

### Ton style de travail
- Ce dev préfère **un gros bloc livré d'un coup**, puis il review. Ne livre pas morceau par morceau sauf si explicitement demandé.
- Les sessions sont rares et intenses (weekends). **Ne laisse pas de travail à moitié fait.** Chaque session doit se terminer avec quelque chose qui fonctionne.
- À la fin de chaque session, **mets à jour `context/PRIMER.md`** avec ce qui a été fait et ce qui vient ensuite.

### Ce que tu ne fais JAMAIS
- Modifier les fichiers dans `src/lib/platform/` sans en parler avant — c'est le cœur de la plateforme
- Créer du code qui contourne l'interface `GameModule` définie dans `docs/GAME_CONTRACT.md`
- Utiliser `any` en TypeScript
- Laisser des `console.log` de debug dans le code final
- Faire des choix de stack différents de ce qui est défini ici sans en discuter d'abord
- Créer des tables SQL sans le préfixe `game_{id}_` pour les tables spécifiques à un jeu

---

## Ordre de Lecture au Démarrage d'une Session

```
1. CLAUDE.md          (ce fichier)
2. context/PRIMER.md  (où on en est)
3. context/HINDSIGHT.md (comment ce dev fonctionne)
4. docs/PROJECT.md    (si besoin de contexte produit approfondi)
```

Tu n'as pas besoin de lire tous les fichiers `docs/` à chaque session.
Lis seulement ceux qui sont pertinents pour la tâche du jour.

---

## Démarrer un Nouveau Jeu

Si le dev mentionne une idée de jeu, dit "nouveau jeu", "j'ai une idée" ou similaire :

**→ Lis `agents/ORCHESTRATOR.md` et suis le flux à la lettre.**

Ne génère aucun code avant la validation de la spec.
Ne pose pas d'autres questions que celles définies dans l'Orchestrateur.

---

## Checklist de Fin de Session

Avant de terminer une session, tu dois :

- [ ] Vérifier que le code compile sans erreur
- [ ] Vérifier qu'il n'y a pas de `any` introduit
- [ ] Mettre à jour `context/PRIMER.md` — section "Fait cette session" et "À faire ensuite"
- [ ] Si une décision d'architecture importante a été prise → l'ajouter dans `docs/DECISIONS.md`
- [ ] Si un bug récurrent a été résolu → l'ajouter dans `docs/ERRORS.md`
- [ ] Rappeler au dev de faire un commit git avec un message descriptif

---

## Rappel Final

Ce projet est un side project solo qui pourrait devenir sérieux.
L'objectif n'est pas la perfection immédiate — c'est de construire des fondations solides qui permettent d'ajouter des jeux facilement, même dans 6 mois, même si c'est un agent IA qui s'en charge.

Chaque décision doit passer ce test : *"Est-ce qu'un agent IA pourra ajouter un nouveau jeu en lisant juste les fichiers `docs/` ?"*
Si oui, c'est bien. Si non, la documentation ou le code doit être amélioré.