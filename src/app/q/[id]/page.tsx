import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { GuessForm } from './GuessForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatValue, getUnitDisplay } from '@/lib/formatValue'
import { formatTimestamp } from '@/lib/formatDate'
import { FaEye } from 'react-icons/fa'

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

  const { prefix, suffix } = getUnitDisplay(question.unit_type, question.custom_unit)
  const hasAnswer = question.true_answer !== null
  const guessesRevealed = question.guesses_revealed

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{question.title}</CardTitle>
          {question.description && (
            <CardDescription>{question.description}</CardDescription>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Created {formatTimestamp(question.created_at)}
          </p>
        </CardHeader>
        {hasAnswer && (
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Answer:</span>
              {prefix && <span>{prefix}</span>}
              <span className="inline-block w-16 h-6 bg-muted rounded blur-[2px]" />
              {suffix && <span>{suffix}</span>}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Submit Your Guess</CardTitle>
        </CardHeader>
        <CardContent>
          <GuessForm
            questionId={question.id}
            userEmail={user?.email || null}
            userId={user?.id || null}
            guessesRevealed={guessesRevealed}
            currentGuessCount={guesses?.length || 0}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Guesses ({guesses?.length || 0})
            {guessesRevealed && <span className="ml-2 text-sm font-normal text-green-500">Revealed</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!guesses || guesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guesses yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {guesses.map((guess) => (
                <div key={guess.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
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
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(guess.created_at)}
                    </span>
                  </div>
                  {guessesRevealed ? (
                    <span className="font-mono text-foreground">
                      {formatValue(guess.value, question.unit_type, question.custom_unit)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {prefix && <span>{prefix}</span>}
                      <span className="inline-block w-12 h-5 bg-muted rounded blur-[2px]" />
                      {suffix && <span>{suffix}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
