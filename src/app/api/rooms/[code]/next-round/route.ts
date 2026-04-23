import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/platform/room'
import { advanceToNextRound } from '@/lib/platform/game-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { playerId?: string }
  console.log('[POST /api/rooms/:code/next-round] input:', { code, playerId: body.playerId })

  if (!body.playerId) {
    return NextResponse.json({ error: 'playerId est requis' }, { status: 400 })
  }

  const room = await getRoom(code)
  if (!room) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  if (room.host_id !== body.playerId) {
    return NextResponse.json({ error: 'Seul le host peut passer au round suivant' }, { status: 403 })
  }

  try {
    const result = await advanceToNextRound(room.id)
    console.log('[POST /api/rooms/:code/next-round] result:', { finished: result.finished })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/rooms/:code/next-round] error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
