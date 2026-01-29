import { createClient } from '@/lib/supabase/server'
import { SimpleQuestion, SimpleGuess } from '@/types/database'

// =============================================================================
// Types
// =============================================================================

export type CreateQuestionInput = {
  title: string
  description?: string
  minValue: number
  maxValue: number
  trueAnswer: number
  unit?: string
  isCurrency?: boolean
  revealPin?: string
  discordUserId?: string
}

export type CreateQuestionResult =
  | { success: true; data: { id: string; shortId: string } }
  | { success: false; error: string }

export type GetQuestionResult =
  | {
      success: true
      data: {
        question: {
          id: string
          shortId: string
          title: string
          description: string | null
          minValue: number
          maxValue: number
          revealed: boolean
          revealedAt: string | null
          trueAnswer: number | null // Only included if revealed
          unit: string | null
          isCurrency: boolean
          hasPin: boolean
          discordUserId: string | null
          createdAt: string | null
        }
        guesses: Array<{
          id: string
          value: number
          name: string | null
          createdAt: string | null
          afterReveal: boolean
        }>
      }
    }
  | { success: false; error: string }

export type SubmitGuessInput = {
  questionId: string // Can be short ID or full ID
  value: number
  name?: string
}

export type SubmitGuessResult =
  | { success: true; data: { id: string; value: number; name: string | null } }
  | { success: false; error: string }

export type RevealAnswerInput = {
  questionId: string // Can be short ID or full ID
  pin?: string
  discordUserId?: string // If provided and matches creator, bypasses PIN
}

export type RevealAnswerResult =
  | { success: true; data: { trueAnswer: number } }
  | { success: false; error: string }

// =============================================================================
// Helper: Resolve short ID to full question
// =============================================================================

async function resolveQuestion(
  questionId: string
): Promise<{ question: SimpleQuestion } | { error: string }> {
  const supabase = await createClient()

  // Try short ID lookup first (7 char prefix)
  if (questionId.length <= 8) {
    const { data, error } = await supabase.rpc('get_simple_question_by_prefix', {
      prefix: questionId,
    })

    if (error || !data || data.length === 0) {
      return { error: 'Question not found' }
    }

    if (data.length > 1) {
      return { error: 'Ambiguous question ID' }
    }

    return { question: data[0] as SimpleQuestion }
  }

  // Full ID lookup
  const { data, error } = await supabase
    .from('simple_questions')
    .select('*')
    .eq('id', questionId)
    .single()

  if (error || !data) {
    return { error: 'Question not found' }
  }

  return { question: data }
}

// =============================================================================
// Service Functions
// =============================================================================

export async function createQuestion(
  input: CreateQuestionInput
): Promise<CreateQuestionResult> {
  // Validation
  if (!input.title.trim()) {
    return { success: false, error: 'Title is required' }
  }

  if (isNaN(input.minValue) || isNaN(input.maxValue) || isNaN(input.trueAnswer)) {
    return { success: false, error: 'Invalid number values' }
  }

  if (input.minValue >= input.maxValue) {
    return { success: false, error: 'Min must be less than max' }
  }

  if (input.trueAnswer < input.minValue || input.trueAnswer > input.maxValue) {
    return { success: false, error: 'Answer must be between min and max' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('simple_questions')
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      min_value: input.minValue,
      max_value: input.maxValue,
      true_answer: input.trueAnswer,
      unit: input.unit?.trim() || null,
      is_currency: input.isCurrency ?? false,
      reveal_pin: input.revealPin || null,
      discord_user_id: input.discordUserId || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: 'Failed to create question' }
  }

  return {
    success: true,
    data: {
      id: data.id,
      shortId: data.id.slice(0, 7),
    },
  }
}

export async function getQuestion(questionId: string): Promise<GetQuestionResult> {
  const resolved = await resolveQuestion(questionId)

  if ('error' in resolved) {
    return { success: false, error: resolved.error }
  }

  const question = resolved.question
  const supabase = await createClient()

  // Fetch guesses
  const { data: guesses, error: guessesError } = await supabase
    .from('simple_guesses')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  if (guessesError) {
    return { success: false, error: 'Failed to fetch guesses' }
  }

  const revealed = question.revealed_at !== null
  const revealedAt = question.revealed_at

  return {
    success: true,
    data: {
      question: {
        id: question.id,
        shortId: question.id.slice(0, 7),
        title: question.title,
        description: question.description,
        minValue: question.min_value,
        maxValue: question.max_value,
        revealed,
        revealedAt,
        trueAnswer: revealed ? question.true_answer : null,
        unit: question.unit,
        isCurrency: question.is_currency,
        hasPin: question.reveal_pin !== null,
        discordUserId: question.discord_user_id,
        createdAt: question.created_at,
      },
      guesses: (guesses || []).map((g: SimpleGuess) => ({
        id: g.id,
        value: g.value,
        name: g.name,
        createdAt: g.created_at,
        afterReveal: revealedAt !== null && g.created_at !== null && g.created_at > revealedAt,
      })),
    },
  }
}

export async function submitGuess(
  input: SubmitGuessInput
): Promise<SubmitGuessResult> {
  const resolved = await resolveQuestion(input.questionId)

  if ('error' in resolved) {
    return { success: false, error: resolved.error }
  }

  const question = resolved.question

  // Validate guess is within range
  if (input.value < question.min_value || input.value > question.max_value) {
    return {
      success: false,
      error: `Value must be between ${question.min_value} and ${question.max_value}`,
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('simple_guesses')
    .insert({
      question_id: question.id,
      value: input.value,
      name: input.name?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: 'Failed to submit guess' }
  }

  return {
    success: true,
    data: {
      id: data.id,
      value: data.value,
      name: data.name,
    },
  }
}

export async function revealAnswer(
  input: RevealAnswerInput
): Promise<RevealAnswerResult> {
  const resolved = await resolveQuestion(input.questionId)

  if ('error' in resolved) {
    return { success: false, error: resolved.error }
  }

  const question = resolved.question

  // Already revealed
  if (question.revealed_at !== null) {
    return {
      success: true,
      data: { trueAnswer: question.true_answer },
    }
  }

  // Check if caller is the creator (Discord user ID match bypasses PIN)
  const isCreator = input.discordUserId &&
    question.discord_user_id &&
    input.discordUserId === question.discord_user_id

  // Check PIN if required (unless caller is creator)
  if (question.reveal_pin !== null && !isCreator) {
    if (!input.pin) {
      return { success: false, error: 'PIN required (or ask the question creator to reveal)' }
    }
    if (input.pin !== question.reveal_pin) {
      return { success: false, error: 'Invalid PIN' }
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('simple_questions')
    .update({ revealed_at: new Date().toISOString() })
    .eq('id', question.id)

  if (error) {
    return { success: false, error: 'Failed to reveal answer' }
  }

  return {
    success: true,
    data: { trueAnswer: question.true_answer },
  }
}
