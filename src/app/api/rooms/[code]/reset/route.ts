import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/platform/room'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as { playerId: string }
  console.log('[POST /api/rooms/:code/reset] input:', { code, playerId: body.playerId })

  if (!body.playerId) {
    return NextResponse.json({ error: 'playerId requis' }, { status: 400 })
  }

  const room = await getRoom(code)
  if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  if (room.host_id !== body.playerId) {
    return NextResponse.json({ error: 'Seul le host peut relancer' }, { status: 403 })
  }

  if (room.status === 'waiting') {
    return NextResponse.json({ error: 'La room est déjà en attente' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'waiting', state: {}, config: {} })
    .eq('id', room.id)

  if (error) {
    console.error('[reset] DB error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  console.log('[reset] result: room reset to waiting')
  return NextResponse.json({ ok: true })
}
