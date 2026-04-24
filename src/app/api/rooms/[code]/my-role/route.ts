import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RoomRow } from '@/lib/platform/types'
import type { UndercoverState } from '@/types/games/undercover'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const playerId = req.nextUrl.searchParams.get('playerId')
  console.log('[GET /api/rooms/:code/my-role] input:', { code, playerId })

  if (!playerId) {
    return NextResponse.json({ error: 'playerId requis' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('state, game_type')
    .eq('code', code)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  const room = data as unknown as Pick<RoomRow, 'game_type' | 'state'>

  if (room.game_type !== 'undercover') {
    return NextResponse.json({ error: 'Route réservée au jeu Undercover' }, { status: 400 })
  }

  const state = room.state as UndercoverState
  const roleData = state.privateRoles?.[playerId]

  if (!roleData) {
    return NextResponse.json({ error: 'Joueur introuvable dans cette partie' }, { status: 404 })
  }

  console.log('[GET /api/rooms/:code/my-role] result:', { playerId, role: roleData.role })
  return NextResponse.json({ role: roleData.role, word: roleData.word })
}
