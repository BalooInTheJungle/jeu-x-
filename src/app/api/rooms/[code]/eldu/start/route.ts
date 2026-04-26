import { NextRequest, NextResponse } from 'next/server'
import { getRoom, toPlayers } from '@/lib/platform/room'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ElduState, ElduRoomConfig, ElduPublicQuestion } from '@/types/games/eldu'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as {
    playerId: string
    theme?: string
    durationPerPlayer?: number
    difficulty?: string
  }
  console.log('[POST /api/rooms/:code/eldu/start] input:', {
    code,
    theme: body.theme,
    durationPerPlayer: body.durationPerPlayer,
    difficulty: body.difficulty,
  })

  if (!body.playerId) return NextResponse.json({ error: 'playerId requis' }, { status: 400 })

  const room = await getRoom(code)
  if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  if (room.host_id !== body.playerId) return NextResponse.json({ error: 'Seul le host peut démarrer' }, { status: 403 })
  if (room.status !== 'waiting') return NextResponse.json({ error: 'La partie a déjà commencé' }, { status: 400 })

  const supabase = createAdminClient()
  const allPlayers = toPlayers(room.room_players)
  const activePlayers = allPlayers.filter(p => !p.isHost)

  if (activePlayers.length < 2) {
    return NextResponse.json({ error: 'Il faut au moins 2 joueurs (hors arbitre)' }, { status: 400 })
  }

  const theme = body.theme ?? 'brawl_stars'
  const durationMs = (body.durationPerPlayer ?? 60) * 1000
  const difficulty = body.difficulty ?? 'normal'

  // Fetch questions depuis la DB
  const { data: questionsRaw, error: qError } = await supabase
    .from('game_eldu_questions')
    .select('id, image_url')
    .eq('theme', theme)

  if (qError || !questionsRaw?.length) {
    console.error('[eldu/start] no questions:', qError)
    return NextResponse.json({ error: 'Aucune question disponible — applique la migration SQL et lance le script de seed' }, { status: 500 })
  }

  // Mélange aléatoire
  const questions: ElduPublicQuestion[] = [...questionsRaw]
    .sort(() => Math.random() - 0.5)
    .map(q => ({ id: q.id as string, imageUrl: q.image_url as string }))

  // Les 2 premiers joueurs non-host sont les compétiteurs
  const playerOrder = activePlayers.slice(0, 2).map(p => p.id)
  const playerNames = Object.fromEntries(allPlayers.map(p => [p.id, p.username]))

  const state: ElduState = {
    currentRound: 1,
    totalRounds: 1,
    scores: Object.fromEntries(allPlayers.map(p => [p.id, 0])),
    roundScores: Object.fromEntries(allPlayers.map(p => [p.id, 0])),
    status: 'playing',
    answeredPlayers: [],
    elduPhase: 'playing',
    playerOrder,
    playerNames,
    currentPlayerIndex: 0,
    timers: {
      [playerOrder[0]]: durationMs,
      [playerOrder[1]]: durationMs,
    },
    timerStartedAt: Date.now(),
    questions,
    questionIndex: 0,
    history: [],
  }

  const config: ElduRoomConfig = {
    theme: theme as 'brawl_stars',
    durationPerPlayer: body.durationPerPlayer ?? 60,
    difficulty: difficulty as 'normal' | 'hard',
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', state, config })
    .eq('id', room.id)

  if (error) {
    console.error('[eldu/start] DB error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  console.log('[eldu/start] result: started with', playerOrder.length, 'players,', questions.length, 'questions')
  return NextResponse.json({ ok: true })
}
