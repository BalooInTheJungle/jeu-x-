import { NextRequest, NextResponse } from 'next/server'
import { getRoom, toPlayers } from '@/lib/platform/room'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateWordPair } from '@/lib/games/undercover/words'
import type { UndercoverState, UndercoverRole, UndercoverRoomConfig } from '@/types/games/undercover'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as {
    playerId: string
    theme?: string
    mrWhiteEnabled?: boolean
    hostIsSpectator?: boolean
    customWords?: { civil: string; undercover: string }
  }
  console.log('[POST /api/rooms/:code/undercover/start] input:', {
    code,
    theme: body.theme,
    mrWhiteEnabled: body.mrWhiteEnabled,
    hostIsSpectator: body.hostIsSpectator,
  })

  if (!body.playerId) {
    return NextResponse.json({ error: 'playerId requis' }, { status: 400 })
  }

  const room = await getRoom(code)
  if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  if (room.host_id !== body.playerId) {
    return NextResponse.json({ error: 'Seul le host peut démarrer' }, { status: 403 })
  }
  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'La partie a déjà commencé' }, { status: 400 })
  }

  const supabase = createAdminClient()
  // getRoom charge déjà room_players — pas besoin d'une 2e requête
  const allPlayers = toPlayers(room.room_players)

  const theme = body.theme ?? 'general'
  const mrWhiteEnabled = body.mrWhiteEnabled ?? true
  const hostIsSpectator = body.hostIsSpectator ?? false

  const activePlayers = hostIsSpectator
    ? allPlayers.filter(p => !p.isHost)
    : allPlayers

  if (activePlayers.length < 3) {
    return NextResponse.json({ error: 'Il faut au moins 3 joueurs actifs' }, { status: 400 })
  }

  // Génère la paire de mots
  let wordPair: { civil: string; undercover: string }
  if (body.customWords?.civil && body.customWords?.undercover) {
    wordPair = body.customWords
  } else {
    try {
      wordPair = await generateWordPair(theme)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[undercover/start] word generation failed:', msg)
      return NextResponse.json({ error: 'Impossible de générer les mots' }, { status: 500 })
    }
  }

  // Assigne les rôles aléatoirement
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5)
  const privateRoles: UndercoverState['privateRoles'] = {}
  let undercoverAssigned = false
  let mrWhiteAssigned = false

  for (const player of shuffled) {
    let role: UndercoverRole
    let word: string

    if (!undercoverAssigned) {
      role = 'undercover'
      word = wordPair.undercover
      undercoverAssigned = true
    } else if (mrWhiteEnabled && !mrWhiteAssigned && activePlayers.length >= 4) {
      // Mr. White seulement si ≥ 4 joueurs actifs (sinon trop facile à identifier)
      role = 'mr_white'
      word = ''
      mrWhiteAssigned = true
    } else {
      role = 'civil'
      word = wordPair.civil
    }

    privateRoles[player.id] = { role, word }
  }

  const activeIds = activePlayers.map(p => p.id)
  const speakingOrder = [...activeIds].sort(() => Math.random() - 0.5)

  const allIds = allPlayers.map(p => p.id)
  const playerNames = Object.fromEntries(allPlayers.map(p => [p.id, p.username]))

  const state: UndercoverState = {
    currentRound: 1,
    totalRounds: 1,
    scores: Object.fromEntries(allIds.map(id => [id, 0])),
    roundScores: Object.fromEntries(allIds.map(id => [id, 0])),
    status: 'playing',
    answeredPlayers: [],
    undercoverPhase: 'description',
    cycle: 1,
    alivePlayers: activeIds,
    privateRoles,
    playerNames,
    descriptions: {},
    votes: {},
    eliminated: [],
    speakingOrder,
    currentSpeaker: speakingOrder[0],
  }

  const config: UndercoverRoomConfig = {
    theme,
    mrWhiteEnabled,
    hostIsSpectator,
    civilWord: wordPair.civil,
    undercoverWord: wordPair.undercover,
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', state, config })
    .eq('id', room.id)

  if (error) {
    console.error('[undercover/start] DB error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  console.log('[undercover/start] result: started with', activePlayers.length, 'active players')
  return NextResponse.json({ ok: true })
}
