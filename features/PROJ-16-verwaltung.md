# PROJ-16: Verwaltung (Hallen, Stundenmuster, eigene Kategorien)

## Status: Planned
**Created:** 2026-10-04
**Last Updated:** 2026-10-12

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
- **Ein vierter Menüpunkt und der Umbau der Navigation** (Leiste am unteren Rand, Konto-Menü) — bleibt zurückgestellt bis PROJ-9 (Kalender)
- **Den Zeitverlauf eines Stundenmusters in der Verwaltung bearbeiten** — geändert wird ein Muster nur über den Generator (laden, anpassen, erneut speichern)
- **Ein Knopf „Im Generator öffnen" am Muster** — in der Verwaltung besprochen und nicht gewählt
- **Stundenmuster an eine Gruppe binden** oder eine Gruppe als Vorschlag merken
- **Eine Einheit merkt sich ihr Muster** — es gibt keine Verbindung zwischen Einheit und Muster nach dem Laden; ein geändertes Muster ändert keine Einheit
- **„Überall entfernen" beim Löschen einer Kategorie** — Löschen wirkt nur auf die Auswahllisten
- **Mehrere Einträge auf einmal löschen** („alle unbenutzten löschen")
- **Mitgelieferte Stundenmuster** — gehört, wenn überhaupt, zu PROJ-4 (Starter-Datenbank)
- **Stundenmuster oder Kategorien teilen** — PROJ-12 (Community)
- **Neue Funktionen an den Hallen** — die Hallenverwaltung zieht um, so wie sie ist. Dokumente an Hallen bleiben PROJ-15
- **Durchführungen nachträglich umschreiben** — was eine Durchführung (PROJ-14) festgehalten hat, bleibt beim Umbenennen stehen; sie ist eine Aufzeichnung

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
- [ ] Angenommen der Nutzer ist im Übungs-Formular, im Gruppen-Formular oder in der Phasenauswahl des Generators an einer Auswahlliste, die eigene Begriffe aufnimmt, dann steht dort ein Link „Kategorien verwalten", der die Verwaltung im Reiter „Kategorien" beim Abschnitt dieser Art öffnet
- [ ] Angenommen der Nutzer hat in einem Formular ungespeicherte Eingaben, wenn er einen „verwalten"-Link wählt, dann gehen die Eingaben nicht ohne Nachfrage verloren
- [ ] Angenommen die Kopfzeile der App, dann hat sie weiterhin genau die drei Menüpunkte Übungen, Gruppen, Einheiten

### B. Reiter „Hallen" (Umzug aus PROJ-5)

- [ ] Angenommen der Nutzer hat Hallen angelegt, wenn er den Reiter „Hallen" öffnet, dann sieht er dieselbe Liste mit denselben Angaben und denselben Aktionen (anlegen, bearbeiten, löschen mit Warnung zu betroffenen Gruppen) wie bisher unter „Gruppen → Hallen"
- [ ] Angenommen der Nutzer hat keine Halle, wenn er den Reiter öffnet, dann sieht er einen Leerzustand mit „Erste Halle anlegen"
- [ ] Angenommen der Nutzer ruft die bisherige Adresse der Hallenverwaltung auf, dann landet er in der Verwaltung im Reiter „Hallen"
- [ ] Angenommen der Nutzer legt im Gruppen-Formular über „Neue Halle" eine Halle an, dann funktioniert das unverändert und die Halle erscheint danach im Reiter „Hallen"

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

### G. Stundenmuster speichern (im Generator)

- [ ] Angenommen der Nutzer hat im Generator eine Gruppe gewählt und der Zeitverlauf ist sichtbar, dann steht dort der Knopf „Stundenmuster speichern"
- [ ] Angenommen der Nutzer wählt „Stundenmuster speichern", wenn er einen Namen eingibt und bestätigt, dann ist der Zeitverlauf so abgelegt, wie er gerade steht: Segmente in ihrer Reihenfolge mit Phase, Minuten, „generieren oder frei lassen", Schwierigkeit, Organisationsform und Arbeitsnotiz der Phase, dazu die Gesamtdauer
- [ ] Angenommen ein Segment trägt beim Speichern genau die Sportarten und die Hauptsportart der gewählten Gruppe, dann merkt sich das Muster für dieses Segment „wie die Gruppe" statt der Begriffe
- [ ] Angenommen ein Segment trägt beim Speichern eine andere Auswahl als die Gruppe, dann merkt sich das Muster genau diese Sportarten und diese Hauptsportart
- [ ] Angenommen der Name ist leer, nur Leerzeichen oder länger als 60 Zeichen, dann wird nichts gespeichert und am Feld steht der Grund
- [ ] Angenommen es gibt schon ein Muster mit diesem Namen (Groß-/Kleinschreibung ohne Unterschied), dann fragt die App, ob es überschrieben werden soll, und speichert erst nach der Bestätigung
- [ ] Angenommen der Zeitverlauf stammt aus einem geladenen Muster, wenn der Nutzer „Stundenmuster speichern" wählt, dann bietet der Dialog zwei Wege: „‚[Name]' überschreiben" und „Als neues Muster speichern" mit Namensfeld
- [ ] Angenommen die Minuten der Segmente ergeben nicht die Einheitsdauer, dann ist „Stundenmuster speichern" nicht ausführbar und sagt, warum
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
- [ ] Angenommen der Nutzer hat den Zeitverlauf von Hand verändert, wenn er ein Muster wählt oder „Auf Stundenmuster setzen" benutzt, dann fragt die App vorher nach, weil der bisherige Stand ersetzt wird
- [ ] Angenommen der Zeitverlauf ist unverändert gegenüber Standard oder dem zuletzt geladenen Muster, wenn der Nutzer ein Muster wählt, dann wird es ohne Nachfrage geladen
- [ ] Angenommen ein Muster ist geladen, wenn der Nutzer die Gruppe wechselt, dann bleibt das Muster gewählt und wird für die neue Gruppe frisch angewendet (Umrechnung und Sportarten der neuen Gruppe); war der Zeitverlauf von Hand verändert, fragt die App vorher nach
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

## Technical Requirements
- **Sicherheit:** Anmeldung erforderlich; jeder Lese- und Schreibweg wirkt nur auf Einträge des angemeldeten Nutzers, auf dem Server geprüft und in der Datenbank abgesichert
- **Unteilbarkeit:** Umbenennen und Zusammenführen ändern alle Verwendungen gemeinsam oder gar keine
- **Leistung:** Der Reiter „Kategorien" mit Verwendungszahlen ist bei 500 Übungen ohne spürbare Wartezeit da (Richtwert: unter einer Sekunde)
- **Breiten:** 375 px, 768 px, 1440 px
- **Keine Regression:** Die Browser-Tests von PROJ-5 sprechen die Hallenverwaltung unter ihrer bisherigen Adresse an und müssen mitziehen

## Open Questions
- [ ] **Filter der Übungsübersicht und gelöschte Begriffe.** Nach dieser Spec verschwindet ein gelöschter Begriff auch aus den Filtern — Übungen, die ihn noch tragen, lassen sich danach nicht mehr über ihn finden. Folgerichtig zu „aus allen Auswahllisten", aber beim Test im Browser anzusehen, ob es stört
- [ ] **Welche Mindestlänge hat ein Segment im Zeitverlauf heute, und in welchen Schritten wird gerechnet?** Die Umrechnung der Muster richtet sich danach; `/architecture` liest es aus dem Generator ab
- [ ] **Wie merkt sich die App einen gelöschten Begriff**, damit er beim Speichern einer Übung nicht zurückkommt? Heute trägt jedes Speichern alle nicht vordefinierten Begriffe wieder ein. Eine Frage für `/architecture`

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-17 (Stundenmuster) geht in PROJ-16 auf | Entscheidung des Nutzers: Stundenmuster sind wie eigene Kategorien selbst Angelegtes, und alles selbst Angelegte soll auf einer gemeinsamen Oberfläche verwaltet werden. Weicht bewusst von „ein Feature je Spec" ab; die Abschnitte der Akzeptanzkriterien sind so geschnitten, dass sich Kategorien (C–F) und Stundenmuster (G–I) getrennt bauen und prüfen lassen | 2026-10-12 |
| Die Hallen ziehen mit um; „Gruppen → Hallen" entfällt | Vom Nutzer gewählt. Ein Ort für alles selbst Angelegte ist nur dann einer, wenn die Hallen nicht daneben stehen. Der Preis ist ein Umbau an PROJ-5 mit Nachtest | 2026-10-12 |
| Kein vierter Menüpunkt; Zugang über eine Karte der Startseite und „verwalten"-Links am Ort der Benutzung | Die Kopfzeile fasst am Handy gerade drei Punkte, der Umbau der Navigation ist bis PROJ-9 zurückgestellt. Verwaltet wird selten und meist aus einem Anlass heraus — der Link steht dort, wo der Anlass entsteht | 2026-10-12 |
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

### Technical Decisions
<!-- Added by /architecture -->
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
