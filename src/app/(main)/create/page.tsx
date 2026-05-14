'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FaLock, FaLockOpen, FaPlus, FaQuestionCircle, FaRegCopy } from 'react-icons/fa'

function generatePin(): string {
  // Generate 4 digit PIN where not all digits are the same
  let pin: string
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString()
  } while (new Set(pin).size === 1) // Regenerate if all digits are the same
  return pin
}

export default function CreateSimplePage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [description, setDescription] = useState('')
  const [showUnits, setShowUnits] = useState(false)
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [trueAnswer, setTrueAnswer] = useState('')
  const [unit, setUnit] = useState('')
  const [isCurrency, setIsCurrency] = useState(false)
  const [useLock, setUseLock] = useState(false)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showNoPinWarning, setShowNoPinWarning] = useState(false)
  const [parsedValues, setParsedValues] = useState<{
    min: number | null
    max: number | null
    answer: number | null
  } | null>(null)

  const handleCopyPin = async () => {
    await navigator.clipboard.writeText(pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleToggleLock = () => {
    if (!useLock) {
      setPin(generatePin())
    } else {
      setPin('')
    }
    setUseLock(!useLock)
  }

  const handleCreate = () => {
    setError(null)

    if (!title.trim()) {
      setError('Please enter a question')
      return
    }

    const min = minValue.trim() ? parseFloat(minValue) : null
    const max = maxValue.trim() ? parseFloat(maxValue) : null
    const answer = trueAnswer.trim() ? parseFloat(trueAnswer) : null

    if (answer !== null && isNaN(answer)) {
      setError('Please enter a valid answer')
      return
    }

    if (min !== null && isNaN(min)) {
      setError('Please enter a valid min value')
      return
    }

    if (max !== null && isNaN(max)) {
      setError('Please enter a valid max value')
      return
    }

    if (min !== null && max !== null && min >= max) {
      setError('Min must be less than max')
      return
    }

    if (answer !== null && min !== null && answer < min) {
      setError('Answer must be at least min value')
      return
    }

    if (answer !== null && max !== null && answer > max) {
      setError('Answer must be at most max value')
      return
    }

    const parsed = { min, max, answer }
    setParsedValues(parsed)

    if (!useLock) {
      setShowNoPinWarning(true)
      return
    }

    void confirmCreate(parsed)
  }

  const confirmCreate = async (
    parsed: { min: number | null; max: number | null; answer: number | null } | null = parsedValues
  ) => {
    if (!parsed) return

    setLoading(true)

    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        minValue: parsed.min,
        maxValue: parsed.max,
        trueAnswer: parsed.answer,
        unit,
        isCurrency,
        revealPin: useLock && pin ? pin : null,
      }),
    })

    if (!response.ok) {
      const { error: apiError } = await response.json().catch(() => ({ error: 'Failed to create question' }))
      setError(apiError || 'Failed to create question')
      setLoading(false)
      return
    }

    const { shortId } = await response.json()
    router.push(`/q/${shortId}`)
  }

  const isValid = title.trim() && (!useLock || pin)

  return (
    <div className="mx-auto max-w-xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Pose Question</h1>
      </div>

      <div className="space-y-4">
        {/* Question title */}
        <Input
          variant="underline"
          type="text"
          placeholder="Question *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg w-full"
        />

        {/* Description toggle/field */}
        {!showDescription ? (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaPlus className="h-3 w-3" />
            <span>Details (optional)</span>
          </button>
        ) : (
          <Input
            variant="underline"
            type="text"
            placeholder="Details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full"
          />
        )}

        {/* Answer with units toggle */}
        <div className="flex items-center gap-6">
          <Input
            variant="underline"
            type="number"
            placeholder="Answer"
            value={trueAnswer}
            onChange={(e) => setTrueAnswer(e.target.value)}
            className="w-32"
          />
          {!showUnits ? (
            <button
              type="button"
              onClick={() => setShowUnits(true)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FaPlus className="h-3 w-3" />
              <span>Units</span>
            </button>
          ) : (
            <>
              <Input
                variant="underline"
                type="text"
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: `${Math.max(unit.length, 4) + 1}ch` }}
                className="font-mono"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={isCurrency}
                  onCheckedChange={(checked) => setIsCurrency(checked === true)}
                  className="size-5 border-2 border-zinc-500 bg-transparent data-[state=checked]:!bg-transparent data-[state=checked]:text-zinc-400 data-[state=checked]:border-zinc-500"
                />
                <span>Currency?</span>
              </label>
            </>
          )}
        </div>

        {/* Guess Range (optional) */}
        <div className="flex items-center gap-2">
          <Input
            variant="underline"
            type="number"
            placeholder="Min"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            className="w-24 text-center"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            variant="underline"
            type="number"
            placeholder="Max"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            className="w-24 text-center"
          />
        </div>

        {/* PIN and Create */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Tooltip clickable>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help">
                  <FaQuestionCircle className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Set a PIN to password-protect revealing the actual value
              </TooltipContent>
            </Tooltip>
            <span className="text-sm font-bold">Pin</span>
            <button
              type="button"
              onClick={handleToggleLock}
              className={`p-2 rounded-md transition-colors ${
                useLock
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {useLock ? <FaLock className="h-4 w-4" /> : <FaLockOpen className="h-4 w-4" />}
            </button>

            {useLock && (
              <>
                <Input
                  variant="underline"
                  type="text"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 20))}
                  className="w-32 text-center font-mono"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Copy PIN"
                >
                  {copied ? <span className="text-xs">Copied!</span> : <FaRegCopy className="h-4 w-4" />}
                </button>
              </>
            )}
          </div>

          <div className="flex-1" />

          <Button onClick={handleCreate} disabled={!isValid || loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        {useLock && pin && (
          <p className="text-sm text-muted-foreground">
            Save this PIN to reveal later: <span className="font-mono font-bold">{pin}</span>
          </p>
        )}
      </div>

      <AlertDialog open={showNoPinWarning} onOpenChange={setShowNoPinWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {trueAnswer.trim()
                ? 'Create without a PIN?'
                : 'Create without a PIN or answer?'}
            </AlertDialogTitle>
            {trueAnswer.trim() ? (
              <AlertDialogDescription>
                Anyone with the link can reveal the answer to everyone. Even after the answer is revealed, viewers will still be able to guess before opting to see it.
              </AlertDialogDescription>
            ) : (
              <>
                <AlertDialogDescription>
                  Anyone with the link can:
                </AlertDialogDescription>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>set the answer to anything they choose</li>
                  <li>set the status to revealed</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Even after an answer is set/revealed, viewers will still be able to guess before opting to see it.
                </p>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmCreate()}>
              Create anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
