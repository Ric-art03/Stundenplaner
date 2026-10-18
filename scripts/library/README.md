# Prüfprogramm der Übungsdatenbank (PROJ-4)

Die Übungsdatenbank hat keinen Verwaltungsbildschirm. Blöcke kommen als
.xlsx-Tabelle, werden hier geprüft, als **Entwurf** eingelesen (nur die
Vorschau-Konten sehen sie) und erst danach für alle **freigegeben**.

Die Tabellen der echten Blöcke liegen **außerhalb dieses Ordners** — das
Repository ist öffentlich. Der Testblock unter `tests/fixtures/` ist erfunden
und darf hier liegen.

## Befehle

```
npm run bestand -- pruefen    <block.xlsx>              # nur prüfen und gegenüberstellen
npm run bestand -- einlesen   <block.xlsx> [--ja]       # ohne --ja: nur zeigen, was geschähe
npm run bestand -- freigeben  <block.xlsx> [--ja]       # Entwürfe des Blocks für alle sichtbar
npm run bestand -- abdeckung  <zielgruppen.xlsx> [--mit-entwuerfen]
npm run bestand -- vorlage    <neu.xlsx>                # leere Block-Tabelle mit Hinweisen
npm run bestand -- zielgruppen-vorlage <neu.xlsx>
npm run bestand -- testblock  <neu.xlsx>                # der Testblock der Browser-Tests
```

Geschrieben wird **nur mit `--ja`**. `einlesen` zeigt vorher, was neu ist, was
sich Feld für Feld ändert (bei freigegebenen Übungen ist eine Änderung nach dem
Einlesen sofort für alle sichtbar), was zurückgezogen wird und was in der
Tabelle fehlt. Eine gelöschte Zeile zieht nichts zurück — dafür
„Zustand: zurückgezogen".

## Voraussetzungen

- `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`
  (dieselben wie für den Prüfplan). Der Dienstschlüssel bleibt auf diesem
  Rechner.
- Die Vorschau-Konten im Blatt „Block" müssen registriert sein.

## Aufbau

- `bestand.mjs` startet `cli.ts` über Vite, damit dieselben Pfade (`@/…`) wie
  in der App gelten
- Die Prüfregeln, die Gegenüberstellung und die Abdeckung stehen in
  `src/lib/library/import/` und sind dort mit Unit-Tests abgedeckt — sie prüfen
  mit den Listen des Grundstocks und den Grenzen des Übungsformulars
- In die Datenbank schreiben die Funktionen `import_library_block` und
  `release_library_block`; beide sind für alle außer dem Dienstschlüssel
  gesperrt
