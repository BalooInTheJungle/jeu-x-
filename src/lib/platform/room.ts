import { createAdminClient } from '@/lib/supabase/admin'
import type { Player, RoomRow, RoomPlayerRow } from './types'

type RoomWithPlayers = RoomRow & { room_players: RoomPlayerRow[] }

export async function createRoom(gameType: string, hostUsername: string): Promise<{ room: RoomRow; player: RoomPlayerRow }> {
  console.log('[createRoom] input:', { gameType, hostUsername })

  const supabase = createAdminClient()

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ game_type: gameType })
    .select()
    .single()

  if (roomError || !room) {
    console.error('[createRoom] room error:', roomError)
    throw new Error(roomError?.message ?? 'Impossible de créer la room')
  }

  const { data: player, error: playerError } = await supabase
    .from('room_players')
    .insert({ room_id: room.id as string, username: hostUsername, is_host: true })
    .select()
    .single()

  if (playerError || !player) {
    console.error('[createRoom] player error:', playerError)
    throw new Error(playerError?.message ?? 'Impossible de créer le joueur')
  }

  await supabase.from('rooms').update({ host_id: player.id }).eq('id', room.id)

  console.log('[createRoom] result:', { code: room.code, playerId: player.id })
  return {
    room: { ...(room as unknown as RoomRow), host_id: player.id as string },
    player: player as unknown as RoomPlayerRow,
  }
}

export async function joinRoom(code: string, username: string): Promise<{ room: RoomWithPlayers; player: RoomPlayerRow }> {
  console.log('[joinRoom] input:', { code, username })

  const supabase = createAdminClient()

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (roomError || !room) {
    console.error('[joinRoom] room not found:', code)
    throw new Error('Room introuvable — vérifie le code')
  }

  const typedRoom = room as unknown as RoomWithPlayers

  if (typedRoom.status !== 'waiting') {
    throw new Error('La partie a déjà commencé')
  }

  const { data: player, error: playerError } = await supabase
    .from('room_players')
    .insert({ room_id: typedRoom.id, username })
    .select()
    .single()

  if (playerError || !player) {
    console.error('[joinRoom] player error:', playerError)
    throw new Error(playerError?.message ?? 'Impossible de rejoindre la room')
  }

  console.log('[joinRoom] result:', { playerId: player.id, roomCode: code })
  return { room: typedRoom, player: player as unknown as RoomPlayerRow }
}

export async function getRoom(code: string): Promise<RoomWithPlayers | null> {
  console.log('[getRoom] input:', { code })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (error) {
    console.error('[getRoom] error:', error)
    return null
  }

  const room = data as unknown as RoomWithPlayers
  console.log('[getRoom] result:', { code, status: room.status, players: room.room_players.length })
  return room
}

export function toPlayers(rows: RoomPlayerRow[]): Player[] {
  return rows.map((p) => ({
    id: p.id,
    username: p.username,
    isHost: p.is_host,
  }))
}
