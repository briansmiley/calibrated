'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatValue, getUnitDisplay } from '@/lib/formatValue'
import { LocalTime } from '@/components/LocalTime'
import { FaEye } from 'react-icons/fa'
import { GuessForm } from './GuessForm'
import { PasswordGate } from '@/components/PasswordGate'
import { Question, Guess } from '@/types/database'

interface QuestionContentProps {
  question: Question
  guesses: Guess[]
  userEmail: string | null
  userId: string | null
}

export function QuestionContent({ question, guesses: initialGuesses, userEmail, userId }: QuestionContentProps) {
  const [guesses, setGuesses] = useState<Guess[]>(initialGuesses)
  const { prefix, suffix } = getUnitDisplay(question.unit_type, question.custom_unit)
  const hasAnswer = question.true_answer !== null
  const guessesRevealed = question.guesses_revealed
  const isCreator = userId === question.creator_id

  const handleGuessSubmitted = (newGuess: { id: string; display_name: string | null; value: number; created_at: string; prior_visible_guesses: number | null }) => {
    setGuesses(prev => [...prev, newGuess as Guess])
  }

  const content = (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle>{question.title}</CardTitle>
            {isCreator && (
              <Link
                href={`/q/${question.slug}/admin`}
                className="text-sm text-primary hover:underline shrink-0"
              >
                Manage
              </Link>
            )}
          </div>
          {question.description && (
            <CardDescription className="text-base text-foreground/80">{question.description}</CardDescription>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Created <LocalTime date={question.created_at} />
          </p>
        </CardHeader>
        {hasAnswer && (
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Answer:</span>
              {prefix && <span>{prefix}</span>}
              <span className="inline-block w-16 h-6 bg-muted-foreground/40 rounded blur-[2px]" />
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
            userEmail={userEmail}
            userId={userId}
            guessesRevealed={guessesRevealed}
            currentGuessCount={guesses.length}
            minValue={question.min_value}
            maxValue={question.max_value}
            unitPrefix={prefix}
            unitSuffix={suffix}
            onGuessSubmitted={handleGuessSubmitted}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Guesses ({guesses.length})
            {guessesRevealed && <span className="ml-2 text-sm font-normal text-green-500">Revealed</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guesses.length === 0 ? (
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
                    <LocalTime date={guess.created_at} className="text-xs text-muted-foreground" />
                  </div>
                  {guessesRevealed ? (
                    <span className="font-mono text-foreground">
                      {formatValue(guess.value, question.unit_type, question.custom_unit)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {prefix && <span>{prefix}</span>}
                      <span className="inline-block w-12 h-5 bg-muted-foreground/40 rounded blur-[2px]" />
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

  if (question.password) {
    return (
      <PasswordGate
        questionId={question.id}
        questionTitle={question.title}
        correctPassword={question.password}
      >
        {content}
      </PasswordGate>
    )
  }

  return content
}
