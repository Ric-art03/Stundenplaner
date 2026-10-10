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

1. ~~**BUG-16**~~ — am 2026-10-08 mit dem Backend von PROJ-7 behoben, siehe unten
2. **Prüfung in echtem WebKit** — braucht eine Ordner-Ausnahme für `%LOCALAPPDATA%\ms-playwright`, und die muss in **Avast** stehen: Windows Defender ist auf diesem Rechner abgeschaltet, eine Ausnahme im Windows-Sicherheitscenter wirkt nicht
3. **Die 40 Testübungen** stecken weiter in der Datenbank — Rohmasse für PROJ-4, erst übernehmen, dann löschen

### Am 2026-10-06 abgeräumt

- **Das Migrationsregister** stimmt jetzt mit den Dateien überein. Es waren zwei Fehler, nicht einer: drei Dateien fehlten ganz, und drei weitere standen unter einer anderen Version als ihr Dateiname (`create_units_tables` etwa unter `20261004062433` statt `20261004140000`). Vor dem Eintragen Spalte für Spalte geprüft, dass die drei fehlenden Migrationen wirklich im Schema stecken — `schedule_type` und `date` an `group_schedules`, `groups.participants` statt `participants_min`/`_max`, `groups.primary_sport`. Danach `diff` zwischen Dateiliste und Register: **13 zu 13, keine Abweichung**. `supabase db push` stolpert nicht mehr
- **BUG-4** — siehe unten
- **Schutz gegen geleakte Passwörter** ist **kein offener Punkt mehr, sondern eine Tarifentscheidung** und steht jetzt in der Pre-Launch-Checkliste des PRD. Die Funktion setzt den **Pro-Plan** voraus, der Schalter ist auf dem kostenlosen Plan nicht benutzbar. Die frühere Notiz hier war doppelt falsch: der Pfad (nicht Authentication → Policies, sondern Authentication → Sign In / Providers → Email) und die Annahme, es sei ein Klick. Stattdessen am 2026-10-06 gesetzt, was ohne Pro geht: **Mindestlänge erhöht und erforderliche Zeichenarten verlangt**. Das ersetzt den Abgleich gegen HaveIBeenPwned nicht, verkleinert aber dasselbe Risiko. `get_advisors` meldet den Hinweis weiterhin — das ist erwartet und kein Versäumnis

**PROJ-7 (Einheiten-Editor) hat seit dem 2026-10-06 eine Spec** — [PROJ-7-einheiten-editor.md](PROJ-7-einheiten-editor.md). Der Editor ist ein Modus auf der Detailseite, keine eigene Seite; er ändert Inhalte innerhalb eines Segments (tauschen, auswürfeln, Variante, entfernen, Plandauer, umsortieren, einfügen), während das Zeitgerüst beim Generator bleibt. Zwei Dinge aus PROJ-6 sind dort mitentschieden: **BUG-5** (Nachbesetzen des Platzhalters) wird hier behoben, und die **Lücken-Sperre beim Speichern fällt weg** — ersetzt durch eine Nachfrage, die die betroffenen Segmente benennt. **BUG-4 (Eigentumsprüfung in der Datenbank) ist am 2026-10-06 erledigt** — bewusst vor dem Entwurf, weil der Editor neue Schreibwege bringt. Dabei kam heraus, dass der Befund größer war als gemeldet: **fünf** Richtlinien statt zwei, darunter der UPDATE-Weg auf `unit_items`, den das Tauschen benutzt. Angewendet über den SQL-Editor des Dashboards (`apply_migration` über MCP wurde ohne Dialog abgelehnt), Migration `20261006090000_harden_unit_write_policies.sql`, im Register eingetragen, am lebenden System in zurückgerollten Transaktionen nachgewiesen.

**PROJ-7 hat seit dem 2026-10-07 einen Technikentwurf** — Abschnitt „Tech Design" in der Spec. Die tragende Entscheidung: der Editor arbeitet an **einer Arbeitsfassung des Plans im Browser**, und erst „Speichern" schickt sie in einem Zug an den Server. Daraus fallen „Rückgängig", die Zählung der offenen Änderungen und die Nachfrage beim Verlassen ohne eigene Rechnung ab. Drei Punkte wurden dabei entschieden, die vorher offen waren:

- **Das Speichern läuft als eine nicht teilbare Datenbank-Operation**, über eine neue Datenbank-Funktion. Anders als beim „Lockern" sind alle Segmente betroffen, ein Abbruch in der Mitte würde den ganzen Plan leer zurücklassen. Nebeneffekt: der neue Weg hat **BUG-16** von Anfang an nicht — am bestehenden „Einheit speichern" bleibt der Fehler offen
- **Hinweis auf fremde Änderungen: ja** (die offene Frage zu Edge Case 4). Der Änderungsstempel der Einheit existiert schon und wird von selbst nachgezogen; das Speichern bringt ihn mit und fragt bei Abweichung nach, statt stillschweigend zu überschreiben
- **Die Kandidaten eines Segments werden einmal geladen und behalten.** Danach sind Würfeln, Auswahldialog und Variantenwechsel ohne Wartezeit. Welche Kriterien eine Übung verfehlt, rechnet weiter der Server aus derselben Kriterienliste des Generators — die Filterregeln bleiben an einer Stelle

**Keine neuen Pakete.** Hoch/Runter statt Ziehen-und-Ablegen nimmt den einzigen Grund dafür weg. An der Datenbank ändert sich nur **ein** Merkmal an der Übung („noch zu ergänzen" für das Schnell-Anlegen, eine Erweiterung an PROJ-3) plus die Funktion fürs Speichern.

**Die Oberfläche von PROJ-7 steht seit dem 2026-10-07** — Abschnitt „Implementation Notes (Frontend)" in der Spec. Gebaut in der Reihenfolge des Entwurfs: erst die Logik als reine Umformungen mit Tests, dann die Komponenten. **342 Unit-Tests grün** (249 aus PROJ-6 plus 93 neue), Typprüfung, Lint und Produktionsbuild sauber.

Drei neue Logikbausteine tragen den Editor, alle ohne Oberfläche und ohne Datenbank prüfbar: die **Arbeitsfassung** mit den sieben Operationen (`draft.ts`), der **Verlauf** für Rückgängig und Verwerfen (`draft-history.ts`) und die **Kandidatenfassung** mit Auswürfeln und Dialogaufteilung (`editor-pool.ts`). Die Arbeitsfassung trägt bewusst keine Segmentnamen und Minutenlängen — dass sie fehlen, setzt „das Zeitgerüst bleibt beim Generator" durch, statt es nur zu behaupten.

Zwei Dinge sind dabei schon abgeräumt:

- **BUG-5 ist behoben** — am Platzhalter „Übung gelöscht" stehen im Bearbeiten-Modus „Auswürfeln" und „Selbst wählen"
- **Die Lücken-Sperre ist weg** — der Speichern-Knopf ist nicht mehr ausgegraut, der Hinweis verweist auf „Bearbeiten" statt in den Generator zurück

**Am 2026-10-08 nach dem Test im Browser nachgeschärft** — alles Oberfläche, in der Spec nachgezogen:

- **Ein Hauptknopf in der Änderungsleiste** statt „Fertig" oben und „Speichern" in der Leiste: ohne Änderungen „Fertig", mit Änderungen „Speichern", und Speichern verlässt den Modus. Im Bearbeiten-Modus verschwinden „Bearbeiten", „Gespeichert", „Einheit speichern" und „Neu generieren" aus dem Kopf der Seite
- **Die Leiste passt auf 375 px** — Zählung in eigener Zeile, Knöpfe ohne Symbole
- **Der Hinweis zur Mindestdauer bleibt stehen** — er verschwand, sobald die Korrektur den Wert tatsächlich änderte
- **Schnell-Anlegen hat ein Feld „Arbeitsnotizen"** (optional) — das Backend muss es mit übernehmen
- **Der Hinweis auf gelockerte Kriterien** steht nur noch an ungespeicherten Einheiten

**Die Serverseite von PROJ-7 ist seit dem 2026-10-08 gebaut** — Abschnitt „Implementation Notes (Backend)" in der Spec. **375 Unit-Tests grün** (342 plus 33 neue), Typprüfung, Lint und Produktionsbuild sauber. Die drei Stellen des Vertrags sind angeschlossen: Kandidatenliste je Segment (`getEditorPool`), Speichern in einem Zug (`saveUnitPlan` über die Datenbank-Funktion `save_unit_plan`), Schnell-Anlegen (`quickCreateExercise`). Dazu die Erweiterung an PROJ-3: Markierung „noch zu ergänzen", Filter in der Übungsübersicht, Löschen der Markierung beim regulären Speichern.

Dabei mit abgeräumt: **BUG-16** (`saveUnit` und `renameUnit` melden jetzt, wenn das Update keine Zeile trifft) und **BUG-6** (der Verwendungszeitpunkt steht auf „gespeichert"). Offen bleibt aus BUG-16 nur, dass `generateUnit` Entwürfe kontoweit löscht — das ist die Regel „ein Entwurf je Nutzer" und damit eine Produktfrage.

**Migration angewendet und am lebenden System nachgewiesen (2026-10-08)** — Register 14 zu 14. Vierzehn Fälle in einer zurückgerollten Transaktion unter der Rolle `authenticated`: Speichern, Hinweis auf fremde Änderungen, Unteilbarkeit bei einem Fehler mitten im Plan, Verwendungsnachweise, fremde Einheit, fremde Übung, fehlende Anmeldung. Alle wie erwartet, nichts zurückgeblieben. `get_advisors` meldet weiter nur den bekannten Hinweis zum Passwortschutz.

**PROJ-7 ist am 2026-10-09 nach dem Test im Browser überarbeitet** (`/refine`) — acht Punkte, alle in der Spec, noch **nichts davon gebaut**. Was sich ändert:

- **Gespeichert wird nur noch ohne offene Lücke.** Jede freie Minute ist gefüllt oder als **geplante Lücke** erklärt; der Speichern-Dialog bietet „Alle als geplant übernehmen und speichern". Das dreht die Entscheidung vom 2026-10-06 um, die Lücken-Sperre ganz fallen zu lassen. Überfüllung sperrt weiter nicht
- **Varianten werden auf der Karte umgeschaltet**, über ein aufklappbares „Varianten (n)". Der Menüpunkt war gebaut, wurde aber nicht gefunden
- **Material, Organisationsform und Varianten stehen überall am selben Platz** — Stundenverlauf, Dialog „Übung einfügen", Übungsordner (Erweiterung an PROJ-3)
- **Organisationsform je Phase im Generator**, als weiches Kriterium, das beim Lockern als Erstes fällt (Erweiterung an PROJ-6, braucht eine Migration)
- **Das Auswürfeln gewichtet wie der Generator** — Hauptsportart doppelt, kürzlich Verwendetes zuletzt
- **„Arbeitsnotiz" heißt überall gleich**, mit einem Erklärtext und hellgrünem Feld; die Arbeitsnotiz der Übung erscheint im Stundenverlauf, abschaltbar über einen Schalter
- **Auswürfeln ohne Reaktion:** zwei stille Wege im Code belegt, dazu „Lockern" im Bearbeiten-Modus, das offene Änderungen ohne Nachfrage verwirft. Nachgestellt ist die Beobachtung nicht — `/qa` soll nach weiteren suchen
- **Kleineres:** ein Knopf „Übung einfügen" je Segment, Trennung nach der Bedienzeile statt davor

**Der Technikentwurf dazu steht seit dem 2026-10-09** — Abschnitt „Tech Design — Nachtrag zur Überarbeitung vom 2026-10-09" in der Spec. Die tragenden Entscheidungen:

- **Die geplante Lücke ist eine Zahl am Segment** („bis zu n freie Minuten sind geplant"). Werden später mehr Minuten frei, ist die Lücke von selbst wieder offen — ohne Logik, die der Erklärung nachläuft
- **Ein Speicherweg statt zwei.** „Einheit speichern" am Entwurf läuft über dieselbe Datenbank-Funktion wie der Editor, und die prüft die Lückenregel mit
- **Organisationsform in der einen Kriterienliste** des Generators, mit einer Lockerungsstufe mehr
- **Zwei gemeinsame Bausteine** tragen die Einheitlichkeit: die Übungszeile (Material · Organisationsform · Varianten) und die Arbeitsnotiz
- **Die Arbeitsfassung wird nicht mehr bei jedem Nachladen der Seite verworfen** — die Absicherung gegen das folgenlose Auswürfeln, auch für Ursachen, die noch nicht gefunden sind
- **Eine Migration**, rein hinzufügend: zwei Felder am Segment, neue Fassung der Speicher-Funktion. **Keine neuen Pakete**

**Die Oberfläche der Überarbeitung steht seit dem 2026-10-09** — Abschnitt „Implementation Notes (Frontend) — Überarbeitung vom 2026-10-09" in der Spec. **420 Unit-Tests grün** (375 plus 45 neue), Typprüfung, Lint und Produktionsbuild sauber; **im Browser noch nicht durchgespielt**. Zwei gemeinsame Bausteine tragen die Einheitlichkeit: die Übungszeile (`exercise-facts-row.tsx`) und die Arbeitsnotiz (`work-note.tsx`). Der Variantendialog ist entfernt.

Drei Dinge tragen erst mit der Migration aus `/backend`: die **geplante Lücke wird noch nicht gespeichert** (nach dem Neuladen wieder gelb), die **Organisationsform der Phase wirkt nur beim ersten Generieren**, und „Schnell anlegen" belegt sie noch nicht vor.

**Die Serverseite der Überarbeitung steht seit dem 2026-10-09** — Abschnitt „Implementation Notes (Backend) — Überarbeitung vom 2026-10-09" in der Spec. Migration `20261009150000_unit_planned_gaps_and_organization_forms.sql` angewendet, **Register 15 zu 15**. Die drei offenen Stellen der Oberfläche sind geschlossen: die geplante Lücke wird gespeichert und **in der Datenbank geprüft** (`open_gaps`), die Organisationsform der Phase wird abgelegt, „Schnell anlegen" belegt sie vor. Der alte Speicherweg `saveUnit` ist entfernt.

Am lebenden System in einer zurückgerollten Transaktion nachgewiesen, zehn Fälle: offene Lücke abgewiesen und nichts halb geschrieben, erklärte Lücke gespeichert, größere Lücke wieder offen, kleinere bleibt geplant, Überfüllung sperrt nicht, frei gelassenes Segment sperrt nicht. Nichts zurückgeblieben; `get_advisors` meldet weiter nur den bekannten Hinweis zum Passwortschutz.

**PROJ-7 ist seit dem 2026-10-09 in der QA — nicht bereit für die Auslieferung.** Abschnitt „QA Test Results" in der Spec. 110 von 115 Akzeptanzkriterien bestanden, keine Regression in PROJ-3, PROJ-5 und PROJ-6, kein neuer Sicherheitsbefund. 30 neue Browser-Tests für den Editor, je am Rechner und in Handybreite.

- **BUG-17 (hoch): die App zeigt nirgends eine Meldung an** — weder „gespeichert" noch Fehler. Elf Stellen im Code melden über die eine Bibliothek, im Seitengerüst ist die Anzeige der anderen eingebunden. Besteht seit PROJ-1, betrifft alle Features und ist auch in Produktion so. **Das ist die eigentliche Ursache des „Auswürfeln, nichts passiert"** — die Begründung wurde jedes Mal erzeugt und nie gezeigt. Alle fünf nicht bestandenen Kriterien hängen daran
- **BUG-18 (niedrig):** „Speichern" in der Nachfrage beim Verlassen speichert, wechselt die Seite aber nicht
- **BUG-20 (mittel, am 2026-10-09 vom Nutzer als Fehler bestätigt):** steht eine Variante im Platz, werden die übrigen Formen derselben Übung nicht gewürfelt — das Auswürfeln meldet „nichts mehr frei", obwohl eine Variante nie gezeigt wurde. Jede Variante ist eine vollwertige Übung; dass eine weggewürfelte Grundübung als Variante wiederkommt, ist dagegen richtig
- **BUG-19:** vom Nutzer am 2026-10-09 als „kein Fehler" geschlossen — eine gefüllte und wieder geleerte Lücke darf geplant bleiben

**BUG-17, BUG-18 und BUG-20 sind am 2026-10-09 behoben und nachgetestet: 156 von 156 Browser-Tests grün, 426 Unit-Tests grün. PROJ-7 ist damit freigegeben** — 115 von 115 Akzeptanzkriterien, kein offener Fehler. Die Meldungen erscheinen jetzt in der ganzen App zum ersten Mal; ob sie am Handy etwas verdecken, zeigt kein Test und sollte einmal von Hand angesehen werden. Die drei Fehlermeldungen (Speichern schlägt fehl, Liste lädt nicht, Verbindung bricht ab) laufen über dieselbe Anzeige, sind aber nicht eigens ausgelöst worden

Die Browser-Tests laufen auf diesem Rechner stabil mit `--workers=2` (rund 12 Minuten).

### Was vor und bei der Auslieferung von PROJ-7 zu tun ist

Geprüft am 2026-10-09, Browser-Tests zuletzt am 2026-10-10 gegen den Endstand: Build, Lint, 426 Unit-Tests und **158 von 158 Browser-Tests** grün; Register 15 zu 15
und in der Datenbank angewendet; keine Tabelle ohne Zugriffsschutz; keine Geheimnisse im
Repository; Testkonto aufgeräumt; keine neue Umgebungsvariable.

1. ~~**Von Hand ansehen:** eine Meldung am Handy~~ — am 2026-10-10 vom Nutzer angesehen und für gut befunden. Dabei gefunden und behoben: die **doppelte Nachfrage beim Verlassen** (BUG-21 — erst die App, dann noch einmal der Browser), das Signalrot der Meldung „Keine weitere passende Übung" (jetzt im Ton des Lückenhinweises) und das am Handy versteckte Kreuz zum Schließen
2. **Hochladen:** die Commits seit der Auslieferung von PROJ-6 liegen nur lokal. Vercel liefert beim Hochladen von `main` aus — das Hochladen **ist** die Auslieferung und gehört zu `/deploy`
3. **Die Migration ist schon in der Datenbank**, der Code kann jederzeit folgen. Die ausgelieferte Fassung (PROJ-6) benutzt weder die neuen Felder noch die Speicher-Funktion und läuft damit unverändert weiter
4. **Nicht prüfbar auf diesem Rechner:** Firefox und echtes Safari
6. **„Lockern" an einer Phase mit Organisationsform** hat der Nutzer am 2026-10-09 von Hand im Browser durchgespielt — läuft. Einen Browser-Test dazu gibt es nicht, nur die Logik-Tests
5. **Bekannte Abweichung, bewertet und hingenommen:** eine fremde Übung im Speicheraufruf wird als Platzhalter abgelegt statt den Aufruf abzuweisen; der fremde Verweis wird nie geschrieben

**Für später, kein Hindernis:** Supabase meldet zur Leistung 52 Richtlinien, die den angemeldeten Nutzer je Zeile neu auswerten, zwei Fremdschlüssel ohne Index und neun ungenutzte Indizes. Alles aus der Zeit vor PROJ-7, bei der heutigen Datenmenge ohne Wirkung — vor der Marktreife in einem Zug aufzuräumen.

**Nächster Schritt:** `/deploy PROJ-7`.

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-09-28 |
| PROJ-2 | Benutzerregistrierung & Login | P0 | PROJ-1 | Deployed | [Spec](PROJ-2-benutzerregistrierung-login.md) | 2026-09-28 |
| PROJ-3 | Übungsdatenbank (CRUD + Metadaten) | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-3-uebungsdatenbank.md) | 2026-09-28 |
| PROJ-4 | Starter-Datenbank (50–100 Übungen) | P0 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-5 | Gruppenprofile | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-5-gruppenprofile.md) | 2026-09-28 |
| PROJ-6 | Einheiten-Generator | P0 | PROJ-3, PROJ-5 | Deployed | [Spec](PROJ-6-einheiten-generator.md) | 2026-09-28 |
| PROJ-7 | Einheiten-Editor | P0 | PROJ-6 | Approved | [Spec](PROJ-7-einheiten-editor.md) | 2026-09-28 |
| PROJ-9 | Kalenderansicht & Langzeitplanung | P1 | PROJ-6, PROJ-7 | Roadmap | — | 2026-09-28 |
| PROJ-10 | Übungsrotation (Abwechslung über Wochen) | P1 | PROJ-6, PROJ-9 | Roadmap | — | 2026-09-28 |
| PROJ-11 | PWA (Homescreen-Installation) | P1 | None | Roadmap | — | 2026-09-28 |
| PROJ-12 | Community-Features (Übungen teilen) | P2 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-13 | Mehrsprachigkeit (i18n) | P2 | None | Roadmap | — | 2026-09-28 |
| PROJ-14 | Live-Modus (Stundenbegleitung) | P0 | PROJ-6, PROJ-7 | Roadmap | — | 2026-10-01 |
| PROJ-15 | Dokumenten-Upload (Gruppen & Hallen) | P1 | PROJ-5 | Roadmap | — | 2026-10-02 |
| PROJ-16 | Eigene Kategorien verwalten | P0 | PROJ-3 | Roadmap | — | 2026-10-04 |
| PROJ-17 | Stundenmuster (wiederverwendbare Einheiten-Konfigurationen) | P1 | PROJ-6 | Roadmap | — | 2026-10-04 |
| PROJ-18 | Dunkelmodus (Schalter oder Systemeinstellung folgen) | P2 | None | Roadmap | — | 2026-10-09 |

<!-- Add features above this line -->

## Next Available ID: PROJ-19

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
