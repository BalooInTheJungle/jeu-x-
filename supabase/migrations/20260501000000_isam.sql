-- Migration: isam initial

CREATE TABLE IF NOT EXISTS game_isam_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme         TEXT NOT NULL CHECK (theme IN ('brawl_stars', 'lifestyle')),
  image_url     TEXT,
  question_text TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_isam_questions_theme ON game_isam_questions(theme);

ALTER TABLE game_isam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read isam questions" ON game_isam_questions
  FOR SELECT USING (true);

-- Seed de développement — 20+ entrées réalistes
INSERT INTO game_isam_questions (theme, image_url, question_text) VALUES
  -- Lifestyle (12 questions)
  ('lifestyle', NULL, 'Si tu pouvais diner avec une célébrité, ce serait qui ?'),
  ('lifestyle', NULL, 'Quel est ton film préféré de tous les temps ?'),
  ('lifestyle', NULL, 'Si tu devais vivre dans un autre pays, lequel choisirais-tu ?'),
  ('lifestyle', NULL, 'Quelle est ta pire peur dans la vie ?'),
  ('lifestyle', NULL, 'Si tu gagnais 1 million d''euros demain, tu ferais quoi en premier ?'),
  ('lifestyle', NULL, 'Quel est le dernier truc qui t''a vraiment fait rire aux larmes ?'),
  ('lifestyle', NULL, 'Si tu ne pouvais manger qu''un seul plat pour le reste de ta vie, ce serait quoi ?'),
  ('lifestyle', NULL, 'Quelle compétence inutile tu maîtrises à la perfection ?'),
  ('lifestyle', NULL, 'Si tu pouvais remonter le temps, tu changerais quoi dans ta vie ?'),
  ('lifestyle', NULL, 'Quel animal te représente le mieux et pourquoi ?'),
  ('lifestyle', NULL, 'C''est quoi ton endroit préféré sur terre ?'),
  ('lifestyle', NULL, 'Si tu devais choisir un superpouvoir, ce serait lequel ?'),

  -- Brawl Stars (10 questions)
  ('brawl_stars', NULL, 'Quel est ton brawler favori et pourquoi ?'),
  ('brawl_stars', NULL, 'Quel mode de jeu Brawl Stars tu joues le plus ?'),
  ('brawl_stars', NULL, 'Quel brawler tu trouves le plus nul du jeu ?'),
  ('brawl_stars', NULL, 'Si tu étais un brawler, tu serais lequel ?'),
  ('brawl_stars', NULL, 'Quel est le brawler le plus cheaté selon toi ?'),
  ('brawl_stars', NULL, 'Quelle est ta meilleure map Brawl Stars ?'),
  ('brawl_stars', NULL, 'Quel brawler tu détestes affronter le plus ?'),
  ('brawl_stars', NULL, 'Quel est ton skin Brawl Stars préféré ?'),
  ('brawl_stars', NULL, 'Tu joues plutot solo ou en équipe sur Brawl Stars ?'),
  ('brawl_stars', NULL, 'Quel brawler tu te refuses à jouer, même s''il est fort ?'),

  -- Mix supplémentaire lifestyle
  ('lifestyle', NULL, 'Quelle chanson tu mettrais en hymne de ta vie ?'),
  ('lifestyle', NULL, 'Si tu pouvais avoir le talent d''une autre personne, ce serait lequel ?'),
  ('lifestyle', NULL, 'Quel est ton plus grand regret jusqu''ici ?'),
  ('lifestyle', NULL, 'Si tu devais décrire ton humeur d''aujourd''hui avec un emoji, ce serait lequel ?'),
  ('lifestyle', NULL, 'Quel est le cadeau le plus mémorable que tu aies reçu ?')
;
