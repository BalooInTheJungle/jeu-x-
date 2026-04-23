import { createAdminClient } from '@/lib/supabase/admin'
import { gameRegistry } from '@/lib/games/registry'
import { toPlayers } from './room'
import type { GameState, PlayerAction, PlayerActionRow, RoomRow, RoomPlayerRow } from './types'

type RoomWithPlayers = RoomRow & { room_players: RoomPlayerRow[] }

function getModule(gameType: string) {
  const mod = gameRegistry.get(gameType)
  if (!mod) throw new Error(`Jeu inconnu dans le registre : "${gameType}"`)
  return mod
}

function toPlayerAction(row: PlayerActionRow): PlayerAction {
  return {
    playerId: row.player_id,
    roomId: row.room_id,
    roundNumber: row.round_number,
    payload: row.payload,
    submittedAt: row.submitted_at,
  }
}

export async function startGame(roomId: string): Promise<GameState> {
  console.log('[startGame] input:', { roomId })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_players(*)')
    .eq('id', roomId)
    .single()

  if (error || !data) throw new Error('Room introuvable')

  const room = data as unknown as RoomWithPlayers

  if (room.status !== 'waiting') throw new Error('La partie a déjà commencé')

  const gameModule = getModule(room.game_type)
  const players = toPlayers(room.room_players)

  if (players.length < gameModule.config.minPlayers) {
    throw new Error(`Il faut au moins ${gameModule.config.minPlayers} joueurs`)
  }

  const state = gameModule.initGame(room.config, players)
  const roundData = await gameModule.generateRound(1, room.config, [])
  state.roundData = roundData

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ status: 'playing', state })
    .eq('id', roomId)

  if (updateError) {
    console.error('[startGame] error:', updateError)
    throw new Error(updateError.message)
  }

  console.log('[startGame] result:', { roomId, totalRounds: state.totalRounds })
  return state
}

export async function submitAction(
  roomId: string,
  playerId: string,
  payload: unknown
) {
  console.log('[submitAction] input:', { roomId, playerId })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !data) throw new Error('Room introuvable')

  const room = data as unknown as RoomRow

  if (room.status !== 'playing') throw new Error('Aucune partie en cours')

  const state = room.state as GameState

  if (state.answeredPlayers.includes(playerId)) {
    throw new Error('Tu as déjà répondu à ce round')
  }

  const gameModule = getModule(room.game_type)

  const action: PlayerAction = {
    playerId,
    roomId,
    roundNumber: state.currentRound,
    payload,
    submittedAt: new Date().toISOString(),
  }

  const result = await gameModule.processAction(action, state)

  await supabase.from('player_actions').insert({
    room_id: roomId,
    player_id: playerId,
    round_number: state.currentRound,
    payload,
    submitted_at: action.submittedAt,
  })

  const nextAnswered = [...state.answeredPlayers, playerId]
  const updatedState: GameState = {
    ...state,
    answeredPlayers: nextAnswered,
    status: gameModule.isRoundOver({ ...state, answeredPlayers: nextAnswered })
      ? 'round_end'
      : 'playing',
  }

  await supabase.from('rooms').update({ state: updatedState }).eq('id', roomId)

  console.log('[submitAction] result:', { isCorrect: result.isCorrect, points: result.pointsEarned })
  return result
}

export async function advanceToNextRound(roomId: string) {
  console.log('[advanceToNextRound] input:', { roomId })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_players(*)')
    .eq('id', roomId)
    .single()

  if (error || !data) throw new Error('Room introuvable')

  const room = data as unknown as RoomWithPlayers
  const gameModule = getModule(room.game_type)
  const state = room.state as GameState

  const { data: actionRows } = await supabase
    .from('player_actions')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', state.currentRound)

  const actions = ((actionRows ?? []) as unknown as PlayerActionRow[]).map(toPlayerAction)
  const roundScores = gameModule.computeRoundScores(state, actions)

  const updatedScores = { ...state.scores }
  for (const [pid, points] of Object.entries(roundScores)) {
    updatedScores[pid] = (updatedScores[pid] ?? 0) + points
  }

  if (gameModule.isGameOver(state)) {
    for (const [pid, score] of Object.entries(updatedScores)) {
      await supabase.from('room_players').update({ score }).eq('id', pid)
    }
    const finalState: GameState = { ...state, scores: updatedScores, roundScores, status: 'finished' }
    await supabase.from('rooms').update({ status: 'finished', state: finalState }).eq('id', roomId)
    const ranking = gameModule.getFinalRanking(finalState)
    console.log('[advanceToNextRound] game finished, players ranked:', ranking.length)
    return { finished: true, ranking }
  }

  const previousRounds = state.roundData ? [state.roundData] : []
  const nextRoundData = await gameModule.generateRound(
    state.currentRound + 1,
    room.config,
    previousRounds
  )

  const nextState: GameState = {
    ...state,
    currentRound: state.currentRound + 1,
    scores: updatedScores,
    roundScores: Object.fromEntries(Object.keys(state.scores).map((id) => [id, 0])),
    status: 'playing',
    roundData: nextRoundData,
    answeredPlayers: [],
  }

  await supabase.from('rooms').update({ state: nextState }).eq('id', roomId)

  console.log('[advanceToNextRound] result:', { newRound: nextState.currentRound })
  return { finished: false, state: nextState }
}
