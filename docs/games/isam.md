# ISAM — Spec

---

## 1. Concept

Duel 1v1 en 2 manches. Manche 1 : J1 répond à N questions librement, puis J2 essaie de deviner chaque réponse de J1 une par une (résultat révélé immédiatement après chaque devinage). Manche 2 : J2 répond à N nouvelles questions, J1 devine. Un LLM évalue chaque prédiction sémantiquement (+1 point si proche). Celui qui devine le mieux l'autre gagne.

---

## 2. Identifiant Technique

- **game_id :** `isam`
- **Nom affiché :** `ISAM`
- **Durée estimée :** `5–10 min`
- **Joueurs :** `2` — `2`

---

## 3. Règles du Jeu

### Structure générale

Le jeu se déroule en **2 manches séquentielles**. Chaque manche a son propre set de questions (même thème, questions différentes).

```
MANCHE 1
  J1 répond à Q1 → Q2 → ... → QN  (J2 attend)
  J2 devine Q1  → résultat → Q2 → résultat → ... → QN → résultat
  ─── CLASSEMENT INTERMÉDIAIRE ───

MANCHE 2  
  J2 répond à Q1 → Q2 → ... → QN  (J1 attend)
  J1 devine Q1  → résultat → Q2 → résultat → ... → QN → résultat
  ─── CLASSEMENT FINAL ───
```

### Sous-phases de la machine d'états

| Sous-phase | Qui agit | Ce qui se passe |
|------------|----------|-----------------|
| `m1_answer` | J1 | Répond librement aux questions une par une (J2 attend) |
| `m1_guess` | J2 | Devine la réponse de J1 à chaque question |
| `m1_reveal` | Personne (auto) | Résultat affiché 3,5s : prédiction vs vraie réponse, ✅/❌ |
| `mid_ranking` | Personne (auto) | Classement intermédiaire affiché 6s |
| `m2_answer` | J2 | Répond librement aux nouvelles questions (J1 attend) |
| `m2_guess` | J1 | Devine la réponse de J2 |
| `m2_reveal` | Personne (auto) | Résultat affiché 3,5s |
| `finished` | — | Classement final |

### Déroulement détaillé

**Phase réponse (m1_answer / m2_answer) :**
1. Le joueur actif voit la question + image + champ texte + timer
2. Il tape sa réponse et valide (ou timeout → réponse vide `"—"`)
3. Sa réponse est stockée côté serveur — **jamais visible par l'adversaire avant la révélation**
4. Avance à la question suivante jusqu'à QN, puis passe en phase devinage

**Phase devinage (m1_guess / m2_guess) :**
1. Le devineur voit la question + image + champ texte + timer
2. Il tape ce qu'il pense que l'autre a répondu
3. Validation → appel Claude Haiku pour évaluation sémantique (~1–2s)
4. Passe immédiatement en `m1_reveal` / `m2_reveal`

**Phase révélation (m1_reveal / m2_reveal) :**
1. Les deux joueurs voient : question, prédiction du devineur, vraie réponse, ✅ ou ❌
2. Auto-avance après **3,5 secondes** (les deux clients envoient `{ advance: true }`, premier arrivé avance l'état)
3. Retour en phase devinage pour la question suivante, OU passe à `mid_ranking`

**Classement intermédiaire (mid_ranking) :**
1. Score de J2 (X/N correct), liste de toutes les questions avec résultats
2. Auto-avance après **6 secondes** → manche 2

### Scoring

- **Phase réponse** : 0 point — aucune évaluation
- **Phase devinage** : +1 pt si prédiction sémantiquement proche (LLM), sinon +0
- **Prédiction vide** : 0 pt automatique, sans appel LLM
- **Score final** : points gagnés en phase devinage uniquement
  - J2 peut marquer max N points (en devinant J1 — manche 1)
  - J1 peut marquer max N points (en devinant J2 — manche 2)

### Condition de victoire

Le joueur avec le plus de points à la fin des 2 manches gagne. En cas d'égalité : match nul.

### Cas limites

| Situation | Comportement |
|-----------|-------------|
| Timeout réponse | Réponse `"—"` enregistrée, passage question suivante |
| Prédiction vide | 0 pt, pas d'appel LLM |
| Appel LLM échoue | Fallback comparaison exacte (lowercase + trim) |
| Double advance (race condition) | Le second `advance` reçoit `{ ok: true, skipped: true }` — idempotent |
| Égalité finale | Match nul affiché |

---

## 4. Configuration (options du host)

| Option | Type | Valeurs possibles | Défaut | Description |
|--------|------|-------------------|--------|-------------|
| `theme` | select | `brawl_stars`, `lifestyle`, `mix` | `mix` | Thème des questions |
| `answerDuration` | number | 30 — 120 | 60 | Timer de réponse/devinage (secondes) |
| `questionCount` | number | 3 — 10 | 5 | Nombre de questions par manche |

---

## 5. Schéma de Données

### Tables SQL

```sql
CREATE TABLE IF NOT EXISTS game_isam_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme         TEXT NOT NULL CHECK (theme IN ('brawl_stars', 'lifestyle')),
  image_url     TEXT,          -- image illustrative de la question (optionnelle)
  question_text TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Sources d'images :**
- Brawl Stars : portrait du brawler concerné via `https://cdn.brawlapi.cf/brawlers/{name}.png`
- Lifestyle : photos thématiques via `https://picsum.photos/seed/{theme_seed}/400/300`

### État du jeu — `IsamState`

```typescript
interface IsamState extends GameState {
  subPhase: IsamSubPhase      // sous-phase courante
  questionIndex: number        // 0-based, question courante dans la sous-phase
  questionCount: number        // nombre de questions par manche

  manche1Questions: IsamQuestion[]  // set J1 (chargé au démarrage)
  manche2Questions: IsamQuestion[]  // set J2 (différent, même thème)

  player1Id: string             // répond en manche 1, devine en manche 2
  player2Id: string             // devine en manche 1, répond en manche 2
  activePlayerId: string

  manche1Answers: string[]      // réponses de J1 (invisibles par J2 jusqu'à reveal)
  manche2Answers: string[]      // réponses de J2 (invisibles par J1 jusqu'à reveal)

  manche1Results: IsamResult[]  // résultats des devinages de J2 sur J1
  manche2Results: IsamResult[]  // résultats des devinages de J1 sur J2

  questionDeadline: string      // ISO 8601 — deadline réponse/devinage courant
  phaseDeadline?: string        // ISO 8601 — deadline auto-avance (reveal / ranking)
}

interface IsamResult {
  questionText: string
  imageUrl: string | null
  prediction: string
  realAnswer: string
  isCorrect: boolean
}
```

### Structure de `roundData` (visible par les joueurs)

```typescript
interface IsamRoundData extends RoundData {
  subPhase: IsamSubPhase
  questionIndex: number
  questionCount: number
  player1Id: string
  player2Id: string
  activePlayerId: string
  scores: Record<string, number>

  // Phases réponse et devinage
  question?: { id: string; theme: string; imageUrl: string | null; questionText: string }
  questionDeadline?: string

  // Phases reveal
  reveal?: {
    questionText: string
    imageUrl: string | null
    prediction: string
    realAnswer: string
    isCorrect: boolean
  }

  // Phases ranking
  manche1Results?: IsamResult[]
  manche2Results?: IsamResult[]

  phaseDeadline?: string  // deadline auto-avance
}
```

### Structure du `payload` (action joueur)

```typescript
interface IsamActionPayload {
  answer?: string    // réponse libre ou prédiction
  advance?: boolean  // true pour les auto-avances client-side
}
```

---

## 6. Architecture de la Route `/action`

La route `/action` gère toute la machine d'états. Elle est appelée :
- Par le joueur actif pour soumettre une réponse/prédiction
- Par **les deux clients** après `phaseDeadline` pour les auto-avances (idempotent)

```
POST /api/rooms/[code]/isam/action
  { playerId, answer }  → m1_answer, m1_guess, m2_answer, m2_guess
  { playerId, advance: true } → m1_reveal, mid_ranking, m2_reveal
```

**Transitions d'état :**

```
m1_answer (J1 soumet réponse Q[i])
  → i+1 < N : rester en m1_answer, questionIndex++
  → i+1 >= N : passer en m1_guess, questionIndex=0, activePlayer=J2

m1_guess (J2 soumet prédiction Q[i])
  → évaluation LLM → stocker résultat → score J2++
  → passer en m1_reveal, phaseDeadline=now+3.5s

m1_reveal (auto-avance après phaseDeadline)
  → i+1 < N : passer en m1_guess, questionIndex++
  → i+1 >= N : passer en mid_ranking, phaseDeadline=now+6s

mid_ranking (auto-avance)
  → passer en m2_answer, questionIndex=0, activePlayer=J2

[même logique pour m2_answer / m2_guess / m2_reveal]

m2_reveal (dernière question)
  → status='finished'
```

**Évaluation LLM :**
- Modèle : `claude-haiku-4-5-20251001` (rapide, peu coûteux)
- Prompt : `"La prédiction '{X}' est-elle sémantiquement proche de la réponse '{Y}' ? Réponds uniquement par 'oui' ou 'non'."`
- Fallback si erreur : comparaison exacte (lowercase, trim)
- Shortcut : si prédiction === réponse (exact) → `true` sans appel API

---

## 7. Checklist de Compatibilité GameModule

- [x] `initGame` : assigne J1/J2, init state vide (questions chargées dans la route `/start`)
- [x] `generateRound` : no-op (questions pré-chargées dans le state)
- [x] `processAction` : validation de base, l'éval LLM est dans la route `/action`
- [x] `isRoundOver` : `answeredPlayers.includes(activePlayerId)` OU `questionDeadline` dépassée
- [x] `isGameOver` : `state.status === 'finished'`
- [⚠️] Appel LLM dans route `/action` ≈ 1–2s de latence — acceptable pour ce jeu
- [⚠️] Double appel auto-avance (race condition) géré par idempotence côté serveur
