interface CalibratedLogoProps {
  size?: 'sm' | 'lg'
  className?: string
  animate?: boolean
  delay?: number // delay in seconds before animation starts
}

// Box plot icon drawn vertically (like an "I")
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
    >
      {/* Box (drawn first, behind stem) */}
      <rect x="8" y="9" width="16" height="14" rx="2" fill="#22c55e"/>

      {/* Vertical stem - goes all the way through */}
      <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Top cap */}
      <line x1="11" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Bottom cap */}
      <line x1="11" y1="28" x2="21" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
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
    >
      <style>{`
        @keyframes expand { to { transform: scale(1) } }
        .stem {
          transform: scaleY(0);
          transform-origin: 16px 16px;
          animation: expand 0.4s ease-out ${stemDelay}s forwards;
        }
        .cap {
          transform: scaleX(0);
          animation: expand 0.3s ease-out ${capDelay}s forwards;
        }
        .cap-top { transform-origin: 16px 4px; }
        .cap-bottom { transform-origin: 16px 28px; }
      `}</style>

      {/* Box (no animation) - drawn first (bottom layer) */}
      <rect x="8" y="9" width="16" height="14" rx="2" fill="#22c55e"/>

      {/* Stem - grows from center outward vertically, drawn on top of box */}
      <line className="stem" x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Caps - expand from center horizontally */}
      <line className="cap cap-top" x1="11" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line className="cap cap-bottom" x1="11" y1="28" x2="21" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
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
