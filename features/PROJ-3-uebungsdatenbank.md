# PROJ-3: Übungsdatenbank (CRUD + Metadaten)

## Status: Deployed
**Created:** 2026-09-28
**Last Updated:** 2026-10-02
**Deployed:** 2026-10-02

### Implementation Notes (Frontend)
- Types, Konstanten und Zod-Validierung: `src/lib/types/exercise.ts`, `src/lib/validations/exercise.ts`
- Wizard (4 Schritte): `src/components/exercises/exercise-wizard.tsx` mit Step-Indicator
- Multi-Select-Komponente: `src/components/exercises/multi-select.tsx` (Popover + Checkbox + Custom-Einträge)
- Material-Input: Menge + Modus (pro Teilnehmer/insgesamt)
- Varianten-Input: Titel + Beschreibung + optionale abweichende Bedingungen (Collapsible)
- Übersichtsseite: Toolbar (Suche, Filter-Sheet, Sortierung, Ansichts-Toggle) + Listen/Kartenansicht + Empty State
- Detailseite: Alle Metadaten, Varianten-Akkordeon, Lösch-Dialog
- Dashboard: Aktualisiert mit Navigations-Card zur Übungsdatenbank
- Server Actions: Vollständig implementiert in `src/lib/actions/exercises.ts` mit realen Supabase-Abfragen
- Varianten: Abweichende Bedingungen unterstützen jetzt auch Altersgruppen und Organisationsformen
- Build: Erfolgreich (keine TypeScript-Fehler)

### Implementation Notes (Backend)
- **Datenbank-Migration:** 5 Tabellen (exercises, exercise_materials, exercise_variants, exercise_links, custom_categories) mit RLS, GIN-Indexes auf JSONB-Spalten, CASCADE-Deletes, updated_at-Trigger
- **Server Actions:** `getExercises` (Filter/Suche/Paginierung), `getExercise`, `createExercise`, `updateExercise`, `deleteExercise`, `getCustomCategories`
- **Custom Categories:** `saveCustomCategories()` vergleicht ausgewählte Werte mit vordefinierten Listen, upsert nicht-vordefinierte Einträge in custom_categories-Tabelle. Server Components laden eigene Kategorien und übergeben sie an den Wizard.
- **JSONB-Handling:** `string[]`-Arrays werden als `as unknown as Json` gecastet für Insert/Update; Rückrichtung ebenso für Mapping-Funktionen
- **Materialfilter:** Post-Query-Filter da Materialien in separater Tabelle; "Kein Material" als Spezialfall
- **Typdefinitionen:** `src/lib/database.types.ts` mit `type Database` (nicht interface) und `Relationships: []` auf jeder Tabelle (Supabase-Client-Anforderung)

**Backend-Anforderung: Eigene Kategorien persistent machen**
Beim Speichern einer Übung sollen alle nicht-vordefinierten Einträge (eigene Sportarten, Materialien, Phasen, Organisationsformen, Altersgruppen) automatisch in die `custom_categories`-Tabelle geschrieben werden. Beim Laden des Wizards sollen die eigenen Kategorien des Nutzers abgerufen und in die Auswahllisten eingefügt werden (zusammen mit den vordefinierten). Das Frontend (`multi-select.tsx`) unterstützt bereits eigene Einträge — es müssen nur die gespeicherten eigenen Kategorien beim Laden übergeben werden.

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure Setup) — Datenbank und Storage
- Requires: PROJ-2 (Benutzerregistrierung & Login) — Nur eingeloggte Nutzer können Übungen verwalten

## User Stories
1. Als Übungsleiter möchte ich eine neue Übung mit allen relevanten Metadaten anlegen, damit ich sie später in meiner Stundenplanung verwenden kann.
2. Als Übungsleiter möchte ich meine Übungen nach verschiedenen Kriterien filtern und durchsuchen, damit ich schnell die passende Übung für meine Gruppe finde.
3. Als Übungsleiter möchte ich eine bestehende Übung bearbeiten, damit ich sie verbessern oder an neue Erkenntnisse anpassen kann.
4. Als Übungsleiter möchte ich eine Übung löschen können, wenn ich sie nicht mehr brauche.
5. Als Übungsleiter möchte ich Varianten einer Übung dokumentieren, damit ich verschiedene Abwandlungen an einem Ort habe.
6. Als Übungsleiter möchte ich zwischen Listen- und Kartenansicht wechseln, damit ich meine Übungen auf die für mich angenehmste Weise durchblättern kann.
7. Als Übungsleiter möchte ich Links und Bilder zu einer Übung hinterlegen, damit ich beim Vorbereiten schnell auf weiterführendes Material zugreifen kann.

## Out of Scope
- **Schnelleingabe-Modus / Einzelformular** — bewusst auf später verschoben; die Wizard-Struktur wird so gebaut, dass ein Einzelformular-Modus mit minimalem Aufwand nachgerüstet werden kann
- **Starter-Datenbank (vorkuratierte Übungen)** — eigenes Feature (PROJ-4); PROJ-3 deckt nur die eigene, persönliche Datenbank ab
- **Favoriten-System / Import aus Starter-DB** — eigenes Feature (PROJ-8); das Hinzufügen von Referenz-Übungen zur eigenen Datenbank wird dort spezifiziert
- **Community-Features / Übungen teilen** — deferred zu PROJ-12
- **Video-Upload** — zu hoher Infrastruktur-Aufwand für MVP; stattdessen Link-Feld für externe Videos (YouTube etc.)
- **Musik-Datei-Upload** — nur Link-Feld (Spotify, YouTube etc.), kein Datei-Upload
- **Bulk-Operationen** (mehrere Übungen gleichzeitig löschen/bearbeiten) — kein MVP-Bedarf
- **Duplikat-Erkennung** — keine automatische Erkennung ähnlicher Übungen
- **Export/Import** (CSV, PDF etc.) — nicht im MVP

## Datenmodell

### Übung — Felder

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Name | Text | Ja | Bezeichnung der Übung (z.B. "Feuer-Wasser-Blitz") |
| Beschreibung | Langtext | Ja | Ablauf und Regeln der Übung |
| Anmerkungen | Langtext | Nein | Persönliche Notizen, Tipps, Erfahrungen |
| Sportart(en) | Multi-Select | Ja | Aus vordefinierter Liste + eigene (s.u.) |
| Altersgruppe(n) | Multi-Select | Ja | Vordefinierte Kategorien als Matching-Anker + eigene Tags |
| Phase(n) | Multi-Select | Ja | 3 Standards + eigene benennbare Phasen |
| Dauer | Zahl (Minuten) | Ja | Geschätzte Dauer der Übung |
| Teilnehmerzahl Min | Zahl | Nein | Minimale Teilnehmerzahl |
| Teilnehmerzahl Max | Zahl | Nein | Maximale Teilnehmerzahl |
| Schwierigkeitsgrad | Einfachauswahl | Ja | Leicht / Mittel / Schwer |
| Organisationsform(en) | Multi-Select | Nein | Aus vordefinierter Liste + eigene |
| Musik benötigt | Toggle | Nein | Ja/Nein, Standard: Nein |
| Musik-Link | URL | Nein | Link zu Playlist/Song (nur wenn Musik = Ja) |
| Links | URL-Liste | Nein | Weiterführende Links (YouTube, Webseiten etc.) |
| Bild | Datei-Upload | Nein | Ein Foto/Bild der Übung (Supabase Storage) |

### Material (pro Übung, mehrere möglich)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Material | Text/Select | Ja | Aus vordefinierter Liste + eigene |
| Anzahl | Zahl | Ja | Benötigte Menge |
| Modus | Auswahl | Ja | "pro Teilnehmer" oder "insgesamt" |

### Varianten (pro Übung, mehrere möglich)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Titel | Text | Ja | Kurzbezeichnung der Variante |
| Beschreibung | Langtext | Ja | Ablauf der Variante |
| Abweichendes Material | Material-Liste | Nein | Nur was anders ist als bei der Hauptübung |
| Abweichende Teilnehmerzahl | Min/Max | Nein | Nur wenn anders als Hauptübung |
| Abweichende Dauer | Zahl (Minuten) | Nein | Nur wenn anders als Hauptübung |

### Vordefinierte Auswahllisten

**Sportarten:** Turnen, Volleyball, Fußball, Basketball, Handball, Leichtathletik, Tanzen, Fitness/Workout, Schwimmen, Allgemeinsport, Krabbelgruppe, Eltern-Kind Turnen, Vorschulturnen, Kinderturnen, Kinderspiele, Abenteuer und Erlebnis, Kampfsport, Therapie, Rehabilitation/Prävention, Teambuilding

**Altersgruppen:** Kinder (0–1), Kinder (1–2), Kinder (2–4), Kinder (4–6), Kinder (7–10), Jugend (11–14), Jugend (15–17), Erwachsene (18–45), Erwachsene (46–60), Senioren (60+)

**Phasen:** Aufwärmen, Hauptteil, Cool-Down

**Organisationsformen:** Freie Verteilung (ganze Halle), Zu zweit / Paare, Kleingruppen, Zwei Mannschaften (gemeinsames Spielfeld), Zwei Mannschaften (getrenntes Spielfeld), Kreis / Sitzkreis, Reihe / Gasse, Stationsbetrieb, 1-gegen-1

**Material:** Ball, Yoga-Matte, Weichbodenmatte, Turnmatte, Hütchen, Seil/Springseil, Bank, Reifen, Kleiner Kasten, Großer Kasten, Bock, Pferd, Sprossenwand, Turnringe, Stab, Leibchen, Tor/Netz, Kegel, Schwungtuch, Markierung, Tuch, Kein Material

**Schwierigkeitsgrad:** Leicht, Mittel, Schwer

## UI-Konzept

### Übersichtsseite (Übungsliste)
- **Ansichts-Toggle** oben rechts: Listenansicht (Standard) / Kartenansicht
- **Listenansicht:** Kompakte Zeilen mit Name, Sportart-Badges, Phase, Dauer, Schwierigkeitsgrad
- **Kartenansicht:** Karten mit Bild (oder Platzhalter-Icon basierend auf Sportart), Name, Sportart-Badges, Dauer
- **Textsuche** über Name und Beschreibung
- **Filter:** Sportart, Altersgruppe, Phase, Material, Teilnehmerzahl, Schwierigkeitsgrad, Organisationsform
- **Sortierung:** Name (A–Z), Zuletzt bearbeitet, Zuletzt verwendet
- **"Mehr laden"-Pattern** bei großen Datenmengen (>50 Übungen)
- **Empty State:** Freundliche Nachricht "Noch keine Übungen vorhanden" + prominenter "Erste Übung anlegen"-Button + Hinweis auf Starter-Datenbank (wird erst aktiv mit PROJ-4)

### Wizard (Erstellen & Bearbeiten)
4 Schritte:
1. **Basis** — Name, Beschreibung, Anmerkungen
2. **Einordnung** — Sportart(en), Altersgruppe(n), Phase(n), Schwierigkeitsgrad, Organisationsform(en)
3. **Logistik** — Dauer, Teilnehmerzahl (Min/Max), Material mit Mengen und Modus, Musik (Toggle + Link)
4. **Extras** — Varianten, Links, Bildupload

- Schrittanzeige/Progress-Bar oben
- Vor/Zurück-Navigation zwischen Schritten
- Validierung pro Schritt (Pflichtfelder müssen ausgefüllt sein bevor man weitergeht)
- "Speichern"-Button im letzten Schritt

### Detailseite
- Eigene Seite (kein Popup/Drawer)
- Oben: Name, Sportart-Badges, Schwierigkeitsgrad
- Beschreibung als Fließtext
- Gruppierte Metadaten: Phase(n), Dauer, Teilnehmerzahl, Organisationsform, Material mit Mengen
- Varianten als aufklappbare Akkordeon-Elemente
- Musik-Link (direkt klickbar) wenn vorhanden
- Bild wenn vorhanden
- Weiterführende Links
- Anmerkungen
- Oben rechts: Bearbeiten- und Löschen-Button

### Löschen
- Bestätigungsdialog ("Übung XY wirklich löschen?")
- Endgültiges Löschen (kein Papierkorb)
- Warnung wenn Übung in einer gespeicherten Einheit verwendet wird (relevant ab PROJ-6/7)

## Acceptance Criteria

### Übung erstellen
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er auf "Neue Übung" klickt, dann öffnet sich der Wizard mit Schritt 1 (Basis)
- [ ] Angenommen der Nutzer ist in Schritt 1, wenn er Name und Beschreibung eingibt und auf "Weiter" klickt, dann gelangt er zu Schritt 2 (Einordnung)
- [ ] Angenommen der Nutzer ist in einem beliebigen Schritt, wenn Pflichtfelder nicht ausgefüllt sind und er auf "Weiter" klickt, dann werden Validierungsfehlermeldungen für jedes fehlende Pflichtfeld angezeigt
- [ ] Angenommen der Nutzer hat alle 4 Schritte ausgefüllt, wenn er auf "Speichern" klickt, dann wird die Übung gespeichert und er wird zur Detailseite der neuen Übung weitergeleitet
- [ ] Angenommen der Nutzer fügt Material hinzu, wenn er ein Material auswählt, dann kann er Anzahl und Modus ("pro Teilnehmer" / "insgesamt") angeben
- [ ] Angenommen der Nutzer fügt eine Variante hinzu, wenn er Titel und Beschreibung eingibt, dann kann er optional abweichende Bedingungen (Material, Teilnehmerzahl, Dauer) angeben

### Übungen anzeigen und durchsuchen
- [ ] Angenommen der Nutzer hat Übungen angelegt, wenn er die Übersichtsseite öffnet, dann sieht er seine Übungen in der Listenansicht
- [ ] Angenommen der Nutzer ist in der Listenansicht, wenn er auf den Ansichts-Toggle klickt, dann wechselt die Darstellung zur Kartenansicht (und umgekehrt)
- [ ] Angenommen der Nutzer hat 60 Übungen, wenn er die Übersichtsseite öffnet, dann werden die ersten 50 angezeigt mit einem "Mehr laden"-Button am Ende
- [ ] Angenommen der Nutzer gibt einen Suchbegriff ein, wenn der Begriff im Namen oder der Beschreibung einer Übung vorkommt, dann wird diese Übung in den Ergebnissen angezeigt
- [ ] Angenommen der Nutzer setzt den Filter "Sportart: Volleyball" und "Phase: Aufwärmen", wenn die Filter aktiv sind, dann werden nur Übungen angezeigt die beide Kriterien erfüllen
- [ ] Angenommen der Nutzer klickt auf eine Übung, dann öffnet sich die Detailseite mit allen Informationen

### Übung bearbeiten
- [ ] Angenommen der Nutzer ist auf der Detailseite einer Übung, wenn er auf "Bearbeiten" klickt, dann öffnet sich der Wizard mit den vorausgefüllten Daten
- [ ] Angenommen der Nutzer bearbeitet eine Übung, wenn er Änderungen speichert, dann werden die aktualisierten Daten auf der Detailseite angezeigt

### Übung löschen
- [ ] Angenommen der Nutzer ist auf der Detailseite, wenn er auf "Löschen" klickt, dann erscheint ein Bestätigungsdialog
- [ ] Angenommen der Bestätigungsdialog ist offen, wenn der Nutzer bestätigt, dann wird die Übung endgültig gelöscht und er wird zur Übersichtsseite weitergeleitet
- [ ] Angenommen der Bestätigungsdialog ist offen, wenn der Nutzer abbricht, dann bleibt die Übung erhalten

### Eigene Kategorien
- [ ] Angenommen der Nutzer ist im Sportart-Auswahlfeld, wenn keine passende Sportart in der Liste ist, dann kann er eine eigene Sportart hinzufügen
- [ ] Angenommen der Nutzer hat eine eigene Sportart erstellt, wenn er eine neue Übung anlegt, dann erscheint die eigene Sportart in der Auswahlliste
- [ ] Angenommen der Nutzer erstellt eigene Kategorien (Sportart, Material, Phase, Organisationsform, Altersgruppe), dann sind diese nur für ihn sichtbar (nicht für andere Nutzer)
- [ ] Angenommen der Nutzer hat in früheren Übungen eigene Einträge (z.B. eigene Sportart "Akrobatik") hinzugefügt, wenn er eine neue Übung anlegt, dann erscheinen alle seine bisherigen eigenen Einträge automatisch in den jeweiligen Auswahllisten (persistent über die custom_categories-Tabelle)

### Datentrennung
- [ ] Angenommen zwei verschiedene Nutzer sind registriert, wenn Nutzer A eine Übung anlegt, dann kann Nutzer B diese Übung nicht sehen
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er versucht die Übungsdatenbank zu öffnen, dann wird er zum Login weitergeleitet

## Edge Cases
1. **Leeres Formular absenden:** Nutzer klickt "Weiter" ohne Pflichtfelder auszufüllen → Validierungsfehler werden pro Feld angezeigt, Eingabe bleibt erhalten
2. **Sehr langer Name/Beschreibung:** Name wird auf 100 Zeichen begrenzt, Beschreibung auf 5.000 Zeichen → Zeichenzähler im Formular
3. **Doppelter Übungsname:** Erlaubt — der Nutzer kann mehrere Übungen mit dem gleichen Namen haben (z.B. verschiedene Varianten für verschiedene Gruppen)
4. **Ungültige URL im Link-Feld:** Validierung prüft auf gültiges URL-Format, zeigt Fehlermeldung bei ungültiger URL
5. **Bildupload fehlschlägt:** Fehlermeldung "Bild konnte nicht hochgeladen werden", Übung wird trotzdem ohne Bild gespeichert, Nutzer kann es später hinzufügen
6. **Zu großes Bild:** Maximale Dateigröße 5 MB, erlaubte Formate: JPG, PNG, WebP → Fehlermeldung mit erlaubten Formaten/Größe
7. **Netzwerkfehler beim Speichern:** Fehlermeldung "Speichern fehlgeschlagen, bitte erneut versuchen", Formulardaten bleiben erhalten
8. **Nutzer navigiert weg während Wizard offen:** Browser-Warnung "Nicht gespeicherte Änderungen gehen verloren"
9. **Material-Anzahl 0 oder negativ:** Validierung erlaubt nur positive ganze Zahlen ≥ 1
10. **Teilnehmerzahl Min > Max:** Validierung verhindert das Speichern und zeigt Fehlermeldung

## Technical Requirements
- **Authentifizierung:** Alle Endpoints erfordern einen eingeloggten Nutzer
- **Row Level Security:** Jeder Nutzer sieht und bearbeitet nur seine eigenen Daten
- **Performance:** Übungsliste lädt in < 500ms (bis 100 Übungen)
- **Bildupload:** Über Supabase Storage, max. 5 MB, Formate: JPG, PNG, WebP
- **Mobile:** Alle Views müssen auf Smartphone-Bildschirmen gut funktionieren (responsive)

## Open Questions
- [ ] Sollen die vordefinierten Auswahllisten (Sportarten, Material etc.) erweiterbar sein durch ein Admin-Interface, oder reichen die fest eingebauten + nutzereigene Ergänzungen?
- [ ] Soll "Zuletzt verwendet" als Sortierung schon in PROJ-3 gebaut werden, oder erst wenn der Generator (PROJ-6) existiert und Übungen tatsächlich "verwendet" werden?
- [ ] Wie viele Varianten pro Übung maximal? (Vorschlag: kein hartes Limit, UI-seitig ab 10 eine Warnung)

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Wizard statt Einzelformular für Erstellen/Bearbeiten | Führt Ehrenamtliche ohne Profi-Erfahrung besser durch den Prozess; Einzelformular-Modus kann später ergänzt werden | 2026-09-30 |
| Listen- und Kartenansicht mit Toggle | Listenansicht ist schneller scanbar (Standard), Kartenansicht wird attraktiver sobald Bilder vorhanden sind | 2026-09-30 |
| Eigene Detailseite statt Drawer/Popup | Alle Infos (inkl. Varianten, Bilder, Links) brauchen Platz; Drawer wäre zu eingeengt | 2026-09-30 |
| Endgültiges Löschen statt Soft-Delete/Papierkorb | Hält das System einfach für MVP; Bestätigungsdialog schützt vor Unfällen | 2026-09-30 |
| Vordefinierte Kategorien als Matching-Anker + eigene Tags | Eigene Freitext-Kategorien können nicht zuverlässig gematcht werden; Vordefinierte sichern das Matching im Generator (PROJ-6), eigene dienen der persönlichen Organisation | 2026-09-30 |
| Material mit Anzahl + Modus (pro Teilnehmer / insgesamt) | Generator braucht präzise Material-Infos um gegen Gruppenprofil abzugleichen; kleiner UI-Aufwand, großer Nutzen | 2026-09-30 |
| Phasen: 3 Standards + frei benennbare eigene | Feste Phasen sichern Matching, eigene Phasen geben Flexibilität für individuelle Stundenstrukturen (werden in PROJ-6 weiter ausgebaut) | 2026-09-30 |
| Links + Bildupload, kein Video-Upload | Links sind zero-cost (YouTube etc.); Bildupload nutzt vorhandene Supabase-Infrastruktur; Video-Upload wäre zu aufwendig (Speicher, Player) | 2026-09-30 |
| Varianten als Textblöcke mit optionalen abweichenden Bedingungen | Einfacher Normalfall (nur Text), aber mächtig wenn nötig; Variante erbt Hauptübungs-Bedingungen, nur Abweichendes wird eingetragen | 2026-09-30 |
| Musik: Toggle + Link-Feld statt Datei-Upload | Link ist sofort nutzbar (Spotify, YouTube), kein Speicher-Overhead; Link ist im fertigen Stundenplan direkt klickbar | 2026-09-30 |
| Starter-Übungen als separate Referenz, nicht als Kopie importiert | Nutzer fügt Starter-Übungen über Favoriten (PROJ-8) zur eigenen DB hinzu, erst dann editierbar; hält Referenz-DB sauber | 2026-09-30 |
| Schwierigkeitsgrad: 3 Stufen (Leicht/Mittel/Schwer) | Schnell auszuwählen, intuitiv für Ehrenamtliche, granular genug für Generator-Matching | 2026-09-30 |
| Scrollbare Liste mit "Mehr laden" statt Pagination | Erwartete Datenmenge (20–80 eigene Übungen) braucht keine echte Pagination; "Mehr laden" als Sicherheitsnetz für Power-User | 2026-09-30 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Tags (Sportarten, Alter, Phasen, Orga) als JSONB-Listen in der Übungstabelle | Weniger Tabellen, einfachere Abfragen; Supabase kann JSONB-Listen filtern; völlig ausreichend für 20–80 Übungen pro Nutzer | 2026-09-30 |
| Materialien, Varianten, Links als eigene Tabellen | Komplexe Strukturen mit mehreren Feldern pro Eintrag; lassen sich nicht sinnvoll als einfache Liste speichern | 2026-09-30 |
| Eine gemeinsame custom_categories-Tabelle für alle Kategorie-Typen | Nutzer erstellt insgesamt nur 5–15 eigene Kategorien; 5 separate Tabellen wären Overkill | 2026-09-30 |
| Server Actions statt API-Routes für CRUD | Passt zum bestehenden Auth-Pattern; weniger Boilerplate, gleiche Sicherheit | 2026-09-30 |
| Filter serverseitig statt clientseitig | Skaliert besser, funktioniert mit "Mehr laden"-Pattern, Textsuche in DB schneller | 2026-09-30 |
| Bilder in geschütztem Supabase Storage pro Nutzer | Verhindert Zugriff auf fremde Bilder auch bei erratener URL | 2026-09-30 |
| Keine neuen Pakete nötig | Supabase, Zod, shadcn/ui decken alles ab; kein zusätzlicher Dependency-Overhead | 2026-09-30 |
| Abweichendes Material bei Varianten als JSONB-Liste in der Varianten-Tabelle | Meist nur 1–2 Abweichungen; eigene Tabelle wäre übertrieben | 2026-09-30 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
(protected)/exercises/                    ← Übersichtsseite
+-- ExerciseToolbar
|   +-- Suchfeld (Textsuche)
|   +-- FilterPanel (Sportart, Alter, Phase, Material, Teilnehmer, Schwierigkeit, Orga)
|   +-- Sortierung (Name, Bearbeitet, Verwendet)
|   +-- Ansichts-Toggle (Liste / Karten)
|   +-- "Neue Übung"-Button
+-- ExerciseListView (Standard)
|   +-- ExerciseListItem (eine Zeile pro Übung)
+-- ExerciseCardView (Alternativ)
|   +-- ExerciseCard (eine Karte pro Übung)
+-- EmptyState ("Noch keine Übungen")
+-- "Mehr laden"-Button

(protected)/exercises/new                 ← Neue Übung anlegen
+-- ExerciseWizard
    +-- StepIndicator (4 Schritte, Progress-Bar)
    +-- Schritt 1: Basis (Name, Beschreibung, Anmerkungen)
    +-- Schritt 2: Einordnung (Sportarten, Alter, Phasen, Schwierigkeit, Orga)
    +-- Schritt 3: Logistik (Dauer, Teilnehmer, Material, Musik)
    +-- Schritt 4: Extras (Varianten, Links, Bildupload)
    +-- Vor/Zurück/Speichern-Buttons

(protected)/exercises/[id]                ← Detailseite
+-- ExerciseDetail (alle Metadaten)
+-- VariantAccordion (aufklappbare Varianten)
+-- Bearbeiten-Button → leitet zu /exercises/[id]/edit
+-- Löschen-Button → DeleteConfirmDialog

(protected)/exercises/[id]/edit           ← Übung bearbeiten
+-- ExerciseWizard (gleiche Komponente, vorausgefüllt)
```

### Datenmodell

**Haupttabelle: Übungen (exercises)**
Jede Übung gehört einem Nutzer (über user_id). Enthält:
- Name, Beschreibung, Anmerkungen (Textfelder)
- Sportarten, Altersgruppen, Phasen, Organisationsformen → als JSONB-Listen direkt in der Tabelle
- Dauer, Teilnehmerzahl Min/Max, Schwierigkeitsgrad (einfache Werte)
- Musik-Toggle + Musik-Link
- Bild-URL (Verweis auf Storage)
- Zeitstempel: Erstellt, Zuletzt bearbeitet

**Tabelle: Materialien (exercise_materials)**
Pro Übung mehrere möglich. Jeder Eintrag: Material-Name, Anzahl, Modus (pro Teilnehmer / insgesamt).

**Tabelle: Varianten (exercise_variants)**
Pro Übung mehrere möglich. Jeder Eintrag: Titel, Beschreibung, optional abweichendes Material (als JSONB-Liste), abweichende Teilnehmerzahl, abweichende Dauer.

**Tabelle: Links (exercise_links)**
Pro Übung mehrere möglich. Jeder Eintrag: URL, optionaler Titel.

**Tabelle: Eigene Kategorien (custom_categories)**
Eine Tabelle für alle Typen. Jeder Eintrag: Nutzer-ID, Typ (sport/material/phase/org_form/age_group), Name.

**Supabase Storage: exercise-images (geschützter Bucket)**
Bilder pro Nutzer in eigenem Ordner. Übung speichert nur den Pfad.

### Datenabruf-Strategie

| Aktion | Methode | Begründung |
|--------|---------|------------|
| Übungen laden (Liste) | Server Component | Schnell, geschützt, kein Client-JS nötig |
| Erstellen/Bearbeiten/Löschen | Server Actions | Gleiches Muster wie Auth; Zod-Validierung serverseitig |
| Filter + Suche | Server-seitig | DB filtert effizienter; skaliert mit "Mehr laden" |
| Bild hochladen | Client → Supabase Storage direkt | Standard für Datei-Uploads; kein Umweg über Server Actions |
| Ansichts-Toggle | Client (localStorage) | Reine UI-Präferenz, keine DB nötig |

### Sicherheitsmodell

- RLS auf allen Tabellen: Nutzer sieht/bearbeitet nur eigene Daten
- Storage-Policies: Nutzer kann nur in eigenen Ordner hochladen/lesen
- Server-seitige Zod-Validierung aller Eingaben
- Auth-Check durch bestehendes Protected Layout

### Abhängigkeiten

Keine neuen Pakete. Bestehender Stack reicht:
- Supabase (Datenbank + Storage + RLS)
- Zod (Validierung)
- shadcn/ui (alle UI-Komponenten bereits installiert)

### Integration

- Eingehängt unter bestehendem (protected) Layout → Auth automatisch
- Dashboard bekommt Link zur Übungsdatenbank
- Navigation wird später erweitert (Sidebar/Top-Nav für weitere Features)

## QA Test Results

**QA Date:** 2026-10-02
**Tested By:** QA (Code Review + Automated Tests)
**Overall Status:** ✅ READY — alle kritischen Bugs behoben

### Acceptance Criteria Results

#### Übung erstellen
| # | Criterion | Result |
|---|-----------|--------|
| 1 | "Neue Übung" → Wizard Schritt 1 (Basis) | ✅ PASS |
| 2 | Name + Beschreibung → Schritt 2 (Einordnung) | ✅ PASS |
| 3 | Pflichtfelder leer + "Weiter" → Validierungsfehler | ✅ PASS |
| 4 | Alle 4 Schritte → Speichern → Detailseite | ✅ PASS |
| 5 | Material mit Anzahl und Modus | ✅ PASS |
| 6 | Variante mit Titel, Beschreibung, opt. Bedingungen | ✅ PASS |

#### Übungen anzeigen und durchsuchen
| # | Criterion | Result |
|---|-----------|--------|
| 7 | Übersichtsseite → Listenansicht | ✅ PASS |
| 8 | Ansichts-Toggle (Liste ↔ Karten) | ✅ PASS |
| 9 | 60 Übungen → erste 50 + "Mehr laden" | ✅ PASS |
| 10 | Textsuche in Name/Beschreibung | ✅ PASS |
| 11 | Kombinierte Filter (Sportart + Phase = AND) | ✅ PASS |
| 12 | Klick auf Übung → Detailseite | ✅ PASS |

#### Übung bearbeiten
| # | Criterion | Result |
|---|-----------|--------|
| 13 | Bearbeiten → Wizard vorausgefüllt | ✅ PASS |
| 14 | Änderungen speichern → aktualisierte Detailseite | ✅ PASS |

#### Übung löschen
| # | Criterion | Result |
|---|-----------|--------|
| 15 | Löschen → Bestätigungsdialog | ✅ PASS |
| 16 | Bestätigen → gelöscht + Übersichtsseite | ✅ PASS |
| 17 | Abbrechen → Übung bleibt | ✅ PASS |

#### Eigene Kategorien
| # | Criterion | Result |
|---|-----------|--------|
| 18 | Eigene Sportart hinzufügen | ✅ PASS |
| 19 | Eigene Kategorien persistent | ✅ PASS |
| 20 | Eigene Kategorien nur pro Nutzer | ✅ PASS |
| 21 | Eigene Kategorien im Wizard geladen | ✅ PASS |

#### Datentrennung
| # | Criterion | Result |
|---|-----------|--------|
| 22 | Nutzer A kann Nutzer B nicht sehen (RLS) | ✅ PASS |
| 23 | Nicht eingeloggt → Redirect zu /login | ✅ PASS |

**Ergebnis: 23/23 Acceptance Criteria bestanden**

### Edge Case Results

| # | Edge Case | Result |
|---|-----------|--------|
| 1 | Leeres Formular absenden → Validierungsfehler | ✅ PASS |
| 2 | Langer Name (>100 Zeichen) → Zeichenzähler + Limit | ✅ PASS |
| 3 | Doppelter Übungsname erlaubt | ✅ PASS |
| 4 | Ungültige URL im Link-Feld → Fehlermeldung | ✅ PASS |
| 5 | Bildupload fehlschlägt → Graceful error | ✅ PASS (Fehlermeldung + Übung bleibt ohne Bild) |
| 6 | Zu großes Bild (>5MB) → Fehlermeldung | ✅ PASS (Client-Validierung + Storage-Limit) |
| 7 | Netzwerkfehler beim Speichern → Fehlermeldung | ✅ PASS |
| 8 | Weg-Navigation → Browser-Warnung | ✅ PASS |
| 9 | Material-Anzahl 0/negativ → Validierung | ✅ PASS |
| 10 | Teilnehmerzahl Min > Max → Fehlermeldung | ✅ PASS |

### Bugs Found

#### Bug 1: PostgREST Filter Injection in Textsuche (Medium — Security) ✅ BEHOBEN
**Datei:** `src/lib/actions/exercises.ts:82`
**Fix:** Suchbegriff wird jetzt sanitized — Kommas, Klammern, Anführungszeichen und Backslashes werden entfernt bevor der Suchterm in den `.or()`-Filter geht.

#### Bug 2: javascript: URLs in Links nicht blockiert (Medium — Security) ✅ BEHOBEN
**Datei:** `src/lib/validations/exercise.ts`
**Fix:** Neuer `httpUrl`-Validator mit `.refine()` prüft auf `http://` oder `https://` Protokoll. Gilt für Link-URLs und Musik-Links. Unit-Tests für `javascript:` und `data:` URLs hinzugefügt.

#### Bug 3: Bildupload fehlt (Medium) ✅ BEHOBEN
**Fix:** Vollständige Implementierung:
- Supabase Storage Bucket `exercise-images` (privat, 5MB, JPG/PNG/WebP)
- RLS-Policies (Upload/Read/Update/Delete nur eigener Ordner)
- `ImageUpload`-Komponente mit Drag-to-upload UI, Vorschau, Löschen
- Signed URLs für Anzeige auf Detail- und Kartenansicht
- Fehlerbehandlung für ungültige Formate, zu große Dateien, Upload-Fehler

#### Bug 4: LIKE-Wildcards in Suche nicht escaped (Low) — OFFEN
**Datei:** `src/lib/actions/exercises.ts`
**Schwere:** Low — kein Sicherheitsrisiko, nur unerwartete Suchergebnisse bei `%` oder `_` im Suchbegriff

### Security Audit

| Check | Result |
|-------|--------|
| Auth-Bypass | ✅ Keine Schwachstelle — Protected Layout prüft Session |
| Authorization (Cross-User) | ✅ Alle Queries filtern auf user_id + RLS |
| XSS via Eingabefelder | ✅ React escaped HTML automatisch |
| XSS via Link-URLs | ✅ Behoben — nur http/https erlaubt |
| SQL Injection | ✅ Supabase parametrisiert Queries |
| PostgREST Injection | ✅ Behoben — Suchbegriff sanitized |
| Rate Limiting | ❌ Nicht implementiert (akzeptabel für MVP) |
| Secrets in Browser | ✅ Keine Secrets exposed |
| Sensitive Data in API | ✅ Nur eigene Daten zurückgegeben |

### Automated Tests

| Suite | Result |
|-------|--------|
| Vitest (Unit/Integration) | ✅ 55 Tests passed (16 existing + 39 new exercise validation incl. security) |
| Playwright (E2E) | 📝 Geschrieben in `tests/PROJ-3-uebungsdatenbank.spec.ts` — erfordert Auth-Setup für automatische Ausführung |

### Production-Ready Decision

**✅ READY** — Alle kritischen und mittelschweren Bugs behoben:
- Bug 1 (PostgREST Filter Injection) ✅ behoben
- Bug 2 (javascript: URLs) ✅ behoben
- Bug 3 (Bildupload) ✅ implementiert
- Bug 4 (LIKE-Wildcards) — Low, kein Blocker, offen

## Deployment
_To be added by /deploy_
