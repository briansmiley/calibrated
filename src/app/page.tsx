import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-6xl font-bold text-foreground text-center">
        Calibrated
      </h1>
      <p className="mt-4 text-xl text-muted-foreground text-center italic">
        Take a guess
      </p>

      {/* Number line visualization */}
      <div className="mt-12 w-full max-w-md px-4">
        <div className="relative">
          {/* The line */}
          <div className="h-0.5 bg-muted-foreground/30 w-full" />

          {/* Guess points */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/50"
            style={{ left: '15%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/50"
            style={{ left: '25%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/50"
            style={{ left: '45%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/50"
            style={{ left: '72%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/50"
            style={{ left: '85%' }}
          />

          {/* The "true answer" green point */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30"
            style={{ left: '60%' }}
          />
        </div>
      </div>

      <div className="mt-12">
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  )
}
