'use client'

import { useEffect, useState } from 'react'
import { formatTimestamp } from '@/lib/formatDate'

interface Props {
  date: string
  className?: string
}

export function LocalTime({ date, className }: Props) {
  const [formatted, setFormatted] = useState<string>('')

  useEffect(() => {
    setFormatted(formatTimestamp(date))
  }, [date])

  // Show nothing during SSR, then hydrate with local time
  if (!formatted) return null

  return <span className={className}>{formatted}</span>
}
