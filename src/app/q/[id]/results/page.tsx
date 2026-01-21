import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatValue } from '@/lib/formatValue'
import { FaEye } from 'react-icons/fa'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: Props) {
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

  if (!question.revealed) {
    redirect(`/q/${question.slug}`)
  }

  const { data: guesses } = await supabase
    .from('guesses')
    .select('*')
    .eq('question_id', question.id)
    .order('value', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  const isCreator = user?.id === question.creator_id

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{question.title}</CardTitle>
          {question.description && (
            <CardDescription>{question.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {question.true_answer !== null && (
            <div className="mb-4 rounded-md bg-green-900/50 border border-green-700 p-4">
              <p className="text-sm text-green-200">
                True Answer: <span className="text-lg font-bold">{formatValue(question.true_answer, question.unit_type, question.custom_unit)}</span>
              </p>
            </div>
          )}

          {!guesses || guesses.length === 0 ? (
            <p className="text-muted-foreground">No guesses were submitted.</p>
          ) : (
            <div className="space-y-2">
              {guesses.map((guess, index) => {
                const isAnswer = question.true_answer !== null &&
                  Number(guess.value) === Number(question.true_answer)

                return (
                  <div
                    key={guess.id}
                    className={`flex items-center justify-between rounded-md p-3 ${
                      isAnswer
                        ? 'bg-green-900/50 border-2 border-green-500'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <span className={`font-medium ${isAnswer ? 'text-green-300' : 'text-foreground'}`}>
                        {guess.display_name || 'Anonymous'}
                      </span>
                      {guess.prior_visible_guesses !== null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground cursor-help">
                              <FaEye className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Guessed with {guess.prior_visible_guesses} other {guess.prior_visible_guesses === 1 ? 'guess' : 'guesses'} visible
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <span className={`text-lg font-bold ${isAnswer ? 'text-green-300' : 'text-foreground'}`}>
                      {formatValue(guess.value, question.unit_type, question.custom_unit)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            {isCreator && (
              <Button variant="outline" asChild>
                <Link href={`/q/${question.slug}/admin`}>Back to Admin</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
