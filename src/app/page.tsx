import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-4xl font-bold text-foreground text-center">
        Calibrated
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-center max-w-xl">
        Create estimation questions, share links with friends, collect anonymous guesses,
        and reveal the results together.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
        <Link
          href="/login?mode=signin"
          className="text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-3xl">
        <div className="text-center">
          <div className="text-3xl mb-2 text-primary">1.</div>
          <h3 className="font-semibold text-foreground">Create</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Write an estimation question and optionally add the true answer
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2 text-primary">2.</div>
          <h3 className="font-semibold text-foreground">Share</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Send the link to friends - anyone can guess without signing up
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2 text-primary">3.</div>
          <h3 className="font-semibold text-foreground">Reveal</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            See all guesses sorted by value with the true answer highlighted
          </p>
        </div>
      </div>
    </div>
  )
}
