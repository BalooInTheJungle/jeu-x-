# 🚨 ERRORS — Bugs Connus & Solutions

> **Ce fichier évite de résoudre deux fois le même problème.**
> Chaque bug résolu est documenté ici avec sa solution exacte.
> Claude Code consulte ce fichier en premier quand il y a un bug.
>
> Mis à jour automatiquement par l'agent DEBUG après chaque résolution.

---

## Comment Lire Ce Fichier

Cherche le symptôme que tu vois (message d'erreur, comportement bizarre).
Si c'est là → applique la solution directement, pas besoin de débugger.
Si c'est pas là → c'est un nouveau bug, utilise l'agent DEBUG.

---

## Format d'une Entrée

```
### [Titre court — symptôme visible]
**Date :** JJ/MM/AAAA
**Contexte :** Dans quel situation ce bug apparaît
**Symptôme :** Ce qu'on voit (message d'erreur exact si possible)
**Cause :** Pourquoi ça arrive
**Solution :** Les étapes exactes pour régler le problème
**Prévention :** Comment éviter que ça revienne
```

---

## Erreurs Rencontrées en Session

---

### Variable PL/pgSQL ambiguë avec nom de colonne
**Date :** 23/04/2026
**Contexte :** Fonction SQL `generate_room_code()` dans la migration initiale
**Symptôme :** `ERROR: 42702: column reference "code" is ambiguous` au premier INSERT dans `rooms`
**Cause :** La variable locale `code CHAR(4)` a le même nom que la colonne `rooms.code` — PostgreSQL ne sait pas laquelle choisir dans `WHERE rooms.code = code`
**Solution :** Renommer la variable locale en `new_code`
```sql
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS CHAR(4) AS $$
DECLARE
  chars    TEXT   := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  new_code CHAR(4);   -- ← était "code", conflit avec la colonne
  taken    BOOLEAN;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..4 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM rooms WHERE rooms.code = new_code) INTO taken;
    EXIT WHEN NOT taken;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```
**Prévention :** Préfixer les variables PL/pgSQL avec `v_` ou choisir un nom distinct des colonnes

---

### PGRST201 — Relation ambiguë Supabase
**Date :** 23/04/2026
**Contexte :** Requête `select('*, room_players(*)')` quand il existe deux FK entre `rooms` et `room_players`
**Symptôme :** `Could not embed because more than one relationship was found for 'rooms' and 'room_players'`
**Cause :** Il y a deux FK : `room_players.room_id → rooms.id` ET `rooms.host_id → room_players.id`. PostgREST ne sait pas laquelle utiliser pour le join.
**Solution :** Utiliser le nom explicite de la FK dans la requête
```typescript
// ❌ Ambigu
supabase.from('rooms').select('*, room_players(*)')

// ✅ Explicite
supabase.from('rooms').select('*, room_players!room_players_room_id_fkey(*)')
```
**Prévention :** Dès qu'il y a plusieurs FK entre deux tables, toujours utiliser la syntaxe `table!fk_name`

---

### Next.js 14 met en cache les requêtes Supabase (données figées)
**Date :** 23/04/2026
**Contexte :** Page `/rooms/[code]` — la liste des joueurs ne se met pas à jour après un `router.refresh()`
**Symptôme :** `getRoom` retourne toujours les mêmes données même après de nouveaux INSERTs en DB
**Cause :** Next.js 14 App Router patche le `fetch` global et met en cache les résultats. Le SDK Supabase utilise `fetch` en interne → résultats mis en cache.
**Solution :** Ajouter `export const dynamic = 'force-dynamic'` dans le fichier `page.tsx` de la route concernée
```typescript
// src/app/rooms/[code]/page.tsx
export const dynamic = 'force-dynamic'
```
**Prévention :** Toute page qui affiche des données temps réel doit avoir `force-dynamic`

---

### Race condition : joueur absent de sa propre liste au chargement
**Date :** 23/04/2026
**Contexte :** Après `joinRoom`, le joueur est redirigé vers `/rooms/[code]` mais ne se voit pas dans la liste
**Symptôme :** L'hôte voit le nouveau joueur (via Realtime), mais le joueur lui-même ne se voit pas
**Cause :** Le SSR de la page tourne une fraction de seconde avant que le `INSERT` soit visible en DB. L'event Realtime est déjà passé avant que le joueur s'abonne.
**Solution :** Dans `RoomLobbyClient`, détecter si le joueur courant est absent de la liste initiale et faire un `router.refresh()` (une seule fois via `useRef`)
```typescript
const hasRefreshed = useRef(false)
useEffect(() => {
  const id = localStorage.getItem(`player_${room.code}`)
  setCurrentPlayerId(id)
  if (id && !room.room_players.find((p) => p.id === id) && !hasRefreshed.current) {
    hasRefreshed.current = true
    router.refresh()
  }
}, [room.code, room.room_players, router])
```
**Prévention :** Combiner avec `force-dynamic` pour que le refresh retourne bien des données fraîches

---

## Erreurs Courantes Supabase

---

### Row Level Security bloque silencieusement les requêtes
**Date :** À compléter si rencontré
**Contexte :** Une requête Supabase ne retourne rien alors que les données existent
**Symptôme :** `data` est un tableau vide `[]` sans erreur, ou `null`
**Cause :** RLS est activé sur la table mais aucune policy n'autorise la lecture pour cet utilisateur/contexte
**Solution :**
```sql
-- Dans le dashboard Supabase > SQL Editor
-- Vérifie les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'nom_de_ta_table';

-- Si manquante, ajoute la policy de lecture publique
CREATE POLICY "read_all" ON nom_de_ta_table
  FOR SELECT USING (true);
```
**Prévention :** Toujours inclure au minimum une policy SELECT dans chaque migration

---

### Realtime ne reçoit pas les updates
**Date :** À compléter si rencontré
**Contexte :** Le composant est abonné mais ne reçoit pas les changements en temps réel
**Symptôme :** Les données ne se mettent pas à jour sans recharger la page
**Cause (1) :** Realtime n'est pas activé sur la table dans le dashboard Supabase
**Cause (2) :** Le filtre du channel ne correspond pas à la valeur réelle
**Cause (3) :** Le cleanup de l'useEffect supprime le channel trop tôt
**Solution :**
```
1. Dashboard Supabase > Database > Replication
2. Activer "Realtime" sur la table concernée
3. Vérifier le filtre : filter: `room_id=eq.${roomId}` (pas de guillemets autour de la valeur)
4. Vérifier le cleanup : return () => { supabase.removeChannel(channel) }
```
**Prévention :** Checklist dans le skill create-component pour les composants Realtime

---

## Erreurs Courantes TypeScript / Next.js

---

### "Cannot find module '@/...'" en production
**Date :** À compléter si rencontré
**Contexte :** `npm run dev` marche mais `npm run build` échoue
**Symptôme :** `Cannot find module '@/lib/...'` ou `Module not found`
**Cause :** Le path alias `@/` n'est pas correctement configuré dans `tsconfig.json`
**Solution :**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
**Prévention :** Vérifier tsconfig.json lors de l'initialisation du projet

---

### Hydration mismatch error
**Date :** À compléter si rencontré
**Contexte :** Erreur dans la console du navigateur au chargement
**Symptôme :** `Error: Hydration failed because the initial UI does not match what was rendered on the server`
**Cause :** Un composant Server et son équivalent Client affichent des choses différentes (souvent à cause de l'heure, d'un random, ou d'une valeur du localStorage)
**Solution :**
```typescript
// Option A — Passer la valeur en prop depuis le Server Component
// Option B — Utiliser useEffect pour la valeur côté client seulement
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null  // ou un skeleton
```
**Prévention :** Ne pas utiliser `Date.now()`, `Math.random()`, ou `localStorage` directement dans le render

---

## Erreurs Courantes Logique de Jeu

---

### Les scores ne se mettent pas à jour en temps réel
**Date :** À compléter si rencontré
**Contexte :** Les joueurs répondent mais le scoreboard reste figé
**Symptôme :** Le score s'affiche correctement après un refresh de page mais pas en live
**Cause :** Le composant Scoreboard est un Server Component et ne s'abonne pas aux updates
**Solution :** Passer le composant en Client Component avec subscription Realtime (voir skill create-component, section "Composants avec Realtime")
**Prévention :** Tout composant qui affiche des données qui changent pendant la partie doit être `"use client"` avec Realtime

---

*Les prochaines erreurs résolues seront ajoutées ici par l'agent DEBUG.*