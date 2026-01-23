interface CalibratedLogoProps {
  size?: 'sm' | 'lg'
  className?: string
  animate?: boolean
  delay?: number // delay in seconds before animation starts
}

// Box plot icon rotated 90 degrees to look like an "I"
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      style={{ transform: 'rotate(90deg)' }}
    >
      {/* Left whisker (becomes top) */}
      <line x1="4" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="4" y1="11" x2="4" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Box */}
      <rect x="9" y="8" width="14" height="16" rx="2" fill="#22c55e"/>

      {/* Median line */}
      <line x1="9" y1="16" x2="23" y2="16" stroke="currentColor" strokeWidth="2.5"/>

      {/* Right whisker (becomes bottom) */}
      <line x1="23" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="28" y1="11" x2="28" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// Animated version - single stem grows from center, then caps spread
function AnimatedLogoIcon({ className, delay = 0 }: { className?: string; delay?: number }) {
  const stemDelay = delay + 0.4
  const capDelay = delay + 0.75

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      style={{ transform: 'rotate(90deg)' }}
    >
      <style>{`
        @keyframes expand { to { transform: scale(1) } }
        .stem {
          transform: scaleX(0);
          transform-origin: 16px 16px;
          animation: expand 0.4s ease-out ${stemDelay}s forwards;
        }
        .cap {
          transform: scaleY(0);
          animation: expand 0.3s ease-out ${capDelay}s forwards;
        }
        .cap-left { transform-origin: 4px 16px; }
        .cap-right { transform-origin: 28px 16px; }
      `}</style>

      {/* Box (no animation) - drawn first (bottom layer) */}
      <rect x="9" y="8" width="14" height="16" rx="2" fill="#22c55e"/>

      {/* Stem - grows from center outward, drawn on top of box */}
      <line className="stem" x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Caps - expand from center */}
      <line className="cap cap-left" x1="4" y1="11" x2="4" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line className="cap cap-right" x1="28" y1="11" x2="28" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

const sizes = {
  sm: {
    text: 'text-2xl',
    icon: 'h-6 w-6',
    iconMargin: '-mx-1.5',
  },
  lg: {
    text: 'text-6xl',
    icon: 'h-14 w-14',
    iconMargin: '-mx-3',
  },
}

export function CalibratedLogo({ size = 'lg', className = '', animate = false, delay = 0 }: CalibratedLogoProps) {
  const s = sizes[size]

  return (
    <span className={`inline-flex items-baseline font-bold ${s.text} ${className}`}>
      <span>Cal</span>
      {animate ? (
        <AnimatedLogoIcon className={`${s.icon} ${s.iconMargin} self-center`} delay={delay} />
      ) : (
        <LogoIcon className={`${s.icon} ${s.iconMargin} self-center`} />
      )}
      <span>brated</span>
    </span>
  )
}
