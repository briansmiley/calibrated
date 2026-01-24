'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  const supabase = createClient()

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

  const handleCreate = async () => {
    setError(null)

    if (!title.trim()) {
      setError('Please enter a question')
      return
    }

    const min = parseFloat(minValue)
    const max = parseFloat(maxValue)
    const answer = parseFloat(trueAnswer)

    if (isNaN(min) || isNaN(max) || isNaN(answer)) {
      setError('Please enter valid numbers')
      return
    }

    if (min >= max) {
      setError('Min must be less than max')
      return
    }

    if (answer < min || answer > max) {
      setError('Answer must be between min and max')
      return
    }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('simple_questions')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        min_value: min,
        max_value: max,
        true_answer: answer,
        unit: unit.trim() || null,
        is_currency: isCurrency,
        reveal_pin: useLock && pin ? pin : null,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('Failed to create question')
      setLoading(false)
      return
    }

    const shortId = data.id.slice(0, 7)
    router.push(`/q/${shortId}`)
  }

  const isValid = title.trim() && minValue && maxValue && trueAnswer && (!useLock || pin)

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
            placeholder="Answer *"
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
                placeholder="Unit (e.g. kg, miles)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-40"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={isCurrency}
                  onCheckedChange={(checked) => setIsCurrency(checked === true)}
                  className="size-5 border-2 border-zinc-500 bg-black data-[state=checked]:bg-black data-[state=checked]:text-zinc-400 data-[state=checked]:border-zinc-500"
                />
                <span>Currency?</span>
              </label>
            </>
          )}
        </div>

        {/* Guess Range */}
        <div className="flex items-center gap-2">
          <Input
            variant="underline"
            type="number"
            placeholder="Min *"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            className="w-24 text-center"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            variant="underline"
            type="number"
            placeholder="Max *"
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
    </div>
  )
}
