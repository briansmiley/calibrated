'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SimpleQuestion, SimpleGuess } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FaLock, FaCheck, FaPlus, FaEye } from 'react-icons/fa'
import { IoIosLink } from 'react-icons/io'
import { BsIncognito } from 'react-icons/bs'
import { formatWithCommas } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  question: SimpleQuestion
  initialGuesses: SimpleGuess[]
}

export function SimpleNumberLine({ question, initialGuesses }: Props) {
  const supabase = createClient()
  const lineRef = useRef<HTMLDivElement>(null)

  // Core state
  const [guesses, setGuesses] = useState<SimpleGuess[]>(initialGuesses)
  const [revealed, setRevealed] = useState(question.revealed_at !== null)
  const [showResults, setShowResults] = useState(false) // Shows guesses, hides input, shows table
  const [myGuessId, setMyGuessId] = useState<string | null>(null) // Track user's own guess for arrow

  // Input state
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [lockedInNumber, setLockedInNumber] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // UI state
  const [showPinInput, setShowPinInput] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [hoveredGuessId, setHoveredGuessId] = useState<string | null>(null)
  const [answerHovered, setAnswerHovered] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showRevealDialog, setShowRevealDialog] = useState(false)
  const [showSeeGuessesDialog, setShowSeeGuessesDialog] = useState(false)

  const hasPin = question.reveal_pin !== null

  // Load saved name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('calibrated_name')
    if (savedName) {
      setNameInput(savedName)
      setShowNameInput(true)
    }
  }, [])

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
          if ((payload.new as SimpleQuestion).revealed_at !== null) {
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
    if (showResults) return
    const value = getValueFromPosition(e.clientX)
    setHoverValue(value)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showResults) return
    const touch = e.touches[0]
    if (touch) {
      const value = getValueFromPosition(touch.clientX)
      setHoverValue(value)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showResults) return
    const touch = e.touches[0]
    if (touch) {
      const value = getValueFromPosition(touch.clientX)
      setHoverValue(value)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showResults) return
    const touch = e.changedTouches[0]
    if (touch) {
      const value = getValueFromPosition(touch.clientX)
      setLockedInNumber(value)
      setInputValue(formatWithCommas(value))
    }
    setHoverValue(null)
  }

  const submitGuess = async (value: number) => {
    if (showResults) return
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
      if (nameInput.trim()) {
        localStorage.setItem('calibrated_name', nameInput.trim())
      } else {
        localStorage.removeItem('calibrated_name')
      }

      setGuesses((prev) => [...prev, data])
      setMyGuessId(data.id)
      setShowResults(true)
      setHoverValue(null)
      setLockedInNumber(null)
      setInputValue('')
      setNameInput('')
      setShowNameInput(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (showResults) return
    const value = getValueFromPosition(e.clientX)
    setLockedInNumber(value)
    setInputValue(formatWithCommas(value))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw === '' || raw === '-' || /^-?\d*\.?\d*$/.test(raw)) {
      setInputValue(raw)
      if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
        setLockedInNumber(null)
      } else {
        const parsed = parseFloat(raw)
        if (!isNaN(parsed)) {
          setLockedInNumber(parsed)
        }
      }
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

  const ghostValue = hoverValue ?? (isInRange ? lockedInNumber : null)
  const isInputValid = isInRange
  const isOutOfRange = lockedInNumber !== null && !isInRange

  const handleRevealClick = () => {
    if (hasPin) {
      setShowPinInput(true)
    } else {
      setShowRevealDialog(true)
    }
  }

  const handleReveal = async () => {
    if (hasPin && pinInput !== question.reveal_pin) {
      setPinError(true)
      return
    }

    await supabase
      .from('simple_questions')
      .update({ revealed_at: new Date().toISOString() })
      .eq('id', question.id)

    setRevealed(true)
    setShowPinInput(false)
    setShowRevealDialog(false)
  }

  const handleSeeGuesses = () => {
    setShowResults(true)
    setShowSeeGuessesDialog(false)
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

  // Computed values for results display
  const sortedGuesses = [...guesses].sort((a, b) =>
    Math.abs(a.value - question.true_answer) - Math.abs(b.value - question.true_answer)
  )
  const closestGuess = sortedGuesses[0] || null
  const closestGuessId = revealed && closestGuess ? closestGuess.id : null

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

          {/* Interactive dot area */}
          <div
            ref={lineRef}
            className={`absolute inset-y-0 left-0.5 right-0.5 ${!showResults ? 'cursor-crosshair' : ''} touch-none`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ghost dot - shows for hover or typed input when not in results view */}
            {!showResults && ghostValue !== null && !isNaN(ghostValue) && ghostValue >= question.min_value && ghostValue <= question.max_value && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                style={{ left: `${getPositionFromValue(ghostValue)}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-400/50 border-2 border-zinc-400" />
              </div>
            )}

            {/* Submitted guesses - visible when showResults */}
            {showResults && guesses.map((guess) => {
              const isMyGuess = guess.id === myGuessId
              const isHovered = hoveredGuessId === guess.id
              const isClosest = guess.id === closestGuessId
              const showDetails = isMyGuess || isHovered

              return (
                <div
                  key={guess.id}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer ${isHovered ? 'z-20' : ''}`}
                  style={{ left: `${getPositionFromValue(guess.value)}%` }}
                  onMouseEnter={() => setHoveredGuessId(guess.id)}
                  onMouseLeave={() => setHoveredGuessId(null)}
                >
                  {/* Name label above */}
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
                    <div className="w-5 h-5 rounded-full bg-white" />
                  ) : (
                    <div
                      className={`rounded-full transition-all ${
                        isMyGuess ? 'w-5 h-5' : 'w-4 h-4'
                      } ${
                        revealed ? 'bg-zinc-400' : 'bg-zinc-600'
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
            })}

            {/* True answer - only when showResults AND revealed */}
            {showResults && revealed && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${answerHovered ? 'z-30' : 'z-10'}`}
                style={{ left: `${getPositionFromValue(question.true_answer)}%` }}
                onMouseEnter={() => setAnswerHovered(true)}
                onMouseLeave={() => setAnswerHovered(false)}
              >
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

        {/* Guess input - visible when NOT in results view */}
        {!showResults && (() => {
          const displayValue = hoverValue !== null ? formatWithCommas(hoverValue) : inputValue
          const inputWidth = Math.max(displayValue.length || 1, 3)
          return (
            <>
              <div className="flex items-center justify-center gap-3 mt-4">
                {question.unit && question.is_currency && (
                  <span className="text-2xl text-muted-foreground">{question.unit}</span>
                )}
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
                {question.unit && !question.is_currency && (
                  <span className="text-2xl text-muted-foreground">{question.unit}</span>
                )}
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
        {/* Guess count with see guesses button */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-muted-foreground">
            Guesses: {guesses.length}
          </span>
          {!showResults && (
            <AlertDialog open={showSeeGuessesDialog} onOpenChange={setShowSeeGuessesDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <FaEye className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>See current guesses?</AlertDialogTitle>
                  <AlertDialogDescription>
                    I&apos;ve already guessed and want to see the current guesses. I&apos;m not doing this to cheat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSeeGuesses}
                    className="bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    Show Guesses
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Show Results button - for questions already revealed, when user hasn't seen results yet */}
        {revealed && !showResults && (
          <Button
            variant="outline"
            onClick={() => setShowResults(true)}
          >
            Show Revealed Answer
          </Button>
        )}

        {/* Reveal Answer button - only when not revealed */}
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
              <Button variant="outline" onClick={handleRevealClick}>
                {hasPin && <FaLock className="mr-2 h-3 w-3" />}
                Reveal Answer
              </Button>
            )}
          </div>
        )}

        {/* Reveal confirmation dialog for non-PIN questions */}
        <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal the answer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reveal the answer for everyone viewing this question. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReveal}
                className="bg-red-500/80 hover:bg-red-500 text-white"
              >
                Reveal Answer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Results table - visible when showResults */}
        {showResults && (
          <div className="space-y-4">
            {/* Answer summary - only when revealed */}
            {revealed && (
              <div className="space-y-1">
                <p className="text-green-500 font-medium">
                  Answer: {formatValueWithUnit(question.true_answer)}
                </p>
                {closestGuess && (
                  <p className="text-white font-medium">
                    Closest: {closestGuess.name || 'Anonymous'} ({formatValueWithUnit(closestGuess.value)})
                  </p>
                )}
              </div>
            )}

            {/* Guesses table */}
            {sortedGuesses.length > 0 && (
              <table className="w-full max-w-xs mx-auto text-sm">
                <tbody>
                  {/* Answer row - only when revealed */}
                  {revealed && (
                    <tr className="text-green-500 font-bold">
                      <td className="py-1.5 px-2 text-left">Answer</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">
                        {formatValueWithUnit(question.true_answer)}
                      </td>
                    </tr>
                  )}
                  {sortedGuesses.map((guess, i) => {
                    const isClosest = revealed && i === 0
                    const isHovered = hoveredGuessId === guess.id
                    const timestamp = guess.created_at
                      ? new Date(guess.created_at).toLocaleString()
                      : null
                    return (
                      <Tooltip key={guess.id}>
                        <TooltipTrigger asChild>
                          <tr
                            className={`border-t border-muted-foreground/20 cursor-default transition-colors ${isHovered ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                            onMouseEnter={() => setHoveredGuessId(guess.id)}
                            onMouseLeave={() => setHoveredGuessId(null)}
                            onTouchStart={() => setHoveredGuessId(guess.id)}
                          >
                            <td className={`py-1.5 px-2 text-left ${isClosest ? 'text-white font-bold' : isHovered ? 'text-white' : 'text-muted-foreground'}`}>
                              {guess.name || 'Anonymous'}
                            </td>
                            <td className={`py-1.5 px-2 text-right tabular-nums ${isClosest ? 'text-white font-bold' : isHovered ? 'text-white' : 'text-muted-foreground'}`}>
                              {isClosest && '*'}{formatValueWithUnit(guess.value)}
                            </td>
                          </tr>
                        </TooltipTrigger>
                        {timestamp && <TooltipContent>{timestamp}</TooltipContent>}
                      </Tooltip>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
