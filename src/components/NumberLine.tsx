'use client'

import { useState } from 'react'
import { Guess, Question } from '@/types/database'
import { formatValue } from '@/lib/formatValue'

interface NumberLineProps {
  guesses: Guess[]
  question: Question
}

export function NumberLine({ guesses, question }: NumberLineProps) {
  const [hoveredGuess, setHoveredGuess] = useState<Guess | null>(null)

  if (guesses.length === 0) return null

  const guessValues = guesses.map(g => g.value)
  const minGuess = Math.min(...guessValues)
  const maxGuess = Math.max(...guessValues)

  // Include true answer in range calculation if it exists
  const trueAnswer = question.true_answer
  const allValues = trueAnswer !== null ? [...guessValues, trueAnswer] : guessValues
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)

  // Determine range bounds - use min/max if set, otherwise use data range
  const hasMinBound = question.min_value !== null
  const hasMaxBound = question.max_value !== null

  const rangeMin = hasMinBound ? Math.min(question.min_value!, minValue) : minValue
  const rangeMax = hasMaxBound ? Math.max(question.max_value!, maxValue) : maxValue

  // Add some padding if range is 0 (all same value)
  const range = rangeMax - rangeMin || 1
  const padding = range * 0.05

  const displayMin = rangeMin - (hasMinBound ? 0 : padding)
  const displayMax = rangeMax + (hasMaxBound ? 0 : padding)
  const displayRange = displayMax - displayMin || 1

  const getPosition = (value: number) => {
    return ((value - displayMin) / displayRange) * 100
  }

  return (
    <div className="py-8">
      <div className="relative h-16">
        {/* The line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted-foreground/30 -translate-y-1/2" />

        {/* Left cap (if min bound) */}
        {hasMinBound && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-muted-foreground/50"
            style={{ left: `calc(${getPosition(question.min_value!)}% * 0.92 + 4%)` }}
          />
        )}

        {/* Right cap (if max bound) */}
        {hasMaxBound && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-muted-foreground/50"
            style={{ left: `calc(${getPosition(question.max_value!)}% * 0.92 + 4%)` }}
          />
        )}

        {/* Guess dots */}
        {guesses.map((guess) => {
          const isHovered = hoveredGuess?.id === guess.id
          const position = getPosition(guess.value)

          return (
            <div
              key={guess.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform"
              style={{ left: `calc(${position}% * 0.92 + 4%)` }}
              onMouseEnter={() => setHoveredGuess(guess)}
              onMouseLeave={() => setHoveredGuess(null)}
            >
              <div
                className={`w-3 h-3 rounded-full bg-muted-foreground/60 transition-all ${
                  isHovered ? 'scale-150 bg-muted-foreground' : ''
                }`}
              />
              {isHovered && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                  <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-lg">
                    <p className="text-xs font-medium text-foreground">
                      {guess.display_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatValue(guess.value, question.unit_type, question.custom_unit)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* True answer dot */}
        {trueAnswer !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `calc(${getPosition(trueAnswer)}% * 0.92 + 4%)` }}
          >
            <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50" />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <p className="text-xs font-medium text-green-500">
                {formatValue(trueAnswer, question.unit_type, question.custom_unit)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Range labels */}
      <div className="flex justify-between px-4 mt-4 text-xs text-muted-foreground">
        <span>{formatValue(displayMin, question.unit_type, question.custom_unit)}</span>
        <span>{formatValue(displayMax, question.unit_type, question.custom_unit)}</span>
      </div>
    </div>
  )
}
