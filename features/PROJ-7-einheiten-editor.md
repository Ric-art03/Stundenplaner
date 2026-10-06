# PROJ-7: Einheiten-Editor

## Status: In Progress
**Created:** 2026-10-06
**Last Updated:** 2026-10-07

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

### Am 2026-10-07 in `/architecture` entschieden

- [x] **Soll ein Hinweis erscheinen, wenn die Einheit zwischenzeitlich anderswo geändert wurde?**
  **Ja.** Die Einheit trägt schon einen Änderungsstempel, der bei jeder Änderung von selbst
  nachgezogen wird — es muss nichts Neues gebaut werden. Der Bearbeiten-Modus merkt sich den
  Stempel, den er beim Öffnen gesehen hat, und bringt ihn beim Speichern mit. Weicht er ab, wird
  nicht stillschweigend überschrieben, sondern nachgefragt. Siehe Tech Design, Abschnitt „Zwei
  Tabs auf derselben Einheit"

### Weiter offen

- [ ] **Soll ein Zwischenstand das Neuladen überleben?** Unverändert offen und bewusst so: der
  Nutzer hat den Verlust bei Absturz in Kauf genommen. Das Design hält die Tür auf — die offenen
  Änderungen liegen als **ein** zusammenhängender Stand im Browser und nicht verstreut über die
  Oberfläche, also wäre ein späteres Ablegen in `localStorage` eine Ergänzung an einer Stelle und
  kein Umbau
- [ ] **Braucht es eine Obergrenze für Einträge je Segment?** Unverändert offen. Nichts im Entwurf
  bricht bei zwanzig Einträgen, es wird nur lang
- [ ] **Soll der Lückenhinweis das „Lockern" weiter anbieten?** Unverändert offen, im Gebrauch zu
  beobachten. Der Entwurf stellt „Übung einfügen" **neben** „Lockern", nimmt also keines von
  beiden weg — das lässt sich ohne Umbau wieder ändern
- [ ] **BUG-6 (Verwendungszeitpunkt steht auf „generiert")** — bleibt bei `/backend`. Der Editor
  baut die Verwendungsnachweise bei jedem Speichern neu auf; ob dabei ein sinnvoller Zeitpunkt
  entsteht, entscheidet sich an der Stelle, die sie schreibt
- [ ] **Soll die Markierung „noch zu ergänzen" auch von Hand gesetzt werden können?** Neu
  aufgekommen: die Markierung entsteht beim Schnell-Anlegen und verschwindet beim regulären
  Speichern. Ein Nutzer könnte sie auch selbst an eine halbfertige Übung hängen wollen. Nicht in
  diesem Feature — erst im Gebrauch zeigen lassen, ob das Bedürfnis da ist

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
| Die offenen Änderungen liegen als **ein** Stand im Browser, nicht als Einzelzustände an den Karten | „Drei offene Änderungen", „Rückgängig" und die Nachfrage beim Verlassen brauchen alle dieselbe Antwort auf die Frage „was ist anders als beim Öffnen". Verteilt über zwanzig Karten wäre jede dieser drei Anzeigen eine eigene Rechnung — und drei Rechnungen laufen auseinander | 2026-10-07 |
| Die sieben Operationen sind reine Umformungen dieses Stands, getrennt von der Oberfläche | Jede Operation ist damit für sich prüfbar — ohne Browser, ohne Klick, ohne Datenbank. Bei sieben Operationen mal Lücken, Platzhaltern und Varianten ist das der Unterschied zwischen Tests, die man schreibt, und Tests, die man sich spart | 2026-10-07 |
| „Rückgängig" merkt sich die vorigen Stände, nicht die Gegen-Operationen | Für jede der sieben Operationen eine Umkehrung zu schreiben hieße, vierzehn Dinge richtig zu haben statt sieben. Der Preis ist Speicher für ein paar Dutzend Pläne — nicht messbar | 2026-10-07 |
| Das Speichern läuft als **eine** Datenbank-Operation, über eine eigene Datenbank-Funktion | Anders als beim „Lockern" sind nicht ein Segment, sondern alle betroffen. Löschen und Einfügen in Einzelschritten würde bei einem Abbruch mitten im Vorgang den ganzen Plan leer zurücklassen, und der Nutzer müsste ihn von Hand neu aufbauen. Entweder vollständig oder gar nicht ist hier die einzige vertretbare Zusage | 2026-10-07 |
| Die Eigentumsprüfung sitzt in derselben Datenbank-Operation und meldet einen Fehlschlag laut | Ein Schreibvorgang, der keine Zeile trifft, darf nicht als Erfolg zurückkommen — genau das ist BUG-16 am bestehenden `saveUnit`. Der neue Weg macht den Fehler von Anfang an nicht | 2026-10-07 |
| Beim Speichern eines Segments werden seine Einträge vollständig ersetzt, nicht abgeglichen | Die Kennungen der Einträge werden nirgends sonst verwiesen, ein Abgleich brächte also keinen Gewinn und drei Fehlerquellen (verschoben, ersetzt, entfernt). Innerhalb einer Datenbank-Operation ist Ersetzen gefahrlos | 2026-10-07 |
| Der Änderungsstempel der Einheit dient als Hinweis auf fremde Änderungen, nicht als Sperre | Der Stempel existiert bereits und wird von selbst nachgezogen. Als Sperre würde er einen Fall erzwingen, den der Solo-Nutzer fast nie hat; als Hinweis kostet er einen Vergleich und fängt die zwei Tabs auf demselben Telefon ab | 2026-10-07 |
| Die Kandidaten eines Segments werden einmal geladen und für die Dauer des Bearbeiten-Modus behalten | Ausgewürfelt wird in der Halle, oft mehrmals hintereinander. Jeder Würfel über den Server wäre jedes Mal eine Wartezeit an genau der Stelle, an der sie störte. Nach dem ersten Laden sind Würfeln, Dialog und Variantenwechsel ohne Wartezeit — die 500-ms-Vorgabe ist damit mit Abstand erfüllt | 2026-10-07 |
| Welche Kriterien eine Übung verfehlt, rechnet der **Server** aus, einmal je Segment | Die Regeln liegen als Kriterienliste im Generator und sollen dort bleiben. Der Browser bekommt das Ergebnis — „passt" oder „scheitert an Material und Altersgruppe" — und nicht die Regeln. Damit gibt es die Filterregeln weiter nur einmal, und der Pool der Übungen wird nicht komplett in den Browser geschoben | 2026-10-07 |
| Der Browser erhält eine schlanke Fassung der Kandidaten, nicht die vollen Übungen | Für Liste, Suche und Würfeln braucht er Name, Dauer, Variantentitel, eine Materialzeile und die Eignung. Beschreibungen, Bilder, Links und Notizen bleiben auf dem Server — sie wären der größte Teil der Daten und werden nicht gebraucht | 2026-10-07 |
| Varianten sind in dieser Liste eigene Einträge, wie im Generator | Dadurch ist „auf Variante umschalten" nur das Greifen des Geschwister-Eintrags derselben Übung — kein zweiter Ladeweg, keine zweite Auflösung der effektiven Variantendaten | 2026-10-07 |
| Eine schnell angelegte Übung wird sofort in die Datenbank geschrieben, nicht mit dem Plan | Die Spec verlangt, dass sie beim Verwerfen der Planänderungen bestehen bleibt. Das geht nur, wenn ihr Anlegen nicht am Speichern des Plans hängt. Sie wird über denselben Weg angelegt wie jede andere Übung und bekommt nur die Markierung dazu | 2026-10-07 |
| Die Markierung „noch zu ergänzen" ist ein eigenes Merkmal an der Übung, nicht aus den Feldern erraten | Aus „kein Material und keine Altersgruppe" zu schließen, eine Übung sei unfertig, würde vollständig gepflegte Übungen fälschlich markieren und wäre nicht abschaltbar. Ein gesetztes Merkmal ist eindeutig, filterbar und verschwindet an genau einer Stelle wieder | 2026-10-07 |
| Ein Segment auf „frei lassen" behält diese Einstellung, auch wenn der Nutzer es füllt | Die Einstellung hält fest, was im Generator gewählt wurde — „Zurück zum Generator" muss die Maske so öffnen, wie der Nutzer sie verlassen hat. Was die Leseansicht zeigt, hängt künftig daran, ob Einträge **da** sind, nicht an der Einstellung | 2026-10-07 |
| Die Lückenbegründung des Generators wird beim Speichern für jedes geänderte Segment verworfen | Sie beschreibt den Versuch des Generators. Hat der Nutzer das Segment selbst umgebaut, beschreibt sie den Stand nicht mehr — und ein Grund, der nicht mehr stimmt, ist schlechter als keiner. Die Füllstandszeile trägt die Information dann | 2026-10-07 |
| Die Nachfrage beim Wegnavigieren hängt an den Links der Seite, nicht am Router | Next.js bietet für den App-Router keine Abfangstelle für Seitenwechsel. Ein Mithören auf Klicks auf Verweise deckt alle Ausgänge ab, die der Nutzer tatsächlich benutzt — Kopfzeilen-Navigation, „Zurück zum Generator", die Verweise in den Übungskarten — ohne auf eine fehlende Schnittstelle zu warten. Browser-Zurück und Fenster-Schließen gehen über die Warnung des Browsers | 2026-10-07 |
| Kein neues Paket | Umsortieren über Hoch/Runter (Produktentscheidung) nimmt den einzigen Grund weg, ein Ziehen-und-Ablegen-Paket aufzunehmen. Alles Übrige deckt der vorhandene Baukasten ab | 2026-10-07 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-10-07

### Die Grundidee in drei Sätzen

Der Editor ist ein zweiter Zustand derselben Seite. Solange er offen ist, arbeitet der Nutzer an
einer **Arbeitsfassung des Plans, die nur in seinem Browser existiert** — jede der sieben
Operationen ändert diese Fassung, nicht die Datenbank. Erst „Speichern" schickt die fertige
Fassung in einem Zug an den Server, der sie als eine einzige, nicht teilbare Datenbank-Operation
ablegt.

Daraus folgt fast alles Übrige: „Rückgängig", „Verwerfen", die Zählung der offenen Änderungen und
die Nachfrage beim Verlassen sind alle Blicke auf dieselbe Arbeitsfassung. Und das Auswürfeln
braucht keinen Server, wenn die Kandidaten einmal im Browser liegen.

### A) Komponentenstruktur

Die Leseansicht bleibt, wie sie ist. Was neu entsteht, hängt sich **daneben**, nicht hinein.

```
/units/[id]  (Seite, lädt die Einheit)
└── Stundenplan-Ansicht                        [vorhanden, wird erweitert]
    ├── Kopfbereich                            [vorhanden]
    │   ├── Titel, Dauer, Gruppe
    │   ├── „Bearbeiten" / „Fertig"            NEU
    │   ├── Dreipunkt-Menü (umbenennen, löschen)
    │   └── „Einheit speichern" (Entwurf)      [vorhanden, Sperre entfällt]
    │
    ├── Änderungsleiste                        NEU  — nur im Bearbeiten-Modus
    │   └── „3 offene Änderungen" · Rückgängig · Verwerfen · Speichern
    │
    ├── Lockerungs-Hinweis                     [vorhanden, unverändert]
    │
    └── Segmentliste
        └── Segment-Block                      [vorhanden, wird erweitert]
            ├── Segmentkopf: Name · Minuten
            │   └── Füllstandszeile            NEU  — „10 von 12 Min · 2 Min frei"
            ├── Segment-Notiz                  [vorhanden: Text]
            │   └── Notizfeld                  NEU  — im Bearbeiten-Modus änderbar
            ├── Eintrags-Karte                 [vorhanden, Leseansicht unverändert]
            │   └── Bedienzeile am Eintrag     NEU  — nur im Bearbeiten-Modus
            │       ├── Plandauer-Feld         NEU  — Minuten, mind. 1, Schätzung daneben
            │       ├── Hoch / Runter          NEU  — erstes/letztes deaktiviert
            │       └── Eintrags-Menü          NEU  — Dropdown-Menu
            │           ├── Neu auswürfeln
            │           ├── Selbst wählen …
            │           ├── Variante umschalten …   (entfällt ohne Varianten)
            │           └── Entfernen
            ├── Platzhalter „Übung gelöscht"   [vorhanden]
            │   └── „Auswürfeln" / „Selbst wählen"  NEU  — behebt BUG-5
            ├── Lückenhinweis                  [vorhanden]
            │   └── „+ Übung einfügen"         NEU  — neben „Lockern"
            └── „+ Übung einfügen"             NEU  — am Segmentende

Dialoge (einmal für die ganze Seite, nicht je Eintrag)
├── Auswahldialog                              NEU
│   ├── Suchfeld
│   ├── „Passend (14)"              — Liste, aktueller Eintrag erkennbar
│   ├── „Auch unpassende anzeigen"  — aufklappbar, je Eintrag die Begründung
│   └── „Übung fehlt? Schnell anlegen"
│       └── Kurzformular            NEU  — Name, Dauer, Beschreibung
├── Variantenwahl                              NEU  — Hauptübung + alle Varianten
├── „Änderungen speichern?"                    NEU  — Speichern / Verwerfen / Abbrechen,
│                                                     nennt nicht aufgehende Segmente
├── „Anderswo geändert"                        NEU  — Neu laden / trotzdem überschreiben
└── Namensdialog                               [vorhanden, für Entwürfe]
```

**Warum die Dialoge einmal für die Seite und nicht je Eintrag:** ein Segment kann zwanzig
Einträge haben. Zwanzig Auswahldialoge im Hintergrund wären zwanzig Mal dieselbe Liste. Der Dialog
merkt sich stattdessen, für welchen Platz er geöffnet wurde.

### B) Datenmodell — was gespeichert wird

#### Was sich am Datenbestand ändert

| Was | Änderung | Warum |
|---|---|---|
| **Einheiten, Segmente, Einträge** | **Keine strukturelle Änderung.** Der Editor füllt die vorhandenen Felder anders, er braucht keine neuen | Das Zeitgerüst bleibt beim Generator; der Editor ändert nur Inhalte, die alle schon ihr Feld haben |
| **Übung** | **Ein neues Merkmal:** „noch zu ergänzen", ja oder nein, standardmäßig nein | Trägt die Markierung aus dem Schnell-Anlegen. Eine Erweiterung an PROJ-3, in der Spec bewusst vorgezogen |
| **Übungs-Filter** | Ein zusätzlicher Filter in der Übungsübersicht: „nur noch zu ergänzende" | Damit der Nutzer die dünn ausgefüllten Übungen wiederfindet |
| **Einheit, Markierung „manuell bearbeitet"** | Vorhanden, wird vom Speichern gesetzt | War für genau diesen Fall angelegt |
| **Änderungsstempel der Einheit** | Vorhanden, wird von selbst nachgezogen. Wird jetzt **gelesen** | Grundlage des Hinweises auf fremde Änderungen |
| **Verwendungsnachweise** | Keine strukturelle Änderung, werden bei jedem Speichern neu aufgebaut | Sonst rechnet die Rotation (PROJ-10) falsch und die Löschwarnung nennt die falschen Einheiten |
| **Eine neue Datenbank-Funktion** | Legt den geänderten Plan in einem Zug ab | Siehe „Wie gespeichert wird" |

Die Markierung „noch zu ergänzen" verschwindet an **einer** Stelle wieder: wenn die Übung über das
reguläre Formular gespeichert wird. Für Generator und Editor ist eine markierte Übung ein
vollwertiger Kandidat — die Markierung wird bei der Kandidatensuche gar nicht gelesen.

#### Die Arbeitsfassung im Browser

Solange der Bearbeiten-Modus offen ist, hält der Browser:

```
Arbeitsfassung
├── Je Segment
│   ├── Notiz (Text)
│   └── Liste der Plätze, in ihrer Reihenfolge
│       └── Je Platz
│           ├── welche Übung (und ob eine Variante davon)
│           ├── Plandauer in Minuten
│           └── welche Übungen hier schon weggewürfelt wurden
├── Der Ausgangszustand (wie die Einheit beim Öffnen war)
├── Die Kette der vorigen Stände   → trägt „Rückgängig"
└── Der Änderungsstempel beim Öffnen → trägt den Hinweis auf fremde Änderungen
```

Drei Dinge fallen daraus ab, ohne eigene Rechnung:

- **„3 offene Änderungen"** = Länge der Kette der vorigen Stände
- **„Rückgängig" deaktiviert** = Kette leer
- **Nachfrage beim Verlassen nötig** = Kette nicht leer

Die weggewürfelten Übungen hängen **am Platz**, nicht an der Einheit. Nur so bedeutet „dreimal
gewürfelt, keine Wiederholung" das, was die Spec verlangt: ein zweiter Platz im selben Segment
fängt bei null an.

**Was nicht in der Arbeitsfassung steht:** Segmentnamen, Minutenlängen, Phasenfolge, der
Lockerungs-Hinweis. Die liegen beim Generator und werden vom Speichern nicht angefasst.

### C) Wie gespeichert wird

Das Speichern schickt die ganze Arbeitsfassung in **einem** Aufruf an den Server. Dieser legt sie
als **eine nicht teilbare Datenbank-Operation** ab — in einem Schritt:

1. gehört die Einheit dem Angemeldeten? Gehört jede eingesetzte Übung ihm?
2. stimmt der mitgebrachte Änderungsstempel noch?
3. Einträge aller Segmente ersetzen, Notizen setzen, veraltete Lückenbegründungen verwerfen
4. Verwendungsnachweise aus dem neuen Inhalt neu aufbauen
5. „manuell bearbeitet" setzen, bei einem Entwurf zusätzlich Name und Aufnahme in die Übersichten

Entweder passiert das alles oder nichts davon. Das ist der Unterschied zum „Lockern", das heute in
Einzelschritten arbeitet: dort betrifft ein Abbruch ein Segment, hier den ganzen Plan.

Schlägt etwas fehl, bleibt die Seite im Bearbeiten-Modus und die Arbeitsfassung unangetastet — der
Nutzer kann es erneut versuchen, ohne etwas zu verlieren.

**Nebenbei behoben:** ein Schreibvorgang, der keine Zeile trifft, meldet auf diesem Weg keinen
Erfolg. Das ist BUG-16, allerdings nur für den neuen Weg; am bestehenden „Einheit speichern"
bleibt er offen und gehört weiter zu `/backend`.

### D) Woher die Übungen kommen

Beim **ersten** Auswürfeln oder Öffnen des Auswahldialogs in einem Segment holt die Seite einmal
die Kandidatenliste **dieses** Segments. Der Server liefert eine schlanke Fassung:

| Je Kandidat | Wofür |
|---|---|
| Name, geschätzte Dauer, Variantentitel | Liste und Suche |
| eine Materialzeile | damit der Nutzer vor dem Einsetzen sieht, was er braucht |
| passt / passt nicht | die Zweiteilung im Dialog |
| falls nicht: woran es scheitert | die Begründung je Eintrag |

Beschreibungen, Bilder, Links und Notizen bleiben auf dem Server. Danach laufen **alle** weiteren
Würfel, Dialoge und Variantenwechsel in diesem Segment ohne Server — unter 500 ms ist damit keine
Zielgröße mehr, sondern sofort.

**Wer rechnet was:** welche Kriterien eine Übung verfehlt, rechnet der Server aus — aus derselben
Kriterienliste, die der Generator benutzt. Der Browser bekommt das Ergebnis, nicht die Regeln.
Damit stehen die Filterregeln weiterhin an genau einer Stelle, so wie die Spec es verlangt.

**Das Auswürfeln selbst** zieht aus dieser Liste und lässt weg: was in der Einheit schon steht und
was in diesem Platz schon weggewürfelt wurde. Ist nichts mehr übrig, erscheint die Aufschlüsselung
der Ursachen, die der Generator schon formuliert — kein zweiter Satz von Meldungen.

**Preis dieser Entscheidung:** eine Übung, die während des Bearbeitens in einem anderen Tab
entsteht, taucht erst nach dem Verlassen des Bearbeiten-Modus auf. Eine schnell angelegte Übung
dagegen wird in die gemerkte Liste eingereiht und ist sofort da.

### E) Schnell anlegen

Das Kurzformular legt die Übung **sofort** in der Datenbank an — über denselben Weg wie das
reguläre Formular, nur mit weniger Feldern und der Markierung dazu. Vorbelegt werden Sportart,
Phase, Schwierigkeit und Altersgruppen aus Segment und Gruppe, damit die Übung ein gültiger
Kandidat ist und nicht beim nächsten Generieren durch jeden Filter fällt.

Weil sie sofort angelegt wird, bleibt sie erhalten, wenn der Nutzer seine Planänderungen verwirft
— genau wie die Spec es verlangt. Der Verwerfen-Dialog sagt das.

Den Namensabgleich („gibt es die schon?") macht der Server beim Anlegen, nicht der Browser: die
gemerkte Kandidatenliste enthält nur die Übungen, die zu **diesem** Segment gehören, eine
Namensgleiche könnte also außerhalb liegen.

### F) Zwei Tabs auf derselben Einheit

Der Bearbeiten-Modus merkt sich den Änderungsstempel, den er beim Öffnen gesehen hat, und bringt
ihn beim Speichern mit. Weicht er ab, wird nicht geschrieben, sondern gefragt: **Neu laden** (die
eigenen Änderungen sind dann verloren, das sagt der Dialog) oder **trotzdem überschreiben**.

Das ist ein Hinweis, keine Sperre. Er greift bei Änderungen, die über die App selbst liefen — und
das sind alle, die es gibt.

### G) Nachfrage beim Verlassen

Drei Ausgänge, drei Mittel:

| Ausgang | Mittel |
|---|---|
| „Fertig" oder „Verwerfen" | der eigene Dialog der Seite |
| Ein Verweis auf eine andere Seite — Kopfzeile, „Zurück zum Generator", die Verweise in den Übungskarten | die Seite hört auf Klicks auf Verweise und hält den Wechsel an, solange Änderungen offen sind |
| Browser-Zurück, Neuladen, Tab schließen | die eingebaute Warnung des Browsers |

Der mittlere Weg ist nötig, weil Next.js für den App-Router keine Stelle anbietet, an der sich ein
Seitenwechsel abfangen ließe. Auf Klicks zu hören deckt alle Ausgänge ab, die der Nutzer wirklich
benutzt, und kommt ohne Warten auf eine fehlende Schnittstelle aus.

### H) Was an Vorhandenem angefasst wird

| Ort | Änderung | Grund |
|---|---|---|
| Stundenplan-Ansicht | Zweiter Zustand, Änderungsleiste, Dialoge | Der Editor ist ein Modus dieser Seite |
| Segment-Block | Füllstandszeile, änderbare Notiz, Einfügen-Knöpfe | |
| Eintrags-Karte | Leseansicht **unverändert**; die Bedienzeile kommt daneben | Die Leseansicht trägt später den Live-Modus und bleibt ruhig |
| Platzhalter „Übung gelöscht" | Nachbesetzen möglich | **BUG-5** |
| Lückenhinweis | „+ Übung einfügen" neben „Lockern" | |
| „Einheit speichern" | **Sperre bei Lücken entfällt**, stattdessen Nachfrage mit Nennung der Segmente | Produktentscheidung; gilt auch außerhalb des Bearbeiten-Modus |
| Leseansicht frei gelassener Segmente | zeigt Einträge, sobald welche da sind — nicht mehr pauschal „— Lücke —" | Ein selbst gefülltes „frei lassen"-Segment muss seinen Inhalt zeigen |
| Übung anlegen / ändern | Markierung setzen bzw. beim regulären Speichern löschen | |
| Übungsübersicht und Filter | Markierung sichtbar, Filter dafür | |
| Kriterienprüfung im Generator | wird so geöffnet, dass sie **je Kandidat** Auskunft gibt, nicht nur je Kriterium zählt | Für die Begründung im Dialog. Keine neue Regel, dieselbe Liste |

### I) Pakete

**Keine neuen.** Alles Benötigte ist vorhanden:

| Baustein | Wofür |
|---|---|
| Dialog | Auswahldialog, Variantenwahl |
| Alert-Dialog | „Änderungen speichern?", „Anderswo geändert" |
| Dropdown-Menu | Eintrags-Menü |
| Command | Suche im Auswahldialog |
| Collapsible | „Auch unpassende anzeigen" |
| Input, Textarea, Badge, Button | Plandauer, Notiz, Markierung, Bedienelemente |
| Toast | Fehlermeldungen, Bestätigungen |
| Zod | Prüfung der Arbeitsfassung auf dem Server |

Ziehen und Ablegen hätte ein Paket gekostet — die Produktentscheidung für Hoch/Runter nimmt diesen
Grund weg.

### J) Mobil, Tastatur, Screenreader

Die Bedienelemente sitzen in einer Zeile unter dem Eintrag, nicht in einer schmalen Spalte
daneben: auf dem Telefon ist das der Unterschied zwischen treffbar und nicht treffbar. Hoch und
Runter sind eigene Knöpfe mit sprechenden Beschriftungen („Nach oben, derzeit Platz 2 von 4"), das
Übrige liegt im Menü. Alles ist mit der Tastatur erreichbar, weil keines der verwendeten Elemente
eigene Mausgesten braucht.

### K) Reihenfolge des Bauens

Diese Reihenfolge hält den Stand jederzeit prüfbar — jeder Schritt ist für sich testbar, bevor der
nächste darauf aufsetzt.

1. **Arbeitsfassung und die sieben Operationen** als reine Umformungen, mit Tests. Keine
   Oberfläche, keine Datenbank. Hier steckt die Logik, die später schwer nachzuprüfen wäre
2. **Datenbank:** Merkmal „noch zu ergänzen", Funktion für das Speichern
3. **Serverseite:** Kandidatenliste je Segment, Speichern, Schnell-Anlegen
4. **Oberfläche:** Bearbeiten-Modus, Änderungsleiste, Bedienelemente, Füllstand, Notiz
5. **Dialoge:** Auswahl mit Begründungen, Variantenwahl, Schnell-Anlegen
6. **Ränder:** Nachfrage beim Verlassen, Hinweis auf fremde Änderungen, Platzhalter-Nachbesetzen
   (BUG-5), Wegfall der Lücken-Sperre

Schritt 2 betrifft die Datenbank und läuft über den SQL-Editor des Dashboards, mit Eintrag im
Migrationsregister — so wie es am 2026-10-06 festgelegt wurde.

### L) Was dieses Design offen lässt

- **Der Zwischenstand überlebt kein Neuladen.** Bewusst so. Weil die offenen Änderungen als ein
  zusammenhängender Stand vorliegen, wäre ein späteres Ablegen im Browser eine Ergänzung an einer
  Stelle
- **Die gemerkte Kandidatenliste veraltet**, wenn parallel in einem anderen Tab Übungen entstehen.
  Betrifft nur das laufende Bearbeiten
- **Keine Obergrenze für Einträge je Segment.** Nichts bricht, es wird nur lang
- **BUG-16 bleibt am bestehenden „Einheit speichern"** offen; der neue Speicherweg hat das Problem
  nicht

## Implementation Notes (Frontend)

**Stand:** 2026-10-07 · Typprüfung, Lint und Produktionsbuild sauber · **342 Unit-Tests grün**
(249 aus PROJ-6 plus 93 neue)

Gebaut nach der Reihenfolge aus dem Tech Design: zuerst die Logik als reine Umformungen mit
Tests, danach die Oberfläche.

### Neu: die Logik (ohne Oberfläche, ohne Datenbank)

| Datei | Was drin liegt | Tests |
|---|---|---|
| `src/lib/units/draft.ts` | Die Arbeitsfassung und die sieben Operationen als reine Umformungen. Dazu Füllstand, Ausschlüsse beim Auswürfeln und der Vergleich zweier Stände | 54 |
| `src/lib/units/draft-history.ts` | Ausgangszustand, aktueller Stand, Kette der vorigen Stände. Trägt Rückgängig, Verwerfen, die Anzahl der offenen Änderungen | 15 |
| `src/lib/units/editor-pool.ts` | Die schlanke Kandidatenfassung (`EditorCandidate`), das Auswürfeln, die Zweiteilung für den Auswahldialog, die Variantenliste | 24 |

Die Arbeitsfassung trägt **bewusst keine** Segmentnamen, Minutenlängen und Phasenfolge. Dass sie
fehlen, setzt die Regel „das Zeitgerüst bleibt beim Generator" durch, statt sie nur zu behaupten:
die Oberfläche legt die Arbeitsfassung über die geladene Einheit und nimmt den Rahmen von dort.

### Neu: die Oberfläche

| Datei | Was es ist |
|---|---|
| `src/hooks/use-unsaved-changes.ts` | Die Nachfrage beim Verlassen: Browser-Warnung plus Mithören auf Klicks auf Verweise |
| `src/components/units/unit-item-controls.tsx` | Die Bedienzeile am Eintrag: Plandauer, Hoch/Runter, Menü |
| `src/components/units/segment-fill-status.tsx` | „10 von 12 Min · 2 Min frei" |
| `src/components/units/segment-note-field.tsx` | Die änderbare Segment-Notiz |
| `src/components/units/edit-change-bar.tsx` | Die Änderungsleiste, oben klebend |
| `src/components/units/save-changes-prompt.tsx` | Die Nachfrage vor dem Speichern, nennt nicht aufgehende Segmente namentlich |
| `src/components/units/discard-changes-dialog.tsx` | „Verwerfen", mit dem Hinweis auf schnell angelegte Übungen |
| `src/components/units/exercise-picker-dialog.tsx` | Der Auswahldialog mit allen vier Zuständen: lädt, Fehler mit erneutem Versuch, keine Übungen, keine Treffer |
| `src/components/units/variant-switch-dialog.tsx` | Variante umschalten |
| `src/components/units/quick-create-exercise-form.tsx` | „Schnell anlegen" im Auswahldialog |

### Geändert an Vorhandenem

- **`unit-plan-view.tsx`** — der Bearbeiten-Modus als zweiter Zustand, die ganze Verdrahtung, und
  der **Wegfall der Lücken-Sperre**: der Speichern-Knopf ist nicht mehr ausgegraut, der Hinweis
  verweist auf „Bearbeiten" statt in den Generator zurück
- **`unit-item-card.tsx`** — nimmt jetzt nur noch, was die Karte anzeigt. Dadurch rendern geladene
  Einträge und die im Editor eingesetzten durch dieselbe Karte. Am Platzhalter „Übung gelöscht"
  stehen im Bearbeiten-Modus „Auswürfeln" und „Selbst wählen" — **BUG-5 behoben**
- **`gap-notice.tsx`** — bekommt im Bearbeiten-Modus „Übung einfügen" neben „Lockern"
- **`candidates.ts` / `actions/units.ts`** — `candidateKey` liegt jetzt bei den Kandidaten und
  nicht zweimal. Der Editor merkt sich darüber, was an einem Platz weggewürfelt wurde

### Entscheidungen, die beim Bauen fielen

| Entscheidung | Begründung |
|---|---|
| Eine eingefügte Übung startet mit **ihrer Schätzdauer** als Plandauer | Beim Tausch behält der Platz seine Minuten, beim Einfügen gibt es keine, die er behalten könnte. Die Schätzung ist der einzige Wert, der nicht geraten ist. Dass damit ein volles Segment überfüllt werden kann, ist laut Spec zugelassen und wird ausgewiesen |
| Ein folgenloser Klick zählt **nicht** als offene Änderung | „Nach oben" am ersten Platz, dieselbe Plandauer erneut eingetragen, die schon eingesetzte Übung noch einmal gewählt. Sonst stünde „1 offene Änderung" da, und „Rückgängig" täte danach scheinbar nichts |
| Wegwürfeln und über Umwege zur ursprünglichen Übung zurück gilt als **unverändert** | Am Plan hat sich nichts geändert, also soll beim Verlassen nicht gefragt werden. Verglichen wird, was gespeichert würde — nicht, was der Nutzer unterwegs angeklickt hat |
| Ein Segment auf „frei lassen" **behält** diese Einstellung, auch wenn es gefüllt wird | Sie hält fest, was im Generator gewählt wurde, und „Zurück zum Generator" braucht sie unverändert. Was die Leseansicht zeigt, hängt jetzt daran, ob Einträge **da** sind |
| Der Lückenhinweis bleibt im Bearbeiten-Modus sichtbar | Seine Aufschlüsselung sagt, **warum** das Segment leer ist — das ist genau die Auskunft, die beim Füllen hilft. „Übung einfügen" steht daneben, „Lockern" bleibt. Die offene Frage, ob beides nebeneinander eine Wahl zu viel ist, bleibt damit offen und beobachtbar |
| Die Bedienzeile sitzt **unter** der Karte, nicht in einer Spalte daneben | Auf dem Telefon der Unterschied zwischen treffbar und nicht treffbar. Hoch/Runter liegen außerhalb des Menüs, weil sie in der Halle gebraucht werden |

### Was noch fehlt — alles davon ist `/backend`

Der Editor hat drei Stellen, an denen er den Server braucht. Sie sind als **ein** Vertrag
zusammengefasst — `UnitEditorActions` in `unit-plan-view.tsx` — und die Seite gibt ihn noch nicht
mit. Solange er fehlt, melden die betroffenen Knöpfe das ehrlich, statt ins Leere zu laufen:

1. **`loadPool(segmentId)`** — die Kandidatenliste eines Segments, mit der Eignung je Kandidat.
   Die Kriterienprüfung muss aus derselben Kriterienliste des Generators kommen, **nicht** neu
   formuliert werden
2. **`savePlan(draft, { expectedUpdatedAt, force, name? })`** — die eine nicht teilbare
   Datenbank-Operation. `stale: true` zurückgeben, wenn der Änderungsstempel abweicht; der Dialog
   dafür steht schon
3. **`quickCreate(segmentId, input)`** — Übung sofort anlegen, mit Vorbelegung und Markierung,
   samt Namensabgleich. Gibt den neuen Kandidaten zurück, damit er sich in die gemerkte Liste
   einreiht

Dazu an der Datenbank: das Merkmal **„noch zu ergänzen"** an der Übung, die Funktion fürs
Speichern, der Filter in der Übungsübersicht und das Löschen der Markierung beim regulären
Speichern einer Übung.

**Was schon ohne Server funktioniert und im Browser geprüft werden kann:** Bearbeiten-Modus
betreten und verlassen, Entfernen, Umsortieren, Plandauer samt Mindestdauer-Korrektur,
Segment-Notiz, Füllstandszeile, Rückgängig, Verwerfen, die Nachfrage beim Verlassen und beim
Schließen des Tabs, und der Wegfall der Lücken-Sperre.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
