/**
 * components/ui/AppLogo.tsx
 * Alok Message brand logo — inline SVG at every size.
 * Pure presentational. Zero side effects.
 */
import { clsx } from 'clsx'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const pxMap: Record<LogoSize, number> = {
  xs: 20, sm: 28, md: 40, lg: 56, xl: 80,
}

interface AppLogoProps {
  size?:       LogoSize
  showGlow?:   boolean
  className?:  string
}

export function AppLogo({ size = 'md', showGlow = true, className }: AppLogoProps) {
  const px = pxMap[size]
  const id = `logo-${size}`

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className)}
      aria-label="Alok Message"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0d1b3e"/>
          <stop offset="100%" stopColor="#050b1f"/>
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00d4ff"/>
          <stop offset="100%" stopColor="#0077b6"/>
        </linearGradient>
        {showGlow && (
          <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Background */}
      <rect width="64" height="64" rx="16" fill={`url(#${id}-bg)`}/>
      <rect width="64" height="64" rx="16" stroke="rgba(0,212,255,0.22)" strokeWidth="1" fill="none"/>

      {/* "A" lettermark */}
      <g filter={showGlow ? `url(#${id}-glow)` : undefined}>
        {/* Left + right legs */}
        <path
          d="M 14 50 L 32 14 L 50 50"
          stroke={`url(#${id}-stroke)`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Crossbar */}
        <path
          d="M 22.5 37 L 41.5 37"
          stroke={`url(#${id}-stroke)`}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Signal dot above peak */}
      <circle cx="32" cy="8.5" r="2.8" fill="#00d4ff" opacity="0.75"/>
    </svg>
  )
}

// ─── WordMark: logo + "Alok Message" text ─────────────────────────────────────

interface WordMarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const wordMarkSize = {
  sm: { logo: 'sm' as LogoSize, text: 'text-sm'  },
  md: { logo: 'md' as LogoSize, text: 'text-base' },
  lg: { logo: 'lg' as LogoSize, text: 'text-xl'  },
}

export function AppWordMark({ size = 'md', className }: WordMarkProps) {
  const { logo, text } = wordMarkSize[size]
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <AppLogo size={logo} showGlow={false} />
      <span className={clsx('font-display font-bold text-white', text)}>
        Alok Message
      </span>
    </span>
  )
}
