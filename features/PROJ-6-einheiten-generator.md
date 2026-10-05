# PROJ-6: Einheiten-Generator

## Status: Deployed
**Created:** 2026-10-03
**Last Updated:** 2026-10-05
**QA:** 2026-10-05 (zwei Durchläufe, freigegeben im zweiten)
**Architected:** 2026-10-03
**Backend:** 2026-10-04 (überarbeitet 2026-10-05)
**E2E:** 2026-10-05 — Lauf 5 und 6: je **94 grün, 0 rot, 0 übersprungen** (Edge-Ersatzweg, ohne echtes WebKit)
**Deployed:** 2026-10-05 — https://stundenplaner-self.vercel.app, Tag `v1.5.0-PROJ-6`

## Ausgeliefert — Stand 2026-10-05

> **PROJ-6 ist in Produktion:** https://stundenplaner-self.vercel.app, Tag
> `v1.5.0-PROJ-6`. Die Einzelheiten der Auslieferung, der Härtung und der
> Nachprüfung stehen unten unter **Deployment**.

### In einem Satz

Der Generator ist fertig gebaut, **zweimal geprüft, freigegeben und
ausgeliefert**: kein kritischer, kein hoher, kein mittlerer Fehler am Produkt,
**94 E2E-Tests grün** (Lauf 5 und 6, 0 Fehlschläge) und **249 Unit-Tests grün**.

### Was noch offen ist

| Offen | Wo es hingehört |
|---|---|
| **BUG-16** — ein Speichern ohne getroffene Zeile meldet Erfolg (`units.ts:578`) | `/backend` |
| **Schutz gegen geleakte Passwörter** — der vierte Supabase-Hinweis, nur im Dashboard einschaltbar | Nutzer, einmalig |
| **Einmal in der Produktion anmelden** und eine Einheit generieren — der letzte Schritt, den keine automatische Prüfung ersetzt | Nutzer, einmalig |
| **Prüfung in echtem WebKit** — die Ordner-Ausnahme muss in **Avast** stehen, nicht im Windows-Sicherheitscenter | Nutzer, einmalig |
| **Die 40 Testübungen** in der Datenbank — Rohmasse für PROJ-4, erst übernehmen, dann löschen | PROJ-4 |
| **Lighthouse-Wert** nicht erhoben | offen |

Erledigt in `/deploy`: **BUG-9**, die Sicherheits-Kopfzeilen (fehlten in
PROJ-1 bis PROJ-5 durchgehend) und **drei der vier** Supabase-Hinweise.

Die Suite läuft bis zur Virenschutz-Ausnahme über den Edge-Ersatzweg und prüft
dabei **auch die Mobilbreiten** — in einem Chromium-Motor statt in WebKit:

```
PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npm run test:e2e
```

### Wie die Suite grün wurde

**Lauf 3 stand bei 79 / 7 / 8, Lauf 5 und 6 stehen bei 94 / 0 / 0.** Drei Befunde liegen dazwischen, und zwei davon widerlegen eine Annahme der früheren Durchläufe:

1. **Ein hängender Installationsprozess**, nicht die Nebenläufigkeit, trug den Großteil der Last. Ein `npx playwright install chromium` von 09:52 Uhr lief während Lauf 3 noch — und acht Stunden später unverändert weiter. Nach dem Beenden fielen fünf der sechs Zeitüberschreitungen weg, ohne eine geänderte Testzeile
2. **BUG-14** — die Zusicherung `getByText('Gespeichert')` traf auch „Noch nicht **gespeichert**". Sie war damit immer erfüllt, am sichersten bei fehlgeschlagenem Speichern. Die Begründung, mit der der instabile Test bisher nicht als Produktfehler geführt wurde, trägt damit nicht
3. **BUG-15** — die Zusicherungen hatten 5 Sekunden, der Test 120. Der letzte Fehlschlag brauchte 16,9 Sekunden und war danach grün

Alle drei Änderungen betreffen ausschließlich `tests/` und `playwright.config.ts` — **kein Produktcode**.

### Fehlerstand

**Am Produkt** — 0 kritisch, 0 hoch, 0 mittel, **7 niedrig offen** (2 behoben):

| Fehler | Schwere | Stand |
|---|---|---|
| BUG-1 Gruppe löschen vernichtet Einheiten ohne Warnung | Hoch | ✅ behoben und nachgeprüft, 7 Tests |
| BUG-2 Entwürfe in der Löschwarnung für Übungen | Niedrig | ✅ behoben, im Code belegt |
| BUG-3 Keine Warnung beim Verlassen der Konfigurationsseite | Niedrig | offen — Edge Case 13 der Spec, schlicht nicht umgesetzt |
| BUG-4 Zugriffsschutz prüft Eigentum an Gruppe und Übung nicht | Niedrig | offen — Härtung, vor PROJ-7 sinnvoll |
| BUG-5 Platzhalter ohne Nachbesetzen | Niedrig | offen — gehört inhaltlich zu PROJ-7 |
| BUG-6 Verwendungszeitpunkt steht auf „generiert" | Niedrig | offen |
| BUG-7 Verlassener Entwurf nicht mehr auffindbar | Niedrig | offen |
| BUG-9 Lockern wird in einer Sackgasse angeboten | Niedrig | ✅ **behoben am 2026-10-05** in `/deploy` — `no-phase` gibt jetzt `false` |
| BUG-16 Ein Speichern ohne getroffene Zeile meldet Erfolg | Niedrig | **neu** — `units.ts:578`, gehört zu `/backend` |

**An der Teststrecke** — blockiert die Freigabe nicht, aber `/deploy`:

| Fehler | Schwere | Stand |
|---|---|---|
| BUG-8 E2E-Suite nie vollständig gelaufen | Niedrig | ✅ Suite lief erstmals zu Ende |
| BUG-10 E2E-Tests aus PROJ-3 und PROJ-5 veraltet | Mittel | ✅ **behoben** — 9 Tests nachgezogen |
| BUG-11 „Mobile Safari" verlangt WebKit | Niedrig | ✅ **behoben** — Ersatzweg zieht jetzt den Browsertyp mit |
| BUG-12 PROJ-6-Test stört sich mit Nebenläufigkeit | Niedrig | ✅ **behoben** — Grundbestand zentral, Löschen zielgenau |
| BUG-13 Umbenennen-Test sucht „Umbenennen" statt „Speichern" | Niedrig | ✅ **behoben** — von BUG-12 verdeckt gewesen |
| BUG-14 „Gespeichert" war eine Tautologie, keine Prüfung | Mittel | ✅ **behoben** — fünf Zusicherungen auf `exact`, dazu eine Bestandsprüfung |
| BUG-15 Zusicherungen hatten 5 Sekunden, der Test 120 | Niedrig | ✅ **behoben** — `expect: { timeout: 15_000 }` |

### Die eine Sache, die der Nutzer selbst tun muss

Drei Durchläufe haben drei verschiedene Ursachen aufgedeckt, und die dritte erklärt, warum die Abhilfe der ersten beiden nicht gewirkt hat.

1. **Eine Sperre im Browser-Ordner.** `%LOCALAPPDATA%\ms-playwright\__dirlock` blockiert jedes weitere `npx playwright install` — **getarnt als Erfolg, mit Rückgabewert 0 und ohne eine Zeile Ausgabe.** Am 2026-10-05 lag sie zweimal: zuerst als liegengebliebene Datei vom 01:14 Uhr, dann **gehalten von einem lebenden Prozess**. Ein `npx playwright install chromium` von 09:52 Uhr hing zu diesem Zeitpunkt noch — **acht Stunden**, unverändert bei denselben drei Dateien. Prozessbaum beendet, Sperre entfernt
2. **Der Download war nie das Problem.** Ohne Sperre lädt er in gut zwei Minuten vollständig: 172,8 MiB, 100 %. Die „abgebrochenen Downloads" der früheren Durchläufe waren Downloads, die nie anfingen
3. **Das Entpacken bleibt stehen** — reproduzierbar bei denselben drei Dateien (4,7 MB von 172,8 MiB), während die großen Binärdateien dahinter gescannt werden. **Das bleibt zu tun.**

**Und hier liegt der Grund, warum eine schon eingetragene Ausnahme nichts bewirkt hätte:** Der Echtzeitschutz dieses Rechners ist **nicht Windows Defender**. Installiert sind drei Schutzprogramme — Defender, **Avast** und McAfee. `Get-MpPreference` scheitert mit `0x800106ba` (der Defender-Dienst läuft nicht), und im Sicherheitscenter steht Avast als der aktive Scanner. Eine Ordner-Ausnahme im Windows-Sicherheitscenter landet damit bei einem **abgeschalteten** Scanner.

**Abhilfe (einmalig, etwa eine Minute):**

1. In **Avast** → Menü → Einstellungen → Allgemein → **Blockierte & zugelassene Apps** bzw. **Ausnahmen** → Ordner hinzufügen: `C:\Users\goryg\AppData\Local\ms-playwright`
2. Falls McAfee ebenfalls scannt, dort dasselbe
3. `npx playwright install` — **ohne** `chromium`, damit WebKit mitkommt
4. Danach reicht ein schlichtes `npm run test:e2e`

> Endet `npx playwright install` ohne Ausgabe und ohne Fehler, ist es wieder
> Ursache 1. Dann erst nachsehen, ob noch ein Installationsprozess läuft
> (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`), ihn beenden,
> dann `rm -rf "$LOCALAPPDATA/ms-playwright/__dirlock"` und neu versuchen.
> Bleibt das Entpacken bei wenigen Megabyte stehen, greift die Ausnahme nicht.

Solange der gebündelte Chromium fehlt, läuft die Suite ersatzweise über Edge:

```
PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npm run test:e2e
```

`PLAYWRIGHT_PORT` ist nötig, falls auf 3000 bereits ein Entwicklungsserver läuft — der würde sonst weiterverwendet und die Umstellung auf den Produktionsbuild wäre wirkungslos.

**Dieser Ersatzweg trägt inzwischen die ganze Suite.** Seit BUG-11 behoben ist, zieht auch das Projekt „Mobile Safari" den Browsertyp mit und läuft in einem Chromium-Motor statt in WebKit — weniger aussagekräftig als echtes Safari, aber die Mobilbreiten werden geprüft. Was der Ausnahme noch fehlt, ist allein die Prüfung in **echtem WebKit**.

### Was danach ansteht

1. **PROJ-16** — eigene Kategorien zentral verwalten. Phasen anlegen funktioniert bereits, nur das Verwalten fehlt
2. **PROJ-17** — Stundenmuster, wartet auf `/write-spec`. Beim Schreiben zu klären: Gehört ein Muster zu einer Gruppe oder gilt es übergreifend? Was passiert mit einer Einheit, wenn das Muster später geändert wird? Was, wenn die Einheitsdauer der Gruppe nicht zur Musterlänge passt?
3. **PROJ-7** — der Editor. `manuallyEdited` liegt bereit und wird von niemandem gesetzt, weil es genau dort gesetzt wird. BUG-5 gehört dorthin

### Zwei Dinge, die vor der Marktreife weg müssen

- **Die 40 Testübungen** stecken noch in der Datenbank (von 45 Übungen insgesamt), markiert mit `Testdaten (PROJ-6)`, und 12 Einheiten hängen an ihnen. Ihr Inhalt ist die Rohmasse für PROJ-4 — also erst übernehmen, dann löschen
- **Vier vorbestehende Supabase-Hinweise**: `handle_new_user` und `update_updated_at` ohne gesetzten `search_path`, `handle_new_user` als `SECURITY DEFINER` für `anon` aufrufbar, und die abgeschaltete Prüfung auf geleakte Passwörter. Nichts davon stammt aus PROJ-6, gehört aber in `/deploy`

### Prüfbefehle

```
npm test              # 249 Tests, Einheiten- und Komponententests
npm run test:pruefplan # 15 Prüffälle gegen die echten Übungsdaten
npm run build         # Produktionsbuild
npm run lint          # 0 Fehler, 4 vorbestehende <img>-Warnungen aus PROJ-3
npm run test:e2e      # 94 Testausführungen, 10,0 Min (Edge-Ersatzweg, siehe oben)
```

Stand des letzten E2E-Durchlaufs (Lauf 5, über Edge): **94 grün, 0 rot, 0
übersprungen in 10,0 Minuten.** Der Weg dorthin steht unter „Wie aus 7
Fehlschlägen 0 wurden"; alle Behebungen betrafen ausschließlich `tests/` und
`playwright.config.ts`. Ungeprüft bleibt allein **echtes WebKit**.

---

### Implementation Notes (Frontend)

**Reine Logik, getrennt von der Oberfläche**
- `src/lib/types/unit.ts` — Typen und Konstanten (`SegmentConfig`, `Unit`, `UnitSegment`, `UnitItem`, `UnitSummary`, `CLASSIC_DISTRIBUTION`, `MIN_SEGMENT_MINUTES`)
- `src/lib/units/timeline.ts` — die gesamte Zeitverlauf-Mathematik als reine Funktionen: `layoutToMinutes`, `minutesToLayout`, `distributeRemainder`, `buildClassicSegments`, `addSegment`, `removeSegment`, `setSegmentMinutes`, `reorderSegments`, `rescaleSegments`
- `src/lib/units/timeline.test.ts` — **27 Tests**, die vor allem die zentrale Invariante absichern: die Summe der Segmente entspricht immer exakt der Einheitsdauer, auch bei krummen Werten, beim Hinzufügen, Entfernen, Begrenzen und Skalieren
- `src/lib/validations/unit.ts` — Zod-Schemas. Bewusst **ohne** die Regel „mindestens ein Segment muss gefüllt werden", weil Edge Case 9 der Spec ein komplett leeres Gerüst ausdrücklich erlaubt

**Komponenten** (`src/components/units/`)
- `unit-config-form.tsx` — die zwei Blöcke (Gruppe, Aufbau), Zeitverlauf und Absenden; hält Standardvorlage und individuellen Stand getrennt, damit der Bearbeitungsstand beim Modus-Wechsel erhalten bleibt
- `segment-timeline.tsx` — der Zeitverlauf auf shadcn `Resizable`, dazu Umsortieren per Ziehen
- `segment-editor.tsx` — Einstellungen pro Segment (Phase, Minuten, füllen/frei, Sportarten, Schwierigkeit, verschieben, entfernen)
- `phase-select.tsx` — Einzelauswahl mit eigenen Phasen (die bestehende MultiSelect ist mehrfachauswahl und passte nicht)
- `group-summary.tsx` — zeigt transparent, was der Generator aus dem Profil zieht
- `unit-plan-view.tsx`, `unit-item-card.tsx`, `gap-notice.tsx` — Ergebnisdarstellung
- `unit-list.tsx`, `unit-generator-empty-state.tsx` — Listen und Leerzustände

**Seiten**
- `(protected)/units/new` — Konfigurationsseite, nimmt `?group=<id>` zur Vorauswahl
- `(protected)/units/[id]` — Stundenverlauf
- `(protected)/units` — Übersicht aller Einheiten (Ziel des neuen Navigationspunkts)

**Integration in Bestehendes**
- Kopfnavigation um „Einheiten" ergänzt
- Dashboard-Karte „Einheiten-Generator" aktiviert (war ausgegraut mit „Demnächst verfügbar")
- Gruppen-Detailseite: Button „Einheit generieren" im Kopf und neuer Abschnitt „Einheiten" mit Liste und eigenem Leerzustand; `GroupDetail` bekommt dafür ein `units`-Prop
- Bei der Gelegenheit entfernt: ein ungenutzter `WEEKDAY_SHORT`-Import in `group-detail.tsx`

**Wiederverwendet statt neu gebaut**
- `MultiSelect` aus PROJ-3 für Sportarten und Schwierigkeitsgrade. Die Sportarten der Gruppe werden vorne in die Optionsliste sortiert und sind vorausgewählt; `allowCustom` ist hier bewusst **aus**, weil eine frei erfundene Sportart zu keiner Übung passen und nur eine leere Lücke erzeugen würde
- `getGroups`, `getGroup`, `getCustomCategories`, `getExercises` (nur für die Gesamtzahl) — keine neuen Leseabfragen nötig
- `date-fns` mit deutschem Gebietsschema für die Datumsanzeige

**Abhängigkeit: Versionskorrektur gegenüber dem Tech Design**
`npx shadcn@latest add resizable` installierte `react-resizable-panels` 4.14.2. Version 4 ist ein vollständiger API-Umbau (`Group`/`Separator` statt `PanelGroup`/`PanelResizeHandle`), gegen den die shadcn-Vorlage nicht kompiliert. Die Abhängigkeit ist deshalb auf **`^3.0.6`** festgelegt — die Hauptversion, für die die shadcn-Komponente geschrieben ist. Damit bleibt `src/components/ui/resizable.tsx` unverändert, es gibt keinen eigenen Wrapper zu pflegen, und die Architektur-Entscheidung „shadcn statt Eigenentwicklung" hält.

**Nutzerbildung direkt eingebaut**
Statt die Hinweise auf ein späteres Hilfe-Feature zu verschieben, stehen sie an der Stelle, wo sie wirken:
- `group-summary.tsx` warnt, wenn die Gruppe nur **eine** Sportart getaggt hat, wenn **keine Halle** zugewiesen ist (Material wird dann nicht geprüft) und wenn bei vorhandener Halle die **Teilnehmerzahl** fehlt (Material „pro Teilnehmer" nicht prüfbar)
- `gap-notice.tsx` nennt den Lückengrund und wiederholt den Sportart-Hinweis
- `phase-select.tsx` erklärt beim Anlegen einer eigenen Phase, dass es dafür noch keine Übungen gibt

**Noch nicht angebunden** _(erledigt am 2026-10-04, siehe Implementation Notes (Backend))_
`src/lib/actions/units.ts` enthielt zunächst nur die endgültigen Signaturen mit leeren Ergebnissen. Die vier Tabellen und der Auswahlalgorithmus sind seit dem Backend-Schritt angebunden; an den Signaturen und damit an der Oberfläche musste dafür nichts geändert werden.

**Testdaten für die manuelle Prüfung (2026-10-03)**
40 kuratierte Übungen wurden direkt in die Übungsdatenbank des Nutzers eingefügt, zugeschnitten auf seine beiden realen Gruppenprofile — markiert mit `Testdaten (PROJ-6)` in den Arbeitsnotizen und damit in einem Zug wieder löschbar. Dazu 36 Materialzeilen und 6 Varianten. Bewusst eingebaute Prüffälle: Material das in der jeweiligen Halle fehlt, Material „pro Teilnehmer" in zu großer Menge, Übungen mit zu niedriger Teilnehmer-Obergrenze, Übungen ganz ohne Material, sehr kurze Cool-Down-Übungen (3–5 Min), und drei Varianten die eine ausgeschlossene Hauptübung über abweichendes Material oder abweichende Teilnehmerzahl wieder verfügbar machen. Nachgerechnet ergibt das pro Gruppe und Phase 5–6 verwendbare Übungen bei drei- bis vierfachem Minutenbudget — genug, damit Rotation und Frische-Regel sichtbar werden.

Nicht als Starter-Datenbank zu verwechseln: PROJ-4 sieht einen **separaten Referenzbestand** vor, aus dem der Nutzer Übungen übernimmt. Diese 40 gehören dem Nutzeraccount wie selbst angelegte. Der Inhalt ist aber die Rohmasse für PROJ-4.

**Nacharbeiten nach dem ersten Praxisblick (2026-10-03)**
Nach einer Durchsicht in der Geräte-Emulation bei 375 px wurden folgende Punkte korrigiert, teils über PROJ-6 hinaus:

| Änderung | Betroffen |
|---|---|
| Kopfnavigation auch auf dem Handy dauerhaft sichtbar und oben angeheftet; der Schriftzug „Stundenplaner" wird dort zum Haus-Symbol, damit Platz für die drei Navigationspunkte bleibt | `(protected)/layout.tsx` |
| Fokus-Rahmen von Eingabefeldern wird **innerhalb** des Feldes gezeichnet (`ring-inset`) statt außerhalb. Der erste Versuch, nur den Außenabstand zu entfernen (`ring-offset-0`), reichte nicht — der Rahmen selbst liegt bei Tailwind als Schlagschatten weiterhin außerhalb der Elementkante und stand damit weiter über | `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx`, Auslöser der `MultiSelect`. Kleine Bedienelemente (Switch, Checkbox, Radio) bleiben unverändert, dort trennt der Außenabstand sinnvoll ab |
| Aktionsbuttons stapeln sich auf dem Handy untereinander statt nebeneinander über den Rand hinauszuragen | Gruppenübersicht, Gruppen-Detailseite, Übungs-Detailseite |
| Kopfbereich der Detailseiten läuft auf dem Handy komplett untereinander. Vorher teilten sich Titelblock und Buttonleiste die Breite, wodurch die Überschrift auf drei Zeilen umbrach und die Sportart-Tags einzeln untereinander standen | `group-detail.tsx`, `exercise-detail.tsx` |
| Werkzeugleiste der Übungsübersicht umbrechend, Sortier-Auswahl nicht mehr auf feste 200 px gesetzt. Die feste Breite drückte den „Neue Übung"-Button auf schmalen Bildschirmen über den rechten Rand | `exercise-toolbar.tsx` |
| Sportart-Tags in der Übungsliste nicht mehr auf drei gekürzt, Abstände gestrafft | `exercise-list-view.tsx` |
| „Neue Übung" auf dem Handy als quadratische Schaltfläche mit mittigem Zeichen. Der Außenabstand des Symbols blieb vorher stehen, obwohl die Beschriftung ausgeblendet war | `exercise-toolbar.tsx` |
| Die Wiederholung der Gruppendaten auf der Konfigurationsseite entfernt — sie stand direkt neben dem Gruppenprofil, aus dem sie stammt. Die drei erklärenden Hinweise daraus bleiben als eigenständige Komponente erhalten und erscheinen nur, wenn am Profil etwas fehlt | `group-hints.tsx` ersetzt `group-summary.tsx` |
| Zurück-Link „Alle Einheiten" auf der Konfigurationsseite, im gleichen Muster wie auf den Detailseiten | `units/new/page.tsx` |
| Abschluss des Ziehens abgesichert: Verliert der Browser die Zeigererfassung, wird die Umsortierung trotzdem übernommen statt still verloren zu gehen | `segment-timeline.tsx` |
| „Zurück" im Übungs-Wizard auf Schritt 1 gar nicht mehr angezeigt statt nur deaktiviert | `exercise-wizard.tsx` |
| Formulierungen im Generator geschärft: „Volle X Minuten werden mit Übungen ausgefüllt", und „frei bleiben **können**" | `unit-config-form.tsx` |

**Verifikation**
- `npx tsc --noEmit` — fehlerfrei
- `npm run build` — erfolgreich, Routen `/units`, `/units/[id]`, `/units/new` registriert
- `npm test` — 122 Tests grün (95 bestehende ohne Regression + 27 neue)
- `/units` und `/units/new` leiten nicht eingeloggte Nutzer mit 307 auf `/login`
- **Nicht automatisiert geprüft:** die Bedienung hinter dem Login (Zeitverlauf ziehen, Segmente bearbeiten, Gruppenauswahl) — dafür fehlen Zugangsdaten, das braucht eine manuelle Durchsicht im Browser
- **Vorbestehender Mangel, nicht angefasst:** `npm run lint` schlägt fehl. `next lint` ist in Next 16 entfernt, und das Projekt hat noch eine `.eslintrc.json` im Altformat, während ESLint 9 eine `eslint.config.js` erwartet. Das betrifft das ganze Projekt, nicht nur PROJ-6

### Implementation Notes (Backend)

**Vier Tabellen, Migration im Repository**
`supabase/migrations/20261004140000_create_units_tables.sql` legt `units`, `unit_segments`, `unit_items` und `exercise_usages` an — mit Zugriffsschutz auf allen vier, Indizes auf den Abfragepfaden und dem bestehenden `updated_at`-Auslöser auf `units`. Die Datei ist zugleich ausgeführt und als Migration abgelegt, wie es `supabase/migrations/README.md` verlangt.

Drei Entscheidungen an den Fremdschlüsseln tragen Spec-Verhalten:

| Verweis | Verhalten beim Löschen | Warum |
|---|---|---|
| `unit_items.exercise_id` → `exercises` | **SET NULL** | Wird eine Übung gelöscht, bleibt der Eintrag als Platzhalter „Übung gelöscht" stehen. Mit CASCADE würde die Einheit stillschweigend kürzer |
| `unit_items.variant_id` → `exercise_variants` | **SET NULL** | Verschwindet nur die Variante, fällt der Eintrag auf die Hauptübung zurück statt ganz zu verschwinden |
| `exercise_usages.*` | CASCADE | Verwendungsnachweise sind reine Herleitung; ohne Übung, Gruppe oder Einheit haben sie keine Aussage |

**Der Generator als reine Logik**
- `src/lib/units/candidates.ts` — die **eine** Stelle, an der die effektiven Daten einer Variante berechnet werden. `effectiveMaterials` setzt die Regel „Variantenmaterial **ersetzt**" um, `buildCandidates` baut aus Hauptübungen und Varianten einen flachen Pool. Hauptübung und ihre Varianten tragen dieselbe `exerciseId` — darüber schließen sie sich gegenseitig aus, ohne dass der Auswahlcode davon wissen muss
- `src/lib/units/generator.ts` — der Auswahlalgorithmus. Keine Datenbank, keine Systemzeit, keine eigene Zufallsquelle: der Startwert kommt herein, `createRandom` (mulberry32) macht daraus eine reproduzierbare Folge
- `src/lib/units/generator.test.ts` — **54 Tests**, `src/lib/units/candidates.test.ts` — **13 Tests**

**Füllregel: die Dauergrenzen entscheiden, wann ein Segment voll ist**
Die Spec sagt „bis das Minutenbudget etwa erreicht ist" und „maximal ±25 % pro Übung". Beides zusammengenommen ergibt eine exakte Regel, die ohne Schätzwerte auskommt: Eine Übung wird nur aufgenommen, wenn die Summe der **Untergrenzen** (je `ceil(Dauer × 0,75)`) noch ins Budget passt. Gefüllt ist das Segment, sobald die Summe der **Obergrenzen** (je `floor(Dauer × 1,25)`) das Budget erreicht — dann lässt es sich durch Strecken genau ausfüllen.

Damit ergeben sich die Beispiele der Spec von selbst: 12 Minuten Budget und eine auf 10 Minuten geschätzte Übung → eine Übung mit 12 Minuten Plandauer. 36 Minuten und 15-Minuten-Übungen → zwei Übungen mit je 18. 12 Minuten und 3-Minuten-Übungen → vier Übungen mit je 3. Und 4 Minuten Budget bei kürzester Übung 20 Minuten → Lücke, weil schon die Untergrenze nicht passt.

`planDurations` verteilt die Restdifferenz minutenweise und immer dort, wo noch der größte Spielraum ist. Die Summe der Plandauern überschreitet das Budget nie.

**Frische vor Rotation — eine Festlegung, die die Spec offen ließ**
Die Spec führt Sportart-Rotation als Schritt 1 und die Frische-Regel als Schritt 2 auf. Das liest sich wie eine Rangfolge, ergibt als solche aber das schlechtere Verhalten: Eine kürzlich verwendete Übung der gezogenen Sportart würde eine frische Übung einer anderen gewählten Sportart verdrängen — genau das, was die Frische-Regel verhindern soll.

Umgesetzt ist deshalb: **Frische ordnet zuerst, die gezogene Sportart ordnet innerhalb gleicher Frische.** Die Rotation wirkt damit unverändert, solange frische Übungen da sind, und die Abwechslung über Wochen bleibt das stärkere Versprechen. Die Akzeptanzkriterien zu beiden Regeln bleiben erfüllt.

Zusätzlich: Die gezogene Sportart ist eine **Vorliebe, kein Ausschluss**. Gibt es für sie keine passende Übung, nimmt der Generator eine andere gewählte Sportart, statt eine Lücke zu lassen. Und ein neuer Rotationszyklus beginnt nicht mit derselben Sportart, mit der der vorige endete — bei zwei Sportarten und drei Übungen ergibt das A, B, A statt A, B, B.

**Lockern: nur wo nötig, stufenweise**
Jedes Segment wird zuerst streng gefüllt. Bleibt dabei eine Lücke und hat der Nutzer auf „Mit gelockerten Kriterien erneut versuchen" geklickt, wird **nur für dieses Segment** zuerst der Schwierigkeitsgrad freigegeben, danach die Sportart-Vorgabe. Eine höhere Stufe gilt nur, wenn sie die Lücke tatsächlich verkleinert — sonst bleibt die strenge Auswahl stehen. Segmente, die streng gefüllt werden konnten, bleiben unberührt.

Material und Altersgruppe bleiben in jeder Stufe hart. `relaxedNote` nennt pro Segment, was gelockert wurde und wie viele Übungen dadurch dazukamen: `„Hauptteil": Schwierigkeitsgrad gelockert — 2 Übungen ergänzt.`

Damit ein zweiter Versuch die Auswahl der folgenden Segmente nicht verschiebt, bekommt jeder Versuch einen eigenen, aus dem Startwert abgeleiteten Zufallsstrom (`seed + Segmentindex × 1013 + Stufe × 7919`).

**Lückengründe in Alltagssprache**
Der Pool wird in fester Reihenfolge gefiltert — Phase, Altersgruppe, Material, Teilnehmerzahl, Sportart, Schwierigkeitsgrad — und die Stufe, die ihn leert, benennt den Grund. Die harten Kriterien stehen vorn, damit der Hinweis zuerst das nennt, woran Lockern nichts ändern würde. Bleibt der Pool gefüllt und die Lücke trotzdem, unterscheidet der Grund zwischen „alle passenden Übungen sind in dieser Einheit schon eingeplant" und „die restlichen N Minuten sind kürzer als die kürzeste noch passende Übung (M Minuten)". Der Grund wird am Segment **gespeichert**, nicht nur angezeigt.

**Server Actions** (`src/lib/actions/units.ts`)

| Aktion | Was sie tut |
|---|---|
| `generateUnit` | Prüft Anmeldung, validiert die Konfiguration mit Zod, holt die Gruppe über `getGroup` (damit ist die Zugehörigkeit serverseitig geprüft), lädt Pool und Frische-Daten, rechnet den Plan im Speicher, legt dann Einheit, Segmente, Einträge und Verwendungsnachweise an |
| `regenerateUnit` | Liest die gespeicherte Zeitverlauf-Konfiguration zurück, rechnet mit **neuem Startwert** einen neuen Plan und ersetzt den Inhalt desselben Datensatzes. Die Einheit selbst bleibt bei der Frische-Regel außen vor — sonst würde sie sich ihre eigene Auswahl verbieten |
| `getUnit` | Einheit mit Segmenten, Einträgen und den **verwiesenen** Übungen. Die Variantenauflösung läuft über dieselbe `buildCandidates`-Stelle wie im Generator |
| `getUnits`, `getUnitsForGroup` | Listen mit Übungsanzahl, neueste zuerst |
| `getUnitNamesUsingExercise` | Für die Löschwarnung bei einer Übung |

**Schreiben ohne halbe Ergebnisse**
Wie im Tech Design vorgesehen: Der Plan steht vollständig im Speicher, bevor geschrieben wird. Scheitert ein Schritt beim Anlegen, wird die eben erzeugte Einheit wieder gelöscht und die abhängigen Datensätze verschwinden über die Löschweitergabe mit. Der Nutzer bekommt „Generieren fehlgeschlagen, bitte erneut versuchen." und behält seine Konfiguration.

Beim Neu-Generieren lässt sich das nicht ganz so sauber halten: Dort wird der alte Inhalt ersetzt, und ein Fehlschlag mitten im Schreiben kann eine unvollständige Einheit hinterlassen. Bewusst in Kauf genommen, weil ein erneuter Klick auf „Neu generieren" den Zustand wieder geraderückt und die Alternative — eine Datenbankfunktion — nach demselben Maßstab wie im Tech Design zusätzliche Komplexität ohne erkennbaren Gewinn wäre.

**Serverseitige Prüfungen**
- Anmeldung bei jeder Aktion
- Gruppenzugehörigkeit über `getGroup` (filtert auf `user_id`), nicht über das Formularfeld
- Einheitszugehörigkeit bei `regenerateUnit` über `user_id`
- `unitConfigSchema`: mindestens ein Segment, Segmentdauer mindestens 1 Minute, mindestens eine Sportart je Segment, Hauptsportart muss unter den Sportarten sein, Summe der Segmente gleich der Einheitsdauer
- Zusätzlich: die Einheitsdauer muss der des Gruppenprofils entsprechen. Hat der Nutzer sie in einem anderen Tab geändert, kommt ein verständlicher Hinweis statt einer Einheit mit falscher Gesamtdauer
- Die Übungen stammen ausschließlich aus dem serverseitig geladenen Pool des angemeldeten Nutzers — eine fremde Übungskennung kann gar nicht in eine Einheit geraten

**Name der Einheit**
`Gruppenname – 4. Okt. 2026`. Bei mehreren Einheiten derselben Gruppe am selben Tag wird ein Zähler angehängt (`… (2)`), damit die Liste unterscheidbar bleibt.

**Eigene Phasen werden beim Generieren gesichert**
Eine im Zeitverlauf frisch angelegte Phase existierte bisher nur im Formular. Beim Generieren landet sie jetzt in `custom_categories` — gleiches Muster wie bei Übungen und Gruppen. Edge Case 3 bleibt davon unberührt: Das Segment bleibt leer, weil keine Übung dieses Phasen-Tag trägt, und der Grund sagt genau das.

**Nacharbeit in PROJ-3: Varianten brauchen stabile Kennungen**
Beim Bauen des Einheiten-Eintrags fiel ein Fehler in PROJ-3 auf, der PROJ-6 direkt untergraben hätte: `updateExercise` löschte alle Varianten einer Übung und legte sie neu an. Die Kennungen änderten sich damit bei **jeder** Bearbeitung — auch beim Korrigieren eines Tippfehlers im Namen. Ein `unit_items.variant_id` hätte danach auf nichts mehr gezeigt und die eingeplante Variante wäre über `ON DELETE SET NULL` aus allen Einheiten gefallen. Das widerspricht der Zusage „Verweis statt Kopie".

`syncVariants` in `src/lib/actions/exercises.ts` schreibt Varianten jetzt an ihrer Kennung fort: vorhandene werden aktualisiert, entfernte gelöscht, neue angelegt. Material und Links bleiben beim bisherigen Löschen-und-neu-Anlegen, weil nichts auf sie verweist.

**Löschwarnung mit Namen** (Akzeptanzkriterium aus PROJ-6)
`src/components/exercises/exercise-usage-warning.tsx` lädt beim Öffnen des Löschdialogs die Namen der betroffenen Einheiten nach und nennt sie: „Diese Übung wird in 2 Einheiten verwendet: … Dort bleibt an ihrer Stelle ein Platzhalter stehen, den du nachbesetzen kannst." Eingebaut in beide Löschwege — Übungsübersicht und Übungs-Detailseite.

**Datenbanktypen**
`src/lib/database.types.ts` um die vier Tabellen ergänzt. Verschachtelte Abfragen wie `select('*, groups(name)')` sind bewusst **nicht** verwendet: Die Typdatei führt keine Beziehungen, solche Abfragen würden den Typprüfer umgehen. Stattdessen mehrere flache Abfragen, die in JavaScript zusammengesetzt werden — dasselbe Muster wie in PROJ-3 und PROJ-5.

**Verifikation**
- `npx tsc --noEmit` — fehlerfrei
- `npm test` — **202 Tests grün** (135 bestehende ohne Regression + 54 Generator + 13 Varianten)
- `npm run build` — erfolgreich
- `npm run lint` — 0 Fehler, 4 vorbestehende Warnungen zu `<img>` in PROJ-3-Komponenten (unverändert)
- Supabase-Sicherheitsprüfung: **keine** Beanstandung an den vier neuen Tabellen. Die vier gemeldeten Warnungen sind vorbestehend und betreffen `handle_new_user`, `update_updated_at` (beide ohne gesetzten `search_path`) und die abgeschaltete Prüfung auf geleakte Passwörter — gehören in `/qa` bzw. `/deploy`, nicht in PROJ-6
- Fremdschlüssel **lesend** aus dem Systemkatalog geprüft (`pg_constraint.confdeltype`), ohne Probelauf mit Löschungen: `unit_items.exercise_id` und `unit_items.variant_id` stehen auf SET NULL, die übrigen zehn Verweise auf CASCADE. Die Platzhalter-Logik ist damit auf Datenbankebene abgesichert — offen bleibt nur ihre Darstellung in der Oberfläche
- `src/lib/database.types.ts` gegen das von Supabase erzeugte Schema abgeglichen: für alle vier neuen Tabellen deckungsgleich in Spalten, Typen und Pflichtfeldern
- **Nicht geprüft:** der Weg durch die Oberfläche hinter dem Login, und damit auch der Rundweg Schreiben → Lesen → Anzeigen durch die Server Actions. `generateUnit` hat noch nie eine Zeile geschrieben. Siehe „Übergabe an /qa" am Ende dieser Spec

### Änderungen aus dem ersten echten Test — 2026-10-04

Der Nutzer hat den Generator eingeloggt gegen seine beiden Gruppen laufen lassen. **Der Rundweg funktioniert:** `generateUnit` schreibt, `getUnit` liest, der Stundenverlauf wird samt gespeichertem Lückengrund dargestellt. Aus dem Test ergaben sich sieben Punkte.

| # | Rückmeldung | Umsetzung |
|---|---|---|
| 1 | Eigene Phasen aus dem Generator sollen anlegbar und zentral verwaltbar sein | Das Anlegen funktionierte bereits — „Hauptteil 2" stand nach dem Test in `custom_categories`, nach demselben Muster wie eigenes Material. Die **zentrale Verwaltung** gehört zu PROJ-16 und bleibt dort |
| 2 | Stundenmuster: gespeicherte Komplett-Konfigurationen, ladbar über „Auf Stundenmuster setzen", speicherbar über „Stundenmuster speichern", verwaltbar wie Hallen | **Ausgelagert nach PROJ-17.** In PROJ-6 stand das bereits als Out of Scope und als offene Frage; die Frage ist damit mit Ja beantwortet. Eigene Tabelle, eigene Verwaltungsseite und Buttons an drei Stellen gehören nicht nebenbei in den Backend-Schritt |
| 3 | Eine generierte Einheit soll erst auf Klick abgelegt werden; dazu ein Weg zurück in den Generator mit denselben Einstellungen | Umgesetzt (siehe unten) |
| 4 | Der Zurück-Button oben links zur Gruppe soll weg | Ersetzt durch „Zurück zum Generator" |
| 5 | Lockern soll nur das Segment betreffen, in dem geklickt wurde | Umgesetzt über die neue Aktion `relaxSegment` |
| 6 | Der Lückengrund war nicht klar genug — jede mögliche Ursache soll kurz benannt werden, auch beim erfolglosen Lockern | Umgesetzt (siehe unten) |
| 7 | „Übung anlegen" aus dem Lückenhinweis entfernen | Entfernt. Das manuelle Nachbesetzen übernimmt später der Editor aus PROJ-7 |

**Entwurf statt sofortigem Speichern (Punkt 3 und 4)**

Die Spec verlangte bis dahin, dass eine Einheit beim Generieren sofort gespeichert wird. Das ist ersetzt durch einen Entwurfszustand:

- `units.saved` unterscheidet Entwurf von abgelegter Einheit. Die Spalte kam mit Vorgabewert `true` ins Schema und wurde direkt danach auf `false` umgestellt — so galten die bereits bestehenden Einheiten ohne eine einzige beschriebene Zeile als gespeichert
- „Meine Einheiten" und die Gruppen-Detailseite zeigen nur `saved = true`
- **Pro Nutzer existiert höchstens ein Entwurf.** Jedes Generieren löscht den vorigen, damit sich verworfene Vorschläge nicht ansammeln
- Entwürfe zählen **nicht** für die Frische-Regel: Was der Nutzer verworfen hat, soll die Abwechslung der nächsten echten Einheit nicht einschränken
- „Zurück zum Generator" führt auf `/units/new?from=<id>`. Die Konfigurationsseite lädt den Zeitverlauf dieser Einheit und öffnet direkt den individuellen Modus. Ein Wechsel der Gruppe verwirft den Stand danach wie gewohnt

**Lockern pro Segment (Punkt 5)**

`regenerateUnit` kennt keinen Lockerungs-Parameter mehr; stattdessen gibt es `relaxSegment(segmentId)`. Die Aktion füllt genau ein Segment neu, lässt alle übrigen unberührt — auch solche, die ebenfalls eine Lücke haben — und schreibt den Lockerungshinweis der Einheit segmentweise fort, ohne die Hinweise der anderen Segmente zu verlieren. Übungen aus den übrigen Segmenten bleiben gesperrt, damit keine Dopplung entsteht.

Dafür ist die Segmentplanung als `planSegment` aus dem Generator herausgelöst. Das Generieren einer ganzen Einheit und das nachträgliche Lockern eines Segments laufen seitdem über dieselbe Funktion — die Regeln können nicht auseinanderlaufen.

**Vollständige Lückendiagnose (Punkt 6)**

Vorher nannte der Hinweis nur das **erste** Kriterium, das den Pool geleert hat. Im Test stand damit „Es gibt noch keine Übung, die der Phase ‚Hauptteil 2' zugeordnet ist." — korrekt, aber es blieb offen, was zu tun ist und ob noch mehr im Weg steht.

Jetzt wird jedes Kriterium **unabhängig** gegen die Phasen-Treffer gezählt, statt eine Filterkette beim ersten leeren Zwischenstand abzubrechen. Die neue Struktur `GapDetail` liegt in der Spalte `unit_segments.gap_detail` und trägt: Art der Lücke, Phase, Kandidatenzahl insgesamt, Phasen-Treffer, und je Kriterium die Anzahl der daran scheiternden Übungen. `gap_reason` bleibt als einzeilige Zusammenfassung daneben bestehen — deshalb musste die vorhandene Längenbedingung nicht angefasst werden.

An den echten Daten ergibt das zum Beispiel für ein Segment „Hauptteil", das nur auf Handball eingeschränkt wurde:

```
28 Übungen tragen die Phase „Hauptteil", aber keine erfüllt alle übrigen Kriterien.
Daran scheitern sie:
  15 Übungen an Altersgruppe
   4 Übungen an Material in deiner Halle
   9 Übungen an Teilnehmerzahl (25)
  28 Übungen an gewählte Sportarten
```

Zu jeder Ursache nennt die Oberfläche, was dagegen hilft. Zwei Feinheiten:

- **Das Lockern wird gar nicht erst angeboten**, wenn die Lücke nachweislich nur an Material oder Altersgruppe liegt — beides bleibt in jeder Stufe hart. Statt eines Knopfes, der nichts tut, steht dort der Grund
- **Ein erfolgloser Lockerungsversuch wird begründet.** Dabei wurde ein Fehler sichtbar und behoben: Die Diagnose stammte vom strengen Versuch, nicht vom tiefsten. Die Meldung hätte „Auch mit gelockerten Kriterien" über einer Liste gezeigt, die genau die gelockerten Kriterien aufzählt. Jetzt wird mit der besten Auswahl gefüllt und mit dem tiefsten Versuch begründet, sodass nur noch die harten Kriterien erscheinen

**Verifikation dieser Runde**
- `npx tsc --noEmit` — fehlerfrei
- `npm test` — **212 Tests grün** (10 neue zur Diagnose und zu `planSegment`, 6 bestehende auf die strukturierte Prüfung umgestellt)
- `npm run build` — erfolgreich
- `npm run lint` — 0 Fehler, 4 vorbestehende `<img>`-Warnungen
- `npm run test:pruefplan` — 15 Fälle grün, erweitert um die Aufschlüsselung an echten Daten

### Behebung BUG-2 und BUG-8 — 2026-10-05

**BUG-2: Entwürfe erscheinen in der Löschwarnung für Übungen** — behoben

`getUnitNamesUsingExercise` filterte nicht auf `saved` und nannte damit auch Einheiten, die der Nutzer nie abgelegt hat — Namen, die er in seinem Ordner nirgends wiederfindet. Ein `.eq('saved', true)` genügt; damit tragen jetzt alle fünf Abfragen auf `units` dieselbe Regel: Frische-Regel, beide Übersichten und beide Löschwarnungen.

Geprüft wird das im E2E-Test **mit Gegenprobe**: erst als Entwurf (die Warnung muss schweigen), dann dieselbe Einheit gespeichert (die Warnung muss erscheinen). Ohne den zweiten Teil wäre der Test auch dann grün, wenn die Warnung grundsätzlich nie auftaucht.

**BUG-8: Die E2E-Strecke läuft — der Rechner bremst sie aus** — teilweise behoben

Drei Hindernisse lagen zwischen „Tests geschrieben" und „Tests gelaufen". Zwei sind beseitigt, das dritte liegt außerhalb des Repositories.

1. **Der Playwright-Browser ließ sich nicht installieren.** Der Download lief durch, das Entpacken der tausenden Chromium-Dateien kam aber nicht voran — drei Dateien in mehreren Minuten, das typische Bild bei Echtzeit-Virenscan unter Windows. Zwei parallel gestartete Läufe hatten sich zudem gegenseitig das Verzeichnis weggeräumt und eine Sperrdatei hinterlassen.

   Gelöst ohne Eingriff in die Rechnereinstellungen: `playwright.config.ts` akzeptiert jetzt `PLAYWRIGHT_CHANNEL`. Damit übernimmt ein bereits installierter Browser — hier Edge, ebenfalls Chromium-basiert. Ohne die Variable bleibt alles beim gebündelten Standard, es landet also nichts Rechnerabhängiges im Repository.

   ```
   PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npm run test:e2e
   ```

2. **Die Anmeldung über den Einmal-Link funktionierte nicht.** Geprüft statt vermutet: Supabase leitet den Link auf die hinterlegte Produktions-URL um, weil `http://localhost:3000` nicht unter den erlaubten Zielen steht, und liefert die Token im **URL-Fragment** (`#access_token=…`), während `/auth/callback` einen `?code=` erwartet. Ein Server sieht Fragmente nie.

   Statt die Supabase-Einstellungen nur für Tests zu ändern oder das Passwort des Testkontos zu überschreiben, wird die Sitzung jetzt in Node erzeugt (`verifyOtp` mit dem Einmal-Token) und **von `@supabase/ssr` selbst** in Cookies geschrieben. Deren Format stimmt dadurch garantiert mit dem überein, was die App liest, statt nachgebaut zu werden und bei der nächsten Version zu brechen.

3. **Zwei Fehler in meinen eigenen Tests**, vor dem ersten Lauf beim Durchsehen gefunden:
   - `fullyParallel` hätte die Tests gleichzeitig gegen **ein** Testkonto laufen lassen, während sie zwischendurch dessen Einheiten löschen — sie hätten sich gegenseitig die Daten weggezogen. Jetzt `test.describe.configure({ mode: 'serial' })`
   - Dasselbe über zwei Projekte hinweg: Das Handy-Projekt führt die datenverändernden PROJ-6-Tests nicht mehr mit aus

**Ergebnis des Durchlaufs**

| Teil | Ergebnis |
|---|---|
| 4 Tests ohne Anmeldung | ✅ alle grün |
| Anmeldung (`auth.setup`) | ✅ grün — die Sitzung wird korrekt hergestellt |
| 2 angemeldete Tests | ✅ grün |
| 1 Test | ❌ abgebrochen: *Test timeout of 30000ms exceeded while setting up „context"* |
| 13 Tests | nicht gelaufen — im Reihenfolge-Modus bricht die Kette nach einem Fehlschlag ab |

Der Fehlschlag ist **kein Produktfehler**: Edge braucht auf diesem Rechner über 30 Sekunden, nur um einen Browser-Kontext zu starten — dieselbe Bremse, die zuvor das Entpacken von Chromium lahmgelegt hat. 17,5 Minuten für zwei Tests gehen nicht auf das Konto der Anwendung.

Das Zeitlimit steht deshalb jetzt auf 120 Sekunden, damit ein langsamer Rechner nicht wie ein Produktfehler aussieht. Die eigentliche Abhilfe liegt außerhalb des Repositories: eine Ausnahme für den Ordner `%LOCALAPPDATA%\ms-playwright` im Echtzeitschutz. Danach lässt sich der gebündelte Chromium normal installieren, der deutlich schneller startet als ein vollständiger Edge — und `PLAYWRIGHT_CHANNEL` wird überflüssig.

**Was damit belegt ist:** Die Teststrecke funktioniert — Anmeldung, Aufbau der Testdaten, Produktionsbuild und sechs Tests sind grün durchgelaufen. Was fehlt, ist ein vollständiger Durchlauf auf einem Rechner, der Browser in vertretbarer Zeit startet. BUG-8 bleibt deshalb offen.

**Weitere Anpassungen an der Teststrecke**
- Playwright verbietet, dass eine Testdatei eine andere importiert. `TEST_EMAIL` und `STORAGE_STATE` sind deshalb von `auth.setup.ts` nach `fixtures.ts` gewandert
- Der Testserver ist von `npm run dev` auf einen Produktionsbuild umgestellt. Der Entwicklungsserver übersetzt jede Route beim ersten Aufruf neu, was einen Durchlauf zusätzlich aufblähte; nebenbei wird jetzt geprüft, was tatsächlich ausgeliefert wird
- `PLAYWRIGHT_PORT` erlaubt einen eigenen Port, falls auf 3000 bereits ein Entwicklungsserver läuft — der würde sonst weiterverwendet und die Umstellung auf den Produktionsbuild wäre wirkungslos

### Behebung BUG-1: Löschen einer Gruppe warnt vor dem Verlust ihrer Einheiten — 2026-10-05

Die QA fand den einzigen Fehler hoher Schwere: `units.group_id` steht auf ON DELETE CASCADE, das Löschen einer Gruppe nahm also sämtliche Einheiten samt Segmenten, Einträgen und Verwendungsnachweisen mit — und der Dialog sprach nur davon, dass die Aktion nicht rückgängig zu machen sei. Beim Löschen einer **Übung** nennt PROJ-6 die betroffenen Einheiten seit dem Backend-Schritt beim Namen; beim Löschen einer **Gruppe**, wo ungleich mehr auf dem Spiel steht, stand nichts.

**Die Löschweitergabe bleibt, wie sie ist.** Sie ist richtig: Eine Einheit ohne Gruppe hätte keine Grundlage — alle Auswahlkriterien stammen aus dem Gruppenprofil, und `group_id` ist nicht optional. Die Alternativen wären schlechter: `RESTRICT` zwänge den Nutzer, erst jede Einheit einzeln zu löschen, `SET NULL` hinterließe Einheiten ohne Bezugspunkt. Gefehlt hat nicht die Regel, sondern ihre Ankündigung. Eine Schemaänderung war deshalb nicht nötig.

**Umgesetzt** nach demselben Muster wie die Löschwarnung bei Übungen:
- `getUnitNamesForGroup(groupId)` in `src/lib/actions/units.ts` liefert die Namen der gespeicherten Einheiten einer Gruppe, neueste zuerst
- `src/components/groups/group-units-warning.tsx` lädt sie **beim Öffnen des Dialogs** nach — nicht beim Rendern der Gruppenliste, wo sie für jede Karte eine Abfrage kosten würden
- Eingehängt an **beiden** Löschwegen: Gruppenkarte in der Übersicht und Kopf der Gruppen-Detailseite. Die Detailseite brauchte dafür einen gesteuerten Öffnungszustand, weil der Dialog bis dahin ungesteuert war und die Komponente sonst nicht erfährt, wann sie laden soll

Der Hinweis nennt bis zu fünf Namen und fasst den Rest zusammen („und 4 weitere"), unterscheidet Ein- und Mehrzahl und sagt ausdrücklich zu, dass die Übungen erhalten bleiben — die Einheiten verweisen sie nur.

**Entwürfe bleiben außen vor.** Sie werden beim nächsten Generieren ohnehin ersetzt, tauchen in keiner Übersicht auf und wären in der Warnung nur ein Name, den der Nutzer nirgends wiederfindet.

**An den echten Daten geprüft:** Beim Löschen von „Vorschulturnen 1" wären bislang **9 gespeicherte Einheiten** lautlos verschwunden, bei „Capoeira Erwachsene Samstags" drei. Beide nennt der Dialog jetzt.

**Sieben Tests** in `group-units-warning.test.tsx`, bewusst in `React.StrictMode` gerendert: Nicht laden solange der Dialog zu ist, Namen nennen, Ein- und Mehrzahl, Kürzen langer Listen, Zusage zu den Übungen, nichts anzeigen ohne Einheiten, und einen Netzwerkfehler verschlucken statt den Löschdialog zu blockieren. Diese Lade-bei-Öffnen-Logik hat im Projekt schon zweimal Fehler getragen.

**Verifikation**
- `npx tsc --noEmit` — fehlerfrei
- `npm test` — **249 Tests grün** (7 neue)
- `npm run build` — erfolgreich
- `npm run lint` — 0 Fehler, 4 vorbestehende `<img>`-Warnungen

**Noch offen aus der QA:** BUG-2 bis BUG-8 (alle niedrig). BUG-8 — der Nachlauf der E2E-Tests — braucht einen vollständigen Playwright-Browser und sollte vor dem Deployment erledigt werden.

### Benennen beim Speichern — 2026-10-05

Der Name war bis dahin nur nachträglich über das Drei-Punkte-Menü änderbar. Gefragt wird er jetzt dort, wo er zählt: beim Ablegen in den Ordner. „Einheit speichern" öffnet einen Dialog mit dem automatischen Namen aus Gruppe und Datum **vorausgefüllt und markiert** — bestätigen genügt, überschreiben geht sofort.

`saveUnit` nimmt den Namen deshalb entgegen und setzt Name und Ablage in **einem** Schreibvorgang. Umbenennen und Speichern prüfen den Namen über dieselbe Stelle (`checkUnitName`), damit die Regeln nicht auseinanderlaufen.

Beide Wege stellen dieselbe Frage, deshalb teilen sie sich `unit-name-dialog.tsx`; nur Titel, Beschreibung und Knopfbeschriftung unterscheiden sich. Der Dialog setzt sich beim Öffnen auf den aktuellen Namen zurück — sonst stünde beim zweiten Öffnen noch eine abgebrochene Eingabe im Feld. Genau dieses Zusammenspiel von Zustand und Effekt ist durch sieben Tests abgedeckt, nachdem derselbe Fehlertyp zuvor den Bedienstand gekostet hatte.

### Fehlerbehebung: „Zurück zum Generator" stellte nichts wieder her — 2026-10-05

Der erste Anlauf des Bedienstands funktionierte nicht. Die Ursache lag **nicht** in den Daten — `units.editor_state` wurde korrekt geschrieben und gelesen —, sondern im Formular.

Der Effekt, der beim Gruppenwechsel aufräumt, war von einem **Einmal-Schalter** bewacht:

```ts
if (pristineInitial.current) {
  pristineInitial.current = false
  return
}
setCustomSegments(null)
setMode('standard')
setSelectedId(null)
```

React führt Effekte im Entwicklungsmodus doppelt aus (StrictMode). Beim ersten Lauf wurde der Schalter verbraucht, beim zweiten griff er nicht mehr — und der mitgebrachte Stand wurde verworfen. Der Nutzer landete also immer auf „Standard" mit leerem Zeitverlauf. Derselbe Fehler wäre auch außerhalb des Entwicklungsmodus aufgetreten, sobald ein Neurendern ein frisches `group`-Objekt liefert.

Der Kommentar an der Stelle behauptete sogar, der Effekt laufe „nur bei echtem Gruppenwechsel" — genau das stimmte nicht.

**Behoben**, indem nicht mehr gezählt wird, wie oft der Effekt läuft, sondern ob sich die Gruppe tatsächlich geändert hat: Ein `lastGroupId`-Verweis hält die zuletzt wirksame Gruppenkennung; stimmt sie mit der aktuellen überein, wird nichts verworfen. Das ist unabhängig von der Anzahl der Effektläufe und damit auch gegen künftige Neurender-Ursachen unempfindlich.

**Mit einem Test abgesichert**, der den Fehler nachweislich fängt: `src/components/units/unit-config-form.test.tsx` rendert das Formular ausdrücklich in `React.StrictMode`. Gegen den alten Code fallen drei der fünf Tests durch, gegen den neuen keiner — das wurde durch zeitweiliges Zurücksetzen des Fixes überprüft. Es sind die ersten Komponententests des Projekts; die übrigen Testdateien decken reine Logik ab, und genau deshalb konnte dieser Fehler durchrutschen.

**Für Altbestand:** Einheiten, die vor der Spalte `editor_state` entstanden sind, tragen keinen Bedienstand. Sie öffnen in „Individuell" mit ihren tatsächlich gespeicherten Segmenten — das ist die verlässlichere Quelle als eine neu gebaute Vorlage. Alles ab dieser Änderung Generierte stellt den Modus exakt wieder her.

**Bewusst nicht geändert:** Im Modus „Standard" zeigt die Maske die Standardverteilung der **aktuellen** Gruppe, nicht die eingefrorenen Segmente der Einheit. Das ist kein Versehen: `generateUnit` prüft serverseitig, dass die Einheitsdauer der des Gruppenprofils entspricht. Hätte der Nutzer die Dauer seiner Gruppe zwischenzeitlich geändert, würde ein Wiederherstellen der alten Werte das Generieren mit einer Fehlermeldung scheitern lassen.

### Änderungen aus dem zweiten Test — 2026-10-05

Der Nutzer hat das Entwurfsmodell, „Zurück zum Generator" und das Lockern pro Segment durchgespielt: **funktioniert**. Vier weitere Punkte kamen dabei auf.

**1 — „Zurück zum Generator" stellt den Bedienstand wieder her**

Bis dahin lud die Konfigurationsseite zwar den Zeitverlauf der Einheit, öffnete aber immer den individuellen Modus mit zugeklappten Einstellbereichen. Wer mit „Standard" generiert hatte, landete beim Zurückgehen also in einer Maske, die er so nie gesehen hatte.

Die neue Spalte `units.editor_state` trägt den reinen Bedienstand:

```json
{ "mode": "standard" | "custom", "expandedPosition": 2 }
```

`expandedPosition` ist die **Position** des Segments, dessen Einstellbereich offen war — nicht dessen Kennung, weil die Kennungen im Formular bei jedem Laden neu vergeben werden. Einheiten aus der Zeit vor dieser Spalte tragen nichts und öffnen wie bisher mit dem Zeitverlauf; `readEditorState` fängt das ab.

Weil der Stand **an der Einheit** hängt und nicht an der Sitzung, funktioniert das auch, wenn der Nutzer gar nicht aus dem Generator kam, sondern etwa über „Meine Einheiten" — genau die Anforderung.

Dabei fiel ein eigener Fehler auf: Die Position kam aus `findIndex`, das bei einem zwischenzeitlich entfernten Segment `-1` liefert. Das Schema lehnt negative Positionen ab, womit das Generieren mit einer unverständlichen Meldung gescheitert wäre. Jetzt wird `-1` zu `null`, und ein Test im neuen `unit.test.ts` hält die Regel fest.

**2 — Einheiten umbenennen und löschen**

Umbenennen gehört **nicht** in PROJ-7: Der Editor dort ändert den Stundenverlauf, der Name ist Beiwerk der Einheit. Die Spec sah ihn ohnehin schon als „später umbenennbar" vor. Umgesetzt als Drei-Punkte-Menü (`unit-actions-menu.tsx`) auf den Karten in jeder Liste und im Kopf der Detailseite.

Beim Bauen zeigte sich, dass es **gar keinen** Weg gab, eine gespeicherte Einheit wieder loszuwerden — der Ordner füllte sich unumkehrbar. Auf Rückfrage mit aufgenommen, mit Bestätigungsdialog wie bei Übungen und Gruppen. Die Übungen bleiben dabei unberührt, weil die Einheit sie nur verweist.

Das Menü liegt **neben** dem Link der Karte statt darin, damit ein Klick darauf nicht die Einheit öffnet.

**3 — „Neu generieren" einer gespeicherten Einheit erzeugt einen Entwurf**

Vorher überschrieb `regenerateUnit` immer denselben Datensatz. Bei einer gespeicherten Einheit war das ein Datenverlust auf Knopfdruck. Jetzt verzweigt die Aktion:

| Ausgangslage | Verhalten |
|---|---|
| **Entwurf** | Inhalt wird an Ort und Stelle ersetzt — da ist nichts zu bewahren |
| **Gespeicherte Einheit** | Bleibt unangetastet. Der neue Vorschlag entsteht als Entwurf daneben, mit demselben Zeitverlauf und demselben Bedienstand. Erst „Einheit speichern" legt ihn als **zusätzliche** Einheit ab |

Die Aktion gibt dafür die Kennung des neuen Entwurfs zurück, damit die Oberfläche dorthin wechseln kann. Die Ein-Entwurf-Regel gilt weiter: Ein vorhandener Entwurf wird dabei ersetzt.

Nebeneffekt, der die Oberfläche vereinfacht: Die Warnung „Deine Änderungen werden überschrieben" ist bei einer gespeicherten Einheit nicht mehr nötig — es geht ja nichts verloren. Sie erscheint nur noch bei einem bearbeiteten Entwurf.

**4 — Kein Speichern, solange eine Phase ungefüllt ist**

„Einheit speichern" ist gesperrt, sobald ein Segment im Modus „füllen" sein Budget nicht erreicht. Bewusst auf „frei lassen" gesetzte Abschnitte zählen **nicht** als Lücke — die sind Absicht, und Edge Case 9 (eine Einheit, in der alle Segmente frei bleiben) bleibt dadurch zulässig.

Der gesperrte Knopf allein wäre eine Sackgasse: Bei kleiner Übungsdatenbank käme der Nutzer nie zum Speichern. Deshalb steht daneben, **welches** Segment die Sperre auslöst und wie er herauskommt — Lücke über die Hinweise schließen, oder den Abschnitt im Generator auf „frei lassen" setzen, wenn er ihn selbst füllen will. Damit ist die Sperre eine Anweisung statt einer Wand.

**Verifikation dieser Runde**
- `npx tsc --noEmit` — fehlerfrei
- `npm test` — **230 Tests grün** (18 neue in `src/lib/validations/unit.test.ts` zum Konfigurations-Schema, das die Server-Seite absichert)
- `npm run build` — erfolgreich
- `npm run lint` — 0 Fehler, 4 vorbestehende `<img>`-Warnungen
- `npm run test:pruefplan` — 15 Fälle weiterhin grün

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure Setup) — Datenbank
- Requires: PROJ-2 (Benutzerregistrierung & Login) — Nur eingeloggte Nutzer generieren Einheiten
- Requires: PROJ-3 (Übungsdatenbank) — Liefert die Übungen, aus denen der Generator auswählt
- Requires: PROJ-5 (Gruppenprofile) — Liefert Sportarten, Altersgruppen, Teilnehmerzahl, Einheitsdauer und Hallenmaterial als Generator-Input
- Ermöglicht: PROJ-7 (Einheiten-Editor), PROJ-9 (Kalenderansicht), PROJ-10 (Übungsrotation), PROJ-14 (Live-Modus)

### Abhängigkeit in PROJ-3 — erledigt am 2026-10-04
PROJ-6 brauchte eine eindeutige Semantik für das abweichende Material einer Variante, die in PROJ-3 nur als „nur was anders ist als bei der Hauptübung" beschrieben war. Festgelegt wurde: **Ersetzen** (siehe Produktentscheidungen).

`src/components/exercises/variant-input.tsx` setzt das jetzt um: Die Variante zeigt das geerbte Material der Hauptübung als Text an; ein Klick auf „Material für diese Variante anpassen" kopiert die Liste in bearbeitbare Felder, ein zweiter Button setzt auf Erben zurück. Der Hinweis unter der Liste sagt ausdrücklich, dass sie die Hauptübung **ersetzt** und dass „Kein Material" zu wählen ist, wenn die Variante gar nichts braucht.

## User Stories
1. Als Übungsleiter möchte ich für eine meiner Gruppen mit einem Klick eine vollständige, strukturierte Trainingseinheit generieren lassen, damit ich nicht jede Woche von Hand Übungen zusammensuchen muss.
2. Als Übungsleiter möchte ich, dass der Generator automatisch Altersgruppe, Teilnehmerzahl und das in meiner Halle verfügbare Material berücksichtigt, damit die vorgeschlagene Einheit tatsächlich durchführbar ist.
3. Als Übungsleiter möchte ich den Zeitablauf meiner Einheit vor dem Generieren selbst festlegen können — eigene Phasen, eigene Längen und bewusste Lücken — damit auch ungewöhnliche Stundenbilder möglich sind.
4. Als Übungsleiter möchte ich pro Phase die Sportart und den Schwierigkeitsgrad einschränken können, damit ich zum Beispiel ein allgemeines Aufwärmen mit einem sportartspezifischen Hauptteil kombinieren kann.
5. Als Übungsleiter möchte ich eine generierte Einheit verwerfen und neu generieren können, damit ich einen anderen Vorschlag bekomme, ohne die Konfiguration erneut eingeben zu müssen.
6. Als Übungsleiter möchte ich, dass sich aufeinanderfolgende Einheiten derselben Gruppe unterscheiden, damit meine Stunden abwechslungsreich bleiben.
7. Als Übungsleiter möchte ich verstehen, warum ein Teil meiner Einheit leer geblieben ist, damit ich weiß, was ich an meinen Daten verbessern muss.
8. Als Übungsleiter möchte ich meine generierten Einheiten pro Gruppe wiederfinden, damit ich auf Bewährtes zurückgreifen kann.

## Out of Scope
- **Bearbeiten des generierten Stundenverlaufs** — eigenes Feature (PROJ-7): Übung tauschen, Zeiten im fertigen Plan verschieben, umsortieren, Lücken nachträglich füllen, auf eine Variante umschalten. PROJ-6 endet mit der gespeicherten Einheit und ihrer Anzeige
- **Einzelne Übung neu auswürfeln** („diese eine passt nicht") — deferred zu PROJ-7; die zugrundeliegende Auswahlfunktion wird in PROJ-6 gebaut und von PROJ-7 mitgenutzt
- **Zuordnung zu einem Trainingstermin / Datum** — deferred zu PROJ-9 (Kalenderansicht & Langzeitplanung). Eine Einheit trägt in PROJ-6 nur ihr Erstelldatum
- **Vollständige Rotationsstrategie** — deferred zu PROJ-10: Favoriten, festes Mischungsverhältnis „bewährt zu neu", Rotationszyklen über Wochen. PROJ-6 enthält nur die minimale Frische-Regel (letzte zwei Einheiten nach hinten sortieren)
- **Mehrere Vorschläge gleichzeitig zur Auswahl** („Vorschlag A / B / C") — bewusst verworfen; zwingt den Nutzer zu einer Vergleichsentscheidung, obwohl er eine fertige Stunde will
- **Automatisches stilles Aufweichen der Auswahlkriterien** — bewusst verworfen; Lockern passiert nur auf aktiven Klick des Nutzers und wird transparent angezeigt
- **Phasenverteilung im Gruppenprofil hinterlegen** — bewusst verworfen; die Verteilung gehört zur einzelnen Einheit, nicht zur Gruppe. Keine Erweiterung von PROJ-5 nötig
- **Durchführung der Einheit / Stundenbegleitung** — eigenes Feature (PROJ-14, Live-Modus)
- **Export als PDF / Drucken** — nicht im MVP
- **Einheiten teilen** — deferred zu PROJ-12 (Community-Features)
- **Generieren für mehrere Gruppen gleichzeitig** — kein MVP-Bedarf
- **Stundenmuster / wiederverwendbare Konfigurationen** — ausgelagert nach **PROJ-17** (Entscheidung vom 2026-10-04). PROJ-6 speichert die Konfiguration pro Einheit und lädt sie über „Zurück zum Generator" wieder, verwaltet sie aber nicht als eigenständige Vorlage

## Einstiegspunkte

Eine Einheit wird **immer** in Bezug auf eine Gruppe erstellt. Es gibt zwei Wege dorthin:

1. **Gruppen-Detailseite** → Button „Einheit generieren" → Konfigurationsseite mit **vorausgefüllter** Gruppe
2. **Startseite / Dashboard** → Karte „Einheitengenerator" → Konfigurationsseite, auf der die Gruppe **zuerst gewählt** wird

## UI-Konzept

### Konfigurationsseite (vor dem Generieren)

Eine einzige Seite mit **zwei** Blöcken. Der Standardweg ist ein Klick: Gruppe gewählt, „Standard" ist vorausgewählt, direkt „Einheit generieren".

**1. Gruppe**
- Dropdown aller Gruppenprofile des Nutzers
- Beim Einstieg über die Gruppen-Detailseite vorausgefüllt
- Unter der Auswahl eine Zusammenfassung dessen, was der Generator aus dem Profil zieht: Sportarten, Altersgruppen, Teilnehmerzahl, Einheitsdauer, Halle mit Materialanzahl

**2. Aufbau**
- Auswahl: **„Standard"** (Vorauswahl) oder **„Individuell"**
- **Standard** = volle Einheitsdauer, klassische Verteilung 20 / 60 / 20 auf Aufwärmen, Hauptteil und Cool-Down, keine Lücken
- **Individuell** klappt den Zeitverlauf auf: eigene Phasen, eigene Längen, eigene Reihenfolge und bewusst frei bleibende Abschnitte

> **Ursprünglich waren das zwei getrennte Blöcke** — „Umfang" (volle Dauer / nur Teile) und „Phasenverteilung" (klassisch / individuell). Beide klappten denselben Zeitverlauf-Editor auf, womit die Trennung keinen Unterschied machte und nur eine Entscheidung mehr verlangte. Zusammengelegt zu einer einzigen Wahl.

**Bearbeitungsstand bleibt erhalten:** Wer von „Individuell" zurück auf „Standard" wechselt und später wieder auf „Individuell", findet seinen Zeitverlauf unverändert vor. Die Standardvorlage und der individuelle Stand werden getrennt gehalten. Ein Button **„Auf Standard zurücksetzen"** über dem Zeitverlauf verwirft den individuellen Stand bewusst.

### Der Zeitverlauf (ein Widget für Umfang und Phasen)

Ein durchgehender Balken über die Einheitsdauer aus dem Gruppenprofil, aufgeteilt in Segmente mit ziehbaren Grenzen.

```
Einheit "Kinderturnen" — 60 Min
0        12        20              48        60
├─────────┼─────────┼───────────────┼─────────┤
│Aufwärmen│  frei   │   Hauptteil   │Cool-Down│
│generiert│         │   generiert   │generiert│
└─────────┴─────────┴───────────────┴─────────┘
```

Pro Segment einstellbar:

| Einstellung | Verhalten |
|---|---|
| **Name (Phase)** | Auswahl aus den vordefinierten Phasen (Aufwärmen, Hauptteil, Cool-Down) **plus** den eigenen Phasen des Nutzers aus `custom_categories`; eine neue eigene Phase kann angelegt werden. **Kein Freitext** — der Name ist das Matching-Kriterium gegen die Phasen-Tags der Übungen |
| **Dauer** | Über die ziehbare Segmentgrenze oder ein Minutenfeld |
| **Füllen / frei lassen** | Schalter. „Frei lassen" = Lücke, der Generator überspringt das Segment |
| **Sportart(en)** | Multi-Select. Die Sportart-Tags der Gruppe stehen **oben in der Liste und sind angehakt**; weitere Sportarten können angehakt, vorhandene abgewählt werden. **Mindestens eine muss ausgewählt sein** |
| **Hauptsportart** | Einfachauswahl aus den Sportarten des Segments, vorbelegt mit der Hauptsportart der Gruppe. Wird in diesem Segment doppelt gewichtet. Erscheint nur, wenn mindestens zwei Sportarten gewählt sind, und entfällt automatisch, wenn die gesetzte Sportart abgewählt wird |
| **Schwierigkeitsgrad** | Multi-Select nach derselben Logik; Standard = alle drei Stufen |
| **Arbeitsnotiz** | Freitext pro Segment. Vor allem für frei bleibende Abschnitte gedacht, wo der Nutzer festhält was er dort selbst vorhat („Wettkampfspiel", „Besprechung"). Erscheint im fertigen Stundenverlauf an der entsprechenden Stelle. Gleiche Benennung wie das Arbeitsnotizen-Feld bei Übungen (PROJ-3) |

Weitere Zeitverlauf-Funktionen:
- Segment hinzufügen / entfernen
- **Umsortieren durch seitwärts Ziehen eines Segments direkt im Balken.** Die Umsortierung wird erst beim Loslassen übernommen, damit sich der Balken nicht mitten im Ziehen neu aufbaut. Für Tastaturbedienung: Alt + Pfeiltasten auf dem fokussierten Segment
- Lücken an beliebigen Stellen und in beliebiger Anzahl
- Die Summe aller Segmente entspricht immer der Einheitsdauer

### Ergebnisseite

Nach dem Generieren wird die Einheit gespeichert und der Nutzer landet direkt in der Ansicht des Stundenverlaufs (die in PROJ-7 zur Bearbeiten-Maske ausgebaut wird).

```
Kinderturnen – 3. Okt 2026                    [Neu generieren]

Aufwärmen · 12 Min
  Feuer-Wasser-Blitz              12 Min  (geschätzt: 10)
  Turnen · Leicht · Freie Verteilung
  Material: keines                         3 Varianten verfügbar

frei · 8 Min
  — Lücke —

Hauptteil · 28 Min
  Reifen-Parcours                 16 Min  (geschätzt: 15)
  Kinderturnen · Mittel · Stationsbetrieb
  Material: 6 Reifen, 4 Hütchen

  ⚠ 12 von 28 Minuten nicht gefüllt
  Keine weitere passende Übung gefunden. Es fehlen Übungen der
  Phase "Hauptteil" für die Altersgruppe "Kinder (4–6)".
  [Mit gelockerten Kriterien erneut versuchen]  [Übung anlegen]

Cool-Down · 12 Min
  Katzenbuckel-Dehnen              6 Min
  Igel-Massage                     6 Min
```

Pro Übung angezeigt: Name, Plandauer (plus geschätzte Originaldauer wenn abweichend), Sportart, Schwierigkeitsgrad, Organisationsform, benötigtes Material mit Mengen, Hinweis auf vorhandene Varianten, Musik-Link wenn vorhanden. Klick auf die Übung öffnet ihre Detailseite.

### Einheitenliste

Generierte Einheiten erscheinen auf der Gruppen-Detailseite in dem Platzhalter-Bereich, den PROJ-5 dafür vorgesehen hat — mit Name, Erstelldatum, Gesamtdauer und Anzahl der Übungen, neueste zuerst.

### Leerzustände

| Situation | Was der Nutzer sieht |
|---|---|
| Noch keine Gruppe angelegt | Erklärung, dass der Generator ein Gruppenprofil braucht, mit Button „Erste Gruppe anlegen" |
| Noch keine Übungen in der Datenbank | Erklärung, dass der Generator aus der eigenen Übungsdatenbank schöpft, mit Button „Erste Übung anlegen" und Verweis auf die Starter-Datenbank (PROJ-4) |
| Zu wenige passende Übungen | Lücken-Hinweis im Ergebnis mit konkretem Grund (siehe oben) und dem Bildungs-Hinweis, dass eine Gruppe mit nur einer getaggten Sportart zu wenige Treffer liefert |

## Generator-Logik

### Kandidatenpool

Kandidaten sind **alle Hauptübungen und alle Varianten** des Nutzers. Für jede Variante werden zuvor die effektiven Metadaten berechnet:

| Feld | Herkunft bei einer Variante |
|---|---|
| Altersgruppen | Variante, wenn gefüllt — sonst Hauptübung |
| Organisationsformen | Variante, wenn gefüllt — sonst Hauptübung |
| Material | Variante, wenn gefüllt (**ersetzt** die Liste vollständig) — sonst Hauptübung |
| Teilnehmerzahl Min/Max | Variante, wenn gesetzt — sonst Hauptübung |
| Dauer | Variante, wenn gesetzt — sonst Hauptübung |
| Phase, Sportart, Schwierigkeitsgrad | **Immer** von der Hauptübung — eine Variante kann diese Felder laut Datenmodell nicht überschreiben |

### Harte Kriterien (Übung fällt aus dem Pool)

Trägt eine Übung mehrere Werte in einer Kategorie, genügt **ein** passender Wert (OR innerhalb der Kategorie).

| Kriterium | Regel |
|---|---|
| **Phase** | Die Phasen-Tags der Übung müssen den Namen des Segments enthalten |
| **Altersgruppe** | Mindestens eine Altersgruppe der Übung muss in den Altersgruppen der Gruppe vorkommen |
| **Sportart** | Mindestens eine Sportart der Übung muss in den für das Segment gewählten Sportarten vorkommen |
| **Schwierigkeitsgrad** | Der Grad der Übung muss unter den für das Segment gewählten Graden sein |
| **Material** | Jedes benötigte Material muss in der Halle in ausreichender Menge vorhanden sein. `insgesamt` → benötigte Menge; `pro Teilnehmer` → Menge × **Teilnehmerzahl der Gruppe**. „Kein Material" gilt immer als erfüllt. **Entfällt vollständig**, wenn die Gruppe keine Halle zugewiesen hat; bei `pro Teilnehmer` entfällt die Prüfung zusätzlich, wenn keine Teilnehmerzahl hinterlegt ist. Die Prüfung erfolgt **pro Übung, nicht kumulativ über das Segment** — Übungen laufen nacheinander und konkurrieren nicht um dasselbe Material |
| **Teilnehmerzahl** | Die **Teilnehmerzahl der Gruppe** (ein einzelner Wert, siehe unten) muss in das Min/Max-Fenster der Übung passen: `Übung-Max ≥ Teilnehmerzahl` **und** `Übung-Min ≤ Teilnehmerzahl`. Nur geprüft, wenn die Gruppe eine Teilnehmerzahl hinterlegt hat und die Übung den jeweiligen Wert gesetzt hat |

#### Warum die Gruppe eine einzelne Teilnehmerzahl hat

Die ursprüngliche Fassung der Spec schrieb nur „die Teilnehmerzahl der Gruppe muss in das Min/Max-Fenster der Übung passen". Das Gruppenprofil hatte aber eine **Spanne** (Min und Max), und damit war offen, welcher Wert gilt. Mit echten Testdaten durchgerechnet ergaben die drei denkbaren Lesarten stark abweichende Ergebnisse:

| Lesart | Bedingung | Ergebnis im Test |
|---|---|---|
| Überlappung | `Übung-Min ≤ Gruppe-Max` und `Übung-Max ≥ Gruppe-Min` | Zu lax — eine Übung für maximal 12 Kinder käme bei einer 7–25er-Gruppe durch, was der eigenen Spec-Vorgabe widerspricht |
| Volle Gruppenstärke | `Übung-Max ≥ Gruppe-Max` | Plausibel, aber die großzügig gesetzte Obergrenze schloss brauchbare Übungen aus |
| Ganze Spanne | zusätzlich `Übung-Min ≤ Gruppe-Min` | Zu streng — nur 3–4 verwendbare Übungen pro Phase |

**Konsequenz:** Das Gruppenprofil führt seit 2026-10-03 **eine** Teilnehmerzahl statt einer Spanne (Änderung an PROJ-5, dort dokumentiert). Damit entfällt die Ambiguität vollständig. Die Teilnehmer-**Spanne der Übungen** bleibt erhalten — dort ist sie sachlich richtig, weil eine Übung tatsächlich von 8 bis 25 Teilnehmern funktioniert.

### Auswahl innerhalb eines Segments

1. **Sportart-Rotation:** Pro Übungs-Slot wird eine Sportart aus den für das Segment gewählten Sportarten gezogen — in gemischter Reihenfolge, aber jede kommt dran, bevor sich eine wiederholt. Bei zwei getaggten Sportarten und drei Slots also A, B, A.

   **Gewichtung durch die Hauptsportart:** Maßgeblich ist die **Hauptsportart des Segments**, nicht die der Gruppe. Ist sie gesetzt, erscheint sie **zweimal** im Rotationszyklus, jede andere einmal. Bei den Sportarten [Capoeira, Kampfsport, Allgemeinsport] mit Hauptsportart Capoeira ergibt das den Zyklus [Capoeira, Capoeira, Kampfsport, Allgemeinsport] — also etwa jede zweite Übung aus der Hauptsportart, ohne dass die übrigen verschwinden. Ohne gesetzte Hauptsportart bleibt die Rotation gleichmäßig.

   Die Hauptsportart der **Gruppe** (optionales Feld aus PROJ-5) dient dabei nur als **Vorbelegung**: Beim Aufbau der Segmente wird sie in jedes Segment übernommen, sofern sie unter dessen Sportarten ist. Im Modus „Individuell" kann der Nutzer sie pro Segment ändern oder entfernen — etwa Allgemeinsport fürs Aufwärmen, Capoeira für den Hauptteil. Damit wirkt die Gewichtung in **beiden** Modi: im Standard über die Vorbelegung, bei „Individuell" sichtbar und steuerbar.

   Enthält ein Segment nur **eine** Sportart, entfällt die Hauptsportart automatisch — es gibt dann nichts zu gewichten. Dasselbe gilt, wenn die als Hauptsportart gesetzte Sportart aus dem Segment abgewählt wird.
2. **Frische-Regel:** Übungen, die in den **letzten zwei Einheiten dieser Gruppe** verwendet wurden, werden an das Ende des Pools sortiert — nicht ausgeschlossen, damit bei kleiner Datenbank keine unnötigen Lücken entstehen.
3. **Keine Dopplungen:** Innerhalb einer Einheit kommt keine Übung zweimal vor. Eine Hauptübung und eine ihrer eigenen Varianten gelten dabei als dieselbe Übung und schließen sich gegenseitig aus.
4. **Füllen:** Es werden Übungen gezogen, bis das Minutenbudget des Segments etwa erreicht ist.
5. **Dauer-Anpassung:** Die Restdifferenz wird auf die gewählten Übungen verteilt, **maximal ±25 % pro Übung**. Es gibt **keine Unter- oder Obergrenze für die Anzahl der Übungen** pro Segment und keine Mindestdauer — kurze Dehn-, Kräftigungs- und Koordinationsübungen müssen auswählbar bleiben. Wie viele Übungen entstehen, ergibt sich aus dem, was in der Datenbank liegt.
6. **Lücke bei Unterdeckung:** Lässt sich das Budget weder durch eine weitere Übung noch durch Streckung füllen, bleibt der Rest eine Lücke. Der Grund wird festgehalten und im Ergebnis in Alltagssprache ausgegeben.

### Kriterien lockern

Nur auf aktiven Klick des Nutzers („Mit gelockerten Kriterien erneut versuchen"). Gelockert werden ausschließlich die weichen Kriterien — zuerst der Schwierigkeitsgrad, dann die Sportart-Vorgabe. **Harte Kriterien bleiben hart**, insbesondere Material und Altersgruppe. Was gelockert wurde, wird im Ergebnis angezeigt, zum Beispiel „Sportart-Vorgabe gelockert: 2 Übungen aus Allgemeinsport ergänzt".

### Neu generieren

- Überschreibt denselben Einheiten-Datensatz — es entstehen keine verwaisten Entwürfe
- Die Konfiguration (Zeitverlauf, Sportarten, Schwierigkeitsgrade) bleibt erhalten; der Nutzer bekommt eine andere Übungsauswahl, nicht eine andere Struktur
- Hat der Nutzer einen **Entwurf** bereits manuell bearbeitet, erscheint vorher die Warnung „Deine Änderungen an dieser Einheit werden überschrieben." Bei einer **gespeicherten** Einheit entfällt die Warnung: Dort entsteht ein neuer Entwurf daneben, die gespeicherte Fassung bleibt unangetastet

## Datenmodell

### Einheit

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Name | Text | Ja | Automatisch aus Gruppe und Erstelldatum („Kinderturnen – 3. Okt 2026"), später umbenennbar |
| Gruppe | Referenz | Ja | Verweis auf das Gruppenprofil |
| Gesamtdauer | Zahl (Minuten) | Ja | Übernommen aus der Einheitsdauer der Gruppe |
| Erstellt / Zuletzt bearbeitet | Zeitstempel | Ja | — |

### Segment (pro Einheit, mehrere, sortiert)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Name (Phase) | Text | Ja | Aus vordefinierten oder eigenen Phasen |
| Dauer | Zahl (Minuten) | Ja | Budget des Segments |
| Modus | Auswahl | Ja | „füllen" oder „frei lassen" |
| Sportarten | Liste | Ja | Für dieses Segment gewählte Sportarten (mind. 1) |
| Schwierigkeitsgrade | Liste | Ja | Für dieses Segment gewählte Grade |
| Lücken-Grund | Text | Nein | Gespeicherte Begründung, falls das Segment nicht gefüllt werden konnte |
| Reihenfolge | Zahl | Ja | Position auf dem Zeitverlauf |

### Einheiten-Eintrag (pro Segment, mehrere, sortiert)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Übung | Referenz | Ja | **Verweis** auf die Übung, keine Kopie |
| Variante | Referenz | Nein | Gesetzt, wenn eine Variante statt der Hauptübung gewählt wurde |
| Plandauer | Zahl (Minuten) | Ja | Die vom Generator angepasste Dauer — **am Eintrag gespeichert**, nicht neu berechnet |
| Reihenfolge | Zahl | Ja | Position im Segment |

### Übungsverwendung (Datengrundlage für die Frische-Regel und PROJ-10)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| Übung | Referenz | Ja | Welche Übung |
| Gruppe | Referenz | Ja | Für welche Gruppe |
| Einheit | Referenz | Ja | In welcher Einheit |
| Verwendet am | Zeitstempel | Ja | Wann |

Dieser Datensatz löst nebenbei die offene Frage aus PROJ-3 nach der Sortierung „Zuletzt verwendet" in der Übungsübersicht.

### Verweis statt Kopie

Eine Einheit verweist auf ihre Übungen und kopiert sie nicht. Korrigiert der Nutzer einen Tippfehler in einer Übungsbeschreibung, wirkt das sofort in allen Einheiten. Einzige Ausnahme ist die Plandauer, die am Einheiten-Eintrag festgeschrieben wird, damit sich ein fertiger Stundenverlauf nicht verschiebt, wenn die geschätzte Dauer der Übung später angepasst wird.

Beim Löschen einer Übung greift die in PROJ-3 vorgesehene Warnung, jetzt mit konkreten Namen: „Diese Übung wird in 2 Einheiten verwendet: Kinderturnen – 3. Okt, Volleyball U14 – 5. Okt." Bestätigt der Nutzer, bleibt an der Stelle ein Platzhalter „Übung gelöscht" mit Button zum Nachbesetzen — die Einheit wird nicht stillschweigend kürzer.

## Acceptance Criteria

### Einstieg und Konfiguration
- [ ] Angenommen der Nutzer ist auf der Detailseite einer Gruppe, wenn er auf „Einheit generieren" klickt, dann öffnet sich die Konfigurationsseite mit dieser Gruppe vorausgefüllt
- [ ] Angenommen der Nutzer ist auf der Startseite, wenn er den Einheitengenerator öffnet, dann muss er zuerst eine Gruppe auswählen, bevor er generieren kann
- [ ] Angenommen der Nutzer hat eine Gruppe ausgewählt, wenn die Konfigurationsseite geladen ist, dann sieht er eine Zusammenfassung von Sportarten, Altersgruppen, Teilnehmerzahl, Einheitsdauer und Hallenmaterial dieser Gruppe
- [ ] Angenommen der Nutzer öffnet die Konfigurationsseite, wenn er nichts verändert, dann ist „Standard" vorausgewählt und er kann direkt generieren
- [ ] Angenommen die Gruppe hat eine Einheitsdauer von 60 Minuten, wenn „Standard" gewählt ist, dann entstehen die Segmente Aufwärmen 12 Min, Hauptteil 36 Min und Cool-Down 12 Min
- [ ] Angenommen der Nutzer wählt „Individuell", wenn die Auswahl greift, dann klappt der Zeitverlauf auf und die Segmente sind bearbeitbar
- [ ] Angenommen der Nutzer hat im Zeitverlauf Segmente bearbeitet, wenn er auf „Standard" und danach wieder auf „Individuell" wechselt, dann ist sein Bearbeitungsstand unverändert erhalten
- [ ] Angenommen der Nutzer hat den Zeitverlauf bearbeitet, wenn er auf „Auf Standard zurücksetzen" klickt, dann liegt wieder die klassische Verteilung 20/60/20 vor und er bleibt im individuellen Modus
- [ ] Angenommen der Nutzer wechselt die Gruppe, wenn die neue Gruppe eine andere Einheitsdauer hat, dann wird der Aufbau auf „Standard" zurückgesetzt und ein alter Bearbeitungsstand verworfen

### Zeitverlauf
- [ ] Angenommen der Zeitverlauf ist offen, wenn der Nutzer eine Segmentgrenze verschiebt, dann ändern sich die Minutenwerte der angrenzenden Segmente entsprechend und die Summe bleibt gleich der Einheitsdauer
- [ ] Angenommen der Zeitverlauf ist offen, wenn der Nutzer ein Segment hinzufügt, dann kann er dessen Namen, Dauer, Modus, Sportarten, Schwierigkeitsgrade und Notiz festlegen
- [ ] Angenommen der Zeitverlauf hat mehrere Segmente, wenn der Nutzer ein Segment im Balken seitwärts auf die Position eines anderen zieht und loslässt, dann steht es an der neuen Position und behält seine Minuten
- [ ] Angenommen der Nutzer zieht ein Segment, wenn er noch nicht losgelassen hat, dann ist die Zielposition markiert, die Reihenfolge aber noch unverändert
- [ ] Angenommen ein Segment ist mit der Tastatur fokussiert, wenn der Nutzer Alt und eine Pfeiltaste drückt, dann verschiebt sich das Segment um eine Position
- [ ] Angenommen der Nutzer tippt ein Segment nur an ohne zu ziehen, dann wird es ausgewählt und der zugehörige Einstellbereich geöffnet
- [ ] Angenommen der Nutzer setzt ein Segment auf „frei lassen" und schreibt eine Notiz, wenn er generiert, dann erscheint die Notiz im Stundenverlauf an dieser Stelle
- [ ] Angenommen der Nutzer benennt ein Segment, wenn er die Namensauswahl öffnet, dann sieht er die vordefinierten Phasen und seine eigenen Phasen und kann eine neue eigene Phase anlegen
- [ ] Angenommen der Nutzer setzt ein Segment auf „frei lassen", wenn er generiert, dann bleibt dieses Segment im Ergebnis leer und ist als Lücke gekennzeichnet
- [ ] Angenommen der Nutzer setzt mehrere Segmente an verschiedenen Stellen auf „frei lassen", wenn er generiert, dann bleiben alle diese Segmente leer
- [ ] Angenommen der Nutzer öffnet die Sportart-Auswahl eines Segments, wenn die Liste erscheint, dann stehen die Sportart-Tags der Gruppe oben und sind angehakt
- [ ] Angenommen der Nutzer entfernt alle Haken in der Sportart-Auswahl eines Segments, wenn er speichern oder generieren will, dann wird er darauf hingewiesen, dass mindestens eine Sportart ausgewählt sein muss
- [ ] Angenommen der Nutzer schränkt den Schwierigkeitsgrad eines Segments auf „Leicht" ein, wenn er generiert, dann enthält dieses Segment nur Übungen mit Schwierigkeitsgrad „Leicht"

### Auswahl der Übungen
- [ ] Angenommen ein Segment heißt „Aufwärmen", wenn der Generator läuft, dann werden nur Übungen vorgeschlagen, deren Phasen-Tags „Aufwärmen" enthalten
- [ ] Angenommen eine Übung ist mit den Sportarten „Volleyball" und „Kinderspiele" getaggt und die Gruppe nur mit „Volleyball", wenn der Generator läuft, dann gilt die Übung als Treffer, weil ein Wert genügt
- [ ] Angenommen die Gruppe ist mit „Kinder (4–6)" getaggt und eine Übung nur mit „Senioren (60+)", wenn der Generator läuft, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen eine Übung benötigt 10 Hütchen insgesamt und die Halle hat nur 6, wenn der Generator läuft, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen eine Übung benötigt 1 Ball pro Teilnehmer und die Gruppe hat eine Teilnehmerzahl von 20, wenn die Halle nur 12 Bälle hat, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen der Gruppe ist keine Halle zugewiesen, wenn der Generator läuft, dann wird das Material-Kriterium nicht angewendet und Übungen werden unabhängig vom Material vorgeschlagen
- [ ] Angenommen zwei Übungen im selben Segment benötigen beide 8 Hütchen und die Halle hat 8, wenn der Generator läuft, dann sind beide zulässig, weil Material nicht kumulativ geprüft wird
- [ ] Angenommen die Gruppe hat 20 Teilnehmer und eine Übung ist für maximal 8 Teilnehmer ausgelegt, wenn der Generator läuft, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen eine Übung hat keine Teilnehmerzahl hinterlegt, wenn der Generator läuft, dann wird das Teilnehmer-Kriterium für diese Übung übersprungen
- [ ] Angenommen die Gruppe hat eine Teilnehmerzahl von 20 und eine Übung braucht mindestens 25 Teilnehmer, wenn der Generator läuft, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen die Gruppe hat keine Teilnehmerzahl hinterlegt, wenn der Generator läuft, dann entfallen das Teilnehmer-Kriterium und die Prüfung von Material „pro Teilnehmer"
- [ ] Angenommen eine Variante trägt eine abweichende Altersgruppe, die zur Gruppe passt, während die Hauptübung nicht passt, wenn der Generator läuft, dann kann die Variante als Kandidat vorgeschlagen werden
- [ ] Angenommen eine Variante hat eigenes Material eingetragen, wenn der Generator ihr Material prüft, dann gilt ausschließlich die Materialliste der Variante und nicht die der Hauptübung
- [ ] Angenommen eine Variante hat kein eigenes Material eingetragen, wenn der Generator ihr Material prüft, dann gilt das Material der Hauptübung
- [ ] Angenommen eine Hauptübung und eine ihrer Varianten passen beide, wenn der Generator die Einheit füllt, dann erscheint nur eine von beiden in der Einheit
- [ ] Angenommen das Segment hat drei Übungs-Slots und die Gruppe ist mit zwei Sportarten getaggt, wenn der Generator läuft, dann werden beide Sportarten genutzt, bevor sich eine wiederholt
- [ ] Angenommen ein Segment hat eine Hauptsportart gesetzt, wenn der Generator es mit vier Übungen füllt, dann stammen etwa zwei davon aus der Hauptsportart und die übrigen aus den anderen gewählten Sportarten
- [ ] Angenommen kein Segment hat eine Hauptsportart gesetzt, wenn der Generator läuft, dann rotieren alle gewählten Sportarten gleichmäßig
- [ ] Angenommen die Gruppe hat eine Hauptsportart, wenn der Nutzer den Zeitverlauf öffnet, dann ist sie in jedem Segment vorbelegt, das diese Sportart enthält
- [ ] Angenommen der Nutzer setzt in einem Segment eine andere Hauptsportart als die der Gruppe, wenn der Generator läuft, dann gilt für dieses Segment die dort gewählte
- [ ] Angenommen der Nutzer wählt die Hauptsportart eines Segments aus dessen Sportarten ab, dann wird die Hauptsportart dieses Segments automatisch geleert
- [ ] Angenommen ein Segment hat nur eine Sportart ausgewählt, wenn der Nutzer den Einstellbereich öffnet, dann wird keine Hauptsportart-Auswahl angeboten

### Zeitbudget und Dauer
- [ ] Angenommen ein Segment hat 12 Minuten Budget und die gewählte Übung ist auf 10 Minuten geschätzt, wenn der Generator die Dauer anpasst, dann steht die Übung mit 12 Minuten Plandauer im Plan und die geschätzten 10 Minuten bleiben sichtbar
- [ ] Angenommen eine Übung ist auf 10 Minuten geschätzt, wenn der Generator die Dauer anpasst, dann liegt die Plandauer zwischen 7,5 und 12,5 Minuten (±25 %)
- [ ] Angenommen in der Datenbank liegen nur Übungen mit 3 Minuten Dauer und das Cool-Down-Segment hat 12 Minuten, wenn der Generator läuft, dann werden mehrere kurze Übungen eingeplant, ohne dass eine Mindestdauer sie ausschließt
- [ ] Angenommen das Budget eines Segments lässt sich weder durch eine weitere Übung noch durch Streckung füllen, wenn der Generator fertig ist, dann bleibt der Rest als Lücke sichtbar

### Lücken und Lockern
- [ ] Angenommen für ein Segment findet der Generator keine passende Übung, wenn das Ergebnis angezeigt wird, dann sieht der Nutzer, wie viele Minuten ungefüllt blieben und aus welchem Grund in Alltagssprache
- [ ] Angenommen ein Segment konnte nicht gefüllt werden, wenn der Nutzer auf „Mit gelockerten Kriterien erneut versuchen" klickt, dann werden Schwierigkeitsgrad und Sportart-Vorgabe gelockert, während Material und Altersgruppe hart bleiben
- [ ] Angenommen mehrere Segmente haben eine Lücke, wenn der Nutzer in **einem** davon lockert, dann wird **nur dieses** Segment neu gefüllt und alle übrigen bleiben unverändert
- [ ] Angenommen das Lockern bringt in einem Segment nichts, wenn der Nutzer es versucht, dann wird ihm begründet, warum die Lücke bleibt
- [ ] Angenommen eine Lücke liegt nachweislich nur an Material oder Altersgruppe, wenn das Ergebnis angezeigt wird, dann wird das Lockern gar nicht erst angeboten und der Grund dafür genannt
- [ ] Angenommen der Nutzer hat die Kriterien gelockert, wenn das Ergebnis angezeigt wird, dann steht im Ergebnis, was gelockert wurde
- [ ] Angenommen ein Segment konnte nicht gefüllt werden, wenn das Ergebnis angezeigt wird, dann nennt der Hinweis **jede** beteiligte Ursache mit Anzahl und sagt zu jeder, was dagegen hilft

### Speichern, Anzeigen, Neu generieren
- [ ] Angenommen der Nutzer klickt auf „Einheit generieren", wenn die Generierung erfolgreich war, dann sieht er den Stundenverlauf als **Entwurf**, der noch nicht in seinen Übersichten erscheint
- [ ] Angenommen der Nutzer sieht einen Entwurf ohne Lücke, wenn er auf „Einheit speichern" klickt, dann erscheint ein Dialog mit dem bisherigen Namen vorausgefüllt
- [ ] Angenommen der Dialog ist offen, wenn der Nutzer den Namen ändert und bestätigt, dann liegt die Einheit unter diesem Namen in „Meine Einheiten" und auf der Gruppen-Detailseite
- [ ] Angenommen der Dialog ist offen, wenn der Nutzer nichts ändert und bestätigt, dann gilt der automatische Name aus Gruppe und Datum
- [ ] Angenommen der Nutzer bricht den Dialog ab, dann bleibt die Einheit ein Entwurf und der verworfene Name steht beim nächsten Öffnen nicht mehr im Feld
- [ ] Angenommen ein Segment im Modus „füllen" konnte nicht vollständig gefüllt werden, wenn der Nutzer den Entwurf ansieht, dann ist „Einheit speichern" gesperrt und es steht dort, welches Segment die Sperre auslöst
- [ ] Angenommen ein Segment ist bewusst auf „frei lassen" gesetzt, wenn der Nutzer den Entwurf ansieht, dann sperrt das „Einheit speichern" **nicht** — ein leer gelassener Abschnitt ist keine Lücke
- [ ] Angenommen „Einheit speichern" ist wegen einer Lücke gesperrt, wenn der Nutzer das Segment im Generator auf „frei lassen" stellt oder die Lücke schließt, dann lässt sich die Einheit speichern
- [ ] Angenommen der Nutzer öffnet das Menü einer Einheit, wenn er „Umbenennen" wählt und einen Namen eingibt, dann trägt die Einheit diesen Namen in allen Übersichten
- [ ] Angenommen der Nutzer öffnet das Menü einer Einheit, wenn er „Löschen" wählt und bestätigt, dann verschwindet die Einheit samt Segmenten und Einträgen, während seine Übungen erhalten bleiben
- [ ] Angenommen der Nutzer wählt „Löschen" und bricht ab, dann bleibt die Einheit unverändert
- [ ] Angenommen der Nutzer sieht eine Einheit, wenn er auf „Zurück zum Generator" klickt, dann ist die Konfigurationsseite mit genau deren Zeitverlauf und Einstellungen gefüllt und weiter bearbeitbar
- [ ] Angenommen die Einheit wurde im Modus „Standard" erzeugt, wenn der Nutzer zum Generator zurückkehrt, dann steht dort wieder „Standard" und nicht der aufgeklappte Zeitverlauf
- [ ] Angenommen beim Generieren war der Einstellbereich eines bestimmten Segments offen, wenn der Nutzer zum Generator zurückkehrt, dann ist genau dieser Bereich wieder offen
- [ ] Angenommen der Nutzer kommt über „Meine Einheiten" statt direkt aus dem Generator, wenn er „Zurück zum Generator" wählt, dann gilt dasselbe — der Bedienstand hängt an der Einheit, nicht an der Sitzung
- [ ] Angenommen ein Entwurf liegt vor, wenn der Nutzer erneut generiert, dann ersetzt der neue Vorschlag den alten und es sammelt sich kein zweiter Entwurf an
- [ ] Angenommen eine Einheit wurde **gespeichert**, wenn der Nutzer den Browser schließt und zurückkehrt, dann ist die Einheit noch vorhanden
- [ ] Angenommen ein Entwurf wurde verworfen, wenn der Nutzer eine neue Einheit generiert, dann zählt der Entwurf nicht für die Frische-Regel
- [ ] Angenommen eine Einheit wurde generiert, wenn sie gespeichert wird, dann trägt sie automatisch einen Namen aus Gruppenname und Erstelldatum
- [ ] Angenommen der Nutzer sieht einen **Entwurf**, wenn er auf „Neu generieren" klickt, dann wird dieser Entwurf mit einer anderen Übungsauswahl überschrieben und die Zeitverlauf-Konfiguration bleibt erhalten
- [ ] Angenommen der Nutzer sieht eine **gespeicherte** Einheit, wenn er auf „Neu generieren" klickt, dann bleibt diese unverändert im Ordner und der neue Vorschlag entsteht als Entwurf daneben
- [ ] Angenommen aus einer gespeicherten Einheit ist ein neuer Entwurf entstanden, wenn der Nutzer ihn speichert, dann liegt er als **zusätzliche** Einheit im Ordner, nicht als Ersatz
- [ ] Angenommen der Nutzer hat einen Entwurf bereits manuell bearbeitet, wenn er auf „Neu generieren" klickt, dann erscheint vorher eine Warnung, dass seine Änderungen überschrieben werden
- [ ] Angenommen eine gespeicherte Einheit wurde manuell bearbeitet, wenn der Nutzer auf „Neu generieren" klickt, dann erscheint **keine** Warnung — es geht nichts verloren, weil ein Entwurf daneben entsteht
- [ ] Angenommen der Nutzer sieht eine generierte Einheit, wenn er auf eine Übung klickt, dann öffnet sich die Detailseite dieser Übung
- [ ] Angenommen eine Übung in der Einheit hat Varianten, wenn der Stundenverlauf angezeigt wird, dann ist erkennbar, dass Varianten verfügbar sind
- [ ] Angenommen der Nutzer hat Einheiten für eine Gruppe generiert, wenn er die Gruppen-Detailseite öffnet, dann sieht er diese Einheiten mit Name, Erstelldatum, Gesamtdauer und Übungsanzahl, neueste zuerst

### Abwechslung
- [ ] Angenommen der Nutzer hat für eine Gruppe bereits zwei Einheiten generiert, wenn er eine dritte generiert, dann werden die Übungen aus den letzten zwei Einheiten nachrangig behandelt
- [ ] Angenommen die Datenbank enthält zu wenige passende Übungen, wenn der Generator läuft, dann werden kürzlich verwendete Übungen trotzdem eingeplant, anstatt das Segment leer zu lassen
- [ ] Angenommen eine Einheit wurde generiert, wenn sie gespeichert wird, dann wird für jede verwendete Übung festgehalten, für welche Gruppe und wann sie verwendet wurde

### Leerzustände
- [ ] Angenommen der Nutzer hat noch keine Gruppe angelegt, wenn er den Einheitengenerator öffnet, dann sieht er eine Erklärung und einen Button „Erste Gruppe anlegen"
- [ ] Angenommen der Nutzer hat noch keine Übungen angelegt, wenn er eine Einheit generieren will, dann sieht er eine Erklärung, dass der Generator aus der eigenen Datenbank schöpft, mit Button „Erste Übung anlegen" und Verweis auf die Starter-Datenbank

### Übung gelöscht
- [ ] Angenommen eine Übung wird in zwei Einheiten verwendet, wenn der Nutzer sie löschen will, dann nennt die Warnung die Namen der betroffenen Einheiten
- [ ] Angenommen der Nutzer löscht eine verwendete Übung trotz Warnung, wenn er danach die Einheit öffnet, dann steht an dieser Stelle ein Platzhalter „Übung gelöscht" mit Möglichkeit zum Nachbesetzen
- [ ] Angenommen der Nutzer ändert die Beschreibung einer Übung, wenn er eine Einheit öffnet, in der sie vorkommt, dann sieht er die aktualisierte Beschreibung
- [ ] Angenommen der Nutzer ändert die geschätzte Dauer einer Übung, wenn er eine bestehende Einheit öffnet, in der sie vorkommt, dann bleibt die dort gespeicherte Plandauer unverändert

### Datentrennung
- [ ] Angenommen zwei Nutzer sind registriert, wenn Nutzer A eine Einheit generiert, dann kann Nutzer B diese Einheit nicht sehen
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er den Einheitengenerator öffnet, dann wird er zum Login weitergeleitet
- [ ] Angenommen der Nutzer versucht eine Einheit für eine Gruppe zu generieren, die ihm nicht gehört, dann wird die Anfrage abgewiesen

## Edge Cases
1. **Keine Gruppe vorhanden:** Leerzustand mit Erklärung und Button „Erste Gruppe anlegen"; generieren ist nicht möglich
2. **Keine Übungen in der Datenbank:** Leerzustand mit Erklärung, Button „Erste Übung anlegen" und Verweis auf PROJ-4; generieren ist nicht möglich
3. **Segment mit neu angelegter eigener Phase:** Keine Übung trägt dieses Phasen-Tag, also bleibt das Segment leer — mit dem Hinweis, dass noch keine Übung dieser Phase zugeordnet ist. Bewusst so, weil das Lernmoment klar ist
4. **Gruppe nur mit einer Sportart getaggt:** Erhöht das Risiko leerer Segmente deutlich. Der Lücken-Hinweis weist darauf hin, dass eine breitere Auswahl an Sportarten mehr Treffer bringt
5. **Gruppe ohne Halle:** Material-Kriterium entfällt vollständig; alle übrigen Kriterien greifen normal
6. **Gruppe ohne Teilnehmerzahl:** Die Prüfung von `pro Teilnehmer`-Material entfällt, ebenso das Teilnehmer-Kriterium. Die Konfigurationsseite weist darauf hin
7. **Sehr kurze Einheitsdauer:** Bei 20 Minuten ergibt die klassische Verteilung 4 / 12 / 4 Minuten. Passt in ein Segment keine einzige Übung, bleibt es leer mit Hinweis — der Nutzer kann die Verteilung auf „Individuell" umstellen und Segmente zusammenlegen
8. **Segment kürzer als die kürzeste verfügbare Übung:** Segment bleibt leer, Grund wird genannt
9. **Alle Segmente auf „frei lassen":** Erlaubt — es entsteht eine leere Einheit als Gerüst, die der Nutzer in PROJ-7 selbst füllt
10. **Übung während des Generierens gelöscht:** Fällt einfach aus dem Pool; falls sie schon eingeplant war, greift die Platzhalter-Logik
11. **Übung mit widersprüchlicher Teilnehmerzahl (Min > Max):** In PROJ-3 durch Validierung ausgeschlossen; sollte so ein Datensatz dennoch existieren, fällt die Übung aus dem Pool statt den Generator abzubrechen
12. **Netzwerkfehler während des Generierens:** Fehlermeldung „Generieren fehlgeschlagen, bitte erneut versuchen"; die Konfiguration bleibt erhalten und es entsteht keine halb gespeicherte Einheit
13. **Nutzer verlässt die Konfigurationsseite:** Browser-Warnung über nicht gespeicherte Eingaben, sofern er den Zeitverlauf bearbeitet hat
14. **Nutzer generiert mehrfach schnell hintereinander:** Der Button wird während des Laufs gesperrt, damit nicht mehrere Einheiten gleichzeitig entstehen
15. **Zeitverlauf-Segment auf 0 Minuten gezogen:** Nicht erlaubt; ein Segment hat mindestens 1 Minute oder muss entfernt werden

## Technical Requirements
- **Authentifizierung:** Alle Endpoints erfordern einen eingeloggten Nutzer
- **Row Level Security:** Jeder Nutzer sieht und bearbeitet nur seine eigenen Einheiten; die Gruppenzugehörigkeit wird serverseitig geprüft
- **Performance:** Generierung in unter 2 Sekunden bei bis zu 150 Kandidaten (Hauptübungen plus Varianten); Laden einer gespeicherten Einheit in unter 500 ms
- **Mobile:** Alle Views responsiv. Der Zeitverlauf muss auf Smartphone-Breite (375 px) bedienbar sein — als Rückfallebene zu den ziehbaren Grenzen gibt es pro Segment ein Minutenfeld zur direkten Eingabe
- **Nachvollziehbarkeit:** Der Grund für jede Lücke wird am Segment gespeichert, nicht nur flüchtig angezeigt
- **Keine Eigenentwicklung ohne Not:** Die Multi-Select-Komponente aus PROJ-3 wird für Sportarten, Schwierigkeitsgrade und Phasennamen wiederverwendet. Der Zeitverlauf ist die einzige echte Eigenentwicklung

## Open Questions
- [ ] **Hilfe- und Tutorial-Feature:** Die App muss dem Nutzer die sinnvolle Nutzung aktiv vermitteln — eine Gruppe nicht mit nur einer Sportart taggen, nicht jede Stunde braucht alle Phasen, und die geschätzte Übungsdauer muss Umbau- und Erklärzeit einschließen. Soll das ein eigenes Feature werden (neue PROJ-ID) oder in bestehende Leerzustände und Hinweise verteilt bleiben?
- [x] **Hinweis im Übungsformular (PROJ-3):** Erledigt am 2026-10-04 — unter dem Dauer-Feld im Wizard steht jetzt, dass Umbau, Aufstellen und Erklären mitzählen und die Einheiten sonst in der Halle überlaufen.
- [x] Soll die Zeitverlauf-Konfiguration später als wiederverwendbare Vorlage gespeichert werden können (etwa „mein Volleyball-Schema")? — **Ja**, entschieden am 2026-10-04 nach dem ersten echten Test. Umgesetzt wird das als **PROJ-17 „Stundenmuster"** mit eigener Spec, nicht in PROJ-6
- [ ] Wie viele Einheiten pro Gruppe werden in der Liste auf der Gruppen-Detailseite angezeigt, bevor ein „Mehr laden" nötig wird? — Vorerst **alle**, neueste zuerst. Mit einer Einheit pro Woche und Gruppe braucht es Jahre, bis die Liste störend wird; ein Nachladen jetzt zu bauen wäre Aufwand ohne erkennbaren Nutzen. Neu zu entscheiden, sobald PROJ-9 (Kalenderansicht) die Einheiten ohnehin anders darstellt
- [ ] Sollen Musik-Hinweise („Musik benötigt") im Stundenverlauf besonders hervorgehoben werden, damit der Nutzer vor der Stunde weiß, dass er eine Box braucht?
- [ ] Ist die Frische-Regel mit „letzten zwei Einheiten" die richtige Tiefe, oder zeigt der echte Einsatz, dass mehr Gedächtnis nötig ist? Bewusst erst nach Praxiserfahrung zu entscheiden

### Neu aus der Architektur-Phase
- [ ] **Trägt der Zeitverlauf auch PROJ-7?** Der Editor muss voraussichtlich Übungen zwischen Segmenten verschieben können. Das ist ein anderes Interaktionsmodell (Ziehen von Inhalten) als das Verschieben von Segmentgrenzen. Ob dafür dieselbe Grundlage reicht oder ein zusätzliches Paket nötig wird, sollte beim Entwurf von PROJ-7 entschieden werden — nicht vorab auf Vermutung
- [x] **Wie viele Segmente bleiben auf dem Zeitverlauf bedienbar, besonders auf Smartphone-Breite?** — In der Geräte-Emulation bei 375 px geprüft: bis **fünf Segmente** gut lesbar und bedienbar. Eine harte Begrenzung ist damit vorerst nicht nötig. Offen bleibt, ob sich das bei acht und mehr Segmenten ändert und ob das Ziehen zum Umsortieren mit dem Finger auf echtem Glas so treffsicher ist wie mit der Maus — das braucht einen Test auf einem echten Gerät

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Einheit wird immer in Bezug auf eine Gruppe erstellt | Alle Matching-Kriterien (Sportart, Alter, Teilnehmer, Material, Dauer) stammen aus dem Gruppenprofil; ohne Gruppe hat der Generator keine Grundlage | 2026-10-03 |
| Zwei Einstiegspunkte: Gruppen-Detailseite und Startseite | Über die Gruppe ist der Weg kürzer (vorausgefüllt), über die Startseite ist der Generator als Hauptfunktion sichtbar — entspricht seiner Rolle als Herzstück der App | 2026-10-03 |
| Ein Zeitverlauf für Umfang und Phasenverteilung statt zwei getrennter Schritte | Beide beschreiben dieselbe Zeitachse; zwei Regler-Widgets über denselben 60 Minuten hätten den Nutzer gezwungen, zwei Modelle zusammenzudenken, und dieselbe Mechanik zweimal nötig gemacht. Eine Lücke ist nun einfach ein Segment, das nicht gefüllt wird | 2026-10-03 |
| Standardweg bleibt ein Klick (volle Dauer, klassisch 20/60/20) | Die PRD verspricht „auf Knopfdruck" für Ehrenamtliche mit wenig Zeit; der Zeitverlauf klappt nur bei „Individuell" auf | 2026-10-03 |
| **Eine** Auswahl „Standard / Individuell" statt zwei Blöcken „Umfang" und „Phasenverteilung" | Beide klappten denselben Editor auf, die Trennung machte also keinen Unterschied und verlangte nur eine Entscheidung mehr. Nach dem ersten Praxisblick zusammengelegt | 2026-10-03 |
| Individueller Bearbeitungsstand wird über den Wechsel zu „Standard" hinweg behalten | Wer seinen Zeitverlauf aufgebaut hat und nur kurz die Standardvariante sehen will, darf diese Arbeit nicht verlieren. Standardvorlage und individueller Stand werden getrennt gehalten | 2026-10-03 |
| Eigener Button „Auf Standard zurücksetzen" | Weil der individuelle Stand jetzt erhalten bleibt, braucht es einen bewussten Weg ihn zu verwerfen — sonst gäbe es keinen Zurück-Weg aus einem verfahrenen Zeitverlauf | 2026-10-03 |
| Umsortieren durch Ziehen im Balken statt über Pfeil-Buttons | Die zwei Pfeile pro Segment waren Dauerinventar für eine seltene Handlung. Ziehen ist am Balken räumlich eindeutig („dieser Block nach vorne") und spart zwei Bedienelemente pro Segment | 2026-10-03 |
| Arbeitsnotiz pro Segment | Ein frei bleibendes Segment hatte sonst keinen Inhalt — der Nutzer konnte nirgends festhalten, was er dort vorhat. Erscheint im fertigen Stundenverlauf, damit sie in der Halle sichtbar ist. Benannt wie das Arbeitsnotizen-Feld bei Übungen, damit derselbe Begriff dasselbe bedeutet | 2026-10-03 |
| Begriff „Zeitverlauf" statt „Zeitstrahl" | „Zeitstrahl" klingt nach Mathematikunterricht; „Zeitverlauf" beschreibt, was der Übungsleiter dort tatsächlich sieht — den Ablauf seiner Stunde | 2026-10-03 |
| Phasennamen im Einstellbereich größer gesetzt | Bei fünf Segmenten war die Liste schwer zu überblicken, weil Name und Minutenwert gleich klein waren | 2026-10-03 |
| Klassische Verteilung prozentual (20/60/20), nicht in festen Minuten | Skaliert automatisch mit jeder Einheitsdauer; feste Minuten wären bei 30- oder 120-Minuten-Einheiten unpassend | 2026-10-03 |
| Phasenverteilung gehört zur Einheit, nicht zum Gruppenprofil | Dieselbe Gruppe kann je Woche ein anderes Stundenbild brauchen; außerdem bleibt PROJ-5 unangetastet | 2026-10-03 |
| Segmentname aus Phasenliste wählbar, kein Freitext | Der Name ist das Matching-Kriterium gegen die Phasen-Tags der Übungen; Freitext würde zuverlässig null Treffer erzeugen. Eigene Phasen bleiben über `custom_categories` möglich | 2026-10-03 |
| Harte Kriterien: Phase, Altersgruppe, Material, Teilnehmerzahl | Diese entscheiden über Durchführbarkeit und Angemessenheit — eine Senioren-Übung im Kinderturnen ist falsch, und ohne Gerät ist eine Übung nicht machbar | 2026-10-03 |
| Weiche Kriterien: Sportart und Schwierigkeitsgrad | Ein allgemeines Laufspiel passt auch ins Volleyball-Aufwärmen; strikte Filterung würde bei kleinen Datenbanken zu viele Segmente leer lassen | 2026-10-03 |
| „Weich" bei Sportart heißt Rotation innerhalb der Gruppen-Tags, nicht Fallback | Vom Nutzer so festgelegt: die getaggten Sportarten der Gruppe wechseln sich ab, statt dass eine bevorzugt und der Rest nur im Notfall genutzt wird. Erzeugt echte Abwechslung statt Rangfolge | 2026-10-03 |
| Sportart-Rotation pro Übungs-Slot, nicht pro Phase | Gibt innerhalb eines Segments mehr Abwechslung; bei drei Slots und zwei Sportarten kommen beide dran | 2026-10-03 |
| Optionale Hauptsportart am Gruppenprofil, in der Rotation doppelt gewichtet (Änderung an PROJ-5) | Gleichmäßige Rotation macht bei einer Capoeira-Gruppe mit fünf Tags nur jede fünfte Übung zu Capoeira. Die Sportart-Auswahl pro Segment löst das zwar, greift aber nur im Modus „Individuell" und damit nicht auf dem Ein-Klick-Weg. Doppelte Gewichtung statt Priorisierung, weil die Entscheidung für echte Abwechslung statt Rangfolge bestehen bleiben soll | 2026-10-04 |
| Hauptsportart zusätzlich **pro Segment** einstellbar; die der Gruppe ist nur Vorbelegung | In der ersten Fassung wirkte die Hauptsportart der Gruppe auch bei „Individuell", aber unsichtbar und unveränderlich — der Nutzer konnte nicht erkennen, dass sie greift, und sie nicht pro Phase umlenken. Jetzt lässt sich etwa Allgemeinsport fürs Aufwärmen und Capoeira für den Hauptteil gewichten. Konsistent zu Sportart und Schwierigkeitsgrad, die pro Segment schon überschreibbar waren | 2026-10-04 |
| Hauptsportart entfällt automatisch bei nur einer Sportart im Segment | Bei einer einzigen Sportart gibt es nichts zu gewichten; die Auswahl anzubieten wäre eine leere Entscheidung | 2026-10-04 |
| Sportart und Schwierigkeitsgrad pro Segment überschreibbar, mindestens eine Sportart Pflicht | Erlaubt gezielte Stundenbilder (allgemeines Aufwärmen, sportartspezifischer Hauptteil), ohne den Ein-Klick-Weg zu belasten. Null Sportarten wären eine sinnlose Konfiguration | 2026-10-03 |
| OR-Matching innerhalb einer Kategorie | Eine Übung mit mehreren Sportart-Tags muss nur einen Treffer haben; alles andere würde breit getaggte Übungen systematisch benachteiligen | 2026-10-03 |
| Material wird pro Übung geprüft, nicht kumulativ über das Segment | Übungen laufen nacheinander ab und konkurrieren nicht um dasselbe Material | 2026-10-03 |
| Gruppenprofil führt **eine** Teilnehmerzahl statt einer Min/Max-Spanne (Änderung an PROJ-5) | Das Teilnehmer-Kriterium und die Materialrechnung „pro Teilnehmer" brauchen genau einen Wert. Mit echten Testdaten ergaben die drei denkbaren Lesarten der Spanne zwischen 3 und 6 verwendbaren Übungen pro Phase — die Ambiguität musste weg, bevor der Algorithmus darauf aufbaut. Begründung und Migration in PROJ-5 dokumentiert | 2026-10-03 |
| Generator darf Übungsdauern um maximal ±25 % anpassen | Das Feld ist in PROJ-3 ausdrücklich als *geschätzte* Dauer definiert; ohne Anpassung ließe sich fast kein Segmentbudget exakt treffen | 2026-10-03 |
| Keine Mindest- oder Höchstzahl an Übungen pro Segment, keine Mindestdauer | Eine Mindestdauer hätte kurze Dehn-, Kräftigungs- und Koordinationsübungen ganz vom Generator ausgeschlossen. Übungsdauer und Charakter der Sportart verhindern in der Praxis zu hohe Plandichte; Härtefälle korrigiert der Nutzer im Editor | 2026-10-03 |
| Bei Unterdeckung Lücke lassen statt Kriterien still aufzuweichen | Stilles Aufweichen erzeugt unpassende Einheiten und zerstört das Vertrauen in die Vorschläge; eine erklärte Lücke ist ehrlicher und zeigt dem Nutzer, was er verbessern kann | 2026-10-03 |
| Lücken-Hinweis nennt den Grund in Alltagssprache und bietet Handlungsoptionen | Die Zielgruppe hat keine Trainerausbildung und würde eine technische Meldung nicht in eine Handlung übersetzen können | 2026-10-03 |
| Lockern nur auf aktiven Klick, harte Kriterien bleiben hart | Der Nutzer entscheidet bewusst, einen schlechteren Treffer zu akzeptieren; Material und Altersgruppe bleiben ausgenommen, weil sie über Durchführbarkeit entscheiden | 2026-10-03 |
| Varianten sind vollwertige Kandidaten | Abweichende Altersgruppen und Teilnehmerzahlen sind genau dafür gedacht, eine Übung für eine andere Gruppe nutzbar zu machen; sie zu ignorieren hätte das Varianten-Feature aus PROJ-3 für den Generator wertlos gemacht. Performance ist dabei kein Thema — der Pool wächst nur von etwa 60 auf 150 Einträge | 2026-10-03 |
| Variantenmaterial **ersetzt** die Materialliste der Hauptübung (Regel A) | Eindeutig und vorhersehbar; der Nutzer sieht im Plan sofort die vollständige benötigte Materialliste, ohne sie im Kopf zusammenzurechnen. Material ist ein hartes Kriterium, da darf keine Auslegungsfrage bleiben | 2026-10-03 |
| Variantenmaterial erbt per Standard und wird erst auf Klick kopiert | Vermeidet Abtippen beim Abweichen und gleichzeitig stilles Auseinanderlaufen, wenn das Material der Hauptübung später geändert wird | 2026-10-03 |
| Hauptübung und eigene Variante schließen sich in einer Einheit aus | Sonst stünde praktisch dieselbe Übung zweimal im Plan | 2026-10-03 |
| Einheit wird sofort beim Generieren gespeichert | Der Nutzer verliert nichts bei Absturz oder Weglegen des Handys; PROJ-7 arbeitet auf einem echten Datensatz statt auf flüchtigem Zustand; PROJ-9 und PROJ-14 brauchen gespeicherte Einheiten ohnehin | 2026-10-03 |
| Einheit verweist auf Übungen statt sie zu kopieren | Eine Korrektur an der Übung wirkt sofort in allen Plänen; mit Kopien müsste der Nutzer jede Korrektur in jedem Plan nachziehen | 2026-10-03 |
| Plandauer wird am Einheiten-Eintrag festgeschrieben | Sonst würde sich ein fertiger Stundenverlauf verschieben, nur weil der Nutzer später die Schätzdauer der Übung angepasst hat | 2026-10-03 |
| Gelöschte Übung hinterlässt Platzhalter statt die Einheit zu kürzen | Der Nutzer soll merken, dass eine Lücke entstanden ist, und sie nachbesetzen können; stilles Kürzen würde einen Plan unbemerkt unbrauchbar machen | 2026-10-03 |
| „Neu generieren" überschreibt denselben Datensatz | Verhindert eine Liste verwaister Entwürfe; Warnung schützt bereits bearbeitete Einheiten | 2026-10-03 |
| Keine Mehrfachvorschläge (A/B/C) zur Auswahl | Verdoppelt die Rechenlast und zwingt zu einer Vergleichsentscheidung, obwohl der Nutzer eine fertige Stunde will | 2026-10-03 |
| Kein Datumsfeld in PROJ-6 | Die Zuordnung zu einem Trainingstermin ist genau die Aufgabe von PROJ-9; ein viertes Feld hätte den Ein-Klick-Weg verwässert | 2026-10-03 |
| Automatischer Einheitenname aus Gruppe und Erstelldatum | Der Nutzer muss beim Generieren nichts eintippen; Umbenennen bleibt möglich | 2026-10-03 |
| Minimale Frische-Regel in PROJ-6: letzte zwei Einheiten nachrangig | Das Abwechslungsversprechen der PRD muss schon im MVP erlebbar sein, sonst wirkt die App bei zwei aufeinanderfolgenden Wochen beliebig. Die vollständige Rotationsstrategie bleibt PROJ-10 | 2026-10-03 |
| Kürzlich verwendete Übungen nach hinten sortieren, nicht ausschließen | Bei kleiner Datenbank würde Ausschließen die Lücken-Problematik verschärfen | 2026-10-03 |
| Übungsverwendung wird protokolliert | Grundlage für die Frische-Regel und für PROJ-10; löst nebenbei die offene Frage aus PROJ-3 nach der Sortierung „Zuletzt verwendet" | 2026-10-03 |
| Einzelne Übung tauschen gehört zu PROJ-7 | Das ist Bearbeiten am fertigen Plan; die Auswahlfunktion dahinter entsteht in PROJ-6 und wird wiederverwendet | 2026-10-03 |
| Zeitverlauf auf Mobil mit Minutenfeld als Rückfallebene | Ziehbare Grenzen auf 375 px Breite sind fehleranfällig; ein direktes Zahlenfeld garantiert Bedienbarkeit | 2026-10-03 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Zeitverlauf auf der shadcn-Komponente „Resizable" statt Eigenentwicklung | Die Zieh-Mathematik samt Maus-, Touch- und Tastaturbedienung und konstanter Gesamtsumme ist der aufwendigste und fehleranfälligste Teil und bereits fertig vorhanden. Entspricht außerdem der Projektregel „shadcn/ui zuerst". Korrigiert die Annahme der Spec, der Zeitverlauf sei reine Eigenentwicklung | 2026-10-03 |
| Minutenwerte sind die Wahrheit, Prozentwerte nur Anzeige | Ohne diese Richtung würde sich eine 60-Minuten-Einheit durch Rundungsfehler beim Ziehen schleichend auf 59 oder 61 Minuten verschieben | 2026-10-03 |
| Rundungsdifferenz geht immer an das längste Segment | Garantiert, dass die Segmentsumme exakt der Einheitsdauer entspricht, und wirkt sich relativ am geringsten aus | 2026-10-03 |
| Auswahlalgorithmus strikt von der Datenbankanbindung getrennt (reine Logik) | 56 Akzeptanzkriterien beschreiben überwiegend Auswahlverhalten. Nur als reine Logik sind sie vollständig und schnell automatisiert testbar, ohne für jeden Fall Testdaten in einer Datenbank anzulegen. Bei dieser Komplexität der Unterschied zwischen beherrschbar und unbeherrschbar | 2026-10-03 |
| Zufall wird als Startwert hineingegeben, nicht im Generator erzeugt | Macht Tests reproduzierbar, erlaubt „Neu generieren" durch einfaches Wechseln des Startwerts und macht gemeldete Ergebnisse exakt nachstellbar | 2026-10-03 |
| Verwendeter Zufalls-Startwert wird an der Einheit gespeichert | Ein konkretes Ergebnis bleibt dadurch rekonstruierbar, etwa zur Fehlersuche | 2026-10-03 |
| Generierung als Server Action, nicht im Browser | Der Kandidatenpool (alle Übungen mit Material und Varianten) müsste sonst vollständig in den Browser geladen werden — langsam und unnötige Datenherausgabe. Gleiches Muster wie PROJ-3 und PROJ-5 | 2026-10-03 |
| Vier eigene Tabellen: Einheit, Segment, Eintrag, Übungsverwendung | Segmente und Einträge sind strukturierte, sortierte Listen mit mehreren Feldern und Fremdverweisen; als JSONB wären Verweise auf Übungen und deren Löschbehandlung nicht sauber abbildbar | 2026-10-03 |
| Übungsverwendung als eigene Tabelle statt aus den Einheiten errechnet | „Welche Übungen hat diese Gruppe zuletzt gesehen" wird damit eine einfache schnelle Abfrage, statt bei jedem Generieren alle Einheiten mit allen Segmenten und Einträgen zu durchsuchen | 2026-10-03 |
| Gesamtdauer wird in die Einheit kopiert, nicht aus der Gruppe gelesen | Ändert der Nutzer später die Einheitsdauer seiner Gruppe, dürfen bestehende Einheiten sich nicht nachträglich verschieben | 2026-10-03 |
| Eine einzige gemeinsame Stelle berechnet die effektiven Variantendaten | Die Regel „Variantenmaterial ersetzt" an mehreren Orten nachzubauen würde garantiert auseinanderlaufen; bei einem harten Auswahlkriterium wie Material wäre das ein echter Fehler. Wird auch von PROJ-7 genutzt | 2026-10-03 |
| Schreiben mit Aufräumschritt statt unteilbarer Datenbankfunktion | Das Projekt schreibt in PROJ-3 und PROJ-5 bereits so in mehrere Tabellen; der Aufräumschritt deckt die realistischen Fehlerfälle ab, und ein Fehlschlag ist folgenlos, weil der Nutzer einfach erneut generiert. Eine Datenbankfunktion wäre Komplexität ohne Gewinn | 2026-10-03 |
| Gruppenzugehörigkeit und Übungsbesitz werden serverseitig geprüft | Die Gruppen-Kennung kommt aus einem Formularfeld und darf nicht als vertrauenswürdig gelten | 2026-10-03 |
| Markierung „manuell bearbeitet" an der Einheit | Grundlage für die Warnung beim Neu-Generieren; wird von PROJ-7 gesetzt und schon jetzt mit angelegt, damit der Editor nichts nachrüsten muss | 2026-10-03 |
| Routenbenennung `/units` | Folgt dem bestehenden Muster englischer Plural-Routen für deutsche Fachbegriffe wie `/exercises` und `/groups`; „sessions" wäre mit der Auth-Sitzung verwechselbar | 2026-10-03 |
| Variantenmaterial-Nacharbeit als eigener Commit auf PROJ-3 im Rahmen des PROJ-6-Baus | Es ist kein Blocker (die Semantik sitzt in der Zusammenführungsstelle), aber inhaltlich eine PROJ-3-Datei und sollte dort nachvollziehbar bleiben | 2026-10-03 |
| Nur ein neues Paket (`react-resizable-panels` über shadcn) | Supabase, Zod, shadcn/ui, Lucide, `date-fns`, Vitest und Playwright decken alles Übrige ab | 2026-10-03 |
| Umsortieren mit Pointer-Events selbst gebaut statt mit einer Drag-and-Drop-Bibliothek | Die Geometrie ist eindimensional — welches Segment liegt unter dieser X-Position — das sind wenige Zeilen. Pointer-Events decken Maus und Finger gemeinsam ab, ohne HTML5-Drag-and-Drop, das auf Touch gar nicht funktioniert. `dnd-kit` hätte zwei Pakete für 2–6 sortierbare Elemente bedeutet, gegen die Projektlinie „keine neuen Pakete ohne Not" | 2026-10-03 |
| Umsortierung erst beim Loslassen übernehmen, nicht laufend | Eine laufende Übernahme ändert die Segment-Reihenfolge, was den Neuaufbau der Panel-Gruppe auslöst — mitten im Ziehen verliert der Finger dann das Segment. Während des Ziehens wird nur die Zielposition markiert | 2026-10-03 |
| `touch-action: pan-y` auf der Segmentfläche | Seitwärts-Wischen ist Umsortieren, Hoch-Wischen bleibt Seitenscrollen. Ohne diese Trennung wäre auf dem Handy entweder das Ziehen oder das Scrollen blockiert | 2026-10-03 |
| Alt + Pfeiltasten als Tastatur-Ersatz für das Ziehen | Mit dem Entfernen der Pfeil-Buttons wäre Umsortieren ohne Maus oder Touch sonst unmöglich geworden | 2026-10-03 |
| Frische-Regel geht der Sportart-Rotation vor, nicht umgekehrt | Die Spec numeriert Rotation als Schritt 1 und Frische als Schritt 2. Als Rangfolge gelesen würde eine kürzlich verwendete Übung der gezogenen Sportart eine frische Übung einer anderen gewählten Sportart verdrängen — genau das, was die Frische-Regel verhindern soll. Umgekehrt bleiben beide Akzeptanzkriterien erfüllt: die Rotation ordnet innerhalb der frischen Übungen | 2026-10-04 |
| Die gezogene Sportart ist eine Vorliebe, kein Ausschluss | Gibt es für sie keine passende Übung, nimmt der Generator eine andere gewählte Sportart. Sonst entstünden Lücken, obwohl passende Übungen im Pool liegen — und die Spec verlangt Lücken nur, wenn wirklich nichts passt | 2026-10-04 |
| Füllgrenze aus den ±25 % abgeleitet statt als eigener Schwellwert | Eine Übung kommt dazu, solange die Summe der Untergrenzen ins Budget passt; voll ist das Segment, sobald die Summe der Obergrenzen es erreicht. Damit braucht „bis das Budget etwa erreicht ist" keinen frei gewählten Toleranzwert und die Beispiele der Spec ergeben sich von selbst | 2026-10-04 |
| Lockern wirkt pro Segment und nur, wenn es die Lücke verkleinert | Segmente, die streng gefüllt werden konnten, sollen sich nicht verändern, nur weil ein anderes Segment eine Lücke hatte. Eine Stufe, die nichts einbringt, wird verworfen, damit der Hinweis „gelockert" immer etwas bedeutet | 2026-10-04 |
| Jeder Lockerungsversuch bekommt einen eigenen abgeleiteten Zufallsstrom | Ein zweiter Versuch verbraucht sonst Zufallszahlen und verschiebt die Auswahl aller folgenden Segmente. Mit `seed + Segmentindex × 1013 + Stufe × 7919` bleibt das Ergebnis bei gleichem Startwert identisch | 2026-10-04 |
| `unit_items.exercise_id` mit ON DELETE SET NULL statt CASCADE | Nur so bleibt beim Löschen einer Übung der Platzhalter „Übung gelöscht" stehen. Mit CASCADE würde die Einheit stillschweigend kürzer, was die Spec ausdrücklich ausschließt | 2026-10-04 |
| Variantenkennungen werden beim Bearbeiten einer Übung fortgeschrieben (PROJ-3) | `updateExercise` löschte bisher alle Varianten und legte sie neu an. Jede Bearbeitung hätte damit die Verweise aller Einheiten auf ihre Variante gelöst — auch beim Korrigieren eines Tippfehlers | 2026-10-04 |
| Einheitsname bekommt bei mehreren Einheiten am selben Tag einen Zähler | Name und Datum allein sind nicht eindeutig; in der Liste stünde sonst zweimal dieselbe Zeile und der Nutzer müsste von Hand umbenennen | 2026-10-04 |
| Keine serverseitige Drosselung des Generierens | Der Button ist während des Laufs gesperrt, und eine doppelt entstandene Einheit lässt sich löschen. Eine Drosselung wäre zusätzlicher Zustand für einen Fall ohne Schaden | 2026-10-04 |
| Im Browser wird keine verschachtelte Supabase-Abfrage verwendet | `src/lib/database.types.ts` führt keine Beziehungen; `select('*, groups(name)')` würde den Typprüfer umgehen. Mehrere flache Abfragen in JavaScript zusammengesetzt — dasselbe Muster wie PROJ-3 und PROJ-5 | 2026-10-04 |
| Eigene, im Zeitverlauf angelegte Phasen werden beim Generieren gesichert | Sie existierten nur im Formular und wären beim nächsten Besuch verschwunden. Edge Case 3 bleibt unberührt: das Segment bleibt leer und der Grund sagt genau das | 2026-10-04 |
| Datenbankabhängige Prüfungen als `*.manual.test.ts` mit eigener Konfiguration | Der Prüfplan braucht Netz und den Dienstschlüssel. Als Teil von `npm test` würde der Standardlauf davon abhängen; über `npm run test:pruefplan` bleibt er reproduzierbar, ohne die Suite zu binden | 2026-10-04 |
| Generierte Einheiten sind zunächst Entwürfe | Der Nutzer will erst sehen, was herauskommt, bevor etwas in seinen Übersichten landet. Sofortiges Speichern füllte die Liste mit Vorschlägen, die er gar nicht behalten wollte | 2026-10-04 |
| Entwürfe liegen in der Datenbank statt im Browser | Der Plan steht ohnehin schon in vier Tabellen. Im Browser gehalten müsste er vollständig hin- und hergeschickt werden, ginge beim Neuladen verloren, und „Zurück zum Generator\", Neu-Generieren und Lockern bräuchten je eigene Wege | 2026-10-04 |
| Höchstens ein Entwurf je Nutzer, jedes Generieren ersetzt ihn | Ohne diese Regel sammeln sich verworfene Vorschläge als unsichtbare Zeilen an. Mit ihr braucht es weder Aufräumlauf noch Verfallsdatum | 2026-10-04 |
| Entwürfe zählen nicht für die Frische-Regel | Sonst würde ein verworfener Vorschlag die Übungsauswahl der nächsten echten Einheit einschränken, obwohl die Gruppe ihn nie zu sehen bekam | 2026-10-04 |
| Lockern wirkt auf genau ein Segment statt auf die ganze Einheit | Der Nutzer klickt in dem Segment, das ihn stört. Dass dabei ein anderes, zufriedenstellendes Segment neu ausgewürfelt wird, ist aus seiner Sicht ein Fehler, kein Dienst | 2026-10-04 |
| Segmentplanung als `planSegment` aus dem Generator herausgelöst | Das Generieren einer Einheit und das nachträgliche Lockern eines Segments sind dieselbe Aufgabe mit anderem Zuschnitt. Zwei Umsetzungen würden auseinanderlaufen, sobald sich eine Auswahlregel ändert | 2026-10-04 |
| Lückengründe nennen jedes Kriterium unabhängig statt nur das erste | Eine Filterkette, die beim ersten leeren Zwischenstand abbricht, verschweigt die übrigen Ursachen. Der Nutzer soll sehen, wo überall etwas im Weg steht, damit er gezielt nachbessern kann statt zu raten | 2026-10-04 |
| Aufschlüsselung als JSONB-Spalte neben dem bestehenden Textgrund | Als Fließtext hätte sie die vorhandene Längenbedingung gesprengt, und die Oberfläche kann strukturierte Daten besser darstellen. Additiv angelegt, sodass die bestehende Spalte und ihre Bedingung unangetastet bleiben | 2026-10-04 |
| Lockern wird nicht angeboten, wenn es nachweislich nichts bringt | Material und Altersgruppe bleiben in jeder Stufe hart. Ein Knopf, der sicher wirkungslos ist, kostet den Nutzer einen Versuch und Vertrauen; an seiner Stelle steht der Grund | 2026-10-04 |
| Begründet wird mit dem tiefsten Versuch, gefüllt mit dem besten | Beides aus demselben Versuch zu nehmen führte zu der widersprüchlichen Meldung „Auch mit gelockerten Kriterien\" über einer Liste, die genau die gelockerten Kriterien aufzählte | 2026-10-04 |
| „Übung anlegen\" aus dem Lückenhinweis entfernt | Mitten im Betrachten einer Einheit in den Übungs-Wizard zu springen reißt den Nutzer aus seiner Aufgabe. Das Nachbesetzen einer Lücke übernimmt der Editor aus PROJ-7 an Ort und Stelle | 2026-10-04 |
| Zurück-Link führt in den Generator statt zur Gruppe | Nach dem Ansehen eines Vorschlags will der Nutzer die Einstellungen nachjustieren, nicht die Gruppe verwalten. Die Gruppe bleibt über die Kopfnavigation erreichbar | 2026-10-04 |
| Bedienstand der Konfigurationsseite an der Einheit statt in der Sitzung | „Zurück zum Generator\" soll auch greifen, wenn der Nutzer über „Meine Einheiten\" kommt und den Generator in dieser Sitzung nie offen hatte. In `sessionStorage` wäre der Stand dort nicht vorhanden | 2026-10-05 |
| Bedienstand als eine JSONB-Spalte statt zweier Einzelspalten | Der Editor aus PROJ-7 wird weiteren Bedienstand ablegen wollen. So kommt er ohne erneute Schemaänderung aus | 2026-10-05 |
| Aufgeklapptes Segment über die Position statt über die Kennung gemerkt | Die Segment-Kennungen im Formular werden bei jedem Laden neu vergeben; eine gespeicherte Kennung ginge beim Zurückkehren ins Leere | 2026-10-05 |
| Rücksetz-Effekte hängen am tatsächlichen Wechsel, nicht an einem Einmal-Schalter | Ein Schalter, der beim ersten Effektlauf verbraucht wird, versagt beim zweiten. React führt Effekte im Entwicklungsmodus doppelt aus, und jedes Neurendern mit frischen Server-Daten erzeugt neue Objektverweise. Der Vergleich der Gruppenkennung ist dagegen unempfindlich gegen die Anzahl der Läufe | 2026-10-05 |
| Komponententests für Zustandslogik im Formular | Die Testsuite deckte bis dahin nur reine Logik ab. Der Fehler saß im Zusammenspiel von Zustand und Effekt und war dort grundsätzlich nicht sichtbar. Der neue Test rendert in StrictMode und fängt genau diesen Fall | 2026-10-05 |
| Im Modus „Standard" gilt die Verteilung der aktuellen Gruppe, nicht die eingefrorene der Einheit | `generateUnit` prüft serverseitig, dass die Einheitsdauer der des Gruppenprofils entspricht. Alte Werte wiederherzustellen würde das Generieren scheitern lassen, sobald der Nutzer die Dauer seiner Gruppe geändert hat | 2026-10-05 |
| Umbenennen gehört zu PROJ-6, nicht zu PROJ-7 | Der Editor in PROJ-7 ändert den Stundenverlauf — Übungen tauschen, Zeiten verschieben, Lücken füllen. Der Name ist Beiwerk der Einheit, und die Spec sah ihn von Anfang an als „später umbenennbar\" vor | 2026-10-05 |
| Der Name wird beim Speichern erfragt, nicht erst nachträglich | Beim Ablegen in den Ordner entscheidet sich, ob der Nutzer die Einheit später wiederfindet. Der automatische Name ist dabei ein Vorschlag, kein Zwang — vorausgefüllt und markiert, sodass Bestätigen genügt | 2026-10-05 |
| Löschen einer Einheit mit ins Menü aufgenommen | Es gab gar keinen Weg, eine gespeicherte Einheit wieder loszuwerden. Ein Ordner, der sich nur füllen kann, ist für wöchentlich genutzte Einheiten nicht haltbar | 2026-10-05 |
| Das Karten-Menü liegt neben dem Link, nicht darin | Ein Menü innerhalb des Links würde beim Anklicken zugleich die Einheit öffnen | 2026-10-05 |
| „Neu generieren\" überschreibt nur Entwürfe, nie gespeicherte Einheiten | Eine gespeicherte Einheit auf Knopfdruck zu überschreiben ist Datenverlust ohne Rückweg. Der neue Vorschlag entsteht daneben, und der Nutzer entscheidet, ob er ihn behält | 2026-10-05 |
| Die Warnung „Änderungen werden überschrieben\" entfällt bei gespeicherten Einheiten | Sie stimmt dort nicht mehr: Es wird nichts überschrieben. Eine Warnung, die nicht zutrifft, trainiert dem Nutzer das Wegklicken an | 2026-10-05 |
| „Einheit speichern\" ist gesperrt, solange eine Phase ungefüllt blieb | Eine unvollständige Einheit soll nicht im Ordner landen und später in der Halle auffallen | 2026-10-05 |
| Bewusst frei gelassene Abschnitte sperren das Speichern nicht | „Frei lassen\" ist eine Entscheidung des Nutzers, keine Lücke. Sonst wäre Edge Case 9 — eine Einheit als leeres Gerüst — nicht mehr speicherbar | 2026-10-05 |
| Die Sperre nennt das betroffene Segment und den Ausweg | Ein grauer Knopf ohne Begründung wäre bei kleiner Übungsdatenbank eine Sackgasse. Mit dem Hinweis, den Abschnitt notfalls auf „frei lassen\" zu setzen, bleibt der Nutzer handlungsfähig | 2026-10-05 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-10-03

### Die wichtigste Korrektur gegenüber der Spec

Die Spec nennt den Zeitverlauf „die einzige echte Eigenentwicklung". Das stimmt so nicht mehr: Für ziehbare Segmentgrenzen gibt es mit der shadcn-Komponente **Resizable** eine fertige Grundlage, die genau das Verhalten mitbringt, das wir brauchen — nebeneinanderliegende Bereiche, ziehbare Griffe dazwischen, und die Summe bleibt beim Ziehen automatisch konstant. Sie bringt Maus-, Touch- und Tastaturbedienung sowie Mindestgrößen mit.

Damit entfällt der aufwendigste und fehleranfälligste Teil (die Zieh-Mathematik). Eigenentwicklung bleibt nur die dünne Schicht darüber: Umrechnung zwischen Prozent und Minuten, Segmente hinzufügen und entfernen, und der Einstellbereich pro Segment.

**Wichtige Festlegung dazu:** Die **Minutenwerte sind die Wahrheit**, nicht die Prozentwerte der Anzeige. Beim Ziehen wird der Prozentwert in Minuten zurückgerechnet und auf ganze Minuten gerundet; die Rundungsdifferenz bekommt immer das längste Segment, damit die Summe exakt der Einheitsdauer entspricht. Ohne diese Regel würde sich eine 60-Minuten-Einheit beim Herumziehen schleichend auf 59 oder 61 Minuten verschieben.

### Komponentenstruktur

```
(protected)/units/new                        ← Konfigurationsseite
+-- UnitConfigForm
    +-- GroupSelect (Dropdown; via ?groupId= vorausgefüllt)
    +-- GroupSummary (zeigt, was der Generator aus dem Profil zieht:
    |                 Sportarten, Altersgruppen, Teilnehmer, Dauer, Hallenmaterial)
    +-- ScopeChoice (Volle Dauer / Nur Teile füllen)
    +-- DistributionChoice (Klassisch 20/60/20 / Individuell)
    +-- SegmentTimeline                      ← klappt nur bei "Individuell" auf
    |   +-- Resizable-Gruppe (shadcn)        ← ziehbare Segmentgrenzen
    |   |   +-- Segmentfläche je Segment (Name + Minuten)
    |   +-- SegmentEditor (für das gewählte Segment)
    |       +-- PhaseSelect (vordefinierte + eigene Phasen)
    |       +-- Minutenfeld                  ← auch Mobil-Rückfallebene
    |       +-- FillModeToggle (füllen / frei lassen)
    |       +-- MultiSelect Sportarten       ← wiederverwendet aus PROJ-3
    |       +-- MultiSelect Schwierigkeit    ← wiederverwendet aus PROJ-3
    |       +-- Segment hinzufügen / entfernen / verschieben
    +-- GenerateButton (während des Laufs gesperrt)
    +-- UnitGeneratorEmptyState (keine Gruppe / keine Übungen)

(protected)/units/[id]                       ← Stundenverlauf (Ergebnis)
+-- UnitHeader (Name, Gruppe, Gesamtdauer, "Neu generieren")
+-- UnitPlanView
|   +-- SegmentBlock (je Segment, in Reihenfolge)
|       +-- UnitItemCard (Übung: Plandauer, geschätzte Dauer, Sportart,
|       |                 Schwierigkeit, Organisationsform, Material,
|       |                 Varianten-Hinweis, Musik-Link)
|       +-- GapNotice (Lücken-Grund + "Lockern" + "Übung anlegen")
|       +-- DeletedExerciseSlot (Platzhalter "Übung gelöscht")
+-- RegenerateDialog (Warnung bei bereits bearbeiteter Einheit)

Bestehende Seiten, die erweitert werden
+-- Dashboard: Karte "Einheiten-Generator" wird aktiviert
|               (liegt bereits ausgegraut vor, "Demnächst verfügbar")
+-- Gruppen-Detailseite: Abschnitt "Einheiten" mit UnitList
                          + Button "Einheit generieren"
```

### Der Generator als eigenständiger, testbarer Baustein

Das ist die wichtigste Strukturentscheidung des Features. Der Auswahlalgorithmus wird **strikt von der Datenbankanbindung getrennt**:

```
Datenbank  →  [ Server Action ]  →  Generator (reine Logik)  →  [ Server Action ]  →  Datenbank
               lädt Kandidaten,      keine Datenbank,            schreibt Einheit
               Gruppe, Verlauf       keine Zufallsquelle,
                                     keine Uhrzeit
```

Der Generator bekommt alles, was er braucht, als Eingabe übergeben und gibt den fertigen Plan samt Lücken-Begründungen zurück. Er greift selbst nirgends auf Datenbank, Systemzeit oder Zufall zu.

**Warum das so wichtig ist:** Die Spec enthält 56 Akzeptanzkriterien, von denen die meisten Auswahlverhalten beschreiben („Übung mit zu wenig Material wird nicht vorgeschlagen"). Nur als reine Logik lassen sich diese Fälle vollständig und schnell automatisiert testen, ohne für jeden Fall eine Datenbank mit Testdaten aufzubauen. Bei einem Algorithmus dieser Komplexität ist das der Unterschied zwischen beherrschbar und unbeherrschbar.

**Zufall wird hineingegeben, nicht erzeugt.** Die Sportart-Rotation und die Auswahl brauchen Zufall. Dieser Zufall kommt als übergebener Startwert („Seed") von außen. Damit gilt: gleicher Startwert, gleiches Ergebnis. Das bringt drei Vorteile — Tests sind reproduzierbar, „Neu generieren" bekommt einfach einen neuen Startwert, und bei einem Fehlerbericht lässt sich ein konkretes Ergebnis exakt nachstellen. Der verwendete Startwert wird deshalb an der Einheit mitgespeichert.

### Datenmodell (in Alltagssprache)

Vier neue Tabellen. Die Spec beschreibt die Felder im Detail; hier geht es um Struktur und Begründung.

**Einheit**
Gehört einem Nutzer und einer Gruppe. Hält Name, Gesamtdauer, den verwendeten Zufalls-Startwert, eine Markierung „wurde manuell bearbeitet" (für die Warnung beim Neu-Generieren) und Zeitstempel. Die Gesamtdauer wird **in die Einheit kopiert**, nicht aus der Gruppe gelesen — ändert der Nutzer später die Einheitsdauer seiner Gruppe, bleiben bestehende Einheiten unverändert.

**Segment**
Gehört zu einer Einheit, mehrere pro Einheit, in fester Reihenfolge. Hält Phasenname, Minutenbudget, den Modus („füllen" oder „frei lassen"), die für dieses Segment gewählten Sportarten und Schwierigkeitsgrade und — falls zutreffend — die gespeicherte Begründung, warum es nicht gefüllt werden konnte. Dass dieser Grund gespeichert und nicht nur angezeigt wird, verlangt die Spec ausdrücklich.

**Einheiten-Eintrag**
Gehört zu einem Segment, mehrere pro Segment, in fester Reihenfolge. Verweist auf eine Übung und optional auf eine Variante und hält die Plandauer. Der **Verweis** ist bewusst: Korrekturen an einer Übung wirken sofort in allen Einheiten. Die **Plandauer** ist bewusst kopiert: Sie darf sich nicht verschieben, wenn der Nutzer später die Schätzdauer der Übung anpasst.

**Übungsverwendung**
Ein Eintrag je verwendeter Übung: welche Übung, welche Gruppe, welche Einheit, wann. Diese Tabelle ist die Grundlage für die Frische-Regel, für PROJ-10 und für die Sortierung „Zuletzt verwendet" aus PROJ-3.

Warum eine eigene Tabelle und nicht aus den Einheiten errechnet: Die Frage „welche Übungen hat diese Gruppe zuletzt gesehen" ist damit eine einfache, schnelle Abfrage, statt bei jedem Generieren alle Einheiten mit allen Segmenten und Einträgen durchsuchen zu müssen.

### Berechnung der effektiven Variantendaten

Varianten sind laut Spec vollwertige Kandidaten, erben aber Felder, die sie nicht überschreiben. Diese Zusammenführung bekommt eine **einzige gemeinsame Stelle**, die sowohl der Generator als auch später PROJ-7 und die Übungsanzeige nutzen. Sonst wäre die Regel „Variantenmaterial ersetzt die Liste der Hauptübung" an mehreren Orten nachgebaut und würde garantiert auseinanderlaufen — bei einem harten Auswahlkriterium wie Material wäre das ein echter Fehler, nicht nur Unschönheit.

### Datenabruf-Strategie

| Aktion | Methode | Begründung |
|--------|---------|------------|
| Gruppen und eigene Phasen für die Konfigurationsseite laden | Server Component | Schnell und geschützt; bestehender Mechanismus aus PROJ-3 und PROJ-5 |
| Einheit generieren und speichern | Server Action | Der Kandidatenpool (alle Übungen mit Material und Varianten) darf nicht in den Browser geladen werden — das wäre langsam und gäbe Daten unnötig heraus. Außerdem gleiches Muster wie PROJ-3 und PROJ-5 |
| Gespeicherte Einheit anzeigen | Server Component | Einheit mit Segmenten, Einträgen und den verwiesenen Übungen in einer verschachtelten Abfrage |
| Einheitenliste auf der Gruppenseite | Server Component | Wenige Einheiten pro Gruppe; kein Nachladen nötig |
| Zeitverlauf bedienen | Client Component | Reine Interaktion ohne Datenbankbezug; erst beim Generieren geht die Konfiguration an den Server |
| Neu generieren | Server Action | Gleicher Weg wie Generieren, überschreibt denselben Datensatz |

### Schreiben der Einheit ohne halbe Ergebnisse

Eine Einheit zu speichern heißt, in vier Tabellen zu schreiben. Die Spec verlangt, dass bei einem Fehler **keine halb gespeicherte Einheit** zurückbleibt.

Vorgehen: Der Generator baut das vollständige Ergebnis zunächst im Speicher. Dann wird die Einheit angelegt, danach ihre Segmente, Einträge und Verwendungsnachweise. Scheitert ein Schritt, wird die eben angelegte Einheit wieder gelöscht — die abhängigen Datensätze verschwinden über die Löschweitergabe automatisch mit. Der Nutzer sieht die Fehlermeldung und seine Konfiguration bleibt erhalten.

Das ist bewusst **nicht** die strengste mögliche Lösung (eine Datenbankfunktion, die alles in einem unteilbaren Schritt schreibt). Begründung: Das Projekt schreibt in PROJ-3 und PROJ-5 bereits auf dieselbe Weise in mehrere Tabellen, der Aufräumschritt deckt die realistischen Fehlerfälle ab, und ein Fehlschlag ist hier ohnehin folgenlos — der Nutzer klickt einfach erneut auf „Generieren". Eine Datenbankfunktion wäre zusätzliche Komplexität ohne erkennbaren Gewinn.

### Sicherheitsmodell

- Zugriffsschutz auf allen vier neuen Tabellen: Jeder Nutzer sieht und bearbeitet nur seine eigenen Einheiten
- Die Gruppenzugehörigkeit wird beim Generieren **serverseitig geprüft** — es genügt nicht, dass die Gruppen-Kennung aus einem Formularfeld kommt
- Ebenso wird serverseitig geprüft, dass alle ausgewählten Übungen dem Nutzer gehören
- Prüfung aller Eingaben der Konfigurationsseite auf dem Server: Segmentsumme gleich Einheitsdauer, mindestens eine Sportart je Segment, Segmentdauer mindestens 1 Minute, gültige Phasennamen
- Auth-Prüfung über das bestehende geschützte Layout

### Wiederverwendung aus PROJ-3 und PROJ-5

Geprüft und bestätigt verwendbar:

| Bestehendes Teil | Verwendung in PROJ-6 |
|---|---|
| `MultiSelect` | Sportarten, Schwierigkeitsgrade und Phasennamen je Segment — die Komponente kann vordefinierte Listen, Vorauswahl und eigene Einträge bereits |
| Eigene Kategorien (`custom_categories`) | Eigene Phasennamen für die Segmentbenennung; Mechanismus existiert |
| Gruppenabruf mit Halle und Material | Liefert den gesamten Generator-Input in einem Zug |
| `DeleteConfirmDialog` | Vorlage für den Warndialog beim Neu-Generieren |
| Konstanten für Sportarten, Altersgruppen, Phasen, Schwierigkeit | Unverändert nutzbar |
| `date-fns` | Datum im automatischen Einheitennamen — bereits im Projekt |

### Nacharbeit in PROJ-3 (Teil dieses Features)

Die Spec nennt die Variantenmaterial-Semantik als offene Abhängigkeit. Architektonische Einordnung: Das ist **kein Blocker** für den Generator, denn „ersetzen" ist eine Leseregel, die die gemeinsame Zusammenführungsstelle umsetzt. Die Änderung an der Varianten-Eingabe ist eine Bedien- und Datenqualitätsfrage.

Empfehlung: als eigener kleiner Schritt im Rahmen des PROJ-6-Baus erledigen, mit eigenem Commit auf PROJ-3. Zwei Dinge gehören zusammen dorthin:
1. Variantenmaterial erbt sichtbar von der Hauptübung; erst ein Klick kopiert die Liste in bearbeitbare Felder, ein zweiter setzt auf Erben zurück
2. Hinweis am Dauer-Feld, dass Umbau-, Aufstell- und Erklärzeit mitzählen

### Abhängigkeiten

Ein neues Paket:

- **`react-resizable-panels`** — ziehbare Segmentgrenzen des Zeitverlaufs; kommt über `npx shadcn@latest add resizable` zusammen mit der passenden Komponente ins Projekt und entspricht damit der Projektregel „shadcn/ui zuerst"

Alles andere ist vorhanden: Supabase, Zod, shadcn/ui, Lucide Icons, `date-fns`, Vitest und Playwright.

### Integration

- Neue Seiten liegen unter dem bestehenden geschützten Layout, Auth greift damit automatisch
- Dashboard: Die vorhandene ausgegraute Karte „Einheiten-Generator" wird aktiviert und verlinkt auf die Konfigurationsseite
- Gruppen-Detailseite: Neuer Abschnitt „Einheiten" mit Liste und Button „Einheit generieren", der die Gruppe vorausfüllt
- Kopfnavigation: Neuer Punkt „Einheiten" neben „Übungen" und „Gruppen"
- Routenbenennung folgt dem bestehenden Muster (englischer Plural für deutsche Fachbegriffe, wie `/exercises` und `/groups`): **`/units`**

### Was dieses Design für PROJ-7 vorbereitet

Die Trennung von Auswahllogik und Datenzugriff zahlt sich direkt aus: PROJ-7 braucht zum Tauschen einer einzelnen Übung genau denselben Kandidatenpool und dieselben Filter, nur für einen einzigen Platz statt für ein ganzes Segment. Die Markierung „wurde manuell bearbeitet" an der Einheit ist bereits vorgesehen, und die Einheit liegt als echter Datensatz vor, auf dem der Editor arbeiten kann.

## Prüfplan für die vorbereiteten Testdaten

Die 40 Testübungen in der Datenbank (markiert mit `Testdaten (PROJ-6)`) enthalten absichtlich eingebaute Fälle. Die folgende Liste ist der **Plan**; das Ergebnis des Durchlaufs nach `/backend` steht darunter.

| # | Prüffall | Erwartung | Testdaten |
|---|---|---|---|
| 1 | Material fehlt in der Halle | Übung wird **nicht** vorgeschlagen | „Schwungtuch-Wellen" (Vorschulturnen), „Partnerakrobatik Grundformen" und „Seilsprung-Intervalle" (Capoeira) |
| 2 | Material „pro Teilnehmer" übersteigt den Hallenbestand | Übung wird **nicht** vorgeschlagen | „Weichboden-Sprungfest": 1 Weichbodenmatte × 25 Teilnehmer, Halle hat 4 |
| 3 | Material „insgesamt" übersteigt den Bestand knapp | Übung wird **nicht** vorgeschlagen | „Bank-Sprungkraft": 6 Bänke, Capoeira-Halle hat 4 |
| 4 | Material trifft die Grenze exakt | Übung **wird** vorgeschlagen | „Reifen-Hausbau": 2 Reifen × 25 = 50, Halle hat genau 50 |
| 5 | Teilnehmer-Obergrenze unter der Gruppengröße | Übung wird **nicht** vorgeschlagen | „Bockspringen für Kleine" (max. 12 bei 25 Teilnehmern) |
| 6 | Übung ohne Material | Wird **immer** vorgeschlagen, auch ohne Halle | 14 der 40 Übungen tragen kein Material |
| 7 | Variante rettet eine ausgeschlossene Hauptübung über **Material** | Die **Variante** wird Kandidat, die Hauptübung nicht | „Weichboden-Sprungfest" → Variante „Mit Turnmatten statt Weichböden"; „Schwungtuch-Wellen" → Variante „Mit Tüchern statt Schwungtuch" |
| 8 | Variante rettet über **Teilnehmerzahl** | Die Variante wird Kandidat | „Bockspringen für Kleine" → Variante „In zwei Gruppen mit Wartestation" (max. 25) |
| 9 | Regel A: Variantenmaterial **ersetzt** | Nur das Material der Variante zählt, nicht zusätzlich das der Hauptübung | Varianten aus Fall 7 |
| 10 | Sehr kurze Cool-Down-Übungen | Werden eingeplant, keine Mindestdauer schließt sie aus | „Atemübung zum Ausklang" (3 Min), „Schlafende Mäuse" (3 Min), „Hüftöffner im Sitzen" (4 Min) |
| 11 | Sportart-Rotation | Alle gewählten Sportarten kommen dran, bevor sich eine wiederholt | Beide Gruppen haben je 5 Sportarten |
| 12 | Gewichtung der Hauptsportart | Etwa jede zweite Übung aus Capoeira | Gruppe „Capoeira Erwachsene Samstags", Hauptsportart gesetzt |
| 13 | Frische-Regel | Dritte Einheit meidet Übungen der letzten beiden | Dreimal hintereinander für dieselbe Gruppe generieren |
| 14 | Dauer-Anpassung ±25 % | Plandauer weicht höchstens um ein Viertel von der Schätzung ab | Alle Übungen |
| 15 | Lücke mit Begründung | Grund wird in Alltagssprache genannt | Segment mit einer eigenen, nicht vergebenen Phase anlegen |

### Ergebnis des Prüfplans (2026-10-04, nach `/backend`)

Ausgeführt gegen die echten Daten mit `npm run test:pruefplan`. Das Skript dazu liegt in `src/lib/units/pruefplan.manual.test.ts`: Es lädt Gruppen, Hallenmaterial und alle Übungen samt Varianten aus dem Supabase-Projekt, baut daraus den Kandidatenpool und lässt den Generator laufen. Es ist aus `npm test` **ausgeschlossen** (eigene Konfiguration `vitest.manual.config.ts`), weil es Netz und den Dienstschlüssel aus `.env.local` braucht — der Standardlauf bleibt dadurch unabhängig.

Grunddaten des Durchlaufs: **54 Kandidaten** (45 Übungen + 9 Varianten). Davon nach Alter, Material und Teilnehmerzahl verwendbar: **20** für „Vorschulturnen 1" (60 Min, 25 TN, 17 Materialzeilen) und **17** für „Capoeira Erwachsene Samstags" (90 Min, 30 TN, 4 Materialzeilen, Hauptsportart Capoeira).

| # | Prüffall | Ergebnis |
|---|---|---|
| 1 | Material fehlt in der Halle | ✅ „Schwungtuch-Wellen", „Partnerakrobatik Grundformen" und „Seilsprung-Intervalle" fallen aus dem Pool |
| 2 | Material „pro Teilnehmer" übersteigt den Bestand | ✅ „Weichboden-Sprungfest" (1 Weichbodenmatte × 25 TN, Halle hat 4) ausgeschlossen |
| 3 | Material „insgesamt" übersteigt knapp | ✅ „Bank-Sprungkraft" (6 Bänke, Halle hat 4) ausgeschlossen |
| 4 | Material trifft die Grenze exakt | ✅ „Reifen-Hausbau" (2 Reifen × 25 = 50, Halle hat genau 50) wird zugelassen |
| 5 | Teilnehmer-Obergrenze unter der Gruppengröße | ✅ „Bockspringen für Kleine" (max. 12 bei 25 TN) ausgeschlossen |
| 6 | Übung ohne Material | ✅ 18 Kandidaten ohne Material, keiner scheitert am Material-Kriterium |
| 7 | Variante rettet über **Material** | ✅ „Weichboden-Sprungfest" aus / Variante „Mit Turnmatten statt Weichböden" durch; „Schwungtuch-Wellen" aus / Variante „Mit Tüchern statt Schwungtuch" durch |
| 8 | Variante rettet über **Teilnehmerzahl** | ✅ Hauptübung max. 12 aus, Variante „In zwei Gruppen mit Wartestation" max. 25 durch |
| 9 | Regel A: Variantenmaterial **ersetzt** | ✅ Geprüft, dass kein Material der Hauptübung in der Materialliste der Variante auftaucht |
| 10 | Sehr kurze Cool-Down-Übungen | ✅ Im Capoeira-Cool-Down stehen „Dehnen Beinrückseite" (5 Min) und „Hüftöffner im Sitzen" (4 Min) neben einer 9-Minuten-Übung. Keine Mindestdauer schließt sie aus |
| 11 | Sportart-Rotation | ✅ Alle gewählten Sportarten kommen dran, bevor sich eine wiederholt |
| 12 | Gewichtung der Hauptsportart | ✅ Über fünf Startwerte im Hauptteil: ★★, ·★★, ★★, ★·, ·★★ (★ = Capoeira). Etwa jede zweite bis zwei von drei Übungen aus der Hauptsportart, die übrigen Sportarten verschwinden nicht |
| 13 | Frische-Regel | ⚠️ Wirkt, stößt aber an die Poolgröße: Einheit 1 → 0 Wiederholungen, Einheit 2 → 1 von 7, Einheit 3 → 3 von 6. Bei 20 verwendbaren Kandidaten über drei Phasen ist das die erwartete Untergrenze — die Regel verschiebt nach hinten, schließt aber bewusst nicht aus, damit keine Lücken entstehen. Mit größerer Datenbank sinkt die Zahl von selbst |
| 14 | Dauer-Anpassung ±25 % | ✅ Für jeden Eintrag beider Gruppen geprüft. Beispiele: 8 → 9, 16 → 15, 22 → 21, 18 → 20, 14 → 16 |
| 15 | Lücke mit Begründung | ✅ Segment „Wettkampfspiel" bleibt leer mit „Es gibt noch keine Übung, die der Phase „Wettkampfspiel" zugeordnet ist." |

**Beide Gruppen werden vollständig gefüllt, ohne Lücke.** Zwei Beispiel-Einheiten aus dem Durchlauf:

```
Capoeira Erwachsene Samstags — 90 Min
Aufwärmen (18 Min): 18 gefüllt
  9 Min (geschätzt 8)  Partner-Spiegeln              [Kampfsport, Capoeira]
  9 Min (geschätzt 9)  Hütchen-Reaktionslauf         [Allgemeinsport, Kampfsport]
Hauptteil (54 Min): 54 gefüllt
  15 Min (geschätzt 16) Armada Tritttechnik          [Capoeira, Kampfsport]
  18 Min (geschätzt 18) Esquiva und Negativa         [Capoeira, Kampfsport]
  21 Min (geschätzt 22) Kraftzirkel am eigenen Körper [Allgemeinsport, Kampfsport]
Cool-Down (18 Min): 18 gefüllt
   5 Min (geschätzt 5)  Dehnen Beinrückseite         [Allgemeinsport]
   9 Min (geschätzt 8)  Abschlussroda ruhig          [Capoeira]
   4 Min (geschätzt 4)  Hüftöffner im Sitzen         [Allgemeinsport]

Vorschulturnen 1 — 60 Min
Aufwärmen (12 Min): 12 gefüllt
   6 Min (geschätzt 8)  Hütchen-Slalom-Warmlauf      [Turnen, Kinderturnen]
   6 Min (geschätzt 7)  Tücher-Tanz                  [Tanzen, Vorschulturnen]
Hauptteil (36 Min): 36 gefüllt
  16 Min (geschätzt 14) Ballschule Rollen und Fangen [Kinderturnen, Kinderspiele]
  20 Min (geschätzt 18) Tanz-Choreografie Löwenzahn  [Tanzen, Vorschulturnen]
Cool-Down (12 Min): 12 gefüllt
   6 Min (geschätzt 5)  Tücher-Regen                 [Tanzen, Vorschulturnen]
   6 Min (geschätzt 5)  Igel-Massage mit Ball        [Kinderturnen, Vorschulturnen]
```

Zusätzlich im selben Durchlauf abgesichert: keine Übung kommt zweimal in einer Einheit vor, die Summe der Plandauern überschreitet kein Segmentbudget, und jeder eingeplante Kandidat erfüllt Alter, Material, Teilnehmerzahl und den Phasennamen des Segments.

**Leistung:** 20 vollständige Einheiten über 54 Kandidaten in **5 ms** zusammen, also unter 1 ms je Einheit. Die Spec-Vorgabe von 2 Sekunden bei 150 Kandidaten liegt damit weit außer Reichweite — der Flaschenhals wird das Laden aus der Datenbank sein, nicht die Auswahl.

**Was der Prüfplan nicht abdeckt** (gehört in `/qa`): der Weg durch die Oberfläche hinter dem Login, das Verhalten beim Löschen einer verwendeten Übung (Platzhalter in der Einheit, Warnung mit Einheitennamen), „Neu generieren", „Mit gelockerten Kriterien erneut versuchen" und die Datentrennung zwischen zwei Konten.

**Nach der Prüfung:** Die Testübungen lassen sich in einem Zug entfernen mit
`delete from exercises where work_notes = 'Testdaten (PROJ-6)';`
Ihr Inhalt ist die Rohmasse für PROJ-4 (Starter-Datenbank).

## Übergabe an /qa — was der Backend-Schritt offen lässt

Diese Liste ist der Grund, warum der Status noch nicht „Approved" ist. Sie ist vollständig: alles andere ist entweder automatisiert geprüft (230 Tests) oder im Prüfplan-Durchlauf gegen die echten Daten bestätigt.

### Was der Nutzer bereits selbst geprüft hat

In zwei Durchgängen am 2026-10-04 und 2026-10-05 bestätigt und deshalb **nicht** erneut nötig: der Rundweg Schreiben → Lesen → Anzeigen durch die Server Actions, der Entwurfszustand samt „Einheit speichern", „Zurück zum Generator" und das Lockern pro Segment. Aus beiden Durchgängen sind elf Änderungen hervorgegangen, die in den Implementation Notes stehen.

### Die Fälle, die noch Hände brauchen

| # | Fall | Was zu sehen sein muss |
|---|---|---|
| 1 | Einheit generieren über „Standard" | Nutzer landet im Stundenverlauf, Name = Gruppenname + Datum, Hinweis „Noch nicht gespeichert" |
| 1b | Dort „Einheit speichern" | Einheit erscheint in „Meine Einheiten" und auf der Gruppenseite; der Hinweis weicht einem Haken |
| 1c | Generieren, **nicht** speichern, erneut generieren | Es liegt danach genau **ein** Entwurf vor, nicht zwei |
| 1d | „Zurück zum Generator" aus einer mit **Standard** erzeugten Einheit | Die Maske steht wieder auf „Standard", nicht auf aufgeklapptem Zeitverlauf |
| 1e | „Zurück zum Generator" aus einer **individuell** erzeugten Einheit | Zeitverlauf geladen, und der Einstellbereich, der beim Generieren offen war, ist wieder offen |
| 1f | Dasselbe, aber über „Meine Einheiten" statt direkt aus dem Generator | Gleiches Ergebnis — der Bedienstand hängt an der Einheit, nicht an der Sitzung |
| 1f* | **Wichtig für 1d–1f:** mit einer **neu generierten** Einheit prüfen | Einheiten von vor dem 2026-10-05 tragen keinen Bedienstand und öffnen immer in „Individuell" — das ist kein Fehler |
| 1g | Entwurf mit ungefüllter Phase | „Einheit speichern" ist grau, daneben steht welches Segment die Sperre auslöst und wie man sie löst |
| 1h | Dasselbe Segment im Generator auf „frei lassen" stellen | „Einheit speichern" ist wieder benutzbar |
| 1i | **Gespeicherte** Einheit öffnen, „Neu generieren" | Die gespeicherte Einheit bleibt unverändert im Ordner, der Vorschlag erscheint als neuer Entwurf. Erst dessen „Einheit speichern" legt eine **zweite** Einheit ab |
| 1j | Drei-Punkte-Menü auf einer Karte, „Umbenennen" | Name ändert sich in allen Übersichten; ein Klick auf das Menü öffnet **nicht** die Einheit |
| 1k | Drei-Punkte-Menü, „Löschen", bestätigen | Einheit weg, Übungen unverändert vorhanden |
| 2 | Zweite Einheit für dieselbe Gruppe am selben Tag | Name bekommt den Zähler `(2)` |
| 3 | **Gespeicherte** Einheit, Browser schließen und zurückkehren | Einheit ist noch da, Plandauern unverändert |
| 4 | „Individuell" mit einem Segment auf „frei lassen" und einer Notiz | Segment bleibt im Ergebnis leer, die Notiz steht an dieser Stelle |
| 5 | Segment mit einer **neu angelegten eigenen Phase** | Segment bleibt leer mit dem Grund „Es gibt noch keine Übung, die der Phase … zugeordnet ist." Die Phase steht beim **nächsten** Öffnen in der Auswahl (wird beim Generieren gesichert) |
| 6 | „Neu generieren" | Andere Übungsauswahl, **gleiche** Zeitverlauf-Konfiguration, dieselbe Einheit (keine zweite in der Liste) |
| 7 | Zwei Segmente mit Lücke, in **einem** davon lockern | Nur dieses Segment wird neu gefüllt, das andere bleibt Zeichen für Zeichen gleich |
| 7b | Segment, dessen Lücke nur an Material oder Alter liegt | Der Lockern-Knopf wird gar nicht angeboten, stattdessen steht dort der Grund |
| 7c | Lückenhinweis insgesamt | Nennt jede Ursache mit Anzahl und zu jeder, was dagegen hilft. Kein „Übung anlegen"-Knopf mehr |
| 8 | Eine Übung löschen, die in einer Einheit vorkommt | Löschdialog nennt die **Namen** der betroffenen Einheiten. Danach steht in der Einheit der Platzhalter „Übung gelöscht" und die Einheit ist nicht kürzer geworden |
| 9 | Eine Übung bearbeiten, die als **Variante** in einer Einheit eingeplant ist (z. B. nur den Namen ändern) | Die Einheit zeigt weiter dieselbe Variante. Das ist der Nachweis für die Varianten-Kennungs-Behebung aus PROJ-3 |
| 10 | Geschätzte Dauer einer eingeplanten Übung ändern | Plandauer in der bestehenden Einheit bleibt unverändert |
| 11 | Beschreibung einer eingeplanten Übung ändern | Einheit zeigt die neue Beschreibung (Verweis statt Kopie) |
| 12 | Zweites Konto anlegen und dessen Einheiten prüfen | Konto B sieht keine Einheit von Konto A |
| 13 | Nicht eingeloggt `/units`, `/units/new`, `/units/<id>` aufrufen | Weiterleitung auf `/login` |

### Was bereits belegt ist und nicht erneut geprüft werden muss

- **Alle 15 Fälle des Prüfplans** — gegen die echten 40 Testübungen gelaufen, siehe „Ergebnis des Prüfplans". Wiederholbar mit `npm run test:pruefplan`
- **Die Fremdschlüssel** — am 2026-10-04 lesend aus dem Systemkatalog geprüft (`pg_constraint.confdeltype`), kein Probelauf mit Löschungen nötig: `unit_items.exercise_id` und `unit_items.variant_id` stehen auf **SET NULL**, alle übrigen zehn Verweise auf **CASCADE**. Die Platzhalter-Logik ist damit auf Datenbankebene abgesichert; Fall 8 oben prüft nur noch die Darstellung
- **Die Datenbanktypen** — gegen das von Supabase erzeugte Schema abgeglichen, für alle vier neuen Tabellen deckungsgleich
- **Zugriffsschutz auf allen vier Tabellen** — aktiv, Supabase-Sicherheitsprüfung ohne Beanstandung

### Nebenbefund außerhalb von PROJ-6

`src/lib/database.types.ts` führt `profiles.display_name` als `string | null`, in der Datenbank ist die Spalte **NOT NULL**. Ein Altbestand aus PROJ-1, ohne bekannte Auswirkung — Code, der auf `null` prüft, läuft nur in einen toten Zweig. Gehört in `/qa` oder einen Aufräum-Commit auf PROJ-1, nicht in PROJ-6.

## QA Test Results

> Es gibt zwei Durchläufe. Der **zweite** steht direkt hier darunter und gilt.
> Der erste folgt danach ab „Erster Durchlauf" und bleibt als Beleg stehen,
> weil er die Belegart jedes einzelnen Kriteriums festhält.

### Zweiter Durchlauf — 2026-10-05

**Prüfer:** QA Engineer (KI)
**Anlass:** Freigabeprüfung nach den Behebungen von BUG-1 und BUG-2

#### Was dieser Durchlauf geprüft hat

Nicht alle 94 Kriterien erneut — das wäre Theater, nachdem der erste Durchlauf
sie dokumentiert hat. Geprüft wurden gezielt: die **beiden behobenen Fehler**,
die **zuletzt geänderten Stellen**, die **15 bislang nur gelesenen Kriterien**
und der **gesamte automatisierte Bestand** als Rückschrittsprobe.

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **249 Tests grün** über 11 Dateien (vorher 242) |
| `npm run test:pruefplan` | **15 Prüffälle grün** gegen die echten Daten, jetzt 54 Kandidaten |
| `npm run build` | erfolgreich, alle 20 Routen registriert |
| `npm run lint` | **0 Fehler**, 4 vorbestehende `<img>`-Warnungen aus PROJ-3 |
| `npm run test:e2e` | **erstmals vollständig gelaufen** — 38 grün, 46 rot, 8 übersprungen, 18,9 Min |

#### Die E2E-Strecke — erstmals vollständig gelaufen

Das ist der eigentliche Zugewinn dieses Durchlaufs. Nach dem Entfernen der
Sperrdatei (BUG-8) lief die Suite über den Edge-Ersatzweg **zum ersten Mal
überhaupt zu Ende** — angemeldet, gegen den Produktionsbuild:

```
PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npm run test:e2e
→ 38 passed, 46 failed, 8 did not run (18,9 Minuten)
```

**Die Suite ist nicht langsam, sie war blockiert.** 18,9 Minuten für 92
Testausführungen — die im ersten Durchlauf vermuteten Stunden kamen von der
Sperrdatei, nicht von der Laufzeit. Die Schätzung „17,5 Minuten für zwei von
sechzehn Tests" aus dem ersten Durchlauf ist damit widerlegt.

**Die 46 Fehlschläge zerfallen sauber in drei Gruppen. Keine davon ist ein
Produktfehler des Generators:**

| Gruppe | Zahl | Ursache |
|---|---|---|
| `[Mobile Safari]` | **36** | **WebKit ist nicht installiert.** Playwright bricht mit „Please run `npx playwright install`" ab. Das Projekt übernimmt den `channel` nicht (`playwright.config.ts:72`) → **BUG-11** |
| `[chromium]` PROJ-3 und PROJ-5 | **9** | Veraltete Testerwartungen → **BUG-10** |
| `[chromium]` PROJ-6 | **1** | Test stört sich mit den nebenläufig laufenden Projekten → **BUG-12**. **Kein Produktfehler — allein nachgewiesen** |

**Die 8 übersprungenen Tests sind der eigentliche Schaden dieses einen
Fehlschlags.** Die PROJ-6-Datei läuft mit `mode: 'serial'`. Fällt ein Test
durch, überspringt Playwright **den gesamten Rest der Datei**. Der Fehlschlag
steht in Zeile 105 — alle acht Tests danach liefen nicht:

> Abbrechen bleibt Entwurf · Umbenennen über das Menü · Löschen · Bedienstand
> „Standard" · Bedienstand aus „Meine Einheiten" · Neu generieren aus
> gespeicherter Einheit · Löschwarnung mit Entwurf · Leerzustand ohne Gruppe

**Damit ist auch die Angabe „sechs Tests grün" aus dem ersten Durchlauf richtig
eingeordnet:** Es waren dieselben sechs, die **vor** Zeile 105 liegen. Der
Durchlauf endete damals an genau derselben Stelle. Der Fehlschlag ist also
**reproduzierbar, kein Ausrutscher** — und er verdeckt acht weitere Kriterien.

**Bilanz für PROJ-6 allein:** 15 Tests im angemeldeten Projekt — **6 grün,
1 rot, 8 übersprungen**. Dazu die 3 Tests ohne Anmeldung
(`…anon.spec.ts`), die **grün** sind: die Weiterleitung auf `/login` für
`/units`, `/units/new` und `/units/<id>` ist damit erstmals wirklich im Browser
belegt und nicht mehr nur gelesen.

**Was dieser Lauf für PROJ-6 positiv belegt** — erstmals im Browser, nicht am
Code: die Vorauswahl der Gruppe über `?group=`, „Standard" als Voreinstellung,
die Verteilung 12/36/12 bei 60 Minuten, der Entwurf erscheint **nicht** in
„Meine Einheiten", erneutes Generieren hinterlässt **genau einen** Entwurf, und
der Speicherdialog öffnet mit vorausgefülltem Namen.

**Was offen bleibt:** Die Darstellung auf 375 px ist weiterhin **nicht im
Browser geprüft** (BUG-11). Am Code belegt ist das Minutenfeld als
Rückfallebene zu den ziehbaren Grenzen (`segment-editor.tsx:78–82`).

#### Die behobenen Fehler

- **BUG-1** (Löschen einer Gruppe) — `group-units-warning.test.tsx`: **7 Tests grün**, einzeln nachgeprüft. `getUnitNamesForGroup` filtert auf `saved = true` und sortiert neueste zuerst
- **BUG-2** (Entwürfe in der Löschwarnung) — im Code belegt: `getUnitNamesUsingExercise` filtert auf `.eq('saved', true)` (`src/lib/actions/units.ts:1009`). Der E2E-Test samt Gegenprobe ist geschrieben, konnte aber nicht laufen (BUG-8)

#### Die vormals nur gelesenen Kriterien

Dreizehn der fünfzehn sind in diesem Durchlauf am Quelltext belegt worden, mit
Fundstelle. Das hebt sie von „nur gelesen" auf „am Code nachgewiesen" — nicht
auf „bedient", das bleibt der E2E-Strecke vorbehalten.

| Kriterium | Fundstelle und Befund |
|---|---|
| Alt + Pfeiltasten verschieben ein Segment | `segment-timeline.tsx:125` — `altKey` plus `ArrowLeft`/`ArrowRight`, ✅ |
| Sportarten der Gruppe stehen oben und sind angehakt | `unit-config-form.tsx:132` — `[...group.sports, ...rest]`, Gruppensportarten zuerst, ✅ |
| Lockern wird nicht angeboten, wenn es nichts bringt | `gap-notice.tsx:65` — korrekt für Material und Alter, **fehlerhaft für die leere Phase** → **BUG-9** |
| Speichern gesperrt bei Lücke, mit Nennung des Segments | `unit-plan-view.tsx:118,164` — `disabled={… hasGaps}`, ✅ |
| Frei gelassene Abschnitte sperren nicht | `unit-plan-view.tsx:118` — Filter auf `fillMode === 'generate'`, ✅ |
| Umbenennen und Löschen über das Menü | `unit-actions-menu.tsx`, ✅ |
| Klick auf das Menü öffnet **nicht** die Einheit | `unit-list.tsx:17–49` — das Menü liegt **neben** dem `Link`, nicht darin. Strukturell unmöglich, ✅ |
| Keine Warnung bei gespeicherter Einheit | `unit-plan-view.tsx:176` — `manuallyEdited && !saved`, genau wie gefordert, ✅ |
| Klick auf eine Übung öffnet ihre Detailseite | `unit-item-card.tsx:37` — `href={/exercises/${exercise.id}}`, ✅ |
| Varianten-Hinweis sichtbar | `unit-item-card.tsx:79` — „N Varianten verfügbar", ✅ |
| Einheiten auf der Gruppenseite, neueste zuerst | `units.ts:946` — `saved = true`, `created_at` absteigend, ✅ |
| Leerzustand ohne Gruppe / ohne Übungen | `unit-generator-empty-state.tsx:25,44` — beide Knöpfe samt Verweis auf die Starter-Datenbank, ✅ |
| Gruppenwechsel verwirft den Bearbeitungsstand | `unit-config-form.tsx:116–121` — setzt `customSegments` auf `null` und den Modus auf `standard`. Strenger als das Kriterium: verwirft bei **jedem** Gruppenwechsel, nicht nur bei abweichender Dauer, ✅ |
| Edge Case 12: Netzwerkfehler | `units.ts:370,464` — der angelegte Einheiten-Satz wird im `catch` wieder gelöscht, keine halbe Einheit. Aufräumschritt belegt, nicht ausgelöst, ⚠️ |

#### Datenintegrität — erneut gegen den echten Bestand

Alle Prüfungen erneut gefahren, diesmal gegen 12 Einheiten und 71 Einträge:

| Prüfung | Ergebnis |
|---|---|
| Verwaiste Segmente / Einträge / Verwendungen | 0 / 0 / 0 |
| Segmentsumme ≠ Gesamtdauer | 0 |
| Segment über seinem Minutenbudget | 0 |
| Doppelte Übung innerhalb einer Einheit | 0 |
| Plandauer außerhalb ±25 % der **effektiven** Dauer | **0 von 71** |
| Einträge ohne Schätzdauer | 0 |
| Entwürfe im Bestand | 0 |
| Nutzer mit mehr als einem Entwurf | 0 |
| Verwendungsnachweise zu Einträgen | 71 zu 71 |

#### Sicherheit — erneut bewiesen

- **Fremder angemeldeter Nutzer:** simulierte Sitzung mit fremder Kennung sieht **0 Zeilen** in `units`, `unit_segments`, `unit_items`, `exercise_usages`, `exercises`, `groups`, `venues`, `custom_categories`
- **Ohne Anmeldung:** Rolle `anon` sieht **0 Zeilen** in allen geprüften Tabellen, `profiles` eingeschlossen
- **Gegenprobe:** der Eigentümer sieht 12 / 71 / 71 — der Test blockiert also nicht einfach alles
- **Richtlinien einzeln gelesen:** alle 14 Richtlinien der vier PROJ-6-Tabellen hängen an `auth.uid()`. `exercise_usages` hat bewusst keine UPDATE-Richtlinie
- **Supabase-Sicherheitsprüfung:** 4 Hinweise, **alle vier vorbestehend** und keiner aus PROJ-6 (`handle_new_user` und `update_updated_at` ohne `search_path`, `handle_new_user` als `SECURITY DEFINER` für `anon` und `authenticated`, abgeschaltete Prüfung auf geleakte Passwörter). Gehören in `/deploy`
- **BUG-4 unverändert bestätigt:** die INSERT-Richtlinie auf `units` lautet weiterhin nur `auth.uid() = user_id`; die `group_id` wird nicht auf Eigentum geprüft. Keine Offenlegung, weiterhin Härtung

#### Nebenbefund aus PROJ-1 bestätigt

`profiles.display_name` ist in der Datenbank **NOT NULL**, `src/lib/database.types.ts:15` führt
`string | null`. Unverändert, ohne Auswirkung, gehört in einen Aufräum-Commit auf PROJ-1.

#### Fehlerstand nach diesem Durchlauf

| Fehler | Schwere | Stand |
|---|---|---|
| BUG-1 Gruppe löschen vernichtet Einheiten | Hoch | ✅ behoben und nachgeprüft, 7 Tests |
| BUG-2 Entwürfe in der Löschwarnung | Niedrig | ✅ behoben, im Code belegt |
| BUG-3 Keine Warnung beim Verlassen der Seite | Niedrig | offen |
| BUG-4 Zugriffsschutz prüft Eigentum nicht | Niedrig | offen, erneut bestätigt |
| BUG-5 Platzhalter ohne Nachbesetzen | Niedrig | offen, gehört zu PROJ-7 |
| BUG-6 Verwendungszeitpunkt „generiert" | Niedrig | offen |
| BUG-7 Verlassener Entwurf nicht auffindbar | Niedrig | offen |
| BUG-9 Lockern wird in einer Sackgasse angeboten | Niedrig | **neu** |

**Am Produkt: 0 kritisch, 0 hoch, 0 mittel, 6 niedrig offen** (BUG-1 und BUG-2 behoben).

An der **Teststrecke** — kein Produktfehler, blockiert aber `/deploy`:

| Fehler | Schwere | Stand |
|---|---|---|
| BUG-8 E2E-Suite lief nie vollständig | Niedrig | **erledigt bis auf die Virenscan-Ausnahme** — Suite lief erstmals zu Ende |
| BUG-10 E2E-Tests aus PROJ-3 und PROJ-5 veraltet | Mittel | **neu** — 9 Fehlschläge, alle aus veralteten Erwartungen |
| BUG-11 „Mobile Safari" übernimmt den Ersatzweg nicht | Niedrig | **neu** — 36 Fehlschläge, 375 px ungeprüft |
| BUG-12 PROJ-6-Test stört sich mit Nebenläufigkeit | Niedrig | **neu** — 1 Fehlschlag, allein grün in 7,0 Sek |

#### Entscheidung

**Produktionsreif: JA.**

0 kritisch, 0 hoch, 0 mittel am Produkt. Der einzige hohe Fehler (BUG-1) ist
behoben und nachgeprüft.

Der eine rote PROJ-6-E2E-Test wurde vor dieser Entscheidung **nicht
weggewunken, sondern nachgefahren**: allein läuft er in 7,0 Sekunden grün
(BUG-12). Er prüft im Verbund die Nebenläufigkeit der Teststrecke, nicht den
Generator. Damit ist er als Testfehler eingeordnet — und zwar belegt, nicht
vermutet.

**Drei Dinge gehören trotzdem vor `/deploy`**, alle an der Teststrecke und
keines am Produkt:

1. **BUG-10** — neun veraltete Tests aus PROJ-3 und PROJ-5. Eine rote Suite aus
   veralteten Gründen verdeckt künftige echte Rückschritte
2. **BUG-11** — die Ordner-Ausnahme setzen und `npx playwright install` (ohne
   `chromium`) laufen lassen, damit WebKit mitkommt. Erst dann ist die
   **Mobilbreite 375 px überhaupt geprüft**; derzeit ist sie nur am Code belegt
3. **BUG-12** — die Testkonten trennen, damit die Suite verlässlich wird

Dazu **BUG-9** als Einzeiler am Produkt und die vier vorbestehenden
Supabase-Hinweise, die ohnehin in `/deploy` gehören.

**Was diese Freigabe ausdrücklich nicht behauptet:** dass jedes der 94
Kriterien im Browser bedient wurde. Die Belegarten stehen im ersten Durchlauf
einzeln aufgeschlüsselt; dieser zweite hat 13 vormals nur gelesene Kriterien am
Quelltext mit Fundstelle belegt und 9 weitere erstmals im Browser. Die
Mobilbreite bleibt die eine echte Lücke.

---

### Erster Durchlauf — 2026-10-05

**App:** http://localhost:3000
**Prüfer:** QA Engineer (KI)

### Wie geprüft wurde — und wie nicht

Die 94 Akzeptanzkriterien zerfallen in drei Gruppen, die unterschiedlich stark belegt sind. Die Unterscheidung steht hier vorn, weil ein pauschales „94/94 bestanden" den Beleggrad verschleiern würde.

| Art des Belegs | Kriterien | Aussagekraft |
|---|---|---|
| **Automatisiert** — 242 Vitest-Tests über Generator, Varianten, Zeitverlauf, Schema und Formularzustand | 38 | Hoch. Läuft bei jedem `npm test` erneut |
| **Gegen echte Daten** — `npm run test:pruefplan` über 54 Kandidaten, plus SQL-Abgleiche gegen den Produktionsbestand | 17 | Hoch. Prüft dieselbe Logik an den tatsächlichen Übungen |
| **Durch den Nutzer bedient** — zwei Durchgänge am 2026-10-04 und 2026-10-05 | 24 | Mittel. Bestätigt, aber ohne Protokoll und nicht wiederholbar |
| **Nur gelesen** — Code- und Schemaprüfung ohne Ausführung | 15 | Gering. Für `/deploy` nachzuholen |

Die E2E-Tests für PROJ-6 sind **geschrieben** (`tests/PROJ-6-einheiten-generator.spec.ts`, `…anon.spec.ts`), konnten in dieser Sitzung aber **nicht ausgeführt** werden: Der Playwright-Browser lud nicht vollständig herunter. Siehe BUG-8.

### Was sich dabei an der Teststrecke geändert hat

Die bestehenden E2E-Tests aus PROJ-3 und PROJ-5 liefen **ohne Anmeldung**. Jede geschützte Seite leitet dann auf `/login` um, und die Tests waren so geschrieben, dass sie bei fehlendem Inhalt stillschweigend durchliefen (`if (await x.count() > 0)`). Sie belegten also praktisch nichts.

Neu dazugekommen:
- `tests/auth.setup.ts` — meldet ein eigenes Testkonto über die echte Anmeldestrecke an (Dienstschlüssel erzeugt einen Einmal-Link, der Browser folgt ihm, `/auth/callback` tauscht ihn gegen eine Sitzung) und legt den Sitzungszustand ab
- `tests/fixtures.ts` — legt Gruppe und sechs Übungen für das Testkonto an und räumt danach auf. Die echten Daten des Entwicklers werden nie angefasst
- `playwright.config.ts` — trennt angemeldete von abgemeldeten Tests in eigene Projekte

### Akzeptanzkriterien

#### Einstieg und Konfiguration (9)
- [x] Gruppe über die Gruppenseite vorausgefüllt — `?group=` wird in `units/new/page.tsx` gegen die eigenen Gruppen geprüft; vom Nutzer bedient
- [x] Ohne Gruppenauswahl kein Generieren — Formular zeigt Block 2 erst bei gewählter Gruppe
- [x] Zusammenfassung des Gruppenprofils — über `group-hints.tsx`; erscheint laut Spec-Nacharbeit nur noch bei Lücken im Profil
- [x] „Standard" ist vorausgewählt — Komponententest `öffnet ohne mitgebrachten Stand wie bisher mit „Standard"`
- [x] 60 Minuten ergeben 12 / 36 / 12 — `timeline.test.ts`, bestätigt am Produktionsbestand (0 Einheiten mit abweichender Segmentsumme)
- [x] „Individuell" klappt den Zeitverlauf auf — Komponententest
- [x] Bearbeitungsstand übersteht den Moduswechsel — vom Nutzer bedient
- [x] „Auf Standard zurücksetzen" — vom Nutzer bedient
- [x] Gruppenwechsel verwirft den Stand — Komponententest deckt die Gegenrichtung ab (gleiche Gruppe verwirft **nicht**); der Wechselfall ist nur gelesen

#### Zeitverlauf (13)
- [x] Segmentgrenze verschieben, Summe bleibt — 27 Tests in `timeline.test.ts` sichern die Invariante
- [x] Segment hinzufügen mit allen Einstellungen — `timeline.test.ts`
- [x] Umsortieren per Ziehen — vom Nutzer bedient
- [x] Zielposition markiert, Reihenfolge erst beim Loslassen — vom Nutzer bedient
- [x] Alt + Pfeiltasten — nur gelesen
- [x] Antippen wählt das Segment — vom Nutzer bedient
- [x] Notiz eines freien Segments erscheint im Verlauf — Code belegt, vom Nutzer bedient
- [x] Phasenauswahl zeigt eigene Phasen und erlaubt neue — bestätigt: „Hauptteil 2" landete im Test in `custom_categories`
- [x] „frei lassen" bleibt leer — `generator.test.ts`
- [x] Mehrere freie Segmente bleiben alle leer — `generator.test.ts`
- [x] Sportarten der Gruppe stehen oben und sind angehakt — nur gelesen
- [x] Mindestens eine Sportart erzwungen — `unit.test.ts` (Schema) und Formularprüfung
- [x] Einschränkung auf „Leicht" wirkt — `generator.test.ts`

#### Auswahl der Übungen (22)
Alle 22 sind durch `generator.test.ts` und `candidates.test.ts` abgedeckt und zusätzlich im Prüfplan gegen die echten 54 Kandidaten belegt. Stichproben aus dem Produktionsbestand: 0 Einheiten mit doppelter Übung, alle eingeplanten Kandidaten erfüllen Phase, Alter, Material und Teilnehmerzahl.
- [x] Phase, Sportart (OR), Altersgruppe, Material (insgesamt / pro Teilnehmer / keine Halle / nicht kumulativ), Teilnehmerzahl (Ober-, Untergrenze, fehlende Werte beidseitig)
- [x] Varianten: eigene Altersgruppe rettet, Material **ersetzt**, fehlendes Material erbt, Haupt und Variante schließen sich aus
- [x] Sportart-Rotation, Gewichtung der Hauptsportart, gleichmäßige Rotation ohne Hauptsportart
- [x] Hauptsportart: Vorbelegung, segmentweise Änderung, automatisches Leeren, Entfallen bei einer Sportart

#### Zeitbudget und Dauer (4)
- [x] 12-Minuten-Budget, 10-Minuten-Übung → 12 Minuten Plandauer — `generator.test.ts`
- [x] Plandauer innerhalb ±25 % — **am Produktionsbestand geprüft: 0 Verletzungen über 71 Einträge**
- [x] Mehrere kurze Übungen ohne Mindestdauer — `generator.test.ts`, im Prüfplan an 3–5-Minuten-Übungen bestätigt
- [x] Nicht füllbarer Rest bleibt Lücke — `generator.test.ts`; 0 Segmente mit Summe über Budget im Bestand

#### Lücken und Lockern (7)
- [x] Minutenzahl und Grund in Alltagssprache — `generator.test.ts`
- [x] Lockern gibt Schwierigkeitsgrad und Sportart frei, Material und Alter bleiben hart — `generator.test.ts`
- [x] Lockern wirkt nur im geklickten Segment — `relaxSegment` lädt gezielt ein Segment; Code belegt, vom Nutzer bedient
- [x] Erfolgloses Lockern wird begründet — `generator.test.ts`
- [x] Lockern wird nicht angeboten, wenn es nichts bringt — `gap-notice.tsx`, nur gelesen
- [x] Gelockertes steht im Ergebnis — `generator.test.ts`
- [x] Jede Ursache mit Anzahl und Abhilfe — `generator.test.ts` plus Prüfplan-Fall 16 an echten Daten

#### Speichern, Anzeigen, Neu generieren (28)
- [x] Generieren ergibt einen Entwurf — vom Nutzer bedient
- [x] Speichern-Dialog mit vorausgefülltem Namen — 7 Tests in `unit-name-dialog.test.tsx`
- [x] Geänderter und unveränderter Name — `unit-name-dialog.test.tsx`
- [x] Abbrechen verwirft die Eingabe — `unit-name-dialog.test.tsx`
- [x] Speichern gesperrt bei Lücke, mit Nennung des Segments — nur gelesen
- [x] Frei gelassene Abschnitte sperren nicht — nur gelesen (Logik filtert auf `fillMode === 'generate'`)
- [x] Umbenennen und Löschen über das Menü — nur gelesen
- [x] Zurück zum Generator stellt Zeitverlauf, Modus und aufgeklappten Bereich wieder her — 5 Komponententests, vom Nutzer bestätigt
- [x] Gilt auch aus „Meine Einheiten" heraus — der Bedienstand hängt an der Einheit; vom Nutzer bestätigt
- [x] Nur ein Entwurf je Nutzer — **am Produktionsbestand geprüft: Regel eingehalten**
- [x] Entwurf zählt nicht für die Frische-Regel — `.eq('saved', true)` in `loadRecentExerciseIds`
- [x] Neu generieren: Entwurf wird ersetzt, gespeicherte Einheit bleibt — vom Nutzer bestätigt
- [x] Keine Warnung bei gespeicherter Einheit — nur gelesen
- [x] Klick auf eine Übung öffnet ihre Detailseite — nur gelesen
- [x] Varianten-Hinweis sichtbar — nur gelesen
- [x] Einheiten auf der Gruppenseite, neueste zuerst — `getUnitsForGroup` sortiert und filtert; nur gelesen
- [ ] **Automatischer Name aus Gruppe und Datum** — erfüllt, aber siehe BUG-7 zur Zählersemantik

#### Abwechslung (3)
- [x] Dritte Einheit meidet die letzten beiden — `generator.test.ts`, Prüfplan-Fall 13
- [x] Bei zu wenigen Übungen wird trotzdem gefüllt — `generator.test.ts`
- [x] Verwendung wird festgehalten — 71 Verwendungen zu 71 Einträgen, 0 verwaist. Zum Zeitpunkt siehe BUG-6

#### Leerzustände (2)
- [x] Keine Gruppe → „Erste Gruppe anlegen" — nur gelesen, E2E-Test geschrieben
- [x] Keine Übungen → Hinweis mit Verweis auf die Starter-Datenbank — nur gelesen

#### Übung gelöscht (4)
- [x] Warnung nennt die betroffenen Einheiten — umgesetzt; siehe BUG-2 zu Entwürfen
- [ ] **Platzhalter „Übung gelöscht" mit Möglichkeit zum Nachbesetzen** — der Platzhalter erscheint, eine Möglichkeit zum Nachbesetzen gibt es nicht. Siehe BUG-5
- [x] Geänderte Beschreibung wirkt sofort — Verweis statt Kopie, Code belegt
- [x] Geänderte Schätzdauer lässt die Plandauer unberührt — belegt: zwei Einträge im Bestand tragen eine Plandauer, die zur Variantendauer passt, nicht zur später geänderten Übungsdauer

#### Datentrennung (3)
- [x] Nutzer B sieht die Einheiten von Nutzer A nicht — **auf Datenbankebene bewiesen** (siehe Sicherheits-Audit)
- [x] Nicht eingeloggt → Weiterleitung auf den Login — E2E-Test geschrieben; `anon` sieht 0 Zeilen in allen Tabellen
- [x] Fremde Gruppe wird abgewiesen — `getGroup` filtert auf `user_id`; siehe BUG-4 zur Absicherung in der Datenbank

### Edge Cases

| # | Fall | Ergebnis |
|---|---|---|
| 1 | Keine Gruppe | ✅ Leerzustand, Generieren unmöglich |
| 2 | Keine Übungen | ✅ Leerzustand mit Verweis auf PROJ-4 |
| 3 | Neue eigene Phase | ✅ Segment bleibt leer, Grund genannt, Phase wird gesichert — am echten Fall „Hauptteil 2" bestätigt |
| 4 | Gruppe mit einer Sportart | ✅ Hinweis im Lückentext |
| 5 | Gruppe ohne Halle | ✅ `generator.test.ts` |
| 6 | Gruppe ohne Teilnehmerzahl | ✅ `generator.test.ts` |
| 7 | Sehr kurze Einheitsdauer | ✅ `timeline.test.ts` |
| 8 | Segment kürzer als die kürzeste Übung | ✅ Grund „zu kurz", Prüfplan bestätigt |
| 9 | Alle Segmente frei | ✅ `generator.test.ts`; sperrt das Speichern korrekt **nicht** |
| 10 | Übung während des Generierens gelöscht | ⚠️ Nur gelesen — der Pool wird vor dem Rechnen geladen, ein danach gelöschter Datensatz läuft in den Platzhalter |
| 11 | Teilnehmerzahl Min > Max | ✅ `generator.test.ts` |
| 12 | Netzwerkfehler beim Generieren | ⚠️ Nur gelesen — Aufräumschritt vorhanden, nicht ausgelöst |
| 13 | Verlassen der Konfigurationsseite | ❌ **Nicht umgesetzt** — siehe BUG-3 |
| 14 | Mehrfaches schnelles Generieren | ⚠️ Knopf gesperrt; serverseitig bewusst keine Drosselung |
| 15 | Segment auf 0 Minuten | ✅ `timeline.test.ts`, Schema erzwingt ≥ 1 |

### Sicherheits-Audit

Geprüft mit simulierten Sitzungen direkt in der Datenbank — unabhängig vom Anwendungscode, also auch gegen einen Angreifer gültig, der die Oberfläche umgeht.

- [x] **Datentrennung bewiesen.** Sitzung von Nutzer B: 0 Zeilen in `units`, `unit_segments`, `unit_items`, `exercise_usages`, `exercises`, `groups`, `venues`, `custom_categories`. Gegenprobe mit dem Eigentümer: 12 / 40 / 71 / 71 / 45 / 2 Zeilen. Der Test ist damit aussagekräftig und nicht bloß durchweg blockierend
- [x] **Ohne Anmeldung kein Zugriff.** Rolle `anon`: 0 Zeilen in allen acht geprüften Tabellen, einschließlich `profiles`
- [x] **Zugriffsschutz vollständig.** Alle 14 Tabellen mit RLS; die vier PROJ-6-Tabellen mit Richtlinien für alle nötigen Befehle. `exercise_usages` hat bewusst keine UPDATE-Richtlinie — Verwendungsnachweise werden nur angelegt und gelöscht
- [x] **Keine Secrets im Auslieferungsstand.** 1670 Build-Dateien durchsucht, 0 Treffer für den Dienstschlüssel, davon 0 im Client-Bundle (`.next/static`). *Methodischer Hinweis: Ein erster Durchlauf meldete 72 Treffer. Das war ein Fehlalarm — die Stichprobe lag innerhalb der 110 Zeichen, die sich Dienst- und anon-Schlüssel teilen, und traf damit den anon-Schlüssel, der dort hingehört. Erst eine Stichprobe aus dem Signaturteil ist eindeutig.*
- [x] **Kein XSS-Einfallstor.** Kein `dangerouslySetInnerHTML`, kein `eval`, keine `new Function` im gesamten Quellbaum
- [x] **Gefährliche Links blockiert.** `musicLink` und Übungslinks werden beim Schreiben auf `http://`/`https://` geprüft (`httpUrl`-Schema). PROJ-6 stellt sie neu dar (`unit-item-card.tsx`), verlässt sich dabei aber auf die Prüfung beim Schreiben
- [x] **Keine Filter-Injection.** Die einzige Stelle mit Zeichenketten-Einsetzung in eine PostgREST-Abfrage (Übungssuche) entfernt weiterhin `,()"'\` — die Behebung aus PROJ-3 hält
- [x] **Eingabeprüfung serverseitig.** Alle Mutationen prüfen Anmeldung und Eigentum; `unitConfigSchema` erzwingt Segmentsumme, Mindestdauer, mindestens eine Sportart und eine gültige Hauptsportart; 18 Tests darauf
- [ ] **Härtung fehlt in der Datenbank** — siehe BUG-4
- [ ] **Keine Drosselung** — bewusste Entscheidung vom 2026-10-04, dokumentiert im Decision Log

**Vorbestehend, nicht aus PROJ-6** (gehört in `/deploy`): vier Supabase-Hinweise — `handle_new_user` und `update_updated_at` ohne gesetzten `search_path`, `handle_new_user` als `SECURITY DEFINER` für `anon` und `authenticated` aufrufbar, und die abgeschaltete Prüfung auf geleakte Passwörter.

### Datenintegrität im Produktionsbestand

Direkt gegen die echten 12 Einheiten geprüft:

| Prüfung | Ergebnis |
|---|---|
| Verwaiste Segmente / Einträge / Verwendungen | 0 / 0 / 0 |
| Segmentsumme ≠ Gesamtdauer der Einheit | 0 |
| Segment über seinem Minutenbudget | 0 |
| Doppelte Übung innerhalb einer Einheit | 0 |
| Plandauer außerhalb ±25 % (gegen die **effektive** Dauer) | 0 von 71 |
| Mehr als ein Entwurf je Nutzer | eingehalten |

### Gefundene Fehler

#### BUG-1: Das Löschen einer Gruppe vernichtet alle ihre Einheiten ohne Warnung
- **Status:** ✅ **Behoben am 2026-10-05** — siehe „Behebung BUG-1" in den Implementation Notes. Erneut zu prüfen im nächsten `/qa`
- **Schwere:** Hoch
- **Schritte:**
  1. Gruppen-Detailseite einer Gruppe mit gespeicherten Einheiten öffnen
  2. „Löschen" wählen
  3. Der Dialog sagt nur: „Möchtest du … wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
  4. Erwartet: Der Dialog nennt die Zahl der Einheiten, die mit verschwinden
  5. Tatsächlich: Kein Hinweis. `units.group_id` steht auf ON DELETE CASCADE, alle Einheiten der Gruppe samt Segmenten, Einträgen und Verwendungsnachweisen sind weg
- **Warum das zählt:** Der Nutzer löscht ein Gruppenprofil und verliert seine Stundenplanung. Beim Löschen einer **Übung** nennt PROJ-6 die betroffenen Einheiten bereits beim Namen — beim Löschen einer **Gruppe**, wo deutlich mehr auf dem Spiel steht, gar nichts. Der Dialog stammt aus PROJ-5 und wurde bei der Einführung der Einheiten nicht nachgezogen
- **Betroffen jetzt:** 12 Einheiten auf zwei Gruppen
- **Priorität:** Vor dem Deployment beheben

#### BUG-2: Entwürfe erscheinen in der Löschwarnung für Übungen
- **Status:** Behoben am 2026-10-05, mit E2E-Test samt Gegenprobe
- **Schwere:** Niedrig
- **Schritte:** Einheit generieren, nicht speichern; eine darin verwendete Übung löschen wollen
- **Erwartet:** Nur abgelegte Einheiten werden genannt
- **Tatsächlich:** `getUnitNamesUsingExercise` filtert nicht auf `saved`. Der Nutzer wird vor einer Einheit gewarnt, die er in seinem Ordner nirgends findet
- **Priorität:** Im nächsten Durchgang

#### BUG-3: Keine Warnung beim Verlassen der Konfigurationsseite
- **Schwere:** Niedrig
- **Spec:** Edge Case 13 verlangt eine Browser-Warnung über nicht gespeicherte Eingaben, sobald der Zeitverlauf bearbeitet wurde
- **Tatsächlich:** Nicht umgesetzt; kein `beforeunload` im Formular. Ein versehentlicher Seitenwechsel verwirft einen aufwendig gebauten Zeitverlauf
- **Priorität:** Im nächsten Durchgang

#### BUG-4: Der Zugriffsschutz prüft Eigentum an Gruppe und Übung nicht
- **Schwere:** Niedrig (Härtung)
- **Befund:** `units` INSERT prüft nur `auth.uid() = user_id` — die `group_id` bleibt ungeprüft. `unit_items` INSERT prüft nur Segment → Einheit → Nutzer — `exercise_id` und `variant_id` bleiben ungeprüft
- **Auswirkung heute:** Keine Offenlegung. Die Server Actions prüfen beides, und die Leserichtlinien verhindern, dass fremde Namen sichtbar würden. Über die REST-Schnittstelle könnte ein Nutzer aber mit eigenem Token Einheiten anlegen, die auf fremde Gruppen oder Übungen verweisen — Datenmüll im eigenen Konto
- **Warum trotzdem melden:** PROJ-7 bringt weitere Schreibwege. Die Datenbank ist die zweite Verteidigungslinie und sollte nicht darauf bauen, dass jeder künftige Schreibweg selbst prüft
- **Priorität:** Im nächsten Durchgang

#### BUG-5: Der Platzhalter „Übung gelöscht" bietet kein Nachbesetzen
- **Schwere:** Niedrig
- **Spec:** „…dann steht an dieser Stelle ein Platzhalter ‚Übung gelöscht' **mit Möglichkeit zum Nachbesetzen**"
- **Tatsächlich:** Der Platzhalter erscheint samt freigewordener Minutenzahl, eine Möglichkeit zum Nachbesetzen fehlt
- **Einordnung:** Das Nachbesetzen ist inhaltlich PROJ-7 (Editor). Das Kriterium gehört dorthin verschoben, statt es hier als erfüllt zu führen
- **Priorität:** Mit PROJ-7

#### BUG-6: Der Verwendungszeitpunkt steht auf „generiert", nicht auf „gespeichert"
- **Schwere:** Niedrig
- **Befund:** `exercise_usages.used_at` wird beim Generieren gesetzt. Das Kriterium lautet „wenn sie **gespeichert** wird, dann wird … festgehalten … wann"
- **Auswirkung:** Keine funktionale — Entwürfe sind von der Frische-Regel ausgenommen. Sobald PROJ-3 die Sortierung „Zuletzt verwendet" auf diese Tabelle stützt, wird der Zeitpunkt aber sichtbar und kann Tage danebenliegen
- **Priorität:** Nice to have

#### BUG-7: Ein verlassener Entwurf ist nicht mehr auffindbar
- **Schwere:** Niedrig
- **Schritte:** Einheit generieren, ohne zu speichern auf „Meine Einheiten" wechseln
- **Tatsächlich:** Der Entwurf ist absichtlich in keiner Liste. Es gibt aber auch keinen Hinweis, dass einer existiert, und keinen Weg zurück außer der Browser-Historie
- **Einordnung:** Kein Datenverlust — der Entwurf wird beim nächsten Generieren ohnehin ersetzt. Der Nutzer kann aber glauben, Arbeit verloren zu haben
- **Priorität:** Nice to have

#### BUG-8: Die E2E-Tests konnten nicht ausgeführt werden
- **Status:** ✅ **Im Kern erledigt am 2026-10-05, zweiter Durchlauf.** Die Suite ist **erstmals vollständig gelaufen** (38 grün, 46 rot, 8 übersprungen, 18,9 Min) — über den Edge-Ersatzweg. Offen bleibt allein die Virenscan-Ausnahme, damit der **gebündelte Chromium und WebKit** nutzbar werden; ohne sie fehlt die Mobilbreite (BUG-11). Die roten Tests sind in BUG-10 und BUG-11 aufgeschlüsselt und **keiner davon ein Produktfehler des Generators**
- **Schwere:** Niedrig (Werkzeug, kein Produktfehler)
- **Befund (erster Durchlauf):** Der Playwright-Browser lud nicht vollständig herunter, zuletzt bei 4,7 MB stehen geblieben. Vermutet wurde allein der Echtzeit-Virenscan
- **Befund (zweiter Durchlauf) — zwei Ursachen, nicht eine:**
  1. **Eine liegengebliebene Sperrdatei.** In `%LOCALAPPDATA%\ms-playwright\__dirlock` stand eine Sperre aus dem abgebrochenen Versuch vom 2026-10-05, 01:14 Uhr. Solange sie dort lag, **brach jedes `npx playwright install` sofort ab — und zwar mit Rückgabewert 0**, also als Erfolg getarnt. Der Download hat deshalb nie wieder begonnen. Das erklärt, warum der erste Durchlauf „abgebrochene Downloads" sah. Die Sperre ist in diesem Durchlauf entfernt worden
  2. **Der Echtzeit-Virenscan.** Nach dem Entfernen der Sperre läuft das Entpacken wirklich an, bleibt aber reproduzierbar bei denselben drei Dateien stehen (`ABOUT`, die Manifest-Datei, `D3DCompiler_47.dll` — zusammen 4,7 MB) und kommt in 15 Minuten nicht weiter. Die großen Binärdateien dahinter (`chrome.dll`, rund 200 MB) werden offenbar beim Schreiben gescannt
- **Was daraus folgt:** Die Ordner-Ausnahme im Virenschutz bleibt nötig. Sie allein hätte aber auch beim ersten Mal nicht genügt, weil die Sperrdatei den Download unabhängig davon verhindert hat. Beides musste weg; eines davon ist es jetzt
- **Nachzuholen (in dieser Reihenfolge):**
  1. Im Windows-Echtzeitschutz eine **Ordner-Ausnahme** für `%LOCALAPPDATA%\ms-playwright` eintragen
  2. `npx playwright install chromium`
  3. `npm run test:e2e`
  4. Sollte Schritt 2 wieder ohne Ausgabe und ohne Fehler enden: `rm -rf "$LOCALAPPDATA/ms-playwright/__dirlock"` und erneut versuchen — das ist genau das Fehlerbild von Ursache 1
- **Priorität:** Vor dem Deployment nachholen

#### BUG-9: Lockern wird angeboten, wo es nachweislich nicht helfen kann
- **Status:** ✅ **Behoben am 2026-10-05** im Zuge von `/deploy`. In `relaxCanHelp` gibt `no-phase` jetzt `false`; der Nutzer bekommt statt des folgenlosen Knopfes den Satz, dass Lockern hier nichts bringt, **und** den Rat, der Phase Übungen zuzuordnen. Der Befund im Generator wurde vor der Behebung am Code nachgeprüft: `buildPool` filtert in `generator.ts:264-266` zuerst auf die Phase, `criteriaFor` greift erst danach — ein leerer Phasen-Treffer bleibt auf jeder Lockerungsstufe leer
- **Schwere:** Niedrig
- **Gefunden:** 2026-10-05, zweiter Durchlauf (Code-Beweis, nicht bedient)
- **Schritte:** Ein Segment auf eine **neu angelegte eigene Phase** stellen, für die es noch keine Übung gibt, und generieren
- **Erwartet:** Kein Lockern-Knopf — stattdessen nur der Grund und der Rat, der Phase Übungen zuzuordnen
- **Tatsächlich:** Der Knopf „Mit gelockerten Kriterien erneut versuchen" erscheint. Er kann nicht wirken: `buildPool` in `src/lib/units/generator.ts:263` filtert **zuerst** auf die Phase und erst danach greifen die lockerbaren Kriterien; `criteriaFor` gibt nur Sportart und Schwierigkeitsgrad frei. Ist `phaseMatches` leer (`kind: 'no-phase'`), bleibt der Pool auf **jeder** Lockerungsstufe leer. In `gap-notice.tsx:65` gibt `relaxCanHelp` für alles außer `'all-filtered'` pauschal `true` zurück und übersieht diesen Fall
- **Abgrenzung:** Für `'exhausted'` und `'too-short'` ist das Anbieten **richtig** — dort kann eine gelockerte Sportart oder Schwierigkeit tatsächlich eine weitere Übung in den Pool holen. Nur `'no-phase'` ist die Sackgasse. Die Behebung ist eine Zeile: in `relaxCanHelp` zusätzlich `if (detail.kind === 'no-phase') return false`
- **Warum es trotzdem zählt:** Edge Case 3 der Spec begründet die leere Phase ausdrücklich mit dem „klaren Lernmoment". Ein Knopf, der folgenlos bleibt, arbeitet dagegen — der Nutzer probiert das Lockern statt die Übungen der Phase zuzuordnen. Fachlich gedeckt ist der Nutzer: das Kriterium „Erfolgloses Lockern wird begründet" greift, er bekommt nach dem Klick eine Erklärung. Es ist ein Umweg, kein Datenfehler
- **Priorität:** Im nächsten Durchgang

#### BUG-10: Die E2E-Tests aus PROJ-3 und PROJ-5 prüfen gegen veraltete Oberflächen
- **Schwere:** Mittel (Testschuld — **kein** Produktfehler)
- **Gefunden:** 2026-10-05, zweiter Durchlauf, im ersten vollständigen angemeldeten E2E-Lauf
- **Befund:** Neun Tests aus PROJ-3 und PROJ-5 fallen durch. Alle geprüften Fehlschläge gehen auf **veraltete Testerwartungen** zurück, nicht auf Produktfehler:
  - **PROJ-5 (4 Tests)** suchen „**Trainingszeit** hinzufügen" und „Trainingszeit entfernen". Die Oberfläche heißt seit einer Umbenennung „**Hallenzeit**" — im Quellcode 7 Treffer für „Hallenzeit", in den Tests 9 für „Trainingszeit". Der Seitenabzug des Fehlschlags zeigt die Knöpfe „Wiederkehrende Hallenzeit hinzufügen" und „Einmalige Hallenzeit hinzufügen" einwandfrei vorhanden
  - **PROJ-3 (5 Tests)** greifen auf Struktur statt auf Inhalt: `AC: Empty State bei leerer Datenbank` prüft `expect(hasExercises || hasEmptyState).toBe(true)` mit `page.locator('[class*="divide-y"]')`. Diese Klasse gibt es in der heutigen Listenansicht nicht mehr, und ein Leerzustand kann nicht erscheinen, weil `tests/fixtures.ts` dem Testkonto sechs Übungen anlegt — beide Teilbedingungen falsch, also Fehlschlag
- **Warum das erst jetzt auffällt:** Diese Tests liefen bis zu diesem Durchlauf **nie angemeldet**. Abgemeldet leitete jede geschützte Seite auf `/login` um, und die Tests waren so gebaut, dass sie bei fehlendem Inhalt stillschweigend durchliefen. Die angemeldete Teststrecke aus PROJ-6 hat die Schuld nicht verursacht, sondern nur sichtbar gemacht
- **Warum Mittel und nicht Niedrig:** Eine Rückschrittsprobe, die aus veralteten Gründen rot ist, ist so gut wie keine. Sie verdeckt künftige echte Rückschritte in PROJ-3 und PROJ-5 und macht jeden `npm run test:e2e` unlesbar
- **Einordnung:** Gehört **nicht** zu PROJ-6. Die Behebung ist ein eigener Aufräum-Commit auf PROJ-3 und PROJ-5: Beschriftungen nachziehen und die Struktur-Selektoren durch Rollen und Texte ersetzen
- **Priorität:** Vor `/deploy`, gemeinsam mit BUG-8 — sonst steht dort eine rote Suite, die nichts aussagt

#### BUG-11: Das Projekt „Mobile Safari" übernimmt den Browser-Ersatzweg nicht
- **Schwere:** Niedrig (Testwerkzeug — **kein** Produktfehler)
- **Gefunden:** 2026-10-05, zweiter Durchlauf, im ersten vollständigen E2E-Lauf
- **Befund:** Von den 46 Fehlschlägen des Durchlaufs sind **36** aus dem Projekt `Mobile Safari`. Alle brechen mit derselben Meldung ab: „Looks like Playwright Test or Playwright was just installed or updated. Please run … `npx playwright install`". In `playwright.config.ts:69–75` setzt das Projekt `...devices['iPhone 13']`, **ohne `...browser` zu übernehmen** — anders als die drei übrigen Projekte. `devices['iPhone 13']` verlangt WebKit, und WebKit ist auf diesem Rechner nicht installiert. Der Ersatzweg `PLAYWRIGHT_CHANNEL=msedge` greift für dieses Projekt also nicht
- **Auswirkung:** Die Prüfungen auf **375 px und 768 px** laufen überhaupt nicht — und damit die Technical Requirement „Alle Views responsiv. Der Zeitverlauf muss auf Smartphone-Breite (375 px) bedienbar sein". Am Code belegt ist nur die Rückfallebene: das Minutenfeld je Segment (`segment-editor.tsx:78–82`, `type="number"`, `inputMode="numeric"`). **Im Browser ist auf Mobilbreite nichts geprüft**
- **Zwei Wege zur Behebung:**
  - Mit der Ordner-Ausnahme aus BUG-8 schlicht `npx playwright install` **ohne** `chromium` aufrufen, damit WebKit mitkommt. Dann läuft das Projekt wie gedacht — das ist der saubere Weg
  - Oder, falls WebKit dauerhaft fehlen soll, in `playwright.config.ts` auch dieses Projekt mit `...browser` versehen. Dann prüft es die Mobilbreite in einem Chromium-Motor statt in WebKit — weniger aussagekräftig, aber besser als nichts
- **Priorität:** Vor `/deploy`, zusammen mit BUG-8

#### BUG-12: Ein PROJ-6-E2E-Test stört sich mit den nebenläufig laufenden Projekten
- **Schwere:** Niedrig (Testwerkzeug — **kein** Produktfehler)
- **Gefunden:** 2026-10-05, zweiter Durchlauf
- **Betroffen:** `AC: der geänderte Name gilt in der Übersicht` (`tests/PROJ-6-einheiten-generator.spec.ts:105`)
- **Der Nachweis, dass es kein Produktfehler ist:**

  | Lauf | Ergebnis |
  |---|---|
  | In der **vollen Suite** | **rot** — und zwar reproduzierbar, in beiden QA-Durchläufen an derselben Stelle |
  | **Allein**, mit `-g "der geänderte Name gilt in der Übersicht"` | **grün in 7,0 Sekunden** |

  Ein Test, der allein grün und im Verbund rot ist, prüft nicht das Produkt,
  sondern die Nebenläufigkeit.
- **Was im Verbund passiert:** Der Test speichert eine Einheit unter eigenem Namen, wartet die Bestätigung „Gespeichert" ab — die laut `unit-plan-view.tsx:158` **nur** erscheint, wenn der Server `saved = true` zurückgemeldet hat — und findet in „Meine Einheiten" dennoch den Leerzustand. Zwischen Speichern und Nachsehen hat also etwas die Einheiten des Testkontos geleert
- **Die wahrscheinliche Mechanik:** Alles teilt **ein einziges Testkonto**. Bei `fullyParallel: true` laufen die Projekte `chromium` und `Mobile Safari` gleichzeitig, und innerhalb von `chromium` laufen die drei Spec-Dateien gleichzeitig. `mode: 'serial'` ordnet nur die Tests **innerhalb** der PROJ-6-Datei, nicht das Verhältnis zu den übrigen. Dazu löscht `tests/PROJ-6-einheiten-generator.spec.ts:40` in jedem `beforeEach` **alle** Einheiten des Kontos (`delete().eq('user_id', userId)`) und `tests/fixtures.ts:108` tut dasselbe in `seed`/`cleanup`. Ein solcher Rundumschlag trifft zwangsläufig auch das, was ein nebenläufiger Test gerade braucht
- **Warum das jetzt erst auffällt:** Vor diesem Durchlauf ist die Suite nie vollständig gelaufen (BUG-8). Nebenläufigkeitsfehler zeigen sich nur im Verbund
- **Was zu tun ist:** Die Testkonten trennen (je Projekt eines, oder je Worker über `testInfo.parallelIndex`), oder die Rundumschläge durch zielgenaues Löschen der selbst angelegten Einheiten ersetzen. Beides gehört zu derselben Aufräumarbeit wie BUG-10
- **Priorität:** Vor `/deploy`, gemeinsam mit BUG-10 und BUG-11

### Behebung BUG-10, BUG-11 und BUG-12 — 2026-10-05

Auf Wunsch zuerst die Teststrecke, noch im selben `/qa`-Durchlauf. **Am
Produktcode wurde nichts geändert** — nur an `tests/` und
`playwright.config.ts`. BUG-9 bleibt bewusst offen und gehört zu `/frontend`.

**Die gemeinsame Wurzel von BUG-10 und BUG-12: ein geteiltes Testkonto ohne
Ordnung.** Jede Spec-Datei baute ihren Bestand selbst auf und riss ihn danach
mit Rundumschlägen wie `units.delete().eq('user_id', …)` wieder ab. Weil alle
Dateien und beide Browser-Projekte sich **ein** Konto teilen und bei
`fullyParallel: true` gleichzeitig laufen, zog jeder Abriss den nebenläufigen
Tests die Daten unter den Füßen weg.

**Neu: Grundbestand einmal zentral.**
- `tests/data.setup.ts` legt Gruppe und Übungen **einmal je Durchlauf** an, im
  Projekt `setup`, bevor irgendein Test läuft
- `tests/data.teardown.ts` räumt sie **einmal** am Ende auf, über das neue
  `teardown`-Projekt
- `fixtures.ts` bekommt `FIXTURE_GROUP_NAME` (fester Name statt `Date.now()`,
  damit der Bestand nachschlagbar ist), `getFixtures()` zum Nachschlagen statt
  Anlegen und `deleteUnitsOfGroup()` für zielgenaues Aufräumen
- Die PROJ-6-Spec **schlägt den Bestand nur nach** und löscht im
  `beforeEach` nur noch die Einheiten **ihrer** Gruppe. Alle übrigen
  Datenbankgriffe dort sind auf `group_id` eingegrenzt

**Der Leerzustand braucht ein leeres Konto — und damit ein eigenes Projekt.**
Der Test „ohne Gruppe erscheint der Hinweis" räumt zwangsläufig alles weg.
Er steht jetzt in `tests/PROJ-6-leerzustand.exklusiv.spec.ts` und läuft im
neuen Projekt `exklusiv`, das über `dependencies` von `chromium`,
`Mobile Safari` und `abgemeldet` abhängt und damit garantiert **zuletzt und
allein** startet.

**BUG-11 — und warum der erste Versuch nicht reichte.** Zunächst wurde nur
`...browser` **nach** `devices['iPhone 13']` gezogen, in der Annahme, der
`channel` überschreibe die Browserwahl. Der nächste Durchlauf zeigte: alle 36
Tests fielen weiter aus. Ein Probelauf direkt gegen Playwright brachte den
Grund:

```
iPhone 13 defaultBrowserType: webkit
webkit FEHLER: Executable doesn't exist at …\ms-playwright\webkit-2248\Playwright.exe
chromium+msedge: Start erfolgreich
```

Playwright wählt den Browser über `defaultBrowserType`, **nicht** über
`channel` — es suchte also unverändert WebKit. Nötig ist deshalb ein eigener
Satz Optionen, der auch den Browsertyp mitzieht:

```ts
const mobileBrowser = channel ? { channel, browserName: 'chromium' as const } : {}
```

Damit prüft der Ersatzweg die Mobilbreite in einem Chromium-Motor statt in
WebKit — weniger aussagekräftig als echtes Safari, aber ungleich besser als 36
Tests, die stillschweigend gar nicht laufen. Ohne die Variable bleibt es bei
WebKit, der Standardweg ändert sich also nicht.

*Nebenbefund:* `devices['iPhone 13']` hat einen Sichtbereich von **390 × 664**,
nicht 375. Die ausdrücklichen 375-px-Prüfungen stellen ihren Sichtbereich in
den Tests selbst ein (`PROJ-5-gruppenprofile.spec.ts`, Abschnitt „Responsive").

**BUG-10 — die neun veralteten Tests.** Keiner davon hat einen Produktfehler
aufgedeckt; alle prüften an der heutigen Oberfläche vorbei:

| Test | Was veraltet war |
|---|---|
| PROJ-5, 4 Tests | „Trainingszeit" heißt in der Oberfläche längst „**Hallenzeit**" |
| PROJ-5, dieselben | Nach der Umbenennung trifft `getByText('Wiederkehrend')` auch den Knopf „Wiederkehrende Hallenzeit hinzufügen" → `exact: true` |
| PROJ-3 Filter-Sheet | `getByText('Phase')` trifft auch den Platzhalter „Alle Phasen", ebenso „Sportart"/„Alle Sportarten" → `exact: true` |
| PROJ-3 Ansichts-Toggle | Prüfte `data-state="active"`. Die Umschalter sind zwei gewöhnliche Knöpfe und tragen kein solches Attribut (Rest einer früheren Tabs-Fassung). Geprüft wird jetzt, **was der Nutzer sieht**: Liste gegen Karten-Raster |
| PROJ-3 Wizard, 2 Tests | `getByText('Einordnung')` trifft auch die Fortschrittsanzeige → `getByRole('heading', …)` |
| PROJ-3 Leerzustand | `expect(hasExercises \|\| hasEmptyState).toBe(true)` — eine **Tautologie**, und `.count()` wartet nicht, während die Seite ihre Übungen noch nachlädt. Ersetzt durch eine Prüfung, dass die Übersicht den Grundbestand zeigt; der echte Leerzustand liegt jetzt im `exklusiv`-Projekt |

**BUG-13 — was das Entschärfen der Kaskade freigelegt hat.** Sobald der
blockierende Test aus BUG-12 grün war, lief `AC: Umbenennen über das
Karten-Menü` **erstmals überhaupt** — und fiel durch. Er suchte im Dialog einen
Knopf „Umbenennen". So heißen der Menüpunkt und die Überschrift des Dialogs;
der Bestätigungsknopf heißt **„Speichern"** (`unit-actions-menu.tsx:116`).
Wieder ein Testfehler, kein Produktfehler. Behoben.

Damit das nicht Fehlschlag für Fehlschlag weitergeht, wurden die **übrigen
bislang übersprungenen Tests** in einem Durchgang gegen die Komponenten
geprüft: `aria-label="Aktionen für …"`, die Menüpunkte „Umbenennen" und
„Löschen", „Endgültig löschen", „Zurück zum Generator" als `link` und das
Fehlen von „Zeitverlauf" im Standard-Modus — **alle korrekt**, nur das eine
Label war falsch.

**Eine Eigenschaft des Entwurfs, die bewusst in Kauf genommen ist:** Das
Projekt `exklusiv` ordnet sich über `dependencies` hinter die übrigen ein —
Playwrights einzige Möglichkeit, Reihenfolge zwischen Projekten zu erzwingen.
Nebenwirkung: Schlägt irgendwo etwas fehl, wird es übersprungen. Der
Leerzustands-Test läuft also nur bei grüner Suite. Das ist der Preis dafür,
dass er nicht mitten im Lauf den Bestand wegräumt.

Nach der Umstellung: **94 Tests in 8 Dateien**, `tsc --noEmit` ohne Fehler,
`npm run lint` 0 Fehler.

**Messpunkte der drei Durchläufe** — jeder über den Edge-Ersatzweg:

| Durchlauf | grün | rot | nicht gelaufen | Bemerkung |
|---|---|---|---|---|
| 1 (vor den Behebungen) | 38 | 46 | 8 | 36 × WebKit, 9 × veraltet, 1 × Nebenläufigkeit |
| 2 (nach BUG-10/12) | 51 | 37 | 6 | BUG-10 und BUG-12 **behoben**; BUG-11-Fix unzureichend, BUG-13 aufgedeckt |
| 3 (nach allen Behebungen) | **79** | **7** | 8 | 21,6 Min. WebKit-Ausfälle **weg**, veraltete Tests **weg** |
| 4 (nach BUG-14) | **92** | **1** | 1 | 17,1 Min. Der instabile Test grün, inklusive neuer Bestandsprüfung |
| 5 (nach BUG-15) | **94** | **0** | **0** | **10,0 Min. Vollständig grün** |

#### Wie aus 7 Fehlschlägen 0 wurden — Lauf 4 und 5

**Sechs der sieben waren Zeitüberschreitungen, und zwei Dinge haben sie beseitigt.**

Das erste war kein Testfehler, sondern ein hängender Prozess: Ein `npx playwright install chromium` vom 2026-10-05, 09:52 Uhr lief während Lauf 3 noch — und lief auch acht Stunden später noch, unverändert bei drei entpackten Dateien. Er wurde die ganze Zeit vom Echtzeitscanner begleitet. Nach dem Beenden des Prozessbaums fielen in Lauf 4 fünf der sechs Zeitüberschreitungen weg, ohne dass eine Testzeile geändert wurde. Die Last, die als „zwei gleichzeitig laufende Browser-Projekte" gedeutet wurde, kam zu einem guten Teil von ihm.

Das zweite war **BUG-15**: Die Zusicherungen hatten 5 Sekunden, der Test 120. Der letzte verbliebene Fehlschlag — `AC: Abbrechen-Link führt zurück zur Übersichtsseite` im Mobil-Projekt — brauchte in Lauf 5 **16,9 Sekunden** und war grün, derselbe Test im Chromium-Projekt 3,1 Sekunden. Er konnte das alte Fenster nie gewinnen.

**Der siebte, der instabile Test, war etwas anderes: eine Zusicherung, die nichts zusicherte.** Siehe **BUG-14**. Die Annahme, ein sichtbares „Gespeichert" belege ein erfolgreiches Speichern, war falsch — der laxe Textvergleich traf auch „Noch nicht gespeichert". Der Test ist seit Lauf 4 grün (6,1 s, dann 12,2 s), und er kann einen fehlgeschlagenen Speichervorgang nicht mehr überdecken: Die neue Zwischenprüfung am Bestand trennt die drei möglichen Ursachen voneinander, falls er wiederkommt.

**Was offen bleibt:** Die Prüfung in **echtem WebKit** (dafür braucht es die Ausnahme im Virenschutz, siehe oben) und **BUG-16** — ein Speichern ohne getroffene Zeile meldet Erfolg. Das ist die Mechanik, die das Bild aus Lauf 3 erzeugt haben kann; nachgewiesen ist sie nicht.

#### Was in Lauf 3 noch offen war (historisch)

**Sechs davon sind Zeitüberschreitungen im Mobil-Projekt — keine
Produktfehler.** Die Meldungen sind eindeutig:

| Test | Meldung |
|---|---|
| PROJ-5 „Hallenzeit entfernen" | `page.goto('/groups/new')` — **120 s** überschritten, „waiting until load" |
| PROJ-5 „Einmalige Hallenzeit" | dasselbe im `beforeEach`, **120 s** |
| PROJ-5 „Wiederkehrende Hallenzeit" | Test-Zeitüberschreitung, **120 s** |
| PROJ-3 „Pflichtfeldvalidierung" | Test-Zeitüberschreitung, **120 s** |
| PROJ-5 „Neue Gruppe Button öffnet Formular" | `toHaveURL` nach **5 s**: noch auf `/groups` |
| PROJ-3 „Abbrechen-Link" | `toHaveURL` nach **5 s**: noch auf `/exercises/new` |

Drei Belege, dass das die Umgebung ist und nicht die App:
1. **Dieselben Tests sind im Chromium-Projekt grün.** „Abbrechen-Link" etwa
   steht dort nicht in der Fehlerliste — nur in der Mobil-Fassung
2. **Es sind reine Zeitüberschreitungen**, keine inhaltlich falschen
   Zusicherungen. Keine fehlende Beschriftung, kein falscher Text
3. **Der Seitenabzug von „Neue Gruppe Button" zeigt `/groups/new` korrekt
   geöffnet** — die Seite kam an, nur nach dem 5-Sekunden-Fenster

Die Ursache ist dieselbe wie bei BUG-8: der Echtzeit-Virenscan. Seit BUG-11
behoben ist, laufen **zwei** Browser-Projekte gleichzeitig, und damit reicht
es nicht mehr. **Die Ordner-Ausnahme ist damit von „wäre schön" zu
„notwendig" geworden.**

**Der siebte ist der offene Punkt.** `AC: der geänderte Name gilt in der
Übersicht` (`PROJ-6-einheiten-generator.spec.ts:112`) ist **instabil**:

| Lauf | Mobil-Projekt | Ergebnis |
|---|---|---|
| 1 | startete nicht | rot |
| 2 | startete nicht | **grün** |
| 3 | lief wirklich | rot |
| allein, gezielt | — | **grün in 7,0 s** |

Das Mobil-Projekt ist also **nicht** der Störer: In Lauf 1 und 2 lief es
beidemal nicht, das Ergebnis war trotzdem unterschiedlich.

Die echte Meldung lautet: `getByText('Eigener Einheitenname')` nach 5 s nicht
gefunden, und `/units` zeigt den **Leerzustand**. Was dagegen spricht, es als
Produktfehler zu führen:
- Die Bestätigung „Gespeichert" war vorher sichtbar, und die erscheint nur,
  wenn der Server `saved = true` zurückgemeldet hat
- Allein läuft derselbe Test grün
- Der Nutzer hat diesen Weg zweimal von Hand bestätigt, und im Bestand lagen
  12 gespeicherte Einheiten

Was noch **nicht** erklärt ist: `/units` ist eine **async
Server-Komponente** (`units/page.tsx`), die ihre Daten vor dem HTML holt — ein
Lade-Rennen im Browser ist damit ausgeschlossen. Der Server hat die Einheit
also wirklich nicht gefunden.

> **Nachtrag vom selben Tag:** Diese Untersuchung ist abgeschlossen, und sie
> hat die Voraussetzung des Absatzes darüber widerlegt. Die Bestätigung
> „Gespeichert" war **keine** Bestätigung — siehe **BUG-14**. Das Speichern
> hat nicht gegriffen, der Test hat es nur nicht gemerkt. Auch der Satz, das
> Mobil-Projekt sei nicht der Störer, stand auf einem Vergleich mit Lauf 1,
> dessen Fehlschlag damals eine andere, inzwischen behobene Ursache hatte
> (BUG-12) — er trägt nicht.

**Dieser eine Test blockiert acht weitere:** Er steht in Zeile 112, und die
Serien-Betriebsart überspringt danach die restlichen 7 Tests der Datei; dazu
entfällt das `exklusiv`-Projekt, weil es von einem roten Projekt abhängt. Das
sind genau die „8 did not run". **Er ist damit der einzige echte Hebel zu
einer grünen Suite.**

#### BUG-13: Der Umbenennen-Test sucht einen Knopf, der „Speichern" heißt
- **Status:** ✅ **Behoben am 2026-10-05**, im selben Durchlauf
- **Schwere:** Niedrig (Testwerkzeug — **kein** Produktfehler)
- **Gefunden:** 2026-10-05, nachdem die Behebung von BUG-12 die Serien-Kaskade entschärft hatte
- **Betroffen:** `AC: Umbenennen über das Karten-Menü wirkt in der Übersicht` (`tests/PROJ-6-einheiten-generator.spec.ts:133`)
- **Befund:** Der Test greift nach `dialog.getByRole('button', { name: 'Umbenennen' })` und läuft in die Zeitüberschreitung. „Umbenennen" heißen der **Menüpunkt** und die **Überschrift** des Dialogs; sein Bestätigungsknopf heißt **„Speichern"** (`confirmLabel="Speichern"`, `unit-actions-menu.tsx:116`). Der Seitenabzug zeigt den Dialog offen, den Namen eingetragen und die Knöpfe „Abbrechen" und „Speichern" — das Produkt verhält sich also richtig und in sich stimmig
- **Warum er erst jetzt auffiel:** Er war einer der acht Tests, die der Abbruch nach Zeile 105 übersprungen hat (BUG-12). Mit dessen Behebung lief er **erstmals überhaupt**. Genau dieser Zugewinn war der Zweck der Behebung — ein übersprungener Test ist kein grüner Test
- **Vorsorge:** Die **übrigen** bislang übersprungenen Tests wurden daraufhin in einem Durchgang gegen die Komponenten geprüft, statt sie Fehlschlag für Fehlschlag zu entdecken. Alle korrekt; nur dieses eine Label war falsch

#### BUG-14: Die Bestätigung „Gespeichert" war keine Prüfung, sondern eine Tautologie
- **Status:** ✅ **Behoben am 2026-10-05**, Lauf 4
- **Schwere:** Mittel (Testwerkzeug — **kein** Produktfehler, aber die Ursache dafür, dass ein echter Fehlschlag drei Läufe lang als unerklärt geführt wurde)
- **Gefunden:** 2026-10-05 bei der Untersuchung des instabilen Tests aus Lauf 3
- **Betroffen:** fünf Zusicherungen in `tests/PROJ-6-einheiten-generator.spec.ts` (Zeilen 120, 139, 158, 192, 211)
- **Befund:** `page.getByText('Gespeichert')` übersetzt Playwright zu `internal:text="Gespeichert"i` — **Teilzeichenkette, Groß- und Kleinschreibung gleichgültig**. Belegt im installierten Playwright an zwei Stellen: `escapeForTextSelector` hängt ohne `exact` ein `i` an (`playwright-core/lib/utils/isomorphic/stringUtils.js:116-120`), und der Textvergleicher wird damit zu `kind: "lax"` mit `normalized.toLowerCase().includes(selector)` (`createTextMatcher`, Injected-Script). Der Absatz des Entwurfs lautet „**Noch nicht gespeichert** — diese Einheit erscheint erst in deinen Übersichten …" (`unit-plan-view.tsx:227`) und enthält die gesuchte Zeichenkette. Die Zusicherung war also erfüllt — **am sichersten gerade dann, wenn das Speichern nicht gegriffen hatte**
- **Was daraus folgt:** Die Begründung, mit der der instabile Test bisher nicht als Produktfehler geführt wurde — „die Bestätigung war vorher sichtbar, und die erscheint nur, wenn der Server `saved = true` zurückgemeldet hat" —, **trägt nicht**. Die Erfolgsmeldung heißt „Einheit gespeichert" (`unit-plan-view.tsx:98`), der Vermerk neben dem Haken „Gespeichert" (`unit-plan-view.tsx:161`), und der erscheint nur bei `unit.saved`. Die leere Übersicht aus Lauf 3 war damit kein Rätsel: **Das Speichern hat nicht gegriffen, und der Test hat darüber hinweggesehen.** Die Suche nach einem Lade-Rennen im Browser ging ins Leere, weil es keines zu finden gab
- **Zweiter, unabhängiger Flattereffekt in derselben Zeile:** Bei **Erfolg** passen vorübergehend **zwei** Elemente auf den laxen Vergleich — die Meldung „Einheit gespeichert" und der noch stehende Entwurfs-Absatz, bis `router.refresh()` ankommt. Zwei Treffer sind im strikten Modus ein Fehler, und je langsamer der Server antwortet, desto länger steht das Fenster offen. Unter der Last zweier gleichzeitig laufender Browser-Projekte also genau dann, wenn die Suite voll läuft
- **Behebung:** alle fünf Zusicherungen auf `{ exact: true }`. Damit greift der strikte Vergleich `normalized === 'Gespeichert'` und trifft genau den Vermerk, den die Seite erst nach `unit.saved === true` vom Server zeigt. „Noch nicht gespeichert" und „Einheit gespeichert" fallen beide heraus
- **Dazu eine Zwischenprüfung am Bestand** im betroffenen Test: Sie trennt die drei verbleibenden Möglichkeiten voneinander — keine Zeile (die Einheit wurde weggelöscht), `saved: false` (das Speichern lief ins Leere), `saved: true` bei trotzdem leerer Übersicht (dann schlägt das Lesen in `getUnits` fehl). Tritt der Fall wieder auf, steht die Ursache im Fehlschlag statt in einer Vermutung

#### BUG-15: Die Zusicherungen hatten 5 Sekunden, der Test 120
- **Status:** ✅ **Behoben am 2026-10-05**, Lauf 5
- **Schwere:** Niedrig (Testwerkzeug — **kein** Produktfehler)
- **Gefunden:** 2026-10-05 am letzten verbliebenen Fehlschlag aus Lauf 4
- **Betroffen:** `playwright.config.ts`; sichtbar an `AC: Abbrechen-Link führt zurück zur Übersichtsseite` (`tests/PROJ-3-uebungsdatenbank.spec.ts:129`) im Projekt „Mobile Safari", in Lauf 3 **und** Lauf 4
- **Befund:** Die Testzeit war bewusst auf 120 Sekunden gesetzt, weil auf diesem Rechner schon das Starten eines Browser-Kontexts eine halbe Minute dauern kann. Die **Zusicherungen** blieben dabei bei den 5 Sekunden der Voreinstellung — ein Fenster, das 24-mal kleiner ist als das des Tests, den es absichern soll
- **Warum das kein Produktfehler ist:** Der Seitenabzug zeigt den Link `Abbrechen` mit `/url: /exercises` **geklickt und fokussiert** (`[active]`), die Meldung lautet „5 × unexpected value `/exercises/new`". Der Klick saß also; nur die clientseitige Navigation kam nach dem Fenster an. Derselbe Test ist im Chromium-Projekt grün — gegen denselben Server, nur ohne die Last des zweiten Projekts daneben
- **Behebung:** `expect: { timeout: 15_000 }` in `playwright.config.ts`, mit derselben Begründung, die über der Testzeit schon stand: lieber ein langsamer Durchlauf als ein Fehlschlag, der nach einem Produktfehler aussieht und keiner ist

#### BUG-16: Ein Speichern, das keine Zeile trifft, meldet Erfolg
- **Status:** **Offen** — gehört zu `/backend`, nicht zu QA (wie BUG-9)
- **Schwere:** Niedrig
- **Gefunden:** 2026-10-05, als BUG-14 die Frage freilegte, wie ein Speichern scheitern kann, ohne sich zu zeigen
- **Betroffen:** `saveUnit` (`src/lib/actions/units.ts:578-585`), dieselbe Mechanik in `renameUnit` (`:530-537`)
- **Befund:** Das Update läuft über `.eq('id', unitId).eq('user_id', user.id)`. Trifft es **keine** Zeile, ist das in Supabase kein Fehler: `error` bleibt leer, die Aktion meldet `success: true`, die Oberfläche zeigt „Einheit gespeichert" — und geschrieben wurde nichts. Der Nutzer hält eine Einheit für gesichert, die in keiner Übersicht erscheint
- **Wie eine Zeile verschwinden kann:** `generateUnit` (`:333`) löscht Entwürfe **kontoweit** — `.eq('user_id', user.id).eq('saved', false)`, nicht nach Gruppe eingeschränkt. Ein zweites Generieren in einem anderen Tab reißt damit den Entwurf weg, den die erste Seite gerade speichern will. Zwei offene Tabs genügen
- **Was nachgewiesen ist und was nicht:** Die Mechanik erzeugt **genau** das Bild aus Lauf 3 — Bestätigung sichtbar, Übersicht leer, Server hat die Einheit wirklich nicht. Dass sie dort zugeschlagen hat, ist damit **nicht** bewiesen: Innerhalb der Serien-Betriebsart generiert im Lauf niemand nebenher, und in Lauf 4 und 5 trat der Fall nicht wieder auf. Die Zwischenprüfung aus BUG-14 nagelt es beim nächsten Auftreten fest
- **Was zu tun ist:** `.select('id')` an das Update hängen und eine leere Antwort als Fehler behandeln („Diese Einheit existiert nicht mehr."). Dazu den kontoweiten Rundumschlag in `generateUnit` auf die bearbeitete Gruppe einschränken

#### Beobachtung ohne Fehlerstatus: Lockern verändert eine gespeicherte Einheit unmittelbar
Speichern ist bei einer Lücke gesperrt, eine gespeicherte Einheit hat also normalerweise keine. Entsteht später doch eine — etwa weil eine verwendete Übung gelöscht wurde —, erscheint der Lockern-Knopf, und `relaxSegment` ändert die **gespeicherte** Einheit an Ort und Stelle. Das widerspricht dem seit dem 2026-10-05 geltenden Grundsatz, dass „Neu generieren" gespeicherte Einheiten unangetastet lässt. Der Fall ist selten und harmlos, sollte beim Entwurf von PROJ-7 aber mitentschieden werden.

### Regression

- `npm test`: **242 Tests grün** über 10 Dateien, darunter die Bestände aus PROJ-2, PROJ-3 und PROJ-5 ohne Rückschritt
- `npm run build`: erfolgreich, alle 20 Routen registriert
- `npm run lint`: 0 Fehler, 4 vorbestehende `<img>`-Warnungen aus PROJ-3
- `npm run test:pruefplan`: 15 Prüffälle grün gegen die echten Daten
- PROJ-3-Nacharbeiten aus PROJ-6 (stabile Variantenkennungen, Löschwarnung mit Namen) ohne erkennbare Nebenwirkung; der Bestand zeigt zwei Einträge, deren Variantenverweis eine spätere Übungsänderung überlebt hat — genau das, was die Behebung bezweckte

### Zusammenfassung

- **Akzeptanzkriterien:** 92 von 94 erfüllt. 1 teilweise (BUG-5, inhaltlich PROJ-7), 1 mit Einschränkung (BUG-6)
- **Edge Cases:** 12 von 15 bestätigt, 2 nur gelesen, 1 nicht umgesetzt (BUG-3)
- **Gefundene Fehler:** 8 — 0 kritisch, 1 hoch (**behoben am 2026-10-05**), 0 mittel, 7 niedrig
- **Sicherheit:** Datentrennung und Zugriffsschutz bewiesen, keine Secrets im Auslieferungsstand, keine Injection- oder XSS-Einfallstore. Eine Härtungslücke in der Datenbank (BUG-4)
- **Produktionsreif:** **NEIN** zum Zeitpunkt der Prüfung — BUG-1 ist seitdem behoben, die Freigabe hängt an einer erneuten Prüfung durch `/qa`

**Empfehlung:** BUG-1 ist ein Einzeiler im Löschdialog der Gruppe plus eine Abfrage der betroffenen Einheiten — dieselbe Mechanik, die beim Löschen einer Übung bereits steht. Danach lohnt der Nachlauf der E2E-Tests (BUG-8), weil die Teststrecke dieser Sitzung erstmals angemeldet prüft und bisher nie gelaufen ist. BUG-2 bis BUG-7 blockieren das Deployment nicht.


## Deployment

- **Production URL:** https://stundenplaner-self.vercel.app
- **Deployed:** 2026-10-05
- **Tag:** `v1.5.0-PROJ-6`
- **Weg:** Push auf `main`, Vercel liefert automatisch aus (Projekt hängt seit PROJ-1 am GitHub-Repo)

### Vorprüfung

| Punkt | Ergebnis |
|---|---|
| `npm run build` | ✅ 20 Routen |
| `npm run lint` | ✅ 0 Fehler, 4 vorbestehende `<img>`-Warnungen aus PROJ-3 |
| `npm test` | ✅ 249 Tests in 11 Dateien |
| `npm run test:e2e` | ✅ 94 Tests, 0 Fehlschläge (Edge-Ersatzweg) |
| QA-Freigabe, 0 kritisch/hoch | ✅ |
| Secrets im Repo | ✅ nur `.env.example` und `.env.local.example`; `.env*.local` ist ignoriert |
| Env-Variablen | ✅ die App braucht drei: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` |

> **`SUPABASE_SERVICE_ROLE_KEY` gehört nicht nach Vercel.** Er wird allein von
> den E2E-Tests gebraucht (`tests/fixtures.ts`) und kommt im Anwendungscode
> nicht vor. In der Produktion hätte er nichts zu tun außer Schaden anzurichten.

### Nachprüfung in der Produktion — 2026-10-05

| Prüfung | Ergebnis |
|---|---|
| Neue Auslieferung erkennbar | ✅ Die vier Sicherheits-Kopfzeilen liegen an `https://stundenplaner-self.vercel.app/login` an. Sie sind der verlässlichste Marker, weil der vorige Stand sie **nicht** hatte |
| Öffentliche Seiten | ✅ `/`, `/login`, `/register` → 200 |
| Zugriffsschutz | ✅ `/units`, `/units/new`, `/exercises`, `/groups`, `/dashboard` → **307 auf `/login`** |
| Oberfläche geladen | ✅ „Stundenplaner", „Anmelden", „E-Mail", „Passwort" im ausgelieferten HTML |
| Env-Variablen in Produktion gesetzt | ✅ **bewiesen durch die 307**, siehe unten |

**Warum die 307 die Env-Variablen beweist:** `createClient()` in
`src/lib/supabase/server.ts:9-15` **wirft**, wenn
`NEXT_PUBLIC_SUPABASE_URL` oder `NEXT_PUBLIC_SUPABASE_ANON_KEY` fehlen, und
das geschützte Layout ruft sie ungeschützt auf. Fehlten die Variablen, käme
auf `/units` eine **500**, keine Weiterleitung. Die 307 entsteht erst in
`redirect('/login')` des Layouts — also nachdem der Client gebaut und
`getUser()` durchgelaufen ist.

> **Nicht** bewiesen ist damit die Netzverbindung zu Supabase: `getUser()`
> ohne Sitzungscookie antwortet aus dem Client heraus, ohne Anfrage an den
> Server. Die Middleware taugt dafür ebenfalls nicht als Beleg — sie steigt
> bei fehlenden Variablen **still** aus (`middleware.ts:9-11`) statt zu
> scheitern. Der letzte Schritt bleibt deshalb beim Nutzer: **einmal in der
> Produktion anmelden** und eine Einheit generieren.

**Nicht gemessen:** der Lighthouse-Wert aus der Checkliste
(`docs/production/performance.md`, Ziel über 90). Das braucht einen Browser
gegen die Produktions-URL und wurde in diesem Durchgang nicht erhoben — es
wäre falsch, hier eine Zahl zu behaupten.

### Was in dieser Auslieferung gehärtet wurde

**1. Sicherheits-Kopfzeilen** — `next.config.ts` war bis hierher leer; die Header
fehlten in PROJ-1 bis PROJ-5 also durchgehend. Jetzt liegen `X-Frame-Options:
DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
origin-when-cross-origin` und `Strict-Transport-Security` an jeder Antwort.
Nachgeprüft am Produktionsbuild gegen `localhost:3100`, alle vier vorhanden.
Eine **Content-Security-Policy** ist bewusst nicht dabei: Sie ist die wirksamste
dieser Kopfzeilen, bricht aber eine App, sobald eine Quelle fehlt, und gehört
in einen eigenen Durchgang mit eigener Prüfung.

**2. Drei der vier Supabase-Hinweise** — Migration
`20261005170437_harden_db_functions.sql`, angewendet auf die Produktionsdatenbank:

- `search_path` festgelegt auf `handle_new_user` und `update_updated_at` (Hinweis 0011)
- `EXECUTE` auf `handle_new_user` für `PUBLIC`, `anon` und `authenticated` entzogen (Hinweise 0028 und 0029). Die ACL steht jetzt auf `{postgres=X/postgres,service_role=X/postgres}`

Beides wurde **nach** dem Anwenden nachgeprüft, nicht nur angenommen:

- `update_updated_at` feuert weiter — Update auf eine echte Gruppe als Rolle `authenticated`, `updated_at` stieg, Änderung zurückgerollt
- Der Entzug bricht keinen bestehenden Trigger. Das Ausführungsrecht einer Trigger-Funktion prüft PostgreSQL beim `CREATE TRIGGER`, nicht bei jedem Auslösen. Belegt an einem Stellvertreter-Aufbau in derselben Datenbank: eigene Trigger-Funktion, Recht für `PUBLIC` und `authenticated` entzogen, Einfügen als `authenticated` lief fehlerfrei. Der Pfad über `supabase_auth_admin` selbst war nicht prüfbar — die MCP-Verbindung darf diese Rolle nicht annehmen
- Keine Rückstände: Prüftabelle, Prüffunktion und Prüfprofile sind weg, geprüft über `pg_tables`, `pg_proc` und `public.profiles`
- `get_advisors` meldet danach **nur noch einen** Hinweis statt vier

**3. BUG-9** — der letzte offene Produktfehler, eine Zeile in
`gap-notice.tsx`: `relaxCanHelp` gibt für `no-phase` jetzt `false`.

### Fehlertracking: Vercel-Monitoring statt Sentry

Bewusste Entscheidung des Nutzers am 2026-10-05. Sentry hätte ein eigenes Konto,
ein eigenes Projekt und einen DSN gebraucht, und sein Einrichtungsassistent
(`npx @sentry/wizard`) hätte `next.config.ts` umgeschrieben — genau die Datei,
in der jetzt die Sicherheits-Kopfzeilen stehen. Vercel bringt eigenes
Error-Tracking mit, ohne Konto und ohne Paket, dafür **ohne Source-Maps und mit
weniger Funktionen**. Zu finden im Vercel-Dashboard unter „Monitoring".

Wer später doch Sentry will: `docs/production/error-tracking.md`, und dabei die
Header in `next.config.ts` erhalten.

### Was nach der Auslieferung offen bleibt

1. **Schutz gegen geleakte Passwörter** — der vierte Supabase-Hinweis, und der
   einzige, der nicht per SQL geht. Supabase Dashboard → Authentication →
   Policies → „Leaked password protection" einschalten. Prüft Passwörter gegen
   HaveIBeenPwned
2. **BUG-16** — ein Speichern, dessen Update keine Zeile trifft, meldet Erfolg
   (`units.ts:578`). Gehört zu `/backend`
3. **Prüfung in echtem WebKit** — braucht die Ordner-Ausnahme im Virenschutz,
   und die muss in **Avast** stehen: Windows Defender ist auf diesem Rechner
   abgeschaltet
4. **Die 40 Testübungen** stecken weiter in der Datenbank, markiert mit
   `Testdaten (PROJ-6)`. Ihr Inhalt ist die Rohmasse für PROJ-4 — erst
   übernehmen, dann löschen
5. **E-Mail-Templates** — siehe die Pre-Launch-Checkliste im PRD. Braucht
   Custom SMTP

### Befund am Rande: das Migrationsregister ist unvollständig

Beim Pflichtpunkt „alle Migrationen angewendet" ist eine Abweichung
aufgefallen, die **nicht** aus PROJ-6 stammt und die Auslieferung nicht
aufhält, aber eine Falle für später ist:

Das Repo hat 12 Migrationsdateien, die Datenbank führt 9 Einträge. Drei
Dateien fehlen im Register ganz
(`group_schedules_one_time_dates`, `groups_single_participant_count`,
`groups_add_primary_sport`), drei weitere stehen unter anderen Zeitstempeln als
die Dateinamen (die `units`-Migrationen).

**Das Schema selbst ist vollständig** — nachgeprüft über
`information_schema.columns`: `group_schedules.schedule_type` und `.date` sind
da, `weekday` ist nullable, `groups.participants` existiert ohne
`participants_min`/`participants_max`, `groups.primary_sport` ist da. Die
Änderungen wurden also als rohes SQL eingespielt, ohne Eintrag ins Register.

**Die Falle:** Ein `supabase db push` würde versuchen, die drei nicht
registrierten Dateien erneut anzuwenden. Zwei sind idempotent
(`ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`), die dritte **ist es
nicht**: `ALTER TABLE groups RENAME COLUMN participants_max TO participants` in
`20261003120000` scheitert, weil die Spalte längst umbenannt ist. Vor einem
`db push` also entweder das Register nachziehen oder diese Migration gegen
Wiederholung absichern. Der Dateibestand im Repo ist korrekt und bildet ein
neues Schema richtig auf — irreführend ist allein das Register.

