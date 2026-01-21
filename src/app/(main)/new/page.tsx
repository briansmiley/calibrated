'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnitType } from '@/types/database'

export default function NewQuestionPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [trueAnswer, setTrueAnswer] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('none')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [customUnit, setCustomUnit] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [password, setPassword] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  const handleUnitTypeChange = (value: UnitType) => {
    setUnitType(value)
    if (value === 'currency' && !currencySymbol) {
      setCurrencySymbol('$')
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to create a question')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('questions')
      .insert({
        creator_id: user.id,
        title,
        description: description || null,
        true_answer: trueAnswer ? parseFloat(trueAnswer) : null,
        unit_type: unitType,
        custom_unit: unitType === 'currency' ? currencySymbol : unitType === 'custom' ? customUnit : null,
        is_public: isPublic,
        password: password || null,
        min_value: minValue ? parseFloat(minValue) : null,
        max_value: maxValue ? parseFloat(maxValue) : null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Use first 7 chars of UUID as short ID for URL
    router.push(`/q/${data.id.slice(0, 7)}/admin`)
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Question</CardTitle>
          <CardDescription>
            Ask an estimation question and share the link with friends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 rounded-md bg-destructive/20 border border-destructive/50 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Question *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="How many jellybeans are in this jar?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what you're asking so guessers know the criteria..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trueAnswer">True Answer (optional, hidden until reveal)</Label>
              <Input
                id="trueAnswer"
                type="number"
                step="any"
                value={trueAnswer}
                onChange={(e) => setTrueAnswer(e.target.value)}
                placeholder="e.g. 347"
              />
              <p className="text-xs text-muted-foreground">
                If provided, this will be highlighted when you reveal the results.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Allowed Range (optional)</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    id="minValue"
                    type="number"
                    step="any"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="Min"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex-1">
                  <Input
                    id="maxValue"
                    type="number"
                    step="any"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="Max"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Restrict guesses to a specific range. Leave blank for no limits.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Unit (optional)</Label>
              <div className="flex items-center gap-3">
                <Select value={unitType} onValueChange={(value) => handleUnitTypeChange(value as UnitType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {unitType === 'currency' && (
                  <Input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value.slice(0, 1))}
                    className="w-12 text-center"
                    maxLength={1}
                  />
                )}
                {unitType === 'custom' && (
                  <Input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g. miles, kg"
                    className="w-32"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="isPublic" className="font-normal cursor-pointer">
                  Show in public feed
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Public questions appear in the community feed. Otherwise, only people with the link can access it.
              </p>

              <div className="space-y-2">
                <Label htmlFor="password">Password Protection (optional)</Label>
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for no password"
                />
                <p className="text-xs text-muted-foreground">
                  If set, users must enter this password to view or guess on the question.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading || !title} className="w-full">
              {loading ? 'Creating...' : 'Create Question'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
