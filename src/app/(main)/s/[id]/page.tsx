import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SimpleNumberLine } from './SimpleNumberLine'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SimpleQuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Query by UUID prefix
  const { data: questions, error } = await supabase
    .rpc('get_simple_question_by_prefix', { prefix: id })

  const question = questions?.[0]

  if (error || !question) {
    notFound()
  }

  // Get guesses
  const { data: guesses } = await supabase
    .from('simple_guesses')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  return (
    <SimpleNumberLine
      question={question}
      initialGuesses={guesses || []}
    />
  )
}
