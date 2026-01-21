import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AdminControls } from './AdminControls'
import { SlugEditor } from './SlugEditor'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatValue } from '@/lib/formatValue'
import { LocalTime } from '@/components/LocalTime'
import { FaEye } from 'react-icons/fa'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/q/${id}/admin`)
  }

  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', id)
    .single()

  if (error || !question) {
    notFound()
  }

  if (question.creator_id !== user.id) {
    redirect(`/q/${question.slug}`)
  }

  const { data: guesses } = await supabase
    .from('guesses')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  const guessCount = guesses?.length || 0
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{question.title}</h1>
          <Link
            href={`/q/${question.slug}`}
            className="text-sm text-primary hover:underline shrink-0"
          >
            View Public
          </Link>
        </div>
        {question.description && (
          <p className="mt-1 text-muted-foreground">{question.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <Badge
            variant={question.revealed ? 'default' : 'secondary'}
            className={question.revealed ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}
          >
            {question.revealed ? 'Revealed' : 'Open'}
          </Badge>
          {question.true_answer !== null && (
            <span className="text-sm text-muted-foreground">
              Answer: <span className="font-medium text-foreground">{formatValue(question.true_answer, question.unit_type, question.custom_unit)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Share Link */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Share Link</h2>
        <SlugEditor
          questionId={question.id}
          currentSlug={question.slug}
          baseUrl={baseUrl}
        />
      </div>

      {/* Guesses */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Guesses ({guessCount})
        </h2>
        {!guesses || guesses.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No guesses yet.</p>
        ) : (
          <div className="space-y-2">
            {guesses.map((guess) => (
              <div key={guess.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
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
                <span className="font-mono">
                  {formatValue(guess.value, question.unit_type, question.custom_unit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <AdminControls
        questionId={question.id}
        slug={question.slug}
        guessesRevealed={question.guesses_revealed}
        revealed={question.revealed}
        guessCount={guessCount}
        hasAnswer={question.true_answer !== null}
      />
    </div>
  )
}
