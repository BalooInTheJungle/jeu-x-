import { NextRequest, NextResponse } from 'next/server'
import { getRoom } from '@/lib/platform/room'

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  console.log('[GET /api/rooms/:code] input:', { code })

  const room = await getRoom(code)

  if (!room) {
    return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })
  }

  console.log('[GET /api/rooms/:code] result:', { code, status: room.status })
  return NextResponse.json(room)
}
