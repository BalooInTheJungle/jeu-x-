# 🔍 HINDSIGHT — Ce Qui Aide À Mieux Travailler

> **Ce fichier est mis à jour automatiquement par Claude Code en fin de session.**
> Il capture tout ce qui peut améliorer la prochaine session : ce qui a bloqué,
> ce qui a bien marché, les patterns qui se répètent, les préférences découvertes.
>
> Claude Code lit ce fichier au démarrage pour adapter son comportement immédiatement.

---

## 👤 Profil de Travail (stable — mis à jour rarement)

### Comment ce dev fonctionne
- **Rythme :** Sessions intenses le weekend, pas de dev en semaine
- **Niveau code :** Comprend les processus et flux d'information, pas expert en code pur
- **Mode préféré :** Recevoir un gros bloc de travail livré d'un coup, puis reviewer
- **Communication :** A besoin d'explications humaines, pas de jargon technique
- **Décisions :** Valide toujours la spec/plan avant que le code soit écrit

### Ce qui le met en confiance
- Voir une vue d'ensemble claire avant de rentrer dans les détails
- Comprendre *pourquoi* une décision est prise, pas juste *quoi*
- Avoir des étapes concrètes et dans l'ordre
- Savoir exactement où en est le projet au démarrage d'une session

### Ce qui le frustre
- Devoir recommencer le contexte depuis zéro à chaque session
- Du code qui marche mais qu'il ne comprend pas du tout
- Des décisions techniques prises sans explication
- Laisser une session avec quelque chose de cassé

---

## 📚 Patterns Appris par Session

> Claude Code ajoute une entrée ici à chaque fin de session.
> Format : date + ce qui a été appris sur la façon de travailler.

---

### Session d'initialisation — [Date à remplir]

**Ce qui s'est passé :**
Création de toute la documentation de référence avant d'écrire une ligne de code.

**Ce qui a bien marché :**
- Approche "docs d'abord" — permet aux agents de travailler de façon autonome
- Questions structurées pour comprendre le profil avant de générer les fichiers

**À retenir pour les prochaines sessions :**
- Ce dev pense en termes de produit et de processus, pas en termes de code
- Il faut toujours commencer par expliquer ce qu'on va faire, puis le faire
- Les gros commits en fin de session = il faut lui rappeler de commiter avant de fermer

**Aucun blocage technique cette session.**

---

<!-- TEMPLATE pour Claude Code — copier-coller à chaque fin de session

### Session du [DATE]

**Objectif de la session :** [ce qui était prévu]
**Ce qui a été livré :** [ce qui a réellement été fait]

**Ce qui a bien marché :**
- [item 1]
- [item 2]

**Ce qui a bloqué ou pris plus de temps que prévu :**
- [item 1 — et pourquoi]
- [item 2 — et pourquoi]

**Ajustements à faire pour la prochaine session :**
- [comment adapter le comportement de Claude Code]
- [quels fichiers docs/ mettre à jour]

**Erreurs commises à ne pas répéter :**
- [item 1]

**Ce que ce dev a semblé apprécier particulièrement :**
- [item 1]

-->

---

## 🔄 Règles Évolutives

> Ces règles sont mises à jour quand un pattern se répète 2+ fois.
> Elles priment sur les règles générales de CLAUDE.md pour ce dev spécifiquement.

### Règles actives

| # | Règle | Origine |
|---|-------|---------|
| 1 | Toujours annoncer le plan complet avant de coder | Profil initial |
| 2 | Livrer en un seul bloc, pas en morceaux | Profil initial |
| 3 | Rappeler de commiter en fin de session | Habitude gros commits |
| 4 | Expliquer les termes techniques en une phrase simple quand utilisés | Profil initial |
| 5 | Valider la spec avec le dev avant d'écrire le code d'un nouveau jeu | Préférence GAME_CREATOR |

### Règles en observation
*(Patterns vus 1 fois — pas encore confirmés)*

*(Aucun pour l'instant — sera rempli après les premières sessions)*

---

## ⚡ Raccourcis Découverts

> Ce que ce dev demande souvent → formulation qu'il préfère.

| Ce qu'il demande | Comment l'interpréter |
|------------------|-----------------------|
| "Explique-moi ce truc" | Analogie simple + schéma en ASCII si possible |
| "C'est quoi la prochaine étape" | Liste ordonnée, max 5 items, avec le plus urgent en premier |
| "On reprend où on en était" | Lire PRIMER.md + résumer en 3 bullets ce qui est fait/en cours/bloqué |
| "Fais-moi un récap" | Vue d'ensemble courte, pas de détails techniques, focus produit |

---

## 🚨 Erreurs À Ne Jamais Répéter

> Choses qui ont mal tourné et qu'il ne faut pas refaire.

*(Sera rempli après les premières sessions de dev)*

---

## 💡 Instructions Pour Claude Code — Mise À Jour De Ce Fichier

**En fin de chaque session, tu dois :**

1. Copier le template ci-dessus (section commentée)
2. Le remplir honnêtement avec ce qui s'est passé
3. Si un pattern se répète → l'ajouter dans "Règles Évolutives"
4. Si une erreur a été commise → l'ajouter dans "Erreurs À Ne Jamais Répéter"
5. Ne jamais supprimer les entrées précédentes — ce fichier est un journal

**Format de date :** JJ/MM/AAAA
**Ton à utiliser :** Factuel et utile, pas de langue de bois