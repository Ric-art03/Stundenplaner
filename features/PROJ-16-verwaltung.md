# PROJ-16: Verwaltung (Hallen, Stundenmuster, eigene Kategorien)

## Status: In Progress
**Created:** 2026-10-04
**Last Updated:** 2026-10-15

> **Am 2026-10-15 überarbeitet (`/refine`), nach dem Durchspielen in der Produktion — am selben
> Tag gebaut**, siehe „Implementation Notes (Frontend) — Überarbeitung vom 2026-10-15". Zwei Punkte im Generator: **wer Handarbeit am Zeitverlauf wegwirft, wird vorher
> gefragt** — jetzt auch bei „Auf Standard zurücksetzen" und beim Gruppenwechsel ohne Muster, nicht
> nur beim Laden eines Musters; und **„Stundenmuster speichern" ist ausgegraut**, solange der
> Zeitverlauf genau dem geladenen Muster entspricht. Dazu ein Begriff von „verändert" für beides:
> verglichen wird der Inhalt, eine zurückgenommene Änderung ist keine. Betroffen sind G, H, Edge
> Cases und das Decision Log; die Kriterien tragen den Vermerk *(2026-10-15)*.
>
> **Am selben Tag nachgeschärft, nach einer Rückfrage des Nutzers:** der Gruppenwechsel
> **nimmt den aktuellen Zeitverlauf mit** — auch ungespeichert, auf die Dauer der neuen Gruppe
> umgerechnet — statt nachzufragen und zu verwerfen. Nachgefragt wird nur noch, wenn er nicht
> passt (mehr Phasen als Minuten). Damit gilt dasselbe, ob ein Muster gewählt ist, ob danach
> „Individuell" gewählt wurde oder keines je geladen war. Kriterien mit *(2026-10-15, b)*.

> **Am 2026-10-14 überarbeitet (`/refine`), nach der Durchsicht durch den Nutzer — am selben Tag
> gebaut**, siehe „Implementation Notes (Frontend) — Überarbeitung vom 2026-10-14". Vier Punkte: „Verwaltung" steht am Rechner als vierter Menüpunkt in der Kopfzeile;
> Löschen einer Halle erklärt seine Folgen, und Material, das aus einer Halle wegfällt, wird beim
> Speichern nachgefragt; je Bildschirm nur noch **ein** „Kategorien verwalten"-Link, unten;
> „Im Generator öffnen" am Stundenmuster. Betroffen sind A, B, I, Out of Scope und das Decision
> Log; die geänderten Kriterien tragen den Vermerk *(2026-10-14)*.

> **PROJ-17 (Stundenmuster) ist am 2026-10-12 in diesem Feature aufgegangen.** Der Nutzer hat
> entschieden, beides zusammen zu verwirklichen: Stundenmuster sind wie eigene Kategorien etwas,
> das der Nutzer selbst angelegt hat, und alles selbst Angelegte soll an einem Ort verwaltet werden.
> Die Nummer PROJ-17 wird nicht neu vergeben. Verweise auf PROJ-17 in den Specs von PROJ-6 und
> PROJ-7 meinen dieses Feature.

## Worum es geht

Der Nutzer legt in der App nebenbei Dinge an, die danach überall wieder auftauchen: **eigene
Kategorien** (Sportarten, Altersgruppen, Phasen, Organisationsformen, Material), **Hallen** und —
neu mit diesem Feature — **Stundenmuster**. Bisher gibt es für die Kategorien keinen Ort, an dem man
sie sieht, berichtigt oder loswird; Fehleingaben wie `efefefed` bleiben für immer in jeder
Auswahlliste. Die Hallen haben eine eigene Seite unter „Gruppen". Stundenmuster gibt es noch nicht.

Dieses Feature bringt drei Dinge:

1. **Eine Seite „Verwaltung"** mit drei Reitern — Hallen, Stundenmuster, Kategorien — als der eine
   Ort für alles selbst Angelegte
2. **Eigene Kategorien anlegen, umbenennen, zusammenführen und löschen**
3. **Stundenmuster**: einen Zeitverlauf aus dem Generator unter einem Namen ablegen und auf jede
   Gruppe wieder anwenden

## Dependencies
- Requires: PROJ-2 (Benutzerregistrierung & Login) — nur für angemeldete Nutzer, nur eigene Einträge
- Requires: PROJ-3 (Übungsdatenbank) — eigene Kategorien entstehen dort und stehen in Übungen und Varianten
- Requires: PROJ-5 (Gruppenprofile) — die Hallenverwaltung zieht von dort um; Gruppen tragen Sportarten und Altersgruppen, Hallen Material
- Requires: PROJ-6 (Einheiten-Generator) — Stundenmuster werden im Generator gespeichert und geladen; Segmente tragen Phase, Sportarten und Organisationsform
- Berührt: PROJ-7 (Einheiten-Editor) — „Schnell anlegen" trägt ebenfalls eigene Begriffe ein und muss die Regel „Gelöschtes kommt nicht von selbst zurück" einhalten

## Begriffe

- **Eigene Kategorie** — ein Begriff, den der Nutzer selbst eingetragen hat und der nicht zu den
  vordefinierten der App gehört. Fünf **Arten**: Sportart, Altersgruppe, Phase, Organisationsform,
  Material
- **Vordefinierter Begriff** — von der App mitgeliefert (etwa „Aufwärmen", „Volleyball"). Nicht
  änderbar, nicht löschbar
- **Verwendung** — eine Stelle, an der ein Begriff steht: in einer Übung, einer Variante, einer
  Gruppe, einer Halle, einem Segment einer gespeicherten Einheit oder einem Stundenmuster
- **Stundenmuster** — ein benannter Zeitverlauf ohne Gruppe: die Segmente in ihrer Reihenfolge mit
  Phase, Minuten, „generieren oder frei lassen", Schwierigkeit, Organisationsform, Arbeitsnotiz der
  Phase und Sportarten (siehe unten), dazu die Gesamtdauer, bei der es gespeichert wurde

## User Stories
1. Als Übungsleiter möchte ich alle Begriffe sehen, die ich selbst angelegt habe, und wie oft jeder verwendet wird, damit ich Fehleingaben und Doppeltes erkenne.
2. Als Übungsleiter möchte ich eine vertippte Kategorie umbenennen und sie damit überall berichtigen, wo sie steht, damit ich nicht jede Übung einzeln öffnen muss.
3. Als Übungsleiter möchte ich eine Kategorie löschen, damit sie nicht länger in jeder Auswahlliste steht — ohne dass meine fertigen Übungen dabei etwas verlieren.
4. Als Übungsleiter möchte ich eine Kategorie vorab anlegen, ohne dafür erst eine Übung oder Gruppe zu öffnen.
5. Als Übungsleiter möchte ich den Aufbau einer Stunde, der sich bewährt hat, als Stundenmuster ablegen, damit ich ihn nicht jede Woche neu zusammenziehe.
6. Als Übungsleiter mit mehreren Gruppen möchte ich dasselbe Stundenmuster auf jede Gruppe setzen können, auch wenn deren Stunde kürzer oder länger ist und eine andere Sportart hat.
7. Als Übungsleiter möchte ich Hallen, Stundenmuster und Kategorien an einem Ort verwalten und von jeder Stelle, an der ich sie benutze, direkt dorthin kommen.

## Out of Scope
- **Vordefinierte Begriffe ausblenden, umbenennen oder löschen** — die mitgelieferten Listen bleiben, wie sie sind
- **Ein vierter Menüpunkt am Handy und der Umbau der Navigation** (Leiste am unteren Rand, Konto-Menü) — bleibt zurückgestellt bis PROJ-9 (Kalender). Am Rechner steht „Verwaltung" seit der Überarbeitung vom 2026-10-14 in der Kopfzeile
- **Den Zeitverlauf eines Stundenmusters in der Verwaltung bearbeiten** — geändert wird ein Muster nur über den Generator (laden, anpassen, erneut speichern)
- ~~**Ein Knopf „Im Generator öffnen" am Muster**~~ — am 2026-10-14 vom Nutzer doch gewählt, siehe Abschnitt I
- **Die betroffenen Gruppen beim Löschen einer Halle gleich einer anderen Halle zuweisen** — der Dialog erklärt nur; umgehängt wird im Gruppenprofil (2026-10-14)
- **Stundenmuster an eine Gruppe binden** oder eine Gruppe als Vorschlag merken
- **Eine Einheit merkt sich ihr Muster** — es gibt keine Verbindung zwischen Einheit und Muster nach dem Laden; ein geändertes Muster ändert keine Einheit
- **„Überall entfernen" beim Löschen einer Kategorie** — Löschen wirkt nur auf die Auswahllisten
- **Mehrere Einträge auf einmal löschen** („alle unbenutzten löschen")
- **Mitgelieferte Stundenmuster** — gehört, wenn überhaupt, zu PROJ-4 (Starter-Datenbank)
- **Stundenmuster oder Kategorien teilen** — PROJ-12 (Community)
- **Neue Funktionen an den Hallen** — die Hallenverwaltung zieht um, so wie sie ist; dazu kommen nur die Erklärung beim Löschen und die Nachfrage zum Material (2026-10-14). Dokumente an Hallen bleiben PROJ-15
- **Durchführungen nachträglich umschreiben** — was eine Durchführung (PROJ-14) festgehalten hat, bleibt beim Umbenennen stehen; sie ist eine Aufzeichnung
- **Erkennen, dass ein Zeitverlauf einem anderen, nicht geladenen Muster gleicht** — „so schon gespeichert" heißt: gleich dem Muster, das gerade geladen ist. Wer unter „Individuell" zufällig ein vorhandenes Muster nachbaut, kann es ein zweites Mal ablegen; der Name muss ohnehin ein anderer sein (2026-10-15)
- **Ein „Rückgängig" im Generator** — die Nachfragen schützen vor dem Verlust, ein Verlauf der Schritte ist nicht Teil dieses Features (2026-10-15)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### A. Die Seite „Verwaltung" und ihr Zugang

- [ ] Angenommen der Nutzer ist angemeldet, wenn er die Startseite öffnet, dann steht dort eine vierte Karte „Verwaltung" mit einem Satz, der sagt, was dort liegt (Hallen, Stundenmuster, eigene Kategorien)
- [ ] Angenommen der Nutzer öffnet die Verwaltung, dann sieht er drei Reiter in der Reihenfolge Hallen, Stundenmuster, Kategorien, und bei 375 px Breite stehen alle drei nebeneinander, ohne dass die Seite waagerecht scrollt
- [ ] Angenommen der Nutzer öffnet die Verwaltung ohne Angabe eines Reiters, dann ist „Hallen" geöffnet
- [ ] Angenommen ein Reiter ist geöffnet, wenn der Nutzer die Seite neu lädt oder den Link weitergibt, dann ist derselbe Reiter geöffnet
- [ ] Angenommen ein Reiter ist geöffnet, dann steht über der Liste ein kurzer Erklärtext, der sagt, wo diese Einträge entstehen und wo sie in der App wirken
- [ ] Angenommen der Nutzer ist nicht angemeldet, wenn er die Adresse der Verwaltung aufruft, dann wird er zur Anmeldung geleitet
- [ ] Angenommen der Nutzer ist auf der Gruppenübersicht, wenn er „Hallen verwalten" wählt, dann öffnet sich die Verwaltung im Reiter „Hallen"
- [ ] Angenommen der Nutzer ist im Formular einer Gruppe bei der Hallenauswahl, dann steht dort ein Link „Hallen verwalten", der die Verwaltung im Reiter „Hallen" öffnet; „Neue Halle" bleibt daneben erhalten
- [ ] Angenommen der Nutzer ist im Generator bei den Stundenmustern, dann steht dort ein Link „Stundenmuster verwalten", der die Verwaltung im Reiter „Stundenmuster" öffnet
- [ ] ~~Angenommen der Nutzer ist im Übungs-Formular, im Gruppen-Formular oder in der Phasenauswahl des Generators an einer Auswahlliste, die eigene Begriffe aufnimmt, dann steht dort ein Link „Kategorien verwalten", der die Verwaltung im Reiter „Kategorien" beim Abschnitt dieser Art öffnet~~ — ersetzt durch die drei folgenden *(2026-10-14)*
- [ ] *(2026-10-14)* Angenommen ein Bildschirm eines Formulars enthält eine oder mehrere Auswahllisten, die eigene Begriffe aufnehmen, dann steht dort **genau ein** Link „Kategorien verwalten", **unterhalb des letzten** dieser Felder — nicht an jedem Feld. Er öffnet die Verwaltung im Reiter „Kategorien"; stehen auf dem Bildschirm Felder nur einer Art, springt er zu deren Abschnitt, sonst an den Anfang des Reiters
- [ ] *(2026-10-14)* Angenommen der Nutzer ist im Übungs-Assistenten, dann steht der Link einmal am Ende des Schritts „Einordnung" (Sportart, Altersgruppe, Phase, Organisationsform) und einmal im Schritt mit dem Material; an den Listen der Varianten steht keiner
- [ ] *(2026-10-14)* Angenommen der Nutzer ist im Gruppen-Formular, dann steht der Link einmal unter Sportart und Altersgruppe, und „Hallen verwalten" bleibt an der Hallenauswahl. Angenommen er ist im Generator, dann steht der Link einmal unter dem Zeitverlauf statt an jedem Segment
- [ ] Angenommen der Nutzer hat in einem Formular ungespeicherte Eingaben, wenn er einen „verwalten"-Link wählt, dann gehen die Eingaben nicht ohne Nachfrage verloren
- [ ] ~~Angenommen die Kopfzeile der App, dann hat sie weiterhin genau die drei Menüpunkte Übungen, Gruppen, Einheiten~~ — ersetzt durch die beiden folgenden *(2026-10-14)*
- [ ] *(2026-10-14)* Angenommen die Seite ist mindestens 768 px breit, dann hat die Kopfzeile vier Menüpunkte — Übungen, Gruppen, Einheiten, Verwaltung —, gestaltet wie die drei anderen, und nichts darin bricht um oder scrollt waagerecht
- [ ] *(2026-10-14)* Angenommen die Seite ist schmaler als 768 px, dann hat die Kopfzeile weiterhin genau die drei Menüpunkte Übungen, Gruppen, Einheiten; die Verwaltung ist über die Karte der Startseite und die „verwalten"-Links erreichbar

### B. Reiter „Hallen" (Umzug aus PROJ-5)

- [ ] Angenommen der Nutzer hat Hallen angelegt, wenn er den Reiter „Hallen" öffnet, dann sieht er dieselbe Liste mit denselben Angaben und denselben Aktionen (anlegen, bearbeiten, löschen) wie bisher unter „Gruppen → Hallen"; was beim Löschen und beim Ändern des Materials gesagt wird, regeln die Kriterien unter „Folgen erklären"
- [ ] Angenommen der Nutzer hat keine Halle, wenn er den Reiter öffnet, dann sieht er einen Leerzustand mit „Erste Halle anlegen"
- [ ] Angenommen der Nutzer ruft die bisherige Adresse der Hallenverwaltung auf, dann landet er in der Verwaltung im Reiter „Hallen"
- [ ] Angenommen der Nutzer legt im Gruppen-Formular über „Neue Halle" eine Halle an, dann funktioniert das unverändert und die Halle erscheint danach im Reiter „Hallen"

**Folgen erklären** *(2026-10-14)* — Eine Halle wirkt über ihr Material: Der Generator plant für
eine Gruppe nur Übungen ein, für die das Material ihrer Halle reicht. Hat eine Gruppe **keine**
Halle, prüft er das Material gar nicht. Beides war bisher nirgends gesagt.

- [ ] *(2026-10-14)* Angenommen an der Halle hängen Gruppen, wenn der Nutzer „Löschen" wählt, dann nennt der Dialog die Gruppen mit Namen und sagt: diese Gruppen haben danach keine Halle; der Generator prüft für sie kein Material mehr und plant auch Übungen ein, deren Material dort fehlt; gespeicherte Einheiten bleiben, wie sie sind; das Löschen lässt sich nicht rückgängig machen
- [ ] *(2026-10-14)* Angenommen an der Halle hängt keine Gruppe, wenn der Nutzer „Löschen" wählt, dann fragt der Dialog einmal nach, nennt die Halle beim Namen und sagt, dass sich das nicht rückgängig machen lässt
- [ ] *(2026-10-14)* Angenommen der Dialog nennt Gruppen, dann sagt er auch, wo man sie einer anderen Halle zuweist (im Gruppenprofil); er bietet das Umhängen nicht selbst an
- [ ] *(2026-10-14)* Angenommen die Halle ist gelöscht, dann bleiben die eigenen Materialbegriffe, die nur an ihr standen, in den Auswahllisten und in der Verwaltung (sie sind nur noch „unbenutzt")
- [ ] *(2026-10-14)* Angenommen an der Halle hängen Gruppen, wenn der Nutzer im Hallen-Dialog ein Material entfernt oder seine Anzahl senkt und speichert, dann fragt die App vorher nach: sie nennt je betroffenem Material die Gruppen und die Zahl der Übungen, die damit für diese Gruppen nicht mehr eingeplant werden, und speichert erst nach der Bestätigung
- [ ] *(2026-10-14)* Angenommen die Anzahl wird gesenkt, dann zählt die Nachfrage nur die Übungen, für die die neue Anzahl bei mindestens einer betroffenen Gruppe nicht mehr reicht — gerechnet wie im Generator, also „pro Teilnehmer" mit der Teilnehmerzahl der Gruppe. Ist das keine, fragt die App nicht nach
- [ ] *(2026-10-14)* Angenommen der Nutzer benennt in einer Materialzeile das Material um (wählt ein anderes), dann gilt das alte als entfernt und wird wie oben nachgefragt
- [ ] *(2026-10-14)* Angenommen an der Halle hängt keine Gruppe, oder es wird nur Material hinzugefügt oder vermehrt, dann speichert die App ohne Nachfrage
- [ ] *(2026-10-14)* Angenommen der Nutzer bricht die Nachfrage ab, dann ist nichts gespeichert und der Dialog steht mit seinen Eingaben noch da
- [ ] *(2026-10-14)* Angenommen das Material wird gesenkt oder entfernt, dann ändert sich an gespeicherten Einheiten nichts; die Nachfrage sagt das

### C. Reiter „Kategorien" — ansehen

- [ ] Angenommen der Nutzer öffnet den Reiter „Kategorien", dann sieht er fünf Abschnitte in fester Reihenfolge — Sportarten, Altersgruppen, Phasen, Organisationsformen, Material — und in jedem die eigenen Begriffe dieser Art in alphabetischer Reihenfolge
- [ ] Angenommen ein eigener Begriff wird verwendet, dann steht an ihm, wo: je eine Zahl für Übungen, Gruppen, Hallen, gespeicherte Einheiten und Stundenmuster, wobei nur die Angaben erscheinen, die nicht null sind
- [ ] Angenommen ein Begriff steht in einer Übung nur an einer Variante, dann zählt diese Übung einmal mit
- [ ] Angenommen ein eigener Begriff wird nirgends verwendet, dann ist er als „unbenutzt" gekennzeichnet
- [ ] Angenommen ein Abschnitt hat keinen eigenen Begriff, dann steht dort ein Satz, dass es in dieser Art noch nichts Eigenes gibt, und der Knopf zum Anlegen
- [ ] Angenommen der Reiter ist geöffnet, dann werden vordefinierte Begriffe nicht als Einträge gezeigt; der Erklärtext sagt, dass die mitgelieferten Begriffe fest sind und hier nur die eigenen stehen
- [ ] Angenommen der Nutzer wählt an einem Begriff „Verwendungen ansehen", dann sieht er die betroffenen Übungen, Gruppen, Hallen, Einheiten und Stundenmuster mit Namen, nach Sorte gegliedert

### D. Kategorie anlegen

- [ ] Angenommen der Nutzer wählt in einem Abschnitt „Anlegen", wenn er einen Namen eingibt und bestätigt, dann steht der Begriff in diesem Abschnitt als „unbenutzt" und ab sofort in jeder Auswahlliste dieser Art
- [ ] Angenommen der Nutzer bestätigt ohne Namen oder nur mit Leerzeichen, dann wird nichts angelegt und am Feld steht, dass ein Name fehlt
- [ ] Angenommen der Name hat Leerzeichen am Anfang oder Ende, dann werden sie entfernt
- [ ] Angenommen der Name ist länger als 100 Zeichen, dann wird er abgelehnt und am Feld steht die Grenze
- [ ] Angenommen es gibt in derselben Art schon einen eigenen oder vordefinierten Begriff mit diesem Namen (Groß-/Kleinschreibung ohne Unterschied), dann wird nichts angelegt und am Feld steht, dass es den Begriff schon gibt und ob er vordefiniert oder eigen ist
- [ ] Angenommen derselbe Name existiert in einer **anderen** Art (etwa „Ball" als Material und als Sportart), dann wird der Begriff angelegt

### E. Kategorie umbenennen und zusammenführen

- [ ] Angenommen der Nutzer wählt an einem eigenen Begriff „Umbenennen", dann sieht er den bisherigen Namen im Feld und darunter, wie viele Übungen, Gruppen, Hallen, Einheiten und Stundenmuster die Änderung betrifft
- [ ] Angenommen der neue Name ist frei, wenn der Nutzer bestätigt, dann steht der neue Name in der Verwaltung, in allen Auswahllisten und an jeder Verwendung: in Übungen, Varianten, Gruppen (auch als Hauptsportart), Hallen, den Segmenten gespeicherter Einheiten (Phase, Sportarten, Hauptsportart, Organisationsform) und Stundenmustern
- [ ] Angenommen das Umbenennen ist bestätigt, dann ist es ganz oder gar nicht geschehen — es gibt keinen Zustand, in dem ein Teil der Verwendungen den alten und ein Teil den neuen Namen trägt
- [ ] Angenommen der neue Name unterscheidet sich vom alten nur in der Groß-/Kleinschreibung, dann ist das ein gewöhnliches Umbenennen ohne Zusammenführen
- [ ] Angenommen der neue Name gleicht einem anderen eigenen oder einem vordefinierten Begriff derselben Art, dann fragt die App nach: „‚[Name]' gibt es schon. Zusammenführen?", nennt die betroffenen Verwendungen und sagt, dass der Schritt nicht rückgängig zu machen ist
- [ ] Angenommen der Nutzer bestätigt das Zusammenführen, dann steht an jeder bisherigen Verwendung der vorhandene Begriff in dessen Schreibweise, der alte eigene Begriff ist aus der Verwaltung und den Auswahllisten verschwunden, und kein Eintrag trägt den Begriff doppelt
- [ ] Angenommen eine Übung trug beide Begriffe, wenn zusammengeführt wird, dann trägt sie danach den Begriff einmal
- [ ] Angenommen eine Übung trug das alte und das vorhandene **Material** je mit Menge, wenn zusammengeführt wird, dann bleibt die Angabe des vorhandenen Materials stehen und die des alten entfällt
- [ ] Angenommen der Nutzer bricht die Nachfrage ab, dann ist nichts geändert und das Feld zum Umbenennen steht mit seiner Eingabe noch da
- [ ] Angenommen der neue Name ist leer oder länger als 100 Zeichen, dann wird nicht umbenannt und am Feld steht der Grund
- [ ] Angenommen der Nutzer benennt eine Phase um, die im Generator gerade in einer noch nicht gespeicherten Einheit (Entwurf) steht, dann trägt der Entwurf beim nächsten Öffnen den neuen Namen
- [ ] Angenommen ein Begriff ist umbenannt, dann bleiben bereits festgehaltene Durchführungen (PROJ-14) unverändert
- [ ] Angenommen das Umbenennen ist geschehen, dann sagt eine Meldung, was umbenannt wurde und wie viele Einträge mitgezogen sind

### F. Kategorie löschen

- [ ] Angenommen der Nutzer wählt an einem unbenutzten Begriff „Löschen", dann fragt die App einmal nach und entfernt ihn nach der Bestätigung
- [ ] Angenommen der Begriff wird verwendet, wenn der Nutzer „Löschen" wählt, dann nennt der Dialog die betroffenen Übungen, Gruppen, Hallen, Einheiten und Stundenmuster mit Namen und sagt ausdrücklich: der Begriff bleibt dort stehen, er verschwindet nur aus den Auswahllisten
- [ ] Angenommen der Dialog nennt Verwendungen, dann bietet er neben „Löschen" auch „Stattdessen umbenennen" an, das den Umbenennen-Dialog öffnet
- [ ] Angenommen der Begriff ist gelöscht, dann steht er in keiner Auswahlliste mehr: nicht im Übungs-Formular, nicht im Gruppen-Formular, nicht am Hallenmaterial, nicht in der Phasenauswahl des Generators, nicht in den Filtern der Übungsübersicht
- [ ] Angenommen der Begriff ist gelöscht und steht noch in einer Übung, wenn der Nutzer diese Übung öffnet, dann wird der Begriff dort weiter angezeigt und ist im Bearbeiten-Formular weiter ausgewählt
- [ ] Angenommen der Begriff ist gelöscht und steht noch in einer Übung, Gruppe oder Halle, wenn der Nutzer diesen Eintrag speichert, ohne den Begriff anzufassen, dann bleibt der Begriff am Eintrag stehen und kehrt **nicht** in die Verwaltung und die Auswahllisten zurück
- [ ] Angenommen der Begriff ist gelöscht und steht noch in einer Übung, wenn der Nutzer ihn dort abwählt und speichert, dann ist er an der Übung weg und in ihrer Auswahlliste nicht mehr zu finden
- [ ] Angenommen der Begriff ist gelöscht, wenn der Nutzer ihn irgendwo neu eintippt, dann entsteht er als eigener Begriff neu, und seine noch stehenden früheren Verwendungen zählen wieder mit
- [ ] Angenommen eine gelöschte Phase steht noch in einer gespeicherten Einheit, dann zeigt die Einheit sie unverändert, auch im Editor und im Live-Modus
- [ ] Angenommen eine gelöschte Phase steht noch in einer gespeicherten Einheit, wenn der Nutzer von dort „Zurück zum Generator" wählt, dann steht das Segment mit dieser Phase weiter im Zeitverlauf; in der Phasenauswahl anderer Segmente wird sie nicht angeboten
- [ ] Angenommen das Löschen ist geschehen, dann sagt eine Meldung, dass der Begriff aus den Auswahllisten entfernt ist
- [ ] *(2026-10-14)* Angenommen ein **Material**begriff ist gelöscht, der an Übungen und Hallen steht, dann plant der Generator genau wie vorher: Übungen verlangen das Material weiter, Hallen haben es weiter in ihrer Anzahl. Der Löschdialog sagt bei Material ausdrücklich, dass sich am Generator nichts ändert

### G. Stundenmuster speichern (im Generator)

- [ ] Angenommen der Nutzer hat im Generator eine Gruppe gewählt und der Zeitverlauf ist sichtbar, dann steht dort der Knopf „Stundenmuster speichern"
- [ ] Angenommen der Nutzer wählt „Stundenmuster speichern", wenn er einen Namen eingibt und bestätigt, dann ist der Zeitverlauf so abgelegt, wie er gerade steht: Segmente in ihrer Reihenfolge mit Phase, Minuten, „generieren oder frei lassen", Schwierigkeit, Organisationsform und Arbeitsnotiz der Phase, dazu die Gesamtdauer
- [ ] Angenommen ein Segment trägt beim Speichern genau die Sportarten und die Hauptsportart der gewählten Gruppe, dann merkt sich das Muster für dieses Segment „wie die Gruppe" statt der Begriffe
- [ ] Angenommen ein Segment trägt beim Speichern eine andere Auswahl als die Gruppe, dann merkt sich das Muster genau diese Sportarten und diese Hauptsportart
- [ ] Angenommen der Name ist leer, nur Leerzeichen oder länger als 60 Zeichen, dann wird nichts gespeichert und am Feld steht der Grund
- [ ] Angenommen es gibt schon ein Muster mit diesem Namen (Groß-/Kleinschreibung ohne Unterschied), dann fragt die App, ob es überschrieben werden soll, und speichert erst nach der Bestätigung
- [ ] Angenommen der Zeitverlauf stammt aus einem geladenen Muster, wenn der Nutzer „Stundenmuster speichern" wählt, dann bietet der Dialog zwei Wege: „‚[Name]' überschreiben" und „Als neues Muster speichern" mit Namensfeld
- [ ] Angenommen die Minuten der Segmente ergeben nicht die Einheitsdauer, dann ist „Stundenmuster speichern" nicht ausführbar und sagt, warum
- [ ] *(2026-10-15)* Angenommen ein Muster ist geladen und der Zeitverlauf entspricht ihm genau (im Sinne von „verändert" unter H), dann ist „Stundenmuster speichern" ausgegraut, und unter den Knöpfen steht: „Dieses Stundenmuster ist so schon gespeichert."
- [ ] *(2026-10-16, ersetzt das Kriterium vom 2026-10-15)* Angenommen das geladene Muster wurde nur auf die Dauer der Gruppe umgerechnet und sonst nicht verändert, dann ist „Stundenmuster speichern" ebenfalls ausgegraut, und darunter steht: „Dieses Stundenmuster ist so schon gespeichert — hier auf [y] Minuten umgerechnet." Wer die umgerechnete Fassung als eigenes Muster ablegen will, ändert etwas am Zeitverlauf; dann ist der Knopf frei
- [ ] *(2026-10-15)* Angenommen der Nutzer ändert am geladenen Muster etwas und nimmt es wieder zurück, dann ist der Knopf wieder ausgegraut
- [ ] *(2026-10-15)* Angenommen der Nutzer hat das Muster gerade gespeichert (überschrieben oder neu), dann ist dieses Muster das geladene und der Knopf ausgegraut, bis sich am Zeitverlauf wieder etwas ändert
- [ ] Angenommen das Muster ist gespeichert, dann sagt eine Meldung es mit Namen, der Zeitverlauf bleibt unverändert stehen und das Muster steht sofort in der Auswahl des Generators und in der Verwaltung
- [ ] Angenommen der Nutzer hat bereits 100 Stundenmuster, wenn er ein weiteres neu speichern will, dann wird es abgelehnt mit dem Hinweis auf die Grenze und auf die Verwaltung; Überschreiben bleibt möglich

### H. Stundenmuster anwenden (im Generator)

- [ ] Angenommen der Nutzer hat eine Gruppe gewählt, dann stehen unter „Wie soll die Einheit aufgebaut sein?" drei Wege in dieser Reihenfolge: Standard, Stundenmuster, Individuell
- [ ] Angenommen der Nutzer hat noch kein Stundenmuster, wenn er den Weg „Stundenmuster" ansieht, dann ist er nicht wählbar und erklärt in einem Satz, wie ein Muster entsteht (unter „Individuell" den Zeitverlauf einrichten und „Stundenmuster speichern" wählen)
- [ ] Angenommen es gibt Muster, wenn der Nutzer „Stundenmuster" wählt, dann sieht er eine Auswahlliste aller Muster in alphabetischer Reihenfolge, jedes mit Name, Gesamtdauer und Zahl der Segmente
- [ ] Angenommen der Nutzer wählt ein Muster, dann zeigt der Zeitverlauf dessen Segmente, und die Einheit lässt sich ohne weiteren Schritt generieren
- [ ] Angenommen die Gesamtdauer des Musters gleicht der Einheitsdauer der Gruppe, dann stehen die Minuten jedes Segments wie gespeichert
- [ ] Angenommen die Gesamtdauer weicht ab, dann sind die Segmente im selben Verhältnis umgerechnet, ihre Summe ergibt genau die Einheitsdauer der Gruppe, und ein Hinweis am Zeitverlauf sagt: „Muster von [x] auf [y] Minuten umgerechnet"
- [ ] Angenommen beim Umrechnen fiele ein Segment unter die Mindestlänge, die der Zeitverlauf erlaubt, dann erhält es die Mindestlänge und die übrigen Segmente geben die Minuten anteilig ab
- [ ] Angenommen die Einheitsdauer der Gruppe reicht nicht, um jedem Segment des Musters die Mindestlänge zu geben, dann wird das Muster nicht angewendet, der Zeitverlauf bleibt wie zuvor, und die Meldung nennt beide Zahlen: wie viele Segmente das Muster hat und wie viele Minuten die Gruppe bietet
- [ ] Angenommen ein Segment des Musters ist als „wie die Gruppe" gemerkt, dann trägt es nach dem Laden die Sportarten und die Hauptsportart der gewählten Gruppe
- [ ] Angenommen ein Segment des Musters trägt eigene Sportarten, dann stehen nach dem Laden genau diese, auch wenn keine davon zur Gruppe gehört
- [ ] Angenommen der Nutzer ändert nach dem Laden etwas am Zeitverlauf, dann bleibt das Muster selbst unverändert, bis er „Stundenmuster speichern" und „überschreiben" wählt
- [ ] Angenommen der Zeitverlauf ist sichtbar und es gibt Muster, dann steht dort neben „Auf Standard zurücksetzen" der Knopf „Auf Stundenmuster setzen", der dieselbe Auswahlliste öffnet
- [ ] *(2026-10-15)* **„Von Hand verändert"** heißt: der Zeitverlauf, wie er dasteht, weicht vom Standard der Gruppe ab — oder, wenn ein Muster geladen ist, von diesem Muster, wie es auf die Gruppe angewendet wurde. Verglichen wird der Inhalt (Segmente in ihrer Reihenfolge mit Phase, Minuten, „generieren oder frei lassen", Schwierigkeit, Sportarten, Organisationsform, Arbeitsnotiz der Phase), nicht ob etwas angefasst wurde: eine zurückgenommene Änderung ist keine. Dieser eine Begriff gilt für alle Nachfragen hier und für „Stundenmuster speichern" unter G
- [ ] Angenommen der Nutzer hat den Zeitverlauf von Hand verändert, wenn er ein Muster wählt oder „Auf Stundenmuster setzen" benutzt, dann fragt die App vorher nach, weil der bisherige Stand ersetzt wird
- [ ] *(2026-10-15)* Angenommen der Nutzer hat den Zeitverlauf von Hand verändert, wenn er „Auf Standard zurücksetzen" wählt, dann fragt die App mit derselben Nachfrage vorher nach („Bisherigen Zeitverlauf ersetzen?"); erst nach „Ersetzen" wird zurückgesetzt und die Meldung „Auf Standard zurückgesetzt" erscheint. Ist der Zeitverlauf unverändert, wird ohne Nachfrage zurückgesetzt
- [ ] *(2026-10-15)* Angenommen der Nutzer hat den Zeitverlauf von Hand verändert, wenn er oben auf den Weg „Standard" umschaltet, dann fragt die App **nicht** nach — die Änderungen gehen dabei nicht verloren und stehen beim Zurückschalten auf „Individuell" wieder da
- [ ] Angenommen der Zeitverlauf ist unverändert gegenüber Standard oder dem zuletzt geladenen Muster, wenn der Nutzer ein Muster wählt, dann wird es ohne Nachfrage geladen
- [ ] *(2026-10-15, b)* **Beim Gruppenwechsel kommt der aktuelle Stand mit** — gespeichert oder nicht, gleich ob ein Muster gewählt ist, ob danach „Individuell" gewählt wurde oder ob nie ein Muster geladen war. Es gibt dabei keine Nachfrage, weil nichts verloren geht
- [ ] *(2026-10-15, b)* Angenommen der Zeitverlauf ist unverändert, wenn der Nutzer die Gruppe wechselt, dann wird er für die neue Gruppe frisch aufgebaut: ohne Muster ihr Standard, mit Muster das Muster frisch angewendet (Umrechnung und Sportarten der neuen Gruppe); das Muster bleibt gewählt
- [ ] *(2026-10-15, b)* Angenommen der Zeitverlauf ist von Hand verändert, wenn der Nutzer die Gruppe wechselt, dann steht danach genau dieser Zeitverlauf da, umgerechnet wie ein Muster: die Minuten im selben Verhältnis auf die Dauer der neuen Gruppe, Segmente mit genau den Sportarten der alten Gruppe tragen die der neuen, bewusst abweichende Sportarten bleiben. Phase, Füllart, Schwierigkeit, Organisationsform und Arbeitsnotiz bleiben, wie sie sind
- [ ] *(2026-10-15, b)* Angenommen der Zeitverlauf wurde so mitgenommen, dann steht am Zeitverlauf ein Hinweis: „Zeitverlauf übernommen und von [x] auf [y] Minuten umgerechnet." — bei gleicher Dauer „Zeitverlauf übernommen." Er verschwindet, sobald ein Muster geladen oder auf Standard zurückgesetzt wird
- [ ] *(2026-10-15, b)* Angenommen ein Muster war gewählt, dann bleibt es nach dem Mitnehmen gewählt und ist weiter der Vergleichsstand — so wie es auf die neue Gruppe angewendet würde. „Überschreiben" bleibt möglich
- [ ] *(2026-10-15, b)* Angenommen der veränderte Zeitverlauf hat mehr Phasen, als die neue Gruppe Minuten bietet, dann fragt die App vorher nach und nennt beide Zahlen: „Trotzdem wechseln" gibt der neuen Gruppe ihren Standard (oder das gewählte Muster, wenn es passt), was von Hand geändert wurde, geht verloren; „Abbrechen" lässt Gruppe und Zeitverlauf, wie sie waren
- [ ] Angenommen der Nutzer hat mit einem Muster generiert, wenn er von der Einheit „Zurück zum Generator" wählt, dann steht der Zeitverlauf so da, wie er ihn verlassen hat
- [ ] Angenommen eine Einheit ist aus einem Muster entstanden, wenn das Muster danach überschrieben, umbenannt oder gelöscht wird, dann ändert sich an der Einheit nichts
- [ ] Angenommen ein Muster trägt eine eigene Phase, die inzwischen gelöscht wurde, dann wird das Muster trotzdem vollständig geladen und das Segment trägt die Phase weiter

### I. Reiter „Stundenmuster" (Verwaltung)

- [ ] Angenommen der Nutzer hat Muster, wenn er den Reiter öffnet, dann sieht er sie in alphabetischer Reihenfolge, jedes mit Name, Gesamtdauer und einer Kurzfassung des Aufbaus: die Segmente in ihrer Reihenfolge mit Phase und Minuten, frei gelassene als solche gekennzeichnet
- [ ] Angenommen der Nutzer hat kein Muster, dann sieht er einen Leerzustand, der erklärt, wozu Muster gut sind und wo sie entstehen, mit einem Knopf zum Generator
- [ ] Angenommen der Nutzer wählt an einem Muster „Umbenennen", wenn er einen freien Namen bestätigt, dann trägt das Muster den neuen Namen, in der Verwaltung und im Generator
- [ ] Angenommen der neue Name ist leer, länger als 60 Zeichen oder schon an ein anderes Muster vergeben, dann wird nicht umbenannt und am Feld steht der Grund
- [ ] Angenommen der Nutzer wählt „Löschen", dann fragt die App einmal nach und sagt dabei, dass Einheiten, die mit dem Muster entstanden sind, bleiben, wie sie sind
- [ ] Angenommen das Muster ist gelöscht, dann steht es nicht mehr in der Auswahl des Generators
- [ ] Angenommen der Reiter ist geöffnet, dann gibt es dort keinen Weg, die Segmente eines Musters zu ändern; der Erklärtext sagt, dass das im Generator geschieht (laden, anpassen, „Stundenmuster speichern", überschreiben)
- [ ] *(2026-10-14)* Angenommen der Nutzer öffnet das Menü (drei Punkte) eines Musters, dann steht dort als erster Punkt „Im Generator öffnen", vor „Umbenennen" und „Löschen"
- [ ] *(2026-10-14)* Angenommen der Nutzer wählt „Im Generator öffnen", dann öffnet sich der Generator mit dem Weg „Stundenmuster" und genau diesem Muster vorgewählt, noch ohne Gruppe
- [ ] *(2026-10-14)* Angenommen der Generator wurde so geöffnet, wenn der Nutzer eine Gruppe wählt, dann ist das Muster sofort auf diese Gruppe angewendet — Zeitverlauf sichtbar, umgerechnet und mit den Sportarten der Gruppe wie unter H —, ohne dass er das Muster noch einmal auswählen muss
- [ ] *(2026-10-14)* Angenommen das Muster passt nicht auf die gewählte Gruppe (zu viele Segmente für ihre Dauer), dann gilt dasselbe wie unter H: nicht angewendet, die Meldung nennt beide Zahlen; das Muster bleibt vorgewählt, damit eine andere Gruppe es übernehmen kann
- [ ] *(2026-10-14)* Angenommen der Nutzer hat keine Gruppe, wenn er „Im Generator öffnen" wählt, dann zeigt der Generator wie bisher, dass zuerst eine Gruppe nötig ist
- [ ] *(2026-10-14)* Angenommen das Muster wurde inzwischen gelöscht (anderer Tab), wenn der Generator damit geöffnet wird, dann steht er auf „Standard" und eine Meldung sagt, dass es das Muster nicht mehr gibt

### J. Durchgehend

- [ ] Angenommen eine Aktion in der Verwaltung scheitert (keine Verbindung, Serverfehler), dann sagt eine Meldung, dass nichts geändert wurde, der Dialog bleibt mit der Eingabe offen, und die Liste zeigt den unveränderten Stand
- [ ] Angenommen ein Eintrag wurde in einem anderen Tab oder auf einem anderen Gerät schon gelöscht, wenn der Nutzer ihn hier umbenennen oder löschen will, dann sagt eine Meldung, dass es ihn nicht mehr gibt, und die Liste wird aufgefrischt
- [ ] Angenommen ein Nutzer ruft eine Aktion mit der Kennung eines fremden Eintrags auf, dann wird sie abgewiesen und nichts geändert; ein Nutzer sieht in der Verwaltung ausschließlich eigene Einträge
- [ ] Angenommen eine Liste wird geladen, dann sieht der Nutzer einen Ladezustand statt einer leeren Liste
- [ ] Angenommen der Nutzer bedient die Verwaltung bei 375 px Breite, dann sind alle Aktionen eines Eintrags erreichbar und nichts scrollt waagerecht

## Edge Cases

- **Umbenennen trifft die einzige Phase einer Übung** — kein Sonderfall: die Übung trägt danach den neuen Namen, nichts geht verloren
- **Zusammenführen einer eigenen Sportart, die Hauptsportart einer Gruppe ist** — die Gruppe hat danach den vorhandenen Begriff als Hauptsportart
- **Zwei eigene Begriffe, die sich nur in der Groß-/Kleinschreibung unterscheiden** („Reifen", „reifen") — können aus der Zeit vor diesem Feature schon nebeneinander bestehen. Die Verwaltung zeigt beide; wird der eine auf den Namen des anderen umbenannt, greift das Zusammenführen
- **Derselbe Name in zwei Arten** — „Ball" als Material und als Sportart sind zwei Begriffe; Umbenennen und Löschen wirken nur in der einen Art
- **Ein gelöschter Begriff steht noch in einer Übung, und der Nutzer legt ihn in der Verwaltung neu an** — er ist wieder ein gewöhnlicher eigener Begriff, die alten Verwendungen zählen sofort mit
- **Ein gelöschter Begriff wird über „Schnell anlegen" im Editor (PROJ-7) vorbelegt** (etwa die Organisationsform der Phase) — die Übung bekommt ihn, er kehrt aber nicht in die Auswahllisten zurück, solange der Nutzer ihn nicht selbst neu eintippt
- **Muster mit acht Segmenten auf eine 30-Minuten-Gruppe** — reicht die Dauer nicht für die Mindestlänge je Segment, wird das Muster nicht angewendet; die Meldung nennt den Grund vollständig
- **Muster nur aus frei gelassenen Segmenten** — speicherbar und ladbar; ob damit generiert werden kann, entscheidet wie bisher der Generator
- **Muster mit eigenen Sportarten auf eine Gruppe ohne diese Sportart** — wird geladen wie gespeichert. Findet der Generator dann nichts, greift dessen bestehende Lücken-Erklärung
- **Muster gespeichert, während der Weg „Standard" gewählt ist** — der Knopf steht am Zeitverlauf; ist keiner sichtbar, gibt es den Knopf nicht
- **Muster wird gelöscht, während es in einem anderen Tab im Generator geladen ist** — der Zeitverlauf dort bleibt stehen und lässt sich generieren; „überschreiben" ist nicht mehr möglich, „Als neues Muster speichern" schon
- **Der Nutzer hat keine Gruppe** — der Generator verlangt wie bisher zuerst eine Gruppe; Muster lassen sich dann weder speichern noch laden, die Verwaltung zeigt bestehende trotzdem
- **Zwei Tabs benennen denselben Begriff gleichzeitig um** — der zweite trifft auf einen Begriff, den es unter dem alten Namen nicht mehr gibt, und erhält die Meldung aus Abschnitt J
- **Sehr viele Verwendungen** (ein Begriff in 200 Übungen) — der Dialog nennt die Zahl und zeigt die Namen in einer scrollbaren Liste, nicht abgeschnitten ohne Hinweis
- **Halle löschen, während für eine ihrer Gruppen ein Entwurf im Generator liegt** *(2026-10-14)* — der Entwurf wurde mit dem Material von damals generiert und bleibt, wie er ist; erst das nächste Generieren rechnet ohne Halle
- **Material entfernen, das nur eine Variante braucht** *(2026-10-14)* — die Grundübung bleibt einplanbar, nur die Variante fällt weg. Die Nachfrage zählt sie trotzdem mit, als „Übung oder Variante"; ob sie beides getrennt nennt, entscheidet der Entwurf
- **Material entfernen, das „Kein Material" heißt** — kann an einer Halle nicht stehen; die Hallenliste bietet es nicht an
- **„Im Generator öffnen", während der Generator in einem anderen Tab mit eigenen Änderungen offen ist** *(2026-10-14)* — die beiden Tabs sind getrennt; der neue beginnt frisch, der alte bleibt unberührt
- **Weg „Standard" gewählt, Änderungen unter „Individuell" aufgehoben, dann Gruppenwechsel** *(2026-10-15, b)* — die Änderungen kommen mit, umgerechnet, und stehen beim Zurückschalten auf „Individuell" für die neue Gruppe da. Der Weg „Standard" bleibt gewählt und zeigt den Standard der neuen Gruppe
- **Mit „Zurück zum Generator" mitgebrachter Zeitverlauf** *(2026-10-15)* — die Einheit merkt sich kein Muster, verglichen wird deshalb mit dem Standard der Gruppe. Gleicht er ihm, wird ohne Nachfrage ersetzt; sonst wird gefragt. „Stundenmuster speichern" ist aktiv, weil kein Muster geladen ist. Ein Gruppenwechsel nimmt ihn mit *(2026-10-15, b)*
- **Muster geladen, dann zurück auf Standard gesetzt** *(2026-10-15)* — danach ist kein Muster mehr geladen; verglichen wird mit dem Standard, „Stundenmuster speichern" ist wieder aktiv
- **Muster geladen, Gruppe gewechselt, auf die neue Gruppe umgerechnet** *(2026-10-15)* — verglichen wird mit dem Muster, wie es auf die neue Gruppe angewendet wurde. „Stundenmuster speichern" ist ausgegraut, solange nichts geändert ist — auch wenn umgerechnet wurde *(2026-10-16)*
- **Mehrmals hin und her gewechselt** *(2026-10-15, b)* — ein veränderter Zeitverlauf wird bei jedem Wechsel vom jeweils aktuellen Stand aus umgerechnet; über 60 → 30 → 60 Minuten können sich einzelne Minuten verschieben, weil auf ganze Minuten gerundet wird. Ein unveränderter wird jedes Mal frisch aufgebaut und verschiebt sich nicht
- **Muster gewählt, verändert, dann Gruppe, für die das Muster zu lang ist, der veränderte Stand aber passt** *(2026-10-15, b)* — der Stand kommt mit; das Muster wird abgewählt, weil es auf diese Gruppe nicht anwendbar ist, und der Weg wechselt auf „Individuell"
- **Muster in einem anderen Tab überschrieben, während es hier geladen ist** *(2026-10-15)* — verglichen wird mit dem Stand, der hier geladen wurde; der Knopf bleibt ausgegraut, bis sich hier etwas ändert. Erst beim Überschreiben von hier aus gilt wie bisher das Zuletzt-Gespeicherte

## Technical Requirements
- **Sicherheit:** Anmeldung erforderlich; jeder Lese- und Schreibweg wirkt nur auf Einträge des angemeldeten Nutzers, auf dem Server geprüft und in der Datenbank abgesichert
- **Unteilbarkeit:** Umbenennen und Zusammenführen ändern alle Verwendungen gemeinsam oder gar keine
- **Leistung:** Der Reiter „Kategorien" mit Verwendungszahlen ist bei 500 Übungen ohne spürbare Wartezeit da (Richtwert: unter einer Sekunde)
- **Breiten:** 375 px, 768 px, 1440 px
- **Keine Regression:** Die Browser-Tests von PROJ-5 sprechen die Hallenverwaltung unter ihrer bisherigen Adresse an und müssen mitziehen

## Open Questions
- [ ] **Filter der Übungsübersicht und gelöschte Begriffe.** Nach dieser Spec verschwindet ein gelöschter Begriff auch aus den Filtern — Übungen, die ihn noch tragen, lassen sich danach nicht mehr über ihn finden. Folgerichtig zu „aus allen Auswahllisten", aber beim Test im Browser anzusehen, ob es stört
- [x] **Welche Mindestlänge hat ein Segment im Zeitverlauf heute, und in welchen Schritten wird gerechnet?** — Eine Minute, ganze Minuten. Beantwortet im Tech Design (2026-10-12)
- [x] **Wie merkt sich die App einen gelöschten Begriff**, damit er beim Speichern einer Übung nicht zurückkommt? — Gar nicht: eingetragen wird künftig nur, was neu eingetippt wurde. Beantwortet im Tech Design (2026-10-12)
- [ ] **Begriffe, die in Übungen stehen, aber in keiner Auswahlliste**, sind in der Verwaltung unsichtbar und lassen sich erst nach erneutem Anlegen umbenennen. Beim Test im Browser anzusehen, ob das reicht oder ob die Verwaltung sie eigens zeigen soll
- [ ] **Gruppe ohne Halle — sagt die App das, wo es wirkt?** *(2026-10-14)* Dass der Generator ohne Halle kein Material prüft, steht nach dieser Überarbeitung nur im Löschdialog. Wer eine Gruppe von Anfang an ohne Halle anlegt, erfährt es nirgends. Vorschlag: ein Satz an der Auswahl „Keine Halle" im Gruppen-Formular. Gehört eher zu PROJ-5; hier nur notiert, nicht entschieden

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-17 (Stundenmuster) geht in PROJ-16 auf | Entscheidung des Nutzers: Stundenmuster sind wie eigene Kategorien selbst Angelegtes, und alles selbst Angelegte soll auf einer gemeinsamen Oberfläche verwaltet werden. Weicht bewusst von „ein Feature je Spec" ab; die Abschnitte der Akzeptanzkriterien sind so geschnitten, dass sich Kategorien (C–F) und Stundenmuster (G–I) getrennt bauen und prüfen lassen | 2026-10-12 |
| Die Hallen ziehen mit um; „Gruppen → Hallen" entfällt | Vom Nutzer gewählt. Ein Ort für alles selbst Angelegte ist nur dann einer, wenn die Hallen nicht daneben stehen. Der Preis ist ein Umbau an PROJ-5 mit Nachtest | 2026-10-12 |
| Kein vierter Menüpunkt; Zugang über eine Karte der Startseite und „verwalten"-Links am Ort der Benutzung | Die Kopfzeile fasst am Handy gerade drei Punkte, der Umbau der Navigation ist bis PROJ-9 zurückgestellt. Verwaltet wird selten und meist aus einem Anlass heraus — der Link steht dort, wo der Anlass entsteht. *Ab 768 px am 2026-10-14 ersetzt, siehe unten* | 2026-10-12 |
| Die Seite heißt „Verwaltung" | Passt zu den Links „… verwalten" und braucht keine Erklärung | 2026-10-12 |
| Drei Reiter: Hallen, Stundenmuster, Kategorien; die fünf Arten als Abschnitte im dritten | Drei sehr verschiedene Dinge, die bei 375 px nebeneinander passen. Sieben Reiter wären am Handy eine Auswahlliste, eine lange Seite viel Scrollen | 2026-10-12 |
| Stundenmuster gelten für alle Gruppen | Wer drei Gruppen ähnlich aufbaut, soll das Muster nicht dreimal anlegen. Beantwortet die erste offene Frage aus PROJ-6 | 2026-10-12 |
| Passt die Dauer nicht, wird anteilig umgerechnet und es wird gesagt | Sonst wäre ein übergreifendes Muster nur zwischen gleich langen Gruppen brauchbar. Das Muster selbst bleibt unverändert. Beantwortet die dritte offene Frage aus PROJ-6 | 2026-10-12 |
| Sportarten trägt ein Muster nur dort, wo bewusst von der Gruppe abgewichen wurde | „Volleyball" in jedem Segment wäre auf dem Kinderturnen falsch; „Laufspiele" im Aufwärmen ist dagegen eine Absicht und soll bleiben | 2026-10-12 |
| Ein Muster ist eine Vorlage, keine Verbindung: Einheiten merken sich ihr Muster nicht | Ein später geändertes Muster darf keine fertige Einheit verändern. Beantwortet die zweite offene Frage aus PROJ-6 | 2026-10-12 |
| Inhalt eines Musters wird nur im Generator geändert | Der Zeitverlauf-Editor braucht eine Gruppe (Dauer, Sportarten). Ein zweiter Betrieb ohne Gruppe wäre ein eigener Editor für einen seltenen Handgriff | 2026-10-12 |
| Im Generator: dritter Weg „Stundenmuster" und zusätzlich die Knöpfe „Auf Stundenmuster setzen" und „Stundenmuster speichern" am Zeitverlauf | Der dritte Weg hält „ein Klick und fertig" auch für Muster; die Knöpfe sind der Wunsch des Nutzers vom 2026-10-04 und dienen dem, der schon im Zeitverlauf steht | 2026-10-12 |
| Kategorien: anlegen, umbenennen, löschen | Vom Nutzer gewählt. Umbenennen ist der einzige Weg, einen Tippfehler in zwölf Übungen zu beheben; Anlegen erspart den Umweg über eine Übung | 2026-10-12 |
| Löschen nimmt den Begriff nur aus den Auswahllisten; bestehende Einträge behalten ihn | Alles andere risse dem Nutzer unbemerkt Angaben aus fertigen Übungen, bis hin zur einzigen Phase. Schon in PROJ-3 als Eckpunkt festgehalten | 2026-10-12 |
| Ein gelöschter Begriff kommt nicht von selbst zurück, nur durch neues Eintippen | Heute trüge ihn das nächste Speichern einer Übung wieder ein — das Löschen wäre wirkungslos, ohne dass der Nutzer verstünde, warum | 2026-10-12 |
| Gleicht der neue Name einem vorhandenen Begriff, wird nach Nachfrage zusammengeführt — auch mit vordefinierten | Der häufigste echte Fall: „Volleybal" neben „Volleyball". Ablehnen ließe den Nutzer mit der Handarbeit allein; ohne Nachfrage wäre ein nicht umkehrbarer Schritt zu leicht | 2026-10-12 |
| Kein Löschkreuz direkt in den Auswahllisten, stattdessen der Link „Kategorien verwalten" | Aus PROJ-3 übernommen: in der Liste fehlt der Überblick über die Verwendungen, und ein Fehlklick wäre zu leicht | 2026-10-12 |
| Vordefinierte Begriffe stehen nicht in der Verwaltung | Sie sind nicht änderbar; als Einträge ohne Aktion würden sie die eigenen verdecken. Ein Satz im Erklärtext genügt | 2026-10-12 |
| Durchführungen bleiben beim Umbenennen unverändert | Sie halten fest, was war. Vom Nutzer mit dem Entwurf abgenommen | 2026-10-12 |
| Namen von Mustern höchstens 60 Zeichen, eindeutig ohne Rücksicht auf Groß-/Kleinschreibung | Die Auswahlliste im Generator muss am Handy lesbar bleiben. Vom Nutzer mit dem Entwurf abgenommen | 2026-10-12 |
| Höchstens 100 Stundenmuster | Vom Nutzer festgelegt; der Entwurf hatte 50 vorgeschlagen | 2026-10-12 |
| Jeder Reiter trägt einen Erklärtext | Die App soll zeigen, wie man sie richtig benutzt: wo die Einträge entstehen und wo sie wirken | 2026-10-12 |
| „Verwaltung" als vierter Menüpunkt ab 768 px; am Handy bleibt es bei drei | Wunsch des Nutzers nach der Durchsicht: am Rechner ist Platz, und die Verwaltung soll dort ohne Umweg über die Startseite erreichbar sein. Die Grenze 768 px ist dieselbe, ab der die Wortmarke im Logo erscheint. Ersetzt für breite Bildschirme die Entscheidung „kein vierter Menüpunkt" vom 2026-10-12; der Umbau der Handy-Navigation bleibt bei PROJ-9 | 2026-10-14 |
| Halle löschen: der Dialog erklärt die Folgen, hängt aber nichts um | Vom Nutzer gewählt (statt „andere Halle wählen" oder „Löschen sperren"). Die versteckte Folge war, dass der Generator für Gruppen ohne Halle das Material gar nicht mehr prüft — das muss gesagt werden; das Umhängen gehört ins Gruppenprofil | 2026-10-14 |
| Material, das aus einer Halle wegfällt oder weniger wird, wird beim Speichern nachgefragt — nur wenn Gruppen an der Halle hängen | Vom Nutzer gewählt. Bisher ohne jeden Hinweis: danach plant der Generator Übungen mit diesem Material für alle Gruppen der Halle nicht mehr ein. Die Nachfrage nennt Gruppen und Zahl der Übungen; ohne Gruppen oder beim Hinzufügen bleibt es still, damit sie nicht zur Gewohnheitsbestätigung wird | 2026-10-14 |
| Einen Materialbegriff in der Verwaltung zu löschen bleibt ohne Folgen für den Generator | Am Code nachgesehen: Übungen und Hallen behalten das Material, der Generator vergleicht weiter über den Namen. Die Frage des Nutzers „ist das abgesichert?" ist damit beantwortet; der Löschdialog sagt es künftig ausdrücklich | 2026-10-14 |
| Ein „Kategorien verwalten"-Link je Bildschirm, unter dem letzten Kategorie-Feld | Vom Nutzer gewählt. Fünf gleiche Links im Schritt „Einordnung" und einer je Segment im Generator wirkten wie Lärm; der Link ist ein seltener Weg und braucht einen festen Platz, nicht jede Gelegenheit. Ersetzt die Abweichung aus dem Frontend („ein Link pro Formular-Abschnitt") | 2026-10-14 |
| „Im Generator öffnen" am Stundenmuster, Gruppe danach wählen | Wunsch des Nutzers; kehrt die Entscheidung vom 2026-10-12 um, diesen Knopf nicht zu bauen. Das Muster ist vorgewählt und wird beim Wählen der Gruppe angewendet — der Weg „Muster zuerst, dann Gruppe" ist der, aus dem der Nutzer in der Verwaltung kommt | 2026-10-14 |
| „Auf Standard zurücksetzen" fragt nach, wenn der Zeitverlauf von Hand verändert ist — wie „Auf Stundenmuster setzen" | Rückmeldung des Nutzers nach dem Durchspielen: zwei gleich aussehende Knöpfe nebeneinander, der eine fragt, der andere verwirft still und meldet es erst danach | 2026-10-15 |
| Der Weg „Standard" oben fragt nicht nach | Vom Nutzer gewählt. Beim Umschalten geht nichts verloren — die Änderungen stehen unter „Individuell" wieder da. Eine Nachfrage dort würde einen Verlust behaupten, den es nicht gibt | 2026-10-15 |
| Der Gruppenwechsel nimmt den aktuellen Zeitverlauf mit, umgerechnet wie ein Muster, ohne Nachfrage; gefragt wird nur, wenn er nicht passt | Rückfrage des Nutzers am selben Tag: der Stand des Generators soll ausdrücklich auf eine andere Gruppe übertragbar sein, auch ungespeichert. Das Verwerfen stammt aus PROJ-6, als es noch kein Umrechnen gab; seit den Stundenmustern gibt es das Werkzeug. Gleichzeitig war es uneinheitlich: mit gewähltem Muster — auch nach dem Wechsel auf „Individuell" — wurde das Muster frisch angewendet, ohne Muster neu aufgebaut. Still mitnehmen mit Hinweis statt Nachfrage (vom Nutzer gewählt), weil nichts verloren geht; wer frisch anfangen will, hat „Auf Standard zurücksetzen". Bei „zu kurz" nachfragen statt ablehnen (vom Nutzer gewählt). **Ersetzt die folgende Entscheidung** | 2026-10-15 |
| ~~Auch der Gruppenwechsel ohne Muster fragt nach, wenn der Zeitverlauf von Hand verändert ist~~ | Vom Nutzer gewählt, beim Durchsehen am Code aufgefallen: bisher fragte der Wechsel nur bei geladenem Muster. Damit gilt überall dieselbe Regel — wer Handarbeit wegwirft, wird vorher gefragt. Erweitert das Verhalten aus PROJ-6 | 2026-10-15 |
| „Stundenmuster speichern" ist ausgegraut, solange der Zeitverlauf genau dem geladenen Muster entspricht; ein umgerechnetes Muster gilt als abweichend | Wunsch des Nutzers; Speichern ohne Unterschied legt nur ein Doppel an oder überschreibt mit demselben. Das umgerechnete Muster bleibt speicherbar (vom Nutzer gewählt), weil die Fassung für die andere Dauer ein echter neuer Stand ist. Der Grund steht unter dem Knopf, wie beim Hinweis zu den Minuten. *Der Teil „umgerechnet bleibt speicherbar" ist am 2026-10-16 ersetzt, siehe unten* | 2026-10-15 |
| Auch ein nur umgerechnetes Muster graut „Stundenmuster speichern" aus | Rückmeldung des Nutzers beim Ausprobieren: Muster gewählt, nichts geändert, und der Knopf bot Speichern an — das wirkte wie ein Fehler. Dazu konnte „überschreiben" dabei still die Dauer des gespeicherten Musters ändern. Die umgerechnete Fassung als eigenes Muster bleibt möglich, sobald etwas geändert wird; der Hinweis unter dem Knopf nennt die Umrechnung. Vom Nutzer gewählt | 2026-10-16 |
| „Verändert" heißt: anderer Inhalt — nicht „angefasst" | Vom Nutzer gewählt. Ein Begriff für Knopf und Nachfragen; sonst bliebe der Knopf nach einer zurückgenommenen Änderung aktiv und die App fragte nach, obwohl nichts verloren geht | 2026-10-15 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Eingetragen wird nur, was im Formular neu eingetippt wurde; Löschen ist echtes Löschen ohne Markierung | Behebt die Ursache statt ihr eine Merkliste nachzuführen. Drei Randfälle (Zurück zum Generator, Muster, Schnell-Anlegen) fallen ohne eigene Regel ab | 2026-10-12 |
| Die Auswahlliste eines Formulars zeigt zusätzlich, was der Eintrag selbst schon trägt | Ein gelöschter Begriff bleibt an seiner Übung sichtbar, ohne anderswo aufzutauchen | 2026-10-12 |
| Umbenennen und Zusammenführen als eine Datenbank-Funktion | Bis zu neun Stellen; ein Abbruch in der Mitte ließe alte und neue Namen nebeneinander stehen | 2026-10-12 |
| Zählen und Verwendungen-Nennen als Datenbank-Funktionen, das Nennen erst auf Anforderung | Die Begriffe stehen in Listenfeldern über sechs Tabellen; ein Aufruf statt vieler. Namen werden nur für den einen Begriff gebraucht, den der Nutzer öffnet | 2026-10-12 |
| Vordefinierte Begriffe prüft der Server, eigene die Datenbank | Die mitgelieferten Listen stehen im Programm, nicht in der Datenbank | 2026-10-12 |
| Stundenmuster: eine Tabelle, die Segmente als Liste in einem Feld | Wird immer als Ganzes gelesen und überschrieben; Überschreiben ist damit von selbst unteilbar, ein Satz Zugriffsregeln genügt | 2026-10-12 |
| Einheit ohne Verweis auf ihr Muster; nach „Zurück zum Generator" steht der Zeitverlauf unter „Individuell" | Setzt „Vorlage, keine Verbindung" durch, statt es nur zu behaupten. Kein neues Feld an der Einheit | 2026-10-12 |
| Muster anwenden und speichern als reine Umformungen neben den Zeitverlauf-Bausteinen; Umrechnen über den vorhandenen Baustein | Ohne Oberfläche und Datenbank prüfbar, wie beim Editor. Das Umrechnen gibt es seit PROJ-6 | 2026-10-12 |
| Phasen höchstens 60 Zeichen, die übrigen Arten 100 | Das Segment einer Einheit fasst nur 60; eine längere Phase ließe sich nicht mehr einplanen | 2026-10-12 |
| Kein Recht „ändern" an der Kategorientabelle | Umbenennen läuft ausschließlich über die Funktion; ein direkter Weg könnte die Verwendungen zurücklassen | 2026-10-12 |
| Der Reiter steht in der Adresse | Neuladen, Weitergeben und „verwalten"-Links ohne eigenen Merkmechanismus | 2026-10-12 |
| „Verwalten"-Links aus Formularen öffnen einen neuen Tab; das Formular holt seine Listen beim Zurückkommen frisch | Keine Eingabe kann verloren gehen, keine Nachfrage nötig | 2026-10-12 |
| Hallenliste zieht unverändert um, alte Adresse leitet weiter | Ausgeliefert und getestet; nur der Ort ändert sich | 2026-10-12 |
| Eine Migration, rein hinzufügend; keine neuen Pakete | An bestehenden Tabellen ändert sich kein Feld | 2026-10-12 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Stand:** 2026-10-12

### Der tragende Gedanke

Zwei Regeln tragen das Feature, und beide sind einfacher als das, was sie ersetzen:

1. **In die Auswahllisten kommt nur, was der Nutzer eingetippt hat.** Heute trägt jedes Speichern
   einer Übung, Gruppe, Halle oder Einheit alles ein, was nicht vordefiniert ist — egal, ob es neu
   ist oder schon seit Wochen dort steht. Künftig meldet das Formular nur die Begriffe, die in
   *diesem* Formular neu eingetippt wurden. Damit ist „Löschen" ein echtes Löschen ohne
   Merkliste: Ein gelöschter Begriff, der noch in einer Übung steht, wird beim Speichern nicht
   gemeldet und kommt deshalb nicht zurück. Tippt der Nutzer ihn neu, ist er wieder da
2. **Umbenennen ist eine einzige, nicht teilbare Datenbank-Operation.** Ein Begriff steht als Text
   an bis zu neun Stellen. Eine Datenbank-Funktion ändert alle gemeinsam oder keine — dasselbe
   Vorgehen wie beim Speichern im Editor (PROJ-7)

Stundenmuster sind dagegen fast reine Rechnung im Browser: Ein Muster in einen Zeitverlauf
verwandeln und umgekehrt sind zwei Umformungen ohne Oberfläche und ohne Datenbank, prüfbar wie die
Bausteine des Editors. Das Umrechnen auf eine andere Dauer **gibt es schon** — der Generator
benutzt es heute beim Gruppenwechsel.

### A) Aufbau der Oberfläche

```
Startseite
+-- Karte „Verwaltung" (neu, vierte Karte)

Seite „Verwaltung"  (eine Adresse, der Reiter steht in der Adresse)
+-- Reiterleiste: Hallen | Stundenmuster | Kategorien
+-- Reiter „Hallen"
|   +-- Erklärtext
|   +-- Hallenliste  (die bestehende, unverändert übernommen)
|       +-- Dialog „Halle anlegen / bearbeiten"  (bestehend)
|       +-- Löschen mit Warnung zu Gruppen       (bestehend)
+-- Reiter „Stundenmuster"
|   +-- Erklärtext
|   +-- Musterliste
|   |   +-- Musterzeile: Name, Dauer, Kurzfassung des Aufbaus, Menü
|   |       +-- Dialog „Umbenennen"
|   |       +-- Nachfrage „Löschen"
|   +-- Leerzustand mit Knopf zum Generator
+-- Reiter „Kategorien"
    +-- Erklärtext
    +-- Abschnitt je Art (5×): Sportarten, Altersgruppen, Phasen, Organisationsformen, Material
        +-- Knopf „Anlegen" -> Dialog „Begriff anlegen"
        +-- Begriffszeile: Name, Verwendungszahlen oder „unbenutzt", Menü
        |   +-- Dialog „Verwendungen ansehen"
        |   +-- Dialog „Umbenennen" -> bei Namensgleichheit Nachfrage „Zusammenführen"
        |   +-- Dialog „Löschen" (nennt Verwendungen, bietet „Stattdessen umbenennen")
        +-- Leerzustand des Abschnitts

Generator  (bestehend, erweitert)
+-- Schritt 2 „Wie soll die Einheit aufgebaut sein?"
|   +-- Standard
|   +-- Stundenmuster  (neu)
|   |   +-- Auswahlliste der Muster, Link „Stundenmuster verwalten"
|   |   +-- ohne Muster: Erklärsatz, nicht wählbar
|   +-- Individuell
+-- Zeitverlauf
    +-- Hinweis „Muster von x auf y Minuten umgerechnet"  (neu)
    +-- Knopf „Auf Standard zurücksetzen"                 (bestehend)
    +-- Knopf „Auf Stundenmuster setzen"                  (neu, dieselbe Auswahlliste)
    +-- Knopf „Stundenmuster speichern"                   (neu)
        +-- Dialog: Name; bei geladenem Muster „überschreiben" oder „als neues"
    +-- Nachfrage „Bisherigen Zeitverlauf ersetzen?"      (neu)

Bestehende Formulare  (kleine Eingriffe)
+-- Übungs-Formular, Gruppen-Formular, Hallen-Dialog, Schnell-Anlegen, Phasenauswahl
    +-- Link „Kategorien verwalten" bzw. „Hallen verwalten"
    +-- melden beim Speichern nur neu Eingetipptes
+-- Gruppenübersicht: „Hallen verwalten" zeigt auf die neue Seite
+-- Alte Adresse der Hallenverwaltung leitet weiter
```

Alle Reiter, Dialoge, Menüs und Listen bestehen aus Bausteinen, die schon im Projekt liegen. Neu
gebaut wird nur die Zusammenstellung.

### B) Daten

**Eigene Kategorien — die bestehende Tabelle, unverändert.** Jeder Eintrag hat Art, Name und
Besitzer. Es kommt kein Feld dazu; insbesondere keine Markierung „gelöscht".

**Stundenmuster — eine neue Tabelle, ein Eintrag je Muster:**

```
Jedes Stundenmuster hat:
- Kennung und Besitzer
- Name (1–60 Zeichen, je Nutzer eindeutig ohne Rücksicht auf Groß-/Kleinschreibung)
- Gesamtdauer in Minuten, bei der es gespeichert wurde
- Die Segmente als eine geordnete Liste in einem Feld. Je Segment:
    - Phase
    - Minuten
    - generieren oder frei lassen
    - Schwierigkeiten
    - Organisationsformen
    - Arbeitsnotiz der Phase
    - Sportarten und Hauptsportart — oder der Vermerk „wie die Gruppe"
- Angelegt am, zuletzt geändert am

Gespeichert in: der Datenbank, nur für den Besitzer sichtbar und änderbar
```

Eine Einheit bekommt **kein** Feld, das auf ihr Muster zeigt.

**Wo ein Begriff überall steht** — das ist die Liste, die Zählen und Umbenennen abarbeiten:

| Stelle | Sportart | Altersgruppe | Phase | Organisationsform | Material |
|---|---|---|---|---|---|
| Übung | ja | ja | ja | ja | ja |
| Variante einer Übung | — | ja | — | ja | ja |
| Gruppe | ja, auch Hauptsportart | ja | — | — | — |
| Halle | — | — | — | — | ja |
| Segment einer Einheit (gespeichert und Entwurf) | ja, auch Hauptsportart | — | ja | ja | — |
| Stundenmuster | ja, auch Hauptsportart | — | ja | ja | — |
| Durchführung (PROJ-14) | — | — | steht dort als Abschrift, **wird nie angefasst** | — | — |

Drei neue Datenbank-Funktionen arbeiten auf dieser Liste:

- **Zählen** — liefert für alle eigenen Begriffe des Nutzers auf einmal, wie oft jeder in Übungen,
  Gruppen, Hallen, Einheiten und Mustern steht. Ein Aufruf beim Öffnen des Reiters
- **Verwendungen nennen** — liefert für *einen* Begriff die Namen der betroffenen Einträge. Wird
  erst geholt, wenn der Nutzer „Verwendungen ansehen" oder „Löschen" öffnet
- **Umbenennen / Zusammenführen** — ändert den Begriff an allen Stellen und in der Kategorienliste
  in einem Zug und meldet zurück, wie viele Einträge mitgezogen sind. Beim Zusammenführen räumt
  sie Doppeltes auf (ein Begriff zweimal an einer Übung; zwei Materialzeilen mit demselben Namen)

Anlegen und Löschen einer Kategorie sowie alles an den Stundenmustern sind gewöhnliche Schreibwege
auf je einer Tabelle und brauchen keine Funktion.

### C) Entscheidungen und ihre Gründe

**Löschen ohne Merkliste.** Die naheliegende Lösung wäre, gelöschte Begriffe zu markieren und
beim Speichern zu überspringen. Dann müsste aber jede Stelle, die Begriffe einträgt, die Markierung
kennen, und „neu eintippen" müsste sie wieder aufheben — eine Regel, die dem Löschen hinterherläuft.
Stattdessen wird die Ursache behoben: Die vier Stellen, die heute pauschal eintragen (Übung, Gruppe,
Halle, Generator), tragen nur noch ein, was das Formular als neu eingetippt meldet. Das beantwortet
die offene Frage der Spec, und es erfüllt nebenbei drei Randfälle ohne eigene Regel: „Zurück zum
Generator" mit gelöschter Phase, ein Muster mit gelöschter Phase, und „Schnell anlegen" mit
vorbelegter Organisationsform — in keinem der drei wird etwas eingetippt.

**Die Auswahlliste eines Formulars = vordefiniert + eigene + was der Eintrag schon trägt.** So
bleibt ein gelöschter Begriff an seiner Übung sichtbar und ausgewählt, ohne in anderen Formularen
aufzutauchen. Die Mehrfachauswahl verhält sich schon heute so; für Material und Phase wird es
nachgezogen.

**Umbenennen in der Datenbank statt in der Anwendung.** Die Anwendung müsste bis zu neun Stellen
nacheinander ändern; bricht die Verbindung in der Mitte, trüge ein Teil der Übungen den alten und
ein Teil den neuen Namen — genau der Zustand, den das Feature beseitigen soll. In der Datenbank
gilt alles oder nichts.

**Vordefinierte Begriffe prüft die Serverschicht, eigene die Datenbank.** Die mitgelieferten Listen
stehen im Programm, nicht in der Datenbank. Ob ein neuer Name einem vordefinierten gleicht,
entscheidet deshalb der Server vor dem Aufruf; ob er einem eigenen gleicht, die Funktion selbst.

**Stundenmuster als ein Eintrag mit einer Liste darin, nicht als zwei Tabellen.** Ein Muster wird
immer als Ganzes gelesen und als Ganzes überschrieben, nie segmentweise. Ein Eintrag macht das
Überschreiben von selbst unteilbar und braucht nur einen Satz Zugriffsregeln. Der Preis: Die
Umbenennen-Funktion muss in diese Liste hineinsehen. Das ist ein Abschnitt mehr in einer Funktion,
die ohnehin gebaut wird.

**Muster anwenden und speichern als zwei reine Umformungen.** „Zeitverlauf + Gruppe → Muster" und
„Muster + Gruppe → Zeitverlauf" liegen neben den bestehenden Zeitverlauf-Bausteinen und werden
ohne Oberfläche getestet. Das Umrechnen auf eine andere Dauer übernimmt der vorhandene Baustein
unverändert.

**Mindestlänge und Schrittweite (offene Frage der Spec):** Der Zeitverlauf rechnet in ganzen
Minuten, ein Segment ist mindestens **eine Minute** lang. Ein Muster lässt sich also nur dann nicht
anwenden, wenn es mehr Segmente hat als die Gruppe Minuten — bei der kürzesten erlaubten Einheit
(5 Minuten) ab dem sechsten Segment.

**Nach „Zurück zum Generator" steht der Zeitverlauf unter „Individuell".** Die Einheit merkt sich
ihren Zeitverlauf, nicht ihr Muster — das ist die Produktentscheidung „keine Verbindung". Der
Zeitverlauf steht deshalb genau so da, wie er verlassen wurde, aber der Weg „Stundenmuster" ist
nicht vorgewählt, und „Stundenmuster speichern" bietet kein „überschreiben" an. Wer denselben Namen
eingibt, wird wie immer gefragt.

**Der Reiter steht in der Adresse.** Damit funktionieren Neuladen, Weitergeben und jeder
„verwalten"-Link ohne eigenen Merkmechanismus; ein Link kann zusätzlich den Abschnitt einer Art
ansteuern.

**„Verwalten"-Links aus einem Formular öffnen einen neuen Tab.** Das Formular bleibt, wie es ist —
nichts kann verloren gehen, und es braucht keine Nachfrage. Kehrt der Nutzer zurück, holt das
Formular seine Auswahllisten frisch, ohne die Eingaben anzufassen. Links von Seiten ohne Eingaben
(Startseite, Gruppenübersicht) wechseln gewöhnlich die Seite.

**Die Hallenliste zieht um, wie sie ist.** Dieselben Bausteine, dieselben Serverwege, nur an
neuer Adresse. Die alte Adresse leitet weiter, damit Lesezeichen halten.

**Zugriffsschutz.** Die neue Tabelle bekommt vier Regeln nur für den Besitzer (lesen, anlegen,
ändern, löschen). Die bestehende Kategorientabelle hat lesen, anlegen und löschen; **ändern kommt
nicht dazu**, weil Umbenennen ausschließlich über die Funktion läuft. Die drei Funktionen prüfen
den angemeldeten Nutzer selbst, sind für nicht Angemeldete gesperrt und folgen der Härtung aus
PROJ-6. *Neue Zugriffsregeln brauchen laut Projektregel die ausdrückliche Zustimmung des Nutzers —
sie wird in `/backend` mit dem fertigen Text der Migration eingeholt.*

### D) Was dabei aufgefallen ist

- **Phasen dürfen höchstens 60 Zeichen haben, nicht 100.** Die Kategorientabelle erlaubt 100, das
  Segment einer Einheit nur 60. Eine auf 80 Zeichen umbenannte Phase ließe sich in keine Einheit
  mehr schreiben. Anlegen und Umbenennen begrenzen Phasen deshalb auf 60; für die anderen vier
  Arten bleibt es bei 100. Die beiden Akzeptanzkriterien zur Länge sind entsprechend zu lesen
- **Hallen haben eine eigene vordefinierte Materialliste**, getrennt von der der Übungen. Ein
  eigener Materialbegriff gilt trotzdem für beide — so ist es heute, und so bleibt es. Beim
  Zusammenführen mit einem vordefinierten Begriff gelten beide Listen als „vorhanden"
- **Umbenennen setzt den Änderungsstempel der betroffenen Übungen und Einheiten neu.** Folge: Die
  Sortierung „zuletzt geändert" verschiebt sich, und ein Editor, der dieselbe Einheit in einem
  anderen Tab offen hat, meldet beim Speichern „inzwischen geändert". Das zweite ist richtig so;
  das erste wird hingenommen
- **Eine laufende Stunde im Live-Modus** arbeitet auf ihrer Akte auf dem Gerät und sieht ein
  Umbenennen nicht — sie zeigt bis zum Ende den alten Namen. Gewollt

### E) Reihenfolge beim Bauen

Das Feature besteht aus drei Teilen, die sich einzeln fertigstellen und prüfen lassen:

1. **Seite „Verwaltung" mit dem Reiter „Hallen"** — Umzug, Weiterleitung, Karte der Startseite.
   Braucht keine Datenbank-Änderung; die Browser-Tests von PROJ-5 ziehen mit
2. **Stundenmuster** — erst die beiden Umformungen mit Tests, dann Generator und Reiter. Die
   Oberfläche lässt sich vor der Migration nur mit Beispieldaten ansehen
3. **Kategorien** — Reiter, Dialoge und die Umstellung der vier Eintragestellen. Anlegen und
   Löschen gehen sofort, Zählen und Umbenennen erst mit der Migration

**Eine Migration**, rein hinzufügend: die Tabelle der Stundenmuster mit ihren Zugriffsregeln und
die drei Funktionen. An bestehenden Tabellen ändert sich kein Feld. Angewendet über den SQL-Editor
des Dashboards.

### F) Pakete

**Keine neuen Pakete.**

### G) Was der Entwurf nicht beantwortet

- Ob die Umbenennen-Funktion bei einem Nutzer mit sehr vielen Übungen spürbar dauert, zeigt erst
  der Nachweis am lebenden System. Bei heutigen Mengen ist es ohne Belang
- Begriffe, die in Übungen stehen, aber in keiner Auswahlliste (aus der Zeit der Testdaten oder
  nach einem Löschen), sind in der Verwaltung unsichtbar. Wer so einen Begriff umbenennen will,
  legt ihn erst neu an — die Verwendungen zählen dann sofort mit. Ob das im Alltag reicht, zeigt
  der Test im Browser

## Implementation Notes (Frontend)

**Stand:** 2026-10-12. **570 Unit-Tests grün** (529 plus 41 neue), Typprüfung, Lint und
Produktionsbuild sauber. **Im Browser nicht angesehen** — alles liegt hinter der Anmeldung. Die
Browser-Tests sind nicht gelaufen.

### Was gebaut ist

**Logik ohne Oberfläche, mit Tests**

- `src/lib/units/patterns.ts` — die beiden Umformungen der Stundenmuster: Zeitverlauf → Muster
  (`toPatternSegments`, merkt sich „wie die Gruppe") und Muster → Zeitverlauf (`applyPattern`,
  rechnet über den vorhandenen Baustein `rescaleSegments` um und lehnt ab, wenn die Gruppe weniger
  Minuten als das Muster Segmente hat). Dazu Kurzfassung, Auswahlzeile, Namensprüfung. 25 Tests
- `src/lib/manage/categories.ts` — Arten, Beschriftungen, Namensgrenzen (Phase 60, sonst 100),
  Namensgleichheit gegen vordefinierte und eigene Begriffe, Verwendungszeile. 16 Tests
- `src/lib/manage/tabs.ts` — die drei Reiter und ihre Adressen

**Seite „Verwaltung"** unter `/manage`, der Reiter steht als `?tab=venues|patterns|categories` in
der Adresse, ein Abschnitt der Kategorien als Sprungmarke dahinter.

- `src/app/(protected)/manage/page.tsx` und `loading.tsx` — der Server lädt nur den gewählten Reiter
- `src/components/manage/manage-tabs.tsx` — Reiterleiste
- `src/components/manage/pattern-list.tsx` — Liste, Umbenennen, Löschen, Leerzustand
- `src/components/manage/category-manager.tsx` — fünf Abschnitte, Anlegen, Verwendungen ansehen,
  Umbenennen mit Nachfrage zum Zusammenführen, Löschen mit „Stattdessen umbenennen"
- `src/components/manage/manage-link.tsx` — der „verwalten"-Link aus Formularen: neuer Tab, und
  beim Zurückkommen holt die Seite ihre Listen frisch
- **Hallen:** `venue-list.tsx` ist unverändert übernommen, nur der Kopf (Zurück-Link, Überschrift)
  ist dem Erklärtext gewichen. `/groups/venues` leitet weiter
- Startseite: vierte Karte „Verwaltung"; die Karte „Gruppenprofile" nennt die Hallen nicht mehr

**Generator** (`unit-config-form.tsx`, `save-pattern-dialog.tsx`)

- Dritter Weg „Stundenmuster" mit Auswahlliste; ohne Muster nicht wählbar und mit Erklärsatz
- Am Zeitverlauf „Auf Stundenmuster setzen" (dieselbe Liste als Menü) und „Stundenmuster speichern"
- Hinweis „Muster von x auf y Minuten umgerechnet"
- Nachfrage „Bisherigen Zeitverlauf ersetzen?" — nur wenn von Hand geändert wurde
- Gruppenwechsel bei geladenem Muster wendet es frisch an; passt es nicht, fällt die Maske mit
  Begründung auf „Standard" zurück
- Die Phasenauswahl meldet neu eingetippte Phasen; `generateUnit` trägt nur noch diese ein

**Serverwege, schon angeschlossen**

- `src/lib/actions/patterns.ts` — lesen, speichern/überschreiben, umbenennen, löschen, gegen die
  Tabelle `unit_patterns`. Die Tabelle steht in `database.types.ts`, **existiert aber noch nicht**:
  bis zur Migration liefert das Lesen eine leere Liste und das Speichern eine Fehlermeldung
- `src/lib/actions/categories.ts` — lesen, anlegen, löschen arbeiten auf der bestehenden Tabelle
  und **funktionieren sofort**

### Was erst mit `/backend` trägt

1. **Stundenmuster überhaupt** — ohne die Tabelle ist der dritte Weg im Generator nicht wählbar und
   der Reiter zeigt den Leerzustand. „Stundenmuster speichern" meldet einen Fehler
2. **Verwendungszahlen** — `getManagedCategories` liefert noch keine; die Zeilen zeigen deshalb
   weder Zahl noch „unbenutzt"
3. **Verwendungen nennen** — `getCategoryUsages` liefert noch nichts; die Dialoge sagen „lassen
   sich gerade nicht auflisten"
4. **Umbenennen und Zusammenführen** — `renameCategory` prüft Form und Namensgleichheit und fragt
   nach, ändert dann aber bewusst nichts: nur die Zeile der Kategorie umzubenennen ließe die
   Übungen mit dem alten Namen zurück
5. **„Gelöschtes kommt nicht zurück" für Übung, Gruppe und Halle** — für den Generator ist es
   gebaut. Die drei anderen Stellen tragen beim Speichern weiter alles Nicht-Vordefinierte ein;
   **ein dort gelöschter, aber noch benutzter Begriff kehrt bis dahin beim nächsten Speichern
   zurück**

### Abweichungen vom Entwurf

- **Wer meldet das neu Eingetippte?** Der Entwurf sah vor, dass jedes Formular es meldet. Für den
  Generator ist das so gebaut. Für Übung, Gruppe und Halle genügt ein Vergleich auf dem Server:
  neu ist, was der Eintrag vor dem Speichern nicht trug. Das spart den Umbau von acht Bausteinen
  und kommt in `/backend`
- **Die Adresse ist `/manage`**, passend zu den übrigen (`/exercises`, `/groups`, `/units`)
- **„Kategorien verwalten" steht nicht an jeder Auswahlliste:** an den vier Listen und am Material
  des Übungs-Formulars, an Sportart und Altersgruppe der Gruppe und an der Phase im Generator.
  Nicht an den Listen der Varianten und nicht am Material im Hallen-Dialog — dieselben Begriffe,
  ein Link pro Formular-Abschnitt reicht
- **Anführungszeichen:** die neuen Texte schließen mit dem deutschen „…“ statt mit dem geraden
  Zeichen; die Lint-Regel verlangt es in Fließtext

### Tests angepasst

`tests/PROJ-5-gruppenprofile.spec.ts`: die Hallenseite wird über die Weiterleitung und den Reiter
geprüft; der Test zum Zurück-Link „Alle Gruppen" ist durch einen zu den drei Reitern ersetzt.
**Nicht ausgeführt.**

## Implementation Notes (Backend)

**Stand:** 2026-10-13. **578 Unit-Tests grün** (570 plus 8 neue), Typprüfung, Lint und
Produktionsbuild sauber. **Die Migration ist angewendet** — vom Nutzer am 2026-10-13 freigegeben
(neue Zugriffsregeln) und im SQL-Editor des Dashboards ausgeführt, **Register 18 zu 18**, am
lebenden System in einer zurückgerollten Transaktion nachgewiesen (siehe unten).

Der erste Versuch scheiterte an einem Syntaxfehler: ein ungeklammertes `CASE … THEN` in einer
`IF`-Bedingung, dessen `THEN` plpgsql für das Ende der Bedingung hält. Es blieb nichts zurück; die
Datei im Repository ist die berichtigte Fassung.

### Migration `20261013090000_unit_patterns_and_category_management.sql`

Rein hinzufügend; an bestehenden Tabellen ändert sich kein Feld und keine Zugriffsregel.

- **Tabelle `unit_patterns`** — Name 1–60 Zeichen, Gesamtdauer 5–300, die Segmente als Liste in
  einem Feld. Je Nutzer eindeutig ohne Rücksicht auf Groß-/Kleinschreibung, **in der Datenbank
  erzwungen** (eindeutiger Index auf `user_id, lower(name)`). Vier Zugriffsregeln nur für den
  Besitzer, Änderungsstempel über den vorhandenen Auslöser
- **`category_usages(art, name)`** — nennt die Einträge, an denen ein Begriff steht
- **`category_usage_counts()`** — die Zahlen für alle eigenen Begriffe in einem Aufruf
- **`rename_category(kennung, neuer_name, zusammenführen, vordefiniert)`** — alle Stellen und die
  Kategorienliste in einem Zug; meldet Name, „zusammengeführt" und die Zahl der Einträge zurück
- **`category_replace_in_list`** — Hilfsfunktion: ersetzt einen Begriff in einer Liste, ohne
  Doppeltes zu hinterlassen. Eine vierte Funktion neben den drei des Entwurfs; sie erspart
  denselben Ausdruck an neun Stellen

Alle Funktionen laufen mit den Rechten des Aufrufers, filtern zusätzlich selbst auf den
angemeldeten Nutzer, haben einen festen Suchpfad und sind für nicht Angemeldete gesperrt.

### Entscheidungen beim Bauen

- **Umbenennen ohne Recht „ändern":** die Kategorientabelle bekommt weiterhin keine
  Zugriffsregel fürs Ändern. Die Funktion löscht die Zeile und legt sie unter **derselben Kennung**
  neu an — beides erlauben die bestehenden Regeln
- **Doppeltes wird immer aufgeräumt**, nicht nur beim Zusammenführen: der neue Name kann an einer
  Übung schon stehen, ohne in der Kategorienliste zu sein (ein früher gelöschter Begriff)
- **Verglichen wird genau**, mit Groß-/Kleinschreibung: „Reifen" und „reifen" sind zwei Begriffe
  und werden getrennt gezählt und umbenannt
- **Gezählt und genannt werden nur gespeicherte Einheiten**; umbenannt wird auch im Entwurf des
  Generators
- **Die Lücken-Erklärung eines Segments** trägt die Phase als Abschrift und wird mit umbenannt —
  sonst riete der Hinweis „Lege Übungen der Phase … an" zum alten Namen. Der Entwurf nannte diese
  Stelle nicht
- **Änderungsstempel:** betroffene Übungen (auch wenn der Begriff nur an Variante oder Material
  stand) und betroffene Einheiten bekommen einen neuen; Hallen nicht
- **Zwei gleichzeitige Umbenennungen** desselben Nutzers laufen nacheinander (Sperre je Nutzer für
  die Dauer des Aufrufs)
- **Die Grenze von 100 Stundenmustern** prüft nur der Server, nicht die Datenbank

### Serverwege

- `src/lib/actions/categories.ts` — `getManagedCategories` holt die Zahlen mit; scheitert die
  Zählung, zeigt die Oberfläche keine Zahl statt einer falschen Null. `getCategoryUsages` und
  `renameCategory` sind angeschlossen. Vergibt ein anderer Tab den Namen zwischen Prüfung und
  Aufruf, kommt die Nachfrage zum Zusammenführen statt eines Fehlers
- **„Gelöschtes kommt nicht zurück" für Übung, Gruppe und Halle** (`exercises.ts`, `groups.ts`):
  vor dem Überschreiben wird gelesen, was der Eintrag trägt; eingetragen wird nur, was neu
  dazukommt (`newlyAddedCustom` in `src/lib/manage/categories.ts`, mit Tests). Lässt sich der Stand
  davor nicht lesen, wird **nichts** eingetragen statt alles
- `src/lib/actions/patterns.ts` — unverändert; trägt, sobald die Tabelle existiert

### Nachweis am lebenden System

Sechzehn Fälle in einer zurückgerollten Transaktion unter der Rolle `authenticated`, alle wie
erwartet, nichts zurückgeblieben; `get_advisors` meldet weiter nur den bekannten Hinweis zum
Passwortschutz.

1. Zählen: Übung zählt einmal, auch nur über die Variante; der Entwurf zählt nicht; Unbenutztes
   kommt mit Nullen
2. Verwendungen nennen, nach Sorte
3. Phase umbenennen: Übung, Segmente (gespeichert und Entwurf), Lücken-Erklärung, Muster,
   Kategorienliste unter derselben Kennung; Leerzeichen am Rand entfernt
4. Vergebener Name ohne Zusammenführen: abgewiesen, nichts geändert
5. Zusammenführen mit eigenem Begriff: dessen Schreibweise gilt, Doppeltes an der Übung weg,
   Hauptsportart von Gruppe, Segment und Muster zieht mit; „wie die Gruppe" im Muster bleibt
6. Zusammenführen mit vordefiniertem Begriff: der eigene verschwindet aus der Liste
7. Material zusammenführen: an Übung und Variante bleibt die Zeile des vorhandenen Materials, die
   Halle wird umbenannt
8. Nur Groß-/Kleinschreibung: gewöhnliches Umbenennen
9. Länge: Phase 61 Zeichen, andere Art 101 Zeichen und leerer Name abgewiesen; Phase mit 60 geht
10. Unbekannte Kennung: abgewiesen
11. Altersgruppe: Übung, Variante, Gruppe
12. Organisationsform auf vordefinierten Begriff: Übung, Variante (trug beide), Segment, Muster
13. Mustername ohne Rücksicht auf Groß-/Kleinschreibung eindeutig
14. Fremdes Konto: sieht kein Muster, keine Zahl, keine Verwendung; Umbenennen, Anlegen unter
    fremdem Besitzer und Ändern eines fremden Musters wirkungslos
15. Ohne Anmeldung: abgewiesen
16. `anon`: Funktion gesperrt

### Nicht belegt

- **Der neue Änderungsstempel** an Übungen und Einheiten: innerhalb einer Transaktion steht die
  Uhr der Datenbank, der Unterschied ist dort nicht messbar
- **Zwei wirklich gleichzeitige Umbenennungen** — die Sperre ist gebaut, aber nicht erprobt
- **Die Geschwindigkeit bei 500 Übungen** (Richtwert der Spec: unter einer Sekunde) — geprüft ist
  mit der heutigen Menge von 45
- **Der Weg im Browser** — Verwaltung, Generator mit Stundenmuster und die Browser-Tests sind nicht
  gelaufen
- **Begriffe an Varianten** werden beim Speichern einer Übung weiterhin nicht in die Auswahllisten
  eingetragen — so war es vor PROJ-16 schon

## Implementation Notes (Frontend) — Überarbeitung vom 2026-10-14

**Stand:** 2026-10-14. **590 Unit-Tests grün** (578 plus 12 neue), Typprüfung, Lint und
Produktionsbuild sauber. Keine Migration, keine neuen Pakete.

### Was gebaut ist

- **Kopfzeile** (`src/app/(protected)/layout.tsx`): „Verwaltung" als vierter Punkt ab `md`
  (768 px). Der Anzeigename wird dort gekürzt (`max-w-32`, ab `lg` `max-w-64`), damit ein langer
  Name die Zeile nicht sprengt; der volle Name steht im Tooltip
- **Halle löschen** (`venue-list.tsx`): Titel nennt die Halle; mit Gruppen nennt der Dialog sie,
  sagt, dass der Generator für sie kein Material mehr prüft, wo man umhängt, dass Einheiten bleiben
  und dass es nicht rückgängig zu machen ist. Ohne Gruppen ein Satz und „nicht rückgängig"
- **Nachfrage beim Hallenmaterial** (`venue-dialog.tsx`): vor dem Speichern einer Halle mit
  Gruppen wird verglichen, was wegfällt oder weniger wird. Gibt es das, holt der Dialog die Zahlen
  vom Server und fragt nur nach, wenn wirklich Übungen herausfallen. Lassen sich die Zahlen nicht
  ermitteln, fragt er trotzdem — ohne Zahlen, mit den Gruppen
  - Rechnung: `src/lib/manage/venue-materials.ts` (`materialLosses`, `materialImpacts`,
    `describeLoss`), 12 Tests. Jeder Verlust wird einzeln gegen den alten Stand gerechnet, über
    `materialsAvailable` des Generators — „pro Teilnehmer" also mit der Gruppe
  - Serverweg: `getVenueMaterialImpact` in `src/lib/actions/groups.ts`. Rechnet gegen den
    **gespeicherten** Stand der Halle, nicht gegen den im Browser
  - `materialsAvailable` nimmt jetzt nur die Felder, die es braucht (`Pick<…>`); am Verhalten
    ändert sich nichts
- **Materialbegriff löschen** (`category-manager.tsx`): bei verwendetem Material der Zusatz, dass
  der Generator wie bisher rechnet
- **Ein „Kategorien verwalten"-Link je Bildschirm:** Übungs-Assistent einmal am Ende von
  „Einordnung" (vorher vier), Material unverändert; Gruppen-Formular einmal unter der Altersgruppe
  (vorher zwei); Generator einmal neben „Phase hinzufügen" (vorher einer je Segment). Wo mehrere
  Arten zusammenstehen, öffnet der Link den Reiter ohne Sprung zu einem Abschnitt
- **„Im Generator öffnen"** (`pattern-list.tsx`): erster Punkt im Menü, führt auf
  `/units/new?pattern=<id>`. Die Seite reicht das Muster an `UnitConfigForm` als
  `initialPatternId` weiter, oder `patternMissing`, wenn es das Muster nicht mehr gibt (Meldung,
  Generator auf „Standard"). Kommt der Nutzer über „Zurück zum Generator", zählt dessen Stand und
  das Muster wird übergangen. Der Erklärtext des Reiters nennt den neuen Weg

### Abweichung vom bisherigen Verhalten

- **Passt ein Muster nicht zur gewählten Gruppe, bleibt es jetzt gewählt.** Bisher fiel die Maske
  beim Gruppenwechsel auf „Standard" zurück. Jetzt bleibt der Weg „Stundenmuster" mit dem Muster
  stehen, ohne Zeitverlauf und mit dem Grund darunter; „Einheit generieren" nennt den Grund statt
  zu generieren. Das verlangt das neue Kriterium in I und gilt für jeden Gruppenwechsel, nicht
  nur nach „Im Generator öffnen". Wechselt der Nutzer auf „Standard" oder „Individuell", ist das
  Muster abgewählt

### Nicht belegt

- **Im Browser angesehen** ist nur die Kopfzeile (Verwaltung bei 375, 768 und 1280 px gegen den
  Entwicklungsserver: vier Punkte ab 768 px ohne Umbruch, keine waagerechte Scrollleiste, am
  Handy weiter drei) und der Generator ohne Gruppe mit einem nicht vorhandenen Muster. Das
  Testkonto hat weder Gruppe noch Halle noch Muster — **die Hallen-Dialoge, die Nachfrage zum
  Material, der Generator mit vorgewähltem Muster und das Menü der Muster sind ungesehen**
- Die Browser-Tests sind nicht gelaufen

## QA Test Results

**Tested:** 2026-10-14, Stand Commit `f825233`
**App URL:** http://localhost:3100 (Produktionsbuild)
**Tester:** QA Engineer (AI)

### Ergebnis in einem Satz

**Bereit für die Auslieferung:** kein Akzeptanzkriterium ist durchgefallen, kein Befund am
Zugriffsschutz, ein Fehler niedriger Stufe (BUG-27). Zum ersten Mal ist die Verwaltung im Browser
gelaufen — vorher war sie nie angesehen worden.

### Was gelaufen ist

| | Ergebnis |
|---|---|
| Unit-Tests | **590 grün** (darunter 12 für die Nachfrage zum Hallenmaterial, 25 für Stundenmuster, 16 für Kategorien) |
| Browser-Tests PROJ-16 | **69 neu**: 32 je Projekt (Rechner, Handybreite „iPhone 13", 390 px) plus 5 ohne Anmeldung. Einer je Projekt ist als erwarteter Fehlschlag markiert und stellt BUG-27 nach |
| Gesamtlauf aller Features | **408 von 408 grün in einem Zug** (16,3 Minuten, zwei Arbeiter, ohne Entwicklungsserver): 336 aus PROJ-3, -5, -6, -7 und -14, 69 aus PROJ-16, dazu 3 für Einrichtung und Aufräumen. **Keine Regression.** Erst der dritte Gesamtlauf — siehe „Hinweis zur Testumgebung" |
| Datenbank | der Nachweis aus `/backend` (16 Fälle, zurückgerollte Transaktion); dazu jetzt nachgesehen: alle 17 Tabellen mit Zugriffsschutz, Muster und Kategorien nur für den Besitzer, die vier Funktionen ohne erhöhte Rechte, mit festem Suchpfad, für `anon` gesperrt. `get_advisors` meldet nur den bekannten Hinweis zum Passwortschutz |
| Breiten | 390 px (ganze Suite), 768 px (Kopfzeile) und 1280 px (Rechner): nirgends waagerechtes Scrollen |
| Browser | **nur Chromium** (Edge). Firefox und echtes Safari sind auf diesem Rechner nicht prüfbar |

Die Browser-Tests von PROJ-16 laufen in einer **eigenen Stufe** nach dem Live-Modus („verwaltung",
danach „verwaltung mobil"), weil sie Hallen, Gruppen, Kategorien und Muster anlegen, die sonst in
den Auswahllisten der übrigen Tests stünden. Jeder Test legt seine Daten selbst an (Kennung
`E2E16`) und räumt vorher alles mit dieser Kennung weg.

### Akzeptanzkriterien

113 aktive Kriterien (zwei weitere sind durch die Überarbeitung vom 2026-10-14 ersetzt).
**Durchgefallen: keines.**

| Abschnitt | Kriterien | bestanden | davon im Browser | Anmerkung |
|---|---|---|---|---|
| A. Seite und Zugang | 15 | 15 | 14 | „Stundenmuster verwalten" im Generator nur am Code |
| B. Hallen | 14 | 14 | 10 | „Pro Teilnehmer" und „umgestelltes Material gilt als entfernt" über Unit-Tests; Leerzustand und „Neue Halle" im Gruppen-Formular unverändert aus PROJ-5 |
| C. Kategorien ansehen | 7 | 7 | 6 | „Variante zählt einmal" am lebenden System |
| D. Kategorie anlegen | 6 | 6 | 4 | Längengrenze und „anderer Art" über Unit-Tests |
| E. Umbenennen, Zusammenführen | 13 | 13 | 5 | der Rest am lebenden System (Unteilbarkeit, alle Stellen, Material mit Menge, Entwurf, Groß-/Kleinschreibung) |
| F. Löschen | 12 | 12 | 6 | gelöschte Phase in Einheit, im Live-Modus und nach „Zurück zum Generator" nur am Code |
| G. Muster speichern | 10 | 10 | 3 | „wie die Gruppe" über Unit-Tests; Überschreiben, zwei Wege und die Grenze von 100 nur am Code |
| H. Muster anwenden | 18 | 18 | 4 | Umrechnung, Mindestlänge und Sportarten über Unit-Tests; Nachfragen beim Ersetzen und Gruppenwechsel nur am Code |
| I. Reiter „Stundenmuster" | 13 | 13 | 11 | „gelöscht in einem anderen Tab" besteht auf dem beschriebenen Weg — direkt aufgerufen fehlt die Meldung (BUG-27) |
| J. Durchgehend | 5 | 5 | 1 | fremde Kennung am lebenden System; Fehler- und Ladezustand am Code |

„Nur am Code" heißt: gelesen und für richtig befunden, aber nie ausgeführt. Das betrifft vor
allem den Generator bei von Hand verändertem Zeitverlauf (Nachfrage beim Ersetzen, beim
Gruppenwechsel, beim Überschreiben).

### Edge Cases

- [x] Gleicher Name in zwei Arten, Groß-/Kleinschreibung, einzige Phase umbenannt — am lebenden System (`/backend`)
- [x] Muster mit mehr Phasen als Minuten — im Browser: bleibt gewählt, Grund unter der Auswahl, „Einheit generieren" nennt ihn
- [x] Muster in einem anderen Tab gelöscht — im Browser über „Im Generator öffnen"
- [x] Keine Gruppe — der Generator zeigt seinen Leerzustand, auch mit Muster in der Adresse
- [x] Material, das nur eine Variante braucht — Unit-Test: zählt als Übung mit
- [x] Hallenmaterial ohne Gruppen, hinzugefügt oder nirgends gebraucht — im Browser: keine Nachfrage
- [ ] Zwei gleichzeitige Umbenennungen, 500 Übungen, sehr viele Verwendungen — **nicht geprüft**

### Sicherheit (Red Team)

- [x] **Anmeldung:** `/manage` mit jedem Reiter, `/groups/venues` und der Generator mit Muster in der Adresse leiten ohne Anmeldung zum Login (Browser)
- [x] **Fremde Daten:** Zugriffsregeln nachgesehen (oben); der neue Serverweg `getVenueMaterialImpact` liest Hallenmaterial nur über den Zugriffsschutz und Gruppen nur des angemeldeten Nutzers — eine fremde Hallen-Kennung ergibt eine leere Rechnung, keine fremden Namen
- [x] **Eingaben:** Namen werden als Text ausgegeben (React), nirgends als HTML; Längen sind auf dem Server und in der Datenbank begrenzt
- [x] **Keine Geheimnisse** in den neuen Dateien
- Ohne Befund. Anzumerken: `getVenueMaterialImpact` liest bei jedem Aufruf alle Übungen des Nutzers. Bei heutigen Mengen ohne Belang, und es wird nur gerufen, wenn Material wegfällt und Gruppen an der Halle hängen

### Bugs Found

#### BUG-27: Gelöschtes Muster in der Adresse — die Meldung fehlt beim direkten Aufruf
- **Severity:** Low
- **Steps to Reproduce:**
  1. `/units/new?pattern=<Kennung eines gelöschten Musters>` direkt aufrufen (Lesezeichen, Neuladen)
  2. Expected: Meldung „Dieses Stundenmuster gibt es nicht mehr", Generator auf „Standard"
  3. Actual: Generator steht richtig auf „Standard", **die Meldung erscheint nicht**
- **Ursache:** Die Meldung wird beim ersten Aufbau der Seite ausgelöst. Die Meldungsanzeige der App
  (`src/hooks/use-toast.ts`) übernimmt ihren Stand beim Zeichnen und hört erst danach zu — was
  dazwischen ausgelöst wird, geht verloren. Über „Im Generator öffnen" (Seitenwechsel innerhalb der
  App) hört sie schon zu, dort erscheint die Meldung. Keine andere Stelle der App löst beim ersten
  Aufbau eine Meldung aus
- **Nachgestellt:** Browser-Test „BUG-27: …", als erwarteter Fehlschlag markiert
- **Priority:** Nice to have

### Hinweis zur Testumgebung

Die ersten beiden Gesamtläufe brachen ab — beide Male an Tests, nicht an der App:

1. **Lauf 1, drei Fehlschläge.**
   - PROJ-6 suchte „Zeitverlauf" irgendwo auf der Seite. Seit PROJ-16 steht das Wort auch im
     Erklärsatz zum Stundenmuster. Die drei Stellen treffen jetzt nur noch die Überschrift
     (`exact`)
   - PROJ-3 „Suchfeld filtert" (Rechner und Handy) hatte als einziger Test eine feste Frist von
     5 Sekunden. Die Suche reiht sich hinter die beiden Ladeaufrufe der Seite und kam bei
     **rund 1 Sekunde je Anfrage an Supabase** (gemessen) nach etwa 7 Sekunden. Die Frist ist
     jetzt die der Konfiguration (15 Sekunden). Einzeln beobachtet filtert die Suche richtig
2. **Lauf 2, ein Fehlschlag:** PROJ-6 „aus einer gespeicherten Einheit entsteht ein Entwurf
   daneben". „Neu generieren" macht ein gutes Dutzend Anfragen an Supabase und riss bei derselben
   langsamen Verbindung die 15 Sekunden. Mit wieder schneller Verbindung (0,2 Sekunden je Anfrage)
   besteht der Test in 8 Sekunden, und ein eigenes Skript zeigt den Ablauf sauber (neuer Entwurf
   nach knapp 2 Sekunden, mit Meldung)
3. **Lauf 3:** 408 von 408

Dazu zwei Fallen dieses Rechners:

- **Aufzeichnen mit `--trace=on`** lässt die Test-Anmeldung (`auth.setup.ts`) jedes Mal an der
  Zeitgrenze von 2 Minuten hängen; ohne das läuft sie in 2 bis 6 Sekunden durch
- Ein Rest von `npm run dev` lauschte nach Strg+C weiter auf Port 3000 (1,3 GB). Er wurde mit
  Zustimmung des Nutzers beendet

### Beobachtungen ohne Fehler

- **Der Generator braucht mindestens eine Übung**, sonst zeigt er nur den Leerzustand — die
  Browser-Tests legen deshalb je Test eine eigene Übung an, statt sich auf den Grundbestand zu
  verlassen

### Summary
- **Acceptance Criteria:** 113/113 passed (64 davon im Browser ausgeführt)
- **Bugs Found:** 1 total (0 critical, 0 high, 0 medium, 1 low)
- **Security:** Pass
- **Production Ready:** YES
- **Recommendation:** Deploy; BUG-27 kann mitgehen oder folgen

## Deployment

**Ausgeliefert:** 2026-10-15
**Produktions-URL:** https://stundenplaner-self.vercel.app
**Tag:** `v1.8.0-PROJ-16` · **Commit:** `ca89bdb`

### Vorprüfung

| | Ergebnis |
|---|---|
| Freigabe durch `/qa` | ja — kein Fehler der Stufe „kritisch" oder „hoch", offen nur BUG-27 (niedrig) |
| Produktionsbuild | sauber, `/manage` wird gebaut |
| Lint | 0 Fehler (4 bekannte Warnungen zu `<img>` aus PROJ-3) |
| Typprüfung | sauber |
| Unit-Tests | 590 grün |
| Browser-Tests | 408 von 408 grün, am selben Stand aus der QA (nicht erneut gelaufen — seit `f825233` kam nur der Commit mit den QA-Ergebnissen dazu) |
| Migrationen | Register 18 zu 18, Namen und Versionen gleich den Dateien — im Projekt nachgesehen |
| Pakete, Konfiguration | `package.json`, `next.config.ts` und `.env.local.example` seit PROJ-14 unverändert |
| Umgebungsvariablen | keine neue |
| Geheimnisse im Diff | keine; `.env.local` ist nicht im Repository |
| Hochgeladen | 7 Commits, `deaf2ba..ca89bdb`. Das Logo (`deaf2ba`) lag schon vorher auf `main` und war damit schon live |

### Nachprüfung in der Produktion — 2026-10-15

Von außen, ohne Anmeldung:

- **Vercel** meldet die Auslieferung am Commit `ca89bdb` als abgeschlossen
- **Öffentliche Seiten** (`/`, `/login`, `/register`) antworten mit 200
- **Geschützte Seiten** (`/dashboard`, `/manage`, `/groups/venues`, `/units/new`, `/exercises`,
  `/groups`, `/units`) leiten mit 307 auf `/login`
- **`/live`** und **`/live-sw.js`** liegen weiter aus (200)
- **Sicherheits-Kopfzeilen** liegen an `/manage` an: X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, HSTS
- **Supabase:** in den letzten 24 Stunden kein Fehler in den Protokollen der Datenbank;
  `get_advisors` meldet nur den bekannten Hinweis zum Passwortschutz

### Was damit nicht belegt ist

- **Alles von PROJ-16 liegt hinter der Anmeldung** — die Seite „Verwaltung", Stundenmuster im
  Generator, Umbenennen und Zusammenführen, die Nachfragen an der Halle. Von außen ist nur
  belegt, dass die Seiten ausliefern und geschützt sind. Auf dem Testserver ist der Weg mit
  69 Browser-Tests belegt, in der Produktion noch **von niemandem durchgespielt**
- **Der Generator bei von Hand verändertem Zeitverlauf** (Nachfragen beim Ersetzen, beim
  Gruppenwechsel, beim Überschreiben) ist auch auf dem Testserver nur am Code gelesen
- **Firefox und echtes Safari**

### Zurückrollen

Im Vercel-Dashboard unter „Deployments" die Auslieferung von `deaf2ba` (PROJ-14 plus Logo) auf
„Promote to Production" setzen. Die Datenbank muss dafür **nicht** zurückgedreht werden: die
Migration ist rein hinzufügend, und die ältere Fassung benutzt weder die Tabelle der Muster noch
die neuen Funktionen.

Eine Folge des Zurückrollens: dort tragen Übung, Gruppe und Halle beim Speichern wieder alles
Nicht-Vordefinierte in die Auswahllisten ein. Ein in der Verwaltung gelöschter Begriff, der noch
in einer Übung steht, käme beim nächsten Speichern dieser Übung zurück.

## Implementation Notes (Frontend) — Überarbeitung vom 2026-10-15

**Stand:** 2026-10-15, nachgeschärft am selben Abend. **610 Unit-Tests grün** (590 plus 20 neue),
Typprüfung, Lint und Produktionsbuild sauber. Keine Migration, keine neuen Pakete, kein Serverweg berührt — alles in
`unit-config-form.tsx` und einer reinen Funktion daneben.

### Was gebaut ist

- **„Verändert" heißt anderer Inhalt** — `sameTimeline` in `src/lib/units/timeline.ts`, 14 Tests.
  Vergleicht Segment für Segment Phase, Minuten, Füllart, Arbeitsnotiz, Sportarten, wirksame
  Hauptsportart, Schwierigkeiten und Organisationsformen; die Kennungen der Segmente und die
  Reihenfolge innerhalb einer Auswahl zählen nicht, die Reihenfolge der Segmente schon. Eine
  Hauptsportart ohne Bedeutung (nur eine Sportart gewählt) ist keine Änderung
- **Der Vergleichsstand** (`patternBaseline`): ist ein Muster geladen, das Muster so, wie es auf
  die Gruppe angewendet wurde — gesetzt beim Laden, beim Gruppenwechsel mit Muster und nach dem
  Speichern (dann der gespeicherte Stand). Ohne Muster der Standard der Gruppe; das gilt auch für
  einen über „Zurück zum Generator" mitgebrachten Stand. Ersetzt den Schalter `touched`, der sich
  nur merkte, *dass* etwas angefasst wurde
- **Gezählt wird der eigene Stand**, auch während der Weg „Standard" gewählt ist — er ist
  aufgehoben und kommt beim Gruppenwechsel mit
- **Nachfragen:** „Auf Standard zurücksetzen" (neu) und Muster wählen oder „Auf Stundenmuster
  setzen" (wie bisher) laufen über den Dialog „Bisherigen Zeitverlauf ersetzen?"; der Text sagt je
  Fall, was passiert. Die Meldung „Auf Standard zurückgesetzt" kommt erst nach „Ersetzen". Das
  Umschalten auf den Weg „Standard" fragt nicht
- **Gruppenwechsel nimmt den Stand mit** *(nachgeschärft, b)* — `carryTimeline` in
  `src/lib/units/patterns.ts`, 6 Tests: der Zeitverlauf wird wie ein Muster der alten Gruppe
  behandelt und auf die neue angewendet (`toPatternSegments` → `applyPattern`), also mit
  denselben Regeln für Umrechnung und Sportarten. `handleGroupChange` rechnet das vor dem
  Wechsel aus und legt es für den Effekt bereit; der Effekt übernimmt es, setzt den Hinweis
  „Zeitverlauf übernommen …" und hält ein gewähltes Muster als Vergleichsstand. Unverändert
  läuft der Wechsel wie bisher (Standard bzw. Muster frisch angewendet). Passt der Stand nicht,
  fragt ein eigener Dialog „Zeitverlauf passt nicht zur neuen Gruppe" mit beiden Zahlen und
  „Trotzdem wechseln"; vorher wird ausgerechnet, ob das gewählte Muster auf die neue Gruppe
  passt, damit der Text sagt, was sie stattdessen bekommt. Passt auch das Muster nicht, wird es
  abgewählt — die Gruppe bekommt ihren Standard statt einer Maske ohne Zeitverlauf
- **„Stundenmuster speichern" ausgegraut**, solange ein Muster geladen und der Zeitverlauf
  unverändert ist — seit dem 2026-10-16 auch, wenn das Muster umgerechnet wurde; darunter „Dieses
  Stundenmuster ist so schon gespeichert." bzw. „… — hier auf [y] Minuten umgerechnet." — an
  derselben Stelle und im selben Stil wie der Hinweis zu den Minuten

### Tests

- **Unit:** 14 für `sameTimeline`, 6 für `carryTimeline`
- **Browser:** fünf neue in `tests/PROJ-16-verwaltung.spec.ts`, je Rechner und Handy:
  „Auf Standard zurücksetzen" mit und ohne Änderung, auch nach Rücknahme; Gruppenwechsel nimmt den
  veränderten Zeitverlauf mit (60 → 45 Minuten, Hinweis, Arbeitsnotiz noch da), dazu der Weg
  „Standard" ohne Nachfrage; Muster gewählt, dann „Individuell" und verändert — der Wechsel nimmt
  den Stand mit, nicht das Muster; zu kurze Gruppe (6 Phasen, 5 Minuten) mit „Abbrechen" und
  „Trotzdem wechseln"; „Stundenmuster speichern" ausgegraut, nach einer Änderung frei, nach der
  Rücknahme wieder ausgegraut, beim nur umgerechneten Muster ausgegraut mit Hinweis, nach einer
  Änderung frei (2026-10-16). Jeder legt seine eigene Übung an —
  ohne Übung zeigt der Generator nur den Leerzustand. Dasselbe nachgetragen am Test „ein
  ‚Kategorien verwalten' unter dem Zeitverlauf", der sich bisher auf den Grundbestand verließ

### Was die Browser-Tests gezeigt haben — 2026-10-15/16

**Alle grün, keine Regression** — verteilt auf einen Gesamtlauf und drei Nachläufe. Die
Leitung dieses Rechners schwankte den ganzen Abend (Supabase und Google zeitweise 1–21 s je
Anfrage statt 0,2–0,4 s); daran lagen alle Fehlschläge, keiner wiederholte sich bei normaler
Verbindung.

| Lauf | Ergebnis |
|---|---|
| Gesamtlauf, 418 Tests (1,6 h) | **340 grün**, 3 fehlgeschlagen, 75 nicht gelaufen. Die drei: Live-Modus (PROJ-14), jeweils der Wechsel zwischen Einheit und `/live` über 15 s — dort wartet die App auf den Server. Die 75 sind die beiden Verwaltungsstufen, die nach einem Fehlschlag im Live-Modus übersprungen werden |
| Die drei Live-Tests einzeln (Z. 611, 939, 1307) | **3 von 3 grün** |
| PROJ-16, Stufe „verwaltung" (Rechner) | **37 von 37 grün**, darunter die fünf neuen |
| PROJ-16, Stufe „verwaltung mobil" | **37 von 37 grün**, darunter die fünf neuen; BUG-27 weiter als erwarteter Fehlschlag |

Damit sind auch die Fehlschläge vom Nachmittag erledigt: PROJ-7 (Schalter der Arbeitsnotiz) lief
im Gesamtlauf grün, „Verwendungen ansehen" und „Kategorien verwalten unter dem Zeitverlauf" in
den Verwaltungsstufen.

**Eine Falle beim Nachlaufen:** `--no-deps` hebt auch die Reihenfolge „verwaltung mobil nach
verwaltung" auf. Beide Stufen liefen dann gleichzeitig, und weil jeder Test vorher alle
`E2E16`-Daten wegräumt, löschte die eine Stufe der anderen die Halle unter den Füßen weg (ein
Fehlschlag im Reiter „Hallen", „Received undefined"). Nacheinander gestartet: grün.

### Nicht belegt

- **Im Browser von Hand angesehen:** nichts
- Ein Muster mit Sportarten, die die Gruppe nicht hat, ist nur über die Unit-Tests der
  Vergleichsfunktionen abgedeckt
- Mehrmaliges Hin- und Herwechseln (Rundung beim wiederholten Umrechnen) ist nur in der Spec als
  Grenzfall beschrieben, nicht getestet
