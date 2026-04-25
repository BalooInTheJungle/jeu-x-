-- Table des questions Image Quiz
-- À appliquer dans le dashboard Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS game_image_quiz_questions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  theme      TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  image_url  TEXT        NOT NULL,
  difficulty TEXT        NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT game_image_quiz_questions_image_url_unique UNIQUE (image_url)
);

CREATE INDEX IF NOT EXISTS idx_image_quiz_theme ON game_image_quiz_questions(theme);

ALTER TABLE game_image_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Lecture publique (les images et thèmes sont publics, les réponses ne sont lues que server-side)
CREATE POLICY "Public read image_quiz" ON game_image_quiz_questions
  FOR SELECT TO anon, authenticated USING (true);
