'use client'

import * as React from 'react'

/**
 * Hält den Nutzer auf der Seite, solange Änderungen offen sind.
 *
 * Drei Ausgänge, zwei Mittel:
 *
 * - **Neuladen, Tab schließen, Browser-Zurück** → die eingebaute Warnung des
 *   Browsers über `beforeunload`. Der Text ist nicht beeinflussbar, das ist bei
 *   allen Browsern so.
 * - **Ein Verweis auf eine andere Seite** → wir hören auf Klicks, bevor Next.js
 *   sie bekommt, und halten den Wechsel an. Der App-Router bietet keine Stelle,
 *   an der sich ein Seitenwechsel abfangen ließe; auf Klicks zu hören deckt alle
 *   Ausgänge ab, die der Nutzer wirklich benutzt — Kopfzeilen-Navigation,
 *   „Zurück zum Generator", die Verweise in den Übungskarten.
 *
 * Gehorcht wird nur Klicks, die wirklich die Seite wechseln würden: ein Klick
 * mit gedrückter Steuerungstaste, mit der mittleren Maustaste oder auf einen
 * Verweis mit `target="_blank"` öffnet einen neuen Tab und lässt diese Seite
 * stehen — da gibt es nichts zu retten.
 */
export function useUnsavedChanges(
  active: boolean,
  onIntercept: (proceed: () => void) => void
) {
  // Über eine Referenz, damit das Mithören nicht bei jedem Tastendruck in einer
  // Notiz neu angemeldet werden muss.
  const handler = React.useRef(onIntercept)
  React.useEffect(() => {
    handler.current = onIntercept
  }, [onIntercept])

  React.useEffect(() => {
    if (!active) return

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      // Älteren Browsern genügt `preventDefault` nicht.
      event.returnValue = ''
    }

    function interceptLinks(event: MouseEvent) {
      if (event.defaultPrevented) return
      // Nur der einfache Linksklick wechselt die Seite.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target && anchor.target !== '_self') return
      // Ein Download oder ein Verweis nach außen führt aus der App heraus; dort
      // greift die Warnung des Browsers.
      if (anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      // Derselbe Ort — kein Wechsel, nichts anzuhalten.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      handler.current(() => {
        // Der Nutzer hat in der Nachfrage der App schon entschieden. Ohne das
        // fragte der Browser gleich noch einmal („Website verlassen?"): der
        // Seitenwechsel beginnt, bevor React die Warnung abgemeldet hat.
        window.removeEventListener('beforeunload', warnBeforeUnload)
        window.location.href = anchor.href
      })
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    // In der Erfassungsphase, damit wir vor dem Verweis selbst an der Reihe sind.
    document.addEventListener('click', interceptLinks, true)

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', interceptLinks, true)
    }
  }, [active])
}
