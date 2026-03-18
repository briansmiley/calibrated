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

export function DiscordBotButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="mt-4 p-3 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
          aria-label="Add Discord Bot"
        >
          <FaDiscord className="h-6 w-6" />
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
