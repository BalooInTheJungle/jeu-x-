import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'
import type { ImageQuizState, ImageQuizHistoryEntry } from '@/types/games/image-quiz'

type ActionBody =
  | { playerId: string; type: 'correct' }
  | { playerId: string; type: 'pass' }
  | { playerId: string; type: 'timeout' }

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const body = await req.json() as ActionBody
  console.log('[POST /api/rooms/:code/image-quiz/action] input:', { code, type: body.type, playerId: body.playerId })

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
  const state = room.state as ImageQuizState

  if (room.status !== 'playing' || state.imageQuizPhase !== 'playing') {
    return NextResponse.json({ error: 'Aucune partie en cours' }, { status: 400 })
  }

  // Seul l'arbitre (host) peut soumettre des actions
  const isHost = room.room_players.find(p => p.id === body.playerId)?.is_host
  if (!isHost) {
    return NextResponse.json({ error: "Seul l'arbitre peut valider" }, { status: 403 })
  }

  const now = Date.now()
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex]
  const elapsed = now - state.timerStartedAt
  const remainingForCurrent = state.timers[currentPlayerId] - elapsed

  let newState: ImageQuizState

  // Timeout : le joueur courant a perdu
  if (body.type === 'timeout' || remainingForCurrent <= 0) {
    const winnerId = state.playerOrder[1 - state.currentPlayerIndex]
    newState = {
      ...state,
      timers: { ...state.timers, [currentPlayerId]: 0 },
      imageQuizPhase: 'finished',
      status: 'finished',
      winner: winnerId,
      scores: { ...state.scores },
    }
  } else {
    // Mettre à jour le timer du joueur courant
    const updatedTimers = {
      ...state.timers,
      [currentPlayerId]: Math.max(0, remainingForCurrent),
    }

    // Récupérer la réponse de la question courante pour l'historique
    const currentQuestion = state.questions[state.questionIndex]
    let answer = ''
    if (currentQuestion) {
      const { data: qData } = await supabase
        .from('game_image_quiz_questions')
        .select('answer')
        .eq('id', currentQuestion.id)
        .single()
      answer = (qData?.answer as string) ?? ''
    }

    const historyEntry: ImageQuizHistoryEntry = {
      questionId: currentQuestion?.id ?? '',
      imageUrl: currentQuestion?.imageUrl ?? '',
      answer,
      result: body.type === 'pass' ? 'passed' : body.type,
      playerId: currentPlayerId,
    }

    const newHistory = [...state.history, historyEntry]
    const newScores = { ...state.scores }
    if (body.type === 'correct') {
      newScores[currentPlayerId] = (newScores[currentPlayerId] ?? 0) + 1
    }

    const nextQuestionIndex = state.questionIndex + 1
    const nextPlayerIndex = 1 - state.currentPlayerIndex

    // Plus de questions → fin de partie
    if (nextQuestionIndex >= state.questions.length) {
      const [p0, p1] = state.playerOrder
      const s0 = newScores[p0] ?? 0
      const s1 = newScores[p1] ?? 0
      let winnerId: string
      if (s0 !== s1) {
        winnerId = s0 > s1 ? p0 : p1
      } else {
        // Égalité de score : celui avec le plus de temps restant gagne
        winnerId = (updatedTimers[p0] ?? 0) >= (updatedTimers[p1] ?? 0) ? p0 : p1
      }
      newState = {
        ...state,
        timers: updatedTimers,
        scores: newScores,
        history: newHistory,
        imageQuizPhase: 'finished',
        status: 'finished',
        winner: winnerId,
      }
    } else {
      newState = {
        ...state,
        timers: updatedTimers,
        scores: newScores,
        history: newHistory,
        currentPlayerIndex: nextPlayerIndex,
        questionIndex: nextQuestionIndex,
        timerStartedAt: now,
      }
    }
  }

  const isFinished = newState.imageQuizPhase === 'finished'

  const { error: updateError } = await supabase
    .from('rooms')
    .update({
      state: newState as unknown as Record<string, unknown>,
      ...(isFinished ? { status: 'finished' } : {}),
    })
    .eq('id', room.id)

  if (updateError) {
    console.error('[image-quiz/action] DB update error:', updateError)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  console.log('[image-quiz/action] result:', { phase: newState.imageQuizPhase, questionIndex: newState.questionIndex })
  return NextResponse.json({ ok: true, phase: newState.imageQuizPhase })
}
