import Link from 'next/link'
import { CalibratedLogo } from '@/components/CalibratedLogo'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4">
      <h1 className="text-foreground text-center">
        <CalibratedLogo size="lg" />
      </h1>
      <p className="mt-4 text-xl text-muted-foreground text-center italic">
        Take a guess
      </p>

      {/* Number line visualization */}
      <div className="mt-12 w-full max-w-md">
        <div className="relative">
          {/* The line */}
          <div className="h-0.5 bg-muted-foreground/30 w-full" />

          {/* Guess points */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
            style={{ left: '15%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
            style={{ left: '25%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
            style={{ left: '45%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
            style={{ left: '72%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
            style={{ left: '85%' }}
          />

          {/* The "true answer" green diamond */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50 rotate-45"
            style={{ left: '60%' }}
          />
        </div>
      </div>

      <Link
        href="/create"
        className="mt-16 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
      >
        Create Question
      </Link>
    </div>
  )
}
