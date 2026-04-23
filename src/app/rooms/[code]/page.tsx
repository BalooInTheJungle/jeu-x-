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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-white">
      <RoomLobbyClient room={room} />
    </main>
  )
}
