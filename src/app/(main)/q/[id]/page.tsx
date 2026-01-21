import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { QuestionContent } from './QuestionContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', id)
    .single()

  if (error || !question) {
    notFound()
  }

  if (question.revealed) {
    redirect(`/q/${question.slug}/results`)
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
