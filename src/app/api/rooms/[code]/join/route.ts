import { NextRequest, NextResponse } from 'next/server'
import { joinRoom } from '@/lib/platform/room'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { username?: string }
  console.log('[POST /api/rooms/:code/join] input:', { code, username: body.username })

  if (!body.username) {
    return NextResponse.json({ error: 'username est requis' }, { status: 400 })
  }

  try {
    const result = await joinRoom(code, body.username)
    console.log('[POST /api/rooms/:code/join] result:', { playerId: result.player.id })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/rooms/:code/join] error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
