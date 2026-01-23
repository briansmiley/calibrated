'use client'

import { useState, useEffect } from 'react'

const DOT_COUNT = 7

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

  useEffect(() => {
    setData(generateRandomData())
  }, [])

  // Derive timing from total duration
  const lineDuration = duration * 0.16
  const dotInterval = duration * 0.08
  const diamondDelay = duration * 0.16

  // Don't render until client-side data is ready
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
      `}</style>

      <div className="relative">
        {/* The line - spreads from left */}
        <div
          className="h-0.5 bg-muted-foreground/30 w-full origin-left"
          style={{
            transform: 'scaleX(0)',
            animation: `expandLine ${lineDuration}s ease-out forwards`,
          }}
        />

        {/* Guess points - pop in in random order */}
        {dotPositions.map((pos, i) => {
          const appearanceIndex = dotOrder.indexOf(i)
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
              style={{
                left: `${pos}%`,
                transform: 'scale(0)',
                animation: `popIn 0.2s ease-out ${lineDuration + appearanceIndex * dotInterval}s forwards`,
              }}
            />
          )
        })}

        {/* The "true answer" green diamond - appears after all dots */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50"
          style={{
            left: `${diamondPosition}%`,
            transform: 'translateX(-50%) scale(0) rotate(45deg)',
            animation: `popInDiamond 0.25s ease-out ${lineDuration + DOT_COUNT * dotInterval + diamondDelay}s forwards`,
          }}
        />
      </div>
    </div>
  )
}
