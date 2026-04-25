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

interface BrawlerRaw {
  name: string
  imageUrl2: string
  released: boolean
}

async function seedBrawlStars() {
  console.log('[seed-image-quiz] Fetching Brawl Stars brawlers from api.brawlapi.com...')
  const res = await fetch('https://api.brawlapi.com/v1/brawlers')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json() as { list: BrawlerRaw[] }

  const questions = data.list
    .filter(b => b.released && b.imageUrl2)
    .map(b => ({
      theme: 'brawl_stars',
      answer: b.name,
      image_url: b.imageUrl2,
      difficulty: 'easy',
    }))

  console.log(`[seed-image-quiz] Inserting ${questions.length} brawlers...`)

  const { error } = await supabase
    .from('game_image_quiz_questions')
    .upsert(questions, { onConflict: 'image_url' })

  if (error) {
    console.error('[seed-image-quiz] Error:', error)
    process.exit(1)
  }

  console.log(`[seed-image-quiz] Done! ${questions.length} brawlers seeded.`)
}

seedBrawlStars().catch(err => {
  console.error('[seed-image-quiz] Fatal:', err)
  process.exit(1)
})
