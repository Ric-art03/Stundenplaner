# PROJ-19: Grundstock der Kategorien (Begriffe und Reihenfolge überall gleich)

## Status: Approved
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
| Grundstock bleibt im Programm, nicht in der Datenbank | Er ist für alle Nutzer gleich und ändert sich nur mit einer Auslieferung; die Datenbank musste ihn bisher nie kennen (die Umbenenn-Funktion bekommt „ist mitgeliefert" vom Programm gesagt) | 2026-10-18 |
| Ein zentraler Baustein „Begriffsordnung" für alle Listen und Anzeigen | „Überall gleich" lässt sich nur halten, wenn es eine Stelle gibt; heute sortiert jede Stelle selbst, daher die sechs Abweichungen | 2026-10-18 |
| Ordnen beim Lesen und Anzeigen, nicht beim Speichern | Ob ein Begriff eigen oder mitgeliefert ist, ändert sich mit dem Grundstock; eine gespeicherte Folge würde veralten. Kein Umschreiben des Bestands nötig | 2026-10-18 |
| „Ohne Material" bleibt intern ein Eintrag in der Materialliste der Variante; die drei Zustände werden daraus abgelesen | Keine Migration, alle vorhandenen Varianten und Stundenakten auf Geräten funktionieren unverändert. Verworfen: ein neues Feld „Materialmodus" an der Variante — sauberer, aber Migration, Umschreiben des Bestands und Anpassungen an Speichern, Editor und Live-Modus für dieselbe Wirkung | 2026-10-18 |
| „Kein Material" und „Ohne Material" sind als eigener Materialbegriff gesperrt | Sonst könnte ein eigener Begriff dieses Namens mit dem internen Eintrag verwechselt werden | 2026-10-18 |
| Aufgehen eigener Begriffe beim Laden, über die vorhandene Umbenenn-Funktion aus PROJ-16 | Deckt auch jede spätere Erweiterung des Grundstocks ab, ohne je Erweiterung eine Migration; die Funktion fasst schon alle Stellen an und ist am lebenden System nachgewiesen. Verworfen: eine einmalige Migration für alle Konten — sie müsste die Umbenenn-Logik nachbauen und wirkte nur einmal | 2026-10-18 |
| Begriffe ohne Herkunft (weggefallen, gelöscht) zählen bei der Ordnung als eigene | An der Übung sind sie faktisch eigene; so braucht die Ordnung die eigene Liste nicht, um Gewähltes zu sortieren | 2026-10-18 |
| Filter „Ohne Material" als eigene Filterangabe statt als Wert in der Materialliste | Er ist kein Begriff mehr; die Abfrage bleibt gleich | 2026-10-18 |
| Keine Migration, keine neuen Pakete | Alles Nötige ist vorhanden; die Serverarbeit beschränkt sich auf Aufgehen, Vergleich beim Speichern und Filterangabe | 2026-10-18 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick

PROJ-19 ist **fast reine Oberfläche**. Es braucht **keine Migration, keine neue Tabelle, kein neues
Feld und keine neuen Pakete**. Drei Gründe:

- **Der Grundstock steht schon an einer Stelle im Programm**, nicht in der Datenbank. Dort werden
  die Listen aus Abschnitt A eingetragen, und jede Auswahlliste der App liest von dort
- **Das Aufgehen eines eigenen Begriffs im mitgelieferten gibt es schon.** Die Datenbank-Funktion
  zum Umbenennen und Zusammenführen aus PROJ-16 kann einen eigenen Begriff in einen mitgelieferten
  überführen, an allen Stellen (Übungen, Varianten, Material, Gruppen, Hallen, gespeicherte
  Einheiten, Stundenmuster) und in dessen Schreibweise. PROJ-19 ruft sie nur an einer neuen Stelle auf
- **„Ohne Material" braucht kein neues Feld.** Die drei Zustände einer Variante lassen sich aus dem
  ablesen, was heute schon gespeichert wird (siehe „Datenmodell")

Die eigentliche Arbeit ist ein **neuer, zentraler Baustein für die Begriffsordnung**, den alle
Stellen aus Abschnitt B benutzen, statt je Bildschirm selbst zu sortieren.

### A) Bausteine

```
Begriffsordnung (neu, ohne Oberfläche, mit Unit-Tests)
+-- Auswahlliste bauen: eigene alphabetisch (deutsch, ohne Groß/Klein) → Grundstock in fester Folge
+-- Gewählte Begriffe ordnen: nach derselben Regel (für Anzeige überall)
+-- Generator-Fassung: Sportarten der Gruppe oben, darunter „Weitere"
+-- Gleichheit prüfen: ohne Rand-Leerzeichen, ohne Groß/Klein, nur innerhalb einer Art
+-- „Ohne Material"-Zustand einer Variante ablesen und schreiben

Auswahlfeld mit Eintippen (besteht: Übung, Variante, Gruppe, Generator, Schnell-Anlegen)
+-- Optionen aus der Begriffsordnung
+-- Gewählte Chips in Listenreihenfolge, schon während des Bearbeitens
+-- Vorhandenen Begriff eingetippt → auswählen + kurzer Satz unter dem Feld

Materialeingabe (besteht: Übung, Variante, Halle)
+-- Liste ohne „Kein Material"
+-- Vorhandenen Begriff eingetippt → diese Zeile bekommt ihn + kurzer Satz
+-- Zeilen bleiben beim Bearbeiten in Eingabefolge

Variante — Material (besteht, wird umgebaut)
+-- Wahl aus drei: „Wie die Hauptübung" / „Eigenes Material" / „Ohne Material"
+-- Altersgruppen und Organisationsformen jetzt mit den eigenen Begriffen

Übungsfilter (besteht)
+-- Material: „Ohne Material" als erster Eintrag, abgesetzt

Hinweis zum vollständigen Markieren (neu, klein, einmal gebaut)
+-- unter Sportart und Altersgruppe im Übungsformular und beim Schnell-Anlegen

Generator (besteht)
+-- Sportarten eines Segments: Blöcke „Sportarten der Gruppe" / „Weitere"
+-- Begründung bei zu wenigen Übungen: Zusatzsatz, wenn die Sportart Übungen ausschließt
+-- Gruppenhinweis „nur eine Sportart": Beispiel „Allgemeinsport" ersetzen (fällt weg)

Live-Modus (besteht)
+-- Material auf Bereitschaftsbild, „Danach", „Zuerst": Listenreihenfolge statt alphabetisch
```

### B) Datenmodell

**Nichts Neues in der Datenbank.** Was sich an den gespeicherten Daten ändert:

- **Grundstock:** Die fünf Listen im Programm werden durch die Listen aus Abschnitt A ersetzt,
  in genau dieser Reihenfolge. Die Reihenfolge der Liste **ist** die Ordnung, eine zweite
  Angabe gibt es nicht
- **„Ohne Material" an einer Variante** wird gespeichert wie heute: als einzelner, interner Eintrag
  in der Materialliste der Variante. Der Nutzer sieht ihn nie als Begriff. Abgelesen wird so:
  Materialliste leer → „Wie die Hauptübung"; nur dieser Eintrag → „Ohne Material"; sonst →
  „Eigenes Material". Damit funktionieren **alle vorhandenen Varianten ohne Umschreiben weiter**,
  auch in Stundenakten, die schon auf einem Gerät liegen (PROJ-14). Die Erkennung des Eintrags,
  heute an sechs Stellen verstreut, wandert in den Baustein Begriffsordnung
- **Der interne Name ist reserviert:** „Kein Material" und „Ohne Material" lassen sich nicht als
  eigenes Material anlegen. Wer es eintippt, bekommt den Satz, dass „Ohne Material" bei Varianten
  eigens gewählt wird
- **Ordnung beim Lesen, nicht beim Speichern:** Die Begriffe werden geordnet, wenn Übungen, Gruppen,
  Hallen und Kandidaten aus der Datenbank gelesen werden, und in der Anzeige. Gespeichert wird
  weiter in beliebiger Folge. Grund: ob ein Begriff „eigen" oder „mitgeliefert" ist, kann sich
  ändern (der Grundstock wächst); eine gespeicherte Reihenfolge würde dann veralten
- **Begriffe, die weder mitgeliefert noch in der eigenen Liste sind** (weggefallen wie
  „Vorschulturnen", in der Verwaltung gelöscht): sie zählen wie eigene und stehen alphabetisch oben

### C) Abläufe

**Aufgehen eines eigenen Begriffs (Abschnitt D der Spec).** Immer wenn die App die eigenen Begriffe
eines Nutzers lädt (Verwaltung, Übungsformular, Gruppenformular, Generator), prüft sie vorher: gibt
es einen eigenen Begriff, der ohne Groß/Klein einem mitgelieferten gleicht? Wenn ja, führt sie ihn
über die vorhandene Funktion zusammen, in die Schreibweise des mitgelieferten Begriffs. Das passiert
nur, wenn es einen solchen Begriff gibt, also praktisch einmal je Nutzer nach einer Erweiterung des
Grundstocks. Gelingt es nicht (Netz, Fehler), lädt die Seite trotzdem; die Listen blenden den Doppel
aus, und beim nächsten Laden wird es erneut versucht.

- Das deckt **diese und jede spätere Erweiterung** ab, ohne dass jedes Mal eine Migration
  geschrieben werden muss
- Zwei Tabs gleichzeitig sind abgesichert: die Funktion arbeitet je Nutzer nacheinander, der zweite
  Versuch findet den Begriff nicht mehr und lässt es

**Eintragen neuer eigener Begriffe beim Speichern** (Übung, Gruppe, Halle, Generator) vergleicht
heute mit dem Grundstock **mit** Groß/Klein. „gymnastik" würde dort zum eigenen Begriff. Das wird
auf denselben Vergleich wie überall umgestellt. In der Praxis verhindert das schon das Auswahlfeld
(es wählt „Gymnastik"); der Server sichert es zusätzlich ab.

**Filter „Ohne Material"** wird eine eigene Filterangabe statt eines Begriffs in der Materialliste.
Die Abfrage bleibt dieselbe wie heute („Übungen ohne Materialzeile", „oder" mit anderem Material).

**Hinweis im Generator:** Die Aufschlüsselung einer Lücke weiß heute schon, welche Kriterien Übungen
ausgeschlossen haben. Ist die Sportart darunter, hängt die Anzeige den Satz zum Markieren
benachbarter Sportarten an. Keine neue Rechnung.

### D) Was nachgezogen wird

- **Texte:** Erklärsatz an Varianten („wähle Kein Material"), Gruppenhinweis im Generator (Beispiel
  „Allgemeinsport"), alle Stellen, die „Kein Material" als Begriff zeigen
- **Unit-Tests**, die weggefallene oder umbenannte Begriffe benutzen (Generator, Kandidaten,
  Live-Material, Hallenmaterial, Generator-Formular, Prüfplan)
- **Browser-Tests und ihre Testdaten** (Live-Modus, Generator ohne Anmeldung, Testübungen für den
  Live-Modus)

### E) Reihenfolge des Baus

1. **Grundstock und Begriffsordnung** mit Unit-Tests. Danach zeigen alle Listen, die schon aus dem
   Grundstock lesen, die neuen Begriffe
2. **Auswahlfelder und Anzeigen** auf die Begriffsordnung umstellen (Abschnitt B der Spec, Stelle
   für Stelle), dazu die eigenen Begriffe an Varianten
3. **„Ohne Material"**: Variante, Filter, Materialeingaben
4. **Kein Begriff zweimal**: Eintippen in den Feldern, dann das Aufgehen beim Laden und der
   Vergleich beim Speichern (Serverseite, in `/backend`)
5. **Die zwei Hinweise** zum vollständigen Markieren
6. Tests und Texte nachziehen

Schritt 4 auf der Serverseite ist klein (das Aufgehen beim Laden, der Vergleich beim Speichern, die
Filterangabe) und braucht **keine Zustimmung zu Datenbank-Änderungen**: es ändert sich kein Schema
und keine Zugriffsregel.

### F) Abhängigkeiten

Keine neuen Pakete.

## Implementation Notes (Frontend)

Gebaut am 2026-10-18 in der Reihenfolge des Entwurfs. Keine Migration, keine neuen Pakete,
keine neue shadcn-Komponente (Radio-Gruppe, Checkbox, Popover, Badge waren da).

**Grundstock und Begriffsordnung**
- Die fünf Listen in `src/lib/types/exercise.ts` sind durch Abschnitt A ersetzt, mit den Gründen
  der Reihenfolge als Kommentar
- Neuer Baustein `src/lib/categories/terms.ts` (mit 22 Unit-Tests): Auswahlliste bauen, Gewähltes
  ordnen, Generator-Blöcke, Gleichheit ohne Groß/Klein, Schreibweise des Grundstocks, „Ohne
  Material" ablesen und schreiben. `PREDEFINED_CATEGORIES` der Verwaltung zeigt auf dieselbe Quelle

**Auswahlfelder** (`multi-select.tsx`, neue `material-select.tsx`, `phase-select.tsx`)
- Das Auswahlfeld kennt die Begriffsordnung: Optionen und Chips in Listenfolge, auch während des
  Bearbeitens. Optional zwei Blöcke („Sportarten der Gruppe" / „Weitere") für den Generator
- Vorhandenen Begriff eingetippt → er wird ausgewählt, mit „„X" gibt es schon — ausgewählt." bzw.
  „„X" ist schon ausgewählt." Die Meldung steht im offenen Auswahlfeld, nach dem Schließen darunter
- Die zwei fast gleichen Materialauswahlen (Übung, Halle) sind zu `material-select.tsx`
  zusammengelegt. Dort zusätzlich: „Kein Material"/„Ohne Material" lassen sich nicht als Material
  anlegen; ein Material, das in der Halle schon in einer anderen Zeile steht, wird benannt
- Die Phasenauswahl im Generator wählt eine eingetippte, vorhandene Phase aus, statt eine zweite
  anzulegen

**Angeschlossen:** Übungsformular, Varianten (jetzt mit eigenen Altersgruppen, Organisationsformen
und Materialien), Filter der Übungsübersicht, Gruppenformular, Hallenmaterial, Generator (Phase,
Sportarten mit Blöcken, Hauptsportart, Organisationsform), Schnell-Anlegen, Verwaltung

**Ordnen beim Lesen:** Übungen, Varianten, Gruppen, Hallen und die Kandidaten für Editor und
Live-Modus werden beim Lesen geordnet (`actions/exercises.ts`, `groups.ts`, `units.ts`). Die
Übungszeile und das Material im Live-Modus ordnen zusätzlich selbst, weil sie auch Daten zeigen,
die nicht frisch gelesen sind (Stundenakte auf dem Gerät). **Nicht geordnet** werden die
Sportarten eines Generator-Segments beim Lesen: ihre Folge steuert dort, welche Sportart zuerst
gezogen wird

**„Ohne Material"**
- Variante: Wahl aus drei als Radio-Gruppe; „Eigenes Material" kopiert die Liste der Hauptübung wie
  bisher. Die Detailansicht zeigt bei „Ohne Material" „Kein Material nötig"
- Die sechs verstreuten Erkennungen von „Kein Material" laufen über `isNoMaterial` /
  `realMaterials`
- Filter: eigene Angabe `withoutMaterial` im Filterzustand, als abgesetzte Checkbox über der
  Materialliste, mit eigenem Chip

**Hinweise zum vollständigen Markieren:** `tagging-hint.tsx` unter Sportart und Altersgruppe im
Übungsformular; in der Lückenbegründung des Generators ein Zusatz, wenn die Sportart Übungen
ausschließt (`SPORT_TAGGING_HINT` in `gap-notice.tsx`); der Gruppenhinweis nennt „Kinderspiele"
oder „Gymnastik" statt „Allgemeinsport"

**Abweichungen von der Spec**
- **Schnell-Anlegen hat keine Felder für Sportart und Altersgruppe**, es übernimmt sie aus Abschnitt
  und Gruppe. Der Satz steht deshalb an der übernommenen Liste, als Aufforderung, die Übung später
  zu ergänzen (betrifft das dritte Kriterium in Abschnitt E)
- **„Ohne Material" im Filter** ist eine abgesetzte Checkbox direkt über der Materialliste, kein
  Eintrag in ihr. Wirkung und Lage („zuerst, abgesetzt") wie beschrieben
- **Auch in der Verwaltung** lassen sich „Kein Material" und „Ohne Material" nicht als Material
  anlegen (folgt aus der technischen Entscheidung „interner Name reserviert")

**Wartet auf `/backend`** *(am 2026-10-18 erledigt, siehe „Implementation Notes (Backend)")*
- **Filter „Ohne Material"** wird vom Server noch nicht ausgewertet; bis dahin wirkt das Häkchen
  nicht
- **Aufgehen eigener Begriffe beim Laden**: bis dahin blendet die Oberfläche den Doppel aus
  (die Auswahllisten zeigen den Begriff nur einmal), aber die Verwaltung listet ihn noch als eigenen
- **Vergleich beim Speichern** (`newlyAddedCustom`) unterscheidet noch Groß/Klein; das Auswahlfeld
  verhindert den Fall in der Oberfläche bereits

**Tests:** Unit-Tests 638 grün (615 plus 22 für die Begriffsordnung plus 1 für die Reihenfolge des
Materials im Live-Modus; ein bestehender Test von alphabetisch auf Listenfolge umgestellt).
Browser-Testdaten von „Kreis / Sitzkreis" auf „Kreis" umgestellt. Typprüfung, Lint und
Produktionsbuild sauber. Browser-Tests der Stufe „chromium" (Übungen, Gruppen, Generator am
Rechner) **53 von 53 grün**; die übrigen Stufen (Handy, Editor, Live-Modus, Verwaltung) sind nicht
gelaufen und gehören in `/qa`. Im Browser von Hand angesehen ist noch nichts.

## Implementation Notes (Backend)

Gebaut am 2026-10-18. **Keine Migration, keine neue Zugriffsregel, keine neuen Pakete**: alle
drei offenen Stellen aus „Wartet auf `/backend`" sind geschlossen, mit vorhandenen Tabellen und
der Funktion `rename_category` aus PROJ-16.

**Aufgehen eigener Begriffe beim Laden**
- Neuer Serverbaustein `src/lib/categories/custom-store.ts`, bewusst keine Server-Aktion (aus dem
  Browser nicht aufrufbar). `absorbPredefinedCustoms` sucht eigene Begriffe, die ohne Groß/Klein
  einem mitgelieferten gleichen (`predefinedDuplicates` in `src/lib/manage/categories.ts`), und
  führt sie über `rename_category` mit `p_predefined` in den mitgelieferten über — in dessen
  Schreibweise, an allen Stellen, die PROJ-16 abdeckt
- Angeschlossen an **beide** Stellen, die eigene Begriffe lesen: `getCustomCategories` (Übungs-
  und Gruppenformular, Generator, Übungsübersicht, Verwaltung) und `getManagedCategories`
  (Reiter „Kategorien"). In der Verwaltung wird erst aufgegangen, dann gezählt — die Zählung
  lief vorher parallel und hätte den verschwundenen Begriff noch gezählt
- Ein Begriff, dessen Aufgehen scheitert, bleibt in der Liste und wird beim nächsten Laden erneut
  versucht. Meldet der Aufruf `category_not_found` (ein anderer Tab war schneller), zählt das als
  erledigt
- Ohne passenden Begriff kostet es **keine zusätzliche Anfrage**; mit einem eine je Begriff

**Vergleich beim Speichern**
- `newlyAddedCustom` vergleicht jetzt ohne Rand-Leerzeichen und ohne Groß/Klein, mit dem
  Grundstock **und** mit dem, was der Eintrag vorher trug; zwei Schreibweisen im selben Speichern
  werden einmal gemeldet, in der ersten. „Kein Material" und „Ohne Material" werden nie als
  Material eingetragen
- Neu: `addCustomCategories` prüft vor dem Eintragen gegen die vorhandenen eigenen Begriffe,
  ebenfalls ohne Groß/Klein (`withoutKnownCustoms`) — die Datenbank weist nur genau Gleiches ab.
  Lässt sich der Bestand nicht lesen, wird wie vor PROJ-19 eingetragen. Alle vier Eintragstellen
  laufen darüber: Übung, Gruppe, Halle, Phasen im Generator (dort fiel der genaue Vergleich mit
  `PHASES` weg)
- **Bewusst nicht:** die Begriffe an der Übung selbst werden beim Speichern nicht auf die
  Schreibweise des Grundstocks gebracht. Schickt jemand am Auswahlfeld vorbei „gymnastik", trägt
  die Übung „gymnastik", aber es entsteht kein eigener Begriff. Die Oberfläche lässt den Fall
  nicht entstehen

**Filter „Ohne Material"** — und eine Korrektur am Materialfilter
- `withoutMaterial` wird ausgewertet: allein „Übungen ohne Materialzeile", mit Material zusammen
  „oder"
- **Der Materialfilter läuft jetzt in der Datenbankabfrage**, über eingebettete Filter auf
  `exercise_materials`. Vorher wurde erst nach der Seitenaufteilung (50 je Seite) gefiltert: ab
  der 51. Übung fehlten Treffer, und die Gesamtzahl war die Zahl der Treffer auf der Seite. Mit
  PROJ-4 (50–100 Übungen) wäre das sichtbar geworden. Besteht seit PROJ-3; behoben, weil
  „Ohne Material" sonst denselben Fehler geerbt hätte

**Am lebenden System nachgewiesen** (Testkonto, mit Markierung angelegt und danach aufgeräumt,
nichts zurückgeblieben), dreizehn Fälle:
- Filter als angemeldeter Testnutzer: „Ohne Material" allein; „Ball" allein; „Ball oder Bank" —
  eine Übung mit beidem erscheint einmal; „Ohne Material oder Ball"; dasselbe zusammen mit dem
  „oder" der Teilnehmerzahl; Werte mit Schrägstrich, Komma und Klammern ohne Fehler; die
  Gesamtzahl stimmt in jedem Fall
- Aufgehen mit genau den Parametern des Bausteins: „gymnastik" → „Gymnastik" (die Übung trägt
  danach „Gymnastik"), „STUFENBARREN" → „Stufenbarren" (auch als Materialzeile); der zweite
  Versuch meldet `category_not_found`; beide eigenen Begriffe sind aus der Liste verschwunden

**Tests:** 644 Unit-Tests grün (638 plus 6; einer umgestellt — er hielt fest, dass „pezzi" und
„Pezzi" zwei Begriffe sind, was PROJ-19 aufhebt). Typprüfung, Lint und Produktionsbuild sauber.
**Browser-Tests nicht gelaufen** — der Entwicklungsserver lief nebenher. Sie gehören in `/qa`;
`getExercises` hat sich geändert, die Übungsübersicht muss also mitgeprüft werden.

**Nicht belegt und für `/qa`:** der ganze Weg im Browser (eigener Begriff aus der Zeit vor
PROJ-19 verschwindet aus der Verwaltung, Filter „Ohne Material" in der Übungsübersicht, „Mehr
laden" mit Materialfilter über 50 Übungen hinaus), dazu das Verhalten, wenn das Aufgehen
scheitert.

## QA Test Results

**Getestet:** 2026-10-18, Stand Commit `af80706` plus die Tests dieser QA
**Umgebung:** Produktionsbuild auf Port 3100, Edge (Chromium) am Rechner und in Handybreite
(iPhone 13, Chromium-Motor), Testkonto
**Tester:** QA Engineer (AI)

### Überblick
- **Akzeptanzkriterien:** 33 von 36 bestanden, **2 nicht bestanden** (beide wegen eines Fehlers,
  keiner hoch), 1 entfällt
- **Fehler:** 3 — 0 kritisch, 0 hoch, 1 mittel, 2 niedrig
- **Sicherheit:** kein Befund
- **Regression:** keine — **468 von 468 Browser-Tests grün in einem Zug** (15,3 Minuten, zwei
  Arbeiter, kein Entwicklungsserver), darunter 34 neue für PROJ-19; **645 Unit-Tests grün**
  (1 neu)
- **Bereit für die Auslieferung:** ja — kein kritischer oder hoher Fehler

**Neue Browser-Tests:** `tests/PROJ-19-grundstock.spec.ts`, 17 Tests je Rechner und Handy, als
eigene Stufe „grundstock" und danach „grundstock mobil", nach der Verwaltung. Sie legen eigene
Begriffe an, die sonst in den Auswahllisten anderer Tests stünden, und einer lässt eigene
Begriffe im Grundstock aufgehen. Die Listen des Grundstocks stehen dort aus Abschnitt A
abgeschrieben, nicht aus dem Programm importiert. Alle Fehlschläge beim Schreiben lagen an den
Tests (falsch erwartete Folge „Bank" vor „Weichbodenmatte", Namensvergleich ohne Groß/Klein in
Playwright, die vom Filterfenster ausgeblendete Seite), keiner an der App.

**Neuer Unit-Test:** im Generator, dass eine Variante „Ohne Material" in einer Halle ohne jedes
Material eingeplant wird und die Hauptübung mit Material nicht.

Legende: **E2E** = im Browser ausgeführt, **Unit** = über Unit-Tests, **Code** = nur am Code
gelesen, **Live** = am lebenden System (Backend-Nachweis vom selben Tag).

### A. Der Grundstock
- [x] Genau die Begriffe aus Abschnitt A, keiner mehr, keiner weniger — Sportarten,
  Altersgruppen, Phasen, Organisationsformen und Material im Übungsformular (E2E)
- [x] Ohne eigene Sportarten von „Krabbelgruppe" bis „Teambuilding" (E2E)
- [x] Die acht weggefallenen Schreibweisen stehen in keiner der Listen (E2E)
- [x] „Volleyballnetz" und „Stufenbarren" in der Hallenausstattung (E2E); der Generator prüft sie
  wie jedes Material, er vergleicht Text mit Text (Code)

### B. Eine Reihenfolge überall
- [x] Eigene Sportarten oben, alphabetisch, danach der Grundstock — im Übungsformular und im Filter
  identisch (E2E); Gruppenformular über denselben Baustein (Code)
- [x] Kleingeschriebenes eigenes „e2e19 aerobic" steht alphabetisch zwischen den eigenen (E2E)
- [x] Gewählte Sportarten in Listenfolge in Detailansicht und Liste (E2E), Karte über dieselbe
  geordnete Liste (Code)
- [x] Eigene Altersgruppe bei Varianten, ganz oben (E2E)
- [x] Eigene Organisationsform bei Varianten, ganz oben (E2E)
- [x] Generator: „Sportarten der Gruppe" oben, darunter „Weitere" mit eigenen, dann dem
  Grundstock (E2E)
- [—] **Entfällt:** Generator ohne gewählte Gruppe. Ohne Gruppe zeigt der Generator keine
  Segmente; der Fall ist in der Oberfläche nicht herstellbar. Der Codeweg (ohne oberen Block die
  gewöhnliche Liste mit den eigenen Begriffen) ist derselbe wie unter „Weitere"
- [x] Klick-Reihenfolge der Gruppe „Volleyball, Kinderturnen" erscheint als „Kinderturnen,
  Volleyball" (E2E)
- [x] Verwaltung, Reiter „Kategorien": eigene Begriffe alphabetisch wie bisher (Code; die
  Verwaltungstests laufen unverändert grün)
- [x] Material auf dem Bereitschaftsbild in Listenfolge (Unit)
- [x] Materialzeilen bleiben beim Bearbeiten in Eingabefolge, auch beim Ändern der Menge; nach dem
  Speichern zeigt die Detailansicht die Listenfolge (E2E)
- [x] Filterlisten in derselben Folge wie das Übungsformular (E2E)

### C. „Ohne Material"
- [x] „Kein Material" steht nicht in der Materialliste an Übung und Halle (E2E); die Variante
  benutzt dieselbe Materialeingabe (Code)
- [x] Drei Wahlen an der Variante, Voreinstellung „Wie die Hauptübung" (E2E)
- [x] Bei „Ohne Material" lässt sich kein Material hinzufügen, erst nach „Eigenes Material" (E2E)
- [x] Der Generator plant eine Variante „Ohne Material" in jeder Halle ein (Unit, neu)
- [ ] **Nicht bestanden — BUG-29:** „Kein Material nötig" steht in der Detailansicht (E2E) und in
  „Danach" des Live-Modus (Code), im Stundenverlauf und beim aktuellen Schritt des Live-Modus aber
  nur „kein Material" — derselbe Text wie für jede Übung ohne Material. Einen Materialeintrag
  zeigt keine der Stellen
- [x] „Wie die Hauptübung" nimmt das Material der Hauptübung (Unit)
- [x] Filter „Ohne Material" findet genau die Übungen ohne Materialzeile — eine Übung mit Material,
  deren Variante „Ohne Material" ist, nicht (E2E, Live)
- [x] „Ohne Material" und „Ball" zusammen wirken als „oder" (E2E, Live)

### D. Kein Begriff zweimal
- [x] „gymnastik " wird „Gymnastik", mit „„Gymnastik" gibt es schon — ausgewählt." (E2E)
- [x] Erneut eingetippt: „„Gymnastik" ist schon ausgewählt.", nichts ändert sich (E2E)
- [x] „ZUMBA" wählt das eigene „Zumba", kein zweiter Chip (E2E)
- [x] Dasselbe bei Altersgruppen, Phasen und Material (E2E), Organisationsformen über dasselbe
  Auswahlfeld (Code); „Kein Material" lässt sich nicht als Material anlegen (E2E)
- [x] Verwaltung: „gymnastik" meldet den mitgelieferten Begriff und legt nichts an (E2E)
- [x] Eigenes „stufenbarren" ist nach dem Öffnen der Verwaltung dort verschwunden und steht in der
  Materialliste genau einmal, an Stelle 21 (E2E)
- [x] Eigene Sportart „gymnastik" an einer Übung: die Übung trägt danach „Gymnastik" (E2E, Live);
  der Generator findet sie, weil er Text mit Text vergleicht (Code)

### E. Richtiges Markieren
- [x] Satz unter Sportart, ohne Aufklappen (E2E)
- [x] Satz unter Altersgruppe (E2E)
- [x] Schnell-Anlegen: der Satz steht an der übernommenen Liste, weil das Schnell-Anlegen keine
  Felder für Sportart und Altersgruppe hat — **abweichend vom Wortlaut**, in den Implementation
  Notes (Frontend) begründet (Code)
- [ ] **Nicht bestanden — BUG-28:** der Zusatzsatz steht nur, wenn das Segment **ganz leer**
  bleibt. Wird es teilweise gefüllt, kommt der Satz nie, auch wenn die Sportart Übungen ausschließt
- [x] Liegt es nicht an der Sportart, fehlt der Satz (Code)

### Edge Cases
- [x] Weggefallener Begriff an einer Übung: bleibt stehen, wird angezeigt, ordnet sich wie ein
  eigener ein (Code, Unit)
- [x] Variante mit „Kein Material" aus der Zeit vor PROJ-19: gilt als „Ohne Material", ohne
  Fehler (E2E über den Filter-Test, Unit)
- [x] Eigener Begriff in anderer Schreibweise geht trotzdem auf (E2E: „gymnastik", „stufenbarren")
- [x] Umbenennen auf einen mitgelieferten Begriff ist Zusammenführen wie in PROJ-16 (Code;
  Verwaltungstests grün)
- [x] Gleicher Name in einer anderen Art ist kein Doppel (Unit)
- [x] Nur Leerzeichen: nichts wird angelegt (Code)
- [x] Gruppe mit einer weggefallenen Sportart: sie steht trotzdem oben (Code)
- [x] Viele eigene Begriffe: hingenommen laut Spec
- [x] Bildschirm 375 px: der Satz zum Markieren und die Blöcke im Generator ohne waagerechtes
  Scrollen (E2E, Handybreite)

### Sicherheit
- [x] **Keine neue Schnittstelle von außen.** Der Serverbaustein `custom-store.ts` ist keine
  Server-Aktion und lässt sich aus dem Browser nicht aufrufen
- [x] **Aufgehen nur am eigenen Konto:** gelesen wird mit `user_id` des Angemeldeten,
  `rename_category` läuft mit den Rechten des Aufrufers und prüft selbst `auth.uid()`; an fremden
  Kennungen meldet die Funktion `category_not_found` (in PROJ-16 am lebenden System nachgewiesen)
- [x] **Materialfilter:** die Werte gehen als Parameter an `in(...)`; Komma, Klammern und Schrägstrich
  laufen ohne Fehler und ohne Treffer durch (Live). „Ohne Material" wird nur bei `true` gesetzt.
  Die eingebetteten Materialzeilen unterliegen weiter den Zugriffsregeln
- [x] **Keine Schreiblast von außen:** das Aufgehen ruft die Datenbank nur auf, wenn es einen
  passenden eigenen Begriff gibt, je Begriff einmal
- [x] **Meldungen** werden als Text gesetzt, nicht als HTML

### Fehler

#### BUG-28: Der Satz zum Markieren benachbarter Sportarten fehlt bei teilweise gefülltem Segment
- **Schwere:** Mittel
- **Schritte:**
  1. Gruppe mit der Sportart „Turnen", zwei Übungen „Turnen" und mehrere Übungen „Kinderturnen"
     für dieselbe Phase
  2. Ein Segment generieren, das länger ist als die beiden Turnen-Übungen zusammen
  3. Erwartet: in der Begründung „Übungen passen oft auch zu benachbarten Sportarten …"
  4. Tatsächlich: „Alle 2 passenden Übungen … sind schon eingeplant", ohne den Satz
- **Ursache:** `generator.ts` füllt `blockedBy` nur, wenn **keine** Übung übrig bleibt
  („all-filtered"). Bei „exhausted" und „too-short" ist die Liste leer, `gap-notice.tsx` sieht
  die Sportart deshalb nie. Der Entwurf ging davon aus, dass die Aufschlüsselung das „heute schon
  weiß" — das stimmt nur für ein ganz leeres Segment
- **Warum mittel:** Das ist der häufigere Fall und genau der, den Abschnitt E meint (zu wenige
  Übungen, weil sie nicht überall markiert sind). Nichts geht kaputt, es fehlt nur der Hinweis
- **Priorität:** vor der Auslieferung beheben, wenn möglich; kein Hindernis

#### BUG-29: „Kein Material nötig" fehlt im Stundenverlauf und beim aktuellen Schritt des Live-Modus
- **Schwere:** Niedrig
- **Schritte:** Variante auf „Ohne Material" setzen, in eine Einheit übernehmen, Stundenverlauf und
  Live-Modus ansehen
- **Erwartet:** „Kein Material nötig"
- **Tatsächlich:** „kein Material" aus der Übungszeile (`exercise-facts-row.tsx`) — derselbe Text
  wie für eine Übung, die einfach keine Materialzeile hat. Detailansicht und „Danach" sagen
  „Kein Material nötig", die Hauptübung in der Detailansicht „Kein Material benötigt"
- **Priorität:** schön zu haben; ein Wortlaut für alle Stellen wäre einfacher

#### BUG-30: Die Material-Wahl einer Variante rutscht nach dem Löschen einer anderen Variante weiter
- **Schwere:** Niedrig
- **Schritte:**
  1. Übung mit zwei Varianten bearbeiten, an der ersten „Eigenes Material" wählen
  2. Die erste Variante löschen
  3. Erwartet: die verbliebene Variante zeigt „Wie die Hauptübung"
  4. Tatsächlich: sie zeigt „Eigenes Material" mit leerer Liste
- **Ursache:** `variant-input.tsx` merkt sich die Wahl je **Position** (`chosenMode[index]`) und
  rückt beim Löschen nicht nach — dasselbe Muster wie bei „Abweichende Bedingungen" daneben
- **Folge:** nur die Anzeige. Gespeichert wird „Wie die Hauptübung", weil die Liste leer ist
- **Nur am Code gefunden**, nicht im Browser nachgestellt
- **Priorität:** schön zu haben

### Nicht belegt
- **Firefox und echtes Safari** — auf diesem Rechner nicht prüfbar
- **Scheitert das Aufgehen** (Netz, Fehler), bleibt der Begriff in der Liste und wird beim
  nächsten Laden erneut versucht — nie eigens ausgelöst. Vom Nutzer am 2026-10-18 zurückgestellt
- **„Mehr laden" mit Materialfilter über 50 Übungen hinaus** — das Testkonto hat weniger; die
  Gesamtzahl kommt jetzt aus der Datenbank (Live)
- **Nebenwirkung des Aufgehens:** `rename_category` gibt den betroffenen Einheiten einen neuen
  Änderungsstempel. Wer gerade eine Einheit im Editor offen hat, bekommt beim Speichern einmal
  den Hinweis auf eine fremde Änderung. Am Code gelesen, nicht nachgestellt; einmal je Nutzer und
  Erweiterung des Grundstocks

## Deployment
_To be added by /deploy_
