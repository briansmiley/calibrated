interface CalibratedLogoProps {
  size?: 'sm' | 'lg'
  className?: string
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

export function CalibratedLogo({ size = 'lg', className = '' }: CalibratedLogoProps) {
  const s = sizes[size]

  return (
    <span className={`inline-flex items-baseline font-bold ${s.text} ${className}`}>
      <span>Cal</span>
      <LogoIcon className={`${s.icon} ${s.iconMargin} self-center`} />
      <span>brated</span>
    </span>
  )
}
