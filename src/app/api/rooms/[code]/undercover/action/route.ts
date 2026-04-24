import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { UndercoverState, UndercoverRole, EliminatedEntry } from '@/types/games/undercover'

type ActionBody =
  | { playerId: string; type: 'description'; text: string }
  | { playerId: string; type: 'vote'; targetId: string }
  | { playerId: string; type: 'guess'; word: string }

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as ActionBody
  console.log('[POST /api/rooms/:code/undercover/action] input:', {
    code,
    type: body.type,
    playerId: body.playerId,
  })

  if (!body.playerId || !body.type) {
    return NextResponse.json({ error: 'playerId et type requis' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  const room = data as unknown as RoomRow & { room_players: RoomPlayerRow[] }
  const state = room.state as UndercoverState

  if (room.status !== 'playing' || state.undercoverPhase === 'finished') {
    return NextResponse.json({ error: 'Aucune partie en cours' }, { status: 400 })
  }

  // Mr. White éliminé peut quand même jouer en phase guess
  const isAlive = state.alivePlayers.includes(body.playerId)
  const isPendingGuesser = state.pendingGuesser === body.playerId

  if (!isAlive && !isPendingGuesser) {
    return NextResponse.json({ error: 'Tu es éliminé' }, { status: 400 })
  }

  let newState: UndercoverState
  try {
    if (body.type === 'description') {
      newState = handleDescription(state, body.playerId, body.text)
    } else if (body.type === 'vote') {
      newState = handleVote(state, body.playerId, body.targetId, room.room_players)
    } else if (body.type === 'guess') {
      const civilWord = (room.config as { civilWord?: string }).civilWord ?? ''
      newState = handleGuess(state, body.playerId, body.word, civilWord)
    } else {
      return NextResponse.json({ error: 'Type d\'action inconnu' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[undercover/action] error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const isFinished = newState.undercoverPhase === 'finished'

  const { error: updateError } = await supabase
    .from('rooms')
    .update({
      state: newState as unknown as Record<string, unknown>,
      ...(isFinished ? { status: 'finished' } : {}),
    })
    .eq('id', room.id)

  if (updateError) {
    console.error('[undercover/action] DB update error:', updateError)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  console.log('[undercover/action] result:', { phase: newState.undercoverPhase, cycle: newState.cycle })
  return NextResponse.json({ ok: true, phase: newState.undercoverPhase })
}

function handleDescription(state: UndercoverState, playerId: string, text: string): UndercoverState {
  if (state.undercoverPhase !== 'description') throw new Error('Pas en phase de description')
  if (state.currentSpeaker !== playerId) throw new Error('Ce n\'est pas ton tour de parler')

  const newDescriptions = { ...state.descriptions, [playerId]: text.trim() }
  const aliveInOrder = state.speakingOrder.filter(id => state.alivePlayers.includes(id))
  const allDescribed = aliveInOrder.every(id => newDescriptions[id])

  if (allDescribed) {
    return { ...state, descriptions: newDescriptions, votes: {}, undercoverPhase: 'vote', currentSpeaker: undefined }
  }

  // Trouve le prochain joueur vivant qui n'a pas encore parlé
  const currentIdx = aliveInOrder.indexOf(playerId)
  const nextSpeaker = aliveInOrder[(currentIdx + 1) % aliveInOrder.length]

  return { ...state, descriptions: newDescriptions, currentSpeaker: nextSpeaker }
}

function handleVote(
  state: UndercoverState,
  playerId: string,
  targetId: string,
  players: RoomPlayerRow[]
): UndercoverState {
  if (state.undercoverPhase !== 'vote') throw new Error('Pas en phase de vote')
  if (!state.alivePlayers.includes(targetId)) throw new Error('Ce joueur est déjà éliminé')
  if (targetId === playerId) throw new Error('Tu ne peux pas voter contre toi-même')
  if (state.votes[playerId]) throw new Error('Tu as déjà voté')

  const newVotes = { ...state.votes, [playerId]: targetId }
  const allVoted = state.alivePlayers.every(id => newVotes[id])

  if (!allVoted) return { ...state, votes: newVotes }

  // Compte les votes
  const voteCount: Record<string, number> = {}
  for (const tid of Object.values(newVotes)) {
    voteCount[tid] = (voteCount[tid] ?? 0) + 1
  }
  const maxVotes = Math.max(...Object.values(voteCount))
  const candidates = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes)

  // Égalité → tirage au sort
  const eliminatedId = candidates[Math.floor(Math.random() * candidates.length)]
  const eliminatedPlayer = players.find(p => p.id === eliminatedId)
  const eliminatedRole = state.privateRoles[eliminatedId]?.role ?? 'civil'

  const newAlive = state.alivePlayers.filter(id => id !== eliminatedId)
  const newEliminated: EliminatedEntry[] = [
    ...state.eliminated,
    { playerId: eliminatedId, username: eliminatedPlayer?.username ?? '?', role: eliminatedRole, cycle: state.cycle },
  ]

  if (eliminatedRole === 'mr_white') {
    return {
      ...state,
      votes: newVotes,
      alivePlayers: newAlive,
      eliminated: newEliminated,
      undercoverPhase: 'guess',
      pendingGuesser: eliminatedId,
    }
  }

  return resolveElimination({ ...state, votes: newVotes, alivePlayers: newAlive, eliminated: newEliminated })
}

function handleGuess(state: UndercoverState, playerId: string, word: string, civilWord: string): UndercoverState {
  if (state.undercoverPhase !== 'guess') throw new Error('Pas en phase de guess')
  if (state.pendingGuesser !== playerId) throw new Error('Ce n\'est pas ton tour de deviner')

  const isCorrect = word.trim().toLowerCase() === civilWord.toLowerCase()

  if (isCorrect) {
    const scores = { ...state.scores, [playerId]: (state.scores[playerId] ?? 0) + 100 }
    return { ...state, undercoverPhase: 'finished', winner: 'mr_white', winnerPlayerIds: [playerId], scores, status: 'finished' }
  }

  // Mauvaise réponse → résoudre normalement (civils gagnent souvent à ce stade)
  return resolveElimination({ ...state, pendingGuesser: undefined })
}

function resolveElimination(state: UndercoverState): UndercoverState {
  const aliveRoles = state.alivePlayers.map(id => state.privateRoles[id]?.role)
  const aliveUndercoverCount = aliveRoles.filter(r => r === 'undercover').length
  const aliveCivilCount = aliveRoles.filter(r => r === 'civil').length

  // Undercover gagne si ≥ autant de civils vivants
  if (aliveUndercoverCount >= aliveCivilCount && aliveUndercoverCount > 0) {
    const winnerPlayerIds = state.alivePlayers.filter(id => state.privateRoles[id]?.role === 'undercover')
    const scores = { ...state.scores }
    for (const id of winnerPlayerIds) scores[id] = (scores[id] ?? 0) + 100
    return { ...state, undercoverPhase: 'finished', winner: 'undercover', winnerPlayerIds, scores, status: 'finished' }
  }

  // Civils gagnent si plus aucun undercover vivant
  if (aliveUndercoverCount === 0) {
    const winnerPlayerIds = state.alivePlayers.filter(id => state.privateRoles[id]?.role === 'civil')
    const scores = { ...state.scores }
    for (const id of winnerPlayerIds) scores[id] = (scores[id] ?? 0) + 100
    return { ...state, undercoverPhase: 'finished', winner: 'civils', winnerPlayerIds, scores, status: 'finished' }
  }

  // Partie continue → cycle suivant
  const aliveInOrder = state.speakingOrder.filter(id => state.alivePlayers.includes(id))
  return {
    ...state,
    undercoverPhase: 'description',
    cycle: state.cycle + 1,
    descriptions: {},
    votes: {},
    currentSpeaker: aliveInOrder[0],
  }
}
