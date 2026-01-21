export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
      {/* Left whisker */}
      <line x1="4" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="4" y1="11" x2="4" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Box */}
      <rect x="9" y="8" width="14" height="16" rx="2" fill="#22c55e"/>

      {/* Median line */}
      <line x1="9" y1="16" x2="23" y2="16" stroke="white" strokeWidth="2.5"/>

      {/* Right whisker */}
      <line x1="23" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="28" y1="11" x2="28" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
