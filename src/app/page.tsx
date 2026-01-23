import Link from 'next/link'
import { CalibratedLogo } from '@/components/CalibratedLogo'
import { AnimatedNumberLine } from '@/components/AnimatedNumberLine'

const NUMBER_LINE_DURATION = 1.9 // seconds

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4">
      <h1 className="text-foreground text-center">
        <CalibratedLogo size="lg" animate delay={NUMBER_LINE_DURATION} />
      </h1>
      <p className="mt-4 text-xl text-muted-foreground text-center italic">
        Take a guess
      </p>

      <AnimatedNumberLine duration={NUMBER_LINE_DURATION} />

      <Link
        href="/create"
        className="mt-16 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
      >
        Create Question
      </Link>
    </div>
  )
}
