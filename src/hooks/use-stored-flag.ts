'use client'

import * as React from 'react'

/**
 * Ein Ja/Nein, das sich der Browser merkt — eine Bequemlichkeit je Gerät, kein
 * Teil der Daten. Der gespeicherte Wert wird erst nach dem ersten Rendern
 * gelesen: der Server kennt ihn nicht, und beide Seiten müssen mit demselben
 * Stand beginnen.
 *
 * Ohne Zugriff auf den Speicher (privates Fenster, gesperrte Website-Daten)
 * gilt schlicht der Standardwert.
 */
export function useStoredFlag(key: string, initial: boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = React.useState(initial)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) setValue(stored === '1')
    } catch {
      // Standardwert bleibt.
    }
  }, [key])

  const update = React.useCallback(
    (next: boolean) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, next ? '1' : '0')
      } catch {
        // Die Wahl gilt dann nur bis zum Neuladen.
      }
    },
    [key]
  )

  return [value, update]
}
