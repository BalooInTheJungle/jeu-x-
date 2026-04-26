import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { ElduState } from '@/types/games/eldu'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const playerId = req.nextUrl.searchParams.get('playerId')
  console.log('[GET /api/rooms/:code/eldu/current-answer] input:', { code, playerId })

  if (!playerId) return NextResponse.json({ error: 'playerId requis' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  const room = data as unknown as RoomRow & { room_players: RoomPlayerRow[] }
  const isHost = room.room_players.find(p => p.id === playerId)?.is_host
  if (!isHost) return NextResponse.json({ error: "Seul l'arbitre peut voir la réponse" }, { status: 403 })

  const state = room.state as ElduState
  const currentQuestion = state.questions?.[state.questionIndex]
  if (!currentQuestion) return NextResponse.json({ error: 'Aucune question en cours' }, { status: 404 })

  const { data: qData, error: qError } = await supabase
    .from('game_eldu_questions')
    .select('answer')
    .eq('id', currentQuestion.id)
    .single()

  if (qError || !qData) {
    console.error('[current-answer] DB error:', qError)
    return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
  }

  console.log('[current-answer] result: answer returned for arbitre')
  return NextResponse.json({ answer: qData.answer })
}
