'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NewGuess {
  id: string
  display_name: string | null
  value: number
  created_at: string | null
  prior_visible_guesses: number | null
}

interface Props {
  questionId: string
  userEmail: string | null
  userId: string | null
  guessesRevealed: boolean
  currentGuessCount: number
  minValue: number | null
  maxValue: number | null
  unitPrefix: string | null
  unitSuffix: string | null
  onGuessSubmitted?: (guess: NewGuess) => void
}

export function GuessForm({ questionId, userEmail, userId, guessesRevealed, currentGuessCount, minValue, maxValue, unitPrefix, unitSuffix, onGuessSubmitted }: Props) {
  const [value, setValue] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      setError('Please enter a valid number')
      setLoading(false)
      return
    }

    const outOfRange = (minValue !== null && numValue < minValue) || (maxValue !== null && numValue > maxValue)
    if (outOfRange) {
      const rangeStr = minValue !== null && maxValue !== null
        ? `${minValue} – ${maxValue}`
        : minValue !== null
        ? `${minValue} or more`
        : `${maxValue} or less`
      setError(`Guess must be in range ${rangeStr}`)
      setLoading(false)
      return
    }

    let finalDisplayName: string

    if (userId && userEmail) {
      const baseName = userEmail.split('@')[0]

      const { data: existingGuesses } = await supabase
        .from('guesses')
        .select('display_name')
        .eq('question_id', questionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (existingGuesses && existingGuesses.length > 0) {
        finalDisplayName = `${baseName} ${existingGuesses.length + 1}`
      } else {
        finalDisplayName = baseName
      }
    } else {
      finalDisplayName = displayName.trim() || 'Anonymous'
    }

    const priorVisibleGuesses = guessesRevealed && currentGuessCount > 0 ? currentGuessCount : null

    const { data: insertedGuess, error: insertError } = await supabase
      .from('guesses')
      .insert({
        question_id: questionId,
        user_id: userId,
        display_name: finalDisplayName,
        value: numValue,
        prior_visible_guesses: priorVisibleGuesses,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Notify parent of the new guess
    if (onGuessSubmitted && insertedGuess) {
      onGuessSubmitted({
        id: insertedGuess.id,
        display_name: insertedGuess.display_name,
        value: insertedGuess.value,
        created_at: insertedGuess.created_at,
        prior_visible_guesses: insertedGuess.prior_visible_guesses,
      })
    }

    setSuccess(true)
    setValue('')
    setDisplayName('')
    setLoading(false)
  }

  if (success) {
    return (
      <div>
        <div className="rounded-md bg-green-900/50 border border-green-700 p-4 text-green-200">
          Your guess has been submitted! Guesses will be revealed by the question creator.
        </div>
        <Button
          variant="link"
          onClick={() => setSuccess(false)}
          className="mt-4 p-0 text-primary"
        >
          Submit another guess
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/20 border border-destructive/50 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!userId && (
        <div className="space-y-2">
          <Label htmlFor="displayName">Your Name (optional)</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Anonymous"
          />
        </div>
      )}

      {userId && userEmail && (
        <p className="text-sm text-muted-foreground">
          Submitting as: <span className="font-medium text-foreground">{userEmail.split('@')[0]}</span>
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="value">Your Guess *</Label>
        <div className="flex items-center gap-2">
          {unitPrefix && <span className="text-muted-foreground">{unitPrefix}</span>}
          <Input
            id="value"
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder="Enter a number"
            min={minValue ?? undefined}
            max={maxValue ?? undefined}
            className="w-48"
          />
          {unitSuffix && <span className="text-muted-foreground">{unitSuffix}</span>}
          {(minValue !== null || maxValue !== null) && (
            <span className="text-xs text-muted-foreground">
              Range: {minValue !== null && maxValue !== null
                ? `${minValue} – ${maxValue}`
                : minValue !== null
                ? `${minValue}+`
                : `≤${maxValue}`}
            </span>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading || !value} className="w-full">
        {loading ? 'Submitting...' : 'Submit Guess'}
      </Button>
    </form>
  )
}
