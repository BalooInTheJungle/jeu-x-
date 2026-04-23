'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import RoomLobby from '@/components/platform/RoomLobby'
import type { RoomPlayerRow, RoomRow } from '@/lib/platform/types'

interface Props {
  room: RoomRow & { room_players: RoomPlayerRow[] }
}

export default function RoomLobbyClient({ room }: Props) {
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const router = useRouter()
  const hasRefreshed = useRef(false)

  useEffect(() => {
    const id = localStorage.getItem(`player_${room.code}`)
    setCurrentPlayerId(id)

    // Race condition : SSR peut tourner avant que le INSERT du joueur soit visible.
    // On fait au max un refresh pour obtenir les données fraîches.
    if (id && !room.room_players.find((p) => p.id === id) && !hasRefreshed.current) {
      hasRefreshed.current = true
      router.refresh()
    }
  }, [room.code, room.room_players, router])

  if (!currentPlayerId) {
    return (
      <div className="text-center">
        <p className="text-slate-400">Chargement...</p>
      </div>
    )
  }

  return <RoomLobby initialRoom={room} currentPlayerId={currentPlayerId} />
}
