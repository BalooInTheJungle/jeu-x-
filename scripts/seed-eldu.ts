import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Brawl Stars ──────────────────────────────────────────────────────────────

interface BrawlerRaw { name: string; imageUrl2: string; released: boolean }

async function seedBrawlStars() {
  console.log('[seed-eldu] 🎮 Brawl Stars — fetching...')
  const res = await fetch('https://api.brawlapi.com/v1/brawlers')
  const data = await res.json() as { list: BrawlerRaw[] }

  const questions = data.list
    .filter(b => b.released && b.imageUrl2)
    .map(b => ({ theme: 'brawl_stars', answer: b.name, image_url: b.imageUrl2, difficulty: 'easy' }))

  const { error } = await supabase.from('game_eldu_questions').upsert(questions, { onConflict: 'image_url' })
  if (error) throw error
  console.log(`[seed-eldu] 🎮 Brawl Stars — ${questions.length} brawlers insérés`)
}

// ─── Drapeaux ─────────────────────────────────────────────────────────────────

interface CountryRaw { name: { common: string }; flags: { png: string } }

async function seedFlags() {
  console.log('[seed-eldu] 🌍 Drapeaux — fetching...')
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags')
  const data = await res.json() as CountryRaw[]

  const questions = data
    .filter(c => c.flags?.png && c.name?.common)
    .map(c => ({ theme: 'flags', answer: c.name.common, image_url: c.flags.png, difficulty: 'easy' }))

  const { error } = await supabase.from('game_eldu_questions').upsert(questions, { onConflict: 'image_url' })
  if (error) throw error
  console.log(`[seed-eldu] 🌍 Drapeaux — ${questions.length} pays insérés`)
}

// ─── Rappeurs FR ──────────────────────────────────────────────────────────────

const RAPPERS_FR = [
  'PNL', 'Booba', 'Jul', 'Ninho', 'SCH', 'Damso', 'Freeze Corleone', 'Kaaris',
  'Gazo', 'Hamza', 'Naza', 'Lomepal', 'Sofiane', 'Maes', 'Nekfeu', 'Dosseh',
  'Gradur', 'Dinos', 'Heuss Lenfoiré', 'Tiakola', 'Koba LaD', 'La Fouine',
  'Rim K', 'Rohff', 'Lacrim', 'Mac Tyer', 'Oxmo Puccino', 'Youssoupha',
  'Bigflo Oli', 'Siboy', 'Guy2Bezbar', 'Zola', 'Imen ES', 'Alkpote',
]

interface DeezerArtist { name: string; picture_medium: string }
interface DeezerResponse { data: DeezerArtist[] }

async function seedRappersFr() {
  console.log('[seed-eldu] 🎤 Rappeurs FR — fetching...')
  const questions: { theme: string; answer: string; image_url: string; difficulty: string }[] = []

  for (const name of RAPPERS_FR) {
    try {
      const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`)
      const data = await res.json() as DeezerResponse
      const artist = data.data?.[0]
      if (artist?.picture_medium && !artist.picture_medium.includes('default')) {
        questions.push({ theme: 'rappers_fr', answer: name, image_url: artist.picture_medium, difficulty: 'easy' })
      }
    } catch {
      console.warn(`[seed-eldu] ⚠️ Skipping ${name}`)
    }
    // Petite pause pour ne pas saturer l'API Deezer
    await new Promise(r => setTimeout(r, 200))
  }

  const { error } = await supabase.from('game_eldu_questions').upsert(questions, { onConflict: 'image_url' })
  if (error) throw error
  console.log(`[seed-eldu] 🎤 Rappeurs FR — ${questions.length} rappeurs insérés`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const theme = process.argv[2]

  if (!theme || theme === 'all') {
    await seedBrawlStars()
    await seedFlags()
    await seedRappersFr()
  } else if (theme === 'brawl_stars') {
    await seedBrawlStars()
  } else if (theme === 'flags') {
    await seedFlags()
  } else if (theme === 'rappers_fr') {
    await seedRappersFr()
  } else {
    console.error(`Thème inconnu: ${theme}. Options: brawl_stars | flags | rappers_fr | all`)
    process.exit(1)
  }

  console.log('[seed-eldu] ✅ Terminé')
}

main().catch(err => {
  console.error('[seed-eldu] Fatal:', err)
  process.exit(1)
})
