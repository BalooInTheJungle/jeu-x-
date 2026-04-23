import { NextRequest, NextResponse } from 'next/server'
import { createRoom } from '@/lib/platform/room'

export async function POST(req: NextRequest) {
  console.log('[POST /api/rooms] input: creating room')

  const body = await req.json() as { gameType?: string; hostUsername?: string }
  const { gameType, hostUsername } = body

  if (!gameType || !hostUsername) {
    return NextResponse.json(
      { error: 'gameType et hostUsername sont requis' },
      { status: 400 }
    )
  }

  try {
    const result = await createRoom(gameType, hostUsername)
    console.log('[POST /api/rooms] result:', { code: result.room.code })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/rooms] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
