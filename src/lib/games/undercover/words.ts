import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export interface WordPair {
  civil: string
  undercover: string
}

export async function generateWordPair(theme: string, usedPairs: string[] = []): Promise<WordPair> {
  console.log('[generateWordPair] input:', { theme, usedCount: usedPairs.length })
  try {
    const pair = await generateFromLLM(theme, usedPairs)
    console.log('[generateWordPair] result (LLM):', pair)
    return pair
  } catch (err) {
    console.error('[generateWordPair] LLM failed, using DB fallback:', err)
    return generateFromDB(theme, usedPairs)
  }
}

async function generateFromLLM(theme: string, usedPairs: string[]): Promise<WordPair> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const themeLabels: Record<string, string> = {
    general: 'culture générale (objets, lieux, animaux du quotidien)',
    one_piece: 'l\'univers du manga One Piece',
    brawl_stars: 'l\'univers du jeu mobile Brawl Stars',
  }
  const themeLabel = themeLabels[theme] ?? theme

  const avoidList = usedPairs.length > 0
    ? `\nMots déjà utilisés à éviter : ${usedPairs.join(', ')}`
    : ''

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Tu génères une paire de mots pour le jeu Undercover. Thème : ${themeLabel}.${avoidList}

Règles :
- Les deux mots doivent être proches mais pas identiques (ex: Pizza / Tarte, Chat / Renard, Barbe Noire / Barbe Blanche)
- Ils doivent être de la même catégorie ou du même univers
- Évite les mots trop faciles à distinguer
- Réponds UNIQUEMENT avec du JSON, rien d'autre

Format exact : {"civil":"mot1","undercover":"mot2"}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(text.trim()) as { civil: string; undercover: string }

  if (!parsed.civil || !parsed.undercover) throw new Error('Format LLM invalide')
  return parsed
}

async function generateFromDB(theme: string, usedPairs: string[]): Promise<WordPair> {
  console.log('[generateFromDB] input:', { theme })
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('game_undercover_word_pairs')
    .select('civil_word, undercover_word')
    .eq('theme', theme)

  if (error || !data || data.length === 0) {
    // Dernier recours : fallback général
    const { data: fallback } = await supabase
      .from('game_undercover_word_pairs')
      .select('civil_word, undercover_word')
      .eq('theme', 'general')
      .limit(1)
      .single()

    if (fallback) return { civil: fallback.civil_word, undercover: fallback.undercover_word }
    throw new Error('Aucun mot disponible en base')
  }

  const available = data.filter(
    row => !usedPairs.includes(row.civil_word) && !usedPairs.includes(row.undercover_word)
  )

  const pool = available.length > 0 ? available : data
  const pick = pool[Math.floor(Math.random() * pool.length)]

  console.log('[generateFromDB] result:', { civil: pick.civil_word, undercover: pick.undercover_word })
  return { civil: pick.civil_word, undercover: pick.undercover_word }
}
