import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/platform/room'
import { startGame } from '@/lib/platform/game-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { playerId?: string; config?: Record<string, unknown> }
  console.log('[POST /api/rooms/:code/start] input:', { code, playerId: body.playerId })

  if (!body.playerId) {
    return NextResponse.json({ error: 'playerId est requis' }, { status: 400 })
  }

  const room = await getRoom(code)
  if (!room) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  if (room.host_id !== body.playerId) {
    return NextResponse.json({ error: 'Seul le host peut démarrer la partie' }, { status: 403 })
  }

  // Applique la config personnalisée si fournie
  if (body.config) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    await createAdminClient().from('rooms').update({ config: body.config }).eq('id', room.id)
  }

  try {
    const state = await startGame(room.id)
    console.log('[POST /api/rooms/:code/start] result:', { round: state.currentRound })
    return NextResponse.json({ state })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/rooms/:code/start] error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
