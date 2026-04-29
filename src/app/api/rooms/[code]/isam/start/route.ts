export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isamModule } from '@/lib/games/isam'
import type { IsamState, IsamConfig, IsamQuestion, IsamRoundData } from '@/types/games/isam'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'

interface StartBody {
  playerId: string
  theme?: IsamConfig['theme']
  answerDuration?: number
  questionCount?: number
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createAdminClient()
  const code = params.code
  console.log('[isam/start] input: code=', code)

  let body: StartBody
  try {
    body = await req.json() as StartBody
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { playerId, theme = 'mix', answerDuration = 60, questionCount = 5 } = body
  console.log('[isam/start] body:', { playerId, theme, answerDuration, questionCount })

  if (!playerId) return NextResponse.json({ error: 'playerId requis' }, { status: 400 })

  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code)
    .single()

  if (roomError || !roomData) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  const room = roomData as RoomRow & { room_players: RoomPlayerRow[] }

  if (room.host_id !== playerId) {
    return NextResponse.json({ error: 'Seul le host peut démarrer' }, { status: 403 })
  }

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'Partie déjà commencée' }, { status: 409 })
  }

  if (room.room_players.length < 2) {
    return NextResponse.json(
      { error: `Il faut 2 joueurs (actuellement ${room.room_players.length})` },
      { status: 422 }
    )
  }

  const config: IsamConfig = { theme, answerDuration, questionCount }
  const platformPlayers = room.room_players.map(p => ({
    id: p.id, username: p.username, isHost: p.is_host,
  }))

  const baseState = isamModule.initGame(config, platformPlayers) as IsamState

  // Charger 2×questionCount questions (sets différents pour les deux manches)
  let query = supabase
    .from('game_isam_questions')
    .select('id, theme, image_url, question_text')

  if (theme !== 'mix') query = query.eq('theme', theme)

  const { data: qData, error: qError } = await query

  if (qError || !qData || qData.length < questionCount) {
    console.error('[isam/start] not enough questions:', qData?.length, qError)
    return NextResponse.json({ error: 'Pas assez de questions disponibles' }, { status: 500 })
  }

  const mapQ = (row: Record<string, unknown>): IsamQuestion => ({
    id: row.id as string,
    theme: row.theme as string,
    imageUrl: (row.image_url as string | null) ?? null,
    questionText: row.question_text as string,
  })

  const shuffled = [...qData].sort(() => Math.random() - 0.5)

  let manche1Questions: IsamQuestion[]
  let manche2Questions: IsamQuestion[]

  if (shuffled.length >= questionCount * 2) {
    manche1Questions = shuffled.slice(0, questionCount).map(mapQ)
    manche2Questions = shuffled.slice(questionCount, questionCount * 2).map(mapQ)
  } else {
    // Pas assez pour deux sets distincts — mélange différent pour la manche 2
    manche1Questions = shuffled.slice(0, questionCount).map(mapQ)
    const reshuffled = [...qData].sort(() => Math.random() - 0.5)
    manche2Questions = reshuffled.slice(0, questionCount).map(mapQ)
  }

  const deadline = new Date(Date.now() + answerDuration * 1000).toISOString()

  const fullState: IsamState = {
    ...baseState,
    manche1Questions,
    manche2Questions,
    questionDeadline: deadline,
  }

  const roundData: IsamRoundData = {
    subPhase: 'm1_answer',
    questionIndex: 0,
    questionCount,
    player1Id: baseState.player1Id,
    player2Id: baseState.player2Id,
    activePlayerId: baseState.player1Id,
    scores: { ...fullState.scores },
    question: manche1Questions[0],
    questionDeadline: deadline,
  }

  fullState.roundData = roundData

  const { error: updateError } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      state: fullState as unknown as Record<string, unknown>,
      config: config as unknown as Record<string, unknown>,
    })
    .eq('id', room.id)

  if (updateError) {
    console.error('[isam/start] update error:', updateError)
    return NextResponse.json({ error: 'Impossible de sauvegarder' }, { status: 500 })
  }

  console.log('[isam/start] result: ok, p1=', baseState.player1Id, 'p2=', baseState.player2Id)
  return NextResponse.json({ ok: true })
}
