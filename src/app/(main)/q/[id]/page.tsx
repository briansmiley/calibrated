import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { QuestionContent } from './QuestionContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Query by UUID prefix using RPC function (LIKE doesn't work on UUID type)
  const { data: questions, error } = await supabase
    .rpc('get_question_by_prefix', { prefix: id })

  const question = questions?.[0]

  if (error || !question) {
    notFound()
  }

  // Use the short ID for URLs
  const shortId = question.id.slice(0, 7)

  if (question.revealed) {
    redirect(`/q/${shortId}/results`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: guesses } = await supabase
    .from('guesses')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  return (
    <QuestionContent
      question={question}
      guesses={guesses || []}
      userEmail={user?.email || null}
      userId={user?.id || null}
    />
  )
}
