# PROJ-19: Grundstock der Kategorien (Begriffe und Reihenfolge überall gleich)

## Status: Planned
**Created:** 2026-10-17
**Last Updated:** 2026-10-18

## Worum es geht

Die App liefert für fünf Arten von Kategorien Begriffe mit: Sportarten, Altersgruppen, Phasen,
Organisationsformen und Material. Diese Listen sind über die Features hinweg gewachsen. Sie
enthalten Dopplungen, einen Eintrag, der kein Begriff ist („Kein Material"), und sie erscheinen
nicht überall in derselben Reihenfolge: das Übungsformular zeigt sie anders als der Generator, die
Verwaltung anders als eine gespeicherte Übung, und bei Varianten fehlen die eigenen Begriffe ganz.

PROJ-19 legt den **Grundstock** fest, also welche Begriffe mitgeliefert werden, und eine **einzige
Reihenfolge**, die an jeder Stelle gilt. Dazu kommen drei Regeln, die mit dem Grundstock
zusammenhängen:

- **„Ohne Material"** ist eine eigene Wahl, kein Material
- **Kein Begriff gibt es zweimal**, weder durch Eintippen noch dadurch, dass der Grundstock wächst
- **Die App bringt bei, eine Übung mit allen passenden Begriffen zu markieren**, damit der Generator
  sie in allen passenden Gruppen einplant

Der Grundstock ist die Vorarbeit für PROJ-4 (Starter-Datenbank): jede Starter-Übung trägt nur
Begriffe daraus.

## Dependencies
- Requires: PROJ-3 (Übungsdatenbank): Übungsformular, Varianten, Filter, Detailansicht, Übungszeile
- Requires: PROJ-5 (Gruppenprofile): Gruppenformular, Hallenmaterial
- Requires: PROJ-16 (Verwaltung): eigene Kategorien, Anlegen, Umbenennen, Zusammenführen
- Berührt: PROJ-6 (Einheiten-Generator): Auswahllisten je Segment, Begründung bei zu wenigen Übungen
- Berührt: PROJ-7 (Einheiten-Editor): Schnell-Anlegen, Dialog „Übung einfügen"
- Berührt: PROJ-14 (Live-Modus): Material auf dem Bereitschaftsbild
- Wird gebraucht von: PROJ-4 (Starter-Datenbank)

## User Stories
1. Als **Übungsleiter** möchte ich die Begriffe in jeder Auswahlliste an derselben Stelle finden,
   damit ich nicht in jedem Formular neu suchen muss.
2. Als **Übungsleiter mit eigenen Begriffen** möchte ich meine eigenen Begriffe immer ganz oben
   sehen, weil ich mit ihnen am häufigsten arbeite.
3. Als **Übungsleiter** möchte ich eine schlanke Liste ohne Dopplungen, damit ich nicht raten muss,
   ob eine Übung zu „Turnen" oder zu einem fast gleichen Begriff gehört.
4. Als **Übungsleiter** möchte ich bei einer Variante klar sagen können, dass sie kein Material
   braucht, ohne dass „Kein Material" neben einem Ball stehen kann.
5. Als **Übungsleiter ohne Trainerausbildung** möchte ich erfahren, dass eine Übung alle passenden
   Sportarten und Altersgruppen tragen sollte, damit der Generator sie in all meinen Gruppen findet.
6. Als **Übungsleiter** möchte ich einen Begriff nicht versehentlich ein zweites Mal anlegen, damit
   meine Listen sauber bleiben.

## Out of Scope
- **Ein Hilfe- oder Tutorial-Kapitel zum richtigen Markieren**: dafür gibt es PROJ-20 (Hilfe &
  Tutorial). PROJ-19 bringt nur die zwei Hinweise an Ort und Stelle (Abschnitt E)
- **Anheften oder Sortieren nach Häufigkeit**, also „was ich oft brauche, steht oben", für eigene
  und mitgelieferte Begriffe. Idee für später, kein Feature-Eintrag
- **Überschriften oder Themenblöcke in den Auswahllisten**: die Reihenfolge folgt Themen, die
  Listen zeigen sie aber nicht als Überschriften
- **Mitgelieferte Begriffe ausblenden, umbenennen oder löschen**: sie bleiben fest wie heute
- **Den vorhandenen Bestand umschreiben**: Übungen, Gruppen, Hallen, Einheiten und Stundenmuster,
  die einen weggefallenen oder umbenannten Begriff tragen, werden nicht angepasst (siehe Decision Log)
- **Den Schwierigkeitsgrad ändern**: Leicht · Mittel · Schwer bleibt, wie es ist
- **Die Reihenfolge der Segmente einer Einheit**: das ist der Zeitverlauf, keine Begriffsliste

---

## A. Der Grundstock

Die Reihenfolge der Listen ist die Reihenfolge, in der sie überall erscheinen (Abschnitt B).

**Sportarten (20)**
1. Krabbelgruppe
2. Eltern-Kind-Turnen
3. Kinderturnen
4. Kinderspiele
5. Seniorensport
6. Gymnastik
7. Fitness/Workout
8. Rehabilitation/Prävention
9. Therapie
10. Schwimmen
11. Turnen
12. Tanzen
13. Kampfsport
14. Leichtathletik
15. Basketball
16. Fußball
17. Handball
18. Volleyball
19. Abenteuer und Erlebnis
20. Teambuilding

*Gegenüber heute:* Vorschulturnen und Allgemeinsport fallen weg; Gymnastik und Seniorensport
kommen dazu; „Eltern-Kind Turnen" schreibt sich „Eltern-Kind-Turnen".

**Altersgruppen (11)**
1. Kinder (0–1)
2. Kinder (1–2)
3. Kinder (2–4)
4. Kinder (4–6)
5. Kinder (7–10)
6. Jugend (11–14)
7. Jugend (15–17)
8. Erwachsene (18–45)
9. Erwachsene (46–60)
10. Senioren (60–75)
11. Senioren (75+)

*Gegenüber heute:* „Senioren (60+)" wird in zwei Stufen geteilt. Dass sich Grenzen überschneiden
(4, 60, 75), ist gewollt.

**Phasen (3)**
1. Aufwärmen
2. Hauptteil
3. Cool-Down

*Unverändert.*

**Organisationsformen (9)**
1. Freie Verteilung (ganze Halle)
2. Kreis
3. Reihe / Gasse
4. Schachbrettformation
5. Zu zweit / Paare
6. Kleingruppen
7. Stationsbetrieb
8. Zwei Mannschaften (gemeinsames Spielfeld)
9. Zwei Mannschaften (getrenntes Spielfeld)

*Gegenüber heute:* „Kreis / Sitzkreis" heißt „Kreis"; Schachbrettformation kommt dazu;
1-gegen-1 fällt weg. Ordnung: erst die ganze Gruppe zusammen, dann aufgeteilt nach Gruppengröße,
zuletzt Mannschaften.

**Material (23)**
1. Ball
2. Seil/Springseil
3. Reifen
4. Stab
5. Tuch
6. Schwungtuch
7. Leibchen
8. Hütchen
9. Kegel
10. Markierung
11. Turnmatte
12. Yoga-Matte
13. Weichbodenmatte
14. Bank
15. Kleiner Kasten
16. Großer Kasten
17. Bock
18. Pferd
19. Sprossenwand
20. Turnringe
21. Stufenbarren
22. Tor
23. Volleyballnetz

*Gegenüber heute:* „Tor/Netz" heißt „Tor"; Stufenbarren und Volleyballnetz kommen dazu; „Kein
Material" ist kein Material mehr (Abschnitt C). Ordnung: von klein nach groß, wie man es im
Geräteraum zusammensucht (Kleingeräte, Markieren, Matten, Großgeräte).

**Schwierigkeitsgrad:** Leicht · Mittel · Schwer, unverändert und nicht erweiterbar.

### Akzeptanzkriterien
- [ ] Angenommen ein Nutzer öffnet eine Auswahlliste einer der fünf Arten, wenn er die mitgelieferten Begriffe durchsieht, dann stehen dort genau die Begriffe aus Abschnitt A, keiner mehr, keiner weniger
- [ ] Angenommen ein Nutzer ohne eigene Begriffe, wenn er die Sportarten im Übungsformular öffnet, dann beginnt die Liste mit „Krabbelgruppe" und endet mit „Teambuilding", in der Reihenfolge aus Abschnitt A
- [ ] Angenommen ein Nutzer sucht „Vorschulturnen", „Allgemeinsport", „Eltern-Kind Turnen" (ohne zweiten Bindestrich), „1-gegen-1", „Senioren (60+)", „Kreis / Sitzkreis", „Tor/Netz" oder „Kein Material" in einer Auswahlliste, dann findet er sie nicht als mitgelieferten Begriff
- [ ] Angenommen die Hallenausstattung wird gepflegt, wenn der Nutzer Material hinzufügt, dann kann er „Volleyballnetz" und „Stufenbarren" wählen, und der Generator prüft beides wie jedes andere Material

## B. Eine Reihenfolge überall

**Die Regel:** Zuerst kommen die **eigenen Begriffe**, alphabetisch (Groß- und Kleinschreibung
zählt nicht). Danach kommen die **mitgelieferten** in der Reihenfolge aus Abschnitt A.

Die Regel gilt **überall, wo Begriffe zur Auswahl stehen oder angezeigt werden**:

- Übungsformular und **Varianten**: bei Varianten stehen künftig auch die eigenen Altersgruppen
  und Organisationsformen zur Wahl, die heute fehlen
- Filter der Übungsübersicht
- Gruppenformular und Hallenmaterial
- Generator: Phasen, Organisationsformen, Sportarten (mit der Ausnahme unten)
- Editor: Schnell-Anlegen, Dialog „Übung einfügen"
- Verwaltung, Reiter „Kategorien"
- **Gewählte Begriffe** an einer Übung, Variante, Gruppe, Halle oder einem Segment, also Chips,
  Karten, Detailansicht, Übungszeile (Material · Organisationsform · Varianten), Listen. Sie stehen
  in der Reihenfolge der Liste, nicht in der Reihenfolge, in der sie angeklickt wurden
- **Material auf dem Bereitschaftsbild** des Live-Modus (heute alphabetisch) und in „Danach" bzw.
  „Zuerst"

**Die eine Ausnahme: Sportarten im Generator.** Ist eine Gruppe gewählt, stehen ihre Sportarten
**oben**, in der Reihenfolge der Liste. Darunter folgen **alle übrigen**, nach der Regel oben
(eigene zuerst). Die beiden Blöcke sind sichtbar getrennt („Sportarten der Gruppe" / „Weitere").
Ohne gewählte Gruppe gilt die Regel ohne Ausnahme, und die eigenen Sportarten stehen dann auch
dort (heute fehlen sie).

**Materialzeilen beim Bearbeiten:** Im Formular (Übung, Variante, Halle) bleiben die
Materialzeilen in der Reihenfolge, in der sie eingegeben wurden. Sonst springt eine Zeile weg,
während man noch die Menge eintippt. Angezeigt wird danach in der Reihenfolge der Liste.

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer hat die eigenen Sportarten „Zumba" und „Capoeira", wenn er eine beliebige Sportart-Auswahlliste öffnet (außer im Generator mit gewählter Gruppe), dann stehen ganz oben „Capoeira", „Zumba", danach „Krabbelgruppe" … „Teambuilding"
- [ ] Angenommen der Nutzer legt eine eigene Sportart „aerobic" an, wenn er die Liste öffnet, dann steht sie alphabetisch zwischen den eigenen Begriffen, unabhängig von der Kleinschreibung
- [ ] Angenommen der Nutzer wählt bei einer Übung erst „Volleyball", dann „Turnen", dann seine eigene Sportart „Zumba", wenn er die Übung speichert und ansieht, dann stehen die Sportarten als „Zumba · Turnen · Volleyball", in Karte, Liste und Detailansicht gleich
- [ ] Angenommen der Nutzer hat eine eigene Altersgruppe, wenn er bei einer Variante die Altersgruppen öffnet, dann steht sie dort zur Wahl, ganz oben
- [ ] Angenommen der Nutzer hat eine eigene Organisationsform, wenn er bei einer Variante die Organisationsformen öffnet, dann steht sie dort zur Wahl, ganz oben
- [ ] Angenommen eine Gruppe mit den Sportarten „Volleyball" und „Kinderturnen" ist im Generator gewählt, wenn der Nutzer die Sportarten eines Segments öffnet, dann stehen oben unter „Sportarten der Gruppe" „Kinderturnen", „Volleyball" und darunter unter „Weitere" die eigenen Sportarten alphabetisch, dann die übrigen mitgelieferten in der Reihenfolge aus Abschnitt A
- [ ] Angenommen im Generator ist keine Gruppe gewählt, wenn der Nutzer die Sportarten eines Segments öffnet, dann stehen dort auch seine eigenen Sportarten, ganz oben
- [ ] Angenommen die Gruppe trägt ihre Sportarten in der Klick-Reihenfolge „Volleyball, Kinderturnen", wenn der Generator sie oben zeigt, dann in der Reihenfolge der Liste: „Kinderturnen, Volleyball"
- [ ] Angenommen der Nutzer öffnet in der Verwaltung den Reiter „Kategorien", wenn er eine Art ansieht, dann stehen die eigenen Begriffe alphabetisch, wie heute
- [ ] Angenommen eine Einheit braucht Ball, Weichbodenmatte und Hütchen, wenn der Nutzer das Bereitschaftsbild des Live-Modus öffnet, dann steht das Material als Ball, Hütchen, Weichbodenmatte, in der Reihenfolge der Liste und nicht alphabetisch
- [ ] Angenommen der Nutzer trägt im Übungsformular erst „Bank", dann „Ball" als Material ein, wenn er die Mengen noch bearbeitet, dann bleiben die Zeilen in dieser Reihenfolge; nach dem Speichern zeigt die Detailansicht „Ball", dann „Bank"
- [ ] Angenommen der Filter der Übungsübersicht, wenn der Nutzer eine der Filterlisten öffnet, dann gilt dieselbe Reihenfolge wie im Übungsformular

## C. „Ohne Material"

„Kein Material" verschwindet aus der Materialliste. Gebraucht wird die Aussage nur an zwei Stellen,
und dort ist sie eine **eigene Wahl, die sich nicht mit echtem Material kombinieren lässt**:

- **Bei einer Variante** wählt der Nutzer künftig eine von drei Möglichkeiten:
  **„Wie die Hauptübung"** (Voreinstellung), **„Eigenes Material"** (die Zeilen ersetzen das
  Material der Hauptübung, wie heute) oder **„Ohne Material"**. Wer von „Eigenes Material"
  weggeht, verliert die Zeilen der Variante, wie heute beim Zurücknehmen der Abweichung
- **Im Filter der Übungsübersicht** steht **„Ohne Material"** als erster Eintrag der Materialliste,
  sichtbar abgesetzt von den Begriffen. Er findet Übungen ohne jedes Material. Zusammen mit anderem
  Material gewählt, wirkt er wie heute als „oder"

An der **Hauptübung** gibt es keine eigene Wahl: keine Materialzeile heißt ohne Material, wie heute.
In der **Hallenausstattung** kommt „Ohne Material" nicht vor (wie heute „Kein Material").

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer erfasst Material an einer Übung, einer Variante oder einer Halle, wenn er die Materialliste öffnet, dann steht „Kein Material" nicht mehr darin
- [ ] Angenommen der Nutzer bearbeitet eine Variante, wenn er das Material festlegt, dann wählt er zwischen „Wie die Hauptübung", „Eigenes Material" und „Ohne Material"; die Voreinstellung ist „Wie die Hauptübung"
- [ ] Angenommen bei einer Variante ist „Ohne Material" gewählt, wenn der Nutzer versucht, Material hinzuzufügen, dann geht das nicht; erst nach dem Wechsel auf „Eigenes Material"
- [ ] Angenommen eine Variante ist „Ohne Material", wenn der Generator sie prüft, dann gilt sie für jede Halle als machbar, auch wenn die Hauptübung Material braucht, das die Halle nicht hat
- [ ] Angenommen eine Variante ist „Ohne Material", wenn sie im Stundenverlauf, in der Detailansicht oder im Live-Modus erscheint, dann steht dort „Kein Material nötig" und kein Materialeintrag
- [ ] Angenommen eine Variante ist „Wie die Hauptübung", wenn der Generator sie prüft, dann gilt das Material der Hauptübung, wie heute
- [ ] Angenommen der Nutzer filtert die Übungsübersicht nach „Ohne Material", dann erscheinen genau die Übungen ohne Materialzeile
- [ ] Angenommen der Nutzer filtert nach „Ohne Material" und „Ball", dann erscheinen die Übungen ohne Material und die Übungen mit Ball

## D. Kein Begriff zweimal

**Anlegen:** Ein Begriff, den es in dieser Art schon gibt, mitgeliefert oder eigen, lässt sich
nicht noch einmal anlegen. Verglichen wird ohne Leerzeichen am Rand und ohne Groß- und
Kleinschreibung.

- **In einem Formular** (Übung, Variante, Gruppe, Halle, Generator, Schnell-Anlegen) gibt es
  dafür **keine Fehlermeldung**: der vorhandene Begriff wird **ausgewählt**, mit einem kurzen Satz
  wie „„Gymnastik" gibt es schon — ausgewählt." Ist er schon ausgewählt: „„Gymnastik" ist schon
  ausgewählt." Heute passiert in diesem Fall nichts, ohne Rückmeldung, oder es entsteht bei
  anderer Schreibweise ein zweiter Begriff
- **In der Verwaltung** bleibt die heutige Meldung („… gibt es schon — als mitgelieferten
  Begriff." bzw. „… als eigenen Begriff.")

**Der Grundstock wächst:** Hat ein Nutzer einen eigenen Begriff, den der Grundstock jetzt
mitliefert (heute „Stufenbarren", vielleicht „Gymnastik" oder „Volleyballnetz"), **geht der eigene
Begriff im mitgelieferten auf**. Er verschwindet aus der Verwaltung und steht in den Listen nur
noch einmal, an der Stelle des mitgelieferten. Übungen, Gruppen, Hallen, Einheiten und
Stundenmuster tragen ihn weiter, in der Schreibweise des mitgelieferten Begriffs, wie beim
Zusammenführen in der Verwaltung. Der Nutzer wird nicht gefragt und nicht benachrichtigt. Das gilt
für diese Auslieferung und für jede spätere Erweiterung des Grundstocks.

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer tippt im Übungsformular bei den Sportarten „gymnastik " als eigenen Begriff ein, wenn er ihn hinzufügt, dann wird „Gymnastik" ausgewählt, es erscheint „„Gymnastik" gibt es schon — ausgewählt.", und es entsteht kein neuer Begriff
- [ ] Angenommen „Gymnastik" ist an der Übung schon gewählt, wenn der Nutzer „Gymnastik" erneut eintippt, dann erscheint „„Gymnastik" ist schon ausgewählt.", und nichts ändert sich
- [ ] Angenommen der Nutzer hat die eigene Sportart „Zumba", wenn er in einem Formular „ZUMBA" eintippt, dann wird „Zumba" ausgewählt, ohne zweiten Begriff
- [ ] Angenommen dasselbe gilt für Altersgruppen, Phasen, Organisationsformen und Material, wenn der Nutzer an einer beliebigen Stelle mit Eintippen einen vorhandenen Begriff eingibt, dann verhält sich die App wie in den drei Kriterien oben
- [ ] Angenommen der Nutzer legt in der Verwaltung „gymnastik" an, dann erscheint „„Gymnastik" gibt es schon — als mitgelieferten Begriff.", und nichts wird angelegt
- [ ] Angenommen der Nutzer hatte vor PROJ-19 das eigene Material „Stufenbarren", wenn PROJ-19 ausgeliefert ist, dann steht „Stufenbarren" in der Verwaltung nicht mehr unter den eigenen Begriffen und in jeder Materialliste genau einmal, an Stelle 21
- [ ] Angenommen der Nutzer hatte die eigene Sportart „gymnastik" an drei Übungen, wenn PROJ-19 ausgeliefert ist, dann tragen die drei Übungen „Gymnastik", und der Generator findet sie für Gruppen mit „Gymnastik"

## E. Die App bringt richtiges Markieren bei

Der Generator plant eine Übung nur für Gruppen ein, deren Sportart und Altersgruppe sie
**ausdrücklich trägt**. Eine Übung, die zum Kinderturnen und zum Eltern-Kind-Turnen taugt, aber
nur „Kinderturnen" trägt, fehlt der Eltern-Kind-Gruppe. Das ist eine Frage der **Qualität der
Übung**, nicht der Liste. Die App sagt es an zwei Stellen:

1. **Beim Erfassen**: im Übungsformular und beim Schnell-Anlegen steht unter den Feldern Sportart
   und Altersgruppe ein kurzer, immer sichtbarer Satz, sinngemäß: *„Wähle alles, wofür die Übung
   taugt — der Generator plant sie nur dort ein, wo sie markiert ist."*
2. **Wenn es fehlt**: findet der Generator für ein Segment zu wenige Übungen und liegt es an der
   **Sportart**, ergänzt seine Begründung einen Satz, sinngemäß: dass Übungen oft auch zu
   benachbarten Sportarten passen und es hilft, sie dort mit zu markieren.

Ein eigenes Hilfe-Kapitel dazu gehört in PROJ-20 (Hilfe & Tutorial).

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer legt eine Übung an oder bearbeitet sie, wenn er beim Feld Sportart ist, dann steht darunter der Satz zum vollständigen Markieren, ohne dass er etwas aufklappen muss
- [ ] Angenommen dasselbe Formular, wenn er beim Feld Altersgruppe ist, dann steht der Satz auch dort
- [ ] Angenommen der Nutzer legt im Editor eine Übung schnell an, wenn er Sportart oder Altersgruppe wählt, dann steht dort derselbe Satz
- [ ] Angenommen der Generator findet für ein Segment zu wenige Übungen und das Kriterium Sportart schließt Übungen aus, wenn die Begründung erscheint, dann enthält sie den Satz zum Markieren benachbarter Sportarten
- [ ] Angenommen der Generator findet zu wenige Übungen, die Sportart ist aber nicht die Ursache, wenn die Begründung erscheint, dann enthält sie den Satz nicht

## F. Folgen für die Starter-Datenbank (PROJ-4)

- Jede Starter-Übung trägt **nur Begriffe aus Abschnitt A** und **alle, die in Frage kommen**,
  also jede passende Sportart, Altersgruppe, Phase und Organisationsform. Das ist dieselbe Regel,
  die die App dem Nutzer beibringt, und sie wird beim Prüfen eines Blocks mitgeprüft
- „Ohne Material" an einer Variante ist im Tabellenformat der Blöcke eine eigene Angabe, kein
  Materialbegriff

---

## Edge Cases
- **Ein weggefallener Begriff steht noch an einer Übung** (z. B. „Vorschulturnen", „Senioren
  (60+)", „Tor/Netz"): er bleibt dort stehen und wird angezeigt, aber nicht mehr als mitgelieferter
  Begriff angeboten. Der Bestand wird nicht umgeschrieben (Decision Log). Es darf nichts abstürzen,
  und der Generator vergleicht weiter Text mit Text
- **Eine Variante trägt noch „Kein Material"** aus der Zeit vor PROJ-19: wie sie behandelt wird,
  entscheidet `/architecture` nach dem einfachsten Weg; sie darf weder einen Fehler werfen noch
  das Speichern der Übung verhindern
- **Ein eigener Begriff ist gleichnamig mit einem neuen mitgelieferten, aber anders geschrieben**
  („gymnastik"): er geht trotzdem auf (Abschnitt D), die Schreibweise wird die des mitgelieferten
- **Ein eigener Begriff wird in der Verwaltung auf einen mitgelieferten umbenannt**: das ist
  Zusammenführen und läuft wie heute nach Nachfrage (PROJ-16)
- **Ein Begriff wird in einer anderen Art eingetippt**, z. B. „Ball" als Sportart: das ist kein
  Doppel, verglichen wird nur innerhalb einer Art
- **Der Nutzer tippt nur Leerzeichen**: wie heute, nichts wird angelegt
- **Eine Gruppe im Generator trägt eine Sportart, die es nicht mehr gibt** (weggefallen,
  gelöscht): sie steht trotzdem oben unter „Sportarten der Gruppe", weil die Gruppe sie trägt
- **Viele eigene Begriffe**: bei 30 eigenen Sportarten rutschen die mitgelieferten weit nach unten.
  Hingenommen; die Suche im Auswahlfeld bleibt der schnelle Weg. Anheften ist eine Idee für später

## Technical Requirements
- **Eine Quelle für die Reihenfolge**: dieselbe Ordnung an allen Stellen aus Abschnitt B, keine
  Sortierung je Bildschirm
- **Browser-Tests und Texte nachziehen**: Tests und Texte, die weggefallene oder umbenannte Begriffe
  benutzen („Allgemeinsport", „Vorschulturnen", „Eltern-Kind Turnen", „Kreis / Sitzkreis", „Tor/Netz", „Kein Material",
  „Senioren (60+)", „1-gegen-1"), werden angepasst. Gilt auch für die Erklärtexte von Varianten
  („wähle Kein Material")
- **Handy:** die getrennten Blöcke im Generator und der Satz unter Sportart und Altersgruppe sind bei
  375 px lesbar, ohne waagerechtes Scrollen
- **Browser:** wie die übrige App (Chrome, Edge; Firefox und Safari auf diesem Rechner nicht prüfbar)

## Open Questions
- [ ] **PROJ-4 nachziehen**: die Spec von PROJ-4 nennt noch „Allgemeinsport" (Abschnitt „Worum es
  geht"), den Bereich „Senioren (60+)" und die offene Frage zu Krabbelgruppe und Eltern-Kind „hängt
  am Grundstock". Mit dem Grundstock ist das beantwortbar: in `/refine PROJ-4` oder beim
  `/architecture` von PROJ-4 klären
- [ ] **Hinweis auch an der Gruppe?** Eine Gruppe mit nur einer Sportart findet ebenfalls zu wenig
  (Notiz zur Nutzerbildung). Ein Satz im Gruppenformular wurde besprochen, aber nicht beschlossen.
  Eher PROJ-20 oder ein `/refine` von PROJ-5

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Feste, bewusst gewählte Reihenfolge der mitgelieferten Begriffe statt alphabetisch | Altersgruppen von jung nach alt und Phasen im Ablauf der Stunde sind alphabetisch sinnlos; Sportarten, Organisationsformen und Material nach Themen sind schneller zu finden | 2026-10-18 |
| Eigene Begriffe stehen **oben**, alphabetisch | Mit den eigenen Begriffen arbeitet der Nutzer am häufigsten. Ändert einen früheren Vorschlag („eigene dahinter") auf Wunsch des Nutzers | 2026-10-18 |
| Gewählte Begriffe in der Reihenfolge der Liste, nicht der Klick-Reihenfolge | Dieselbe Übung sieht überall gleich aus; die Reihenfolge des Anklickens trägt keine Bedeutung | 2026-10-18 |
| Ausnahme: im Generator stehen die Sportarten der Gruppe oben, in zwei getrennten Blöcken | In diesem Moment sind sie die gemeinten; die Trennung erklärt, warum die Ordnung hier anders ist | 2026-10-18 |
| Materialzeilen im Formular nicht umsortieren, nur in der Anzeige | Eine Zeile, die beim Eintippen der Menge wegspringt, ist schlimmer als eine ungeordnete Eingabe | 2026-10-18 |
| Reihenfolge der Sportarten vom Nutzer festgelegt (Abschnitt A); „Eltern-Kind-Turnen" mit durchgehendem Bindestrich | Ersetzt den Vorschlag mit Themenblöcken; Schreibweise vom Nutzer festgelegt | 2026-10-18 |
| Vorschulturnen und Allgemeinsport fallen weg; Gymnastik und Seniorensport kommen dazu | Verschlanken: nahe Nachbarn (Vorschulturnen ≈ Kinderturnen) zerteilen den Vorrat des Generators in kleine Töpfe | 2026-10-18 |
| Überschneidungen **zwischen** Listen bleiben (Krabbelgruppe ↔ Kinder 0–2), Dopplungen **innerhalb** einer Liste werden entfernt | Sportart und Altersgruppe beantworten verschiedene Fragen; innerhalb einer Liste verlangt der Generator exakt denselben Begriff | 2026-10-18 |
| Altersgrenzen dürfen sich überschneiden; Senioren werden in 60–75 und 75+ geteilt | Vom Nutzer so gewollt. Fitte Jungsenioren und Hochaltrige (Sturzprophylaxe, Sitzgymnastik) unterscheiden sich stark | 2026-10-18 |
| Organisationsformen: „Kreis" statt „Kreis / Sitzkreis", Schachbrettformation neu, 1-gegen-1 fällt weg | Vom Nutzer festgelegt | 2026-10-18 |
| Material: „Tor" statt „Tor/Netz", Volleyballnetz und Stufenbarren neu | Ohne eigenen Begriff für das Netz könnte der Generator für Volleyball nicht prüfen, ob die Halle eins hat | 2026-10-18 |
| „Kein Material" ist kein Materialbegriff mehr, sondern eine eigene Wahl („Ohne Material") bei Varianten und im Filter | Heute kann es neben „Ball" stehen, und sechs Stellen im Code filtern es eigens heraus; die Starter-Datenbank bräuchte sonst eine Sonderregel | 2026-10-18 |
| Vorhandene Begriffe lassen sich nirgends ein zweites Mal anlegen; im Formular wird der vorhandene stattdessen ausgewählt | Der Nutzer wollte den Begriff haben; eine Fehlermeldung wäre Bevormundung, stilles Nichtstun (heute) verwirrt | 2026-10-18 |
| Wächst der Grundstock, geht ein gleichnamiger eigener Begriff still im mitgelieferten auf, ohne seinen Platz oben zu behalten | Den Platz zu behalten hieße: „Löschen" löscht nicht, „Umbenennen" lässt den Begriff wieder auftauchen. Zu viel Erklärung für einen seltenen Fall. Vom Nutzer nach Abwägung gewählt | 2026-10-18 |
| Der vorhandene Bestand wird nicht umgeschrieben | Alle betroffenen Übungen, Gruppen und Einheiten sind Testdaten und werden mit PROJ-4 gelöscht. Ausnahme: der Fall „eigener Begriff geht auf" aus Abschnitt D | 2026-10-18 |
| Richtiges Markieren wird an zwei Stellen beigebracht: Satz unter Sportart/Altersgruppe beim Erfassen, Zusatz in der Generator-Begründung, wenn die Sportart die Ursache ist | Einmal dort, wo die Entscheidung fällt, einmal dort, wo der Schaden sichtbar wird. Vom Nutzer ausdrücklich verlangt; Grundsatz „die App bringt die richtige Nutzung bei" | 2026-10-18 |
| Ein eigenes Hilfe- und Tutorial-Feature wird PROJ-20 (P0) | Vom Nutzer verlangt; bündelt alle Inhalte zur Nutzerbildung aus den bisherigen Features | 2026-10-18 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
