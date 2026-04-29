import { notFound } from 'next/navigation'
import { getRoom } from '@/lib/platform/room'
import RoomLobbyClient from './RoomLobbyClient'

// Données temps réel — jamais en cache
export const dynamic = 'force-dynamic'

interface Props {
  params: { code: string }
}

export default async function RoomPage({ params }: Props) {
  const room = await getRoom(params.code)

  if (!room) notFound()

  return (
    <main>
      <RoomLobbyClient room={room} />
    </main>
  )
}
