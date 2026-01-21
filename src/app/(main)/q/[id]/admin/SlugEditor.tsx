'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidSlug } from '@/lib/slug'
import { Loader2, Check, X } from 'lucide-react'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface Props {
  questionId: string
  currentSlug: string
  baseUrl: string
}

export function SlugEditor({ questionId, currentSlug, baseUrl }: Props) {
  const [slug, setSlug] = useState(currentSlug)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const router = useRouter()
  const supabase = createClient()

  const fullUrl = `${baseUrl}/q/${slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const checkSlugAvailability = async (slugToCheck: string) => {
    // If unchanged from current, it's available (it's this question's slug)
    if (slugToCheck === currentSlug) {
      setSlugStatus('available')
      return
    }

    if (!slugToCheck || !isValidSlug(slugToCheck)) {
      setSlugStatus(slugToCheck ? 'invalid' : 'idle')
      return
    }

    setSlugStatus('checking')

    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('slug', slugToCheck)
      .maybeSingle()

    setSlugStatus(data ? 'taken' : 'available')
  }

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setError(null)
    setSlugStatus('idle')
  }

  const handleSave = async () => {
    if (slug === currentSlug) {
      setEditing(false)
      return
    }

    if (!isValidSlug(slug)) {
      setError('URL must be 3-50 characters, lowercase letters, numbers, and hyphens only')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('questions')
      .update({ slug })
      .eq('id', questionId)

    if (updateError) {
      if (updateError.code === '23505') {
        setError('This URL is already taken')
      } else {
        setError(updateError.message)
      }
      setLoading(false)
      return
    }

    setLoading(false)
    setEditing(false)
    router.push(`/q/${slug}/admin`)
    router.refresh()
  }

  const handleCancel = () => {
    setSlug(currentSlug)
    setError(null)
    setSlugStatus('idle')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{baseUrl}/q/</span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={() => checkSlugAvailability(slug)}
            className="flex-1"
          />
          {slugStatus === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {slugStatus === 'available' && (
            <div className="flex items-center gap-1 text-green-500">
              <Check className="h-4 w-4" />
              <span className="text-xs">Available</span>
            </div>
          )}
          {slugStatus === 'taken' && (
            <div className="flex items-center gap-1 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-xs">Taken</span>
            </div>
          )}
          {slugStatus === 'invalid' && (
            <div className="flex items-center gap-1 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-xs">Invalid</span>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading || slugStatus === 'taken' || slugStatus === 'invalid'} size="sm">
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={fullUrl}
          readOnly
          className="flex-1"
        />
        <Button variant="outline" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <Button variant="link" onClick={() => setEditing(true)} className="p-0 h-auto text-sm">
        Edit URL
      </Button>
    </div>
  )
}
