export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import type { IsamState, IsamConfig, IsamResult, IsamRoundData, IsamRevealData } from '@/types/games/isam'
import type { RoomRow, RoomPlayerRow } from '@/lib/platform/types'

interface ActionBody {
  playerId: string
  answer?: string
  advance?: boolean
}

const REVEAL_MS   = 3500
const RANKING_MS  = 6000

// ─── Évaluation sémantique LLM ────────────────────────────────────────────────

async function evaluateWithLLM(prediction: string, realAnswer: string): Promise<boolean> {
  if (!prediction.trim() || !realAnswer.trim()) return false
  if (prediction.trim().toLowerCase() === realAnswer.trim().toLowerCase()) return true

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `La prédiction "${prediction}" est-elle sémantiquement proche de la réponse "${realAnswer}" ? Réponds uniquement par "oui" ou "non".`,
      }],
    })
    const text = (msg.content[0] as { type: string; text: string }).text.toLowerCase().trim()
    return text.startsWith('oui')
  } catch (err) {
    console.error('[isam/action] LLM error, fallback exact match:', err)
    return prediction.trim().toLowerCase() === realAnswer.trim().toLowerCase()
  }
}

// ─── Construction du roundData ────────────────────────────────────────────────

function buildRoundData(state: IsamState): IsamRoundData {
  const base: IsamRoundData = {
    subPhase: state.subPhase,
    questionIndex: state.questionIndex,
    questionCount: state.questionCount,
    player1Id: state.player1Id,
    player2Id: state.player2Id,
    activePlayerId: state.activePlayerId,
    scores: { ...state.scores },
  }

  switch (state.subPhase) {
    case 'm1_answer':
      return {
        ...base,
        question: state.manche1Questions[state.questionIndex],
        questionDeadline: state.questionDeadline,
      }

    case 'm1_guess':
      return {
        ...base,
        question: state.manche1Questions[state.questionIndex],
        questionDeadline: state.questionDeadline,
      }

    case 'm1_reveal': {
      const r = state.manche1Results[state.manche1Results.length - 1]
      const reveal: IsamRevealData | undefined = r ? {
        questionText: r.questionText,
        imageUrl: r.imageUrl,
        prediction: r.prediction,
        realAnswer: r.realAnswer,
        isCorrect: r.isCorrect,
      } : undefined
      return { ...base, reveal, phaseDeadline: state.phaseDeadline }
    }

    case 'mid_ranking':
      return {
        ...base,
        manche1Results: state.manche1Results,
        phaseDeadline: state.phaseDeadline,
      }

    case 'm2_answer':
      return {
        ...base,
        question: state.manche2Questions[state.questionIndex],
        questionDeadline: state.questionDeadline,
      }

    case 'm2_guess':
      return {
        ...base,
        question: state.manche2Questions[state.questionIndex],
        questionDeadline: state.questionDeadline,
      }

    case 'm2_reveal': {
      const r = state.manche2Results[state.manche2Results.length - 1]
      const reveal: IsamRevealData | undefined = r ? {
        questionText: r.questionText,
        imageUrl: r.imageUrl,
        prediction: r.prediction,
        realAnswer: r.realAnswer,
        isCorrect: r.isCorrect,
      } : undefined
      return { ...base, reveal, phaseDeadline: state.phaseDeadline }
    }

    default:
      return base
  }
}

// ─── Route POST ───────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createAdminClient()
  const code = params.code

  let body: ActionBody
  try {
    body = await req.json() as ActionBody
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { playerId, answer = '', advance = false } = body
  console.log('[isam/action] input:', { playerId, advance, subPhase: 'unknown', answer: answer?.slice(0, 40) })

  if (!playerId) return NextResponse.json({ error: 'playerId requis' }, { status: 400 })

  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*, room_players!room_players_room_id_fkey(*)')
    .eq('code', code)
    .single()

  if (roomError || !roomData) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  const room = roomData as RoomRow & { room_players: RoomPlayerRow[] }

  if (room.status !== 'playing') return NextResponse.json({ error: 'Partie non active' }, { status: 409 })

  let state = room.state as unknown as IsamState
  const config = (room.config ?? {}) as unknown as IsamConfig
  const duration = config.answerDuration ?? 60

  console.log('[isam/action] subPhase=', state.subPhase, 'qIdx=', state.questionIndex)

  // ─── Auto-avance (reveal et ranking) ──────────────────────────────────────

  if (advance) {
    const validPhases = ['m1_reveal', 'm2_reveal', 'mid_ranking']
    if (!validPhases.includes(state.subPhase)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (state.subPhase === 'm1_reveal') {
      const nextIndex = state.questionIndex + 1
      if (nextIndex < state.questionCount) {
        state = {
          ...state,
          subPhase: 'm1_guess',
          questionIndex: nextIndex,
          answeredPlayers: [],
          activePlayerId: state.player2Id,
          questionDeadline: new Date(Date.now() + duration * 1000).toISOString(),
          phaseDeadline: undefined,
        }
      } else {
        state = {
          ...state,
          subPhase: 'mid_ranking',
          answeredPlayers: [],
          phaseDeadline: new Date(Date.now() + RANKING_MS).toISOString(),
        }
      }

    } else if (state.subPhase === 'mid_ranking') {
      state = {
        ...state,
        subPhase: 'm2_answer',
        questionIndex: 0,
        answeredPlayers: [],
        activePlayerId: state.player2Id,
        questionDeadline: new Date(Date.now() + duration * 1000).toISOString(),
        phaseDeadline: undefined,
      }

    } else if (state.subPhase === 'm2_reveal') {
      const nextIndex = state.questionIndex + 1
      if (nextIndex < state.questionCount) {
        state = {
          ...state,
          subPhase: 'm2_guess',
          questionIndex: nextIndex,
          answeredPlayers: [],
          activePlayerId: state.player1Id,
          questionDeadline: new Date(Date.now() + duration * 1000).toISOString(),
          phaseDeadline: undefined,
        }
      } else {
        state = { ...state, status: 'finished' }
      }
    }

    state = { ...state, roundData: buildRoundData(state) }

    await supabase.from('rooms').update({
      state: state as unknown as Record<string, unknown>,
      status: state.status,
    }).eq('id', room.id)

    console.log('[isam/action] advance result: subPhase=', state.subPhase, 'status=', state.status)
    return NextResponse.json({ ok: true, subPhase: state.subPhase })
  }

  // ─── Manche 1 — J1 répond ─────────────────────────────────────────────────

  if (state.subPhase === 'm1_answer') {
    if (playerId !== state.player1Id) {
      return NextResponse.json({ error: "Ce n'est pas ton tour de répondre" }, { status: 403 })
    }
    if (state.answeredPlayers.includes(playerId)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const trimmed = answer.trim() || '—'
    const newAnswers = [...state.manche1Answers]
    newAnswers[state.questionIndex] = trimmed

    const nextIndex = state.questionIndex + 1
    const deadline = new Date(Date.now() + duration * 1000).toISOString()

    if (nextIndex < state.questionCount) {
      state = {
        ...state,
        manche1Answers: newAnswers,
        questionIndex: nextIndex,
        answeredPlayers: [],
        questionDeadline: deadline,
      }
    } else {
      // Toutes les réponses de J1 enregistrées → passer au devinage
      state = {
        ...state,
        manche1Answers: newAnswers,
        subPhase: 'm1_guess',
        questionIndex: 0,
        answeredPlayers: [],
        activePlayerId: state.player2Id,
        questionDeadline: deadline,
      }
    }
  }

  // ─── Manche 1 — J2 devine ────────────────────────────────────────────────

  else if (state.subPhase === 'm1_guess') {
    if (playerId !== state.player2Id) {
      return NextResponse.json({ error: "Ce n'est pas ton tour de deviner" }, { status: 403 })
    }
    if (state.answeredPlayers.includes(playerId)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const trimmed = answer.trim() || '—'
    const realAnswer = state.manche1Answers[state.questionIndex] ?? '—'
    const question = state.manche1Questions[state.questionIndex]

    const isCorrect = trimmed !== '—' ? await evaluateWithLLM(trimmed, realAnswer) : false
    const points = isCorrect ? 1 : 0

    const result: IsamResult = {
      questionText: question?.questionText ?? '',
      imageUrl: question?.imageUrl ?? null,
      prediction: trimmed,
      realAnswer,
      isCorrect,
    }

    state = {
      ...state,
      manche1Results: [...state.manche1Results, result],
      answeredPlayers: [...state.answeredPlayers, playerId],
      scores: { ...state.scores, [state.player2Id]: (state.scores[state.player2Id] ?? 0) + points },
      subPhase: 'm1_reveal',
      phaseDeadline: new Date(Date.now() + REVEAL_MS).toISOString(),
    }

    await supabase.from('room_players')
      .update({ score: state.scores[state.player2Id] })
      .eq('id', state.player2Id).eq('room_id', room.id)
  }

  // ─── Manche 2 — J2 répond ─────────────────────────────────────────────────

  else if (state.subPhase === 'm2_answer') {
    if (playerId !== state.player2Id) {
      return NextResponse.json({ error: "Ce n'est pas ton tour de répondre" }, { status: 403 })
    }
    if (state.answeredPlayers.includes(playerId)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const trimmed = answer.trim() || '—'
    const newAnswers = [...state.manche2Answers]
    newAnswers[state.questionIndex] = trimmed

    const nextIndex = state.questionIndex + 1
    const deadline = new Date(Date.now() + duration * 1000).toISOString()

    if (nextIndex < state.questionCount) {
      state = {
        ...state,
        manche2Answers: newAnswers,
        questionIndex: nextIndex,
        answeredPlayers: [],
        questionDeadline: deadline,
      }
    } else {
      state = {
        ...state,
        manche2Answers: newAnswers,
        subPhase: 'm2_guess',
        questionIndex: 0,
        answeredPlayers: [],
        activePlayerId: state.player1Id,
        questionDeadline: deadline,
      }
    }
  }

  // ─── Manche 2 — J1 devine ────────────────────────────────────────────────

  else if (state.subPhase === 'm2_guess') {
    if (playerId !== state.player1Id) {
      return NextResponse.json({ error: "Ce n'est pas ton tour de deviner" }, { status: 403 })
    }
    if (state.answeredPlayers.includes(playerId)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const trimmed = answer.trim() || '—'
    const realAnswer = state.manche2Answers[state.questionIndex] ?? '—'
    const question = state.manche2Questions[state.questionIndex]

    const isCorrect = trimmed !== '—' ? await evaluateWithLLM(trimmed, realAnswer) : false
    const points = isCorrect ? 1 : 0

    const result: IsamResult = {
      questionText: question?.questionText ?? '',
      imageUrl: question?.imageUrl ?? null,
      prediction: trimmed,
      realAnswer,
      isCorrect,
    }

    state = {
      ...state,
      manche2Results: [...state.manche2Results, result],
      answeredPlayers: [...state.answeredPlayers, playerId],
      scores: { ...state.scores, [state.player1Id]: (state.scores[state.player1Id] ?? 0) + points },
      subPhase: 'm2_reveal',
      phaseDeadline: new Date(Date.now() + REVEAL_MS).toISOString(),
    }

    await supabase.from('room_players')
      .update({ score: state.scores[state.player1Id] })
      .eq('id', state.player1Id).eq('room_id', room.id)

  } else {
    return NextResponse.json({ ok: true, skipped: true })
  }

  state = { ...state, roundData: buildRoundData(state) }

  const { error: updateError } = await supabase.from('rooms').update({
    state: state as unknown as Record<string, unknown>,
    status: state.status,
  }).eq('id', room.id)

  if (updateError) {
    console.error('[isam/action] update error:', updateError)
    return NextResponse.json({ error: 'Erreur de sauvegarde' }, { status: 500 })
  }

  console.log('[isam/action] result: subPhase=', state.subPhase, 'qIdx=', state.questionIndex, 'status=', state.status)
  return NextResponse.json({ ok: true, subPhase: state.subPhase })
}
