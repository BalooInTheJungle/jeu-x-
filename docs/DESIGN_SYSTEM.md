# DESIGN_SYSTEM.md — Système de Design Kclo Games

> **Ce fichier est la référence absolue pour tout ce qui est visuel.**
> Tout agent qui crée ou modifie une UI DOIT lire ce fichier en premier.
> Ne jamais inventer une couleur, un radius ou un spacing — utiliser ce qui est listé ici.

---

## Principes

- **Mobile-first.** Toutes les pages sont conçues pour un écran de téléphone en portrait.
- **Dark only.** Pas de mode clair. Le fond est toujours zinc-950.
- **Sobre et rapide.** Pas d'images décoratives, pas d'animations complexes. Contenu d'abord.
- **Max-width 448px (max-w-sm).** Le contenu ne dépasse jamais cette largeur sur mobile. Sur desktop il reste centré.

---

## Palette de Couleurs

### Fond (backgrounds)

| Rôle | Token Tailwind | Usage |
|------|---------------|-------|
| Page | `bg-zinc-950` | Fond global de toutes les pages |
| Surface | `bg-zinc-900` | Cartes cliquables (ex : cartes jeux page d'accueil) |
| Input / Option | `bg-zinc-800` | Inputs, boutons d'option, toggles |
| Input hover | `bg-zinc-700` | État hover des boutons d'option |

> **Règle absolue :** jamais de `bg-slate-*` pour les fonds — utiliser exclusivement `zinc-*`.
> La page `rooms/join` utilise encore `slate` — c'est une incohérence à corriger.

### Texte

| Rôle | Token Tailwind | Usage |
|------|---------------|-------|
| Primaire | `text-white` | Titres, valeurs importantes, contenu principal |
| Secondaire | `text-slate-400` | Labels, descriptions, textes d'aide |
| Muted | `text-slate-500` | Placeholders, infos très secondaires |
| Léger | `text-slate-300` | Textes sur fond zinc-800, boutons ghost |

### Accent — Indigo (action principale)

| Rôle | Token Tailwind | Usage |
|------|---------------|-------|
| Bouton primaire | `bg-indigo-600` | CTA principal de la page |
| Hover bouton | `bg-indigo-500` | État hover du CTA |
| Texte accent | `text-indigo-400` | Code room, infos mises en valeur |
| Focus ring | `ring-indigo-500` | Focus des inputs et boutons |
| Option active | `bg-indigo-600 text-white` | Bouton d'option sélectionné |

### Statut

| Rôle | Token Tailwind | Usage |
|------|---------------|-------|
| Succès / Connecté | `bg-green-400` | Point de présence joueur |
| Erreur | `text-red-400` | Messages d'erreur inline |
| Warning / Arbitre | `text-amber-300` + `bg-amber-950/40 border-amber-800/50` | Bandeau rôle spécial |

### Couleurs Jeux (tags page d'accueil)

| Jeu | Classes |
|-----|---------|
| Undercover | `bg-purple-900 text-purple-300` |
| ELDU | `bg-yellow-900 text-yellow-300` |
| TokTik | `bg-emerald-900 text-emerald-300` |
| Nouveau jeu | Choisir dans : `bg-sky-900 text-sky-300`, `bg-pink-900 text-pink-300`, `bg-orange-900 text-orange-300` |

### Avatars Joueurs (Undercover)

Tableau de couleurs vives pour les avatars circulaires, dans cet ordre :
```
'#f43f5e'  rose-500
'#8b5cf6'  violet-500
'#0ea5e9'  sky-500
'#10b981'  emerald-500
'#f59e0b'  amber-500
'#f97316'  orange-500
'#14b8a6'  teal-500
'#ec4899'  pink-500
```

---

## Typographie

**Police :** Inter (Google Fonts, déjà configurée dans `layout.tsx`)

### Hiérarchie

| Niveau | Classes Tailwind | Usage |
|--------|-----------------|-------|
| Titre de page | `text-3xl font-bold` | H1 sur les pages formulaires |
| Titre large | `text-4xl font-bold tracking-tight` | H1 page d'accueil |
| Titre section | `text-xl font-bold` | Titres de cartes |
| Label | `text-sm text-slate-400` | Labels de champs, titres de section |
| Corps | `text-sm text-slate-400 leading-relaxed` | Descriptions |
| Muted | `text-xs text-slate-500` | Métadonnées, notes, compteurs |
| Monospace | `tracking-widest uppercase` | Code de room, codes à saisir |

### Tags / Pills

Petits badges colorés en haut à droite des cartes ou pour les rôles :
```
text-xs font-medium px-2 py-1 rounded-full {couleur-bg} {couleur-text}
```

---

## Espacement

### Structure de page

```
┌─────────────────────────────────────┐
│  px-4 py-12  (accueil)              │
│  p-8         (formulaires)          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  max-w-sm (w-full)          │    │
│  │                             │    │
│  │  Header    mb-12            │    │
│  │  Section   mb-8             │    │
│  │  Element   mb-4 / mb-6      │    │
│  │  Tight     mb-2             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Gaps (flex/grid)

| Contexte | Classe | Usage |
|----------|--------|-------|
| Standard | `gap-4` | Entre éléments d'un formulaire |
| Serré | `gap-2` | Entre boutons d'options, grilles |
| Moyen | `gap-3` | Entre items de liste |

### Padding interne (composants)

| Composant | Padding |
|-----------|---------|
| Bouton CTA | `px-6 py-4` |
| Bouton compact | `px-6 py-3` |
| Input | `px-4 py-3` |
| Carte (large) | `p-5` |
| Surface (small) | `p-4` |

---

## Border Radius

| Composant | Classe | Notes |
|-----------|--------|-------|
| Carte cliquable | `rounded-2xl` | Cartes page d'accueil, conteneurs larges |
| Bouton / Input | `rounded-xl` | Tous les inputs et boutons |
| Surface interne | `rounded-xl` | Containers de config, listes de joueurs |
| Avatar | `rounded-full` | Cercles, points de statut, badges |

> **Règle :** jamais de `rounded-lg` — utiliser `rounded-xl` comme minimum.
> (La page join utilise encore `rounded-lg` — incohérence à corriger.)

---

## Composants

### Page Formulaire

Structure standard pour toutes les pages avec un seul formulaire (new room, join) :

```tsx
<main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-white">
  <div className="w-full max-w-sm">
    {/* Tag optionnel au-dessus du titre */}
    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">{tag}</p>
    <h1 className="text-3xl font-bold mb-2">{titre}</h1>
    <p className="text-slate-400 mb-8">{description}</p>

    <form className="flex flex-col gap-4">
      {/* champs */}
      <CTA />
    </form>
  </div>
</main>
```

---

### Input Texte

```tsx
<div>
  <label className="block text-sm text-slate-400 mb-1">{label}</label>
  <input
    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</div>
```

---

### Bouton CTA Primaire

```tsx
<button
  className="rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  {label}
</button>
```

Variante large (full width) :
```tsx
className="w-full rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
```

---

### Bouton Secondaire / Ghost

```tsx
<button
  className="w-full rounded-xl border border-zinc-700 px-6 py-4 text-slate-300 hover:bg-zinc-800 hover:text-white transition-colors"
>
  {label}
</button>
```

---

### Boutons d'Options (grille de sélection)

Utilisé pour les configs de jeux (thème, durée, difficulté) :

```tsx
<div>
  <p className="text-sm text-slate-400 mb-2">{section_label}</p>
  <div className="grid grid-cols-{2|3} gap-2">
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => setSelected(opt.value)}
        className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          selected === opt.value
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

---

### Toggle Switch

Utilisé pour les options booléennes (Mr. White, spectateur) :

```tsx
<label className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer">
  <div>
    <p className="font-medium text-sm">{titre}</p>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
  <button
    role="switch"
    aria-checked={value}
    onClick={() => setValue(v => !v)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-zinc-600'}`}
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
</label>
```

---

### Carte de Jeu (page d'accueil)

```tsx
<Link
  href={href}
  className="block bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors active:scale-[0.98]"
>
  <div className="flex items-start justify-between mb-3">
    <h2 className="text-xl font-bold">{name}</h2>
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${tagColor}`}>{tag}</span>
  </div>
  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{description}</p>
  <div className="flex items-center gap-4 text-xs text-slate-500">
    <span>{players}</span>
    <span>·</span>
    <span>{duration}</span>
  </div>
</Link>
```

---

### Surface / Container

Utilisé pour la liste des joueurs, les sections de config :

```tsx
<div className="bg-zinc-800 rounded-xl p-4">
  {/* contenu */}
</div>
```

---

### Bandeau Rôle Spécial (warning/info)

Utilisé pour indiquer un rôle particulier (ex: arbitre dans ELDU) :

```tsx
<div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
  <p className="text-sm font-semibold text-amber-300">{titre}</p>
  <p className="text-xs text-amber-500/80 mt-0.5">{description}</p>
</div>
```

Variante succès (vert) :
```tsx
<div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-4 py-3">
  <p className="text-sm font-semibold text-emerald-300">{titre}</p>
</div>
```

---

### Message d'Erreur Inline

```tsx
{error && <p className="text-red-400 text-sm">{error}</p>}
```

Variante centrée :
```tsx
{error && <p className="text-red-400 text-sm text-center">{error}</p>}
```

---

### Avatar Joueur

Cercle coloré avec initiale, 3 tailles disponibles :

```tsx
function Avatar({ id, order, name, size = 'md' }: { id: string; order: string[]; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = AVATAR_BG[(order.indexOf(id) || 0) % AVATAR_BG.length]
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div style={{ backgroundColor: color }} className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
```

---

### Point de Présence (joueur connecté)

```tsx
<span className="w-2 h-2 rounded-full bg-green-400" />
```

---

## Layouts Types

### Page de Jeu (GameView)

Contrairement aux pages de formulaires, les GameViews remplissent l'écran :

```
┌─────────────────────────────────────┐
│  bg-zinc-950  min-h-screen          │
│  flex flex-col  p-4                 │
│                                     │
│  [Header : code room, joueurs]      │
│                                     │
│  [Zone centrale : image / question] │
│  → flex-1 pour qu'elle prenne       │
│    tout l'espace disponible         │
│                                     │
│  [Footer : actions / timers]        │
└─────────────────────────────────────┘
```

Patron de base :
```tsx
<main className="flex min-h-screen flex-col bg-zinc-950 p-4 text-white">
  <header className="mb-4">{/* info jeu */}</header>
  <section className="flex-1 flex flex-col items-center justify-center">{/* contenu central */}</section>
  <footer className="mt-4">{/* actions */}</footer>
</main>
```

---

### Écran de Fin de Partie

```
┌─────────────────────────────────────┐
│  bg-zinc-950  min-h-screen          │
│  flex flex-col items-center         │
│  justify-center  p-8                │
│                                     │
│       Emoji grand  (🏆 / 🎉)        │
│       Titre résultat                │
│       Sous-titre (gagnant, score)   │
│                                     │
│       [Historique / Classement]     │
│                                     │
│       [Bouton Nouvelle manche]      │
│       (host uniquement)             │
│       [Message attente non-host]    │
└─────────────────────────────────────┘
```

---

## Patterns UX

### Loading States

- Bouton qui charge : texte change (ex: `'Création...'`, `'Chargement...'`) + `disabled`
- Jamais de spinner complexe — le texte suffit pour les actions courtes (< 3s)
- Pour les chargements de page : afficher un `<p>Chargement...</p>` centré

### États Vides

- Pas de joueurs : message dans la liste avec `text-slate-500 text-sm`
- Pas de questions : message explicatif + suggestion d'action

### Hiérarchie des Actions

Sur chaque écran, il y a au maximum **un CTA principal** (indigo-600) et **un CTA secondaire** (ghost/border).
Ne jamais aligner deux boutons indigo côte à côte.

### Feedback Utilisateur

- Erreurs : `text-red-400 text-sm` juste au-dessus du bouton de soumission
- Succès : pas de message — l'UI change directement (Realtime)
- Warnings : bandeau amber (rôle spécial, contrainte)

---

## Incohérences Connues à Corriger

Ces fichiers utilisent encore l'ancienne palette `slate` ou des classes incorrectes :

| Fichier | Problème | Correction |
|---------|----------|------------|
| `src/app/rooms/join/page.tsx` | `bg-slate-950` → `bg-zinc-950` | Remplacer `slate` par `zinc` partout |
| `src/app/rooms/join/page.tsx` | `rounded-lg` → `rounded-xl` | Inputs et bouton |

---

## Comment Utiliser Ce Document (instructions pour les agents)

### Avant de créer un écran

1. Identifier le type d'écran : formulaire, lobby, GameView, écran de fin
2. Utiliser le layout type correspondant (section "Layouts Types")
3. Ne jamais inventer une nouvelle couleur — piocher dans la palette ci-dessus
4. Chaque action importante = un bouton indigo-600

### Ajouter un nouveau jeu à la page d'accueil

Choisir une couleur de tag parmi les non-utilisées :
- `bg-sky-900 text-sky-300`
- `bg-pink-900 text-pink-300`
- `bg-orange-900 text-orange-300`
- `bg-rose-900 text-rose-300`

### Créer un GameView

- Utiliser le patron "Page de Jeu" ci-dessus
- La réponse correcte n'est JAMAIS affichée côté joueur — uniquement côté arbitre/host
- Respecter le pattern `flex-1` pour la zone centrale
- Toujours prévoir un `FinishedScreen` en composant séparé dans le même fichier

### Checklist avant de soumettre

- [ ] Tous les fonds sont en `zinc-*` (pas de `slate-*`)
- [ ] Tous les radius sont `rounded-xl` minimum (pas de `rounded-lg`)
- [ ] Focus ring sur tous les inputs : `focus:ring-2 focus:ring-indigo-500`
- [ ] Boutons disabled ont `disabled:opacity-50 disabled:cursor-not-allowed`
- [ ] Un seul CTA primaire indigo par écran
- [ ] Responsive testé mentalement sur 375px de large (iPhone SE)
