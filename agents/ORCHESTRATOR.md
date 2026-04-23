# 🎮 ORCHESTRATOR — Créer un Nouveau Jeu Automatiquement

> **Déclencheur :** Dis n'importe laquelle de ces phrases et l'orchestrateur démarre.
> - "J'ai une idée de jeu"
> - "Nouveau jeu :"
> - "Je veux ajouter un jeu"
> - Ou décris simplement ton idée sans formule particulière
>
> **Ce que tu dois faire :** Décrire ton idée + répondre aux questions + valider la spec.
> **Ce que tu ne dois PAS faire :** Tout le reste. L'orchestrateur s'en charge.

---

## Vue d'Ensemble du Flux

```
[Toi] Idée de jeu
       ↓
  PHASE 1 — Intake        (~5 min de conversation)
       ↓
  PHASE 2 — Spec          (généré automatiquement, tu valides)
       ↓
  [Toi] "Valide" / corrections
       ↓
  PHASE 3 — Exécution     (tout automatique, tu attends)
    ├── Code complet
    ├── Migration SQL + seed
    ├── Documentation mise à jour
    └── Validation contract
       ↓
  PHASE 4 — Rapport final  (tu n'as plus qu'à tester)
```

---

## PHASE 1 — Intake

### Étape 1A : Écoute libre

Quand le déclencheur est détecté, l'orchestrateur répond :

```
🎮 Super, parlons-moi de ce jeu.
Décris-le comme tu le présenterais à un ami — pas besoin de format particulier.
```

Il laisse le dev parler librement. Il écoute sans interrompre.

### Étape 1B : Questions de clarification

Après la description libre, il pose **exactement ces 5 questions**, une par une, dans cet ordre.
Il s'arrête si la réponse a déjà été donnée dans la description libre.

---

**Question 1 — Le contenu**
> "Quel type de contenu les joueurs voient-ils pendant un round ?
> (image, texte, son, carte, dessin, vidéo...)
> Et est-ce qu'il y a des thèmes / catégories ?"

---

**Question 2 — Le round**
> "Décris-moi un round de A à Z :
> Qu'est-ce que le joueur voit ? Qu'est-ce qu'il fait ? Comment ça se termine ?"

---

**Question 3 — Le scoring**
> "Comment les points sont calculés ?
> Est-ce que la vitesse compte ? L'exactitude ? Les deux ?
> Donne-moi des chiffres concrets si tu en as."

---

**Question 4 — La configuration**
> "Qu'est-ce que le host peut régler avant de lancer la partie ?
> (nombre de rounds, thèmes, difficulté, durée par round...)"

---

**Question 5 — Les cas limites**
> "Deux dernières choses :
> - Que se passe-t-il si personne ne répond avant la fin du timer ?
> - En cas d'égalité de score final, comment on départage ?"

---

### Ce Que L'Orchestrateur Fait Pendant L'Intake

En parallèle des échanges, il lit silencieusement :
1. `docs/GAME_CONTRACT.md` — pour vérifier la faisabilité
2. `docs/ARCHITECTURE.md` — pour anticiper le schéma SQL
3. `docs/games/` — pour éviter de créer un jeu qui existe déjà
4. `context/PRIMER.md` — pour connaître l'état du projet

---

## PHASE 2 — Génération de la Spec

Une fois les 5 questions répondues, l'orchestrateur génère la spec complète **sans demander d'autres informations**.

Il utilise le template `docs/games/_template.md` et produit `docs/games/[GAME_ID].md`.

### Format de présentation de la spec

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SPEC — [Nom du Jeu]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Concept
[3 phrases max]

🔑 ID technique : [game_id]
👥 Joueurs : [min]-[max] — ⏱ Durée : [X-Y min]

📖 Un round en 4 étapes
1. [ce que le joueur voit]
2. [ce qu'il fait]
3. [comment ça se termine]
4. [ce qui s'affiche ensuite]

🏆 Scoring
[formule exacte avec chiffres]

⚙️ Options du host
[liste des options configurables]

🗄️ Données
[tables SQL nécessaires + structure roundData]

⚠️ Points d'attention
[ce qui pourrait poser problème, les cas limites]

✅ Compatibilité GameModule
[checklist des 5 points — tous doivent être ✅]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valide cette spec ou dis-moi ce que tu veux changer.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Validation

Le dev dit "valide", "go", "c'est bon" ou similaire → Phase 3 démarre.
Le dev fait des corrections → l'orchestrateur met à jour la spec et re-présente le résumé.

**Aucun code n'est écrit avant cette validation.**

---

## PHASE 3 — Exécution Automatique

Le dev a validé. L'orchestrateur exécute tout dans l'ordre suivant, **sans interaction**.

### Étape 3.1 — Documentation

```
docs/games/[GAME_ID].md        ← spec validée, mise en forme propre
docs/ROADMAP.md                ← ajout du jeu dans la section V1 ou V2
context/PRIMER.md              ← ajout "jeu [X] en cours de création"
```

### Étape 3.2 — Base de données

```
supabase/migrations/[YYYYMMDD]_[game_id]_initial.sql
```

Contient :
- `CREATE TABLE IF NOT EXISTS game_[id]_[nom]`
- Index sur les colonnes filtrées
- RLS activé + policy SELECT
- Seed de développement (minimum 20 entrées réalistes)

Respecte les règles de `skills/generate-migration.md`.

### Étape 3.3 — Types TypeScript

```
src/types/games/[game-id].ts
```

Contient :
- Interface `[GameId]RoundData extends RoundData`
- Interface `[GameId]ActionPayload`
- Interface `[GameId]Config`
- Tout est explicitement typé, zéro `any`

### Étape 3.4 — Module du jeu

```
src/lib/games/[game-id]/index.ts      ← GameModule complet
src/lib/games/[game-id]/generator.ts  ← logique de génération des rounds
```

Respecte exactement l'interface `GameModule` de `docs/GAME_CONTRACT.md`.

### Étape 3.5 — Composants UI

```
src/components/games/[game-id]/ConfigForm.tsx    ← config avant la partie
src/components/games/[game-id]/GameView.tsx       ← vue principale du jeu
src/components/games/[game-id]/RoundDisplay.tsx   ← affichage d'un round
```

Respecte les règles de `skills/create-component.md`.

### Étape 3.6 — Page de présentation

```
src/app/games/[game-id]/page.tsx
```

Nom, description, règles résumées, bouton "Créer une partie".

### Étape 3.7 — Registre

```
src/lib/games/registry.ts    ← ajout du nouveau module
```

### Étape 3.8 — Validation automatique

L'orchestrateur applique `skills/validate-contract.md` sur le jeu généré.

Si ✅ tout est bon → Phase 4.
Si ❌ un point échoue → l'orchestrateur corrige **lui-même** et re-valide. Maximum 2 tentatives.
Si toujours ❌ après 2 tentatives → il signale le problème précisément avant de continuer.

---

## PHASE 4 — Rapport Final

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Nom du Jeu] — Prêt à tester
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Fichiers créés ([N] fichiers)
  docs/games/[GAME_ID].md
  supabase/migrations/[timestamp]_[game_id]_initial.sql
  src/types/games/[game-id].ts
  src/lib/games/[game-id]/index.ts
  src/lib/games/[game-id]/generator.ts
  src/components/games/[game-id]/ConfigForm.tsx
  src/components/games/[game-id]/GameView.tsx
  src/components/games/[game-id]/RoundDisplay.tsx
  src/app/games/[game-id]/page.tsx

📝 Fichiers mis à jour
  src/lib/games/registry.ts
  docs/ROADMAP.md
  context/PRIMER.md

✅ validate-contract : [résultat]

🗄️ 3 choses à faire manuellement
  1. npx supabase db push
     (applique la migration SQL)
  2. npm run build
     (vérifie qu'il n'y a pas d'erreur TypeScript)
  3. Tester une partie complète en local avec 2 onglets

💾 Commit suggéré
  git add .
  git commit -m "feat: add [game-id] game"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Règles Absolues de l'Orchestrateur

### À faire
- Lire les 4 fichiers de contexte avant de commencer
- Poser les 5 questions dans l'ordre, s'arrêter si déjà répondu
- Ne jamais écrire de code avant la validation de la spec
- Respecter `GAME_CONTRACT.md` à la lettre — c'est la loi
- Mettre à jour `PRIMER.md` et `ROADMAP.md` automatiquement

### À ne jamais faire
- Modifier `src/lib/platform/` pour accommoder un jeu
- Créer une table sans le préfixe `game_{id}_`
- Utiliser `any` en TypeScript
- Passer en Phase 3 sans validation explicite du dev
- Générer un jeu similaire à un jeu déjà existant sans le signaler

---

## Exemple de Session Type

```
Dev : "J'ai une idée de jeu, un truc où on doit deviner une chanson"

Orchestrateur : "Super, parlons-moi de ce jeu. Décris-le comme tu le
                 présenterais à un ami."

Dev : "On entend 10 secondes d'une chanson et on doit deviner le titre
       et l'artiste. Plus on répond vite, plus on gagne de points."

Orchestrateur : "Sympa ! Quelques questions pour compléter :
                 Les thèmes — est-ce qu'il y a des catégories ?
                 (années 80, rap français, jeux vidéo...)"

Dev : "Oui, le host choisit le thème parmi une liste."

Orchestrateur : [Question 2, 3, 4, 5...]

...

Orchestrateur : [Présente la spec complète]
                "Valide cette spec ou dis-moi ce que tu veux changer."

Dev : "Valide"

Orchestrateur : [Phase 3 — génère tout automatiquement]
                [Phase 4 — rapport final]
```
