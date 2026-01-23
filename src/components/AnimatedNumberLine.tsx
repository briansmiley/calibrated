'use client'

import { useState, useEffect, useCallback } from 'react'

const DOT_COUNT = 7
const EXIT_DURATION = 0.5 // seconds for collapse animation
const PAUSE_AFTER_LOGO = 3 // seconds to wait after logo animates before looping
const LOGO_ANIMATION_DURATION = 0.75 // approximate time for logo animation
const RESTART_DELAY = 1 // seconds to wait before new cycle starts
const DOT_START_DELAY = 0.5 // seconds to wait after line before dots appear

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateRandomData() {
  const positions = Array.from({ length: DOT_COUNT }, () =>
    Math.floor(Math.random() * 80) + 10
  )
  const order = shuffleArray([...Array(DOT_COUNT).keys()])
  const diamond = Math.floor(Math.random() * 80) + 10
  return { dotPositions: positions, dotOrder: order, diamondPosition: diamond }
}

interface AnimatedNumberLineProps {
  duration: number // total animation duration in seconds
}

export function AnimatedNumberLine({ duration }: AnimatedNumberLineProps) {
  const [data, setData] = useState<{
    dotPositions: number[]
    dotOrder: number[]
    diamondPosition: number
  } | null>(null)
  const [exiting, setExiting] = useState(false)
  const [cycleKey, setCycleKey] = useState(0)
  const [lineVisible, setLineVisible] = useState(false)

  const totalAnimationTime = duration + LOGO_ANIMATION_DURATION
  const cycleTime = totalAnimationTime + PAUSE_AFTER_LOGO

  const startNewCycle = useCallback(() => {
    setData(generateRandomData())
    setExiting(false)
    setCycleKey(k => k + 1)
  }, [])

  useEffect(() => {
    setData(generateRandomData())
    setLineVisible(true)
  }, [])

  useEffect(() => {
    if (!data) return

    const exitTimer = setTimeout(() => setExiting(true), cycleTime * 1000)
    const restartTimer = setTimeout(startNewCycle, (cycleTime + EXIT_DURATION + RESTART_DELAY) * 1000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(restartTimer)
    }
  }, [data, cycleTime, startNewCycle])

  const lineDuration = duration * 0.16
  const dotInterval = duration * 0.08
  const diamondDelay = duration * 0.16

  if (!data) {
    return <div className="mt-12 w-full max-w-md h-3" />
  }

  const { dotPositions, dotOrder, diamondPosition } = data

  return (
    <div className="mt-12 w-full max-w-md">
      <style>{`
        @keyframes expandLine { to { transform: scaleX(1) } }
        @keyframes popIn { to { transform: scale(1) } }
        @keyframes popInDiamond { to { transform: translateX(-50%) scale(1) rotate(45deg) } }
        @keyframes collapse { from { transform: scale(1) } to { transform: scaleY(0) } }
        @keyframes collapseDiamond { from { transform: translateX(-50%) scale(1) rotate(45deg) } to { transform: translateX(-50%) scaleY(0) rotate(45deg) } }
      `}</style>

      <div className="relative py-2">
        {/* Static line - animates in once then stays */}
        <div
          className="h-0.5 bg-muted-foreground/30 w-full origin-left"
          style={lineVisible ? {
            transform: 'scaleX(0)',
            animation: `expandLine ${lineDuration}s ease-out forwards`,
          } : { transform: 'scaleX(0)' }}
        />

        {/* Dots and diamond - keyed to restart animations */}
        {dotPositions.map((pos, i) => {
          const appearanceIndex = dotOrder.indexOf(i)
          return (
            <div
              key={`${cycleKey}-${i}`}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
              style={{
                left: `${pos}%`,
                transform: 'scale(0)',
                animation: exiting
                  ? `collapse ${EXIT_DURATION}s ease-in forwards`
                  : `popIn 0.2s ease-out ${lineDuration + DOT_START_DELAY + appearanceIndex * dotInterval}s forwards`,
              }}
            />
          )
        })}

        <div
          key={`diamond-${cycleKey}`}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50"
          style={{
            left: `${diamondPosition}%`,
            transform: 'translateX(-50%) scale(0) rotate(45deg)',
            animation: exiting
              ? `collapseDiamond ${EXIT_DURATION}s ease-in forwards`
              : `popInDiamond 0.25s ease-out ${lineDuration + DOT_START_DELAY + DOT_COUNT * dotInterval + diamondDelay}s forwards`,
          }}
        />
      </div>
    </div>
  )
}
