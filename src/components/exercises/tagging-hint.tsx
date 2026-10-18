/**
 * Der Generator plant eine Übung nur dort ein, wo sie ausdrücklich markiert
 * ist (PROJ-19, Abschnitt E). Der Satz steht immer sichtbar unter Sportart
 * und Altersgruppe — dort, wo die Entscheidung fällt.
 */
export function TaggingHint() {
  return (
    <p className="text-xs text-muted-foreground">
      Wähle alles, wofür die Übung taugt — der Generator plant sie nur dort ein, wo sie
      markiert ist.
    </p>
  )
}
