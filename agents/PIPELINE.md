# PIPELINE — Création d'un Nouveau Jeu (Multi-Agents)

> **Ce fichier est le point d'entrée unique pour créer un nouveau jeu.**
> Il orchestre 3 agents dans l'ordre, chacun spécialisé dans son domaine.
> Le dev humain n'intervient qu'une seule fois : valider la spec (Phase 2).
> Tout le reste est automatique.

---

## Vue d'Ensemble

```
[Dev] décrit son idée
        ↓
  PHASE 1 — INTAKE        Claude Code joue l'ORCHESTRATOR (5 questions)
        ↓
  PHASE 2 — SPEC          Spec générée → présentée au dev
        ↓
  [Dev] dit "valide" ← seule intervention humaine obligatoire
        ↓
  PHASE 3 — DESIGN        Agent DESIGN_AGENT spawné automatiquement
        ↓                  → produit docs/games/[id]_design.md
  PHASE 4 — DEV           Agent GAME_CREATOR spawné automatiquement
        ↓                  → produit les ~8 fichiers du jeu
  PHASE 5 — RAPPORT       Résumé livré au dev
```

**Principe de communication entre agents : les fichiers.**
Un agent écrit dans `docs/games/[id].md` (spec) ou `docs/games/[id]_design.md` (brief design).
L'agent suivant lit ces fichiers. Pas de passage de contexte en mémoire — tout passe par le disque.

---

## PHASE 1 — INTAKE

Claude Code pose exactement **5 questions**, dans l'ordre.
Il s'arrête si la réponse a déjà été donnée.

**Q1 — Le contenu**
> "Quel contenu les joueurs voient-ils pendant un round ?
> (image, texte, son, carte, dessin...) Y a-t-il des thèmes / catégories ?"

**Q2 — Le round**
> "Décris un round de A à Z :
> Que voit le joueur ? Que fait-il ? Comment ça se termine ?"

**Q3 — Le scoring**
> "Comment les points sont calculés ?
> La vitesse compte ? L'exactitude ? Les deux ? Donne des chiffres concrets."

**Q4 — La configuration**
> "Qu'est-ce que le host peut régler avant de lancer ?
> (rounds, thèmes, difficulté, durée...)"

**Q5 — Les cas limites**
> "Deux choses :
> - Personne ne répond avant la fin du timer → que se passe-t-il ?
> - Égalité de score final → comment on départage ?"

---

## PHASE 2 — SPEC

Une fois les 5 questions répondues, Claude Code génère la spec et la présente dans ce format :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SPEC — [Nom du Jeu]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Concept (3 phrases)
[...]

🔑 ID technique : [game_id]
👥 Joueurs : [min]–[max]  ⏱ Durée : [X–Y min]

📖 Un round en 4 étapes
1. [ce que le joueur voit]
2. [ce qu'il fait]
3. [comment ça se termine]
4. [ce qui s'affiche ensuite]

🏆 Scoring
[formule avec chiffres]

⚙️ Options du host
[liste]

🗄️ Données
[tables SQL + structure roundData]

⚠️ Points d'attention
[cas limites, risques]

✅ Compatibilité GameModule
- initGame       : ✅/⚠️
- generateRound  : ✅/⚠️
- processAction  : ✅/⚠️
- isRoundOver    : ✅/⚠️
- isGameOver     : ✅/⚠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valide cette spec ou dis-moi ce que tu veux changer.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Aucun code n'est écrit avant que le dev dise "valide", "go" ou similaire.**

---

## PHASE 3 — AGENT DESIGN (automatique après validation)

Claude Code spawne un **sous-agent** en lui passant ce prompt :

```
Tu es l'agent DESIGN_AGENT de Kclo Games.
Lis ces fichiers dans l'ordre :
1. agents/DESIGN_AGENT.md         ← tes instructions complètes
2. docs/DESIGN_SYSTEM.md          ← la DA de référence (obligatoire)
3. docs/games/[game-id].md        ← la spec validée du jeu

Produis le brief design complet dans : docs/games/[game-id]_design.md

Ne génère aucun code React. Uniquement le brief design.
```

Claude Code attend le retour de cet agent avant de continuer.

---

## PHASE 4 — AGENT DEV (automatique après design)

Claude Code spawne un **sous-agent** en lui passant ce prompt :

```
Tu es l'agent GAME_CREATOR de Kclo Games.
Lis ces fichiers dans l'ordre :
1. agents/GAME_CREATOR.md         ← tes instructions complètes
2. docs/GAME_CONTRACT.md          ← interface TypeScript obligatoire
3. docs/ARCHITECTURE.md           ← schéma BDD et flux de données
4. docs/DESIGN_SYSTEM.md          ← DA de référence pour l'UI
5. docs/games/[game-id].md        ← spec validée
6. docs/games/[game-id]_design.md ← brief design (couleurs, écrans, composants)
7. src/lib/games/eldu/index.ts    ← exemple de GameModule à imiter
8. src/components/games/eldu/GameView.tsx  ← exemple de GameView à imiter

Génère tous les fichiers du jeu [game-id] dans l'ordre défini dans GAME_CREATOR.md.
```

Claude Code attend le retour de cet agent avant de continuer.

---

## PHASE 5 — RAPPORT FINAL

Claude Code présente au dev :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Nom du Jeu] — Prêt à tester
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Fichiers créés ([N] fichiers)
  docs/games/[game-id].md
  docs/games/[game-id]_design.md
  supabase/migrations/[timestamp]_[game-id].sql
  src/types/games/[game-id].ts
  src/lib/games/[game-id]/index.ts
  src/components/games/[game-id]/GameView.tsx
  (+ autres si nécessaires)

📝 Fichiers mis à jour
  src/lib/games/registry.ts
  src/lib/games/theme.ts
  src/app/page.tsx
  src/components/platform/RoomLobby.tsx
  context/PRIMER.md

🗄️ 3 choses à faire manuellement
  1. Appliquer la migration SQL dans Supabase (dashboard → SQL Editor)
  2. npm run build (vérifie les erreurs TypeScript)
  3. Tester une partie complète en local

💾 Commit suggéré
  git add . && git commit -m "feat: add [game-id] game"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Règles de l'Orchestrateur

### Ce qu'il fait toujours
- Lire `context/PRIMER.md` et `docs/games/` avant l'intake (pour éviter un doublon)
- Vérifier que le jeu n'existe pas déjà dans le registre
- Mettre à jour `context/PRIMER.md` à la fin (section "Fait cette session")

### Ce qu'il ne fait jamais
- Générer du code avant la validation de la spec (Phase 2)
- Modifier `src/lib/platform/` pour accommoder un nouveau jeu
- Créer une table SQL sans le préfixe `game_{id}_`
- Passer en Phase 4 si le DESIGN_AGENT a signalé une erreur
