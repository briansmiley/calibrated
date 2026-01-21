'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'

interface Props {
  question: Question
}

export function QuestionCard({ question }: Props) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      return
    }

    setDeleting(true)

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', question.id)

    if (error) {
      alert('Failed to delete question: ' + error.message)
      setDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <Link href={`/q/${question.slug}/admin`} className="block">
      <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">{question.title}</h2>
              {question.description && (
                <p className="mt-1 text-sm text-muted-foreground truncate">{question.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Created {formatDate(question.created_at)}
                </span>
                {question.revealed ? (
                  <Badge variant="secondary" className="bg-green-900/50 text-green-300">
                    Revealed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-300">
                    Open
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive ml-4"
            >
              <Trash2 className={`h-4 w-4 ${deleting ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
