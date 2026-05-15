import { NextResponse } from 'next/server'
import { createQuestion, CreateQuestionInput } from '@/lib/services/questions'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const rawMin = body.minValue ?? body.min
    const rawMax = body.maxValue ?? body.max
    const rawAnswer = body.trueAnswer ?? body.answer

    const input: CreateQuestionInput = {
      title: body.title,
      description: body.description,
      minValue: rawMin === undefined || rawMin === null ? null : Number(rawMin),
      maxValue: rawMax === undefined || rawMax === null ? null : Number(rawMax),
      trueAnswer: rawAnswer === undefined || rawAnswer === null ? null : Number(rawAnswer),
      unit: body.unit ?? undefined,
      isCurrency: typeof body.isCurrency === 'boolean' ? body.isCurrency : undefined,
      revealPin: body.revealPin ?? body.pin,
    }

    const result = await createQuestion(input)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
