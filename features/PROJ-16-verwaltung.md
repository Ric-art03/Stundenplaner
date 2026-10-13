# PROJ-16: Verwaltung (Hallen, Stundenmuster, eigene Kategorien)

## Status: In Progress
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
- [x] **Welche Mindestlänge hat ein Segment im Zeitverlauf heute, und in welchen Schritten wird gerechnet?** — Eine Minute, ganze Minuten. Beantwortet im Tech Design (2026-10-12)
- [x] **Wie merkt sich die App einen gelöschten Begriff**, damit er beim Speichern einer Übung nicht zurückkommt? — Gar nicht: eingetragen wird künftig nur, was neu eingetippt wurde. Beantwortet im Tech Design (2026-10-12)
- [ ] **Begriffe, die in Übungen stehen, aber in keiner Auswahlliste**, sind in der Verwaltung unsichtbar und lassen sich erst nach erneutem Anlegen umbenennen. Beim Test im Browser anzusehen, ob das reicht oder ob die Verwaltung sie eigens zeigen soll

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
