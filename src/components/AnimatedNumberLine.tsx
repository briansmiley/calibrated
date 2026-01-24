'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LINE_DURATION,
  DOT_START_DELAY,
  DOT_COUNT,
  DOT_INTERVAL,
  DIAMOND_DELAY,
  DIAMOND_ANIM_DURATION,
  NUMBER_LINE_START,
  NUMBER_LINE_DURATION,
} from '@/lib/animationTiming'

// Loop timing (seconds)
const EXIT_DURATION = 0.33
const PAUSE_BEFORE_COLLAPSE = 3
const RESTART_DELAY = 1

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

export function AnimatedNumberLine() {
  const [data, setData] = useState<{
    dotPositions: number[]
    dotOrder: number[]
    diamondPosition: number
  } | null>(null)
  const [exiting, setExiting] = useState(false)
  const [cycleKey, setCycleKey] = useState(0)
  const [lineVisible, setLineVisible] = useState(false)

  // Time from when CSS animations start until we collapse
  const cycleTime = NUMBER_LINE_DURATION + PAUSE_BEFORE_COLLAPSE

  const startNewCycle = useCallback(() => {
    setData(generateRandomData())
    setExiting(false)
    setCycleKey(k => k + 1)
  }, [])

  // Start animation after logo finishes - rAF naturally pauses when tab is inactive
  useEffect(() => {
    const start = performance.now()
    const delayMs = NUMBER_LINE_START * 1000
    let frameId: number

    const tick = () => {
      if (performance.now() - start >= delayMs) {
        setData(generateRandomData())
        setLineVisible(true)
      } else {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
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

  // Find the closest dot to the diamond
  const closestDotIndex = data
    ? data.dotPositions.reduce(
        (closest, pos, i) =>
          Math.abs(pos - data.diamondPosition) < Math.abs(data.dotPositions[closest] - data.diamondPosition)
            ? i
            : closest,
        0
      )
    : -1

  // Timing for winner highlight (0.2s after diamond finishes animating in)
  const winnerDelay = LINE_DURATION + DOT_START_DELAY + DOT_COUNT * DOT_INTERVAL + DIAMOND_DELAY + DIAMOND_ANIM_DURATION + 0.2

  return (
    <div className="mt-12 w-full max-w-md">
      <style>{`
        @keyframes expandLine { to { transform: scaleX(1) } }
        @keyframes popIn { to { transform: scale(1) } }
        @keyframes popInDiamond { to { transform: translateX(-50%) scale(1) rotate(45deg) } }
        @keyframes collapse { from { transform: scale(1) } to { transform: scaleY(0) } }
        @keyframes collapseDiamond { from { transform: translateX(-50%) scale(1) rotate(45deg) } to { transform: translateX(-50%) scaleY(0) rotate(45deg) } }
        @keyframes turnWhite { to { background-color: white } }
      `}</style>

      <div className="relative py-2">
        {/* Static line - animates in once then stays */}
        <div
          className="h-0.5 bg-muted-foreground/30 w-full origin-left"
          style={lineVisible ? {
            transform: 'scaleX(0)',
            animation: `expandLine ${LINE_DURATION}s ease-out forwards`,
          } : { transform: 'scaleX(0)' }}
        />

        {/* Dots and diamond - only render when data exists so animations start together */}
        {data && (
          <>
            {data.dotPositions.map((pos, i) => {
              const appearanceIndex = data.dotOrder.indexOf(i)
              const isClosest = i === closestDotIndex
              return (
                <div
                  key={`${cycleKey}-${i}`}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500"
                  style={{
                    left: `${pos}%`,
                    transform: 'scale(0)',
                    animation: exiting
                      ? `collapse ${EXIT_DURATION}s ease-in forwards`
                      : isClosest
                        ? `popIn 0.2s ease-out ${LINE_DURATION + DOT_START_DELAY + appearanceIndex * DOT_INTERVAL}s forwards, turnWhite 0.3s ease-out ${winnerDelay}s forwards`
                        : `popIn 0.2s ease-out ${LINE_DURATION + DOT_START_DELAY + appearanceIndex * DOT_INTERVAL}s forwards`,
                  }}
                />
              )
            })}

            <div
              key={`diamond-${cycleKey}`}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50"
              style={{
                left: `${data.diamondPosition}%`,
                transform: 'translateX(-50%) scale(0) rotate(45deg)',
                animation: exiting
                  ? `collapseDiamond ${EXIT_DURATION}s ease-in forwards`
                  : `popInDiamond ${DIAMOND_ANIM_DURATION}s ease-out ${LINE_DURATION + DOT_START_DELAY + DOT_COUNT * DOT_INTERVAL + DIAMOND_DELAY}s forwards`,
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
