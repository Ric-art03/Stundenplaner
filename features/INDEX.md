# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Woran zuletzt gearbeitet wurde

**PROJ-6 (Einheiten-Generator)** — das Produkt ist **freigegeben** (0 kritisch, 0 hoch, 0 mittel), und seit dem 2026-10-05 ist auch die **E2E-Suite vollständig grün: 94 Tests, 0 Fehlschläge, 0 übersprungen in 10,0 Minuten** (zuvor 79 / 7 / 8).

Drei Befunde liegen zwischen Lauf 3 und Lauf 5, und zwei widerlegen eine Annahme der früheren Durchläufe:

1. **Ein hängender Installationsprozess** trug den Großteil der Last, nicht die Nebenläufigkeit. Ein `npx playwright install chromium` von 09:52 Uhr lief noch acht Stunden später unverändert weiter; nach dem Beenden fielen fünf der sechs Zeitüberschreitungen weg, ohne eine geänderte Testzeile
2. **BUG-14** — die Zusicherung `getByText('Gespeichert')` traf als laxe Teilzeichenkette auch „Noch nicht **gespeichert**". Sie war damit immer erfüllt, am sichersten bei fehlgeschlagenem Speichern. Der instabile Test war kein Rätsel, sondern ein Test, der seinen eigenen Fehlschlag überdeckt hat
3. **BUG-15** — die Zusicherungen hatten 5 Sekunden Zeit, der Test 120. Der letzte Fehlschlag brauchte 16,9 Sekunden und war danach grün

Alle Behebungen betrafen ausschließlich `tests/` und `playwright.config.ts` — **kein Produktcode**.

**Nächster Schritt:** `/deploy`. Dort warten **BUG-9** (Einzeiler in `gap-notice.tsx`, `/frontend`), **BUG-16** (ein Speichern ohne getroffene Zeile meldet Erfolg, `/backend`) und die vier vorbestehenden Supabase-Hinweise. Offen bleibt außerdem die Prüfung in **echtem WebKit** — dafür braucht es eine Ordner-Ausnahme für `%LOCALAPPDATA%\ms-playwright`, und die muss in **Avast** stehen: Windows Defender ist auf diesem Rechner abgeschaltet, eine Ausnahme im Windows-Sicherheitscenter wirkt nicht.

_Stand 2026-10-05. Dieser Abschnitt kann weg, sobald PROJ-6 deployed ist._

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-09-28 |
| PROJ-2 | Benutzerregistrierung & Login | P0 | PROJ-1 | Deployed | [Spec](PROJ-2-benutzerregistrierung-login.md) | 2026-09-28 |
| PROJ-3 | Übungsdatenbank (CRUD + Metadaten) | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-3-uebungsdatenbank.md) | 2026-09-28 |
| PROJ-4 | Starter-Datenbank (50–100 Übungen) | P0 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-5 | Gruppenprofile | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-5-gruppenprofile.md) | 2026-09-28 |
| PROJ-6 | Einheiten-Generator | P0 | PROJ-3, PROJ-5 | Approved | [Spec](PROJ-6-einheiten-generator.md) | 2026-09-28 |
| PROJ-7 | Einheiten-Editor | P0 | PROJ-6 | Roadmap | — | 2026-09-28 |
| PROJ-9 | Kalenderansicht & Langzeitplanung | P1 | PROJ-6, PROJ-7 | Roadmap | — | 2026-09-28 |
| PROJ-10 | Übungsrotation (Abwechslung über Wochen) | P1 | PROJ-6, PROJ-9 | Roadmap | — | 2026-09-28 |
| PROJ-11 | PWA (Homescreen-Installation) | P1 | None | Roadmap | — | 2026-09-28 |
| PROJ-12 | Community-Features (Übungen teilen) | P2 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-13 | Mehrsprachigkeit (i18n) | P2 | None | Roadmap | — | 2026-09-28 |
| PROJ-14 | Live-Modus (Stundenbegleitung) | P0 | PROJ-6, PROJ-7 | Roadmap | — | 2026-10-01 |
| PROJ-15 | Dokumenten-Upload (Gruppen & Hallen) | P1 | PROJ-5 | Roadmap | — | 2026-10-02 |
| PROJ-16 | Eigene Kategorien verwalten | P0 | PROJ-3 | Roadmap | — | 2026-10-04 |
| PROJ-17 | Stundenmuster (wiederverwendbare Einheiten-Konfigurationen) | P1 | PROJ-6 | Roadmap | — | 2026-10-04 |

<!-- Add features above this line -->

## Next Available ID: PROJ-18

## Empfohlene Build-Reihenfolge (MVP)

1. **PROJ-1** — Supabase Infrastructure Setup (Fundament für alles)
2. **PROJ-2** — Benutzerregistrierung & Login (Nutzerdaten brauchen Auth)
3. **PROJ-3** — Übungsdatenbank (Kernfunktion: Übungen erfassen)
4. **PROJ-5** — Gruppenprofile (parallel zu oder direkt nach PROJ-3)
5. **PROJ-4** — Starter-Datenbank (Inhalte einfüllen + Import in eigene DB)
6. **PROJ-6** — Einheiten-Generator (Herzstück der App)
7. **PROJ-7** — Einheiten-Editor (Feinschliff der generierten Einheiten)
8. **PROJ-14** — Live-Modus (Stundenbegleitung während der Durchführung)
9. **PROJ-16** — Eigene Kategorien verwalten (behebt eine Lücke aus PROJ-3, blockiert nichts, muss aber vor der Marktreife rein)
