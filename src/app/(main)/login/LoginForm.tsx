'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

type Step = 'email' | 'signin' | 'signup' | 'forgot'

export function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(searchParams.get('message'))
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)

    // Check if email exists in the database
    const { data, error: rpcError } = await supabase.rpc('check_email_exists', {
      email_to_check: email
    })

    if (rpcError) {
      setError('Unable to check email. Please try again.')
      setLoading(false)
      return
    }

    setStep(data ? 'signin' : 'signup')
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = redirect
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      // User created but needs email confirmation
      setMessage('Check your email to confirm your account!')
      setStep('email')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } else if (data.user && data.session) {
      // Email confirmation disabled, user is logged in
      window.location.href = redirect
      return
    } else {
      setError('Something went wrong. Please try again.')
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link!')
      setStep('signin')
    }
    setLoading(false)
  }

  const goBack = () => {
    setStep('email')
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }

  // Forgot password view
  if (step === 'forgot') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Reset your password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/20 border border-destructive/50 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              We&apos;ll send a reset link to <span className="font-medium text-foreground">{email}</span>
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setStep('signin')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sign in view
  if (step === 'signin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Welcome back
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

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Signing in as</p>
              <p className="font-medium">{email}</p>
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-primary hover:text-accent mt-1"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('forgot')
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sign up view
  if (step === 'signup') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Create your account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/20 border border-destructive/50 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Creating account for</p>
              <p className="font-medium">{email}</p>
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-primary hover:text-accent mt-1"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Email entry view (default)
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Sign in or create account
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

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <Button type="submit" disabled={loading || !email} className="w-full">
              {loading ? 'Checking...' : 'Continue'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
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
        </CardContent>
      </Card>
    </div>
  )
}
