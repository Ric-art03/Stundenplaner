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
3. **Die 40 Testübungen** stecken weiter in der Datenbank — Rohmasse für PROJ-4, erst übernehmen, dann löschen. *Seit dem 2026-10-17 in der Spec von PROJ-4 geregelt (es sind 39): erst als Block sichern, dann das ganze Konto leeren*

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

**PROJ-7 (Einheiten-Editor) ist am 2026-10-10 ausgeliefert** — https://stundenplaner-self.vercel.app, Tag `v1.6.0-PROJ-7`, Commit `0bfa3a6`. Abschnitt „Deployment" in der Spec. Vor dem Hochladen noch einmal geprüft: Build, Lint, 426 Unit-Tests, Register 15 zu 15, kein Geheimnis im Diff. Nach dem Hochladen: Vercel meldet die Auslieferung als abgeschlossen, öffentliche Seiten 200, geschützte Seiten 307 auf `/login`, Sicherheits-Kopfzeilen liegen an, keine Fehler in den Supabase-Protokollen.

Eines bleibt daraus: **der Editor ist in der Produktion noch nicht von Hand durchgespielt** — einmal anmelden, eine Einheit bearbeiten und speichern. Ohne Anmeldung ist das von außen nicht prüfbar.

Am selben Tag erledigt: `NEXT_PUBLIC_SITE_URL` fehlte seit PROJ-2 in `.env.local.example` und ist nachgetragen; in Vercel ist die Variable richtig gesetzt, vom Nutzer im Dashboard nachgesehen.

**PROJ-14 (Live-Modus) hat seit dem 2026-10-10 eine Spec** — [PROJ-14-live-modus.md](PROJ-14-live-modus.md), vom Nutzer am selben Tag abgenommen. Der Live-Modus ist ein eigener Bildschirm, der **eine Übung groß** zeigt, ihre Restzeit herunterzählt, nie selbst weiterschaltet und in einer Zeile sagt, wie die Stunde im Plan liegt. Vor dem Start steht ein Bereitschaftsbild mit dem Material der ganzen Einheit; eingegriffen wird nur mit Auslassen und Pause, der Plan selbst bleibt beim Editor. Nach dem Start läuft die Stunde ohne Netz auf demselben Gerät. Neu an den Daten: jede **Durchführung** wird festgehalten (Zeitpunkt, je Schritt gemacht oder ausgelassen, tatsächliche Dauer, eine Notiz) und steht an der Einheit. Am selben Tag nachgeschärft: der Bildschirm ist **ungleich geteilt** — unter der aktuellen Übung steht fest die nächste, mit dem, was sich an Material und Organisationsform ändert; der **Bildschirm bleibt an**, und das Bereitschaftsbild erklärt nur dann etwas, wenn das Gerät es nicht zulässt; und in der **Nachbereitung** gehen Erkenntnisse direkt in die Übung (Notiz anhängen, Dauer übernehmen, bearbeiten, löschen — eine Erweiterung an PROJ-3). Zurückgestellt und eigens zu besprechen: ein Pool „bewährter" Übungen, die der Generator bevorzugt. Offen gelassen für PROJ-10: ob die Rotation sich künftig nach der Durchführung statt nach dem Speichern richtet.

**PROJ-14 hat seit dem 2026-10-10 einen Technikentwurf** — Abschnitt „Tech Design" in der Spec, vom Nutzer am selben Tag abgenommen. Die tragende Entscheidung: beim Start holt die App einmal alles und legt es als **Stundenakte auf dem Gerät** ab; der Live-Bildschirm spricht danach nur noch mit dieser Akte, und jede Uhr wird aus festgehaltenen Zeitpunkten **gerechnet, nicht mitgezählt**. Daraus fallen „kein Netz", „Sperren und Neuladen ändern nichts" und „die Einheit darf sich währenddessen ändern" ohne eigene Regeln ab.

- **Ein kleiner Offline-Baustein nur für `/live`** — vom Nutzer entschieden, ein Vorgriff auf PROJ-11, aber auf diesen einen Bildschirm begrenzt. Ohne ihn stünde nach einem Neuladen in einer Halle ohne Empfang die Fehlerseite des Browsers. `/live` ist dafür eine feste Adresse ohne Einheit darin und **verlangt keine Anmeldung vom Server**; die Akte trägt das Konto, alles Serverseitige prüft weiter
- **Zwei neue Tabellen** (Durchführung, Schritt der Durchführung), an den bestehenden ändert sich kein Feld. Der Schritt trägt den Namen als Abschrift und einen Verweis auf die Übung
- **Gespeichert wird sofort bei „Stunde beenden"**, nicht erst bei „Fertig" — vom Nutzer entschieden, kleine Abweichung vom Wortlaut der Spec. In einem Zug, mit einer Kennung, die das Gerät beim Start vergibt; ohne Netz wartet die Durchführung auf dem Gerät
- **Bildschirm an:** nachgesehen — iPhone ab iOS 16.4, Android seit 2020. Dass der Stromsparmodus des iPhones das Wachhalten ablehnt, ist **nirgends belegt**; die App probiert es deshalb aus, statt zu raten, und die Anleitung nennt den Bereich der Einstellungen statt jeden Menüpunkt
- **Keine neuen Pakete**

Auf diesem Rechner nicht nachweisbar und für `/qa` vorgemerkt: Wachhalten, Stromsparmodus und Ton brauchen ein echtes iPhone und ein echtes Android-Gerät.

**Der Editor von PROJ-7 ist in der Produktion von Hand durchgespielt** — vom Nutzer am 2026-10-10 gemeldet, erfolgreich. Der Punkt aus der Auslieferung ist damit erledigt.

**Die Oberfläche von PROJ-14 steht seit dem 2026-10-10** — Abschnitt „Implementation Notes (Frontend)" in der Spec. **474 Unit-Tests grün** (426 plus 48 neue), Typprüfung, Lint und Produktionsbuild sauber. Vier Logikbausteine tragen den Live-Modus, alle ohne Oberfläche prüfbar (`src/lib/live/`: Schritte, Material, Verlauf, Uhr), dazu die Stundenakte auf dem Gerät. Der Live-Bildschirm selbst ist bei 375 px gegen den Produktionsbuild durchgespielt, mit vorgestellter Uhr — die Zeiten stimmen, nichts scrollt waagerecht.

Drei Dinge sind damit **nicht** belegt:

- **Alles hinter der Anmeldung** ist ungesehen: „Stunde starten" an einer echten Einheit, der Hinweis in der Kopfzeile, die Nachfrage beim Abmelden, der Hinweis in der Bearbeiten-Maske
- **Der Offline-Baustein** ist gebaut, aber nicht ohne Netz erprobt
- **Die Nachbereitung** (vier Wege je Übung) ist gebaut, aber erst mit einer gespeicherten Durchführung bedienbar — also erst nach `/backend`

Bis `/backend` bleibt jede beendete Stunde in der Warteliste auf dem Gerät, und die Kopfzeile sagt dauerhaft „wartet auf Verbindung". Das ist der Stand der Oberfläche, kein Fehler. Offen zur Ansicht am echten Handy: bei 375 × 667 schaut „Danach" nur knapp hervor, wenn die aktuelle Übung zwei Arbeitsnotizen und eine Beschreibung hat.

**Am 2026-10-11 nach der Durchsicht durch den Nutzer nachgeschärft** — sieben Punkte, alle Oberfläche, in der Spec unter „Nach der Durchsicht durch den Nutzer nachgeschärft": „Danach" ist ein **eigenes blaues Segment** über die ganze Breite statt eines umrandeten Felds, mit der neuen Phase in der Kopfleiste; dasselbe Muster zeigt als **„Zuerst"** die erste Übung unten auf dem Bereitschaftsbild; **erst „Kann weg", dann „Neu holen"**; überall **erst die Beschreibung, dann die Arbeitsnotiz**; **Musik-Links** je Übung auf dem Bereitschaftsbild; der Hinweis **„Stunde läuft" klebt** unter der Kopfzeile. **476 Unit-Tests grün**, Typprüfung, Lint und Build sauber; Der angeklebte Hinweis ist ungesehen — er liegt hinter der Anmeldung.

**Vom Nutzer am 2026-10-11 im Browser angesehen und für gut befunden**, mit drei letzten Punkten, am selben Tag eingebaut und danach committet: die **Arbeitsnotiz der Phase bleibt an jedem Schritt der Phase stehen** (nicht nur am ersten — weicht von der Spec ab, dort vermerkt) und steht vor der der Übung, beide mit vollem Namen; im Menü steht „Live-Modus verlassen“ vor „Stunde beenden“; die Zusammenfassung sagt, dass sich die Stunde auch später an der Einheit nachbereiten lässt.

**Am 2026-10-11 nachgezogen:** die Arbeitsnotiz der Phase steht **oben bei der aktuellen Übung, als Erstes**, und in „Danach" nur, wenn die Phase als Nächstes beginnt.

**Die Serverseite von PROJ-14 steht seit dem 2026-10-11** — Abschnitt „Implementation Notes (Backend)" in der Spec. Migration `20261011100000_unit_runs.sql` angewendet, **Register 16 zu 16**; **492 Unit-Tests grün** (476 plus 16 neue), Typprüfung, Lint und Produktionsbuild sauber. Zwei neue Tabellen (`unit_runs`, `unit_run_steps`) mit acht Richtlinien nur für den Eigentümer und drei Datenbank-Funktionen: Durchführung in einem Zug ablegen (dieselbe Kennung nie zweimal), Notiz anhängen, Dauer übernehmen — die beiden letzten ändern Übung und Vermerk gemeinsam oder gar nicht. Alles, was die Oberfläche offen ließ, ist angeschlossen: Speichern und Nachreichen, die Liste an der Einheit, „Zuletzt durchgeführt am …", die Nachbereitung, die Beschreibung der Variante und das Titelbild auf dem Gerät.

Am lebenden System in einer zurückgerollten Transaktion nachgewiesen, sechzehn Fälle: Speichern, Wiederholung ohne Doppel, nichts halb geschrieben, veralteter Stempel überschreibt nicht, Dauer einer Variante lässt die Grundübung in Ruhe, Plandauer der Einheit bleibt, fremdes Konto sieht und ändert nichts, `anon` ausgesperrt. Nichts zurückgeblieben; `get_advisors` meldet weiter nur den bekannten Hinweis zum Passwortschutz.

Was das **nicht** belegt und in `/qa` gehört:

- **Der Weg vom Knopf bis zur Zeile** ist im Browser nie gelaufen — weder das Speichern einer Durchführung noch die Nachbereitung
- **Die Löschfälle** (Übung weg → Name bleibt; Einheit weg → Durchführungen weg) sind nur am Katalog abgelesen; der Block mit `DELETE` wurde vom Werkzeug abgelehnt, auch zurückgerollt
- **Zwei gleichzeitige Sendungen** und die **Ablage der Bilder** sind ungeprüft; der Offline-Baustein weiter nicht ohne Netz erprobt
- Wachhalten, Stromsparmodus und Ton brauchen zwei echte Geräte

**Vom Nutzer am 2026-10-11 von Hand durchgespielt — es klappt alles** (Stunde starten, beenden, Durchführung an der Einheit, Notiz und Dauer übernehmen). Der Weg vom Knopf bis zur Zeile ist damit einmal gelaufen. Dazu drei Änderungen, in der Spec unter „Nach dem Durchspielen durch den Nutzer geändert": der Dialog **„Notiz anhängen" zeigt das Notizfeld der Übung selbst** — umschaltbar zwischen Arbeitsnotiz und Anmerkungen, beide direkt änderbar und gemeinsam gespeichert, statt „Dein Satz" und Vorschau (ersetzt fünf Akzeptanzkriterien der Spec); der Vermerk **„Notiz übernommen" nennt beides**, wenn beide geändert wurden (zweite Migration `20261011140000_exercise_notes_follow_up.sql`, Funktion `update_exercise_notes` statt `append_exercise_note`); die **Bilder sind auch in „Danach" und „Zuerst" aufklappbar**; nach „Fertig" blitzt nicht mehr „Es läuft gerade keine Stunde" auf; **„Übung löschen" ist aus der Nachbereitung entfernt** — es bleiben drei Wege, und vier Akzeptanzkriterien der Spec sind damit überholt; im Live-Modus lässt sich **durch alle Bilder der Übung blättern**. **496 Unit-Tests grün**, Typprüfung, Lint und Build sauber. Die zweite Migration ist angewendet (**Register 17 zu 17**) und am lebenden System in einer zurückgerollten Transaktion nachgewiesen, fünfzehn Fälle. **Im Browser sind der neue Notiz-Dialog und die Bilder in „Danach" noch ungesehen.**

**PROJ-14 ist seit dem 2026-10-11 in der QA — nicht bereit für die Auslieferung.** Abschnitt „QA Test Results" in der Spec. **Kein Akzeptanzkriterium ist durchgefallen** (105 von 114 bestanden, 5 ohne echtes Gerät nicht prüfbar, 2 entfallen), kein Befund am Zugriffsschutz der Datenbank, kein Datenverlust in einem der Fälle. 512 Unit-Tests grün; 175 neue Browser-Tests für den Live-Modus (Rechner, Handybreite, ohne Anmeldung), davon 7 als erwartete Fehlschläge markiert, die die Befunde nachstellen.

- **BUG-23 (hoch): der Offline-Baustein greift auf dem normalen Weg nicht.** Wer über „Stunde starten" in den Live-Modus kommt, hat den Bildschirm nicht auf dem Gerät — ein Neuladen ohne Netz zeigt doch die Fehlerseite des Browsers. Nachgestellt: der Baustein ist angemeldet, seine Ablage bleibt leer; erst ein vollständiges Laden von `/live` füllt sie. Der Stand der Stunde bleibt in jedem Fall erhalten. Das Bereitschaftsbild sagt nichts davon
- **BUG-22 (mittel):** die Notiz „Wie lief's?" geht verloren, wenn „Fertig" das noch laufende Speichern überholt — nur bei langsamer Verbindung
- **BUG-24 (mittel):** eine *beendete* Stunde bleibt nach dem Abmelden unter `/live` einsehbar (Namen und Zeiten). Betrifft geteilte Geräte; ein anderes angemeldetes Konto sieht sie nicht
- **BUG-25 (niedrig):** „Fertig" ohne Netz führt auf die Fehlerseite des Browsers. Durchführung und Notiz warten unversehrt auf dem Gerät
- **BUG-26 (niedrig):** „Stunde starten" an einer Einheit ohne Schritt ist bedienbar; die Begründung kommt erst danach. Der Fall kann laut Speicherregel nicht entstehen

**Regression: keine.** Der Gesamtlauf aller Features ist grün — **333 von 333 Browser-Tests in einem Zug**, 16,8 Minuten, mit zwei Arbeitern und ohne Entwicklungsserver. Ein erster Gesamtlauf am selben Tag war es nicht: drei Editor-Tests scheiterten am Zeitfenster, während der Entwicklungsserver nebenher lief und die Live-Läufe mit drei Arbeitern gestartet waren. Für diesen Rechner gilt weiter: `--workers=2`, und nichts nebenher.

Zwischendurch sah es nach einem Absturz der ganzen App aus („Application error"): das war ein alter Testserver mit veraltetem Build auf Port 3100, kein Fehler der App.

Weiter nicht belegbar auf diesem Rechner: Wachhalten, Stromsparmodus, Ton und Vibration (zwei echte Geräte), Firefox und Safari, die Bilder der Übungen (die Testübungen haben keine).

**BUG-23 und BUG-25 sind am 2026-10-11 behoben und nachgeprüft** — Abschnitt „Nach der QA behoben" in der Spec. **337 von 337 Browser-Tests grün in einem Zug**, 517 Unit-Tests grün. Der Offline-Baustein füllt sich jetzt auch beim Wechsel aus der App (er holt sich die Seite und ihre Bausteine selbst, statt auf ein Zeichen zu warten, das dabei nie kam), und das Bereitschaftsbild sagt es, wenn es nicht klappt. „Fertig" ohne Netz bleibt in der App und sagt, dass nichts verloren ist; vor dem Verlassen fragt die App beim Server nach, statt dem Gerät zu glauben. Mit behoben, weil derselbe Fehler: „Live-Modus verlassen" ohne Netz. **Nicht belegt:** dasselbe auf einem echten Handy, vor allem Safari auf dem iPhone.

**BUG-22 und BUG-24 sind am 2026-10-11 ebenfalls behoben und nachgeprüft: 339 von 339 Browser-Tests grün in einem Zug, 529 Unit-Tests grün, keine Markierung als erwarteter Fehlschlag mehr.** Die Notiz „Wie lief's?" wird nach dem Speichern eigens nachgetragen, wenn sie unterwegs dazukam. Abmelden nimmt die Stundenakte immer vom Gerät, und `/live` zeigt ohne Anmeldung keine beendete Stunde und kein Bereitschaftsbild mehr — **mit einer bewusst gelassenen Ausnahme:** eine beendete Stunde bleibt stehen, solange ihre Durchführung noch auf dem Gerät wartet (höchstens zwölf Stunden). Das ist der Fall „Halle ohne Netz, Sitzung abgelaufen"; ohne die Ausnahme verlöre der Nutzer dort seine Zusammenfassung. Nicht belegt: das Abmelden selbst — im Browser-Test nicht ausführbar.

**Offen bleibt nur BUG-26** (niedrig): „Stunde starten" an einer Einheit ohne Schritt ist bedienbar; der Fall kann laut Speicherregel nicht entstehen.

**PROJ-14 ist seit dem 2026-10-11 freigegeben** — Abschnitt „QA — Nachtest und Freigabe" in der Spec, Stand Commit `db2dc8d`. Kein Fehler der Stufe „kritisch" oder „hoch", kein Akzeptanzkriterium durchgefallen, keine Regression: **339 von 339 Browser-Tests grün in einem Zug, 529 Unit-Tests grün**, kein erwarteter Fehlschlag mehr. Im Nachtest zusätzlich im Browser ausgeführt, was vorher nur am Code gelesen war: **das Abmelden selbst** (räumt die Stundenakte weg, die Warteliste bleibt) und **WLAN ohne Internet** („Fertig" bleibt in der App) — elf Prüfungen, alle bestanden.

Offen bleibt **BUG-26** (niedrig, kein Hindernis). Bewusst hingenommen: eine beendete Stunde bleibt ohne Anmeldung stehen, solange ihre Durchführung noch auf dem Gerät wartet.

### Was vor und bei der Auslieferung von PROJ-14 zu tun ist

1. **Hochladen:** die Commits seit der Auslieferung von PROJ-7 liegen nur lokal. Das Hochladen von `main` **ist** die Auslieferung und gehört zu `/deploy`
2. **Beide Migrationen sind schon in der Datenbank** (Register 17 zu 17), der Code kann jederzeit folgen. Die ausgelieferte Fassung (PROJ-7) benutzt weder die neuen Tabellen noch die neuen Funktionen und läuft damit unverändert weiter
3. **Neu in der Auslieferung:** die Datei `public/live-sw.js` (Offline-Baustein, nur für `/live`) und die Seite `/live`, die als einzige keine Anmeldung vom Server verlangt. Keine neue Umgebungsvariable, keine neuen Pakete
4. **Nach der Auslieferung am echten Handy durchspielen** — das ist die Prüfung, die hier nicht möglich war: Bildschirm bleibt an, Ton kommt, ein Neuladen ohne Netz zeigt den Live-Bildschirm (vor allem in Safari auf dem iPhone), und die Texte der Anleitung zum Stromsparmodus stimmen
5. **Nicht prüfbar auf diesem Rechner:** Firefox und echtes Safari; die Bilder der Übungen im Live-Modus (die Testübungen haben keine)
6. **Für Browser-Tests auf diesem Rechner:** `--workers=2`, kein Entwicklungsserver nebenher, und vorher den Port 3100 prüfen — ein alter Testserver liefert sonst einen veralteten Build

**PROJ-14 (Live-Modus) ist am 2026-10-11 ausgeliefert** — https://stundenplaner-self.vercel.app, Tag `v1.7.0-PROJ-14`, Commit `7567062`. Abschnitt „Deployment" in der Spec. Vor dem Hochladen noch einmal geprüft: Build, Lint, 529 Unit-Tests, Typprüfung, Register 17 zu 17, kein Geheimnis und keine neue Umgebungsvariable im Diff. Nach dem Hochladen: Vercel meldet die Auslieferung als abgeschlossen, öffentliche Seiten 200, geschützte Seiten 307 auf `/login`, `/live` und `/live-sw.js` liegen aus, Sicherheits-Kopfzeilen liegen an, keine Fehler aus der App in den Supabase-Protokollen. **Der Live-Bildschirm läuft in der Produktion**, und ein Neuladen ohne Netz zeigt ihn wieder — nachgesehen mit einer von Hand aufs Gerät gelegten Stundenakte, ohne Anmeldung.

Zwei Dinge bleiben daraus, beide nur von Hand zu erledigen:

- **Der angemeldete Weg ist in der Produktion noch nicht durchgespielt** — eine Stunde starten, durchgehen, beenden, die Durchführung an der Einheit ansehen, eine Notiz anhängen. Ohne Anmeldung ist das von außen nicht prüfbar
- **Am echten Handy:** bleibt der Bildschirm an, kommt der Ton, zeigt ein Neuladen ohne Netz den Live-Bildschirm (vor allem Safari auf dem iPhone), stimmen die Texte der Anleitung zum Stromsparmodus

Offen aus der QA: **BUG-26** (niedrig). Bewusst hingenommen: eine beendete Stunde bleibt ohne Anmeldung stehen, solange ihre Durchführung noch auf dem Gerät wartet.

**Die App hat seit dem 2026-10-12 ein Logo** — kein eigenes Feature, deshalb ohne Spec. Symbol: Klemmbrett mit Uhr; Wortmarke: „stunden" (Stärke 450) und „planer" (fett, grün) in der Schrift Outfit. Eingebaut als Favicon und App-Symbol (`src/app/icon.svg`, `apple-icon.png`), in beiden Kopfzeilen (am Handy nach dem Anmelden nur das Symbol, mit Wortmarke ab 768 px) und gestapelt über der Karte der vier Anmelde-Seiten, die bis dahin weder Namen noch Logo zeigten. Ein Baustein: `src/components/logo.tsx`. Die Entwürfe liegen unter https://claude.ai/artifact/3ejn77aT2Dbpaxm2VZBKJb.

- **Die Schrift liegt als Datei im Projekt** (`src/fonts/`), nicht bei Google: `next/font/google` holt sie beim Bauen, und das scheitert auf diesem Rechner an der Verbindung
- **Auf der Landingpage ist „Anmelden" in der Kopfzeile am Handy ausgeblendet** — Logo und zwei Knöpfe passen bei 375 px nicht nebeneinander; der Knopf steht weiter in der Seitenmitte
- **Zurückgestellt:** die Navigation. Drei Menüpunkte passen am Handy gerade noch; mit dem vierten (spätestens der Kalender, PROJ-9) braucht es eine Leiste am unteren Rand und ein Konto-Menü
- **Ungesehen:** die Kopfzeile hinter der Anmeldung. Geprüft sind Landingpage und Login am Produktionsbuild bei 375 und 1280 px, dazu Build, Lint, Typprüfung und 529 Unit-Tests; die Browser-Tests sind nicht gelaufen

**PROJ-16 (Verwaltung) hat seit dem 2026-10-12 eine Spec** — [PROJ-16-verwaltung.md](PROJ-16-verwaltung.md). Das Feature ist größer geworden als vorgemerkt: **PROJ-17 (Stundenmuster) ist darin aufgegangen**, und die **Hallenverwaltung zieht aus PROJ-5 mit um**. Eine Seite „Verwaltung" mit drei Reitern (Hallen, Stundenmuster, Kategorien) ist der eine Ort für alles, was der Nutzer selbst angelegt hat — ohne vierten Menüpunkt, erreichbar über eine Karte der Startseite und über „verwalten"-Links dort, wo die Dinge benutzt werden.

- **Kategorien** lassen sich anlegen, umbenennen und löschen. Umbenennen wirkt überall, wo der Begriff steht, in einem Zug; gleicht der neue Name einem vorhandenen, wird nach Nachfrage zusammengeführt. Löschen nimmt den Begriff nur aus den Auswahllisten — und er **kommt nicht von selbst zurück**. Heute trüge ihn das nächste Speichern einer Übung wieder ein; das ist beim Schreiben der Spec am Code aufgefallen
- **Stundenmuster** gelten für alle Gruppen. Passt die Dauer nicht, wird anteilig umgerechnet und es wird gesagt; Sportarten trägt ein Muster nur dort, wo bewusst von der Gruppe abgewichen wurde. Im Generator stehen sie als dritter Weg neben „Standard" und „Individuell", dazu „Auf Stundenmuster setzen" und „Stundenmuster speichern" am Zeitverlauf. Geändert wird ein Muster nur im Generator; Einheiten merken sich ihr Muster nicht
- Damit sind die drei Fragen beantwortet, die PROJ-6 an die Spec weitergereicht hatte

**PROJ-16 hat seit dem 2026-10-12 einen Technikentwurf** — Abschnitt „Tech Design" in der Spec, vom Nutzer am selben Tag abgenommen. Zwei Entscheidungen tragen ihn:

- **Löschen ohne Merkliste.** Die vier Stellen, die heute pauschal alles Nicht-Vordefinierte in die Auswahllisten eintragen (Übung, Gruppe, Halle, Generator), tragen künftig nur noch ein, was im Formular **neu eingetippt** wurde. Ein gelöschter Begriff, der noch in einer Übung steht, kommt damit nicht zurück — ohne Markierung „gelöscht"
- **Umbenennen und Zusammenführen als eine Datenbank-Funktion** — alle Stellen gemeinsam oder keine, wie das Speichern im Editor
- **Stundenmuster:** eine neue Tabelle, die Segmente als Liste in einem Feld; Anwenden und Speichern als zwei reine Umformungen. Das Umrechnen auf eine andere Dauer gibt es seit PROJ-6
- **Eine Migration**, rein hinzufügend (Tabelle der Muster, drei Funktionen); an bestehenden Tabellen ändert sich kein Feld. **Keine neuen Pakete.** Die neuen Zugriffsregeln brauchen die ausdrückliche Zustimmung des Nutzers, einzuholen in `/backend`
- **Abweichungen von der Spec, abgenommen:** Phasen höchstens 60 Zeichen statt 100 (mehr fasst das Segment einer Einheit nicht); nach „Zurück zum Generator" steht der Zeitverlauf unter „Individuell"; „verwalten"-Links aus Formularen öffnen einen neuen Tab

Baubar in drei Teilen: erst die Seite mit dem Umzug der Hallen (ohne Datenbank-Änderung, die Browser-Tests von PROJ-5 ziehen mit), dann Stundenmuster, dann Kategorien.

**Die Oberfläche von PROJ-16 steht seit dem 2026-10-12** — Abschnitt „Implementation Notes (Frontend)" in der Spec. **570 Unit-Tests grün** (529 plus 41 neue), Typprüfung, Lint und Produktionsbuild sauber; **im Browser nicht angesehen**, die Browser-Tests sind nicht gelaufen. Gebaut: die Seite `/manage` mit drei Reitern, der Umzug der Hallen (`/groups/venues` leitet weiter), die Karte auf der Startseite, die „verwalten"-Links, und im Generator der dritte Weg „Stundenmuster" samt „Auf Stundenmuster setzen" und „Stundenmuster speichern".

Sofort benutzbar sind der Reiter „Hallen" und bei den Kategorien **Anlegen und Löschen**. Alles andere wartet auf die Migration aus `/backend`:

- **Stundenmuster** — die Serverwege sind geschrieben, die Tabelle fehlt noch. Bis dahin ist der dritte Weg im Generator nicht wählbar, und „Stundenmuster speichern" meldet einen Fehler
- **Verwendungszahlen, Verwendungen nennen, Umbenennen/Zusammenführen** — die drei Datenbank-Funktionen
- **„Gelöschtes kommt nicht zurück"** ist nur für den Generator gebaut. An Übung, Gruppe und Halle kehrt ein gelöschter, aber noch benutzter Begriff beim nächsten Speichern zurück, bis der Server dort vorher/nachher vergleicht

**Die Serverseite von PROJ-16 steht seit dem 2026-10-13** — Abschnitt „Implementation Notes (Backend)" in der Spec. Migration `20261013090000_unit_patterns_and_category_management.sql` vom Nutzer freigegeben und angewendet, **Register 18 zu 18**; **578 Unit-Tests grün** (570 plus 8 neue), Typprüfung, Lint und Produktionsbuild sauber. Neu: die Tabelle der Stundenmuster mit vier Zugriffsregeln nur für den Besitzer und vier Funktionen (Verwendungen nennen, zählen, umbenennen/zusammenführen, dazu eine Hilfsfunktion). Alles, was die Oberfläche offen ließ, ist angeschlossen: Stundenmuster, Verwendungszahlen, Verwendungen nennen, Umbenennen und Zusammenführen — und Übung, Gruppe und Halle tragen beim Speichern nur noch ein, was neu dazukommt, sodass ein gelöschter Begriff dort nicht mehr von selbst zurückkehrt.

Am lebenden System in einer zurückgerollten Transaktion nachgewiesen, sechzehn Fälle: Zählen und Nennen, Umbenennen je Art an allen Stellen, Zusammenführen mit eigenem und mit vordefiniertem Begriff ohne Doppeltes, Material mit Menge, vergebener Name abgewiesen und nichts geändert, Längengrenzen, fremdes Konto sieht und ändert nichts, `anon` ausgesperrt. Nichts zurückgeblieben; `get_advisors` meldet weiter nur den bekannten Hinweis zum Passwortschutz.

- **Über den Entwurf hinaus:** die Lücken-Erklärung eines Segments trägt die Phase als Abschrift und wird mit umbenannt; Doppeltes wird bei jedem Umbenennen aufgeräumt, nicht nur beim Zusammenführen
- **Nicht belegt und für `/qa`:** der ganze Weg im Browser (Verwaltung, Generator mit Stundenmuster — nichts davon ist je angesehen worden, und die Browser-Tests sind seit dem Umzug der Hallen nicht gelaufen), der neue Änderungsstempel beim Umbenennen, zwei gleichzeitige Umbenennungen, die Geschwindigkeit bei 500 Übungen

**PROJ-16 ist am 2026-10-14 nach der Durchsicht durch den Nutzer überarbeitet** (`/refine`) — vier Punkte, alle in der Spec, **noch nichts davon gebaut**:

- **„Verwaltung" in der Kopfzeile ab 768 px** als vierter Menüpunkt; am Handy bleibt es bei drei
- **Halle löschen erklärt seine Folgen.** Am Code nachgesehen: die Gruppen verlieren die Halle, und **der Generator prüft für eine Gruppe ohne Halle gar kein Material mehr** — das stand nirgends. Der Dialog sagt es künftig, hängt aber nichts um
- **Material, das aus einer Halle wegfällt oder weniger wird, wird beim Speichern nachgefragt** (nur wenn Gruppen an der Halle hängen), mit Gruppen und Zahl der Übungen, die dort nicht mehr eingeplant werden. Bisher ohne jeden Hinweis. **Einen Materialbegriff in der Verwaltung zu löschen ist dagegen abgesichert** — Übungen und Hallen behalten ihn, der Generator rechnet wie vorher
- **Ein „Kategorien verwalten"-Link je Bildschirm**, unter dem letzten Kategorie-Feld, statt an jedem Feld (im Übungs-Assistenten waren es vier in einem Schritt, im Generator einer je Segment)
- **„Im Generator öffnen" im Menü eines Stundenmusters** — das Muster ist vorgewählt und wird beim Wählen der Gruppe angewendet. Kehrt die Entscheidung vom 2026-10-12 um

Neu offen, nicht entschieden: ob das Gruppen-Formular bei „Keine Halle" sagen soll, dass dann kein Material geprüft wird (eher PROJ-5).

**Die Überarbeitung ist am 2026-10-14 gebaut** — Abschnitt „Implementation Notes (Frontend) — Überarbeitung vom 2026-10-14" in der Spec. **590 Unit-Tests grün** (578 plus 12 neue), Typprüfung, Lint und Build sauber; keine Migration, keine neuen Pakete. Die Zählung für die Nachfrage zum Hallenmaterial rechnet über dieselbe Materialprüfung wie der Generator (`src/lib/manage/venue-materials.ts`). **Eine Verhaltensänderung:** passt ein Muster nicht zur gewählten Gruppe, bleibt es gewählt (mit Grund), statt auf „Standard" zurückzufallen. **Im Browser gesehen** ist nur die Kopfzeile (375, 768, 1280 px); das Testkonto hat keine Gruppe, Halle oder Muster, die Dialoge und der Generator mit vorgewähltem Muster sind ungesehen.

**PROJ-16 ist seit dem 2026-10-15 freigegeben** — Abschnitt „QA Test Results" in der Spec, Stand Commit `f825233`. Zum ersten Mal ist die Verwaltung im Browser gelaufen. **113 von 113 Akzeptanzkriterien bestanden** (64 davon im Browser ausgeführt, der Rest am lebenden System, über Unit-Tests oder nur am Code gelesen), kein Befund am Zugriffsschutz. **408 von 408 Browser-Tests grün in einem Zug** (16,3 Minuten), davon 69 neu für PROJ-16; 590 Unit-Tests grün.

- **BUG-27 (niedrig, offen):** ruft man den Generator direkt mit einem gelöschten Muster in der Adresse auf (Lesezeichen, Neuladen), fehlt die Meldung „gibt es nicht mehr". Über „Im Generator öffnen" erscheint sie. Ursache: die Meldungsanzeige hört beim ersten Aufbau einer Seite zu spät zu
- **Die Browser-Tests von PROJ-16 sind eine eigene Stufe** nach dem Live-Modus („verwaltung", danach „verwaltung mobil")
- **Erst der dritte Gesamtlauf war grün** — die ersten beiden scheiterten an Tests, nicht an der App: ein zu breiter Textgriff in PROJ-6 (das Wort „Zeitverlauf" steht seit PROJ-16 auch im Erklärsatz), eine feste Frist von 5 Sekunden in PROJ-3 und eine zeitweise langsame Verbindung zu Supabase (rund 1 Sekunde je Anfrage statt 0,2)
- **Nicht prüfbar auf diesem Rechner:** Firefox und echtes Safari. Nur am Code gelesen: der Generator bei von Hand verändertem Zeitverlauf (Nachfragen beim Ersetzen, beim Gruppenwechsel, beim Überschreiben)

**PROJ-16 (Verwaltung) ist am 2026-10-15 ausgeliefert** — https://stundenplaner-self.vercel.app, Tag `v1.8.0-PROJ-16`, Commit `ca89bdb`. Abschnitt „Deployment" in der Spec. Vor dem Hochladen geprüft: Build, Lint, Typprüfung, 590 Unit-Tests, Register 18 zu 18, kein Geheimnis, kein neues Paket und keine neue Umgebungsvariable im Diff. Nach dem Hochladen: Vercel meldet die Auslieferung als abgeschlossen, öffentliche Seiten 200, geschützte Seiten (auch `/manage` und `/groups/venues`) 307 auf `/login`, Sicherheits-Kopfzeilen liegen an, keine Datenbankfehler in den Supabase-Protokollen.

Eines bleibt daraus: **die Verwaltung ist in der Produktion noch nicht von Hand durchgespielt** — alles von PROJ-16 liegt hinter der Anmeldung. Einmal anmelden, die Seite „Verwaltung" mit allen drei Reitern öffnen, ein Stundenmuster speichern und im Generator anwenden. Offen aus der QA: **BUG-27** (niedrig).

**PROJ-16 ist am 2026-10-15 nach dem Durchspielen überarbeitet** (`/refine`) — zwei Punkte im Generator, in der Spec mit dem Vermerk *(2026-10-15)*, **noch nicht gebaut**:

- **Wer Handarbeit am Zeitverlauf wegwirft, wird vorher gefragt.** „Auf Standard zurücksetzen" verwarf bisher still, während „Auf Stundenmuster setzen" daneben nachfragte. Jetzt fragen beide — und auch der **Gruppenwechsel ohne Muster**, der seit PROJ-6 still verwarf (am Code aufgefallen, vom Nutzer mitgenommen). Der Weg „Standard" oben fragt bewusst nicht: dort geht nichts verloren
- **„Stundenmuster speichern" ist ausgegraut**, solange der Zeitverlauf genau dem geladenen Muster entspricht, mit dem Satz „Dieses Stundenmuster ist so schon gespeichert." Ein umgerechnetes Muster bleibt speicherbar
- **„Verändert" heißt künftig: anderer Inhalt**, nicht „angefasst" — für den Knopf und alle Nachfragen gleich. Eine zurückgenommene Änderung ist keine

Reine Oberfläche: keine Migration, keine neuen Pakete.

**Die Überarbeitung ist am 2026-10-15 gebaut** — Abschnitt „Implementation Notes (Frontend) — Überarbeitung vom 2026-10-15" in der Spec. **604 Unit-Tests grün** (590 plus 14 neue), Typprüfung, Lint und Build sauber. Der Vergleich nach Inhalt ist eine reine Funktion (`sameTimeline` in `src/lib/units/timeline.ts`) und ersetzt den Schalter, der sich nur merkte, ob etwas angefasst wurde. **Am selben Abend nachgeschärft, nach einer Rückfrage des Nutzers:** der Gruppenwechsel **nimmt den aktuellen Zeitverlauf mit** — auch ungespeichert, umgerechnet wie ein Muster (`carryTimeline`), ohne Nachfrage und mit dem Hinweis „Zeitverlauf übernommen …". Nachgefragt wird nur, wenn er nicht auf die neue Gruppe passt. Das ersetzt die Nachfrage beim Gruppenwechsel von wenigen Stunden zuvor und räumt eine Ungereimtheit ab: ein einmal gewähltes Muster wurde beim Wechsel frisch angewendet, auch wenn der Nutzer danach auf „Individuell" gegangen war.

**610 Unit-Tests grün** (20 neue). **Browser-Tests alle grün, keine Regression** — Gesamtlauf 340 von 418 grün, die drei Fehlschläge im Live-Modus einzeln nachgelaufen und grün, die beiden Verwaltungsstufen danach je 37 von 37 (darunter fünf neue). Die Fehlschläge kamen von der Leitung dieses Rechners, die den Abend über schwankte (zeitweise 1–21 s je Anfrage, auch bei Google). Von Hand im Browser angesehen ist nichts.

**Die Überarbeitung ist seit dem 2026-10-16 freigegeben** — Abschnitt „QA Test Results — Überarbeitung vom 2026-10-15" in der Spec, Stand Commit `b9b9844`. **13 von 13 Kriterien bestanden, kein neuer Fehler**; offen nur BUG-27 (niedrig). Was vorher nur am Code gelesen war — Speichern und danach ausgegraut, Mitnehmen mit gewähltem Muster, Rückfall auf das Muster, „Zurück zum Generator" —, ist jetzt im Browser gelaufen: 8 neue Tests je Rechner und Handy, beide Verwaltungsstufen **45 von 45**, dazu 5 Unit-Tests für das wiederholte Umrechnen (**615 grün**). Gesamtlauf ohne Regression (378 grün; die zwei Fehlschläge waren ein falscher Knopfname im neuen Test und ein Internetausfall beim Aufräumen). Nur am Code: „Standard" gewählt beim Gruppenwechsel und ein in einem anderen Tab überschriebenes Muster. Beobachtung für einen späteren `/refine`: „Individuell" ohne Änderung springt beim Gruppenwechsel auf „Standard" (so seit PROJ-6).

**Die Überarbeitung ist am 2026-10-16 ausgeliefert** — https://stundenplaner-self.vercel.app, Tag `v1.8.1-PROJ-16`, Commit `63afd19`. Abschnitt „Deployment — Überarbeitung vom 2026-10-15" in der Spec. Vor dem Hochladen geprüft: Build, Lint, Typprüfung, 615 Unit-Tests, kein Geheimnis, kein Paket, keine Migration, keine neue Umgebungsvariable. Nach dem Hochladen: Vercel meldet die Auslieferung als abgeschlossen, öffentliche Seiten 200, geschützte 307 auf `/login`, Sicherheits-Kopfzeilen liegen an. Die Supabase-Protokolle sind diesmal nicht nachgesehen (Werkzeug nicht verbunden); die Datenbank ist unberührt.

Eines bleibt: **der Generator mit den neuen Nachfragen ist in der Produktion noch nicht von Hand durchgespielt** — er liegt hinter der Anmeldung. Offen aus der QA: **BUG-27** (niedrig).

**PROJ-4 (Starter-Datenbank) hat seit dem 2026-10-17 eine Spec** — [PROJ-4-starter-datenbank.md](PROJ-4-starter-datenbank.md), vom Nutzer am selben Tag abgenommen. Ein gemeinsamer, kuratierter Bestand von 50–100 Übungen, aus dem der Nutzer **einzeln oder gesammelt übernimmt** — am schnellsten über **„Passt zu Gruppe"**, das alles vorauswählt, was der Generator für die Gruppe sofort einplanen würde, und bei Material oder Teilnehmerzahl den Grund nennt. Die Kopie gehört danach dem Nutzer und wird nie überschrieben.

- **Die Seite „Übungen" bekommt zwei Reiter: „Meine Übungen" und „Übungsdatenbank".** „Übungsdatenbank" meint künftig nur noch die öffentliche Sammlung (langfristig auch PROJ-12); alle Stellen, an denen der Begriff heute den eigenen Ordner meint, sind in Abschnitt A der Spec erfasst — acht Texte und ein Browser-Test
- **Gepflegt wird der Bestand ohne Admin-Seite:** Claude entwirft Blöcke aus Quellen, die der Nutzer zeigt, als Tabelle; der Nutzer bearbeitet sie; beim Einlesen wird jede Zeile geprüft; ein Block ist erst als Entwurf nur für den Entwickler sichtbar, dann freigegeben für alle
- **Urheberrecht:** feste Regeln (eigene Worte, Quellen mischen, keine Bilder, Herkunft vermerkt), rechtliche Durchsicht in der Pre-Launch-Checkliste des PRD

**Vor dem Bau zwei Vorarbeiten**, Reihenfolge vom Nutzer festgelegt:

1. **PROJ-19 (Grundstock der Kategorien)** — welche vordefinierten Begriffe es gibt, vor allem Sportarten, und dass sie überall in derselben Reihenfolge stehen. Neu in der Tabelle, noch ohne Spec
2. **Rohmasse sichern, dann das Konto des Nutzers leeren** — die 39 Testübungen (nicht 40) bereinigt als ersten Block sichern; danach alles außer der Anmeldung löschen, auch Gruppen, Hallen, Einheiten und Durchführungen, damit das Konto aussieht wie bei einem neuen Nutzer. Nur mit ausdrücklicher Zustimmung

**PROJ-19 (Grundstock der Kategorien) hat seit dem 2026-10-18 eine Spec** — [PROJ-19-grundstock-der-kategorien.md](PROJ-19-grundstock-der-kategorien.md), vom Nutzer am selben Tag abgenommen. Der Grundstock steht Begriff für Begriff fest: 20 Sportarten (Vorschulturnen und Allgemeinsport fallen weg, Gymnastik und Seniorensport kommen dazu), 11 Altersgruppen (Senioren geteilt in 60–75 und 75+), 3 Phasen, 9 Organisationsformen, 23 Materialien (Tor statt Tor/Netz, dazu Volleyballnetz und Stufenbarren).

- **Eine Reihenfolge überall:** eigene Begriffe oben, alphabetisch, danach die mitgelieferten in fester Reihenfolge — auch für gewählte Begriffe an Übung und Gruppe und für das Material im Live-Modus. Eine Ausnahme: im Generator stehen die Sportarten der Gruppe oben. Bei Varianten fehlen die eigenen Begriffe heute ganz; künftig nicht mehr
- **„Kein Material" ist kein Material mehr**, sondern eine eigene Wahl „Ohne Material" bei Varianten und im Filter
- **Kein Begriff zweimal:** wer einen vorhandenen eintippt, bekommt ihn ausgewählt; wächst der Grundstock, geht ein gleichnamiger eigener Begriff still im mitgelieferten auf
- **Die App bringt richtiges Markieren bei** — eine Übung trägt alle passenden Begriffe, sonst plant der Generator sie nicht überall ein. Satz unter Sportart und Altersgruppe beim Erfassen, Zusatz in der Generator-Begründung
- **Der vorhandene Bestand wird nicht umgeschrieben** — alles Betroffene sind Testdaten, die mit PROJ-4 gelöscht werden

**Neu auf der Roadmap: PROJ-20 (Hilfe & Tutorial), P0** — vom Nutzer am 2026-10-18 verlangt. Bündelt alle Inhalte zur Nutzerbildung aus den bisherigen Features (Gruppen mit mehreren Sportarten, nicht jede Stunde braucht alle Phasen, Dauer mit Nebenzeiten, Übungen mit allen passenden Begriffen markieren).

Offen für PROJ-4: die Spec nennt noch „Allgemeinsport" und „Senioren (60+)", und ihre Frage zu Krabbelgruppe und Eltern-Kind ist mit dem Grundstock beantwortbar.

**Nächster Schritt:** `/architecture` für PROJ-19, danach PROJ-19 bauen und dann `/architecture` für PROJ-4.

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|--------------|--------|------|---------|
| PROJ-1 | Supabase Infrastructure Setup | P0 | None | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-09-28 |
| PROJ-2 | Benutzerregistrierung & Login | P0 | PROJ-1 | Deployed | [Spec](PROJ-2-benutzerregistrierung-login.md) | 2026-09-28 |
| PROJ-3 | Übungsdatenbank (CRUD + Metadaten) | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-3-uebungsdatenbank.md) | 2026-09-28 |
| PROJ-4 | Starter-Datenbank (50–100 Übungen) | P0 | PROJ-3, PROJ-5, PROJ-19 | Planned | [Spec](PROJ-4-starter-datenbank.md) | 2026-09-28 |
| PROJ-5 | Gruppenprofile | P0 | PROJ-1, PROJ-2 | Deployed | [Spec](PROJ-5-gruppenprofile.md) | 2026-09-28 |
| PROJ-6 | Einheiten-Generator | P0 | PROJ-3, PROJ-5 | Deployed | [Spec](PROJ-6-einheiten-generator.md) | 2026-09-28 |
| PROJ-7 | Einheiten-Editor | P0 | PROJ-6 | Deployed | [Spec](PROJ-7-einheiten-editor.md) | 2026-09-28 |
| PROJ-9 | Kalenderansicht & Langzeitplanung | P1 | PROJ-6, PROJ-7 | Roadmap | — | 2026-09-28 |
| PROJ-10 | Übungsrotation (Abwechslung über Wochen) | P1 | PROJ-6, PROJ-9 | Roadmap | — | 2026-09-28 |
| PROJ-11 | PWA (Homescreen-Installation) | P1 | None | Roadmap | — | 2026-09-28 |
| PROJ-12 | Community-Features (Übungen teilen) | P2 | PROJ-3 | Roadmap | — | 2026-09-28 |
| PROJ-13 | Mehrsprachigkeit (i18n) | P2 | None | Roadmap | — | 2026-09-28 |
| PROJ-14 | Live-Modus (Stundenbegleitung) | P0 | PROJ-6, PROJ-7 | Deployed | [Spec](PROJ-14-live-modus.md) | 2026-10-01 |
| PROJ-15 | Dokumenten-Upload (Gruppen & Hallen) | P1 | PROJ-5 | Roadmap | — | 2026-10-02 |
| PROJ-16 | Verwaltung (Hallen, Stundenmuster, eigene Kategorien) | P0 | PROJ-3, PROJ-5, PROJ-6 | Deployed | [Spec](PROJ-16-verwaltung.md) | 2026-10-04 |
| PROJ-18 | Dunkelmodus (Schalter oder Systemeinstellung folgen) | P2 | None | Roadmap | — | 2026-10-09 |
| PROJ-19 | Grundstock der Kategorien (Begriffe und Reihenfolge überall gleich) | P0 | PROJ-3, PROJ-5, PROJ-16 | Planned | [Spec](PROJ-19-grundstock-der-kategorien.md) | 2026-10-17 |
| PROJ-20 | Hilfe & Tutorial (die App bringt die richtige Nutzung bei) | P0 | PROJ-3, PROJ-5, PROJ-6 | Roadmap | — | 2026-10-18 |

<!-- Add features above this line -->

**PROJ-17 (Stundenmuster) ist am 2026-10-12 in PROJ-16 aufgegangen** und steht deshalb nicht mehr in der Tabelle. Die Nummer wird nicht neu vergeben; Verweise auf PROJ-17 in den Specs von PROJ-6 und PROJ-7 meinen PROJ-16.

## Next Available ID: PROJ-21

## Empfohlene Build-Reihenfolge (MVP)

1. **PROJ-1** — Supabase Infrastructure Setup (Fundament für alles)
2. **PROJ-2** — Benutzerregistrierung & Login (Nutzerdaten brauchen Auth)
3. **PROJ-3** — Übungsdatenbank (Kernfunktion: Übungen erfassen)
4. **PROJ-5** — Gruppenprofile (parallel zu oder direkt nach PROJ-3)
5. **PROJ-4** — Starter-Datenbank (Inhalte einfüllen + Import in eigene DB) — braucht vorher **PROJ-19** (Grundstock der Kategorien)
6. **PROJ-6** — Einheiten-Generator (Herzstück der App)
7. **PROJ-7** — Einheiten-Editor (Feinschliff der generierten Einheiten)
8. **PROJ-14** — Live-Modus (Stundenbegleitung während der Durchführung)
9. **PROJ-16** — Verwaltung: Hallen, Stundenmuster, eigene Kategorien (behebt eine Lücke aus PROJ-3, blockiert nichts, muss aber vor der Marktreife rein)
