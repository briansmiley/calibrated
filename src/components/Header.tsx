import Link from 'next/link'
import { CalibratedLogo } from '@/components/CalibratedLogo'

export function Header() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-foreground">
            <CalibratedLogo size="sm" />
          </Link>

          <Link
            href="/create"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            New Question
          </Link>
        </div>
      </nav>
    </header>
  )
}
