'use client'

import { FaDiscord } from 'react-icons/fa'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

type DiscordBotButtonProps = {
  variant?: 'pill' | 'compact'
}

export function DiscordBotButton({ variant = 'pill' }: DiscordBotButtonProps = {}) {
  const triggerClassName =
    variant === 'pill'
      ? 'mt-4 p-3 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer'
      : 'text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
  const iconClassName = variant === 'pill' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className={triggerClassName}
          aria-label="Add Discord Bot"
        >
          <FaDiscord className={iconClassName} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Add Calibrated bot to your Discord server?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Use the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">/calibrate</code> command to create questions people can submit guesses for within Discord
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <a
              href="/discord"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Server
            </a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
