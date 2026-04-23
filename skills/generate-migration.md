# 🗄️ SKILL : generate-migration

> **Usage :** Appelle ce skill avant d'écrire une migration SQL.
> Il garantit que chaque migration est propre, sûre, et compatible avec Supabase.

---

## Règles Essentielles (toujours appliquées)

**Nommage du fichier :**
```
supabase/migrations/YYYYMMDD_[game_id]_[description].sql
Exemple : 20240115_flag_quiz_initial.sql
          20240120_flag_quiz_add_difficulty.sql
```

**Structure obligatoire de chaque migration :**
```sql
-- Migration : [description courte]
-- Date : [date]
-- Jeu : [game_id] (ou "platform" si table commune)
-- Auteur : Claude Code

-- ─── TABLES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_{id}_[nom] (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... colonnes ...
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEX ────────────────────────────────────────────────
-- (seulement sur les colonnes vraiment filtrées)

-- ─── RLS ──────────────────────────────────────────────────
ALTER TABLE game_{id}_[nom] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[nom]_read_all" ON game_{id}_[nom]
  FOR SELECT USING (true);

-- ─── SEED (développement) ─────────────────────────────────
-- Minimum 10 entrées réalistes pour pouvoir tester
```

---

## Checklist Avant de Livrer une Migration

- [ ] Nom de fichier avec date et description
- [ ] `CREATE TABLE IF NOT EXISTS` (pas de `CREATE TABLE`)
- [ ] Préfixe `game_{id}_` sur toutes les tables du jeu
- [ ] `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` sur chaque table
- [ ] `created_at TIMESTAMPTZ DEFAULT NOW()` sur chaque table
- [ ] RLS activé + au moins une policy SELECT
- [ ] Index sur les colonnes filtrées fréquemment
- [ ] Données de seed incluses (minimum 10 lignes)
- [ ] Pas de `DROP TABLE` ou `DELETE FROM` dans une migration initiale

---

## Cas Complexes — Détails Supplémentaires

### Ajouter une colonne à une table existante
```sql
-- Toujours avec IF NOT EXISTS pour éviter les erreurs si re-run
ALTER TABLE game_{id}_questions
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT DEFAULT 1;

-- Mettre à jour les lignes existantes si besoin
UPDATE game_{id}_questions
  SET difficulty = 1
  WHERE difficulty IS NULL;
```

### Migration avec données calculées
```sql
-- D'abord la structure
ALTER TABLE game_{id}_questions ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- Ensuite les données (dans la même migration)
UPDATE game_{id}_questions
  SET aliases = ARRAY['variante1', 'variante2']
  WHERE answer = 'Exemple';
```

### Rollback (à documenter dans un commentaire)
```sql
-- ROLLBACK (à exécuter manuellement si besoin) :
-- DROP TABLE IF EXISTS game_{id}_[nom];
```

---

## Ce Que Supabase Gère Automatiquement

Ne pas recréer ces choses — elles existent déjà :
- L'extension `uuid-ossp`
- Les tables `auth.users`
- Les tables `rooms`, `room_players`, `player_actions` (tables plateforme)
- Le trigger `update_updated_at` (si déjà créé dans une migration précédente)