'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Props {
  questionId: string
  shortId: string
  guessesRevealed: boolean
  revealed: boolean
  guessCount: number
  hasAnswer: boolean
}

export function AdminControls({ questionId, shortId, guessesRevealed, revealed, guessCount, hasAnswer }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRevealGuesses = async () => {
    if (!confirm('Reveal all guesses? Participants will see each other\'s answers but can still submit new guesses.')) {
      return
    }

    setLoading('guesses')
    setError(null)

    const { error: updateError } = await supabase
      .from('questions')
      .update({ guesses_revealed: true })
      .eq('id', questionId)

    if (updateError) {
      setError(updateError.message)
      setLoading(null)
      return
    }

    setLoading(null)
    router.refresh()
  }

  const handleRevealAnswer = async () => {
    if (!confirm('Reveal the answer? This will close submissions.')) {
      return
    }

    setLoading('answer')
    setError(null)

    const { error: updateError } = await supabase
      .from('questions')
      .update({ revealed: true, guesses_revealed: true })
      .eq('id', questionId)

    if (updateError) {
      setError(updateError.message)
      setLoading(null)
      return
    }

    router.push(`/q/${shortId}/results`)
  }

  const handleRevealAll = async () => {
    if (!confirm('Reveal everything? This will show all guesses and the answer, and close submissions.')) {
      return
    }

    setLoading('all')
    setError(null)

    const { error: updateError } = await supabase
      .from('questions')
      .update({ revealed: true, guesses_revealed: true })
      .eq('id', questionId)

    if (updateError) {
      setError(updateError.message)
      setLoading(null)
      return
    }

    router.push(`/q/${shortId}/results`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      return
    }

    setLoading('delete')
    setError(null)

    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(null)
      return
    }

    router.push('/dashboard')
  }

  if (revealed) {
    return (
      <div className="space-y-6">
        <div>
          <Button onClick={() => router.push(`/q/${shortId}/results`)}>
            View Results
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading === 'delete'}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading === 'delete' ? 'Deleting...' : 'Delete Question'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/20 border border-destructive/50 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Reveal</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {guessesRevealed
            ? 'Guesses are visible. Reveal the answer when ready.'
            : 'Reveal guesses first to let participants see each other, or reveal everything at once.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {!guessesRevealed && (
            <Button
              onClick={handleRevealGuesses}
              disabled={loading !== null || guessCount === 0}
              variant="secondary"
              size="sm"
            >
              {loading === 'guesses' ? 'Revealing...' : 'Reveal Guesses'}
            </Button>
          )}

          {hasAnswer && (
            <Button
              onClick={guessesRevealed ? handleRevealAnswer : handleRevealAll}
              disabled={loading !== null || guessCount === 0}
              size="sm"
              className="bg-green-600 hover:bg-green-500"
            >
              {loading === 'answer' || loading === 'all'
                ? 'Revealing...'
                : guessesRevealed
                  ? 'Reveal Answer'
                  : 'Reveal All'}
            </Button>
          )}

          {!hasAnswer && (
            <Button
              onClick={handleRevealAll}
              disabled={loading !== null || guessCount === 0}
              size="sm"
              className="bg-green-600 hover:bg-green-500"
            >
              {loading === 'all' ? 'Revealing...' : 'Reveal & Close'}
            </Button>
          )}
        </div>

        {guessCount === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Wait for some guesses before revealing.
          </p>
        )}
      </div>

      <div className="pt-6 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={loading === 'delete'}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {loading === 'delete' ? 'Deleting...' : 'Delete Question'}
        </Button>
      </div>
    </div>
  )
}
