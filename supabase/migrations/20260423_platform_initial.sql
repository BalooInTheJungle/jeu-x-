-- Migration : Tables plateforme initiales
-- Date      : 2026-04-23
-- Scope     : platform (rooms, room_players, player_actions)
-- Auteur    : Claude Code
--
-- Ces 3 tables sont le coeur de la plateforme.
-- JAMAIS modifiées par un jeu — les jeux ont leurs propres tables préfixées game_{id}_

-- ─── FONCTION : code de room unique ──────────────────────────────────────────
-- Génère un code à 4 lettres (sans I et O pour éviter les confusions visuelles)

CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS CHAR(4) AS $$
DECLARE
  chars    TEXT   := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  new_code CHAR(4);
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

-- ─── FONCTION : updated_at automatique ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── TABLE : rooms ────────────────────────────────────────────────────────────
-- Une room = une partie en cours ou terminée
-- rooms.state est la source de vérité du jeu — Realtime s'abonne à cette table

CREATE TABLE IF NOT EXISTS rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       CHAR(4) UNIQUE NOT NULL DEFAULT generate_room_code(),
  game_type  VARCHAR(50) NOT NULL,
  status     TEXT NOT NULL DEFAULT 'waiting'
               CHECK (status IN ('waiting', 'playing', 'finished')),
  config     JSONB NOT NULL DEFAULT '{}',  -- config choisie par le host
  state      JSONB NOT NULL DEFAULT '{}',  -- état courant du jeu (round, scores, roundData...)
  host_id    UUID,                          -- FK vers room_players.id (ajouté après)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()     -- mis à jour à chaque action → déclenche Realtime
);

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TABLE : room_players ─────────────────────────────────────────────────────
-- Un joueur dans une room — anonyme en V1 (pas de compte, juste un pseudo)

CREATE TABLE IF NOT EXISTS room_players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username     VARCHAR(20) NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  is_host      BOOLEAN NOT NULL DEFAULT false,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  joined_at    TIMESTAMPTZ DEFAULT NOW()
);

-- FK host_id ajoutée ici pour éviter la référence circulaire
ALTER TABLE rooms
  ADD CONSTRAINT rooms_host_id_fkey
  FOREIGN KEY (host_id) REFERENCES room_players(id) ON DELETE SET NULL;

-- ─── TABLE : player_actions ───────────────────────────────────────────────────
-- Chaque réponse/action d'un joueur pendant un round
-- submitted_at est utilisé pour le calcul du bonus de vitesse

CREATE TABLE IF NOT EXISTS player_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  round_number  INTEGER NOT NULL CHECK (round_number > 0),
  payload       JSONB NOT NULL,           -- contenu spécifique au jeu (réponse, vote...)
  submitted_at  TIMESTAMPTZ DEFAULT NOW() -- horodatage = base du scoring vitesse
);

-- ─── INDEX ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rooms_code          ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status        ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room   ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_room ON player_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_player ON player_actions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_round ON player_actions(room_id, round_number);

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
-- V1 : auth anonyme — les lectures sont publiques
-- Les écritures passent par les API routes Next.js (clé service_role, bypass RLS)

ALTER TABLE rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_actions ENABLE ROW LEVEL SECURITY;

-- Lecture publique (nécessaire pour Realtime et le chargement initial)
CREATE POLICY "rooms_select_all"          ON rooms          FOR SELECT USING (true);
CREATE POLICY "room_players_select_all"   ON room_players   FOR SELECT USING (true);
CREATE POLICY "player_actions_select_all" ON player_actions FOR SELECT USING (true);

-- Écriture bloquée pour anon — passe par service_role côté serveur
-- (pas de policy INSERT/UPDATE/DELETE = refusé par défaut pour anon)

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
-- Active le Realtime (WebSocket gratuit) sur les tables clés.
-- NE PAS confondre avec "Database → Replication" (Read Replicas, payant).

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
