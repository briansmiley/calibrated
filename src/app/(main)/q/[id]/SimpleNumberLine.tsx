'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SimpleQuestion, SimpleGuess } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FaLock, FaCheck, FaPlus } from 'react-icons/fa'
import { IoIosLink } from 'react-icons/io'
import { BsIncognito } from 'react-icons/bs'
import { formatWithCommas } from '@/lib/format'

interface Props {
  question: SimpleQuestion
  initialGuesses: SimpleGuess[]
}

export function SimpleNumberLine({ question, initialGuesses }: Props) {
  const supabase = createClient()
  const lineRef = useRef<HTMLDivElement>(null)

  const [guesses, setGuesses] = useState<SimpleGuess[]>(initialGuesses)
  const [revealed, setRevealed] = useState(question.revealed)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [lockedInNumber, setLockedInNumber] = useState<number | null>(null)
  const [justGuessed, setJustGuessed] = useState(false)
  const [showGuesses, setShowGuesses] = useState(false)
  const [myGuessId, setMyGuessId] = useState<string | null>(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [hoveredGuessId, setHoveredGuessId] = useState<string | null>(null)
  const [answerHovered, setAnswerHovered] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const hasPin = question.reveal_pin !== null

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1500)
  }

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
    if (justGuessed) return
    const value = getValueFromPosition(e.clientX)
    setHoverValue(value)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const submitGuess = async (value: number) => {
    if (justGuessed) return
    if (value < question.min_value || value > question.max_value) return

    const { data, error } = await supabase
      .from('simple_guesses')
      .insert({
        question_id: question.id,
        value: value,
        name: nameInput.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setGuesses((prev) => [...prev, data])
      setJustGuessed(true)
      setShowGuesses(true)
      setMyGuessId(data.id)
      setHoverValue(null)
      setLockedInNumber(null)
      setNameInput('')
      setShowNameInput(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (justGuessed) return
    const value = getValueFromPosition(e.clientX)
    setLockedInNumber(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '') // strip commas
    if (raw === '' || raw === '-') {
      setLockedInNumber(null)
      return
    }
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) {
      setLockedInNumber(parsed)
    }
  }

  const handleInputSubmit = async () => {
    if (lockedInNumber !== null) {
      await submitGuess(lockedInNumber)
    }
  }

  // Validation
  const isInRange = lockedInNumber !== null &&
    lockedInNumber >= question.min_value &&
    lockedInNumber <= question.max_value

  // Get the value to show ghost dot for (hover takes precedence, then locked-in if in range)
  const ghostValue = hoverValue ?? (isInRange ? lockedInNumber : null)

  // Check if current locked-in value is valid for submission
  const isInputValid = isInRange

  // Check if value is out of range (for strikethrough styling)
  const isOutOfRange = lockedInNumber !== null && !isInRange

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


  const formatValue = (value: number): string => {
    const range = question.max_value - question.min_value
    if (range <= 1) return value.toFixed(2)
    if (range <= 10) return value.toFixed(1)
    if (range >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (range >= 1000) return (value / 1000).toFixed(1) + 'K'
    return value.toLocaleString()
  }

  const formatValueWithUnit = (value: number): string => {
    const formatted = formatValue(value)
    if (!question.unit) return formatted
    if (question.is_currency) return `${question.unit}${formatted}`
    return `${formatted} ${question.unit}`
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      {/* Question title and description */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">{question.title}</h1>
        {question.description && (
          <p className="text-muted-foreground mt-2">{question.description}</p>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopyLink}
              className="mt-2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IoIosLink className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{linkCopied ? 'Copied!' : 'Copy link'}</TooltipContent>
        </Tooltip>
      </div>

      {/* Number line container */}
      <div className="py-12">
        <div className="relative h-24">
          {/* The line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/30 -translate-y-1/2" />

          {/* End caps */}
          <div className="absolute top-1/2 left-0 w-1 h-8 bg-muted-foreground/50 -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-1 h-8 bg-muted-foreground/50 -translate-y-1/2" />

          {/* Interactive dot area - tiny inset to center dots on end caps */}
          <div
            ref={lineRef}
            className={`absolute inset-y-0 left-0.5 right-0.5 ${!justGuessed ? 'cursor-crosshair' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {/* Ghost dot - shows for hover or typed input */}
            {ghostValue !== null && !isNaN(ghostValue) && ghostValue >= question.min_value && ghostValue <= question.max_value && !justGuessed && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                style={{ left: `${getPositionFromValue(ghostValue)}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-400/50 border-2 border-zinc-400" />
              </div>
            )}

          {/* Submitted guesses */}
          {showGuesses && (() => {
            // Find closest guess to true answer when revealed
            const closestGuessId = revealed && guesses.length > 0
              ? guesses.reduce((closest, guess) =>
                  Math.abs(guess.value - question.true_answer) < Math.abs(closest.value - question.true_answer)
                    ? guess
                    : closest
                ).id
              : null

            return guesses.map((guess) => {
              const isMyGuess = guess.id === myGuessId
              const isHovered = hoveredGuessId === guess.id
              const isClosest = guess.id === closestGuessId
              // Only show details on hover, or for own guess (not all when revealed - too crowded)
              const showDetails = isMyGuess || isHovered
              return (
                <div
                  key={guess.id}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer ${isHovered ? 'z-20' : ''}`}
                  style={{ left: `${getPositionFromValue(guess.value)}%` }}
                  onMouseEnter={() => setHoveredGuessId(guess.id)}
                  onMouseLeave={() => setHoveredGuessId(null)}
                >
                  {/* Name label above (with arrow only for own guess) */}
                  {showDetails && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className={`text-lg whitespace-nowrap ${isClosest ? 'text-white font-medium' : 'text-muted-foreground'} ${isHovered ? 'bg-zinc-900 px-2 rounded' : ''}`}>
                        {guess.name || <BsIncognito className="h-5 w-5" />}
                      </span>
                      {isMyGuess && (
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-muted-foreground" />
                      )}
                    </div>
                  )}
                  {isClosest ? (
                    // Winner: white diamond
                    <div className="w-4 h-4 bg-white rotate-45 shadow-lg shadow-white/30 ring-2 ring-white/50" />
                  ) : (
                    // Regular guess: circle
                    <div
                      className={`rounded-full transition-all ${
                        isMyGuess ? 'w-5 h-5' : 'w-4 h-4'
                      } ${
                        revealed
                          ? 'bg-zinc-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                  )}
                  {showDetails && (
                    <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 text-lg whitespace-nowrap ${isClosest ? 'text-white font-medium' : 'text-muted-foreground'} ${isHovered ? 'bg-zinc-900 px-2 rounded' : ''}`}>
                      {formatValue(guess.value)}
                    </div>
                  )}
                </div>
              )
            })
          })()}

          {/* True answer (only after user guesses, if revealed) */}
          {revealed && justGuessed && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${answerHovered ? 'z-30' : 'z-10'}`}
              style={{ left: `${getPositionFromValue(question.true_answer)}%` }}
              onMouseEnter={() => setAnswerHovered(true)}
              onMouseLeave={() => setAnswerHovered(false)}
            >
              {/* Checkmark label above */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2">
                <FaCheck className={`h-5 w-5 text-green-500 ${answerHovered ? 'bg-zinc-900 rounded p-0.5 box-content' : ''}`} />
              </div>
              <div className="w-4 h-4 bg-green-500 rotate-45 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50" />
              <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-sm font-bold text-green-500 whitespace-nowrap ${answerHovered ? 'bg-zinc-900 px-2 rounded' : ''}`}>
                {formatValue(question.true_answer)}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Range labels */}
        <div className="flex justify-between text-xl text-muted-foreground mt-2">
          <Tooltip clickable>
            <TooltipTrigger asChild>
              <span>{formatValueWithUnit(question.min_value)}</span>
            </TooltipTrigger>
            <TooltipContent>{formatWithCommas(question.min_value)}</TooltipContent>
          </Tooltip>
          <Tooltip clickable>
            <TooltipTrigger asChild>
              <span>{formatValueWithUnit(question.max_value)}</span>
            </TooltipTrigger>
            <TooltipContent>{formatWithCommas(question.max_value)}</TooltipContent>
          </Tooltip>
        </div>

        {/* Guess input - visible until user has guessed */}
        {!justGuessed && (() => {
          const displayNumber = hoverValue ?? lockedInNumber
          const displayValue = displayNumber !== null ? formatWithCommas(displayNumber) : ''
          const inputWidth = Math.max(displayValue.length || 1, 3) // min 3 chars wide
          return (
          <>
          <div className="flex items-center justify-center gap-3 mt-4">
            <input
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              placeholder="—"
              style={{ width: `${inputWidth + 1}ch` }}
              className={`text-center text-2xl font-mono bg-transparent border-b border-muted-foreground/30 focus:border-primary focus:outline-none py-1 ${isOutOfRange ? 'line-through text-muted-foreground' : ''}`}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <button
                    onClick={handleInputSubmit}
                    disabled={!isInputValid}
                    className="px-4 py-1.5 rounded-lg bg-transparent border border-zinc-500 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Guess
                  </button>
                </span>
              </TooltipTrigger>
              {isOutOfRange && (
                <TooltipContent>Out of range ({formatValue(question.min_value)}-{formatValue(question.max_value)})</TooltipContent>
              )}
            </Tooltip>
          </div>
          {/* Name input */}
          <div className="flex justify-center mt-4">
            {!showNameInput ? (
              <button
                type="button"
                onClick={() => setShowNameInput(true)}
                className="flex items-center gap-1.5 text-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <FaPlus className="h-3.5 w-3.5" />
                <span>Name</span>
              </button>
            ) : (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                onBlur={() => !nameInput.trim() && setShowNameInput(false)}
                placeholder="Name"
                style={{ width: `calc(${Math.max(nameInput.length, 4)}ch + 1rem)` }}
                className="text-center text-xl font-mono bg-transparent border-b border-muted-foreground/30 focus:border-primary focus:outline-none py-1"
                autoFocus
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
            )}
          </div>
          </>
          )
        })()}
      </div>

      {/* Action area */}
      <div className="text-center mt-8 space-y-4">
        {/* Show Revealed Answer button - for questions already revealed */}
        {revealed && !justGuessed && (
          <Button
            variant="outline"
            onClick={() => {
              setJustGuessed(true)
              setShowGuesses(true)
            }}
          >
            Show Revealed Answer
          </Button>
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
                    setPinInput(e.target.value.toLowerCase())
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

        {revealed && justGuessed && (() => {
          const sortedGuesses = [...guesses].sort((a, b) =>
            Math.abs(a.value - question.true_answer) - Math.abs(b.value - question.true_answer)
          )
          const closestGuess = sortedGuesses[0] || null
          return (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-green-500 font-medium">
                  Answer: {formatWithCommas(question.true_answer)}
                </p>
                {closestGuess && (
                  <p className="text-white font-medium">
                    Closest: {closestGuess.name || 'Anonymous'} ({formatWithCommas(closestGuess.value)})
                  </p>
                )}
              </div>

              {/* Guesses table */}
              {sortedGuesses.length > 0 && (
                <table className="w-full max-w-xs mx-auto text-sm">
                  <tbody>
                    {/* Answer row */}
                    <tr className="text-green-500 font-bold">
                      <td className="py-1.5 text-left">Answer</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatWithCommas(question.true_answer)}
                      </td>
                    </tr>
                    {sortedGuesses.map((guess, i) => {
                      const isClosest = i === 0
                      return (
                        <tr key={guess.id} className="border-t border-muted-foreground/20">
                          <td className={`py-1.5 text-left ${isClosest ? 'text-white font-bold' : 'text-muted-foreground'}`}>
                            {guess.name || 'Anonymous'}
                          </td>
                          <td className={`py-1.5 text-right tabular-nums ${isClosest ? 'text-white font-bold' : 'text-muted-foreground'}`}>
                            {isClosest && '*'}{formatWithCommas(guess.value)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
