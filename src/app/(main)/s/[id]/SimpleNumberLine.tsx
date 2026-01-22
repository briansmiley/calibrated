'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SimpleQuestion, SimpleGuess } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaLock } from 'react-icons/fa'

interface Props {
  question: SimpleQuestion
  initialGuesses: SimpleGuess[]
}

export function SimpleNumberLine({ question, initialGuesses }: Props) {
  const supabase = createClient()
  const lineRef = useRef<HTMLDivElement>(null)

  const [guesses, setGuesses] = useState<SimpleGuess[]>(initialGuesses)
  const [revealed, setRevealed] = useState(question.revealed)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [justGuessed, setJustGuessed] = useState(false)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const hasPin = question.reveal_pin !== null

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`simple_question_${question.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'simple_guesses',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          const newGuess = payload.new as SimpleGuess
          // Avoid duplicates (in case we added optimistically)
          setGuesses((prev) => {
            if (prev.some(g => g.id === newGuess.id)) return prev
            return [...prev, newGuess]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'simple_questions',
          filter: `id=eq.${question.id}`,
        },
        (payload) => {
          if ((payload.new as SimpleQuestion).revealed) {
            setRevealed(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, question.id])

  const getValueFromPosition = (clientX: number): number => {
    if (!lineRef.current) return question.min_value
    const rect = lineRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const value = question.min_value + percent * (question.max_value - question.min_value)
    // Round to reasonable precision
    const range = question.max_value - question.min_value
    if (range <= 1) return Math.round(value * 100) / 100
    if (range <= 10) return Math.round(value * 10) / 10
    if (range <= 100) return Math.round(value)
    return Math.round(value)
  }

  const getPositionFromValue = (value: number): number => {
    return ((value - question.min_value) / (question.max_value - question.min_value)) * 100
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (revealed || justGuessed) return
    const value = getValueFromPosition(e.clientX)
    setHoverValue(value)
    setHoverPosition(getPositionFromValue(value))
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
    setHoverValue(null)
  }

  const handleClick = async (e: React.MouseEvent) => {
    if (revealed || justGuessed) return

    // Calculate value from click position (don't depend on hover state)
    const value = getValueFromPosition(e.clientX)

    const { data, error } = await supabase
      .from('simple_guesses')
      .insert({
        question_id: question.id,
        value: value,
      })
      .select()
      .single()

    if (!error && data) {
      // Optimistically add the guess to local state
      setGuesses((prev) => [...prev, data])
      setJustGuessed(true)
      setHoverPosition(null)
      setHoverValue(null)
    }
  }

  const handleReveal = async () => {
    if (hasPin && !showPinInput) {
      setShowPinInput(true)
      return
    }

    if (hasPin && pinInput !== question.reveal_pin) {
      setPinError(true)
      return
    }

    await supabase
      .from('simple_questions')
      .update({ revealed: true })
      .eq('id', question.id)

    setRevealed(true)
    setShowPinInput(false)
  }

  const handleGuessAgain = () => {
    setJustGuessed(false)
  }

  const formatValue = (value: number): string => {
    const range = question.max_value - question.min_value
    if (range <= 1) return value.toFixed(2)
    if (range <= 10) return value.toFixed(1)
    if (range >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (range >= 1000) return (value / 1000).toFixed(1) + 'K'
    return value.toLocaleString()
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      {/* Question title and description */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{question.title}</h1>
        {question.description && (
          <p className="text-muted-foreground mt-2">{question.description}</p>
        )}
      </div>

      {/* Guess count */}
      <div className="text-center mb-8">
        <span className="text-4xl font-bold">{guesses.length}</span>
        <span className="text-muted-foreground ml-2">
          {guesses.length === 1 ? 'guess' : 'guesses'}
        </span>
      </div>

      {/* Number line container */}
      <div className="py-12">
        <div
          ref={lineRef}
          className={`relative h-24 ${!revealed && !justGuessed ? 'cursor-crosshair' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* The line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/30 -translate-y-1/2" />

          {/* End caps */}
          <div className="absolute top-1/2 left-0 w-1 h-8 bg-muted-foreground/50 -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-1 h-8 bg-muted-foreground/50 -translate-y-1/2" />

          {/* Hover ghost dot */}
          {hoverPosition !== null && !revealed && !justGuessed && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-zinc-400/50 border-2 border-zinc-400" />
            </div>
          )}

          {/* Submitted guesses */}
          {guesses.map((guess) => {
            const pos = getPositionFromValue(guess.value)
            return (
              <div
                key={guess.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pos}%` }}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-all ${
                    revealed
                      ? 'bg-zinc-400'
                      : 'bg-zinc-600'
                  }`}
                />
                {revealed && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatValue(guess.value)}
                  </div>
                )}
              </div>
            )
          })}

          {/* True answer (only when revealed) */}
          {revealed && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${getPositionFromValue(question.true_answer)}%` }}
            >
              <div className="w-4 h-4 bg-green-500 rotate-45 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50" />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-sm font-bold text-green-500 whitespace-nowrap">
                {formatValue(question.true_answer)}
              </div>
            </div>
          )}
        </div>

        {/* Range labels */}
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatValue(question.min_value)}</span>
          <span>{formatValue(question.max_value)}</span>
        </div>

        {/* Hover value display */}
        {hoverValue !== null && !revealed && !justGuessed && (
          <div className="text-center mt-4">
            <span className="text-2xl font-mono">{formatValue(hoverValue)}</span>
          </div>
        )}
      </div>

      {/* Action area */}
      <div className="text-center mt-8 space-y-4">
        {justGuessed && !revealed && (
          <>
            <p className="text-muted-foreground">Guess recorded!</p>
            <Button variant="outline" onClick={handleGuessAgain}>
              Guess again
            </Button>
          </>
        )}

        {!revealed && (
          <div className="flex items-center justify-center gap-2">
            {showPinInput ? (
              <>
                <Input
                  type="text"
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError(false)
                  }}
                  className={`w-32 text-center font-mono ${pinError ? 'border-destructive' : ''}`}
                  maxLength={6}
                />
                <Button onClick={handleReveal}>
                  Reveal
                </Button>
                <Button variant="ghost" onClick={() => setShowPinInput(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleReveal}>
                {hasPin && <FaLock className="mr-2 h-3 w-3" />}
                Reveal Answer
              </Button>
            )}
          </div>
        )}

        {revealed && (
          <p className="text-green-500 font-medium">
            Answer: {formatValue(question.true_answer)}
          </p>
        )}
      </div>
    </div>
  )
}
