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

// Das Logo gibt es in drei Detailstufen derselben Zeichnung — je größer es
// steht, desto mehr Detail:
//   LogoMark        bis etwa 40 px (Favicon, App-Symbol, Kopfzeile am Handy)
//   LogoMarkDrawn   40–120 px (Kopfzeile am Rechner, Anmeldeseiten)
//   LogoMarkModeled ab etwa 120 px (Landingpage)
// Die beiden großen Stufen lassen das grüne Quadrat weg, das das Symbol erst
// wie ein App-Symbol aussehen lässt. Entwürfe:
// https://claude.ai/artifact/9fyq7LkBhFPj6eKAFPT8wS

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

// Zeilen auf dem Blatt und Striche der Stoppuhr — in beiden großen Stufen gleich.
const MAJOR_TICKS = 'M170 135.5V141M200.5 166H195M170 196.5V191M139.5 166H145'
const MINOR_TICKS =
  'M185.25 139.59L183.75 142.18M196.41 150.75L193.82 152.25M196.41 181.25L193.82 179.75M185.25 192.41L183.75 189.82M154.75 192.41L156.25 189.82M143.59 181.25L146.18 179.75M143.59 150.75L146.18 152.25M154.75 139.59L156.25 142.18'
const CLIP_PLATE = 'M80 30a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v16a6 6 0 0 1-6 6h-36a6 6 0 0 1-6-6z'

function SheetLines() {
  return (
    <>
      <rect x="64" y="64" width="62" height="8" rx="4" fill="#052e16" />
      <rect x="64" y="79" width="40" height="5" rx="2.5" fill="#d4d4d8" />
      {[96, 114].map((y) => (
        <g key={y}>
          <rect x="64" y={y} width="11" height="11" rx="3" fill="#16a34a" />
          <path
            d={`M66.8 ${y + 5.6}l2.4 2.4l4.4-4.6`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      <rect x="82" y="99" width="48" height="5" rx="2.5" fill="#3f3f46" />
      <rect x="82" y="117" width="40" height="5" rx="2.5" fill="#3f3f46" />
      <rect x="65" y="133" width="9" height="9" rx="2.5" fill="none" stroke="#16a34a" strokeWidth="2" />
      <rect x="82" y="135" width="34" height="5" rx="2.5" fill="#86efac" />
      <rect x="65" y="151" width="9" height="9" rx="2.5" fill="none" stroke="#a1a1aa" strokeWidth="2" />
      <rect x="82" y="153" width="24" height="5" rx="2.5" fill="#d4d4d8" />
      <rect x="65" y="169" width="9" height="9" rx="2.5" fill="none" stroke="#a1a1aa" strokeWidth="2" />
      <rect x="82" y="171" width="18" height="5" rx="2.5" fill="#d4d4d8" />
    </>
  )
}

function DialMarks() {
  return (
    <>
      <path d={MAJOR_TICKS} fill="none" stroke="#052e16" strokeWidth="3" strokeLinecap="round" />
      <path d={MINOR_TICKS} fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

/** Mittlere Stufe: frei stehendes Klemmbrett mit Stoppuhr, flach gezeichnet. */
export function LogoMarkDrawn({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={cn('h-10 w-10 shrink-0', className)}
      aria-hidden="true"
    >
      <ellipse cx="124" cy="224" rx="82" ry="6" fill="#052e16" opacity="0.1" />
      <rect x="36" y="34" width="136" height="184" rx="16" fill="#14532d" />
      <rect x="36" y="28" width="136" height="184" rx="16" fill="#16a34a" />
      <rect x="42" y="34" width="124" height="172" rx="11" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.7" />
      <rect x="52" y="50" width="104" height="146" rx="4" fill="#bbf7d0" transform="rotate(3 104 123)" />
      <rect x="50" y="46" width="108" height="150" rx="4" fill="#ffffff" />
      <SheetLines />
      <circle cx="104" cy="18" r="9" fill="none" stroke="#052e16" strokeWidth="5" />
      <path d={CLIP_PLATE} fill="#052e16" />
      <rect x="86" y="27" width="36" height="3.5" rx="1.75" fill="#166534" />
      <circle cx="90" cy="43" r="2.5" fill="#166534" />
      <circle cx="118" cy="43" r="2.5" fill="#166534" />
      <rect x="163" y="111" width="14" height="9" rx="2.5" fill="#052e16" />
      <rect x="166.5" y="118" width="7" height="8" fill="#052e16" />
      <rect x="198" y="127" width="11" height="8" rx="2.5" fill="#052e16" transform="rotate(45 203.5 131)" />
      <circle cx="170" cy="166" r="42" fill="#16a34a" stroke="#ffffff" strokeWidth="5" />
      <circle cx="170" cy="166" r="33" fill="#ffffff" />
      <path d="M170 166L170 142A24 24 0 0 1 190.78 178Z" fill="#dcfce7" />
      <DialMarks />
      <path
        d="M170 166V146M170 166L185.6 175"
        fill="none"
        stroke="#052e16"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="170" cy="166" r="4.5" fill="#052e16" />
      <circle cx="170" cy="166" r="1.6" fill="#4ade80" />
    </svg>
  )
}

/**
 * Große Stufe: dieselbe Zeichnung mit Verläufen, Schatten und Glanz. Die IDs
 * der Verläufe sind fest — das Logo steht nur einmal je Seite, und doppelte
 * IDs zeigen hier ohnehin dieselbe Füllung.
 */
export function LogoMarkModeled({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={cn('h-32 w-32 shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-b-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="logo-b-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef3ef" />
        </linearGradient>
        <linearGradient id="logo-b-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f6b3d" />
          <stop offset="0.45" stopColor="#0b3d20" />
          <stop offset="1" stopColor="#052e16" />
        </linearGradient>
        <radialGradient id="logo-b-bezel" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="0.55" stopColor="#16a34a" />
          <stop offset="1" stopColor="#14532d" />
        </radialGradient>
        <radialGradient id="logo-b-face" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e9e4" />
        </radialGradient>
        <linearGradient id="logo-b-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="logo-b-soft" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="logo-b-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id="logo-b-blur4" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse cx="126" cy="222" rx="86" ry="8" fill="#052e16" opacity="0.28" filter="url(#logo-b-soft)" />
      <rect x="36" y="34" width="136" height="184" rx="16" fill="#14532d" />
      <rect x="36" y="28" width="136" height="184" rx="16" fill="url(#logo-b-board) #16a34a" />
      <rect x="37.5" y="29.5" width="133" height="181" rx="14.5" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.28" />
      <rect x="51" y="50" width="108" height="150" rx="4" fill="#052e16" opacity="0.3" filter="url(#logo-b-blur)" />
      <rect x="52" y="50" width="104" height="146" rx="4" fill="#e3f4e8" transform="rotate(3 104 123)" />
      <rect x="50" y="46" width="108" height="150" rx="4" fill="url(#logo-b-paper) #ffffff" />
      <SheetLines />
      <path d={CLIP_PLATE} transform="translate(0 4)" fill="#052e16" opacity="0.35" filter="url(#logo-b-blur)" />
      <circle cx="104" cy="18" r="9" fill="none" stroke="#0b3d20" strokeWidth="5" />
      <path d="M97.5 13.5a9 9 0 0 1 9-4.4" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d={CLIP_PLATE} fill="url(#logo-b-metal) #052e16" />
      <rect x="86" y="26" width="36" height="4" rx="2" fill="#ffffff" opacity="0.22" />
      <circle cx="90" cy="43" r="2.8" fill="#3d7a55" />
      <circle cx="89.3" cy="42.2" r="1" fill="#ffffff" opacity="0.6" />
      <circle cx="118" cy="43" r="2.8" fill="#3d7a55" />
      <circle cx="117.3" cy="42.2" r="1" fill="#ffffff" opacity="0.6" />
      <circle cx="173" cy="172" r="44" fill="#052e16" opacity="0.32" filter="url(#logo-b-blur4)" />
      <rect x="166.5" y="118" width="7" height="8" fill="#0b3d20" />
      <rect x="163" y="110" width="14" height="10" rx="2.5" fill="url(#logo-b-metal) #052e16" />
      <rect x="165" y="111.5" width="10" height="2" rx="1" fill="#ffffff" opacity="0.3" />
      <rect x="198" y="127" width="11" height="8" rx="2.5" fill="url(#logo-b-metal) #052e16" transform="rotate(45 203.5 131)" />
      <circle cx="170" cy="166" r="42" fill="url(#logo-b-bezel) #16a34a" stroke="#ffffff" strokeWidth="4" />
      <circle cx="170" cy="166" r="35" fill="#14532d" />
      <circle cx="170" cy="166" r="33" fill="url(#logo-b-face) #ffffff" />
      <path d="M170 166L170 142A24 24 0 0 1 190.78 178Z" fill="#bbf7d0" opacity="0.85" />
      <DialMarks />
      <path d="M171 168V148M171 168L186.6 177" fill="none" stroke="#052e16" strokeWidth="4" strokeLinecap="round" opacity="0.18" />
      <path
        d="M170 166V146M170 166L185.6 175"
        fill="none"
        stroke="#052e16"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="170" cy="166" r="4.5" fill="#052e16" />
      <circle cx="170" cy="166" r="1.6" fill="#4ade80" />
      <ellipse
        cx="158"
        cy="148"
        rx="17"
        ry="8"
        fill="url(#logo-b-glass) #ffffff"
        opacity="0.45"
        transform="rotate(-32 158 148)"
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
      <span className={cn('inline-flex flex-col items-center gap-2', className)}>
        <LogoMarkDrawn className="h-24 w-24" />
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
    <span className={cn('inline-flex items-center gap-2.5 md:gap-2', className)}>
      {/* Am Handy das Symbol, ab 768 px die gezeichnete Stufe. */}
      <LogoMark className="md:hidden" />
      <LogoMarkDrawn className="hidden md:block" />
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
