-- Renommage image_quiz → eldu
-- À appliquer dans le dashboard Supabase → SQL Editor

ALTER TABLE game_image_quiz_questions RENAME TO game_eldu_questions;

DROP INDEX IF EXISTS idx_image_quiz_theme;
CREATE INDEX IF NOT EXISTS idx_eldu_theme ON game_eldu_questions(theme);
