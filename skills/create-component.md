# ⚛️ SKILL : create-component

> **Usage :** Appelle ce skill avant de créer un composant React.
> Conventions du projet — court par défaut, détaillé si le composant est complexe.

---

## Règles Essentielles

**Server Component par défaut — Client Component seulement si nécessaire.**

```typescript
// ✅ Server Component (pas de directive — c'est le défaut)
export default function Scoreboard({ roomId }: { roomId: string }) {
  // Peut faire des appels Supabase directement
  // Pas de useState, useEffect, event handlers
}

// ✅ Client Component (directive obligatoire en haut)
"use client"
export default function AnswerInput({ onSubmit }: { onSubmit: (v: string) => void }) {
  // Peut avoir useState, useEffect, event handlers
  // Ne peut PAS faire d'appels Supabase server-side
}
```

**Quand utiliser `"use client"` :**
- Le composant a du `useState` ou `useReducer`
- Le composant a des event handlers (`onClick`, `onChange`, `onSubmit`)
- Le composant utilise des hooks custom avec état
- Le composant s'abonne à Supabase Realtime

**Quand garder Server Component :**
- Affichage de données statiques ou chargées une fois
- Pas d'interactivité utilisateur directe

---

## Structure d'un Composant

```typescript
// src/components/[platform|games/game-id]/NomDuComposant.tsx

import { type FC } from 'react'
import { cn } from '@/lib/utils'  // Pour combiner les classes Tailwind

// Types en haut du fichier, toujours explicites
interface NomDuComposantProps {
  // Chaque prop documentée si non-évidente
  roomId: string
  /** Score actuel du joueur — peut être null si pas encore joué */
  score: number | null
  className?: string  // Toujours accepter className pour la flexibilité
}

/**
 * [Description courte de ce que fait le composant]
 * Utilisé dans : [où ce composant est utilisé]
 */
export default function NomDuComposant({ roomId, score, className }: NomDuComposantProps) {
  return (
    <div className={cn('...classes de base...', className)}>
      {/* contenu */}
    </div>
  )
}
```

---

## Conventions Tailwind

```typescript
// ✅ Classes utilitaires Tailwind directement
<div className="flex items-center gap-4 p-6 rounded-xl bg-slate-900">

// ✅ cn() pour les classes conditionnelles
<div className={cn(
  'base classes',
  isActive && 'active classes',
  className  // toujours en dernier
)}>

// ❌ Pas de styles inline sauf exception justifiée
<div style={{ color: 'red' }}>  // non

// ❌ Pas de CSS modules dans ce projet
import styles from './Component.module.css'  // non
```

---

## Composants Spécifiques aux Jeux

Les composants de jeu vivent dans `src/components/games/[game-id]/`.

Chaque jeu doit avoir au minimum ces 3 composants :

**`ConfigForm.tsx`** — formulaire de config avant la partie
- Utilise les composants shadcn/ui : `Select`, `Slider`, `Switch`, `Button`
- Chaque option a un label clair et une description si pas évidente
- `"use client"` obligatoire (formulaire interactif)

**`GameView.tsx`** — vue principale pendant le jeu
- Orchestre `RoundDisplay`, `Timer`, et le feedback
- Gère les états : `playing`, `round_end`, `finished`
- `"use client"` obligatoire (Realtime + state)

**`RoundDisplay.tsx`** — affichage d'un round
- Mobile-first : fonctionne sur 375px de large minimum
- Input de réponse centré et accessible
- Feedback immédiat quand la réponse est soumise

---

## Cas Complexes — Composants avec Realtime

```typescript
"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LiveScoreboard({ roomId }: { roomId: string }) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    // Chargement initial
    supabase
      .from('room_players')
      .select('username, score')
      .eq('room_id', roomId)
      .then(({ data }) => {
        if (data) setScores(Object.fromEntries(data.map(p => [p.username, p.score])))
      })

    // Subscription Realtime
    const channel = supabase
      .channel(`scores:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const p = payload.new as { username: string; score: number }
        setScores(prev => ({ ...prev, [p.username]: p.score }))
      })
      .subscribe()

    // Nettoyage obligatoire
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  // ...render
}
```