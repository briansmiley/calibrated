import { NextResponse } from 'next/server'
import { revealAnswer } from '@/lib/services/questions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json().catch(() => ({}))

    const result = await revealAnswer({
      questionId: id,
      pin: body.pin,
    })

    if (!result.success) {
      const status =
        result.error === 'Question not found'
          ? 404
          : result.error === 'PIN required' || result.error === 'Invalid PIN'
            ? 401
            : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json(result.data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
