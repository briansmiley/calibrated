'use client'

import { useState } from 'react'
import { Guess, Question } from '@/types/database'
import { formatValue } from '@/lib/formatValue'

interface NumberLineProps {
  guesses: Guess[]
  question: Question
  showAnswer?: boolean
  creatorName?: string
}

export function NumberLine({ guesses, question, showAnswer = true, creatorName }: NumberLineProps) {
  const [hoveredGuess, setHoveredGuess] = useState<Guess | null>(null)
  const [answerHovered, setAnswerHovered] = useState(false)

  if (guesses.length === 0) return null

  const guessValues = guesses.map(g => g.value)

  // Include true answer in range calculation only if we're showing it
  const trueAnswer = question.true_answer
  const includeAnswer = showAnswer && trueAnswer !== null
  const allValues = includeAnswer ? [...guessValues, trueAnswer] : guessValues
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)

  // Determine range bounds - use min/max if set, otherwise use data range
  const hasMinBound = question.min_value !== null
  const hasMaxBound = question.max_value !== null

  const rangeMin = hasMinBound ? Math.min(question.min_value!, minValue) : minValue
  const rangeMax = hasMaxBound ? Math.max(question.max_value!, maxValue) : maxValue

  // Add some padding if no bounds (so dots aren't at the very edge)
  const range = rangeMax - rangeMin || 1
  const padding = range * 0.05

  const displayMin = hasMinBound ? rangeMin : rangeMin - padding
  const displayMax = hasMaxBound ? rangeMax : rangeMax + padding
  const displayRange = displayMax - displayMin || 1

  const getPosition = (value: number) => {
    return ((value - displayMin) / displayRange) * 100
  }

  return (
    <div className="py-8 px-4">
      <div className="relative h-16">
        {/* The line - full width of container */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/30 -translate-y-1/2" />

        {/* Left cap (if min bound) */}
        {hasMinBound && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-muted-foreground/50"
            style={{ left: `${getPosition(question.min_value!)}%` }}
          />
        )}

        {/* Right cap (if max bound) */}
        {hasMaxBound && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-muted-foreground/50"
            style={{ left: `${getPosition(question.max_value!)}%` }}
          />
        )}

        {/* Guess dots */}
        {guesses.map((guess) => {
          const isHovered = hoveredGuess?.id === guess.id
          const position = getPosition(guess.value)

          return (
            <div
              key={guess.id}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer ${
                isHovered ? 'z-40' : ''
              }`}
              style={{ left: `${position}%` }}
              onMouseEnter={() => setHoveredGuess(guess)}
              onMouseLeave={() => setHoveredGuess(null)}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all duration-200 ease-out ${
                  isHovered
                    ? 'w-8 h-8 bg-zinc-400 text-zinc-900 text-sm font-bold'
                    : 'w-3 h-3 bg-zinc-500'
                }`}
              >
                {isHovered && formatValue(guess.value, question.unit_type ?? 'none', question.custom_unit)}
              </div>
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                  <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-lg">
                    <p className="text-xs font-medium text-foreground">
                      {guess.display_name || 'Anonymous'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* True answer diamond - only show if showAnswer is true */}
        {includeAnswer && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
            style={{ left: `${getPosition(trueAnswer!)}%` }}
            onMouseEnter={() => setAnswerHovered(true)}
            onMouseLeave={() => setAnswerHovered(false)}
          >
            <div
              className={`w-2.5 h-2.5 bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50 rotate-45 transition-transform duration-200 ease-out ${
                answerHovered ? 'scale-150' : ''
              }`}
            />
            {answerHovered && creatorName && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-lg">
                  <p className="text-xs font-medium text-foreground">
                    {creatorName}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <p className="text-xs font-medium text-green-500">
                {formatValue(trueAnswer!, question.unit_type ?? 'none', question.custom_unit)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Range labels */}
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{formatValue(displayMin, question.unit_type ?? 'none', question.custom_unit)}</span>
        <span>{formatValue(displayMax, question.unit_type ?? 'none', question.custom_unit)}</span>
      </div>
    </div>
  )
}
