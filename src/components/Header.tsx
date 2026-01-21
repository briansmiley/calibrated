'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { CalibratedLogo } from '@/components/CalibratedLogo'
import { FaSignOutAlt } from 'react-icons/fa'
import { Profile } from '@/types/database'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }

      setLoading(false)
    }
    getUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="border-b border-border">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-foreground">
            <CalibratedLogo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Feed
            </Link>
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
                <Link
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-80 transition-opacity"
                  title="Profile"
                >
                  {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                  title="Sign Out"
                >
                  <FaSignOutAlt className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Sign In/Up</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
