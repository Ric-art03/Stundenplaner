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

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-09-28 |
| PROJ-2 | Benutzerregistrierung & Login | P0 | PROJ-1 | Deployed | [Spec](PROJ-2-benutzerregistrierung-login.md) | 2026-09-28 |
| PROJ-3 | Übungsdatenbank (CRUD + Metadaten) | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-3-uebungsdatenbank.md) | 2026-09-28 |
| PROJ-4 | Starter-Datenbank (50–100 Übungen) | P0 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-5 | Gruppenprofile | P0 | PROJ-1, PROJ-2 | Roadmap | — | 2026-09-28 |
| PROJ-6 | Einheiten-Generator | P0 | PROJ-3, PROJ-5 | Roadmap | — | 2026-09-28 |
| PROJ-7 | Einheiten-Editor | P0 | PROJ-6 | Roadmap | — | 2026-09-28 |
| PROJ-8 | Favoriten-System | P0 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-9 | Kalenderansicht & Langzeitplanung | P1 | PROJ-6, PROJ-7 | Roadmap | — | 2026-09-28 |
| PROJ-10 | Favoriten-Rotation | P1 | PROJ-8, PROJ-9 | Roadmap | — | 2026-09-28 |
| PROJ-11 | PWA (Homescreen-Installation) | P1 | None | Roadmap | — | 2026-09-28 |
| PROJ-12 | Community-Features (Übungen teilen) | P2 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-13 | Mehrsprachigkeit (i18n) | P2 | None | Roadmap | — | 2026-09-28 |
| PROJ-14 | Live-Modus (Stundenbegleitung) | P0 | PROJ-6, PROJ-7 | Roadmap | — | 2026-10-01 |

<!-- Add features above this line -->

## Next Available ID: PROJ-15

## Empfohlene Build-Reihenfolge (MVP)

1. **PROJ-1** — Supabase Infrastructure Setup (Fundament für alles)
2. **PROJ-2** — Benutzerregistrierung & Login (Nutzerdaten brauchen Auth)
3. **PROJ-3** — Übungsdatenbank (Kernfunktion: Übungen erfassen)
4. **PROJ-5** — Gruppenprofile (parallel zu oder direkt nach PROJ-3)
5. **PROJ-8** — Favoriten-System (erweitert die Datenbank)
6. **PROJ-4** — Starter-Datenbank (Inhalte einfüllen)
7. **PROJ-6** — Einheiten-Generator (Herzstück der App)
8. **PROJ-7** — Einheiten-Editor (Feinschliff der generierten Einheiten)
9. **PROJ-14** — Live-Modus (Stundenbegleitung während der Durchführung)
