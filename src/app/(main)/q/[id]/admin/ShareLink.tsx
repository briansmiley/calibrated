'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  shortId: string
  baseUrl: string
}

export function ShareLink({ shortId, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${baseUrl}/q/${shortId}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
  )
}
