'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FaLock, FaLockOpen, FaPlus } from 'react-icons/fa'

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function CreateSimplePage() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [description, setDescription] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [trueAnswer, setTrueAnswer] = useState('')
  const [useLock, setUseLock] = useState(false)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    router.push(`/s/${shortId}`)
  }

  const isValid = title.trim() && minValue && maxValue && trueAnswer && (!useLock || pin)

  return (
    <div className="mx-auto max-w-xl py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Quick Question</h1>
        <p className="text-muted-foreground">
          Create a number line. Share the link. Collect guesses.
        </p>
      </div>

      <div className="space-y-4">
        {/* Question title */}
        <div>
          <Input
            type="text"
            placeholder="What's your question?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Description toggle/field */}
        {!showDescription ? (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaPlus className="h-3 w-3" />
            <span>Details</span>
          </button>
        ) : (
          <Textarea
            placeholder="Add more context (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        )}

        {/* Range and Value */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Guessable range</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                className="w-24 text-center"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="w-24 text-center"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Value</label>
            <Input
              type="number"
              placeholder="Answer"
              value={trueAnswer}
              onChange={(e) => setTrueAnswer(e.target.value)}
              className="w-28 text-center"
            />
          </div>
        </div>

        {/* PIN and Create */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">PIN?</span>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                Set a PIN to reveal the actual value
              </TooltipContent>
            </Tooltip>

            {useLock && (
              <Input
                type="text"
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-24 text-center font-mono"
                maxLength={6}
              />
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
