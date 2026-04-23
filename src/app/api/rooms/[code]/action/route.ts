import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/platform/room'
import { submitAction } from '@/lib/platform/game-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { playerId?: string; payload?: unknown }
  console.log('[POST /api/rooms/:code/action] input:', { code, playerId: body.playerId })

  if (!body.playerId || body.payload === undefined) {
    return NextResponse.json({ error: 'playerId et payload sont requis' }, { status: 400 })
  }

  const room = await getRoom(code)
  if (!room) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  try {
    const result = await submitAction(room.id, body.playerId, body.payload)
    console.log('[POST /api/rooms/:code/action] result:', { isCorrect: result.isCorrect })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/rooms/:code/action] error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
