import { NextResponse } from 'next/server'
import { submitGuess } from '@/lib/services/questions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()

    const result = await submitGuess({
      questionId: id,
      value: Number(body.value),
      name: body.name,
    })

    if (!result.success) {
      const status = result.error === 'Question not found' ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
