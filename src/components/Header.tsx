import Link from 'next/link'
import { CalibratedLogo } from '@/components/CalibratedLogo'
import { DiscordBotButton } from '@/components/DiscordBotButton'

export function Header() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-foreground">
            <CalibratedLogo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <DiscordBotButton variant="compact" />
            <Link
              href="/create"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              New Question
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
