'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const redirect = searchParams.get('redirect') || '/dashboard'
      const type = searchParams.get('type')

      // Try exchanging the code if we have one
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Auth error:', error)
          router.push(`/login?error=${encodeURIComponent(error.message)}`)
          return
        }
      }

      // Check if this is a password recovery flow
      if (type === 'recovery') {
        // User clicked password reset link - redirect to reset password page
        router.push('/reset-password')
        return
      }

      // Check if we're logged in
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.push(redirect)
        return
      }

      router.push(redirect)
    }

    handleCallback()
  }, [searchParams, router, supabase.auth])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    }>
      <AuthCallback />
    </Suspense>
  )
}
