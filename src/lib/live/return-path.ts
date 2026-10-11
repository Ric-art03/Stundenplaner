/**
 * Prüft eine Rücksprungadresse aus der Adresszeile. Angenommen werden nur
 * Wege **innerhalb der App** — sonst ließe sich ein Verweis bauen, der nach dem
 * Speichern auf eine fremde Seite führt.
 */
export function safeReturnPath(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  // Ein einzelner Schrägstrich am Anfang; „//" und „/\" wären eine fremde Adresse.
  if (!/^\/(?![/\\])/.test(value)) return undefined
  // Keine Steuerzeichen, kein Umbruch.
  if (/[\u0000-\u001f\\]/.test(value)) return undefined
  return value
}
