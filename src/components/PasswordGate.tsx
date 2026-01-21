'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock } from 'lucide-react'

interface PasswordGateProps {
  questionId: string
  questionTitle: string
  correctPassword: string
  children: React.ReactNode
}

export function PasswordGate({ questionId, questionTitle, correctPassword, children }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  const storageKey = `question-unlocked-${questionId}`

  useEffect(() => {
    // Check if already unlocked in this session
    const isUnlocked = sessionStorage.getItem(storageKey) === 'true'
    if (isUnlocked) {
      setUnlocked(true)
    }
  }, [storageKey])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === correctPassword) {
      sessionStorage.setItem(storageKey, 'true')
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="mx-auto max-w-md mt-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Password Required</CardTitle>
          <CardDescription>
            This question is password protected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground mb-4 text-center font-medium">
            {questionTitle}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/20 border border-destructive/50 p-3 text-sm text-destructive text-center">
                Incorrect password
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
