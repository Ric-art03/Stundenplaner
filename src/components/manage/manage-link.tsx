'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManageLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Ein „verwalten"-Link aus einem Formular heraus. Öffnet die Verwaltung in
 * einem neuen Tab, damit die Eingaben im Formular stehen bleiben. Kommt der
 * Nutzer zurück, holt die Seite ihre Auswahllisten frisch — der Stand des
 * Formulars bleibt dabei unberührt.
 */
export function ManageLink({ href, children, className }: ManageLinkProps) {
  const router = useRouter()
  const visited = React.useRef(false)

  React.useEffect(() => {
    function refreshAfterReturn() {
      if (!visited.current) return
      visited.current = false
      router.refresh()
    }
    window.addEventListener('focus', refreshAfterReturn)
    return () => window.removeEventListener('focus', refreshAfterReturn)
  }, [router])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => {
        visited.current = true
      }}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline',
        className
      )}
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">(öffnet in neuem Tab)</span>
    </a>
  )
}
