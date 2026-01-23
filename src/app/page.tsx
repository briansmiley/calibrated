import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import { CalibratedLogo } from '@/components/CalibratedLogo'
import { AnimatedNumberLine } from '@/components/AnimatedNumberLine'
import { INITIAL_DELAY } from '@/lib/animationTiming'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4">
      <h1 className="text-foreground text-center">
        <CalibratedLogo size="lg" animate delay={INITIAL_DELAY} />
      </h1>
      <p className="mt-4 text-xl text-muted-foreground text-center italic">
        Take a guess
      </p>

      <AnimatedNumberLine />

      <Link
        href="/create"
        className="mt-16 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
      >
        Pose Question
        <FaArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
