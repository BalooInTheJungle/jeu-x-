-- Migration: isam questions v2 — full reseed with images (~50 questions)
-- Strategy: clear existing seed data, reinsert all with image_url

DELETE FROM game_isam_questions;

INSERT INTO game_isam_questions (theme, image_url, question_text) VALUES

  -- ── Lifestyle (27 questions) ──────────────────────────────────────────────

  ('lifestyle', 'https://picsum.photos/seed/celebrity-dinner/400/300',
    'Si tu pouvais diner avec une célébrité, ce serait qui ?'),

  ('lifestyle', 'https://picsum.photos/seed/cinema-film/400/300',
    'Quel est ton film préféré de tous les temps ?'),

  ('lifestyle', 'https://picsum.photos/seed/world-travel/400/300',
    'Si tu devais vivre dans un autre pays, lequel choisirais-tu ?'),

  ('lifestyle', 'https://picsum.photos/seed/fear-dark/400/300',
    'Quelle est ta pire peur dans la vie ?'),

  ('lifestyle', 'https://picsum.photos/seed/money-million/400/300',
    'Si tu gagnais 1 million euros demain, tu ferais quoi en premier ?'),

  ('lifestyle', 'https://picsum.photos/seed/laughing-fun/400/300',
    'Quel est le dernier truc qui t''a vraiment fait rire aux larmes ?'),

  ('lifestyle', 'https://picsum.photos/seed/food-plate/400/300',
    'Si tu ne pouvais manger qu''un seul plat pour le reste de ta vie, ce serait quoi ?'),

  ('lifestyle', 'https://picsum.photos/seed/skill-talent/400/300',
    'Quelle compétence inutile tu maitrises a la perfection ?'),

  ('lifestyle', 'https://picsum.photos/seed/time-machine/400/300',
    'Si tu pouvais remonter le temps, tu changerais quoi dans ta vie ?'),

  ('lifestyle', 'https://picsum.photos/seed/animal-nature/400/300',
    'Quel animal te représente le mieux et pourquoi ?'),

  ('lifestyle', 'https://picsum.photos/seed/favorite-place/400/300',
    'C''est quoi ton endroit préféré sur terre ?'),

  ('lifestyle', 'https://picsum.photos/seed/superpower-hero/400/300',
    'Si tu devais choisir un superpouvoir, ce serait lequel ?'),

  ('lifestyle', 'https://picsum.photos/seed/music-anthem/400/300',
    'Quelle chanson tu mettrais en hymne de ta vie ?'),

  ('lifestyle', 'https://picsum.photos/seed/talent-envy/400/300',
    'Si tu pouvais avoir le talent d''une autre personne, ce serait lequel ?'),

  ('lifestyle', 'https://picsum.photos/seed/regret-past/400/300',
    'Quel est ton plus grand regret dans ta vie ?'),

  ('lifestyle', 'https://picsum.photos/seed/emoji-mood/400/300',
    'Si tu devais décrire ton humeur du jour avec un emoji, ce serait lequel ?'),

  ('lifestyle', 'https://picsum.photos/seed/gift-present/400/300',
    'Quel est le cadeau le plus mémorable que tu aies reçu ?'),

  ('lifestyle', 'https://picsum.photos/seed/dream-job/400/300',
    'Quel serait ton job de rêve si l''argent n''existait pas ?'),

  ('lifestyle', 'https://picsum.photos/seed/social-media/400/300',
    'Si tu devais supprimer toutes tes applis sauf une, laquelle tu gardes ?'),

  ('lifestyle', 'https://picsum.photos/seed/morning-routine/400/300',
    'La première chose que tu fais le matin en te levant, c''est quoi ?'),

  ('lifestyle', 'https://picsum.photos/seed/pizza-topping/400/300',
    'Quelle est ta pizza idéale avec toutes les garnitures ?'),

  ('lifestyle', 'https://picsum.photos/seed/holiday-beach/400/300',
    'Vacances de rêve : montagne enneigée ou plage tropicale ?'),

  ('lifestyle', 'https://picsum.photos/seed/childhood-memory/400/300',
    'Quel est ton meilleur souvenir d''enfance ?'),

  ('lifestyle', 'https://picsum.photos/seed/series-tv/400/300',
    'Quelle série tu pourrais regarder en boucle toute ta vie ?'),

  ('lifestyle', 'https://picsum.photos/seed/sport-hobby/400/300',
    'Si tu devais faire un sport de haut niveau, lequel ce serait ?'),

  ('lifestyle', 'https://picsum.photos/seed/late-night/400/300',
    'C''est quoi ton vice nocturne, ce que tu fais quand tu devrais dormir ?'),

  ('lifestyle', 'https://picsum.photos/seed/future-self/400/300',
    'Dans 10 ans, tu te vois faire quoi ?'),

  -- ── Brawl Stars (20 questions) ────────────────────────────────────────────

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/shelly/portrait.png',
    'Quel est ton brawler favori et pourquoi ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/dynamike/portrait.png',
    'Quel brawler tu trouves le plus nul du jeu ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/el-primo/portrait.png',
    'Si tu étais un brawler, tu serais lequel ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/leon/portrait.png',
    'Quel est le brawler le plus cheaté selon toi ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/colt/portrait.png',
    'Quelle est ta meilleure map Brawl Stars ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/spike/portrait.png',
    'Quel brawler tu détestes affronter le plus ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/crow/portrait.png',
    'Quel est ton skin Brawl Stars préféré ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/mortis/portrait.png',
    'Tu joues plutot solo ou en équipe sur Brawl Stars ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/brock/portrait.png',
    'Quel brawler tu refuses de jouer même s''il est fort ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/edgar/portrait.png',
    'Quel brawler symbolise le mieux ta personnalité ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/sandy/portrait.png',
    'Quel est le brawler que tu sors quand tu veux vraiment gagner ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/piper/portrait.png',
    'Quel brawler tu penses être sous-estimé par la communauté ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/sprout/portrait.png',
    'Si tu pouvais créer ton propre brawler, son attaque ferait quoi ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/gale/portrait.png',
    'Quel est ton mode de jeu préféré pour pousser des trophées ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/max/portrait.png',
    'Quel brawler tu recommanderais a quelqu''un qui débute ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/nita/portrait.png',
    'Quel est le meilleur duo de brawlers selon toi ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/poco/portrait.png',
    'Quel brawler tu trouves le plus fun a jouer même quand tu perds ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/8bit/portrait.png',
    'Tu préfères attaquer ou défendre dans Brawl Stars ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/gene/portrait.png',
    'Quel évènement ou mode limité Brawl Stars tu aimerais revoir ?'),

  ('brawl_stars', 'https://cdn.brawlapi.com/brawlers/bibi/portrait.png',
    'Quel mode de jeu Brawl Stars tu joues le plus souvent ?')

;
