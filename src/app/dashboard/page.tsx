import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Question } from '@/types/database'
import { Button } from '@/components/ui/button'
import { QuestionCard } from './QuestionCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  const questions: Question[] = data || []

  if (error) {
    console.error('Error fetching questions:', error)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Questions</h1>
        <Button asChild>
          <Link href="/new">New Question</Link>
        </Button>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">You haven&apos;t created any questions yet.</p>
          <Link
            href="/new"
            className="mt-4 inline-block text-primary hover:text-accent"
          >
            Create your first question
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  )
}
