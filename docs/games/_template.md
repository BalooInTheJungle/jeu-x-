# [NOM DU JEU] — Spec

> **Instructions :** Copie ce fichier, renomme-le `[GAME_ID].md`, remplis chaque section.
> Ce fichier est la référence pour l'agent `GAME_CREATOR` et pour `validate-contract`.

---

## 1. Concept
*(3 phrases max : ce que c'est, comment ça se joue, pourquoi c'est fun en soirée)*

---

## 2. Identifiant Technique

- **game_id :** `[snake_case]`
- **Nom affiché :** `[Nom Court]`
- **Durée estimée :** `[X-Y min]`
- **Joueurs :** `[min]` — `[max]`

---

## 3. Règles du Jeu

### Déroulement d'un round
*(Étape par étape — ce que voit le joueur, ce qu'il fait, ce qui se passe ensuite)*

### Scoring
*(Formule exacte avec des chiffres concrets)*

Exemple :
- Bonne réponse en < 5s → 100 pts
- Bonne réponse en < 10s → 70 pts
- Bonne réponse au-delà → 40 pts
- Mauvaise réponse ou pas de réponse → 0 pt

### Condition de victoire
*(Le joueur avec le plus de points à la fin des N rounds)*

### Cas limites

| Situation | Comportement |
|-----------|-------------|
| Personne ne répond avant la fin du timer | ... |
| Égalité de score final | ... |
| Un joueur se déconnecte en cours de partie | ... |
| Le host se déconnecte | ... |

---

## 4. Configuration (options du host)

| Option | Type | Valeurs possibles | Défaut | Description |
|--------|------|-------------------|--------|-------------|
| `totalRounds` | number | 5 — 20 | 10 | Nombre de rounds |
| ... | ... | ... | ... | ... |

---

## 5. Schéma de Données

### Tables SQL nécessaires

```sql
CREATE TABLE IF NOT EXISTS game_[id]_[nom] (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- colonnes spécifiques
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Structure de `roundData`

*(Ce que les joueurs voient — ne jamais inclure la réponse)*

```typescript
interface [GameId]RoundData extends RoundData {
  // ex: imageUrl, theme, hint...
}
```

### Structure du `payload` (action joueur)

```typescript
interface [GameId]ActionPayload {
  // ex: answer: string
}
```

---

## 6. Questions Ouvertes

*(Ce qui n'est pas encore décidé — max 3 items)*

---

## 7. Checklist de Compatibilité GameModule

- [ ] `initGame` faisable avec les infos disponibles ?
- [ ] `generateRound` faisable sans API externe bloquante ?
- [ ] `processAction` quasi-synchrone (< 200ms) ?
- [ ] `isRoundOver` déterministe, basé uniquement sur `state` ?
- [ ] Pas de dépendance à des services tiers hors stack du projet ?
