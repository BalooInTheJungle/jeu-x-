# DESIGN_SYSTEM.md — Système de Design Kclo Games

> **Référence absolue issue de la Direction Artistique validée le 26/04/2026.**
> Valeurs extraites directement du fichier `Kclo Games DA.html` (Claude Design).
> Tout agent qui touche à l'UI DOIT lire ce fichier en premier.
> Ne jamais inventer une couleur, un radius ou un spacing — tout est ici.

---

## Principes

- **Mobile-first.** 375px de large, portrait. Le contenu ne dépasse jamais `max-w-sm`.
- **Fond clair partout.** Background global `#FAFAF8` (blanc légèrement chaud). Pas de dark mode.
- **Coloré et playful.** Chaque jeu a sa couleur. Les cartes ont des dégradés. Emojis/icônes 3D flottants.
- **Nunito uniquement.** Jamais Inter, jamais system-ui.

---

## Couleurs

### Fond & Surfaces

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg-page` | `#FAFAF8` | Fond de toutes les pages (blanc chaud) |
| `bg-card` | `#FFFFFF` | Cartes de classement, rows de joueurs |
| `bg-dark-bar` | `linear-gradient(90deg, #1A1A2E, #2D2D4E)` | Barre "En ligne ce soir", headers podium |
| `bg-waiting` | `#F0EDFF` | Bandeau "En attente de joueurs" |

### Texte

| Token | Valeur | Usage |
|-------|--------|-------|
| `text-primary` | `#1A1A2E` | Titres, valeurs, contenu principal |
| `text-accent` | `#FF6035` | Subtitle page d'accueil, scores, points |
| `text-muted-light` | `rgba(255,255,255,0.7)` | Labels sur fond coloré |
| `text-muted-dark` | `rgba(26,26,46,0.5)` | Infos secondaires sur fond clair |

### Accent — Corail/Orange (action principale)

| Token | Valeur | Usage |
|-------|--------|-------|
| `coral-primary` | `#FF6035` | CTA bouton, scores, points, accent |
| `coral-light` | `#FF8C60` | Gradient fin des boutons |
| `coral-shadow` | `rgba(255,96,53,0.45)` | Box-shadow des boutons CTA |
| `coral-pulse` | `rgba(255,96,53,0.4)` | Animation pulse |

### Couleurs par Jeu (gradients des cartes)

```css
/* Undercover */
background: linear-gradient(135deg, #6A1B9A 0%, #9C27B0 50%, #CE93D8 100%);

/* ELDU */
background: linear-gradient(135deg, #E65100 0%, #FF6035 50%, #FFAB76 100%);

/* TokTik */
background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%);

/* Nouveaux jeux — ordre de priorité */
background: linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #64B5F6 100%); /* Bleu */
background: linear-gradient(135deg, #880E4F 0%, #C2185B 50%, #F48FB1 100%); /* Rose */
background: linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FFCC80 100%); /* Ambre */
```

Couleurs de podium par jeu (header + steps) :
```
Undercover : #6A1B9A → #9C27B0
ELDU       : #E65100 → #FF6035
TokTik     : #1B5E20 → #2E7D32
```

### Avatars Joueurs

6 couleurs dans cet ordre, assignées par index de joueur :

```js
const AVATAR_COLORS = [
  '#FF6035', // Corail   → joueur 1
  '#7C4DFF', // Violet   → joueur 2
  '#00BCD4', // Teal     → joueur 3
  '#FF4081', // Rose     → joueur 4
  '#FFD700', // Or       → joueur 5
  '#69F0AE', // Menthe   → joueur 6
]
```

Chaque joueur a un **emoji animal** assigné de façon déterministe depuis son pseudo :
```js
const AVATAR_EMOJIS = ['🦊','🐸','🐶','🦋','🦁','🐙','🐼','🐧','🦉','🦊']
// index = hash(username) % AVATAR_EMOJIS.length
```

### Confetti (écran de fin)

```js
const CONFETTI_COLORS = ['#FF6035','#FFD700','#7C4DFF','#00BCD4','#FF4081','#69F0AE','#FF9100']
```

---

## Typographie

**Police unique : Nunito** (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
```

### Hiérarchie

| Niveau | Taille | Poids | Couleur | Usage |
|--------|--------|-------|---------|-------|
| App title | 28px | 900 | `#1A1A2E` | "Kclo Games" |
| Subtitle accent | 15px | 700 | `#FF6035` | "Soir de jeux 🎉" |
| Card title | 24px | 900 | `#FFF` | Nom du jeu sur carte |
| Card desc | 13px | 600 | `rgba(255,255,255,0.85)` | Description sur carte colorée |
| Section label | 13px | 900 | `#1A1A2E` | "CHOISISSEZ UN JEU" (uppercase, ls: 1) |
| Player name | 14px | 800 | `#1A1A2E` | Nom dans classement |
| Score | 13px | 900 | `#FF6035` | Points dans classement |
| Muted label | 12px | 800 | `rgba(255,255,255,0.6)` | "CODE DE LA SALLE" (uppercase, ls: 2) |
| Room code | 32px | 900 | `#6A1B9A` | "XKZP" (lettre par lettre, ls: 4) |

---

## Border Radius

| Composant | Valeur |
|-----------|--------|
| Cartes jeux | `24px` |
| Boutons CTA | `20px` |
| Header lobby (bottom) | `0 0 20px 20px` |
| Rows classement | `16px` |
| Bandeau info | `16px` |
| Pills/badges | `100px` (full round) |
| Avatars | `50%` |
| Code room (container) | `20px` |
| Bouton "Jouer →" (inline) | `100px` |
| Blob décoratif | `50%` |

---

## Ombres

| Composant | Valeur |
|-----------|--------|
| Carte jeu | `0 8px 32px rgba(0,0,0,0.18)` |
| Bouton CTA | `0 8px 28px rgba(255,96,53,0.45)` |
| Status banner | `0 6px 20px rgba(255,96,53,0.35)` |
| Avatar joueur | `0 6px 20px {couleur}66` |
| Icône header | `0 4px 14px rgba(255,96,53,0.4)` |
| Row classement | `0 2px 10px rgba(0,0,0,0.06)` |
| Step podium | `0 6px 20px rgba(0,0,0,0.2)` |
| Avatar #1 podium | `0 0 0 6px rgba(255,215,0,0.25), 0 8px 24px {couleur}66` |

---

## Animations CSS

À placer dans `globals.css` :

```css
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
@keyframes floatB {
  0%, 100% { transform: translateY(0px) rotate(3deg); }
  50% { transform: translateY(-14px) rotate(-3deg); }
}
@keyframes floatC {
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(6deg); }
}
@keyframes confettiFall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(680px) rotate(720deg); opacity: 0; }
}
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,96,53,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(255,96,53,0); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Quand utiliser quelle animation

| Animation | Usage |
|-----------|-------|
| `float` (3s) | Emoji flottant carte Undercover |
| `floatB` (3s) | Emoji flottant carte ELDU |
| `floatC` (3s) | Emoji flottant carte TokTik |
| `popIn` | Apparition avatar joueur, lettres du code room |
| `bounce` (1.5s) | Avatar #1 sur podium, emoji "🟢" en ligne, "🎊" fin |
| `pulse` (2s) | Bannière "X joueurs connectés" |
| `confettiFall` | Pièces de confetti sur l'écran de fin |

---

## Composants

### Page d'accueil — Structure

```
┌─────────────────────────────────┐
│  bg: #FAFAF8   p: 28px 20px     │
│                                 │
│  [Header]                       │
│  "Kclo Games"  weight:900 28px  │
│  "Soir de jeux 🎉"  coral 15px  │
│  [Icône 🎮 corail 44x44 r:14]   │
│                                 │
│  [Dark bar "EN LIGNE CE SOIR"]  │  ← optionnel si stat disponible
│  bg: #1A1A2E→#2D2D4E  r:16      │
│                                 │
│  "CHOISISSEZ UN JEU" label      │
│                                 │
│  [Carte jeu × 3]  gap:16px      │
│                                 │
│  [Bouton ghost "Rejoindre"]     │
└─────────────────────────────────┘
```

### Carte de Jeu

```tsx
<div style={{
  background: '{gradient du jeu}',
  borderRadius: 24,
  padding: '22px 20px 20px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
}}>
  {/* Blobs décoratifs */}
  <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120,
    borderRadius:'50%', background:'rgba(255,255,255,0.12)' }}/>
  <div style={{ position:'absolute', bottom:-20, left:-10, width:80, height:80,
    borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>

  {/* Emoji flottant */}
  <div style={{ position:'absolute', top:-6, right:16, fontSize:58,
    animation:'float 3s ease-in-out infinite',
    filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.25))' }}>
    {emoji}
  </div>

  {/* Badge joueurs */}
  <div style={{ display:'inline-flex', alignItems:'center',
    background:'rgba(255,255,255,0.25)', borderRadius:100,
    padding:'4px 10px', fontSize:11, fontWeight:800, color:'#FFF',
    marginBottom:10, backdropFilter:'blur(4px)' }}>
    👥 {badge}
  </div>

  <div style={{ fontSize:24, fontWeight:900, color:'#FFF', marginBottom:6 }}>{name}</div>
  <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:14 }}>{desc}</div>

  {/* Bouton "Jouer →" */}
  <div style={{ display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(255,255,255,0.95)', borderRadius:100,
    padding:'8px 18px', fontSize:13, fontWeight:900, color:'#1A1A2E',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
    Jouer →
  </div>
</div>
```

### Bouton CTA Primaire

```tsx
<button style={{
  width: '100%',
  padding: '18px',
  borderRadius: 20,
  border: 'none',
  background: 'linear-gradient(90deg, #FF6035, #FF8C60)',
  color: '#FFF',
  fontSize: 17,
  fontWeight: 900,
  fontFamily: "'Nunito', sans-serif",
  boxShadow: '0 8px 28px rgba(255,96,53,0.45)',
  cursor: 'pointer',
}}>
  🚀 {label}
</button>
```

### Bouton Ghost / Secondaire

```tsx
<button style={{
  width: '100%',
  padding: '16px',
  borderRadius: 18,
  border: '2.5px solid #FF6035',
  background: 'transparent',
  color: '#FF6035',
  fontSize: 15,
  fontWeight: 900,
  fontFamily: "'Nunito', sans-serif",
  cursor: 'pointer',
}}>
  🔑 {label}
</button>
```

Variante neutre (Quitter, secondaire sans couleur) :
```tsx
border: '2.5px solid rgba(26,26,46,0.2)'
color: '#1A1A2E'
```

### Header Lobby (avec couleur du jeu)

```
┌─────────────────────────────────┐
│  gradient du jeu  p:28px 20px   │  ← couleur propre à chaque jeu
│  [Blobs décoratifs]             │
│  "Undercover 🕵️"  label muted   │
│  "Salle d'attente"  bold 17px   │
│                                 │
│  CODE DE LA SALLE               │
│  ┌──────────────────────────┐   │
│  │  X   K   Z   P           │   │  ← chaque lettre animée popIn
│  └──────────────────────────┘   │
│  "Partagez ce code avec vos amis"│
└─────────────────────────────────┘
│  [Bannière corail pulse]        │  ← bg: coral gradient, marginTop:-1
│  "● 3 joueurs connectés ✓"      │
└─────────────────────────────────┘
```

Le fond de la page reste `#FAFAF8`. Seul le **header** a le gradient du jeu.

### Avatar Joueur

```tsx
// Cercle coloré avec emoji animal
<div style={{
  width: 64, height: 64,
  borderRadius: '50%',
  background: AVATAR_COLORS[index % 6],
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 30,
  boxShadow: `0 6px 20px ${AVATAR_COLORS[index % 6]}66`,
  border: '3px solid rgba(255,255,255,0.8)',
  position: 'relative',
}}>
  {AVATAR_EMOJIS[hash(username) % AVATAR_EMOJIS.length]}
  {/* Point vert "connecté" */}
  <div style={{
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: '50%',
    background: '#00E676', border: '2px solid #FFF',
  }}/>
</div>
```

Slot vide (place disponible) :
```tsx
<div style={{
  width: 64, height: 64, borderRadius: '50%',
  background: '#DDD',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 28, color: '#999', border: '3px solid #DDD',
}}>?</div>
```

### Row Classement

```tsx
<div style={{
  display: 'flex', alignItems: 'center', gap: 12,
  background: '#FFF',
  borderRadius: 16,
  padding: '10px 14px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
}}>
  <div style={{ fontSize:14, fontWeight:900, color:'#999', width:20, textAlign:'center' }}>#{rank}</div>
  <div style={{ width:36, height:36, borderRadius:'50%', background:color,
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
    boxShadow:`0 4px 10px ${color}44` }}>{emoji}</div>
  <div style={{ flex:1, fontSize:14, fontWeight:800, color:'#1A1A2E' }}>{name}</div>
  <div style={{ fontSize:13, fontWeight:900, color:'#FF6035' }}>{score} pts</div>
</div>
```

### Bandeau Info / Avertissement

```tsx
{/* Attente joueurs — violet clair */}
<div style={{
  background: '#F0EDFF',
  borderRadius: 16,
  padding: '14px 16px',
  display: 'flex', alignItems: 'center', gap: 10,
}}>
  <div style={{ fontSize:22, animation:'bounce 1s infinite' }}>⏳</div>
  <div>
    <div style={{ fontSize:13, fontWeight:900, color:'#6A1B9A' }}>En attente de joueurs…</div>
    <div style={{ fontSize:12, fontWeight:600, color:'#9C27B0', opacity:0.8 }}>Il faut au moins 3 joueurs</div>
  </div>
</div>
```

### Confetti (écran de fin)

```tsx
function Confetti() {
  const pieces = React.useMemo(() => {
    const colors = ['#FF6035','#FFD700','#7C4DFF','#00BCD4','#FF4081','#69F0AE','#FF9100']
    return Array.from({length: 32}, (_, i) => ({
      id: i, color: colors[i % colors.length],
      left: Math.random() * 100, size: 7 + Math.random() * 7,
      delay: Math.random() * 3, dur: 2.5 + Math.random() * 2,
      shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'rect',
    }))
  }, [])
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:10}}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:p.left+'%', top:-20,
          width: p.shape==='rect' ? p.size*2 : p.size, height: p.size,
          borderRadius: p.shape==='circle' ? '50%' : p.shape==='square' ? 4 : 2,
          background: p.color,
          animation: `confettiFall ${p.dur}s ${p.delay}s infinite linear`,
        }}/>
      ))}
    </div>
  )
}
```

---

## Thème par Jeu

Chaque jeu déclare ses 3 couleurs dans `src/lib/games/{id}/theme.ts` :

```typescript
export interface GameTheme {
  gradient: string        // gradient CSS pour la carte et le header lobby
  primary: string         // couleur principale (hex)
  light: string           // couleur claire (hex) — pour les blobs décoratifs
  emoji: string           // emoji affiché en flottant sur la carte
  floatAnimation: string  // 'float' | 'floatB' | 'floatC'
  badge: string           // texte du badge joueurs
}

// Exemples
export const UNDERCOVER_THEME: GameTheme = {
  gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 50%, #CE93D8 100%)',
  primary: '#9C27B0', light: '#CE93D8',
  emoji: '🕵️', floatAnimation: 'float',
  badge: '3–10 joueurs',
}

export const ELDU_THEME: GameTheme = {
  gradient: 'linear-gradient(135deg, #E65100 0%, #FF6035 50%, #FFAB76 100%)',
  primary: '#FF6035', light: '#FFAB76',
  emoji: '🏆', floatAnimation: 'floatB',
  badge: '2 joueurs + 1 arbitre',
}

export const TOKTIK_THEME: GameTheme = {
  gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)',
  primary: '#2E7D32', light: '#66BB6A',
  emoji: '⏱️', floatAnimation: 'floatC',
  badge: '2 joueurs · 1 téléphone',
}
```

---

## Règles Strictes pour les Agents

### Ce qu'il faut TOUJOURS faire
- Font : `Nunito` — ajouter `fontFamily: "'Nunito', sans-serif"` sur tous les composants racine
- Fond de page : `#FAFAF8` — jamais `bg-zinc-950`, jamais `bg-white`
- Texte primaire : `#1A1A2E` — jamais `text-white` sur fond clair
- CTA : gradient `linear-gradient(90deg, #FF6035, #FF8C60)` avec `borderRadius: 20px`
- Bouton ghost : `border: '2.5px solid #FF6035'` (2.5px, pas 1px ou 2px)
- Avatars : cercles colorés avec emoji animal + point vert connecté
- Animations : utiliser les keyframes définis dans `globals.css`

### Ce qu'il ne faut JAMAIS faire
- Utiliser `bg-zinc-*` ou `bg-slate-*` — la palette est basée sur des valeurs hex directes
- Mettre `color: '#FFF'` sur fond `#FAFAF8` — le texte principal est `#1A1A2E`
- Utiliser `rounded-xl` en Tailwind — utiliser des border-radius en px dans les styles inline
- Mettre un fond sombre sur tout l'écran du lobby — seul le header a le gradient du jeu

### Checklist avant de livrer une UI
- [ ] Font Nunito chargée et appliquée
- [ ] Fond `#FAFAF8` sur la page
- [ ] Texte `#1A1A2E` pour le contenu principal
- [ ] Bouton CTA avec gradient corail + ombre
- [ ] Avatars avec emoji + couleur de la liste `AVATAR_COLORS`
- [ ] Animations CSS importées depuis `globals.css`
- [ ] Testé mentalement sur 375px de large

---

## Écarts à Corriger sur l'Existant

Ces éléments du DA ne correspondent pas encore au code actuel :

| Où | Problème | Correction |
|----|----------|------------|
| Toutes les pages | Font Inter | Remplacer par Nunito dans `layout.tsx` |
| Toutes les pages | Fond `bg-zinc-950` (dark) | Remplacer par `#FAFAF8` |
| Page d'accueil | Cartes sans gradient, sans emojis | Implémenter le nouveau design |
| Lobby | Liste de joueurs (initiales) | Avatars avec emojis + couleurs |
| `RoomLobby.tsx` | Pas de header coloré par jeu | Ajouter header avec `GameTheme` |
| Partout | Boutons Tailwind/shadcn | Remplacer par boutons inline-styled |
| `src/app/rooms/join/page.tsx` | `slate` au lieu de la palette DA | Corriger lors du redesign |

---

## Assets Externes

### Icônes 3D
**3dicons.co** — CC0, 1440+ icônes, PNG.
- Télécharger les icônes nécessaires et les mettre dans `public/icons/`
- Nommage : `public/icons/trophy-3d.png`, `public/icons/timer-3d.png`, etc.
- Si l'icône n'existe pas → utiliser l'emoji correspondant avec `font-size: 48-64px`

### Font
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
```
Dans Next.js :
```typescript
import { Nunito } from 'next/font/google'
const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'] })
```
