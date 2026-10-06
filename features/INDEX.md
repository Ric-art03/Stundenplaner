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

**PROJ-6 (Einheiten-Generator) ist ausgeliefert** — https://stundenplaner-self.vercel.app, Tag `v1.5.0-PROJ-6`, am 2026-10-05. Damit steht das Herzstück der App in Produktion: 94 E2E-Tests grün, 249 Unit-Tests grün, 0 kritische/hohe Fehler.

In derselben Auslieferung gehärtet:

- **Sicherheits-Kopfzeilen** — `next.config.ts` war leer, die Header fehlten in PROJ-1 bis PROJ-5 also durchgehend. Jetzt liegen X-Frame-Options, X-Content-Type-Options, Referrer-Policy und HSTS an jeder Antwort, am Produktionsbuild nachgeprüft
- **Drei der vier Supabase-Hinweise** — `search_path` auf beide Datenbankfunktionen, `EXECUTE` auf `handle_new_user` für `anon` und `authenticated` entzogen. Beides nach dem Anwenden nachgeprüft: Trigger feuern weiter, keine Rückstände, `get_advisors` meldet nur noch einen Hinweis
- **BUG-9** — der letzte offene Produktfehler, eine Zeile in `gap-notice.tsx`

**Fehlertracking:** Vercel-Monitoring statt Sentry, bewusst entschieden — kein Konto, kein Paket, dafür ohne Source-Maps.

### Was offen bleibt

1. **BUG-16** — ein Speichern, dessen Update keine Zeile trifft, meldet Erfolg (`units.ts:578`). Gehört zu `/backend`
2. **Prüfung in echtem WebKit** — braucht eine Ordner-Ausnahme für `%LOCALAPPDATA%\ms-playwright`, und die muss in **Avast** stehen: Windows Defender ist auf diesem Rechner abgeschaltet, eine Ausnahme im Windows-Sicherheitscenter wirkt nicht
3. **Die 40 Testübungen** stecken weiter in der Datenbank — Rohmasse für PROJ-4, erst übernehmen, dann löschen

### Am 2026-10-06 abgeräumt

- **Das Migrationsregister** stimmt jetzt mit den Dateien überein. Es waren zwei Fehler, nicht einer: drei Dateien fehlten ganz, und drei weitere standen unter einer anderen Version als ihr Dateiname (`create_units_tables` etwa unter `20261004062433` statt `20261004140000`). Vor dem Eintragen Spalte für Spalte geprüft, dass die drei fehlenden Migrationen wirklich im Schema stecken — `schedule_type` und `date` an `group_schedules`, `groups.participants` statt `participants_min`/`_max`, `groups.primary_sport`. Danach `diff` zwischen Dateiliste und Register: **13 zu 13, keine Abweichung**. `supabase db push` stolpert nicht mehr
- **BUG-4** — siehe unten
- **Schutz gegen geleakte Passwörter** ist **kein offener Punkt mehr, sondern eine Tarifentscheidung** und steht jetzt in der Pre-Launch-Checkliste des PRD. Die Funktion setzt den **Pro-Plan** voraus, der Schalter ist auf dem kostenlosen Plan nicht benutzbar. Die frühere Notiz hier war doppelt falsch: der Pfad (nicht Authentication → Policies, sondern Authentication → Sign In / Providers → Email) und die Annahme, es sei ein Klick. Stattdessen am 2026-10-06 gesetzt, was ohne Pro geht: **Mindestlänge erhöht und erforderliche Zeichenarten verlangt**. Das ersetzt den Abgleich gegen HaveIBeenPwned nicht, verkleinert aber dasselbe Risiko. `get_advisors` meldet den Hinweis weiterhin — das ist erwartet und kein Versäumnis

**PROJ-7 (Einheiten-Editor) hat seit dem 2026-10-06 eine Spec** — [PROJ-7-einheiten-editor.md](PROJ-7-einheiten-editor.md). Der Editor ist ein Modus auf der Detailseite, keine eigene Seite; er ändert Inhalte innerhalb eines Segments (tauschen, auswürfeln, Variante, entfernen, Plandauer, umsortieren, einfügen), während das Zeitgerüst beim Generator bleibt. Zwei Dinge aus PROJ-6 sind dort mitentschieden: **BUG-5** (Nachbesetzen des Platzhalters) wird hier behoben, und die **Lücken-Sperre beim Speichern fällt weg** — ersetzt durch eine Nachfrage, die die betroffenen Segmente benennt. **BUG-4 (Eigentumsprüfung in der Datenbank) ist am 2026-10-06 erledigt** — bewusst vor dem Entwurf, weil der Editor neue Schreibwege bringt. Dabei kam heraus, dass der Befund größer war als gemeldet: **fünf** Richtlinien statt zwei, darunter der UPDATE-Weg auf `unit_items`, den das Tauschen benutzt. Angewendet über den SQL-Editor des Dashboards (`apply_migration` über MCP wurde ohne Dialog abgelehnt), Migration `20261006090000_harden_unit_write_policies.sql`, im Register eingetragen, am lebenden System in zurückgerollten Transaktionen nachgewiesen.

**Nächster Schritt:** `/architecture PROJ-7`, oder PROJ-4 (Starter-Datenbank), die die Testübungen mit abräumt.

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-09-28 |
| PROJ-2 | Benutzerregistrierung & Login | P0 | PROJ-1 | Deployed | [Spec](PROJ-2-benutzerregistrierung-login.md) | 2026-09-28 |
| PROJ-3 | Übungsdatenbank (CRUD + Metadaten) | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-3-uebungsdatenbank.md) | 2026-09-28 |
| PROJ-4 | Starter-Datenbank (50–100 Übungen) | P0 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-5 | Gruppenprofile | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-5-gruppenprofile.md) | 2026-09-28 |
| PROJ-6 | Einheiten-Generator | P0 | PROJ-3, PROJ-5 | Deployed | [Spec](PROJ-6-einheiten-generator.md) | 2026-09-28 |
| PROJ-7 | Einheiten-Editor | P0 | PROJ-6 | Planned | [Spec](PROJ-7-einheiten-editor.md) | 2026-09-28 |
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
