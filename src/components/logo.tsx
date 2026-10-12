import localFont from 'next/font/local'
import { cn } from '@/lib/utils'

// Outfit trägt nur die Wortmarke — der Rest der App bleibt bei der Schrift
// des Geräts. Als variable Schrift geladen, weil „stunden" mit der Stärke 450
// zwischen zwei festen Schnitten liegt. Die Datei liegt im Projekt statt bei
// Google: `next/font/google` holt sie beim Bauen, und das scheitert auf dem
// Entwicklungsrechner an der Verbindung.
const outfit = localFont({
  src: '../fonts/outfit-latin.woff2',
  weight: '100 900',
  display: 'swap',
})

interface LogoMarkProps {
  className?: string
}

/**
 * Das Symbol: Klemmbrett mit Uhr. Dieselbe Zeichnung liegt als Favicon in
 * `src/app/icon.svg` — wer hier etwas ändert, zieht es dort nach.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('h-8 w-8 shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#16a34a" />
      <rect x="12" y="12" width="32" height="40" rx="6" fill="#ffffff" />
      <rect x="20" y="7" width="16" height="10" rx="4" fill="#052e16" />
      <rect x="18" y="25" width="18" height="4" rx="2" fill="#052e16" />
      <rect x="18" y="33" width="10" height="4" rx="2" fill="#86efac" />
      <circle cx="44" cy="44" r="13.5" fill="#16a34a" />
      <circle cx="44" cy="44" r="10.5" fill="#ffffff" />
      <path
        d="M44 38v6l4 3"
        fill="none"
        stroke="#052e16"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  /** `inline`: Symbol und Wortmarke in einer Zeile. `stacked`: Symbol über der zweizeiligen Wortmarke. */
  variant?: 'inline' | 'stacked'
  className?: string
  /** Für Stellen, an denen die Wortmarke erst ab einer Breite Platz hat. */
  wordmarkClassName?: string
}

export function Logo({ variant = 'inline', className, wordmarkClassName }: LogoProps) {
  if (variant === 'stacked') {
    return (
      <span className={cn('inline-flex flex-col items-center gap-3', className)}>
        <LogoMark className="h-16 w-16" />
        <span
          className={cn(
            outfit.className,
            'text-center text-3xl leading-[0.95] tracking-[-0.035em]',
            wordmarkClassName
          )}
        >
          <span className="block font-[450] text-foreground">stunden</span>
          <span className="block font-extrabold text-primary">planer</span>
        </span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {/* Leicht angehoben: Outfit bringt über den Buchstaben mehr Leerraum mit
          als darunter, zentriert säße die Wortmarke sichtbar zu tief. */}
      <span
        className={cn(
          outfit.className,
          'relative -top-[0.055em] text-[22px] leading-none tracking-[-0.03em]',
          wordmarkClassName
        )}
      >
        <span className="font-[450] text-foreground">stunden</span>
        <span className="font-extrabold text-primary">planer</span>
      </span>
    </span>
  )
}
