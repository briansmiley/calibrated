'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="border-b border-border">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Logo className="w-7 h-7" />
            Calibrated
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Button asChild size="sm">
                  <Link href="/new">New Question</Link>
                </Button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login?mode=signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
