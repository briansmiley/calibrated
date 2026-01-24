import { CalibratedLogo } from '@/components/CalibratedLogo'

// Box plot icon standalone
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
    >
      <rect x="8" y="9" width="16" height="14" rx="2" fill="#22c55e"/>
      <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="11" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="11" y1="28" x2="21" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function LogosPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-32 py-24">
      {/* Icon only */}
      <div className="p-24">
        <LogoIcon className="h-32 w-32" />
      </div>

      {/* Full wordmark */}
      <div className="p-24">
        <CalibratedLogo size="lg" />
      </div>
    </div>
  )
}
