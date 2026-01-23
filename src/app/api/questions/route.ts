import { NextResponse } from 'next/server'
import { createQuestion, CreateQuestionInput } from '@/lib/services/questions'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const input: CreateQuestionInput = {
      title: body.title,
      description: body.description,
      minValue: Number(body.minValue ?? body.min),
      maxValue: Number(body.maxValue ?? body.max),
      trueAnswer: Number(body.trueAnswer ?? body.answer),
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
