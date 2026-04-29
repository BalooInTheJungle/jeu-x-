=== FICHIER: docs/games/isam_design.md ===
# ISAM — Brief Design Complet

> **Fichier produit par DESIGN_AGENT**
> Destinataire : GAME_CREATOR (agent DEV)
> Jeu : ISAM — duel 1v1 de connaissance mutuelle
> Référence DA : `docs/DESIGN_SYSTEM.md`

---

## Section 1 — Thème du Jeu

ISAM est un duel intime entre deux joueurs qui se connaissent (ou pensent se connaître). L'identité visuelle doit évoquer la connexion humaine, la confidence, la complicité — teinte rose/fuchsia, chaleur émotionnelle.

Gradient choisi : **Rose** (deuxième gradient "Nouveaux jeux" de la palette DA)

```typescript
// À ajouter dans src/lib/games/theme.ts
isam: {
  gradient: 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)',
  primary: '#C2185B',
  light: '#F48FB1',
  emoji: '🫀',
  floatAnimation: 'float',
  badge: '2 joueurs · duel intime',
  name: 'ISAM',
},
```

> **Justification emoji :** 🫀 (cœur anatomique) — représente la connaissance intime de l'autre, unique, pas encore utilisé par les autres jeux (🕵️, 🏆, ⏱️).
> **Justification floatAnimation :** `float` est libre pour un nouveau jeu depuis que ELDU utilise `floatB` et TokTik `floatC`. Undercover utilise aussi `float` — choisir `floatC` déjà pris par TokTik. Réassignation : tous les trois nommés sont pris (`float` → Undercover, `floatB` → ELDU, `floatC` → TokTik). ISAM utilise `float` en partage toléré, car Undercover et ISAM ne coexistent jamais sur la même carte simultanément (chaque carte est un jeu distinct).

---

## Section 2 — Entrée sur la Page d'Accueil

```typescript
{
  id: 'isam',
  name: 'ISAM',
  description: 'Tu crois le connaître ? Prouve-le.',
  badge: '2 joueurs · duel intime',
  href: '/rooms/new?game=isam',
  gradient: 'linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)',
  emoji: '🫀',
  floatAnim: 'float 3s ease-in-out infinite',
},
```

---

## Section 3 — Écrans du Jeu

ISAM a une machine d'états à 4 phases séquentielles + des écrans transverses (lobby, fin). Voici tous les écrans.

---

### Écran 1 : Lobby / Salle d'attente

**Phase :** `waiting` (avant `status: 'playing'`)
**Qui le voit :** Tous les joueurs (host + non-host)

```
Layout :
┌─────────────────────────────────────┐
│  HEADER (gradient rose ISAM)        │
│  ┌ blob déco top-right 120x120 ┐   │
│  ┌ blob déco bottom-left 80x80 ┐   │
│  "ISAM 🫀"         label muted 12px │
│  "Salle d'attente" bold 17px blanc  │
│                                     │
│  CODE DE LA SALLE   label 12px      │
│  ┌──────────────────────────────┐   │
│  │   I    S    A    M  (ex)     │   │
│  └──────────────────────────────┘   │
│  "Partagez ce code…" 12px muted     │
└─────────────────────────────────────┘
│  [Bannière corail pulse]            │
│  "● 2 joueurs connectés ✓"         │
└─────────────────────────────────────┘

PAGE (fond #FAFAF8) :
│                                     │
│  "JOUEURS"  label 13px #1A1A2E      │
│  ┌ Avatar J1 (emoji+couleur) ─────┐ │
│  │ 🦊  Pseudo J1        connecté  │ │
│  └────────────────────────────────┘ │
│  ┌ Avatar J2 (emoji+couleur) ─────┐ │
│  │ 🐸  Pseudo J2        connecté  │ │
│  └────────────────────────────────┘ │
│  [Slot vide ? si J2 pas connecté]  │
│                                     │
│  [Config host — si host]            │
│  ┌──────────────────────────────┐   │
│  │  Thème : [mix ▾]             │   │
│  │  Durée réponse : [60s ▾]     │   │
│  │  Nb questions : [5 ▾]        │   │
│  └──────────────────────────────┘   │
│                                     │
│  [CTA "🚀 Lancer la partie"]        │
│  (visible host seul, actif si 2j)   │
│                                     │
│  [Bandeau attente si < 2 joueurs]   │
│  "⏳ En attente d'un 2e joueur…"    │
└─────────────────────────────────────┘
```

**Éléments :**
- Header gradient : `linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%)`, `borderRadius: '0 0 20px 20px'`, padding `28px 20px`
- Blobs : `rgba(255,255,255,0.12)` et `rgba(255,255,255,0.08)` — mêmes valeurs que les cartes de jeu
- Label "ISAM 🫀" : 12px, 800, `rgba(255,255,255,0.7)`
- "Salle d'attente" : 17px, 900, `#FFF`
- Code room : 32px, 900, `#C2185B` (couleur primaire ISAM, sur fond blanc `#FFF`, container `borderRadius: 20px`)
- Chaque lettre du code : animation `popIn` au montage
- Bannière connectés : gradient `linear-gradient(90deg, #FF6035, #FF8C60)`, animation `pulse 2s infinite`
- Avatars joueurs : cercles 64x64 `borderRadius: '50%'` avec couleurs `AVATAR_COLORS[index]` et emoji animal
- Rows joueurs : `background: '#FFF'`, `borderRadius: 16`, `boxShadow: '0 2px 10px rgba(0,0,0,0.06)'`
- Config host : selects/inputs inline, fond `#FFF`, `borderRadius: 16`, padding `16px`
- CTA "Lancer" : gradient corail `linear-gradient(90deg, #FF6035, #FF8C60)`, `borderRadius: 20`, `boxShadow: '0 8px 28px rgba(255,96,53,0.45)'`, désactivé (opacité 0.5) si < 2 joueurs
- Bandeau attente (< 2 joueurs) : `background: '#F0EDFF'`, `borderRadius: 16`, emoji ⏳ avec animation `bounce 1s infinite`, texte `#6A1B9A` (violet DA)

**Couleurs spécifiques :**
- Fond page : `#FAFAF8`
- Header : gradient rose ISAM
- CTA : gradient corail standard

---

### Écran 2 : Transition / Annonce de phase

**Phase :** Transition entre phases (affichée ~2s avant chaque phase)
**Qui le voit :** Tous les joueurs

```
Layout (fond #FAFAF8) :
┌─────────────────────────────────────┐
│                                     │
│         🫀  (emoji 64px)            │
│      animation float                │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  PHASE 1 sur 4               │   │
│  │  "[Pseudo J1] répond"        │   │
│  │  "Prépare tes réponses !"    │   │
│  └──────────────────────────────┘   │
│                                     │
│  ──── Barre de progression ────     │
│  ● ─── ○ ─── ○ ─── ○               │
│  Phase 1  2  3  4                   │
│                                     │
└─────────────────────────────────────┘
```

**Éléments :**
- Fond : `#FAFAF8`
- Emoji 🫀 centré : 64px, animation `float 3s ease-in-out infinite`
- Numéro de phase : 13px, 900, `rgba(26,26,46,0.5)`, uppercase, `letterSpacing: 1`
- Titre "[Pseudo] répond" : 24px, 900, `#1A1A2E`
- Sous-titre : 15px, 700, `#C2185B` (couleur primaire ISAM)
- Barre progression (4 dots) : dot actif `#C2185B` 12x12, dot inactif `rgba(194,24,91,0.25)` 8x8, connectés par ligne `rgba(194,24,91,0.2)` 1px
- Bloc principal : `background: '#FFF'`, `borderRadius: 24`, `boxShadow: '0 8px 32px rgba(0,0,0,0.08)'`, padding `28px 24px`

---

### Écran 3 : Phase Réponse — Joueur Actif (phases 1 & 2)

**Phase :** `gamePhase: 1` (J1 répond) ou `gamePhase: 2` (J2 répond)
**Qui le voit :** Le joueur actif uniquement (`activePlayerId === currentPlayerId`)

```
Layout (fond #FAFAF8) :
┌─────────────────────────────────────┐
│  HEADER compact (gradient rose)     │
│  "Phase [X]/4 · Question [Y]/[N]"   │
│  ─── barre de progression ───       │
│  [████████░░░░░░░░] Y/N en cours    │
└─────────────────────────────────────┘

│                                     │
│  [Image thème — si imageUrl]        │
│  ┌──────────────────────────────┐   │
│  │   🖼️  image 200x200          │   │
│  │   object-contain rounded:16  │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─ Carte question ────────────────┐ │
│  │  "Si tu pouvais dîner avec     │ │
│  │   une célébrité, ce serait ?"  │ │
│  │  24px, 900, #1A1A2E            │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Zone réponse ──────────────────┐ │
│  │  [Champ texte libre]            │ │
│  │  placeholder: "Ta réponse…"     │ │
│  │  border: 2px solid #C2185B     │ │
│  │  borderRadius: 20              │ │
│  │  padding: 16px                 │ │
│  └────────────────────────────────┘ │
│                                     │
│  ⏱️ [Timer] 45s restantes           │
│  [barre timer décroissante rose]    │
│                                     │
│  [CTA "✅ Valider ma réponse"]      │
│                                     │
└─────────────────────────────────────┘
```

**Éléments :**
- Header compact : gradient rose ISAM, `borderRadius: '0 0 16px 16px'`, padding `16px 20px`
- Label phase : 12px, 800, `rgba(255,255,255,0.7)`, uppercase
- Barre progression questions : fond `rgba(255,255,255,0.25)`, fill `rgba(255,255,255,0.9)`, hauteur 4px, `borderRadius: 100`
- Image question : `200px × 200px`, `borderRadius: 16`, `objectFit: 'contain'`, fond `rgba(26,26,46,0.04)` si pas d'image → emoji thème 80px centré
- Carte question : `background: '#FFF'`, `borderRadius: 20`, `boxShadow: '0 4px 16px rgba(0,0,0,0.08)'`, padding `20px`
- Texte question : 20px, 900, `#1A1A2E`
- Champ texte : `background: '#FFF'`, `border: '2px solid #C2185B'`, `borderRadius: 20`, padding `16px`, font 16px, 700, `#1A1A2E`, placeholder `rgba(26,26,46,0.35)`
- Timer affiché : 15px, 900, `#C2185B` — rouge `#D32F2F` si < 10s
- Barre timer : fond `rgba(194,24,91,0.15)`, fill `#C2185B` → `#FF6035` si < 10s, hauteur 6px, `borderRadius: 100`
- CTA : gradient corail standard, désactivé si champ vide

**Couleurs spécifiques :**
- Fond : `#FAFAF8`
- Accent interactif : `#C2185B`
- CTA : `linear-gradient(90deg, #FF6035, #FF8C60)`

---

### Écran 4 : Phase Réponse — Joueur en Attente (phases 1 & 2)

**Phase :** `gamePhase: 1` ou `gamePhase: 2`
**Qui le voit :** Le joueur NON actif (`waitingPlayerId === currentPlayerId`)

```
Layout (fond #FAFAF8) :
┌─────────────────────────────────────┐
│  HEADER compact (gradient rose)     │
│  "Phase [X]/4 · En attente…"        │
└─────────────────────────────────────┘

│                                     │
│         🫀 (64px, float)            │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Avatar [J actif] centré     │   │
│  │  (72x72, avec point vert)    │   │
│  │                              │   │
│  │  "[Pseudo] est en train      │   │
│  │   de répondre…"              │   │
│  │  15px, 700, #1A1A2E          │   │
│  │                              │   │
│  │  [3 dots animés ···]         │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌ Bandeau info ──────────────────┐ │
│  │  🔒 "Tes réponses seront       │ │
│  │  cachées à [adversaire]"      │ │
│  └────────────────────────────────┘ │
│                                     │
│  "Question [Y] / [N]"               │
│  [barre de progression grisée]      │
│                                     │
└─────────────────────────────────────┘
```

**Éléments :**
- Fond : `#FAFAF8`
- Emoji 🫀 : 64px, animation `float 3s ease-in-out infinite`
- Avatar joueur actif : 72x72, `borderRadius: '50%'`, couleur `AVATAR_COLORS[index]`, emoji animal, point vert connecté, `boxShadow: '0 6px 20px {couleur}66'`
- Texte attente : 17px, 900, `#1A1A2E`
- Sous-texte "…" : animation `bounce 1.5s infinite`, couleur `#C2185B`
- Bandeau info : `background: '#F0EDFF'`, `borderRadius: 16`, padding `14px 16px`, icône 🔒 22px, texte 13px, 700, `#6A1B9A` (violet DA pour les bandeaux info)
- Barre progression : fond `rgba(26,26,46,0.08)`, pas de fill (grisée — c'est l'autre qui progresse), hauteur 4px

---

### Écran 5 : Phase Devinage — Joueur Actif (phases 3 & 4)

**Phase :** `gamePhase: 3` (J1 devine J2) ou `gamePhase: 4` (J2 devine J1)
**Qui le voit :** Le joueur actif en phase de devinage

```
Layout (fond #FAFAF8) :
┌─────────────────────────────────────┐
│  HEADER compact (gradient rose)     │
│  "Phase [X]/4 · Devinage"           │
│  [barre progression questions]      │
└─────────────────────────────────────┘

│                                     │
│  [Image question — même que réponse]│
│                                     │
│  ┌─ Carte question ───────────────┐ │
│  │  "Qu'a répondu [Pseudo adv.] ? │ │
│  │  à : [texte de la question]"   │ │
│  │  Label "Qu'a répondu" 13px     │ │
│  │  rose #C2185B, 700             │ │
│  │  Question : 18px, 900, #1A1A2E │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ Zone prédiction ──────────────┐ │
│  │  [Champ texte libre]           │ │
│  │  placeholder: "Ta prédiction…" │ │
│  │  border: 2px solid #C2185B    │ │
│  └────────────────────────────────┘ │
│                                     │
│  [CTA "🔮 Soumettre ma prédiction"] │
│                                     │
│  ─── Résultats précédents ───       │
│  [Si previousResults.length > 0]    │
│  ┌ Row résultat 1 ───────────────┐  │
│  │ ✅/❌  "Ta prédiction" →      │  │
│  │ "Vraie réponse"               │  │
│  └───────────────────────────────┘  │
│  [Row résultat 2…]                  │
│                                     │
└─────────────────────────────────────┘
```

**Éléments :**
- Image question : identique à l'écran 3 (mêmes specs)
- Carte question : `background: '#FFF'`, `borderRadius: 20`, padding `20px`
- Label "Qu'a répondu [Pseudo] ?" : 13px, 800, `#C2185B`, uppercase, `letterSpacing: 0.5`
- Avatar adversaire inline (petit, 28x28) à côté du pseudo dans le label
- Texte question : 18px, 900, `#1A1A2E`
- Champ prédiction : identique au champ réponse (écran 3)
- CTA : gradient corail standard
- Rows résultats précédents :
  - Fond : `#FFF`, `borderRadius: 16`, `boxShadow: '0 2px 10px rgba(0,0,0,0.06)'`, padding `12px 14px`
  - Icône ✅ si `isCorrect`, ❌ si non — 20px
  - "Ta prédiction" : 13px, 700, `rgba(26,26,46,0.5)`
  - "→ Vraie réponse" : 14px, 800, `#C2185B` si correct, `#1A1A2E` si incorrect
  - Badge "+1 pt" si correct : `background: 'rgba(194,24,91,0.12)'`, `borderRadius: 100`, padding `2px 8px`, 12px, 900, `#C2185B`

---

### Écran 6 : Phase Devinage — Joueur en Attente + Résultat Live (phases 3 & 4)

**Phase :** `gamePhase: 3` ou `gamePhase: 4`
**Qui le voit :** Le joueur NON actif en phase de devinage (+ les deux joueurs voient le résultat après soumission)

```
Layout (fond #FAFAF8) :
┌─────────────────────────────────────┐
│  HEADER compact (gradient rose)     │
│  "Phase [X]/4 · [Pseudo] devine…"   │
└─────────────────────────────────────┘

│                                     │
│  [Image question courante]          │
│                                     │
│  "[Pseudo actif] essaie de          │
│   deviner ta réponse…"              │
│  [3 dots animés]                    │
│                                     │
│  ─── Résultats en temps réel ───    │
│  [Mêmes rows résultats que écran 5] │
│  (visibles des deux côtés)          │
│                                     │
│  ┌ Score live ──────────────────┐   │
│  │  [Avatar J1] [Score J1]      │   │
│  │  [Avatar J2] [Score J2]      │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Éléments :**
- Texte attente : 17px, 900, `#1A1A2E`
- Rows résultats : identiques à l