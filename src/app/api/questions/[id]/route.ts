import { NextResponse } from 'next/server'
import { getQuestion } from '@/lib/services/questions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = await getQuestion(id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json(result.data)
}
