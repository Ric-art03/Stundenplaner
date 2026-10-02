# Product Requirements Document

## Vision
Eine Web-App, die ehrenamtlichen Übungsleitern und Trainern im Breitensport die Planung ihrer Sportstunden abnimmt. Statt mühsam im Kopf oder auf Papier Übungen zusammenzusuchen, generiert die App auf Knopfdruck eine strukturierte, abwechslungsreiche Einheit — passend zu Gruppe, Halle, Material und Trainingsziel. Bewährte Übungen rotieren automatisch mit neuen, sodass jede Stunde frisch bleibt.

## Target Users
Ehrenamtliche Übungsleiter und Trainer im Breitensport (Vereine, Schulen, Freizeitgruppen). Sie leiten oft mehrere Gruppen (Kinderturnen, Seniorensport, Volleyball, etc.), haben wenig Zeit zur Vorbereitung und keine professionelle Trainerausbildung. Ihr größter Schmerz: Abwechslungsreiche, qualitativ hochwertige Stunden für verschiedene Gruppen zu planen — besonders wenn man jede Woche etwas Neues bieten will.

### Schmerzpunkte
- Einheiten gehen verloren oder sind nicht wiederverwendbar
- Kein strukturierter Aufbau (Aufwärmen → Hauptteil → Cool-Down)
- Keine Möglichkeit, bewährte Übungen schnell wiederzufinden
- Bei mehreren Gruppen wird es besonders schwierig, Qualität, Abwechslung und Innovation aufrechtzuerhalten
- Planung passiert meist im Kopf, gelegentlich mit schriftlichen Katalogen — fehleranfällig und zeitaufwendig

### Wettbewerbsanalyse
| App | Stärken | Schwächen |
|-----|---------|-----------|
| easy2coach, Fussballtraining.com | Große Übungsbibliotheken (5.000+), sportartspezifisch | Nur eine Sportart (Fußball), keine automatische Zusammenstellung |
| Coach Planner, planet.training | Sportübergreifend, KI-generierte Einheiten | Fokus auf Leistungssport, teuer, komplexe Oberfläche |
| SessionLab | Drag & Drop-Agenda, 1.000+ Methoden, Templates | Für Workshop-Leiter, nicht für Sport/Bewegung |
| Arvo, WorkoutGen | KI-basierte Planerstellung | Individuelles Fitnesstraining, nicht Gruppeneinheiten |

**Unsere Differenzierung:** Keine bestehende App kombiniert sportart-unabhängige Nutzung, intelligente automatische Zusammenstellung (bewährt + neu gemischt), einfache Bedienung für Ehrenamtliche und strukturierte Gruppeneinheiten.

## Core Features (Roadmap)

| Priorität | Feature | Status |
|-----------|---------|--------|
| P0 (MVP) | Supabase Infrastructure Setup | Deployed |
| P0 (MVP) | Benutzerregistrierung & Login | Deployed |
| P0 (MVP) | Übungsdatenbank (CRUD + Metadaten) | In Review |
| P0 (MVP) | Starter-Datenbank (50–100 kuratierte Übungen) | Planned |
| P0 (MVP) | Gruppenprofile (Sportart, Alter, Halle, Material) | Planned |
| P0 (MVP) | Einheiten-Generator (automatische Zusammenstellung) | Planned |
| P0 (MVP) | Einheiten-Editor (Phasen anpassen, tauschen, Lücken) | Planned |
| P0 (MVP) | Favoriten-System | Planned |
| P0 (MVP) | Live-Modus (Stundenbegleitung) | Planned |
| P1 | Kalenderansicht & Langzeitplanung | Planned |
| P1 | Favoriten-Rotation über mehrere Wochen | Planned |
| P1 | PWA (Homescreen-Installation) | Planned |
| P2 | Community-Features (Übungen teilen) | Planned |
| P2 | Mehrsprachigkeit (i18n) | Planned |

## Success Metrics
- **Wiederkehrende Nutzung:** Nutzer erstellt mindestens 2 Einheiten pro Monat
- **Datenbankwachstum:** Nutzer baut eigene Übungsdatenbank aktiv aus
- **Retention-Rate:** >40% der Nutzer nach 4 Wochen noch aktiv

## Constraints
- **Team:** Solo-Entwickler mit KI-Unterstützung
- **Tech-Stack:** Next.js 16, Tailwind CSS, shadcn/ui, Supabase
- **Sprache:** Deutsch (MVP), i18n-ready Architektur
- **Design:** Sportlich-frisch, Grün als Primärfarbe, shadcn/ui Defaults
- **Design-System:** siehe `docs/design-system.md`
- **Kein fester Zeitdruck**, aber Marktreife als Ziel

## Pre-Launch Checklist
- [ ] **E-Mail-Templates anpassen** — Supabase erfordert Custom SMTP (z.B. Resend, kostenlos bis 3.000 Mails/Monat). Dann: Absendername auf "Stundenplaner" ändern, Bestätigungs- und Reset-E-Mails auf Deutsch umschreiben. Ort: Supabase Dashboard → Authentication → Email Templates.

## Non-Goals (v1)
- Keine Community-/Sharing-Features
- Keine Video-Integration
- Keine native App (nur Web, PWA später)
- Keine Mehrsprachigkeit (nur Deutsch)
- Kein Bezahlmodell / Monetarisierung
- Keine Live-Kollaboration
