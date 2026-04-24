-- Table des paires de mots pour le jeu Undercover
CREATE TABLE IF NOT EXISTS game_undercover_word_pairs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  theme text NOT NULL,
  civil_word text NOT NULL,
  undercover_word text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_undercover_word_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "word_pairs_select" ON game_undercover_word_pairs
  FOR SELECT USING (true);

-- Seed : paires de mots classées par thème
INSERT INTO game_undercover_word_pairs (theme, civil_word, undercover_word) VALUES
-- Général
('general', 'Pizza',           'Tarte'),
('general', 'Chat',            'Renard'),
('general', 'Plage',           'Piscine'),
('general', 'Guitare',         'Violon'),
('general', 'Savon',           'Shampooing'),
('general', 'Bus',             'Tramway'),
('general', 'Café',            'Thé'),
('general', 'Forêt',           'Jungle'),
('general', 'Château fort',    'Palais'),
('general', 'Tigre',           'Lion'),
('general', 'Football',        'Rugby'),
('general', 'Cinéma',          'Théâtre'),
-- One Piece
('one_piece', 'Fruit du Démon',   'Fruit du Diable'),
('one_piece', 'Barbe Noire',      'Barbe Blanche'),
('one_piece', 'Sunny',            'Merry'),
('one_piece', 'Garp',             'Sengoku'),
('one_piece', 'Zoro',             'Mihawk'),
('one_piece', 'Nami',             'Robin'),
('one_piece', 'Shanks',           'Baggy'),
('one_piece', 'Boa Hancock',      'Nefertari Vivi'),
('one_piece', 'Marine',           'Corsaire'),
('one_piece', 'Île Sabaody',      'Fish-Man Island'),
-- Brawl Stars
('brawl_stars', 'Shelly',       'Colt'),
('brawl_stars', 'Bull',         'El Primo'),
('brawl_stars', 'Spike',        'Leon'),
('brawl_stars', 'Frank',        'Bibi'),
('brawl_stars', 'Mortis',       'Crow'),
('brawl_stars', 'Gem Grab',     'Heist'),
('brawl_stars', 'Brawl Ball',   'Hot Zone'),
('brawl_stars', 'Gadget',       'Star Power'),
('brawl_stars', 'Trophy Road',  'Power League');
