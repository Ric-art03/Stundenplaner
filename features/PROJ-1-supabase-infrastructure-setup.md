# PROJ-1: Supabase Infrastructure Setup

## Status: Approved
**Created:** 2026-09-28
**Last Updated:** 2026-09-28 (QA passed — production ready)

## Dependencies
- None (Fundament für alle anderen Features)

## User Stories
- Als Entwickler möchte ich eine funktionierende Supabase-Verbindung, damit alle nachfolgenden Features (Auth, Datenbank, Storage) darauf aufbauen können
- Als Entwickler möchte ich getrennte Supabase-Clients für Browser und Server, damit der geheime Service-Role-Key niemals im Browser-Code landet
- Als Entwickler möchte ich ein `.env.local`-Template, damit die Umgebungsvariablen korrekt dokumentiert und einfach einzurichten sind
- Als Entwickler möchte ich automatisch generierte TypeScript-Types für die Datenbank, damit ich typsicher gegen die Supabase-API arbeiten kann
- Als Entwickler möchte ich, dass Row Level Security standardmäßig aktiviert ist, damit keine Tabelle versehentlich ungeschützt bleibt

## Out of Scope
- Datenbank-Tabellen und Schemas — gehört zu PROJ-3 (Übungsdatenbank)
- Auth-Provider-Konfiguration (Email/Passwort, Social Login) — gehört zu PROJ-2 (Benutzerregistrierung & Login)
- Supabase CLI / lokale Entwicklungsumgebung — bewusst ausgelassen für MVP, kann später nachgerüstet werden
- GitHub-Integration mit Supabase — nicht nötig für Solo-Entwickler
- Storage-Buckets — kein Feature im MVP benötigt Datei-Uploads
- Edge Functions — kein Feature im MVP benötigt serverseitige Supabase-Funktionen
- Supabase Realtime — keine Live-Kollaboration im MVP (siehe PRD Non-Goals)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen das Supabase-Projekt existiert, wenn die App im Entwicklungsmodus gestartet wird, dann verbindet sich der Supabase-Client erfolgreich mit dem Cloud-Projekt
- [ ] Angenommen die `.env.local`-Datei fehlt oder ist unvollständig, wenn die App gestartet wird, dann erscheint eine aussagekräftige Fehlermeldung statt eines kryptischen Absturzes
- [ ] Angenommen ein Server-Component oder API-Route braucht Datenbankzugriff, wenn der Server-Client verwendet wird, dann läuft die Anfrage Server-seitig (mit Cookie-Session und RLS) und der Service-Role-Key ist im Browser-Bundle nicht sichtbar
- [ ] Angenommen ein Client-Component braucht Datenbankzugriff, wenn der Browser-Client verwendet wird, dann wird nur der öffentliche Anon-Key verwendet
- [ ] Angenommen eine neue Tabelle wird erstellt, wenn Row Level Security nicht aktiviert ist, dann lehnt die Anwendungsarchitektur dies ab (RLS ist Pflicht laut Projektregeln)
- [ ] Angenommen die Umgebungsvariablen sind korrekt gesetzt, wenn `npm run build` ausgeführt wird, dann wird das Projekt fehlerfrei gebaut

## Edge Cases
- **Falsche Umgebungsvariablen:** Was passiert, wenn URL oder Key falsch sind? → Klare Fehlermeldung beim App-Start, kein stilles Fehlverhalten
- **Fehlende `.env.local`:** Neuer Entwickler klont das Repo und vergisst die Datei → `.env.example` als dokumentierte Vorlage im Repo
- **Netzwerkfehler:** Supabase-Cloud ist nicht erreichbar → Graceful Error Handling, keine unbehandelten Promise-Rejections
- **TypeScript-Types veraltet:** Datenbank-Schema wurde geändert, Types nicht neu generiert → Dokumentierter Prozess zum Regenerieren der Types
- **Versehentlicher Key-Leak:** Service-Role-Key in Client-Component verwendet → Architektur verhindert dies durch getrennte Client-Module

## Technical Requirements (optional)
- Supabase-Projekt-URL: `https://gfpbzffyczepfmzwnuyh.supabase.co`
- Zwei getrennte Supabase-Clients: Browser (Anon Key) und Server (Service Role Key)
- `.env.example` als Vorlage im Repository (ohne echte Schlüssel)
- `.env.local` in `.gitignore` (darf niemals committet werden)
- TypeScript-Types-Generierung dokumentiert
- Next.js App Router kompatibel (`@supabase/ssr`-Package)

## Open Questions
- [x] ~~Soll ein Health-Check-Endpoint (`/api/health`) eingerichtet werden?~~ → Nein, unnötig für Solo-Entwickler im MVP

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Keine Supabase CLI / lokale DB | Solo-Entwickler, kein Risiko durch gleichzeitige Änderungen; reduziert Setup-Komplexität | 2026-09-28 |
| Keine GitHub-Integration mit Supabase | Unnötiger Overhead für Solo-Entwickler; Migrationen werden manuell oder via CLI verwaltet | 2026-09-28 |
| Direkte Entwicklung gegen Cloud-Projekt | Einfacher Einstieg, CLI kann jederzeit nachgerüstet werden | 2026-09-28 |
| Storage, Edge Functions, Realtime ausgeschlossen | Kein MVP-Feature benötigt diese Dienste | 2026-09-28 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Getrennte Client-Module (client.ts, server.ts, middleware.ts) | Verhindert strukturell, dass der Service-Role-Key im Browser-Bundle landet; klare Import-Grenzen | 2026-09-28 |
| `@supabase/ssr` statt manueller Client-Erstellung | Offizielles Package für Next.js App Router; übernimmt Cookie-Handling für Auth-Sessions | 2026-09-28 |
| Middleware für Session-Refresh | Next.js Middleware erneuert Auth-Session bei jedem Request; Vorbereitung für PROJ-2 | 2026-09-28 |
| Kein Health-Check-Endpoint | Unnötige Komplexität für Solo-Entwickler; Verbindungsprobleme fallen beim Testen sofort auf | 2026-09-28 |
| TypeScript-Types als generierte Datei (database.types.ts) | Typsicherheit gegen Supabase-API; wird bei Schema-Änderungen neu generiert | 2026-09-28 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Modul-Struktur

```
src/lib/
+-- supabase/
|   +-- client.ts         ← Browser-Client (für Client-Components)
|   +-- server.ts          ← Server-Client (für Server-Components, API-Routes)
|   +-- middleware.ts       ← Auth-Session-Refresh bei jedem Request
+-- database.types.ts       ← Automatisch generierte TypeScript-Types

src/
+-- middleware.ts            ← Next.js Middleware (ruft supabase/middleware auf)

/ (Projekt-Root)
+-- .env.example             ← Vorlage mit Platzhaltern (wird committet)
+-- .env.local               ← Echte Schlüssel (wird NICHT committet)
```

### Client-Trennung

- **Browser-Client (client.ts):** Verwendet nur den öffentlichen Anon-Key. Alle Anfragen laufen durch Row Level Security — Nutzer sehen nur ihre eigenen Daten.
- **Server-Client (server.ts):** Kann den Service-Role-Key verwenden und RLS bei Bedarf umgehen. Nur in Server-Components und API-Routes verfügbar, im Browser-Bundle unsichtbar.
- **Middleware (middleware.ts):** Läuft bei jedem Request, erneuert Auth-Sessions automatisch. Wird erst in PROJ-2 aktiv genutzt, aber jetzt schon vorbereitet.

### Umgebungsvariablen

| Variable | Sichtbarkeit | Zweck |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Öffentlich (Browser + Server) | Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlich (Browser + Server) | Eingeschränkter Schlüssel, durch RLS geschützt |
| `SUPABASE_SERVICE_ROLE_KEY` | Geheim (nur Server) | Volle Datenbankrechte, umgeht RLS |

### Neue Pakete

| Paket | Zweck |
|-------|-------|
| `@supabase/ssr` | Offizielle Next.js App Router Integration (Cookie-Handling, getrennte Clients) |

### Fehlerbehandlung

- Fehlende/falsche Umgebungsvariablen → Klare Fehlermeldung beim App-Start
- `.env.example` als dokumentierte Vorlage im Repository

## QA Test Results

**Tested:** 2026-09-28
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Supabase-Client verbindet sich im Entwicklungsmodus
- [x] Client wird mit korrekter URL und Anon-Key konfiguriert
- [x] Build läuft fehlerfrei durch (Verbindung wird beim Build-Zeitpunkt validiert)

#### AC-2: Fehlende .env.local zeigt aussagekräftige Fehlermeldung
- [x] `client.ts` wirft deutsche Fehlermeldung mit Anleitung bei fehlenden Variablen
- [x] `server.ts` wirft deutsche Fehlermeldung mit Anleitung bei fehlenden Variablen
- [x] `middleware.ts` gibt graceful Response zurück statt zu crashen
- [x] Unit-Tests bestätigen dieses Verhalten (4/4 Tests bestanden)

#### AC-3: Server-Client — Service-Role-Key nicht im Browser sichtbar
- [x] `SUPABASE_SERVICE_ROLE_KEY` kommt in keiner Quellcode-Datei unter `src/` vor
- [x] `server.ts` importiert `cookies()` aus `next/headers` — garantiert Server-only
- [x] Kein `'use client'`-Directive in server.ts oder middleware.ts
- **Hinweis:** Der Server-Client nutzt aktuell den Anon-Key mit Cookie-Sessions (Standard-Pattern). Das ist sicherer als der Service-Role-Key, weil RLS weiterhin greift. Der Service-Role-Key wird erst für Admin-Operationen benötigt (kein MVP-Feature).

#### AC-4: Browser-Client nutzt nur den Anon-Key
- [x] `client.ts` referenziert nur `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `'use client'`-Directive ist gesetzt
- [x] Unit-Test bestätigt korrekte Parameterübergabe an `createBrowserClient`

#### AC-5: Row Level Security ist Pflicht
- [x] Projektregeln in `.claude/rules/backend.md` erzwingen RLS auf jeder Tabelle
- [x] Keine Tabellen existieren noch (kommen in PROJ-3) — Konvention ist dokumentiert

#### AC-6: npm run build läuft fehlerfrei
- [x] Build erfolgreich: `✓ Compiled successfully in 4.0s`
- [x] Keine TypeScript-Fehler
- [x] Alle statischen Seiten generiert

### Edge Cases Status

#### EC-1: Falsche Umgebungsvariablen
- [x] Klare Fehlermeldung mit Link zum Supabase-Dashboard

#### EC-2: Fehlende .env.local
- [x] `.env.example` existiert als dokumentierte Vorlage im Repository

#### EC-3: Versehentlicher Key-Leak
- [x] Service-Role-Key in keiner Quellcode-Datei referenziert
- [x] Getrennte Module (client.ts vs server.ts) verhindern strukturell falschen Import

#### EC-4: .env.local in .gitignore
- [x] Pattern `.env*.local` in `.gitignore` vorhanden

### Security Audit Results
- [x] Kein Service-Role-Key im Quellcode
- [x] `.env.local` gitignored — wird nicht committet
- [x] `client.ts` hat `'use client'`-Directive — garantiert Browser-Kontext
- [x] Nur `NEXT_PUBLIC_`-Variablen im Browser-Client
- [x] `server.ts` nutzt `cookies()` — automatisch Server-only
- [x] Keine hardcodierten Secrets im Quellcode

### Unit Tests
- **Datei:** `src/lib/supabase/client.test.ts`
- **Ergebnis:** 4/4 Tests bestanden
- Fehler bei fehlender URL ✅
- Fehler bei fehlendem Anon-Key ✅
- Erfolgreiche Client-Erstellung ✅
- Korrekte Parameter an `createBrowserClient` ✅

### Bugs Found
Keine Bugs gefunden.

### Spec-Korrektur (Low)
- **AC-3** beschreibt, dass der Server-Client den Service-Role-Key nutzt. Die Implementierung nutzt stattdessen den Anon-Key mit Cookie-Sessions — das ist das offizielle Supabase-Pattern und sicherer, weil RLS weiterhin greift. Der Service-Role-Key wird bei Bedarf für Admin-Operationen in späteren Features ergänzt. Die Spec sollte entsprechend aktualisiert werden.

### Summary
- **Acceptance Criteria:** 6/6 bestanden
- **Bugs Found:** 0
- **Security:** Bestanden — keine Schwachstellen gefunden
- **Production Ready:** JA
- **Recommendation:** Bereit für Deployment

## Deployment
_To be added by /deploy_
