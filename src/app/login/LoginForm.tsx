'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') !== 'signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(searchParams.get('message'))
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const toggleMode = () => {
    const newIsSignUp = !isSignUp
    setIsSignUp(newIsSignUp)
    setMessage(null)
    setError(null)
    const newMode = newIsSignUp ? '' : 'signin'
    const params = new URLSearchParams(searchParams.toString())
    params.delete('message')
    if (newMode) {
      params.set('mode', newMode)
    } else {
      params.delete('mode')
    }
    router.replace(`/login${params.toString() ? '?' + params.toString() : ''}`)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/login?mode=signin&message=' + encodeURIComponent('Check your email to confirm your account!'))
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = redirect
      }
    }
    setLoading(false)
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/20 border border-destructive/50 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-900/50 border border-green-700 p-4 text-sm text-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full"
          >
            <FcGoogle className="text-xl mr-2" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:text-accent"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
