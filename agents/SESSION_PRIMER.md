# 🔄 SESSION_PRIMER — Gestion Automatique du PRIMER

> **Ce n'est pas un agent séparé à appeler — c'est un comportement intégré.**
> Claude Code l'applique automatiquement à chaque session, sans que tu aies à le demander.
> Ce fichier documente exactement ce qui se passe et quand.

---

## Pourquoi Ce Comportement Existe

Tu travailles en sessions intenses mais rares (weekends).
Entre deux sessions, tu oublies où tu en étais.
Le but : zéro friction au démarrage, zéro travail perdu en fin de session.

---

## Ce Qui Se Passe Automatiquement

### ▶️ Au Démarrage de Chaque Session

Claude Code fait ça dans les 2 premières minutes, avant de toucher au code :

**1. Lit les fichiers de contexte dans l'ordre**
```
CLAUDE.md → context/PRIMER.md → context/HINDSIGHT.md
```

**2. Produit un briefing de démarrage**
Format fixe, toujours le même — tu sais exactement où regarder :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 PARTY PLATFORM — Démarrage de session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 OÙ ON EN EST
[2-3 bullets résumant l'état du projet en langage simple]

✅ FAIT (session précédente)
[Ce qui a été terminé]

🔨 EN COURS
[Ce qui était commencé mais pas fini]

🚧 BLOCAGES CONNUS
[Ce qui pourrait poser problème aujourd'hui]

🎯 OBJECTIF DE CETTE SESSION
[Ce qu'on devrait avoir livré à la fin]

❓ UNE QUESTION AVANT DE COMMENCER
[Si quelque chose manque pour démarrer — sinon cette section n'apparaît pas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prêt. Dis-moi sur quoi on attaque.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**3. Attend ta confirmation avant de coder**
Claude ne commence pas à générer du code sans que tu aies validé le briefing
ou dit "go", "c'est bon", "on y va" ou similaire.

---

### ⏸️ En Cours de Session (si session > 2h)

Si une session dure plus de 2h, Claude propose un checkpoint :

```
⏱️ On est sur cette session depuis un moment.
Petit point rapide :
- Fait depuis le début : [liste]
- En cours : [liste]
- Il reste : [liste]
Tu veux continuer sur [X] ou changer de priorité ?
```

---

### ⏹️ En Fin de Session

Quand tu dis "c'est bon pour aujourd'hui", "on s'arrête là", "à la prochaine" ou similaire,
Claude fait automatiquement ces 4 choses avant de te laisser partir :

**1. Met à jour context/PRIMER.md**
- Coche les items terminés
- Déplace ce qui est en cours dans la bonne section
- Met à jour "À faire — session suivante" avec les priorités dans l'ordre

**2. Met à jour context/HINDSIGHT.md**
- Ajoute l'entrée de session avec ce qui a bien marché / bloqué
- Met à jour les règles évolutives si un pattern a été observé

**3. Affiche le commit suggéré**
```
💾 Pense à commiter avant de fermer :

git add .
git commit -m "[type]: [description courte]"
git push origin main

Types disponibles : feat / fix / docs / refactor / chore
Exemple : git commit -m "feat: add flag-quiz game module"
```

**4. Affiche le résumé de fin**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SESSION TERMINÉE

Livré aujourd'hui : [liste]
À reprendre la prochaine fois : [liste]
Durée estimée prochaine session : [estimation]

PRIMER.md et HINDSIGHT.md mis à jour.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Ce Que Tu N'As Pas À Faire

- ❌ Rappeler à Claude de mettre à jour PRIMER.md
- ❌ Rappeler à Claude de mettre à jour HINDSIGHT.md
- ❌ Réexpliquer le contexte du projet à chaque session
- ❌ Te souvenir où tu en étais

## Ce Que Tu Dois Faire

- ✅ Lancer `memory.sh` avant Claude Code (ou via l'alias)
- ✅ Valider le briefing de démarrage
- ✅ Dire clairement quand la session est terminée
- ✅ Faire le commit git suggéré avant de fermer

---

## Si Le Contexte Est Flou Au Démarrage

Si PRIMER.md n'est pas à jour ou que la situation n'est pas claire,
Claude pose UNE seule question :

> "Je vois que [situation floue]. Pour bien démarrer : [question précise] ?"

Jamais plus d'une question au démarrage. Si c'est vraiment flou, il fait une hypothèse
raisonnable et te la soumet plutôt que de bloquer.