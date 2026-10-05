# PROJ-7: Einheiten-Editor

## Status: Planned
**Created:** 2026-10-06
**Last Updated:** 2026-10-06

## Dependencies
- **Benötigt:** PROJ-6 (Einheiten-Generator) — der Editor arbeitet auf der gespeicherten
  Einheit, ihren Segmenten und Einträgen. Kandidatenpool, Filterregeln und die
  Lücken-Aufschlüsselung (`GapDetail`) entstehen dort und werden hier wiederverwendet
- **Benötigt:** PROJ-3 (Übungsdatenbank) — Auswahlliste und „Schnell anlegen" greifen auf die
  Übungen des Nutzers zu
- **Ändert:** PROJ-3 (Übungsdatenbank) — schnell angelegte Übungen tragen eine Markierung
  „noch zu ergänzen", und die Übungsübersicht muss danach filtern können. Eine kleine
  Erweiterung an einem ausgelieferten Feature, am 2026-10-06 bewusst vorgezogen: später
  nachgerüstet wären es eine zweite Migration und ein erneuter Eingriff in eine deployte Maske
- **Benötigt:** PROJ-5 (Gruppenprofile) — Halle, Material, Teilnehmerzahl und Altersgruppen
  bestimmen, welche Übungen überhaupt in Frage kommen
- **Ermöglicht:** PROJ-14 (Live-Modus) — setzt auf der ruhigen Leseansicht auf, die dieser
  Editor bewusst unangetastet lässt
- **Berührt:** PROJ-10 (Übungsrotation) — jede Änderung muss die Verwendungsnachweise der
  Einheit nachziehen, sonst rechnet die Rotation später mit falschen Daten

## Worum es geht

Der Generator aus PROJ-6 liefert einen fertigen Stundenverlauf. Gut, aber nie perfekt: eine
Übung passt nicht zur Stimmung der Gruppe, eine zweite dauert in der Praxis länger als
geschätzt, ein Abschnitt wurde bewusst frei gelassen und will gefüllt werden. Bisher hat der
Nutzer dafür nur ein Werkzeug — neu würfeln, also alles verwerfen. Der Editor gibt ihm
stattdessen den Zugriff auf den einzelnen Platz im Plan.

Der Editor ist **ein Modus auf der Detailseite** `/units/[id]`, kein eigener Ort. Ein Knopf
„Bearbeiten" schaltet die Bedienelemente ein, „Fertig" wieder aus. Die Leseansicht bleibt damit
ruhig und lesbar — sie ist das, was der Übungsleiter in der Halle vor sich hat, und sie trägt
später den Live-Modus.

Geändert wird **innerhalb eines Segments**: tauschen, auswürfeln, auf eine Variante umschalten,
entfernen, Plandauer ändern, umsortieren, einfügen. Das Zeitgerüst selbst — Segmentnamen,
Minutenlängen, die Phasenfolge — bleibt Sache des Generators.

## User Stories

- Als Übungsleiter möchte ich **eine einzelne Übung austauschen**, die nicht zu meiner Gruppe
  passt, ohne den ganzen Plan neu würfeln zu müssen, damit die drei Übungen, die passen,
  erhalten bleiben
- Als Übungsleiter möchte ich **selbst eine Übung aussuchen**, die ich aus Erfahrung an dieser
  Stelle einsetzen will, auch wenn der Generator sie nicht vorgeschlagen hat, damit meine
  Erfahrung mehr zählt als der Filter
- Als Übungsleiter möchte ich **einen bewusst frei gelassenen Abschnitt nachträglich füllen**,
  damit ich eine Einheit als Gerüst generieren und sie dann mit meinen eigenen Übungen ausbauen
  kann
- Als Übungsleiter möchte ich **eine Lücke schließen**, die der Generator nicht füllen konnte,
  damit aus einem halben Vorschlag eine brauchbare Stunde wird
- Als Übungsleiter möchte ich **die Plandauer einer Übung anpassen**, weil ich aus Erfahrung
  weiß, dass das Aufwärmspiel bei dieser Gruppe zehn und nicht fünf Minuten braucht
- Als Übungsleiter möchte ich **die Reihenfolge innerhalb eines Abschnitts ändern**, damit die
  ruhige Übung ans Ende und die laute an den Anfang kommt
- Als Übungsleiter möchte ich **eine fehlende Übung an Ort und Stelle schnell anlegen können**,
  damit ein spontanes Abschlussspiel im Plan steht und nächste Woche wieder zur Verfügung steht
  — ohne dass ich mitten in der Planung in die Übungsverwaltung abbiegen muss
- Als Übungsleiter möchte ich **eine gespeicherte Einheit nachschärfen**, ohne dass eine zweite
  Fassung daneben entsteht, damit meine Übersicht nicht zuwächst
- Als Übungsleiter möchte ich **einen Fehlgriff zurücknehmen können**, damit ich gefahrlos
  ausprobieren kann

## Funktionsumfang

### Betreten und Verlassen

| | |
|---|---|
| **Betreten** | Knopf „Bearbeiten" im Kopf der Detailseite. Verfügbar für Entwürfe **und** für gespeicherte Einheiten |
| **Verlassen** | „Fertig" bei unveränderter Einheit. Bei offenen Änderungen eine Nachfrage „Änderungen speichern?" mit den drei Wegen Speichern / Verwerfen / Abbrechen — auch beim Wegnavigieren und beim Schließen des Browserfensters |
| **Zustand** | Offene Änderungen leben nur im Browser. Ein Neuladen verwirft sie (siehe Produktentscheidungen) |

### Die sieben Operationen

| Operation | Verhalten |
|---|---|
| **Neu auswürfeln** | Zieht eine andere Übung aus dem Kandidatenpool desselben Segments. Ausgeschlossen: alles, was in dieser Einheit schon steht, und alles, was in diesem Platz bereits weggewürfelt wurde. Der Platz behält seine Minuten |
| **Selbst wählen** | Dialog mit Suche. Oben die passenden Kandidaten des Segments, darunter aufklappbar „auch unpassende anzeigen" — jede mit der Begründung, woran sie scheitert. Der Platz behält seine Minuten |
| **Variante umschalten** | Bei einer Übung mit Varianten lässt sich zwischen Hauptübung und jeder Variante umschalten. Material, Beschreibung und Dauer der Variante gelten dann (die gemeinsame Auflösung aus PROJ-6) |
| **Entfernen** | Der Eintrag verschwindet, die Minuten werden im Segment frei und als Lücke ausgewiesen |
| **Plandauer ändern** | Frei einstellbar, mindestens 1 Minute. Die Schätzdauer der Übung steht als Hinweis daneben und bleibt unberührt |
| **Umsortieren** | Hoch/Runter je Eintrag, innerhalb des Segments. Beim ersten Eintrag ist „hoch" aus, beim letzten „runter" |
| **Einfügen** | „+ Übung einfügen" am Ende jedes Segments, zusätzlich direkt am Lückenhinweis und am Platzhalter einer gelöschten Übung. Öffnet denselben Auswahldialog |

### Schnell anlegen

Findet die Suche im Auswahldialog nichts Passendes, steht dort „Übung fehlt? Schnell anlegen":
Name, Dauer und eine kurze Beschreibung tippt der Nutzer, **Sportart, Phase, Schwierigkeit und
Altersgruppen sind aus dem Segment und der Gruppe vorbelegt**. Damit ist die neue Übung sofort
ein gültiger Kandidat und nicht nur ein Eintrag, der beim nächsten Generieren durch jeden Filter
fällt. Die Übung landet regulär in der Übungsdatenbank des Nutzers und wird direkt in den Platz
gesetzt.

Sie trägt dabei eine Markierung **„noch zu ergänzen"**, nach der die Übungsübersicht filtern
kann. Damit findet der Nutzer die dünn ausgefüllten Übungen später wieder, statt dass sie
zwischen den vollständigen untergehen — die App soll ihren richtigen Gebrauch beibringen, nicht
nur zulassen. Die Markierung verschwindet, sobald der Nutzer die Übung im regulären Formular
speichert. Sie ist ein Hinweis, keine Einschränkung: eine markierte Übung ist ein vollwertiger
Kandidat und wird überall normal eingesetzt.

### Segment-Notiz

Die Notiz jedes Segments ist im Bearbeiten-Modus änderbar. Sie ist der Ort für alles, was keine
Übung ist — Organisatorisches, Hinweise an sich selbst, der Grund, warum ein Abschnitt frei
bleibt.

### Was nicht aufgeht

Jedes Segment zeigt im Bearbeiten-Modus seinen Stand: „10 von 12 Min · 2 Min frei" oder
„15 von 12 Min · 3 Min über". Gespeichert werden darf trotzdem. Der Speichern-Dialog nennt die
betroffenen Segmente namentlich, damit die Abweichung eine Entscheidung ist und kein Versehen.

**Das ersetzt die bisherige Sperre.** Bis jetzt war der Speichern-Knopf bei einer Lücke
ausgegraut. Diese Sperre fällt weg — auch für frisch generierte Entwürfe, auch außerhalb des
Bearbeiten-Modus. Sie existierte, weil der Nutzer keine Handhabe hatte; jetzt hat er eine.

## Out of Scope

- **Übungen zwischen Segmenten verschieben** — anderes Interaktionsmodell (Ziehen über Grenzen),
  und die Filter des Zielsegments passen womöglich nicht zur Übung. Dasselbe Ergebnis erreicht
  der Nutzer über Entfernen und Einfügen. Kandidat für ein späteres Feature, wenn sich im
  Gebrauch zeigt, dass es gebraucht wird
- **Segmente anlegen, löschen, umbenennen oder ihre Länge ändern** — bleibt im Generator
  („Zurück zum Generator"). Zwei Masken für dasselbe Zeitgerüst würden auseinanderlaufen
- **Ziehen und Ablegen** zum Umsortieren — Hoch/Runter deckt den Normalfall von drei bis fünf
  Übungen je Segment ab und ist auf dem Handy treffsicher
- **„Als neue Einheit speichern" / Kopie anlegen** — überschneidet sich mit PROJ-17
  (Stundenmuster), das genau für wiederverwendbare Konfigurationen gedacht ist
- **Freitext-Einträge im Plan** (Text + Minuten ohne Übung dahinter) — würde eine zweite Art von
  Eintrag einführen, die PROJ-10, PROJ-14 und die Materialliste je gesondert behandeln müssten.
  Stattdessen: „Schnell anlegen" oder die Segment-Notiz
- **Rotation über Wochen beim Auswürfeln** — „diese Gruppe hatte das letzte Woche schon" gehört
  zu PROJ-10, das die Regel für Generator und Editor gemeinsam setzen soll
- **Nur passend lange Übungen zum Tausch anbieten** — würde die Auswahl bei einer kleinen
  Datenbank fast leer räumen
- **Versionsgeschichte einer Einheit** — Rückgängig gilt für die laufende Bearbeitung, nicht über
  das Speichern hinaus
- **Mehrere Einträge gleichzeitig bearbeiten** (Mehrfachauswahl, Sammelentfernen)
- **Einheit umbenennen, löschen** — steckt in PROJ-6 im Dreipunkt-Menü und bleibt dort
- **Varianten anlegen oder bearbeiten** — Sache der Übungsverwaltung (PROJ-3)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Bearbeiten-Modus betreten und verlassen

- [ ] Angenommen der Nutzer sieht eine Einheit, wenn er auf „Bearbeiten" klickt, dann erscheinen die Bedienelemente an jedem Eintrag und jedem Segment, und der Knopf wechselt zu „Fertig"
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus und hat nichts geändert, wenn er auf „Fertig" klickt, dann kehrt die Seite ohne Nachfrage in die Leseansicht zurück
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er auf „Fertig" klickt, dann erscheint eine Nachfrage „Änderungen speichern?" mit den Möglichkeiten Speichern, Verwerfen und Abbrechen
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er auf einen Link zu einer anderen Seite klickt, dann erscheint dieselbe Nachfrage, bevor die Seite verlassen wird
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er den Browser-Tab schließt, dann warnt der Browser vor dem Verlassen
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er in der Nachfrage „Abbrechen" wählt, dann bleibt er im Bearbeiten-Modus und alle Änderungen bleiben erhalten
- [ ] Angenommen eine Einheit ist nur ein Entwurf, wenn der Nutzer sie öffnet, dann steht „Bearbeiten" genauso zur Verfügung wie bei einer gespeicherten Einheit
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus, wenn die Einheit Segmente mit der Füllart „frei lassen" enthält, dann sind auch diese Segmente befüllbar

### Übung neu auswürfeln

- [ ] Angenommen ein Platz trägt eine Übung und das Segment hat weitere Kandidaten, wenn der Nutzer „neu auswürfeln" wählt, dann steht eine andere Übung im Platz und die Minutenzahl des Platzes ist unverändert
- [ ] Angenommen der Nutzer hat in einem Platz dreimal ausgewürfelt, wenn er ein viertes Mal auswürfelt, dann erscheint keine der drei vorher gezeigten Übungen erneut
- [ ] Angenommen eine Übung steht bereits in einem anderen Segment dieser Einheit, wenn der Nutzer auswürfelt, dann wird sie nicht vorgeschlagen
- [ ] Angenommen der Kandidatenvorrat eines Segments ist erschöpft, wenn der Nutzer auswürfelt, dann erscheint eine Meldung, die jede Ursache einzeln aufschlüsselt (Sportart, Schwierigkeit, Material, Altersgruppe, Teilnehmerzahl, bereits in der Einheit) mit der jeweiligen Anzahl
- [ ] Angenommen der Nutzer hat ausgewürfelt, wenn er „Rückgängig" wählt, dann steht die vorherige Übung wieder im Platz

### Übung selbst wählen

- [ ] Angenommen der Nutzer öffnet den Auswahldialog für ein Segment, wenn der Dialog erscheint, dann stehen oben die Übungen, die die Kriterien dieses Segments erfüllen, mit ihrer Anzahl im Titel
- [ ] Angenommen der Auswahldialog ist offen, wenn der Nutzer „auch unpassende anzeigen" aufklappt, dann erscheinen die übrigen Übungen, jede mit der Begründung, woran sie scheitert
- [ ] Angenommen der Nutzer wählt eine unpassende Übung, wenn er sie bestätigt, dann wird sie eingesetzt, ohne dass er einen weiteren Dialog bestätigen muss
- [ ] Angenommen der Auswahldialog ist offen, wenn der Nutzer einen Suchbegriff eingibt, dann wird in beiden Gruppen (passend und unpassend) gefiltert
- [ ] Angenommen ein Platz ist 5 Minuten lang, wenn der Nutzer eine auf 12 Minuten geschätzte Übung einsetzt, dann bleibt der Platz 5 Minuten lang und die Schätzung von 12 Minuten steht als Hinweis daneben
- [ ] Angenommen der Nutzer hat eine Übung ausgewählt, wenn er den Dialog erneut öffnet, dann ist die aktuell eingesetzte Übung als gewählt erkennbar

### Variante umschalten

- [ ] Angenommen ein Eintrag verweist auf eine Übung mit zwei Varianten, wenn der Nutzer das Umschalten öffnet, dann stehen die Hauptübung und beide Varianten zur Wahl
- [ ] Angenommen der Nutzer schaltet auf eine Variante um, wenn die Variante eigenes Material angibt, dann gilt das Material der Variante und nicht das der Hauptübung
- [ ] Angenommen eine Übung hat keine Varianten, wenn der Nutzer ihr Menü öffnet, dann wird das Umschalten nicht angeboten

### Entfernen, Dauer, Reihenfolge

- [ ] Angenommen ein Segment ist voll gefüllt, wenn der Nutzer einen Eintrag entfernt, dann weist das Segment die freigewordenen Minuten als Lücke aus
- [ ] Angenommen der Nutzer hat einen Eintrag entfernt, wenn er „Rückgängig" wählt, dann steht der Eintrag an seiner alten Stelle und mit seiner alten Plandauer wieder im Plan
- [ ] Angenommen ein Eintrag hat 5 Minuten Plandauer, wenn der Nutzer sie auf 8 ändert, dann zeigt das Segment seinen neuen Stand an und die Schätzdauer der Übung bleibt unverändert
- [ ] Angenommen der Nutzer gibt eine Plandauer von 0 oder einen negativen Wert ein, wenn er die Eingabe verlässt, dann wird auf die Mindestdauer von 1 Minute korrigiert und ein Hinweis gezeigt
- [ ] Angenommen ein Segment enthält drei Einträge, wenn der Nutzer beim mittleren „nach oben" wählt, dann steht er an erster Stelle und die Reihenfolge der übrigen bleibt erhalten
- [ ] Angenommen ein Eintrag steht an erster Stelle, wenn der Nutzer sein Menü öffnet, dann ist „nach oben" deaktiviert
- [ ] Angenommen ein Eintrag steht an letzter Stelle, wenn der Nutzer sein Menü öffnet, dann ist „nach unten" deaktiviert

### Lücken, Platzhalter und Einfügen

- [ ] Angenommen ein Segment hat 2 Minuten frei, wenn der Nutzer am Lückenhinweis „Übung einfügen" wählt, dann öffnet sich der Auswahldialog für dieses Segment
- [ ] Angenommen ein Segment war auf „frei lassen" gesetzt, wenn der Nutzer dort eine Übung einfügt, dann erscheint sie im Plan und das Segment weist seinen Füllstand aus
- [ ] Angenommen eine im Plan verwendete Übung wurde aus der Datenbank gelöscht, wenn der Nutzer den Bearbeiten-Modus öffnet, dann steht am Platzhalter „Übung gelöscht" eine Möglichkeit zum Nachbesetzen (auswürfeln oder selbst wählen)
- [ ] Angenommen der Nutzer besetzt einen Platzhalter nach, wenn die neue Übung eingesetzt ist, dann verschwindet der Platzhalter und die Minuten des Platzes bleiben unverändert
- [ ] Angenommen ein Segment ist vollständig gefüllt, wenn der Nutzer dort zusätzlich eine Übung einfügt, dann wird sie eingesetzt und das Segment weist die Überfüllung in Minuten aus

### Schnell anlegen

- [ ] Angenommen die Suche im Auswahldialog findet keine Treffer, wenn der Nutzer sucht, dann wird „Übung fehlt? Schnell anlegen" angeboten
- [ ] Angenommen der Nutzer öffnet „Schnell anlegen" aus einem Segment, wenn das Formular erscheint, dann sind Sportart, Phase, Schwierigkeit und Altersgruppen aus Segment und Gruppe vorbelegt
- [ ] Angenommen der Nutzer füllt Name, Dauer und Beschreibung aus, wenn er „Anlegen und einsetzen" wählt, dann steht die Übung in seiner Übungsdatenbank und im Platz
- [ ] Angenommen der Nutzer lässt den Namen leer, wenn er „Anlegen und einsetzen" wählt, dann erscheint eine Validierungsmeldung und die übrigen Eingaben bleiben erhalten
- [ ] Angenommen eine Übung mit demselben Namen existiert bereits, wenn der Nutzer sie schnell anlegen will, dann weist ein Hinweis darauf hin und bietet die vorhandene Übung zur Auswahl an
- [ ] Angenommen der Nutzer hat eine Übung schnell angelegt, wenn er die Nachfrage beim Verlassen mit „Verwerfen" beantwortet, dann bleibt die angelegte Übung in seiner Datenbank, nur der Einsatz im Plan wird verworfen
- [ ] Angenommen der Nutzer hat eine Übung schnell angelegt, wenn er die Übungsübersicht öffnet, dann ist sie als „noch zu ergänzen" erkennbar und über einen Filter auffindbar
- [ ] Angenommen eine Übung ist als „noch zu ergänzen" markiert, wenn der Nutzer sie im regulären Übungsformular speichert, dann verschwindet die Markierung
- [ ] Angenommen eine Übung ist als „noch zu ergänzen" markiert, wenn der Generator oder der Editor Kandidaten sucht, dann wird sie wie jede andere Übung behandelt und nicht benachteiligt

### Segment-Notiz

- [ ] Angenommen ein Segment hat eine Notiz, wenn der Nutzer im Bearbeiten-Modus darauf tippt, dann kann er sie ändern
- [ ] Angenommen ein Segment hat keine Notiz, wenn der Nutzer im Bearbeiten-Modus ist, dann wird ihm das Hinzufügen einer Notiz angeboten
- [ ] Angenommen der Nutzer leert eine Notiz vollständig, wenn er speichert, dann verschwindet die Notiz aus der Leseansicht ohne Fehlermeldung

### Speichern, Verwerfen, Rückgängig

- [ ] Angenommen der Nutzer hat drei Änderungen offen, wenn er in den Bearbeiten-Modus schaut, dann zeigt eine Leiste die Anzahl der offenen Änderungen und die Knöpfe Speichern, Verwerfen und Rückgängig
- [ ] Angenommen der Nutzer hat mehrere Änderungen gemacht, wenn er „Rückgängig" mehrfach wählt, dann wird Schritt für Schritt rückwärts bis zum Ausgangszustand zurückgenommen
- [ ] Angenommen der Nutzer ist beim Ausgangszustand angekommen, wenn er in die Leiste schaut, dann ist „Rückgängig" deaktiviert und es sind keine offenen Änderungen vermerkt
- [ ] Angenommen der Nutzer hat Änderungen offen, wenn er „Verwerfen" bestätigt, dann zeigt die Seite wieder den gespeicherten Zustand und die Einheit in der Datenbank ist unberührt
- [ ] Angenommen eine gespeicherte Einheit wird bearbeitet, wenn der Nutzer speichert, dann wird dieselbe Einheit überschrieben, behält ihren Namen und es entsteht keine zweite Einheit in der Übersicht
- [ ] Angenommen ein Entwurf wird bearbeitet, wenn der Nutzer speichert, dann wird nach einem Namen gefragt und die Einheit erscheint anschließend in den Übersichten
- [ ] Angenommen ein Segment geht nicht auf, wenn der Nutzer speichert, dann nennt der Dialog die betroffenen Segmente namentlich mit der Abweichung in Minuten und lässt das Speichern nach Bestätigung zu
- [ ] Angenommen alle Segmente gehen auf, wenn der Nutzer speichert, dann wird ohne zusätzliche Nachfrage gespeichert
- [ ] Angenommen eine Einheit hat eine Lücke, wenn der Nutzer sie außerhalb des Bearbeiten-Modus speichert, dann ist der Speichern-Knopf nicht mehr gesperrt, sondern der Dialog nennt die Lücke und verweist auf den Bearbeiten-Modus
- [ ] Angenommen der Nutzer hat gespeichert, wenn die Seite die Einheit neu lädt, dann steht die Markierung „manuell bearbeitet" an der Einheit
- [ ] Angenommen eine Einheit ist manuell bearbeitet und noch ein Entwurf, wenn der Nutzer „Neu generieren" wählt, dann warnt die bestehende Nachfrage vor dem Überschreiben der Änderungen
- [ ] Angenommen der Nutzer hat Übungen getauscht und gespeichert, wenn anschließend eine dieser Übungen gelöscht werden soll, dann nennt die Löschwarnung diese Einheit
- [ ] Angenommen der Nutzer hat eine Übung aus einer Einheit entfernt und gespeichert, wenn diese Übung danach gelöscht werden soll, dann wird die Einheit nicht mehr als Verwender genannt

### Fehlerfälle

- [ ] Angenommen das Speichern schlägt fehl, wenn der Nutzer speichert, dann erscheint eine Fehlermeldung, die Einheit bleibt im Bearbeiten-Modus und alle Änderungen bleiben erhalten
- [ ] Angenommen die Verbindung bricht beim Auswürfeln ab, wenn der Nutzer auswürfelt, dann erscheint eine Fehlermeldung und der Platz behält seine bisherige Übung
- [ ] Angenommen der Auswahldialog kann die Übungen nicht laden, wenn der Nutzer ihn öffnet, dann erscheint eine Fehlermeldung mit einer Möglichkeit zum erneuten Versuch
- [ ] Angenommen der Nutzer hat noch keine einzige Übung in seiner Datenbank, wenn er den Auswahldialog öffnet, dann erklärt ein leerer Zustand die Lage und bietet „Schnell anlegen" an

### Datentrennung

- [ ] Angenommen eine Einheit gehört einem anderen Nutzer, wenn jemand sie zu bearbeiten versucht, dann wird der Zugriff abgewiesen
- [ ] Angenommen eine Übung gehört einem anderen Nutzer, wenn jemand sie in seine Einheit einzusetzen versucht, dann wird der Schreibvorgang abgewiesen
- [ ] Angenommen niemand ist angemeldet, wenn die Bearbeiten-Seite aufgerufen wird, dann erfolgt eine Weiterleitung auf den Login

## Edge Cases

| # | Fall | Erwartetes Verhalten |
|---|------|----------------------|
| 1 | Der Nutzer entfernt **alle** Übungen eines Segments | Erlaubt. Das Segment steht als vollständige Lücke da und lässt sich wieder füllen. Kein Zwang, etwas drin zu lassen |
| 2 | Der Nutzer entfernt alle Übungen der **ganzen Einheit** | Erlaubt und speicherbar, mit Nennung aller leeren Segmente im Speichern-Dialog. Eine leere Einheit ist ein zulässiges Gerüst — genau das sieht PROJ-6 für „alle Segmente frei lassen" vor |
| 3 | Eine Übung wird in einem anderen Tab gelöscht, während hier bearbeitet wird | Beim Speichern erscheint der Platzhalter „Übung gelöscht" statt eines Fehlers; der Nutzer kann nachbesetzen. Das Speichern selbst scheitert nicht |
| 4 | Dieselbe Einheit wird in zwei Tabs bearbeitet und beide speichern | Das zweite Speichern gewinnt. Ein Hinweis, dass die Einheit zwischenzeitlich anderswo geändert wurde, wäre wünschenswert — siehe Offene Fragen |
| 5 | Der Nutzer würfelt in einem Segment aus, in dem es nur **einen** Kandidaten gibt | Meldung „keine weitere passende Übung" mit Aufschlüsselung; die Übung bleibt stehen. Kein stilles Nichts-Passiert |
| 6 | Der Nutzer setzt eine Plandauer, die größer ist als die Gesamtdauer der Einheit | Erlaubt, mit Ausweisung der Überfüllung. Keine künstliche Obergrenze, der Übungsleiter entscheidet |
| 7 | Der Nutzer setzt dieselbe Übung zweimal ein (einmal im Aufwärmen, einmal im Hauptteil), indem er sie beide Mal selbst auswählt | Erlaubt, mit einem Hinweis im Dialog, dass die Übung schon in dieser Einheit steht. Das Auswürfeln vermeidet es von selbst; die bewusste Wahl wird nicht blockiert |
| 8 | Das Browserfenster wird neu geladen, während Änderungen offen sind | Die Änderungen sind verloren. Der Browser warnt vorher (siehe Akzeptanzkriterien) |
| 9 | Der Nutzer legt eine Übung schnell an und verwirft danach seine Planänderungen | Die Übung bleibt in der Datenbank — sie wurde dort regulär angelegt. Nur der Einsatz im Plan wird verworfen. Der Verwerfen-Dialog sagt das |
| 10 | Eine Variante wird gelöscht, während sie im Plan steht | Wie bei einer gelöschten Übung: Platzhalter mit Möglichkeit zum Nachbesetzen |
| 11 | Der Nutzer ändert die Notiz eines Segments, sonst nichts | Zählt als Änderung, löst die Nachfrage beim Verlassen aus und setzt die Markierung „manuell bearbeitet" |
| 12 | Die Gruppe der Einheit wird gelöscht, während bearbeitet wird | Das Speichern scheitert mit einer verständlichen Meldung. PROJ-6 warnt beim Löschen einer Gruppe bereits vor den betroffenen Einheiten (BUG-1) |
| 13 | Der Nutzer würfelt aus, während ein anderes Auswürfeln noch läuft | Der zweite Klick wird ignoriert, solange der erste nicht beantwortet ist; der Knopf zeigt den laufenden Vorgang |
| 14 | Ein Segment enthält sehr viele Einträge (zwanzig und mehr) | Funktioniert, nur lang. Keine Obergrenze im MVP — siehe Offene Fragen |
| 15 | Die Einheit war über „Lockern" entstanden und trägt einen Lockerungs-Hinweis | Der Hinweis bleibt sichtbar und wird vom Bearbeiten nicht gelöscht; er beschreibt, wie der Vorschlag zustande kam |

## Technical Requirements (optional)

- **Verwendungsnachweise:** Jedes Speichern muss die Verwendungsnachweise der Einheit aus ihrem
  neuen Inhalt neu aufbauen (die Funktion dafür existiert aus PROJ-6). Sonst rechnet die
  Rotation in PROJ-10 falsch, und die Löschwarnung für Übungen nennt die falschen Einheiten
- **Wiederverwendung statt Nachbau:** Kandidatenpool, Filterregeln und die Aufschlüsselung der
  Lücke liegen aus PROJ-6 als eigenständige Bausteine vor und sind für genau diesen Zweck so
  getrennt worden. Der Editor darf die Regeln nicht zweitmals formulieren
- **Variantenauflösung:** Es gibt eine gemeinsame Stelle, die die effektiven Daten einer Variante
  berechnet. Der Editor nutzt sie
- **Zugriffsschutz:** Jeder Schreibvorgang prüft das Eigentum an Einheit **und** eingesetzter
  Übung. **BUG-4 aus PROJ-6 ist am 2026-10-06 geschlossen** — fünf Richtlinien auf `units`,
  `unit_items` und `exercise_usages` prüfen die Verweise jetzt in der Datenbank, auch auf dem
  UPDATE-Weg, den das Tauschen benutzt. Der Editor hat damit eine zweite Verteidigungslinie
  unter sich und muss sich nicht allein auf die Server Actions verlassen
- **Mobil zuerst:** Die Bedienelemente müssen mit dem Daumen auf einem Telefon treffbar sein.
  Umsortieren und Auswürfeln sind die Operationen, die in der Halle gebraucht werden
- **Tastatur und Screenreader:** Jede Operation ist ohne Maus erreichbar; Hoch/Runter tragen
  sprechende Beschriftungen
- **Antwortzeit:** Auswürfeln und Öffnen des Auswahldialogs unter 500 ms bei 100 Übungen
- **shadcn/ui zuerst:** Dialog, Dropdown-Menu, Alert-Dialog, Command (Suche), Collapsible und
  Input sind vorhanden und werden verwendet, nicht nachgebaut

## Open Questions

- [ ] **Soll ein Zwischenstand das Neuladen überleben?** Der Nutzer hat sich bewusst für
  „Änderungen erst beim Speichern" entschieden und den Verlust bei Absturz in Kauf genommen. Ob
  sich das Ablegen im Browser (localStorage) später lohnt, sollte sich im Gebrauch zeigen —
  nicht vorab auf Vermutung bauen
- [ ] **Soll ein Hinweis erscheinen, wenn die Einheit zwischenzeitlich anderswo geändert wurde?**
  Edge Case 4. Beim Solo-Nutzer selten, aber zwei Tabs auf demselben Telefon sind nicht
  ausgeschlossen. Entscheidung gehört in `/architecture`, weil sie an einem Änderungsstempel
  hängt
- [ ] **Braucht es eine Obergrenze für Einträge je Segment?** Edge Case 14. Ohne Erfahrungswert
  keine Zahl erfinden
- [ ] **Soll der Lückenhinweis das „Lockern" weiter anbieten**, jetzt wo der Nutzer die Lücke
  selbst füllen kann? Beides nebeneinander ist womöglich eine Wahl zu viel. Im Gebrauch
  beobachten
- [ ] **BUG-6 (Verwendungszeitpunkt steht auf „generiert")** — der Editor schreibt
  Verwendungsnachweise neu. Ob dabei ein sinnvoller Zeitpunkt entsteht oder BUG-6 gesondert
  behoben werden muss, klärt `/backend`

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Kernpaket: alles innerhalb eines Segments, nichts zwischen Segmenten | Verschieben über Segmentgrenzen ist ein anderes Interaktionsmodell und bringt den Konflikt mit, dass die Filter des Zielsegments nicht passen. Dasselbe Ergebnis erreicht der Nutzer über Entfernen und Einfügen | 2026-10-06 |
| Änderungen wirken erst beim Speichern, mit Rückgängig und Nachfrage beim Verlassen | Der Nutzer will gefahrlos ausprobieren. Der Preis — Verlust bei Absturz — ist bewusst in Kauf genommen; die Nachfrage beim Verlassen fängt den häufigen Fall ab | 2026-10-06 |
| Bearbeiten-Modus auf derselben Seite statt eigener `/edit`-Seite | Kein Seitenwechsel, der Nutzer verliert seine Position im langen Plan nicht. Weicht vom Muster bei Übungen und Gruppen ab — dort bearbeitet man ein Formular, hier einen Verlauf, den man beim Bearbeiten lesen muss | 2026-10-06 |
| Auswahlliste: passende zuerst, unpassende aufklappbar mit Begründung | Der Übungsleiter behält das letzte Wort über seine eigene Erfahrung, bekommt aber keine Wand aus Einträgen. Die Begründung je Übung lehrt gleichzeitig, wie die Auswahl funktioniert | 2026-10-06 |
| Der Platz behält beim Tausch seine Minuten | Ein schnelles „passt nicht, nächste" darf keine Aufräumarbeit nach sich ziehen. Die Schätzdauer steht als Hinweis daneben, so wie die Leseansicht es schon tut | 2026-10-06 |
| Nicht aufgehende Segmente werden angezeigt, das Speichern bleibt erlaubt | Im Editor ist die Abweichung eine Entscheidung des Übungsleiters, kein Versagen des Generators. Ein Puffer am Ende oder eine überzogene Hauptphase sind legitime Planung | 2026-10-06 |
| Die Lücken-Sperre aus PROJ-6 fällt ganz weg, auch außerhalb des Editors | Zwei Regeln für dieselbe Einheit, je nachdem wie man sie betritt, wären nicht erklärbar. Die Sperre existierte, weil der Nutzer keine Handhabe hatte — jetzt hat er eine, und der Hinweis verweist sinnvoll aufs Bearbeiten statt in den Generator zurück | 2026-10-06 |
| Eine gespeicherte Einheit wird an ihrer Stelle geändert | Das ist der Zweck: den Plan für nächsten Mittwoch feinschleifen, nicht einen zweiten daneben legen. Der Unterschied zu „Neu generieren" ist vertretbar — dort wirft der Würfel alles neu, hier ändert der Nutzer gezielt und sieht vorher genau was | 2026-10-06 |
| Damit löst sich der Widerspruch, den PROJ-6 beim „Lockern" gespeicherter Einheiten offengelassen hat | `relaxSegment` ändert eine gespeicherte Einheit an ihrer Stelle. Das war unstimmig, solange nur „Neu generieren" als Vergleich dastand. Mit dem Editor ist „an ihrer Stelle ändern" die Regel und „Neu generieren" die Ausnahme | 2026-10-06 |
| Segmentnamen, Minuten und Phasenfolge bleiben im Generator | Das Zeitgerüst an zwei Stellen zu pflegen würde auseinanderlaufen, und der Editor müsste Regeln nachbauen, die der Generator schon trägt (Mindestlänge, Summe gleich Gesamtdauer) | 2026-10-06 |
| Segment-Notiz ist im Editor änderbar | Sie ist der Ort für alles, was keine Übung ist, und trägt bei einem bewusst frei gelassenen Abschnitt die eigentliche Information | 2026-10-06 |
| „Schnell anlegen" im Auswahldialog statt Sprung in den Übungs-Wizard | PROJ-6 hat „Übung anlegen" aus dem Lückenhinweis entfernt, weil der Sprung den Nutzer aus seiner Aufgabe reißt. Das Bedürfnis bleibt aber. Ein kurzes Formular an Ort und Stelle löst beides | 2026-10-06 |
| Schnell angelegte Übungen bekommen Sportart, Phase, Schwierigkeit und Altersgruppen aus Segment und Gruppe vorbelegt | Sonst entstünde eine Übung, die beim nächsten Generieren durch jeden Filter fällt — ein stiller Fehler, den der Nutzer nicht zuordnen könnte | 2026-10-06 |
| Schnell angelegte Übungen tragen die Markierung „noch zu ergänzen", filterbar in der Übungsübersicht | Sonst sammeln sich über die Zeit dünn ausgefüllte Einträge, die der Nutzer nicht wiederfindet. Kostet eine Erweiterung an PROJ-3, wurde aber bewusst jetzt entschieden: später nachgerüstet wären es eine zweite Migration und ein erneuter Eingriff in eine ausgelieferte Maske. Die Markierung ist ein Hinweis, keine Einschränkung — als Kandidat gilt die Übung voll | 2026-10-06 |
| Kein Freitext-Eintrag im Plan | Eine zweite Art von Eintrag müssten Rotation (PROJ-10), Live-Modus (PROJ-14) und Materialliste je gesondert behandeln. „Schnell anlegen" deckt dasselbe Bedürfnis ab und baut dabei die Übungsdatenbank aus — ein Erfolgskriterium des Produkts | 2026-10-06 |
| Auswürfeln vermeidet alles, was in der Einheit steht, und alles im Platz bereits Weggewürfelte | Jeder Klick muss wirklich etwas Neues bringen, sonst wirkt der Knopf kaputt. Und eine Übung zweimal in einer Stunde wäre genau der Fehler, den der Generator vermeidet | 2026-10-06 |
| Eine bewusst zweimal ausgewählte Übung wird dagegen zugelassen | Beim Auswürfeln ist eine Wiederholung ein Fehler, bei der eigenen Wahl eine Absicht. Ein Hinweis genügt | 2026-10-06 |
| Rotation über Wochen gehört nicht hierher | PROJ-10 soll die Regel für Generator und Editor gemeinsam setzen. Vorzuziehen hieße, sie später an zwei Stellen zu haben | 2026-10-06 |
| Hoch/Runter statt Ziehen und Ablegen | Auf dem Handy in der Halle treffsicher, mit Tastatur und Screenreader ohne Zusatzarbeit bedienbar, kein weiteres Paket. Bei drei bis fünf Übungen je Segment — dem Normalfall — reicht es. Damit ist auch die offene Frage aus PROJ-6 beantwortet, ob der Zeitverlauf-Baustein PROJ-7 tragen muss: er muss nicht | 2026-10-06 |
| Kein „als neue Einheit speichern" | Überschneidet sich mit PROJ-17 (Stundenmuster), das für wiederverwendbare Konfigurationen gedacht ist. Zwei Wege zum selben Ziel würden beide halb benutzt | 2026-10-06 |
| BUG-5 wird hier behoben | Der Platzhalter „Übung gelöscht" ohne Möglichkeit zum Nachbesetzen war von PROJ-6 ausdrücklich hierher verwiesen | 2026-10-06 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| — | — | — |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
