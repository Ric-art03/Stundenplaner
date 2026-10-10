# PROJ-7: Einheiten-Editor

## Status: Deployed
**Created:** 2026-10-06
**Last Updated:** 2026-10-10

> **Überarbeitet am 2026-10-09 nach dem Test im Browser** (`/refine`). Acht Punkte, alle unten
> eingearbeitet und im Decision Log begründet. Zwei Entscheidungen vom 2026-10-06 sind dabei
> umgedreht: gespeichert wird nur noch **ohne offene Lücke**, und „Variante umschalten" wandert aus
> dem Menü auf die Karte. Der Technikentwurf und der gebaute Stand decken das noch nicht ab —
> **nächster Schritt ist ein Nachtrag in `/architecture`**, siehe „Was die Überarbeitung vom
> 2026-10-09 noch braucht" am Ende des Funktionsumfangs.

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
- **Ändert:** PROJ-3 (Übungsdatenbank), ergänzt am 2026-10-09 — Material, Organisationsform und
  Varianten bekommen in Listen- und Kartenansicht des Übungsordners denselben festen Platz wie im
  Stundenverlauf, und das Feld „Arbeitsnotizen" heißt überall „Arbeitsnotiz" mit einheitlichem
  Erklärtext und hellgrünem Feld
- **Ändert:** PROJ-6 (Einheiten-Generator), ergänzt am 2026-10-09 — jede Phase bekommt in den
  Generator-Einstellungen eine optionale Auswahl der Organisationsform (weiches, lockerbares
  Kriterium), die Arbeitsnotiz der Phase bekommt Erklärtext und Feld wie bei den Übungen, und die
  Lücken-Sperre beim Speichern kehrt in neuer Form zurück („geplante Lücke")
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
„Bearbeiten" schaltet die Bedienelemente ein, der Hauptknopf der Änderungsleiste („Fertig" ohne,
„Speichern" mit offenen Änderungen) wieder aus. Die Leseansicht bleibt damit
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
| **Verlassen** | **Ein** Hauptknopf in der Änderungsleiste (geändert am 2026-10-08): bei unveränderter Einheit heißt er „Fertig" und verlässt den Modus, bei offenen Änderungen heißt er „Speichern", speichert und verlässt den Modus danach. Einen eigenen „Fertig"-Knopf im Kopf der Seite gibt es nicht mehr. Die Nachfrage „Änderungen speichern?" mit den drei Wegen Speichern / Verwerfen / Abbrechen bleibt für das Wegnavigieren und das Schließen des Browserfensters |
| **Zustand** | Offene Änderungen leben nur im Browser. Ein Neuladen verwirft sie (siehe Produktentscheidungen) |

### Die sieben Operationen

| Operation | Verhalten |
|---|---|
| **Neu auswürfeln** | Zieht eine andere Übung aus dem Kandidatenpool desselben Segments. Ausgeschlossen: alles, was in dieser Einheit schon steht, und alles, was in diesem Platz bereits weggewürfelt wurde. Der Platz behält seine Minuten. **Seit 2026-10-09 nach den Regeln des Generators gewichtet:** die Hauptsportart der Phase zählt doppelt, und Übungen aus den letzten zwei gespeicherten Einheiten der Gruppe kommen erst dran, wenn sonst nichts frei ist. Varianten sind dabei — wie im Generator — eigene, vollwertige Kandidaten. **Jeder Klick endet sichtbar:** neue Übung, Begründung oder Fehlermeldung |
| **Selbst wählen** | Dialog mit Suche. Oben die passenden Kandidaten des Segments, darunter aufklappbar „auch unpassende anzeigen" — jede mit der Begründung, woran sie scheitert. Der Platz behält seine Minuten |
| **Variante umschalten** | Bei einer Übung mit Varianten lässt sich zwischen Grundübung und jeder Variante umschalten. Material, Organisationsform, Beschreibung und Dauer der Variante gelten dann (die gemeinsame Auflösung aus PROJ-6). **Seit 2026-10-09 direkt auf der Karte** über das Element „Varianten (n)" statt über einen Menüpunkt mit eigenem Dialog — siehe „Die einheitliche Übungszeile" |
| **Entfernen** | Der Eintrag verschwindet, die Minuten werden im Segment frei und als Lücke ausgewiesen |
| **Plandauer ändern** | Frei einstellbar, mindestens 1 Minute. Die Schätzdauer der Übung steht als Hinweis daneben und bleibt unberührt |
| **Umsortieren** | Hoch/Runter je Eintrag, innerhalb des Segments. Beim ersten Eintrag ist „hoch" aus, beim letzten „runter" |
| **Einfügen** | „+ Übung einfügen" am Ende jedes Segments, am Lückenhinweis und am Platzhalter einer gelöschten Übung. Öffnet denselben Auswahldialog. **Je Segment nur ein solcher Knopf** (seit 2026-10-09): steht ein Lückenhinweis da, trägt er den Knopf, und der breite Knopf am Segmentende entfällt |

Die Bedienzeile unter einem Eintrag (Plandauer, Hoch/Runter, Menü) gehört sichtbar zu der Karte
**über** ihr: Karte und Bedienzeile bilden einen Block, die Trennung liegt **nach** der
Bedienzeile, nicht zwischen Karte und Bedienzeile (geändert am 2026-10-09).

### Die einheitliche Übungszeile (neu am 2026-10-09)

Material, Organisationsform und Varianten haben **überall denselben festen Platz in derselben
Reihenfolge** — ein Baustein, vier Orte:

| Ort | Material | Organisationsform | Varianten |
|---|---|---|---|
| Karte im Stundenverlauf (Lesen und Bearbeiten) | ja | ja | ja |
| Dialog „Übung einfügen" | ja | ja | ja |
| Übungsordner, Listen- und Kartenansicht (PROJ-3) | ja | ja | ja |
| Detailseite der Übung (PROJ-3) | unverändert, dort stehen alle drei schon ausführlich | | |

- Fehlt eine Organisationsform oder gibt es keine Varianten, bleibt der Platz leer — die übrigen
  Angaben rücken nicht an eine andere Stelle
- **„Varianten (n)" ist klickbar** und klappt die Namen der Varianten auf, darüber immer die
  Grundübung. Die gerade geltende Form ist markiert
- **Im Übungsordner** ist die aufgeklappte Liste nur zum Ansehen
- **Im Bearbeiten-Modus** wählt ein Klick auf einen Namen diese Form: sie ersetzt den ganzen
  Eintrag mit Material, Organisationsform, Dauerschätzung und Variantentitel. Der Platz behält
  seine Minuten. Öffnet man die Liste erneut, steht die Grundübung wieder zur Wahl
- **In der Leseansicht** des Stundenverlaufs ist die Liste wie im Übungsordner nur zum Ansehen
- **Im Dialog „Übung einfügen"** setzt ein Klick auf einen Variantennamen diese Variante ein

Der Menüpunkt „Variante umschalten …" und der eigene Dialog dafür entfallen.

### Geplante Lücke (neu am 2026-10-09)

Jede freie Minute in einem Segment ist entweder **offen** oder **geplant**:

| | Offene Lücke | Geplante Lücke |
|---|---|---|
| Entsteht | der Generator konnte nicht füllen, oder der Nutzer hat entfernt oder gekürzt | der Nutzer erklärt sie dazu, oder das Segment stand im Generator auf „frei lassen" |
| Aussehen | gelber Hinweis mit Begründung | ruhig, wie die „— Lücke —" eines frei gelassenen Segments, mit Minutenangabe |
| Speichern | **sperrt** | erlaubt |

- Am gelben Hinweis steht im Bearbeiten-Modus neben „Übung einfügen" der Knopf **„Als geplante
  Lücke stehen lassen"**. Das ist eine Änderung wie jede andere: sie zählt in der Leiste und
  lässt sich rückgängig machen
- An einer geplanten Lücke steht im Bearbeiten-Modus „Übung einfügen" und „Wieder öffnen"
- **Die Erklärung gilt für den Stand, an dem sie gegeben wurde.** Werden danach im selben Segment
  weitere Minuten frei (entfernt, gekürzt), ist die Lücke wieder offen
- Ein im Generator auf „frei lassen" gestelltes Segment gilt mit allen freien Minuten als geplant,
  auch wenn der Nutzer es teilweise füllt
- **Überfüllte Segmente** sind keine Lücke und sperren nicht — sie werden wie bisher im
  Speichern-Dialog genannt
- **„Mit gelockerten Kriterien erneut versuchen" wird im Bearbeiten-Modus nicht angeboten.** Es
  lädt die Einheit neu und würde die offenen Änderungen ohne Nachfrage verwerfen. In der
  Leseansicht bleibt es

### Organisationsform im Generator (Erweiterung an PROJ-6, neu am 2026-10-09)

In den Einstellungen jeder Phase im Generator steht eine optionale Mehrfachauswahl
**„Organisationsform(en)"** — nicht im Gruppenprofil. Leer heißt: keine Einschränkung.

- Ist etwas gewählt, kommen nur Übungen (und Varianten) in Frage, die mindestens eine der
  gewählten Organisationsformen tragen. Eine Übung ohne Organisationsform passt dann nicht
- **Weiches Kriterium**, wie Sportart und Schwierigkeit: „Mit gelockerten Kriterien erneut
  versuchen" gibt es **als Erstes** frei, vor Schwierigkeit und Sportart
- Der Lückenhinweis nennt es als eigene Ursache mit Anzahl, und der Auswahldialog des Editors als
  eigene Begründung „passt nicht: Organisationsform"
- Eine Variante zählt mit ihrer eigenen Organisationsform, wenn sie eine angibt, sonst mit der der
  Grundübung (die gemeinsame Auflösung aus PROJ-6)
- „Schnell anlegen" belegt die Organisationsform aus der Phase vor, wenn dort genau eine gewählt
  ist

### Schnell anlegen

Findet die Suche im Auswahldialog nichts Passendes, steht dort „Übung fehlt? Schnell anlegen":
Name, Dauer und eine kurze Beschreibung tippt der Nutzer, wahlweise dazu Arbeitsnotizen (dasselbe
Feld wie im regulären Übungsformular, ergänzt am 2026-10-08), **Sportart, Phase, Schwierigkeit und
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

### Arbeitsnotiz (am 2026-10-09 vereinheitlicht, vorher „Segment-Notiz")

Es gibt zwei Arbeitsnotizen, und beide heißen überall genau so — **„Arbeitsnotiz"**, Einzahl:

| | Gehört zu | Eingegeben in |
|---|---|---|
| Arbeitsnotiz der Übung | einer Übung (PROJ-3) | Übungs-Wizard, „Schnell anlegen" |
| Arbeitsnotiz der Phase | einem Segment (PROJ-6) | Generator-Einstellungen der Phase, Bearbeiten-Modus |

- **Ein Name.** „Arbeitsnotizen", „Notiz hinzufügen" und „Notiz zum Abschnitt" verschwinden
- **Ein Erklärtext am Eingabefeld**, an allen vier Eingabestellen und immer sichtbar: die
  Arbeitsnotiz erscheint im fertigen Stundenverlauf — bei dieser Übung bzw. an dieser Stelle
- **Ein Aussehen.** Das Feld ist beim Eingeben und beim Anzeigen leicht hellgrün hinterlegt, so
  wie heute schon auf der Detailseite der Übung
- **Die Arbeitsnotiz der Phase** ist im Bearbeiten-Modus änderbar. Sie ist der Ort für alles, was
  keine Übung ist — Organisatorisches, der Grund, warum ein Abschnitt frei bleibt
- **Die Arbeitsnotiz der Übung erscheint im Stundenverlauf** unter ihrer Karte. Oben in der
  Leseansicht steht ein Schalter **„Arbeitsnotizen anzeigen"**, der für alle Einträge zugleich
  gilt, standardmäßig an ist und sich im Browser merkt. Er betrifft nur die Notizen der Übungen;
  die der Phasen stehen immer da
- **Im Bearbeiten-Modus** werden die Arbeitsnotizen der Übungen nicht angezeigt — geändert werden
  sie an der Übung, nicht am Plan
- Das zweite Notizfeld der Übung, **„Anmerkungen"** (persönliche Tipps), bleibt getrennt und
  taucht nie im Stundenverlauf auf
- **Für später festgehalten:** jede Arbeitsnotiz hat den besonderen Rang, im Live-Modus
  (PROJ-14) aufzutauchen. Deshalb ein Name und ein Aussehen

### Was nicht aufgeht

Jedes Segment zeigt im Bearbeiten-Modus seinen Stand: „10 von 12 Min · 2 Min frei" oder
„15 von 12 Min · 3 Min über".

**Seit 2026-10-09 gilt: in einer gespeicherten Einheit steht kein gelbes Warnfeld.** Gespeichert
wird nur, wenn jede freie Minute entweder gefüllt oder als geplante Lücke erklärt ist (siehe
„Geplante Lücke"). Das gilt für jeden Speicherweg — im Bearbeiten-Modus und beim „Einheit
speichern" eines frisch generierten Entwurfs.

Damit die Regel keine Sackgasse wird, nennt der Speichern-Dialog die offenen Lücken namentlich
und bietet **„Alle als geplant übernehmen und speichern"** an. Eine Überfüllung sperrt nicht; der
Dialog nennt sie wie bisher und lässt das Speichern nach Bestätigung zu.

**Das ersetzt die Regelung vom 2026-10-06**, nach der mit offenen Lücken gespeichert werden
durfte. Die Sperre aus PROJ-6 kommt damit zurück, aber nicht als ausgegrauter Knopf ohne Ausweg:
der Nutzer hat jetzt zwei Handhaben, füllen oder erklären.

### Was die Überarbeitung vom 2026-10-09 noch braucht

Der Technikentwurf vom 2026-10-07 und der gebaute Stand decken Folgendes nicht ab. **Alle sechs
Punkte sind am 2026-10-09 im Nachtrag zum Tech Design beantwortet** (Abschnitte N2 bis N8); gebaut
ist davon noch nichts:

1. **Wo „geplante Lücke" gespeichert wird.** Die Füllart „frei lassen" gilt für ein ganzes Segment
   und soll laut Entwurf unangetastet bleiben; die neue Erklärung braucht ein eigenes Merkmal am
   Segment und muss durch die Speicher-Funktion
2. **Organisationsform am Segment** — neues Feld, neues Kriterium in der Kriterienliste des
   Generators, neue Lockerungsstufe, neuer Eintrag im Lückenhinweis
3. **Gewichtung beim Auswürfeln** — die schlanke Kandidatenfassung muss wissen, welche Übungen
   kürzlich verwendet wurden; die Hauptsportart der Phase liegt schon vor
4. **Arbeitsnotiz der Übung im Stundenverlauf** — die schlanke Fassung lässt Notizen bisher
   bewusst weg
5. **Varianten im Auswahldialog** — heute eine Zeile je Variante, künftig das Element
   „Varianten (n)" an der Zeile der Übung. Zu entscheiden: wo die Zeile steht, wenn nur eine
   ihrer Formen passt (Vorschlag: unter „Passend", mit der Begründung an den einzelnen Formen)
6. **Die stillen Wege beim Auswürfeln** — siehe Akzeptanzkriterien

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
- **Eine eigene Rotationsregel fürs Auswürfeln** — der Editor übernimmt seit 2026-10-09 genau die
  Frische-Regel, die der Generator schon hat (letzte zwei gespeicherte Einheiten der Gruppe),
  und nichts darüber hinaus. Alles Weitergehende über Wochen gehört zu PROJ-10, das die Regel für
  Generator und Editor gemeinsam setzen soll
- **Organisationsform im Gruppenprofil** — sie wird je Phase im Generator gewählt, nicht an der
  Gruppe (PROJ-5 bleibt unberührt)
- **Arbeitsnotiz einer Übung vom Plan aus ändern** — geändert wird sie an der Übung
- **Der Live-Modus selbst** — dass Arbeitsnotizen dort auftauchen, ist hier nur vorbereitet
  (PROJ-14)
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

- [ ] Angenommen der Nutzer sieht eine Einheit, wenn er auf „Bearbeiten" klickt, dann erscheinen die Bedienelemente an jedem Eintrag und jedem Segment, der Knopf „Bearbeiten" verschwindet, und die Änderungsleiste zeigt als Hauptknopf „Fertig"
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus und hat nichts geändert, wenn er in der Änderungsleiste auf „Fertig" klickt, dann kehrt die Seite ohne Nachfrage in die Leseansicht zurück
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er die Änderungsleiste ansieht, dann heißt der Hauptknopf „Speichern" statt „Fertig"
- [ ] Angenommen der Nutzer hat offene Änderungen, wenn er auf „Speichern" klickt und das Speichern gelingt, dann kehrt die Seite in die Leseansicht zurück
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
- [ ] Angenommen der Nutzer klickt auf „neu auswürfeln", wenn der Vorgang endet, dann ist in jedem Fall etwas zu sehen: eine andere Übung im Platz, die Begründung des erschöpften Vorrats oder eine Fehlermeldung — nie nichts (ergänzt am 2026-10-09)
- [ ] Angenommen die Kandidatenliste lässt sich beim Auswürfeln nicht laden, wenn der Nutzer auswürfelt, dann erscheint die Fehlermeldung an Ort und Stelle und nicht nur im geschlossenen Auswahldialog (ergänzt am 2026-10-09)
- [ ] Angenommen ein Auswürfeln läuft, wenn der Nutzer auf die Karte schaut, dann ist an der Karte selbst erkennbar, dass gewürfelt wird (ergänzt am 2026-10-09)
- [ ] Angenommen die Phase hat eine Hauptsportart und zwei Sportarten, wenn der Nutzer viele Male auswürfelt, dann stammen etwa zwei von drei gezogenen Übungen aus der Hauptsportart — sie zählt doppelt, dieselbe Gewichtung wie im Generator (ergänzt am 2026-10-09)
- [ ] Angenommen im Vorrat stehen Übungen, die in den letzten zwei gespeicherten Einheiten der Gruppe vorkamen, und andere, wenn der Nutzer auswürfelt, dann werden zuerst die anderen gezogen und die kürzlich verwendeten erst, wenn sonst nichts frei ist (ergänzt am 2026-10-09)
- [ ] Angenommen eine Grundübung scheitert am Material der Halle, ihre Variante aber nicht, wenn der Nutzer auswürfelt, dann kann die Variante gezogen werden und die Grundübung nicht (ergänzt am 2026-10-09; für den Generator gilt dasselbe seit PROJ-6)

### Übung selbst wählen

- [ ] Angenommen der Nutzer öffnet den Auswahldialog für ein Segment, wenn der Dialog erscheint, dann stehen oben die Übungen, die die Kriterien dieses Segments erfüllen, mit ihrer Anzahl im Titel
- [ ] Angenommen der Auswahldialog ist offen, wenn der Nutzer „auch unpassende anzeigen" aufklappt, dann erscheinen die übrigen Übungen, jede mit der Begründung, woran sie scheitert
- [ ] Angenommen der Nutzer wählt eine unpassende Übung, wenn er sie bestätigt, dann wird sie eingesetzt, ohne dass er einen weiteren Dialog bestätigen muss
- [ ] Angenommen der Auswahldialog ist offen, wenn der Nutzer einen Suchbegriff eingibt, dann wird in beiden Gruppen (passend und unpassend) gefiltert
- [ ] Angenommen ein Platz ist 5 Minuten lang, wenn der Nutzer eine auf 12 Minuten geschätzte Übung einsetzt, dann bleibt der Platz 5 Minuten lang und die Schätzung von 12 Minuten steht als Hinweis daneben
- [ ] Angenommen der Nutzer hat eine Übung ausgewählt, wenn er den Dialog erneut öffnet, dann ist die aktuell eingesetzte Übung als gewählt erkennbar

### Variante umschalten

Am 2026-10-09 neu gefasst: das Umschalten sitzt auf der Karte, nicht mehr im Menü.

- [ ] Angenommen ein Eintrag verweist auf eine Übung mit zwei Varianten, wenn der Nutzer auf der Karte „Varianten (2)" anklickt, dann klappen die Grundübung und beide Varianten mit Namen auf und die gerade geltende Form ist markiert
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus, wenn er in der aufgeklappten Liste eine Variante anklickt, dann ersetzt sie den ganzen Eintrag — Variantentitel, Material, Organisationsform und Dauerschätzung — und die Plandauer des Platzes bleibt
- [ ] Angenommen der Nutzer schaltet auf eine Variante um, wenn die Variante eigenes Material angibt, dann gilt das Material der Variante und nicht das der Grundübung
- [ ] Angenommen im Platz steht eine Variante, wenn der Nutzer „Varianten" erneut aufklappt, dann steht die Grundübung zur Wahl und ein Klick stellt sie wieder her
- [ ] Angenommen der Nutzer ist in der Leseansicht, wenn er „Varianten (2)" aufklappt, dann sieht er die Namen, kann aber nichts auswählen
- [ ] Angenommen eine Übung hat keine Varianten, wenn der Nutzer ihre Karte ansieht, dann steht dort kein Varianten-Element und im Menü kein Umschalten
- [ ] Angenommen der Nutzer öffnet das Menü eines Eintrags, wenn die Übung Varianten hat, dann steht dort kein Punkt „Variante umschalten" mehr

### Die einheitliche Übungszeile (neu am 2026-10-09)

- [ ] Angenommen eine Übung hat Material, eine Organisationsform und Varianten, wenn der Nutzer sie im Stundenverlauf, im Dialog „Übung einfügen" und im Übungsordner (Liste und Karten) sieht, dann stehen die drei Angaben an allen Orten in derselben Reihenfolge und Gestalt
- [ ] Angenommen eine Übung hat keine Organisationsform, wenn ihre Zeile erscheint, dann bleibt der Platz dafür leer und die übrigen Angaben stehen an ihrer gewohnten Stelle
- [ ] Angenommen der Nutzer ist im Übungsordner, wenn er an einer Übung „Varianten (n)" anklickt, dann klappen die Namen auf, ohne dass er die Detailseite öffnet, und nichts ist auswählbar
- [ ] Angenommen der Dialog „Übung einfügen" ist offen, wenn der Nutzer an einer Übung „Varianten (n)" aufklappt und einen Namen anklickt, dann wird diese Variante eingesetzt
- [ ] Angenommen der Dialog „Übung einfügen" ist offen, wenn der Nutzer die Liste ansieht, dann steht an jeder Übung neben dem Material ihre Organisationsform

### Organisationsform im Generator (neu am 2026-10-09)

- [ ] Angenommen der Nutzer öffnet im Generator die Einstellungen einer Phase, die gefüllt wird, wenn er sie ansieht, dann kann er dort eine oder mehrere Organisationsformen wählen, vordefinierte und eigene
- [ ] Angenommen in einer Phase ist keine Organisationsform gewählt, wenn generiert wird, dann schränkt die Organisationsform die Auswahl nicht ein
- [ ] Angenommen in einer Phase ist „Kleingruppen" gewählt, wenn generiert wird, dann stehen in dieser Phase nur Übungen oder Varianten, die „Kleingruppen" tragen
- [ ] Angenommen eine Phase bleibt wegen der Organisationsform leer, wenn der Lückenhinweis erscheint, dann nennt er die Organisationsform als eigene Ursache mit Anzahl
- [ ] Angenommen eine Phase bleibt wegen der Organisationsform leer, wenn der Nutzer in der Leseansicht „Mit gelockerten Kriterien erneut versuchen" wählt, dann wird die Organisationsform als Erstes freigegeben
- [ ] Angenommen der Nutzer öffnet das Gruppenprofil, wenn er es ansieht, dann gibt es dort keine Einstellung zur Organisationsform
- [ ] Angenommen in der Phase ist eine Organisationsform gewählt, wenn der Nutzer im Editor den Auswahldialog öffnet, dann stehen Übungen mit anderer oder ohne Organisationsform unter den unpassenden mit der Begründung „Organisationsform"
- [ ] Angenommen der Nutzer kehrt über „Zurück zum Generator" zurück, wenn die Maske erscheint, dann ist die gewählte Organisationsform jeder Phase erhalten

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
- [ ] Angenommen ein Segment zeigt im Bearbeiten-Modus einen Lückenhinweis, wenn der Nutzer das Segment ansieht, dann gibt es dort genau einen Knopf „Übung einfügen" — den am Hinweis — und keinen zweiten am Segmentende (ergänzt am 2026-10-09)
- [ ] Angenommen ein Segment zeigt keinen Lückenhinweis, wenn der Nutzer im Bearbeiten-Modus ist, dann steht „Übung einfügen" am Segmentende (ergänzt am 2026-10-09)
- [ ] Angenommen ein Eintrag hat im Bearbeiten-Modus seine Bedienzeile, wenn der Nutzer die Liste ansieht, dann ist die Bedienzeile sichtbar mit der Karte über ihr verbunden und von der nächsten Karte abgesetzt (ergänzt am 2026-10-09)

### Geplante Lücke (neu am 2026-10-09)

- [ ] Angenommen ein Segment hat eine offene Lücke, wenn der Nutzer im Bearbeiten-Modus „Als geplante Lücke stehen lassen" wählt, dann verschwindet der gelbe Hinweis und die Stelle erscheint ruhig mit ihrer Minutenangabe, wie eine im Generator frei gelassene
- [ ] Angenommen ein Segment ist ganz leer und wurde nicht frei gelassen, wenn der Nutzer es zur geplanten Lücke erklärt, dann gilt dasselbe wie bei einer Restlücke
- [ ] Angenommen der Nutzer hat eine Lücke als geplant erklärt, wenn er „Rückgängig" wählt, dann steht der gelbe Hinweis wieder da
- [ ] Angenommen eine Lücke ist geplant, wenn der Nutzer im Bearbeiten-Modus „Wieder öffnen" wählt, dann ist sie wieder eine offene Lücke
- [ ] Angenommen eine Lücke von 2 Minuten ist geplant, wenn der Nutzer danach im selben Segment eine Übung entfernt, dann ist die nun größere Lücke wieder offen
- [ ] Angenommen eine Lücke ist geplant, wenn der Nutzer dort eine Übung einfügt und das Segment aufgeht, dann ist keine Lücke mehr ausgewiesen
- [ ] Angenommen ein Segment stand im Generator auf „frei lassen" und ist teilweise gefüllt, wenn der Nutzer speichert, dann gelten seine freien Minuten als geplant und sperren nicht
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus, wenn ein Lückenhinweis erscheint, dann wird „Mit gelockerten Kriterien erneut versuchen" dort nicht angeboten
- [ ] Angenommen eine gespeicherte Einheit wird in der Leseansicht geöffnet, wenn der Nutzer sie ansieht, dann steht nirgends ein gelbes Warnfeld

### Schnell anlegen

- [ ] Angenommen die Suche im Auswahldialog findet keine Treffer, wenn der Nutzer sucht, dann wird „Übung fehlt? Schnell anlegen" angeboten
- [ ] Angenommen der Nutzer öffnet „Schnell anlegen" aus einem Segment, wenn das Formular erscheint, dann sind Sportart, Phase, Schwierigkeit und Altersgruppen aus Segment und Gruppe vorbelegt
- [ ] Angenommen der Nutzer füllt Name, Dauer und Beschreibung aus, wenn er „Anlegen und einsetzen" wählt, dann steht die Übung in seiner Übungsdatenbank und im Platz
- [ ] Angenommen der Nutzer trägt beim Schnell-Anlegen Arbeitsnotizen ein, wenn er „Anlegen und einsetzen" wählt, dann stehen sie an der angelegten Übung; lässt er das Feld leer, wird die Übung ohne Arbeitsnotizen angelegt
- [ ] Angenommen der Nutzer lässt den Namen leer, wenn er „Anlegen und einsetzen" wählt, dann erscheint eine Validierungsmeldung und die übrigen Eingaben bleiben erhalten
- [ ] Angenommen eine Übung mit demselben Namen existiert bereits, wenn der Nutzer sie schnell anlegen will, dann weist ein Hinweis darauf hin und bietet die vorhandene Übung zur Auswahl an
- [ ] Angenommen der Nutzer hat eine Übung schnell angelegt, wenn er die Nachfrage beim Verlassen mit „Verwerfen" beantwortet, dann bleibt die angelegte Übung in seiner Datenbank, nur der Einsatz im Plan wird verworfen
- [ ] Angenommen der Nutzer hat eine Übung schnell angelegt, wenn er die Übungsübersicht öffnet, dann ist sie als „noch zu ergänzen" erkennbar und über einen Filter auffindbar
- [ ] Angenommen eine Übung ist als „noch zu ergänzen" markiert, wenn der Nutzer sie im regulären Übungsformular speichert, dann verschwindet die Markierung
- [ ] Angenommen eine Übung ist als „noch zu ergänzen" markiert, wenn der Generator oder der Editor Kandidaten sucht, dann wird sie wie jede andere Übung behandelt und nicht benachteiligt

### Arbeitsnotiz (am 2026-10-09 neu gefasst, vorher „Segment-Notiz")

- [ ] Angenommen ein Segment hat eine Arbeitsnotiz, wenn der Nutzer im Bearbeiten-Modus darauf tippt, dann kann er sie ändern
- [ ] Angenommen ein Segment hat keine Arbeitsnotiz, wenn der Nutzer im Bearbeiten-Modus ist, dann wird ihm „Arbeitsnotiz hinzufügen" angeboten
- [ ] Angenommen der Nutzer leert eine Arbeitsnotiz vollständig, wenn er speichert, dann verschwindet sie aus der Leseansicht ohne Fehlermeldung
- [ ] Angenommen der Nutzer sieht ein Eingabefeld für eine Arbeitsnotiz — im Übungs-Wizard, im Schnell-Anlegen, in den Generator-Einstellungen einer Phase oder im Bearbeiten-Modus —, wenn er es ansieht, dann heißt es „Arbeitsnotiz", ist hellgrün hinterlegt und trägt den Erklärtext, dass sie im fertigen Stundenverlauf erscheint
- [ ] Angenommen der Nutzer durchsucht die Oberfläche, wenn er auf ein Notizfeld einer Übung oder Phase stößt, dann heißt keines mehr „Arbeitsnotizen", „Notiz" oder „Notiz zum Abschnitt" (das Feld „Anmerkungen" der Übung bleibt, wie es ist)
- [ ] Angenommen eine Arbeitsnotiz wird angezeigt — auf der Detailseite der Übung oder im Stundenverlauf —, wenn der Nutzer sie sieht, dann ist sie hellgrün hinterlegt und mit „Arbeitsnotiz" überschrieben
- [ ] Angenommen eine Übung im Plan hat eine Arbeitsnotiz, wenn der Nutzer die Leseansicht öffnet, dann steht die Arbeitsnotiz unter der Karte der Übung
- [ ] Angenommen der Nutzer ist in der Leseansicht, wenn er den Schalter „Arbeitsnotizen anzeigen" ausschaltet, dann verschwinden die Arbeitsnotizen aller Übungen zugleich, und die der Phasen bleiben stehen
- [ ] Angenommen der Nutzer hat den Schalter ausgeschaltet, wenn er die Seite später im selben Browser wieder öffnet, dann ist er weiter aus
- [ ] Angenommen keine Übung im Plan hat eine Arbeitsnotiz, wenn der Nutzer die Leseansicht öffnet, dann wird der Schalter nicht angeboten
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus, wenn er die Einträge ansieht, dann werden die Arbeitsnotizen der Übungen nicht angezeigt
- [ ] Angenommen im Platz steht eine Variante, wenn die Arbeitsnotiz angezeigt wird, dann ist es die der Grundübung — Varianten haben keine eigene

### Speichern, Verwerfen, Rückgängig

- [ ] Angenommen der Nutzer hat drei Änderungen offen, wenn er in den Bearbeiten-Modus schaut, dann zeigt eine Leiste die Anzahl der offenen Änderungen und die Knöpfe Speichern, Verwerfen und Rückgängig
- [ ] Angenommen der Nutzer hat mehrere Änderungen gemacht, wenn er „Rückgängig" mehrfach wählt, dann wird Schritt für Schritt rückwärts bis zum Ausgangszustand zurückgenommen
- [ ] Angenommen der Nutzer ist beim Ausgangszustand angekommen, wenn er in die Leiste schaut, dann ist „Rückgängig" deaktiviert und es sind keine offenen Änderungen vermerkt
- [ ] Angenommen der Nutzer hat Änderungen offen, wenn er „Verwerfen" bestätigt, dann zeigt die Seite wieder den gespeicherten Zustand und die Einheit in der Datenbank ist unberührt
- [ ] Angenommen eine gespeicherte Einheit wird bearbeitet, wenn der Nutzer speichert, dann wird dieselbe Einheit überschrieben, behält ihren Namen und es entsteht keine zweite Einheit in der Übersicht
- [ ] Angenommen ein Entwurf wird bearbeitet, wenn der Nutzer speichert, dann wird nach einem Namen gefragt und die Einheit erscheint anschließend in den Übersichten
- [ ] Angenommen ein Segment ist überfüllt, wenn der Nutzer speichert, dann nennt der Dialog das Segment namentlich mit der Abweichung in Minuten und lässt das Speichern nach Bestätigung zu (am 2026-10-09 auf Überfüllung eingeengt)
- [ ] Angenommen ein Segment hat eine offene Lücke, wenn der Nutzer speichert, dann wird nicht gespeichert, sondern der Dialog nennt die Segmente mit offener Lücke namentlich mit ihren Minuten und bietet „Alle als geplant übernehmen und speichern" und „Zurück zum Bearbeiten" an (neu am 2026-10-09)
- [ ] Angenommen der Dialog nennt offene Lücken, wenn der Nutzer „Alle als geplant übernehmen und speichern" wählt, dann wird gespeichert und die Einheit zeigt danach an diesen Stellen geplante Lücken (neu am 2026-10-09)
- [ ] Angenommen alle Segmente gehen auf oder haben nur geplante Lücken, wenn der Nutzer speichert, dann wird ohne zusätzliche Nachfrage gespeichert
- [ ] Angenommen ein frisch generierter Entwurf hat eine offene Lücke, wenn der Nutzer außerhalb des Bearbeiten-Modus „Einheit speichern" wählt, dann gilt dieselbe Regel: der Dialog nennt die Lücken und bietet „Alle als geplant übernehmen und speichern" sowie den Weg in den Bearbeiten-Modus an (am 2026-10-09 neu gefasst)
- [ ] Angenommen jemand ruft das Speichern an der Oberfläche vorbei auf, wenn die Einheit eine offene Lücke hat, dann weist auch der Server das Speichern ab (neu am 2026-10-09)
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
| 2 | Der Nutzer entfernt alle Übungen der **ganzen Einheit** | Erlaubt. Speicherbar, sobald die leeren Segmente als geplante Lücken erklärt sind — einzeln oder über „Alle als geplant übernehmen und speichern" im Speichern-Dialog (am 2026-10-09 angepasst). Eine leere Einheit ist ein zulässiges Gerüst — genau das sieht PROJ-6 für „alle Segmente frei lassen" vor |
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
| 13 | Der Nutzer würfelt aus, während ein anderes Auswürfeln noch läuft | Der zweite Klick wird ignoriert, solange der erste nicht beantwortet ist. **Dass gewürfelt wird, ist an der Karte selbst zu sehen** und nicht nur am Drei-Punkte-Knopf — sonst wirkt der ignorierte Klick wie ein kaputter Knopf (am 2026-10-09 geschärft) |
| 14 | Ein Segment enthält sehr viele Einträge (zwanzig und mehr) | Funktioniert, nur lang. Keine Obergrenze im MVP — siehe Offene Fragen |
| 15 | Die Einheit war über „Lockern" entstanden und trägt einen Lockerungs-Hinweis | Der Hinweis bleibt sichtbar und wird vom Bearbeiten nicht gelöscht; er beschreibt, wie der Vorschlag zustande kam |
| 16 | Eine bereits gespeicherte Einheit aus der Zeit vor dem 2026-10-09 hat eine offene Lücke | Sie bleibt, wie sie ist, und zeigt ihren gelben Hinweis weiter. Beim nächsten Speichern aus dem Bearbeiten-Modus greift die Regel. Kein rückwirkendes Umschreiben |
| 17 | Im Platz steht eine Variante, und der Nutzer würfelt neu aus | **Am 2026-10-09 neu gefasst (BUG-20):** jede Variante ist eine vollwertige Übung. Gemerkt wird die weggewürfelte **Form**; die übrigen Formen derselben Übung bleiben für diesen Platz ziehbar, und eine weggewürfelte Grundübung darf als Variante wiederkommen. Ausgeschlossen bleibt mit allen Formen, was in einem **anderen** Platz der Einheit steht |
| 18 | In der Phase ist eine Organisationsform gewählt, und der Nutzer wählt im Dialog bewusst eine Übung mit anderer | Erlaubt, ohne zweite Bestätigung, mit der Begründung an der Zeile — wie bei jedem anderen verfehlten Kriterium |
| 19 | Eine Phase steht auf „frei lassen" und hat eine Organisationsform aus einer früheren Einstellung | Die Auswahl wird im Generator nur bei Phasen angeboten, die gefüllt werden, und spielt bei „frei lassen" keine Rolle |
| 20 | Die Arbeitsnotiz einer Übung ist sehr lang | Sie wird im Stundenverlauf vollständig gezeigt. Der Schalter „Arbeitsnotizen anzeigen" ist das Mittel gegen Überlänge, kein Abschneiden |

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
- [x] **Soll der Lückenhinweis das „Lockern" weiter anbieten?** → In der Leseansicht ja, im
  Bearbeiten-Modus nein (2026-10-09). Dort lädt es die Einheit neu und verwirft die offenen
  Änderungen ohne Nachfrage; an seine Stelle tritt „Als geplante Lücke stehen lassen"
- [ ] **Ist mit „Trennstrich unterhalb der Bearbeitungsleiste" die Bedienzeile am Eintrag
  gemeint?** So ist es am 2026-10-09 verstanden und eingearbeitet (Plandauer, Hoch/Runter, Menü
  unter jeder Karte). Sollte die Änderungsleiste oben gemeint gewesen sein, ist das
  Akzeptanzkriterium dazu zu tauschen
- [ ] **Sind alle Ursachen für das folgenlose Auswürfeln gefunden?** Im Code belegt sind zwei
  stille Wege (Ladefehler der Kandidatenliste wird nur im Auswahldialog gezeigt; ein Klick
  während eines laufenden Auswürfelns wird fast unsichtbar ignoriert) und ein dritter, der
  Änderungen verwirft („Lockern" im Bearbeiten-Modus). Nachgestellt wurde die Beobachtung nicht.
  `/qa` soll gezielt nach weiteren suchen
- [x] **Wo steht eine Übung im Auswahldialog, wenn nur eine ihrer Formen passt?** → Unter
  „Passend". Ein Klick auf die Zeile setzt die Grundübung ein, wenn sie passt, sonst die erste
  passende Variante; das Aufklappen zeigt jede Form mit ihrer eigenen Eignung (2026-10-09,
  Nachtrag N6)
- [x] **BUG-6 (Verwendungszeitpunkt steht auf „generiert")** — am 2026-10-08 in `/backend` behoben: wird ein Entwurf gespeichert, entstehen die Nachweise neu und tragen den Zeitpunkt des Speicherns. Ursprüngliche Notiz: Der Editor
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
| Beim Auswürfeln schließt nur aus, was in **anderen** Plätzen steht; die übrigen Formen der Übung im eigenen Platz bleiben ziehbar | Vom Nutzer entschieden, nachdem die QA es gefunden hatte (BUG-20): jede Variante ist eine vollwertige Übung. Bisher galt die Übung im eigenen Platz als „schon in der Einheit", und das Auswürfeln meldete „nichts mehr frei", obwohl eine Variante nie gezeigt worden war | 2026-10-09 |
| BUG-5 wird hier behoben | Der Platzhalter „Übung gelöscht" ohne Möglichkeit zum Nachbesetzen war von PROJ-6 ausdrücklich hierher verwiesen | 2026-10-06 |
| **Gespeichert wird nur ohne offene Lücke; jede freie Minute ist gefüllt oder als geplant erklärt.** Hebt „nicht aufgehende Segmente dürfen gespeichert werden" und „die Lücken-Sperre fällt ganz weg" vom 2026-10-06 für freie Minuten auf | Im Browsertest zeigte sich: eine fertige Stunde mit gelbem Warnfeld sieht unfertig aus, und der Übungsleiter kann nicht unterscheiden, ob die Lücke Absicht oder Versäumnis war. Die Sperre von damals war falsch, weil sie keinen Ausweg bot — jetzt gibt es zwei: füllen oder erklären | 2026-10-09 |
| Die Regel gilt für jede freie Minute, auch Restlücken; Überfüllung sperrt nicht | Vom Nutzer so entschieden. Eine Restlücke von zwei Minuten ist dieselbe Frage wie eine leere Phase, nur kleiner. Ein überzogener Hauptteil dagegen ist eine Planung und kein Loch | 2026-10-09 |
| Der Speichern-Dialog bietet „Alle als geplant übernehmen und speichern" | Sonst müsste der Nutzer für jede Lücke zurück in den Plan. Die Erklärung bleibt eine bewusste Handlung, kostet aber einen Klick statt fünf. Gilt auch für „Einheit speichern" am frischen Entwurf | 2026-10-09 |
| Die Erklärung „geplant" gilt für den Stand, an dem sie gegeben wurde | Würde sie am Segment kleben, machte ein späteres Entfernen stillschweigend eine größere Lücke „geplant", die niemand geplant hat (Auslegung beim Einarbeiten, vom Nutzer noch zu bestätigen) | 2026-10-09 |
| „Lockern" wird im Bearbeiten-Modus nicht mehr angeboten | Es lädt die Einheit neu und verwirft dabei die offenen Änderungen ohne Nachfrage. Im Bearbeiten-Modus füllt oder erklärt der Nutzer die Lücke selbst | 2026-10-09 |
| Ein Knopf „Übung einfügen" je Segment | Steht der grüne Knopf am Lückenhinweis, ist der breite am Segmentende derselbe Knopf ein zweites Mal | 2026-10-09 |
| Varianten werden auf der Karte umgeschaltet, nicht im Menü | Der Menüpunkt war gebaut, wurde im Browsertest aber nicht gefunden. Was eine Übung an Varianten hat, gehört zu dem, was man an ihr sieht, nicht in ein Menü dahinter | 2026-10-09 |
| Material, Organisationsform und Varianten stehen an vier Orten in einem Baustein | Stundenverlauf, Auswahldialog und Übungsordner zeigten bisher je eine andere Auswahl dieser Angaben. Derselbe Platz überall heißt: einmal gelernt, überall gefunden | 2026-10-09 |
| Im Übungsordner sind Varianten aufklappbar, aber nur zum Ansehen | Dort gibt es keinen Platz, in den eine Variante gesetzt werden könnte. Das Element bleibt dasselbe, damit es überall gleich aussieht | 2026-10-09 |
| Das Auswürfeln übernimmt Hauptsportart-Gewichtung und Frische-Regel des Generators | Vom Nutzer so entschieden: „Auswürfeln" soll dasselbe bedeuten wie „der Generator hätte auch diese nehmen können". Hebt die Entscheidung vom 2026-10-06 teilweise auf, die Rotation ganz bei PROJ-10 zu lassen — übernommen wird nur, was der Generator heute schon tut | 2026-10-09 |
| Die Organisationsform wird je Phase im Generator gewählt, nicht im Gruppenprofil | Sie hängt am Abschnitt der Stunde (Aufwärmen frei verteilt, Hauptteil in Kleingruppen), nicht an der Gruppe | 2026-10-09 |
| Die Organisationsform ist ein weiches Kriterium und wird als Erstes gelockert | Vom Nutzer so entschieden. Anders als Material oder Altersgruppe macht eine andere Organisationsform eine Übung nicht undurchführbar. Als Erstes gelockert, weil sie das jüngste und am wenigsten gepflegte Merkmal ist | 2026-10-09 |
| Ein Name für beide Notizen: „Arbeitsnotiz", mit einem Erklärtext und einem hellgrünen Feld | Fünf Stellen trugen vier Bezeichnungen. Derselbe Begriff soll dasselbe bedeuten — und im Live-Modus (PROJ-14) wird genau diese Notiz einen besonderen Rang haben | 2026-10-09 |
| Die Arbeitsnotiz der Übung erscheint in der Leseansicht, abschaltbar über einen Schalter, standardmäßig an | Dafür ist sie da — der Wizard verspricht es am Eingabefeld seit PROJ-3, eingelöst war es nicht. Der Schalter fängt den Fall ab, dass ein langer Plan mit vielen Notizen unübersichtlich wird | 2026-10-09 |
| Im Bearbeiten-Modus bleiben die Arbeitsnotizen der Übungen weg | Dort geht es um den Aufbau des Plans; die Karten tragen schon die Bedienzeile. Geändert wird die Notiz an der Übung | 2026-10-09 |
| Die Punkte zu PROJ-3 und PROJ-6 werden in dieser Spec geführt | Vom Nutzer so entschieden, wie schon bei „noch zu ergänzen": ein Durchgang Architektur, Bau und QA statt dreier. Preis: PROJ-7 wird größer und geht später in die QA | 2026-10-09 |

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
| Ein Hauptknopf statt „Fertig" und „Speichern" nebeneinander | Bei offenen Änderungen führte „Fertig" nur über eine Nachfrage zum selben Ziel wie „Speichern". Jetzt heißt der eine Knopf je nach Stand „Fertig" oder „Speichern", und Speichern verlässt den Modus. Er sitzt in der Änderungsleiste, weil sie beim Scrollen oben klebt — im Kopf der Seite müsste man auf dem Telefon erst nach oben scrollen. Preis: Speichern und Weiterbearbeiten kostet einen erneuten Klick auf „Bearbeiten" | 2026-10-08 |
| Im Bearbeiten-Modus verschwinden „Gespeichert", „Einheit speichern" und „Neu generieren" aus dem Kopf der Seite | „Neu generieren" würde offene Änderungen ohne Nachfrage überschreiben. „Gespeichert" stünde sonst neben offenen Änderungen und wäre falsch. „Einheit speichern" liefe am Editor vorbei und würde den Entwurf ohne die offenen Änderungen sichern. In der Leseansicht bleiben beide: wer eine frisch generierte Einheit so nimmt, wie sie ist, speichert sie ohne Umweg über „Bearbeiten" | 2026-10-08 |
| Kein neues Paket | Umsortieren über Hoch/Runter (Produktentscheidung) nimmt den einzigen Grund weg, ein Ziehen-und-Ablegen-Paket aufzunehmen. Alles Übrige deckt der vorhandene Baukasten ab | 2026-10-07 |
| Die geplante Lücke wird als **Zahl** am Segment gespeichert („bis zu n freie Minuten sind geplant"), nicht als Ja/Nein | Die Regel „die Erklärung gilt für den Stand, an dem sie gegeben wurde" ergibt sich daraus von selbst: frei ≤ geplant ist geplant, frei > geplant ist offen. Ein Ja/Nein bräuchte eine zweite Logik, die es bei jeder Änderung des Segments zurücksetzt — und die wäre die Stelle, an der es schiefgeht | 2026-10-09 |
| Die Füllart „frei lassen" bleibt unangetastet und gilt daneben | Sie hält fest, was im Generator gewählt wurde (Entscheidung vom 2026-10-07). Ein frei gelassenes Segment gilt immer als geplant, ohne dass die Zahl gesetzt werden muss | 2026-10-09 |
| Die Lückenregel wird auch in der Speicher-Funktion der Datenbank geprüft | Nur an der Oberfläche geprüft, wäre „keine gespeicherte Einheit mit gelbem Feld" eine Gewohnheit und keine Zusage | 2026-10-09 |
| „Einheit speichern" am frischen Entwurf läuft über dieselbe Speicher-Funktion wie der Editor; der alte Weg entfällt | Zwei Speicherwege hießen: die Lückenregel an zwei Stellen. Nebenbei verschwindet der Weg, an dem BUG-16 hing | 2026-10-09 |
| Organisationsform als weiteres Kriterium in der **einen** Kriterienliste des Generators | Damit gilt sie beim Generieren, im Lückenhinweis, in der Begründung je Übung und beim Auswürfeln, ohne an vier Stellen eingebaut zu werden | 2026-10-09 |
| Eine Lockerungsstufe mehr; sie wird übersprungen, wenn die Phase keine Organisationsform gewählt hat | Sonst gäbe es einen Versuch, der nichts ändert, und einen Lockerungs-Hinweis, der etwas behauptet, das nicht stattgefunden hat | 2026-10-09 |
| Das Auswürfeln zieht erst die Sportart, dann die Übung | So macht es der Generator. Ein Gewicht je Übung sähe ähnlich aus, hinge aber davon ab, wie viele Übungen jede Sportart hat — bei zehn Volleyball- und zwei Turnübungen käme die Hauptsportart Turnen kaum dran | 2026-10-09 |
| „Kürzlich verwendet" rechnet der Server und gibt es als Merkmal je Kandidat mit; gezogen wird weiter im Browser | Die Auskunft liegt in den Verwendungsnachweisen, also am Server. Die Ziehung bleibt ohne Wartezeit, wie am 2026-10-07 entschieden | 2026-10-09 |
| Varianten bleiben in den Daten eigene Kandidaten; nur die Darstellung fasst sie je Übung zusammen | Auswürfeln, Eignungsprüfung und Speichern bleiben unberührt. Umgebaut wird eine Liste, nicht das Modell | 2026-10-09 |
| Die Karte bekommt die Namen der Varianten, nicht nur ihre Anzahl | Aufklappen in der Leseansicht und im Übungsordner soll keinen Server brauchen. Die Stundenansicht lädt die Varianten ohnehin schon | 2026-10-09 |
| Die Arbeitsnotiz der Übung kommt über die Stundenansicht, nicht über die Kandidatenliste | Sie wird nur in der Leseansicht gezeigt. Die Kandidatenliste bleibt schlank, wie am 2026-10-07 entschieden | 2026-10-09 |
| „Arbeitsnotiz" ist eine Umbenennung an der Oberfläche; die Datenbankfelder bleiben | Dem Nutzer brächte eine Umbenennung in der Datenbank nichts, und sie wäre ein Eingriff in ein ausgeliefertes Feature | 2026-10-09 |
| „Arbeitsnotizen anzeigen" merkt sich der Browser, nicht das Konto | Eine Bequemlichkeit je Gerät: am Telefon in der Halle an, am Rechner beim Planen vielleicht aus | 2026-10-09 |
| Die Arbeitsfassung wird nur beim Betreten des Bearbeiten-Modus und nach gelungenem Speichern gesetzt, nicht bei jedem Nachladen der Seitendaten | Bisher verwarf jedes Nachladen — aus welchem Grund auch immer — die offenen Änderungen ohne Nachfrage. „Lockern" war ein belegter Auslöser; die Absicherung gilt auch für unbelegte | 2026-10-09 |
| Während eines Auswürfelns ist „Neu auswürfeln" an den übrigen Karten ausgegraut statt folgenlos klickbar | Ein Knopf, der sich klicken lässt und nichts tut, ist genau der Fehler, der gemeldet wurde | 2026-10-09 |
| Weiterhin kein neues Paket | Aufklappen, Schalter und Mehrfachauswahl sind im Baukasten vorhanden | 2026-10-09 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-10-07

> **Dieser Entwurf beschreibt den Stand vor der Überarbeitung vom 2026-10-09.** Geplante Lücke,
> Organisationsform am Segment, Gewichtung beim Auswürfeln, Arbeitsnotiz im Stundenverlauf und
> das Umschalten der Variante auf der Karte stehen im Abschnitt „Tech Design — Nachtrag zur
> Überarbeitung vom 2026-10-09" weiter unten. Wo beide sich widersprechen, gilt der Nachtrag.

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
    │   ├── „Bearbeiten"                       NEU  — „Fertig" sitzt seit 2026-10-08 in der Änderungsleiste
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
│       └── Kurzformular            NEU  — Name, Dauer, Beschreibung, Arbeitsnotizen (optional)
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
reguläre Formular, nur mit weniger Feldern und der Markierung dazu. Mitgeschickt werden Name,
Dauer, Beschreibung und die Arbeitsnotizen (`workNotes`, leer wenn nicht ausgefüllt). Vorbelegt werden Sportart,
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
| „Verwerfen" | der eigene Dialog der Seite |
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

## Tech Design — Nachtrag zur Überarbeitung vom 2026-10-09

**Erstellt:** 2026-10-09 · ergänzt den Entwurf vom 2026-10-07, ersetzt ihn nicht. Die Grundidee
bleibt: eine Arbeitsfassung im Browser, ein Speichern in einem Zug.

### N1) Was sich an der Oberfläche ändert

```
/units/[id]
└── Stundenplan-Ansicht
    ├── Kopfbereich
    │   └── Schalter „Arbeitsnotizen anzeigen"     NEU  — nur Leseansicht, nur wenn es welche gibt
    ├── Änderungsleiste                            [unverändert]
    └── Segment-Block
        ├── Arbeitsnotiz der Phase                 GEÄNDERT — gemeinsamer Baustein, hellgrün
        ├── Eintrags-Block                         GEÄNDERT — Karte und Bedienzeile in EINEM Rahmen
        │   ├── Eintrags-Karte
        │   │   ├── Name, Minuten, Sportart, Schwierigkeit
        │   │   └── Übungszeile                    NEU  — gemeinsamer Baustein
        │   │       ├── Material
        │   │       ├── Organisationsform
        │   │       └── „Varianten (n)" ▾          aufklappbar; im Bearbeiten-Modus wählbar
        │   ├── Arbeitsnotiz der Übung             NEU  — nur Leseansicht, hellgrün
        │   └── Bedienzeile                        GEÄNDERT — ohne „Variante umschalten",
        │                                                     Würfel-Anzeige liegt auf der Karte
        ├── Offene Lücke (gelb)                    GEÄNDERT
        │   ├── „Übung einfügen"
        │   ├── „Als geplante Lücke stehen lassen" NEU  — nur Bearbeiten-Modus
        │   └── „Lockern"                          nur noch in der Leseansicht
        ├── Geplante Lücke (ruhig, mit Minuten)    NEU
        │   └── „Übung einfügen" · „Wieder öffnen" nur Bearbeiten-Modus
        └── „+ Übung einfügen" am Segmentende      nur wenn keine Lücke darüber den Knopf trägt

Dialoge
├── Auswahldialog                                  GEÄNDERT — eine Zeile je Übung mit Übungszeile
├── Variantenwahl                                  ENTFÄLLT
└── „Änderungen speichern?"                        GEÄNDERT — nennt offene Lücken,
                                                              „Alle als geplant übernehmen und speichern"

Generator /units/new
└── Einstellungen einer Phase
    ├── Organisationsform(en)                      NEU  — Mehrfachauswahl, nur bei „wird gefüllt"
    └── Arbeitsnotiz                               GEÄNDERT — gemeinsamer Baustein

Übungsordner /exercises
├── Listen- und Kartenansicht → Übungszeile        NEU  — Varianten nur zum Ansehen
├── Detailseite → Arbeitsnotiz                     GEÄNDERT — nur Benennung
└── Wizard, Schnell-Anlegen → Arbeitsnotiz         GEÄNDERT — gemeinsamer Baustein
```

**Zwei gemeinsame Bausteine tragen die Einheitlichkeit**, statt sie an acht Stellen einzeln
nachzubauen:

| Baustein | Was er ist | Wo er sitzt |
|---|---|---|
| **Übungszeile** | Material · Organisationsform · „Varianten (n)" in fester Reihenfolge. Kennt zwei Betriebsarten: nur ansehen, oder eine Form auswählen | Eintrags-Karte, Auswahldialog, Übungsordner (Liste und Karten) |
| **Arbeitsnotiz** | Einmal als Eingabefeld (Name, Erklärtext, hellgrünes Feld), einmal als Anzeige (hellgrüner Block mit Überschrift) | Wizard, Schnell-Anlegen, Generator-Phase, Bearbeiten-Modus, Detailseite, Stundenverlauf |

### N2) Was zusätzlich gespeichert wird

| Was | Änderung | Warum |
|---|---|---|
| **Segment: geplante freie Minuten** | Neu, eine Zahl, standardmäßig 0 | Trägt die Erklärung „geplante Lücke" — siehe N3 |
| **Segment: Organisationsformen** | Neu, eine Liste, standardmäßig leer | Die Auswahl aus den Generator-Einstellungen der Phase |
| **Speicher-Funktion des Editors** | Nimmt die geplanten Minuten je Segment mit und **weist ab, wenn eine offene Lücke bleibt** | Die Regel „keine gespeicherte Einheit mit gelbem Feld" gilt damit auch am Server, nicht nur an der Oberfläche |
| **Übungen, Varianten, Notizen** | **Nichts.** „Arbeitsnotiz" ist eine Umbenennung an der Oberfläche; die Felder in der Datenbank heißen, wie sie heißen | Eine Umbenennung in der Datenbank brächte dem Nutzer nichts und wäre ein Eingriff in ein ausgeliefertes Feature |

**Eine Migration**, rein hinzufügend: zwei Felder am Segment, eine neue Fassung der
Speicher-Funktion. Bestehende Einheiten bekommen 0 geplante Minuten und keine Organisationsform —
sie verhalten sich wie bisher. Angewendet über den SQL-Editor des Dashboards, mit Eintrag im
Register. **Reihenfolge beim Ausrollen wie beim letzten Mal: erst die Migration, dann der Code.**

Im Browser merkt sich die Seite zusätzlich **eine** Sache dauerhaft: ob „Arbeitsnotizen anzeigen"
an oder aus ist. Das ist eine Bequemlichkeit je Gerät und gehört nicht in die Datenbank.

### N3) Geplante Lücke

**Gespeichert wird eine Zahl, kein Ja/Nein:** „in diesem Segment sind bis zu 2 freie Minuten
geplant". Daraus ergibt sich die Regel, die die Spec verlangt, von selbst:

| Stand des Segments | Ergebnis |
|---|---|
| frei ≤ geplant | geplante Lücke, ruhig dargestellt |
| frei > geplant | offene Lücke, gelb, sperrt das Speichern |
| nichts frei | keine Lücke; die Zahl bleibt ohne Wirkung |
| Segment stand im Generator auf „frei lassen" | immer geplant, unabhängig von der Zahl |

Erklärt der Nutzer 2 freie Minuten als geplant und entfernt danach eine Übung, sind 7 Minuten
frei — mehr als geplant, also wieder offen. Füllt er dagegen eine Minute nach, bleibt die
kleinere Lücke geplant. Es braucht keine eigene Logik, die der Erklärung „nachläuft".

- **In der Arbeitsfassung** steht die Zahl am Segment. „Als geplante Lücke stehen lassen" setzt
  sie auf die gerade freien Minuten, „Wieder öffnen" auf 0. Beides sind Operationen wie die
  übrigen sieben: sie zählen in der Leiste und fallen unter „Rückgängig", ohne Sonderweg
- **„Alle als geplant übernehmen und speichern"** wendet dieselbe Operation auf jedes Segment mit
  offener Lücke an und speichert dann
- **Der Server prüft dieselbe Regel** in der Speicher-Funktion: bleibt in einem Segment mehr frei
  als geplant, wird nichts geschrieben
- **Ein Speicherweg statt zwei.** „Einheit speichern" an einem frischen Entwurf läuft künftig
  über dieselbe Speicher-Funktion wie der Bearbeiten-Modus, mit dem unveränderten Plan. Der alte,
  getrennte Weg entfällt — sonst müsste die Lückenregel an zwei Stellen stehen
- **„Lockern" und „Neu generieren"** füllen ein Segment neu und setzen dessen geplante Minuten
  dabei auf 0 zurück: die Erklärung galt dem alten Inhalt
- **Die Begründung des Generators** bleibt an einer geplanten Lücke gespeichert, wird aber nicht
  gezeigt. Öffnet der Nutzer die Lücke wieder, ist sie noch da

### N4) Organisationsform als Kriterium

Die Organisationsform kommt als **weiteres Kriterium in die eine Kriterienliste** des Generators.
Damit gilt sie ohne weiteres Zutun an allen Stellen, die diese Liste befragen: beim Generieren,
in der Aufschlüsselung des Lückenhinweises, in der Begründung je Übung im Auswahldialog und beim
Auswürfeln.

Das Lockern bekommt eine Stufe mehr:

| Stufe | Freigegeben |
|---|---|
| 0 | nichts |
| 1 | Organisationsform |
| 2 | zusätzlich Schwierigkeit |
| 3 | zusätzlich Sportart |

Hat eine Phase keine Organisationsform gewählt, wird Stufe 1 übersprungen — sie würde nichts
ändern und im Lockerungs-Hinweis etwas behaupten, das nicht stattgefunden hat.

Zur Auswahl stehen dieselben Organisationsformen wie im Übungs-Wizard, die vordefinierten und die
eigenen des Nutzers. Neue anlegen kann man hier nicht — das bleibt bei den Übungen.

### N5) Auswürfeln nach den Regeln des Generators

Der Generator zieht **erst eine Sportart, dann eine Übung** — die Hauptsportart liegt zweimal im
Topf. Das Auswürfeln macht künftig dasselbe für den einen Platz:

1. Aus dem, was noch gezogen werden darf, bleiben zuerst nur die **frischen** Übungen — die nicht
   in den letzten zwei gespeicherten Einheiten der Gruppe vorkamen. Gibt es keine, gelten alle
2. Eine Sportart wird gezogen, die Hauptsportart der Phase mit doppeltem Gewicht
3. Unter den Übungen dieser Sportart wird zufällig gezogen. Hat sie keine mehr, unter allen

Dafür bringt die Kandidatenliste je Übung **ein** Merkmal mehr mit: „kürzlich verwendet". Der
Server rechnet es beim Laden der Liste aus, über denselben Weg wie der Generator; die Einheit
selbst zählt dabei nicht mit. Die Ziehung bleibt im Browser und damit ohne Wartezeit.

**Was nicht übertragbar ist:** der Generator wechselt über eine *Folge* von Übungen zwischen den
Sportarten ab. Ein einzelner Platz hat keine Folge. Die Gewichtung ist dieselbe, das Abwechseln
über mehrere Würfe hinweg gibt es nicht.

### N6) Varianten: eine Zeile je Übung

In den Daten bleiben Varianten, was sie sind — eigene Kandidaten, wie im Generator. Nur die
**Darstellung** fasst sie zusammen. Damit ändert sich an Auswürfeln, Eignungsprüfung und
Speichern nichts.

**Auf der Karte:** die Karte kennt künftig die Namen der Varianten, nicht nur ihre Anzahl; die
Stundenansicht lädt sie ohnehin schon mit. Das Aufklappen braucht deshalb keinen Server. Erst die
*Auswahl* im Bearbeiten-Modus braucht Material, Dauer und Organisationsform der gewählten Form —
die kommen aus der Kandidatenliste des Segments, die beim ersten Bedarf einmal geladen wird, wie
bisher.

**Im Auswahldialog** — die offene Frage aus der Überarbeitung, hier entschieden:

| | Regel |
|---|---|
| Wo steht die Zeile? | Unter „Passend", sobald **eine** ihrer Formen passt |
| Was setzt ein Klick auf die Zeile ein? | Die Grundübung, wenn sie passt — sonst die erste passende Variante. Die Zeile sagt vorher, welche |
| Was zeigt das Aufklappen? | Jede Form mit ihrer eigenen Eignung; ein Klick auf einen Namen setzt genau diese ein |
| Was zählt „Passend (14)"? | Übungen, nicht Formen |
| Wonach sucht die Suche? | Name der Übung und Titel aller Varianten |

**Im Übungsordner** führt die ganze Zeile heute auf die Detailseite. „Varianten (n)" wird dort
ein eigenes Bedienelement, das aufklappt, ohne die Seite zu wechseln.

### N7) Arbeitsnotiz der Übung im Stundenverlauf

Die Stundenansicht lädt die Arbeitsnotiz mit den Übungen der Einheit — auf demselben Weg, auf dem
sie heute schon die Beschreibung holt. Angezeigt wird sie nur in der Leseansicht.

**Die schlanke Kandidatenliste bleibt schlank.** Im Bearbeiten-Modus werden die Notizen nicht
gezeigt, also braucht eine frisch eingesetzte Übung dort keine. Nach dem Speichern lädt die Seite
die Einheit neu, und die Notiz ist da.

### N8) Kein stilles Nichts beim Auswürfeln

| Befund | Abhilfe |
|---|---|
| Ein Ladefehler der Kandidatenliste war nur im (geschlossenen) Auswahldialog zu sehen | Das Auswürfeln meldet ihn selbst, an Ort und Stelle |
| Ein Klick während eines laufenden Auswürfelns wurde fast unsichtbar ignoriert | Die Karte, an der gewürfelt wird, zeigt es selbst; an den übrigen Karten ist „Neu auswürfeln" so lange **ausgegraut** statt folgenlos klickbar |
| „Lockern" im Bearbeiten-Modus lud die Seite neu und setzte die Arbeitsfassung zurück | Dort nicht mehr angeboten (N3) |
| **Dahinter liegende Schwäche:** die Arbeitsfassung wurde bei *jedem* Nachladen der Seitendaten neu aufgesetzt, egal aus welchem Anlass | Sie wird nur noch an zwei Stellen gesetzt: beim Betreten des Bearbeiten-Modus und nach einem gelungenen Speichern. Ein Nachladen aus anderem Grund kann offene Änderungen dann nicht mehr verwerfen |

Der letzte Punkt ist die Absicherung gegen Ursachen, die noch nicht gefunden sind: was immer die
Seite sonst zum Nachladen bringt, kostet den Nutzer nicht mehr seine Arbeit.

Das Auswürfeln bekommt dazu einen festen Vertrag: es endet in genau einem von drei Ausgängen —
neue Übung, Begründung, Fehlermeldung — und jeder davon ist sichtbar. Als reine Logik prüfbar.

### N9) Pakete

**Keine neuen.** Aufklappen, Schalter und Mehrfachauswahl sind im Baukasten vorhanden.

### N10) Reihenfolge des Bauens

1. **Logik mit Tests:** geplante Minuten in der Arbeitsfassung (zwei neue Operationen, Regel
   offen/geplant), gewichtete Ziehung, Zusammenfassen der Kandidaten je Übung für den Dialog,
   Organisationsform in der Kriterienliste samt neuer Lockerungsstufe
2. **Datenbank:** die eine Migration
3. **Serverseite:** Stundenansicht liefert Variantennamen und Arbeitsnotiz, Kandidatenliste
   liefert „kürzlich verwendet", Speichern nimmt geplante Minuten mit, der alte Speicherweg
   entfällt, Generator liest und schreibt die Organisationsform
4. **Die zwei Bausteine:** Übungszeile, Arbeitsnotiz
5. **Einbauen:** Stundenverlauf, Auswahldialog, Speichern-Dialog, Generator-Einstellungen,
   Übungsordner, Wizard, Schnell-Anlegen
6. **Aufräumen:** Variantendialog und Menüpunkt entfernen, „Lockern" aus dem Bearbeiten-Modus,
   doppelter Einfügen-Knopf, Rahmen um Karte und Bedienzeile

### N11) Was dieser Nachtrag offen lässt

- **Gespeicherte Einheiten von früher mit offener Lücke** behalten ihr gelbes Feld, bis sie das
  nächste Mal gespeichert werden. Es wird nichts rückwirkend umgeschrieben
- **Die Ursache des folgenlosen Auswürfelns ist nicht nachgestellt.** N8 schließt die belegten
  Wege und sichert gegen unbelegte ab; ob die Beobachtung damit verschwindet, zeigt der Test
- **„Kürzlich verwendet" veraltet** während des Bearbeitens nicht merklich — es hängt an
  gespeicherten Einheiten, und die entstehen nicht nebenbei

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

## Implementation Notes (Backend)

**Stand:** 2026-10-08 · Typprüfung, Lint und Produktionsbuild sauber · **375 Unit-Tests grün**
(342 vorher plus 33 neue)

**Migration am 2026-10-08 angewendet und am lebenden System nachgewiesen** — über den SQL-Editor
des Dashboards, im Register eingetragen (14 zu 14). Der Nachweis lief als ein Block in einer
zurückgerollten Transaktion, unter der Rolle `authenticated` und damit mit den Richtlinien; danach
geprüft, dass nichts zurückgeblieben ist. Siehe „Nachweis am lebenden System" unten.

**Reihenfolge beim Ausrollen: erst die Migration, dann der Code.** Der Code liest die neue Spalte
`needs_completion` schon beim Laden der Übungen für Generator und Stundenansicht. Läuft er gegen
eine Datenbank ohne die Spalte, schlägt diese Abfrage fehl — der Generator meldet dann Lücken, und
gespeicherte Einheiten zeigen Platzhalter statt Übungen. Die Migration ist rein additiv und kann
gefahrlos vor dem Code angewendet werden. Das gilt auch für die lokale Entwicklung.

### Datenbank

Migration `20261008090000_unit_editor_save_and_needs_completion.sql`:

| Was | Einzelheiten |
|---|---|
| `exercises.needs_completion` | Wahrheitswert, Standard `false` — alle bestehenden Übungen gelten als vollständig, ohne dass eine Zeile beschrieben wird. Dazu ein Teilindex nur über die markierten Zeilen |
| Funktion `save_unit_plan` | Legt den Plan in einem Zug ab. Gibt `ok` oder `stale` zurück, alles andere ist eine Ausnahme und rollt zurück. Läuft mit den Rechten des Aufrufers — die Richtlinien aus BUG-4 bleiben darunter wirksam. Aufrufbar nur für angemeldete Nutzer |

Keine Richtlinie wurde angefasst, keine Tabelle ist dazugekommen.

### Die drei Server-Stellen

Alle in `src/lib/actions/units.ts`, von der Seite `/units/[id]` als `editorActions` mitgegeben:

| Vertrag | Server Action | Was sie tut |
|---|---|---|
| `loadPool` | `getEditorPool(segmentId)` | Eigentum über die Einheit prüfen, dann **alle** Übungen des Nutzers samt Varianten liefern, jede mit den Kriterien, an denen sie in diesem Segment scheitert. Wirft bei einem Lesefehler, statt eine leere Liste zu liefern — sonst sähe ein Fehler aus wie „du hast noch keine Übungen" |
| `savePlan` | `saveUnitPlan(unitId, draft, options)` | Arbeitsfassung prüfen (Zod), dann die Datenbank-Funktion rufen. Anzeigedaten und weggewürfelte Kandidaten fallen bei der Prüfung weg |
| `quickCreate` | `quickCreateExercise(segmentId, input)` | Namensabgleich über alle Übungen des Nutzers, sonst sofort anlegen — Sportarten, Phase und Schwierigkeit aus dem Segment, Altersgruppen aus der Gruppe, Markierung gesetzt |

Die Kriterienprüfung je Kandidat ist `failedCriteriaOf` in `generator.ts` — sie befragt dieselbe
Kriterienliste, mit der der Generator den Pool baut. Ein Test hält fest, dass beide gleich
urteilen: was der Generator einplant, hat kein verfehltes Kriterium.

### Erweiterung an PROJ-3

- `updateExercise` löscht die Markierung — die eine Stelle, an der sie verschwindet
- `getExercises` kennt den Filter „nur noch zu ergänzende"; in der Werkzeugleiste ein Schalter im
  Filterbereich samt Chip
- Die Markierung steht in Listen- und Kartenansicht und auf der Detailseite, dort mit dem Satz, wie
  sie wieder verschwindet

### Entscheidungen, die beim Bauen fielen

| Entscheidung | Begründung |
|---|---|
| Die Kandidatenliste enthält **alle** Übungen, nicht nur die der Phase; „Phase" ist ein eigenes verfehltes Kriterium | Das Tech Design ließ offen, was „die Kandidaten eines Segments" umfasst. Nur mit allen stimmt der Leerzustand „du hast noch keine Übungen", kann der Übungsleiter eine Aufwärmübung bewusst in den Hauptteil setzen, und findet „Variante umschalten" die Geschwister einer selbst gewählten Übung. Preis: bei 100 Übungen wandern 100 schlanke Einträge in den Browser statt einer Teilmenge |
| Nur **umgebaute** Segmente werden ersetzt | Ein Segment, dessen Folge aus Übung, Variante und Plandauer gleich geblieben ist, bleibt unangetastet und behält seine Lückenbegründung. Eine reine Notizänderung verwirft sie nicht — die Begründung stimmt dann ja noch |
| Eine nicht sichtbare Übung wird zum **Platzhalter**, das Speichern scheitert nicht | Edge Case 3 verlangt das für eine anderswo gelöschte Übung. Siehe die Abweichung unten |
| Verwendungsnachweise: unveränderte Übungen **behalten** ihren Zeitpunkt | Vollständiges Neuaufbauen bei jedem Speichern würde den Zeitpunkt aller Übungen auf den letzten Handgriff ziehen. Entfernte fallen weg, neue kommen dazu |
| Wird ein Entwurf gespeichert, entstehen alle Nachweise **neu** | Damit steht der Zeitpunkt auf „gespeichert" und nicht auf „generiert" — **BUG-6**. Gilt für beide Wege: `save_unit_plan` und das bestehende `saveUnit` |
| Die Meldung beim erschöpften Vorrat rechnet der Browser aus der geladenen Liste | Vorher stand dort die Begründung, die der Generator beim Erzeugen hinterlegt hatte — sie beschreibt den Stand von damals, nicht den nach drei Würfen. Jetzt: jede Ursache einzeln mit Anzahl, dazu „steht schon in dieser Einheit" und „hier schon weggewürfelt" (`describeExhaustion`) |
| Kein Rate Limiting | Alle drei Stellen verlangen eine Anmeldung und schreiben nur ins eigene Konto. Laut Checkliste für das MVP optional |

### Abweichungen von der Spec

- **„Fremde Übung wird abgewiesen" ist nur halb erfüllt.** Unter den Leserichtlinien kann die
  Datenbank-Funktion eine fremde Übung nicht von einer gelöschten unterscheiden — beide sind für
  den Aufrufer unsichtbar. Beide werden als Platzhalter abgelegt. Ein fremder Verweis wird also
  **in keinem Fall geschrieben**, das Speichern als Ganzes meldet aber Erfolg statt einer Abweisung.
  Unterscheiden ließe sich das nur mit einer Funktion, die die Richtlinien umgeht; das wäre die
  schlechtere Wahl. Über die Oberfläche ist der Fall nicht erreichbar, nur über einen von Hand
  gebauten Aufruf
- **Edge Case 10 (gelöschte Variante)** — der Eintrag fällt auf die **Hauptübung** zurück, statt
  zum Platzhalter zu werden. So verhält sich die Stundenansicht seit PROJ-6, und die Datenbank
  setzt beim Löschen einer Variante nur den Variantenverweis zurück. Der Editor folgt dem
- **Schnell-Anlegen verlangt eine Beschreibung.** Die Übungstabelle lässt keine leere zu. Das
  Formular prüft im Browser nur den Namen; fehlt die Beschreibung, kommt die Meldung vom Server und
  die Eingaben bleiben stehen

### Nebenbei behoben

- **BUG-16** — `saveUnit` und `renameUnit` melden jetzt einen Fehler, wenn das Update keine Zeile
  trifft. **Nicht** angefasst: `generateUnit` löscht Entwürfe weiter kontoweit. Das einzuschränken
  hieße, die Regel „höchstens ein Entwurf je Nutzer" zu ändern — eine Produktentscheidung
- **Ein Entwurf verlor beim Speichern aus dem Bearbeiten-Modus seine Änderungen.** Der
  Namensdialog rief das alte `saveUnit` und sicherte den Entwurf ohne die Arbeitsfassung. Jetzt
  gehen Name und Änderungen in einem Zug durch `savePlan`
- **„Neu laden" im Dialog „Anderswo geändert"** ließ den Dialog offen stehen
- **Leerzustand der Übungsübersicht** — die Prüfung „ist ein Filter aktiv?" hätte den
  ausgeschalteten neuen Schalter als aktiven Filter gezählt

### Nachweis am lebenden System (2026-10-08)

Vorab: Spalte, Teilindex und Funktion vorhanden; die Funktion läuft mit den Rechten des Aufrufers,
mit festem `search_path`, ausführbar für `authenticated`, nicht für `anon`.

| Fall | Ergebnis |
|---|---|
| Veralteter Änderungsstempel | `stale`, nichts geschrieben, Stempel unverändert |
| Speichern ohne inhaltliche Änderung | `ok`, Einträge behalten ihre Kennungen, „manuell bearbeitet" bleibt aus, Stempel wird nachgezogen, Nachweise behalten ihren Zeitpunkt |
| Segment leeren, Übung tauschen, Plandauer ändern, Notiz setzen | `ok`, alles geschrieben, Lückenbegründung der umgebauten Segmente verworfen, „manuell bearbeitet" gesetzt |
| Verwendungsnachweise danach | entfernte Übung weg, neue da, behaltene mit altem Zeitpunkt, Anzahl gleich Anzahl der Übungen im Plan |
| Unbekannte Übung | als Platzhalter abgelegt, Speichern gelingt (Edge Case 3) |
| Variante einer anderen Übung | Variantenverweis verworfen, Hauptübung bleibt |
| Segment fehlt / fremde Segmentkennung / doppelte Segmentkennung | jeweils `segments_changed`, nichts geschrieben |
| Gültige Änderung im einen Segment, Plandauer 0 im anderen | abgewiesen (`23514`), **nichts halb geschrieben** |
| `force` bei veraltetem Stempel | `ok` |
| Leerer Name | `invalid_name` |
| Entwurf wird gespeichert | `saved` gesetzt, Name getrimmt übernommen, **alle** Nachweise tragen den Zeitpunkt des Speicherns (BUG-6) |
| Übung eines anderen Nutzers | `ok`, fremder Verweis **nicht** geschrieben, Platzhalter an seiner Stelle, kein fremder Nachweis — die oben beschriebene Abweichung, so bestätigt |
| Einheit eines anderen Nutzers | `unit_not_found` |
| Aufruf ohne Nutzer | `not_authenticated` |

`get_advisors` (Sicherheit) meldet danach weiterhin nur den erwarteten Hinweis zum Schutz gegen
geleakte Passwörter — die neue Funktion erzeugt keinen.

**Was dieser Nachweis nicht abdeckt:** die Server Actions und die Oberfläche selbst. Das
Zusammenspiel Browser → Server Action → Funktion ist noch nicht durchgespielt.

### Was noch aussteht

1. **Im Browser durchspielen** — Auswürfeln, Auswahldialog, Variante umschalten, Schnell-Anlegen,
   Speichern einer gespeicherten Einheit und eines Entwurfs, zwei Tabs
2. E2E-Tests für den Editor — gehören zu `/qa`

## Implementation Notes (Frontend) — Überarbeitung vom 2026-10-09

**Stand:** 2026-10-09 · Typprüfung, Lint und Produktionsbuild sauber · **420 Unit-Tests grün**
(375 vorher plus 45 neue) · **im Browser noch nicht durchgespielt**

Gebaut nach der Reihenfolge aus dem Nachtrag (N10): erst die Logik mit Tests, dann die zwei
gemeinsamen Bausteine, dann der Einbau.

### Neu

| Datei | Was es ist |
|---|---|
| `src/components/exercises/exercise-facts-row.tsx` | **Die Übungszeile** — Material · Organisationsform · „Varianten (n)" in fester Reihenfolge. Zwei Betriebsarten: nur ansehen, oder eine Form auswählen |
| `src/components/exercises/work-note.tsx` | **Die Arbeitsnotiz** — als Eingabefeld (Name, Erklärtext, hellgrünes Feld) und als Anzeige. Name und Erklärtexte stehen dort an einer Stelle |
| `src/components/units/planned-gap.tsx` | Die geplante Lücke: ruhig, mit Minuten, im Bearbeiten-Modus mit „Übung einfügen" und „Wieder öffnen" |
| `src/hooks/use-stored-flag.ts` | Merkt „Arbeitsnotizen anzeigen" im Browser |

### Geändert

| Ort | Änderung |
|---|---|
| `draft.ts` | Geplante Minuten am Segment, zwei neue Operationen (`declarePlannedGap`, `reopenGap`), die eine Regel `gapState`, dazu `openGaps` und `declareAllOpenGaps`. Geplante Minuten zählen beim Vergleich zweier Stände mit |
| `generator.ts` | Organisationsform in der Kriterienliste, eine Lockerungsstufe mehr (übersprungen ohne Auswahl), der Lockerungs-Hinweis nennt nur, was freigegeben wurde |
| `editor-pool.ts` | Gewichtete Ziehung (frisch zuerst, dann Sportart, dann Übung), `groupForPicker` statt `splitForPicker`, Variantennamen und „kürzlich verwendet" je Kandidat |
| `unit-plan-view.tsx` | Ein Speicherweg, Lückenregel, Schalter für Arbeitsnotizen, Variantenwahl auf der Karte, die Arbeitsfassung folgt der Einheit nur noch außerhalb des Bearbeiten-Modus |
| `unit-item-card.tsx` / `unit-item-controls.tsx` | Karte und Bedienzeile in **einem** Rahmen; die Würfel-Anzeige liegt auf der Karte; „Variante umschalten" ist aus dem Menü heraus |
| `gap-notice.tsx` | „Als geplante Lücke stehen lassen"; „Lockern" nur noch in der Leseansicht; Organisationsform als Ursache |
| `save-changes-prompt.tsx` | Nennt offene Lücken und Überfüllung getrennt; „Alle als geplant übernehmen und speichern" |
| `exercise-picker-dialog.tsx` | Eine Zeile je Übung mit Übungszeile |
| `segment-editor.tsx` (Generator) | Mehrfachauswahl „Organisationsform(en)", Arbeitsnotiz über den gemeinsamen Baustein |
| Übungsordner, Wizard, Detailseite, Schnell-Anlegen | Übungszeile bzw. Arbeitsnotiz über die gemeinsamen Bausteine |
| `variant-switch-dialog.tsx` | **entfernt** |

### Entscheidungen, die beim Bauen fielen

| Entscheidung | Begründung |
|---|---|
| Fehlt die Organisationsform, steht an ihrem Platz ein Strich | „Der Platz bleibt leer" wörtlich genommen ließe die Varianten nachrücken. Der Strich hält den Platz und sagt zugleich, dass nichts angegeben ist |
| Die Organisationsform steht nur noch in der Übungszeile, nicht mehr zusätzlich als Marke neben Sportart und Schwierigkeit | Dieselbe Angabe zweimal auf einer Karte |
| „Alle als geplant übernehmen" landet in der **Leseansicht** nicht in der Arbeitsfassung | Dort gibt es keine sichtbare Arbeitsfassung. Bräche der Nutzer im Namensdialog ab, stünde sonst eine Erklärung im Raum, die er nicht sieht — und das nächste Speichern fragte nicht mehr nach |
| „Neu laden" im Dialog „Anderswo geändert" verlässt den Bearbeiten-Modus | Die Arbeitsfassung folgt der Einheit nur außerhalb des Modus (N8). Die Änderungen sind an dieser Stelle laut Dialog ohnehin verloren |
| Im Übungsordner steht die Übungszeile **neben** dem Verweis auf die Detailseite, nicht in ihm | Ein Bedienelement in einem Verweis ist ungültig und würde beim Aufklappen die Seite wechseln |
| Die Stufen des Lockerns sind neu nummeriert, die Startwerte je Stufe nicht | Eine Phase ohne Organisationsform würfelt beim Lockern genau wie vorher; nur zwei Tests mussten die neue Nummer lernen |
| Im Auswahldialog steht die Dauer rechts in der Zeile, das Material in der Übungszeile | Sonst stünde das Material zweimal da |

### Was ohne `/backend` noch nicht trägt

Die Oberfläche ist fertig, drei Dinge hängen an der Migration aus dem Nachtrag (N2):

1. **Die geplante Lücke wird nicht gespeichert.** Im Bearbeiten-Modus funktioniert sie vollständig
   (erklären, öffnen, rückgängig, Sperre, Dialog). Die Speicher-Funktion der Datenbank kennt das
   Feld aber noch nicht — nach dem Speichern und Neuladen ist die Lücke wieder gelb. Auch die
   Prüfung am Server fehlt noch
2. **Die Organisationsform der Phase wirkt nur beim ersten Generieren.** Sie wird am Segment noch
   nicht abgelegt: „Neu generieren", „Lockern", „Zurück zum Generator" und die Kandidatenliste des
   Editors kennen sie danach nicht mehr
3. **„Schnell anlegen" belegt die Organisationsform noch nicht vor**

Schon angeschlossen, weil es ohne Datenbankänderung ging: Variantennamen und Arbeitsnotiz in der
Stundenansicht, „kürzlich verwendet" in der Kandidatenliste.

Für `/backend` außerdem: der alte Speicherweg `saveUnit` wird von der Oberfläche nicht mehr
benutzt und kann entfallen; die Typen der Datenbank sind nach der Migration neu zu erzeugen.

### Nach der Durchsicht im Browser nachgeschärft (2026-10-09)

Der Nutzer hat die Oberfläche im Browser angesehen und abgenommen. Dabei geändert:

- **Dialog „Eine Lücke ist noch offen"** — Text und Knöpfe ragten über den Rand. Die Knöpfe stehen
  jetzt untereinander in voller Breite, lange Beschriftungen brechen um. „ruhig und" ist aus dem
  Text gestrichen
- **Lückenhinweis in der Leseansicht** — unter dem Lockern steht der Verweis auf „Bearbeiten" für
  die zwei weiteren Handhaben (Übungen einfügen oder Lücke stehen lassen)
- **Reihenfolge unter „Was hilft"** — zuerst, was sich im Generator für die Phase ändern lässt
  („Hake im Generator für diese Phase …"), danach das Übrige
- **„Segment" heißt in der ganzen Oberfläche „Phase"** — Generator, Stundenansicht, Lückenhinweis,
  Fehlermeldungen. Im Code und in dieser Spec bleibt „Segment" der technische Begriff. Das Wort
  „Abschnitt", das der Editor an einigen Stellen für dasselbe benutzt, ist nicht angefasst
- **„Variante: …" auf der Karte** steht in Größe, Dicke und Farbe wie der Name der Grundübung

**Dunkelmodus:** die dunklen Farben sind im Stylesheet angelegt, aber nichts schaltet sie ein — es
gibt weder einen Schalter noch folgt die App der Systemeinstellung. Als eigenes Feature auf der
Roadmap: PROJ-18.

## Implementation Notes (Backend) — Überarbeitung vom 2026-10-09

**Stand:** 2026-10-09 · Typprüfung, Lint und Produktionsbuild sauber · **420 Unit-Tests grün** ·
**Migration angewendet und am lebenden System nachgewiesen** · Register 15 zu 15

Damit sind die drei Stellen geschlossen, die die Oberfläche offen gelassen hatte: die geplante
Lücke wird gespeichert und am Server geprüft, die Organisationsform der Phase wird abgelegt, und
„Schnell anlegen" belegt sie vor.

### Datenbank

Migration `20261009150000_unit_planned_gaps_and_organization_forms.sql`, angewendet über den
SQL-Editor des Dashboards, im Register eingetragen:

| Was | Einzelheiten |
|---|---|
| `unit_segments.planned_gap_minutes` | Ganzzahl, Standard 0, nicht negativ. Bestehende Segmente haben 0 — nichts ist rückwirkend geplant |
| `unit_segments.organization_forms` | Liste, Standard leer — bestehende Einheiten sind nicht eingeschränkt |
| Funktion `save_unit_plan`, neue Fassung | Legt die geplanten Minuten je Segment ab und weist mit `open_gaps` ab, wenn in einem Segment, das gefüllt werden soll, mehr frei bleibt als geplant. Signatur, Rechte und alles Übrige unverändert |

Keine Richtlinie wurde angefasst, keine Tabelle ist dazugekommen. Die Prüfung läuft am
**geschriebenen** Stand am Ende der Funktion; schlägt sie an, rollt die Ausnahme alles Vorige
zurück.

### Serverseite

Alle in `src/lib/actions/units.ts`:

- **Organisationsform** wird beim Generieren am Segment abgelegt und überall gelesen, wo ein
  Segment zur Konfiguration wird — „Neu generieren", „Lockern", „Zurück zum Generator" und die
  Kandidatenliste des Editors kennen sie damit
- **Geplante Minuten** werden mit der Einheit gelesen. „Lockern" setzt sie für sein Segment auf 0:
  die Erklärung galt dem alten Inhalt. „Neu generieren" schreibt die Segmente neu und beginnt
  damit ebenfalls bei 0
- **`open_gaps`** bekommt eine Meldung in Worten. Die Oberfläche fragt vorher nach; hier landet
  nur, wer daran vorbei speichert
- **„Schnell anlegen"** übernimmt die Organisationsform der Phase, wenn dort **genau eine**
  gewählt ist, und zeigt sie im Formular unter dem Vorbelegten
- **Der alte Speicherweg `saveUnit` ist entfernt.** „Einheit speichern" läuft über
  `saveUnitPlan` — die Lückenregel steht damit an genau einer Stelle
- `database.types.ts` von Hand um die zwei Spalten ergänzt

### Nachweis am lebenden System (2026-10-09)

Vorab: beide Spalten mit Standardwert und ohne NULL vorhanden, die Prüfregel `>= 0` gesetzt, die
Funktion in **einer** Fassung, mit den Rechten des Aufrufers, festem `search_path`, ausführbar
für `authenticated`, nicht für `anon`.

Dann ein Block in einer zurückgerollten Transaktion unter der Rolle `authenticated`: ein Entwurf
mit vier Segmenten — Restlücke (8 von 10), leer (0 von 10), im Generator frei gelassen, voll.

| Fall | Ergebnis |
|---|---|
| Neue Segmente | Organisationsform leer, 0 Minuten geplant |
| Speichern mit zwei offenen Lücken | `open_gaps`, **nichts geschrieben** — Einheit bleibt Entwurf, die mitgeschickte Notiz ist nicht abgelegt |
| Beide Lücken erklärt, das frei gelassene Segment ohne Erklärung | `ok`, gespeichert, „manuell bearbeitet" gesetzt, abgelegt 2 / 10 / 0 / 0 |
| Danach das Segment mit der Restlücke geleert (10 frei, 2 geplant) | `open_gaps`, der Eintrag steht noch — nichts halb geschrieben |
| Lücke kleiner als geplant (1 frei, 2 geplant) | `ok` |
| Überfüllung (9 Minuten in 5) | `ok` |
| Angabe fehlt bei einem leeren Segment | gilt als 0, `open_gaps`, die abgelegte Zahl bleibt 10 |
| Negative Zahl | `invalid_plan` |
| Unveränderter Stand mit passendem Stempel / mit veraltetem | `ok` / `stale` |
| Verwendungsnachweise | 2, wie Übungen im Plan |

Danach geprüft: nichts zurückgeblieben, kein bestehendes Segment hat geplante Minuten bekommen.
`get_advisors` (Sicherheit) meldet weiterhin nur den bekannten Hinweis zum Schutz gegen geleakte
Passwörter.

### Entscheidungen, die beim Bauen fielen

| Entscheidung | Begründung |
|---|---|
| Die Lückenprüfung gilt bei **jedem** Speichern über die Funktion, auch an einer früher gespeicherten Einheit | So verlangt es Edge Case 16: die alte Einheit behält ihr gelbes Feld, bis sie das nächste Mal gespeichert wird — dann greift die Regel |
| Ein Platzhalter „Übung gelöscht" zählt mit seiner Plandauer als gefüllt | So rechnet ihn die Oberfläche. Zwei Rechnungen für dieselbe Lücke würden Fälle erzeugen, in denen der Dialog nichts meldet und der Server trotzdem abweist |
| Die geplanten Minuten werden abgelegt, wie sie kommen, nicht auf die tatsächlich freien gekürzt | Die Zahl ist eine Obergrenze. Sie zu kürzen hieße, dass ein Rückgängig-Schritt nach dem Speichern eine andere Zahl vorfände als vorher |
| „Schnell anlegen" belegt die Organisationsform nur bei genau einer gewählten vor | Bei mehreren müsste geraten werden, und eine falsch eingeordnete Übung ist schlechter als eine, die „noch zu ergänzen" ist |
| Kein Index auf den neuen Spalten | Keine Abfrage filtert oder sortiert danach; sie werden nur mit ihrem Segment gelesen |

### Was dieser Nachweis nicht abdeckt

Nachgewiesen ist die Datenbank-Funktion. **Nicht durchgespielt** ist der Weg Browser → Server
Action → Funktion mit den neuen Feldern: eine Lücke im Bearbeiten-Modus erklären, speichern, neu
laden und sie ruhig wiederfinden; eine Phase mit Organisationsform generieren, zurück in den
Generator gehen und die Auswahl wiederfinden; „Lockern" an einer Phase mit Organisationsform.

## QA Test Results

**Getestet:** 2026-10-09
**App:** Produktionsbuild auf http://localhost:3100 (`PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100`)
**Tester:** QA Engineer (AI)

### Ergebnis in einem Satz

Der Editor und die Überarbeitung vom 2026-10-09 tun, was die Spec verlangt — **mit einer
Ausnahme, die schwer wiegt und nicht aus PROJ-7 stammt: die App zeigt nirgends eine Meldung an**
(BUG-17). Daran scheitern 5 der 115 Akzeptanzkriterien. **Nicht bereit für die Auslieferung.**

### Was gelaufen ist

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests (`npm test`) | **420 von 420 grün** |
| Typprüfung, Lint, Produktionsbuild | sauber (Lint: 4 bekannte Warnungen zu `<img>`, keine Fehler) |
| Browser-Tests, bestehende Suite (PROJ-3, PROJ-5, PROJ-6) | **alle grün** — keine Regression. Ein erster Lauf brachte 3 Fehlschläge (einmal `fetch failed` zu Supabase, zweimal eine Antwort jenseits des Zeitfensters unter Last); mit zwei statt vier gleichzeitigen Arbeitern liefen dieselben Tests zweimal hintereinander durch |
| Browser-Tests, neu für PROJ-7 | 30 Tests, je einmal am Rechner und in Handybreite (iPhone 13): **56 von 60 grün**, 4 rot — zwei Tests in beiden Breiten, beide wegen BUG-17 |
| Gesamtlauf | 149 bestanden, 4 fehlgeschlagen, 1 nicht gelaufen (der Leerzustand-Test aus PROJ-6 hängt als letzte Stufe hinter den Editor-Tests und läuft nicht, solange dort etwas rot ist; im ersten Lauf des Tages war er grün) |
| Datenbank-Funktion am lebenden System | 10 Fälle in zurückgerollter Transaktion, alle wie erwartet (siehe Implementation Notes Backend, 2026-10-09) |

**Neu im Repository:** `tests/PROJ-7-einheiten-editor.spec.ts`, `tests/editor-fixtures.ts`, zwei
Projekte „editor" und „editor mobil" in `playwright.config.ts`. Die Editor-Tests bauen sich je
Test eine eigene Einheit und laufen in einer eigenen Stufe **nach** den übrigen: ihre gespeicherten
Einheiten stünden sonst in „Meine Einheiten", während die PROJ-6-Tests dort den Leerzustand
erwarten.

**Was nicht geprüft ist:** Firefox und echtes Safari/WebKit (auf diesem Rechner nicht
installierbar, siehe INDEX — die Handybreite lief in einem Chromium-Motor), die Tablet-Breite 768 px
als eigener Lauf, und die Anmutung der Oberfläche (Farben, Abstände) — die hat der Nutzer am
2026-10-09 selbst durchgesehen.

### Akzeptanzkriterien

115 Kriterien, **110 bestanden, 5 nicht bestanden.** „Browser" heißt: durch einen Browser-Test
belegt. „Logik" heißt: durch Unit-Tests oder den Nachweis an der Datenbank belegt. „Durchsicht"
heißt: nur am Code nachvollzogen, nicht im Browser gelaufen.

| Gruppe | Kriterien | Bestanden | Belegt durch |
|---|---|---|---|
| Bearbeiten-Modus betreten und verlassen | 9 | 9 | Browser; die Warnung beim Schließen des Tabs nur Durchsicht |
| Übung neu auswürfeln | 11 | **8** | Browser und Logik — **3 scheitern an BUG-17** |
| Übung selbst wählen | 6 | 6 | Browser; „aktuelle Übung als gewählt erkennbar" nur Durchsicht |
| Variante umschalten | 7 | 7 | Browser |
| Die einheitliche Übungszeile | 5 | 5 | Browser |
| Organisationsform im Generator | 8 | 8 | Logik; die Auswahl selbst im Browser. „Zurück zum Generator erhält die Auswahl" und „Lockern gibt sie als Erstes frei" nur Logik und Durchsicht, nicht als Klickweg |
| Entfernen, Dauer, Reihenfolge | 7 | 7 | Browser |
| Lücken, Platzhalter und Einfügen | 8 | 8 | Browser; das Nachbesetzen des Platzhalters „Übung gelöscht" nur Logik und Durchsicht |
| Geplante Lücke | 9 | 9 | Browser, Logik und Datenbank |
| Schnell anlegen | 10 | 10 | Browser; der Namensabgleich und das Verschwinden der Markierung nur Durchsicht |
| Arbeitsnotiz | 12 | 12 | Browser; der Wizard nur Durchsicht |
| Speichern, Verwerfen, Rückgängig | 16 | 16 | Browser und Datenbank |
| Fehlerfälle | 4 | **2** | **2 scheitern an BUG-17** |
| Datentrennung | 3 | 3 | Datenbank und die bestehenden Tests ohne Anmeldung |

**Die fünf nicht bestandenen Kriterien — alle aus demselben Grund:**

- [ ] BUG-17: Ist der Kandidatenvorrat erschöpft, erscheint **keine** Meldung mit den Ursachen
- [ ] BUG-17: Ein Klick auf „neu auswürfeln" endet **nicht** in jedem Fall sichtbar — bei erschöpftem Vorrat und bei einem Fehler ist nichts zu sehen
- [ ] BUG-17: Lässt sich die Kandidatenliste beim Auswürfeln nicht laden, erscheint **keine** Fehlermeldung
- [ ] BUG-17: Schlägt das Speichern fehl, erscheint **keine** Fehlermeldung (die Änderungen bleiben erhalten, der Nutzer erfährt aber nicht, dass nichts gespeichert wurde)
- [ ] BUG-17: Bricht die Verbindung beim Auswürfeln ab, erscheint **keine** Fehlermeldung

### Edge Cases

| # | Fall | Ergebnis |
|---|---|---|
| 1, 2 | Alle Übungen eines Segments / der Einheit entfernt | bestanden (Logik, Datenbank) |
| 3 | Übung in anderem Tab gelöscht | bestanden (Datenbank: Platzhalter statt Fehler) |
| 4 | Zwei Tabs speichern | bestanden (Browser: „Anderswo geändert", Überschreiben wirkt) |
| 5 | Auswürfeln mit nur einem Kandidaten | **nicht bestanden — BUG-17**: die Übung bleibt stehen, die Meldung fehlt. Genau das „stille Nichts-Passiert", das der Fall ausschließt |
| 6 | Plandauer größer als die Einheit | bestanden (Browser: Überfüllung ausgewiesen und speicherbar) |
| 7 | Dieselbe Übung zweimal gewählt | bestanden (Durchsicht: Hinweis im Dialog, kein Verbot) |
| 8 | Neuladen mit offenen Änderungen | bestanden (Durchsicht: Warnung des Browsers) |
| 9 | Schnell angelegt, dann verworfen | bestanden (Browser: Übung bleibt, Dialog sagt es) |
| 10 | Variante gelöscht | wie in den Implementation Notes vom 2026-10-08 beschrieben: Rückfall auf die Grundübung statt Platzhalter — bekannte Abweichung, unverändert |
| 11 | Nur die Arbeitsnotiz geändert | bestanden (Browser) |
| 12 | Gruppe gelöscht während des Bearbeitens | bestanden in der Sache (Datenbank: `unit_not_found`), **die Meldung dazu fehlt — BUG-17** |
| 13 | Zweiter Wurf während eines laufenden | bestanden (Durchsicht: Anzeige auf der Karte, übrige Würfel ausgegraut) |
| 14 | Sehr viele Einträge | nicht eigens geprüft |
| 15 | Lockerungs-Hinweis bleibt | bestanden (Durchsicht) |
| 16 | Früher gespeicherte Einheit mit offener Lücke | bestanden (Browser: gelber Hinweis bleibt, Verweis auf „Bearbeiten") |
| 17 | Variante im Platz wird neu ausgewürfelt | bestanden nach dem Wortlaut — siehe aber BUG-20 |
| 18 | Unpassende Organisationsform bewusst gewählt | bestanden (Browser: unpassende Übung ohne Nachfrage einsetzbar) |
| 19 | Frei gelassene Phase mit Organisationsform | bestanden (Logik) |
| 20 | Sehr lange Arbeitsnotiz | bestanden (Durchsicht: kein Abschneiden) |

### Sicherheit

- [x] **Anmeldung:** ohne Sitzung leitet jede geschützte Seite auf den Login um (bestehende Tests, grün)
- [x] **Fremde Einheit:** die Speicher-Funktion meldet `unit_not_found`; sie läuft mit den Rechten des Aufrufers, die Richtlinien aus BUG-4 liegen darunter
- [x] **Fremde Übung:** wird nie geschrieben (Platzhalter) — die bekannte Abweichung vom 2026-10-08, unverändert und weiter vertretbar
- [x] **Lückenregel nicht umgehbar:** wer an der Oberfläche vorbei speichert, scheitert in der Datenbank an `open_gaps`; nichts wird halb geschrieben
- [x] **Eingaben:** die Arbeitsfassung, die Organisationsformen und das Schnell-Anlegen laufen durch Zod; negative geplante Minuten weist zusätzlich die Datenbank ab. Texte werden überall als Text ausgegeben, nicht als HTML
- [x] **Keine Geheimnisse im Browser:** die Kandidatenliste trägt nur die eigenen Übungen in der schlanken Fassung
- [x] **Supabase-Hinweise:** unverändert nur der bekannte zum Schutz gegen geleakte Passwörter
- [ ] **Kein Rate Limiting** an den Server Actions — wie am 2026-10-08 festgehalten, für das MVP hingenommen (alle verlangen eine Anmeldung und schreiben nur ins eigene Konto)

Kein neuer Sicherheitsbefund.

### Gefundene Fehler

#### BUG-17: Die App zeigt keine Meldungen an — weder Bestätigungen noch Fehler

- **Schwere:** **Hoch**
- **Betrifft:** die ganze App, nicht nur PROJ-7 — Übungen, Gruppen, Hallen, Generator, Editor. Besteht seit PROJ-1 und ist damit auch in Produktion so
- **Ursache:** Elf Stellen im Code melden über `useToast` aus `@/hooks/use-toast`. Im Seitengerüst (`src/app/layout.tsx`) ist aber die Anzeige der **anderen** Meldungs-Bibliothek eingebunden (`@/components/ui/sonner`), die niemand benutzt. Die Anzeige zu `useToast` (`@/components/ui/toaster`) ist nirgends eingebunden — jede Meldung wird erzeugt und nie gezeigt
- **Nachstellen:**
  1. Eine Einheit öffnen, „Bearbeiten", eine Übung verschieben, „Speichern"
  2. Erwartet: „Änderungen gespeichert"
  3. Tatsächlich: die Seite kehrt in die Leseansicht zurück, eine Meldung erscheint nicht
  4. Ebenso: in einer Phase auswürfeln, in der nichts mehr frei ist — erwartet „Keine weitere passende Übung" mit den Ursachen, tatsächlich passiert sichtbar nichts
- **Das ist die Ursache der Beobachtung vom 2026-10-09** („beim Auswürfeln ist manchmal einfach nichts passiert, ohne Begründung"). Die Begründung wurde jedes Mal erzeugt. Die Abhilfen aus dem Nachtrag N8 bleiben richtig, treffen aber nicht den Kern
- **Belegt durch:** zwei Browser-Tests in `tests/PROJ-7-einheiten-editor.spec.ts` („nach dem Speichern erscheint eine Bestätigung", „ist der Vorrat erschöpft, erscheint eine Meldung …"), rot in beiden Breiten
- **Priorität:** vor der Auslieferung beheben. Voraussichtlich eine Zeile im Seitengerüst; danach die beiden Tests erneut laufen lassen und die Meldungen einmal auf dem Handy ansehen (sie erscheinen dort oben und könnten die Änderungsleiste verdecken)

#### BUG-18: „Speichern" in der Nachfrage beim Verlassen wechselt die Seite nicht

- **Schwere:** Niedrig
- **Nachstellen:**
  1. Im Bearbeiten-Modus etwas ändern
  2. Auf „Zurück zum Generator" oder einen Punkt der Kopfzeile klicken
  3. In der Nachfrage „Speichern" wählen
  4. Erwartet: gespeichert, dann die angeklickte Seite
  5. Tatsächlich: gespeichert, die Seite bleibt in der Leseansicht der Einheit stehen — der Nutzer muss ein zweites Mal klicken
- **Belegt durch:** Durchsicht (`savePlan` in `unit-plan-view.tsx` ruft den gemerkten Seitenwechsel nach dem Speichern nicht auf; „Verwerfen" tut es)
- **Priorität:** kann nach der Auslieferung

#### BUG-19: Eine gefüllte und wieder geleerte Lücke gilt ohne neue Erklärung als geplant

- **Schwere:** Niedrig
- **Nachstellen:**
  1. Eine Lücke von 5 Minuten als geplant erklären
  2. Eine Übung von 5 Minuten einfügen — die Phase geht auf
  3. Dieselbe Übung wieder entfernen
  4. Erwartet nach dem Satz der Spec („werden danach weitere Minuten frei, ist die Lücke wieder offen"): offene Lücke
  5. Tatsächlich: geplante Lücke, weil wieder genau so viel frei ist wie einmal erklärt
- **Einordnung:** Folge der Entscheidung im Nachtrag, die Erklärung als Zahl zu speichern („nichts frei → die Zahl bleibt ohne Wirkung"). Die Akzeptanzkriterien decken nur den Fall „mehr frei als erklärt" ab, und der stimmt. Eher eine Frage an den Nutzer als ein Fehler
- **Vom Nutzer am 2026-10-09 entschieden: kein Fehler, bleibt so.** Der Nutzer hatte genau diese Minuten schon einmal bewusst frei gelassen; wird die Lücke größer als damals, ist sie ohnehin wieder offen. **Geschlossen**

#### BUG-20: Auswürfeln und Varianten — zwei Folgen der Regeln, die überraschen können

- **Schwere:** Niedrig (Frage an den Nutzer)
- **Beobachtung 1:** Eine weggewürfelte Grundübung kann später **als eine ihrer Varianten** wieder im Platz erscheinen. Gemerkt wird die weggewürfelte Form, nicht die Übung
- **Beobachtung 2:** Steht eine Variante im Platz, gilt die ganze Übung als „schon in dieser Einheit" — ihre übrigen Formen werden nicht gezogen. Je nach Reihenfolge der Würfe meldet das Auswürfeln deshalb „nichts mehr frei", obwohl eine Variante nie gezeigt wurde. Im Test waren es bei vier ziehbaren Formen je nach Lauf zwei, drei oder vier Würfe
- **Einordnung:** beides folgt aus Edge Case 17 und der Regel „keine Übung zweimal in einer Stunde"
- **Vom Nutzer am 2026-10-09 entschieden:** jede Variante ist eine vollwertige Übung. **Beobachtung 1 ist richtig so** und bleibt. **Beobachtung 2 ist ein Fehler und wird behoben:** die übrigen Formen der Übung, die gerade **in diesem Platz** steht, müssen ziehbar sein — der Tausch im selben Platz bringt die Übung ja nicht ein zweites Mal in die Stunde. Was in **anderen** Plätzen der Einheit steht, bleibt mit allen Formen ausgeschlossen
- **Schwere damit:** Mittel
- **Priorität:** zusammen mit BUG-17 beheben

### Nach der QA behoben (2026-10-09)

Auf Wunsch des Nutzers direkt im Anschluss behoben und nachgetestet. Typprüfung und Lint sind
sauber, **426 Unit-Tests grün** (420 plus 6 neue zur Varianten-Regel).

**Nachtest im Browser: 156 von 156 grün** (Gesamtlauf gegen den Produktionsbuild, 11 Minuten,
`--workers=2`) — die 94 bestehenden Tests zu PROJ-3, PROJ-5 und PROJ-6 samt dem Leerzustand-Test,
dazu 31 Editor-Tests je am Rechner und in Handybreite. Die beiden Tests, die vorher an BUG-17
scheiterten, sind grün; der neue Test zu BUG-18 ebenfalls. Dass die Meldungen jetzt erscheinen,
hat keinen der bestehenden Tests gestört.

**Damit: 115 von 115 Akzeptanzkriterien bestanden, kein offener Fehler — bereit für die
Auslieferung.** Zwei Einschränkungen, ehrlich benannt:

- Von den fünf Kriterien, die an BUG-17 hingen, sind zwei im Browser belegt (Bestätigung nach dem
  Speichern, Begründung bei erschöpftem Vorrat). Die drei **Fehlermeldungen** (Speichern schlägt
  fehl, Kandidatenliste lädt nicht, Verbindung bricht ab) laufen über dieselbe Anzeige, sind aber
  nicht eigens ausgelöst worden — einen Serverfehler stellt kein Test her
- Ob eine Meldung am Handy etwas verdeckt, zeigt kein Test: sie erscheint dort oben, wo auch die
  Änderungsleiste klebt. Einmal von Hand ansehen

| Fehler | Abhilfe |
|---|---|
| **BUG-17** | `src/app/layout.tsx` bindet jetzt die Anzeige zu `useToast` ein (`ui/toaster`) statt der ungenutzten aus `ui/sonner`. Betrifft die ganze App: Meldungen erscheinen damit zum ersten Mal — zu prüfen ist, ob sie am Handy etwas verdecken |
| **BUG-20** | `exclusionsFor` in `draft.ts` schließt nur noch die Übungen **anderer** Plätze aus und merkt sich die Form im eigenen Platz gesondert; `drawablePool` lässt deren Geschwister zu. Die Begründung bei erschöpftem Vorrat nennt die Form im Platz eigens („1 × steht gerade in diesem Platz"), damit die Rechnung aufgeht |
| **BUG-18** | Wählt der Nutzer in der Nachfrage beim Verlassen „Speichern", merkt sich `unit-plan-view.tsx` den angehaltenen Seitenwechsel und setzt ihn nach dem gelungenen Speichern fort — auch über den Namensdialog eines Entwurfs hinweg. Neuer Browser-Test dazu |
| **BUG-19** | kein Fehler, vom Nutzer geschlossen |

Die Browser-Tests sind an die neue Varianten-Regel angepasst: aus einem Platz mit vier ziehbaren
Formen sind es jetzt immer genau vier Würfe.

### Nach der Durchsicht der Meldungen durch den Nutzer (2026-10-10)

Der Nutzer hat die Meldungen in Handybreite angesehen: sie verdecken oben kurz einen Bereich,
verschwinden nach einigen Sekunden und lassen sich wegwischen — **für ihn in Ordnung**. Dabei drei
Dinge gefunden und behoben; vom Nutzer im Browser gegengeprüft:

| Befund | Abhilfe |
|---|---|
| **BUG-21 (mittel): doppelte Nachfrage beim Verlassen.** Nach „Verwerfen" in der Nachfrage der App fragte der Browser noch einmal („Website verlassen?"). Der Seitenwechsel begann, bevor die Warnung des Browsers abgemeldet war. Betraf seit der Behebung von BUG-18 auch „Speichern" | `use-unsaved-changes.ts` meldet die Warnung ab, bevor es zur angeklickten Seite geht. Für Tab schließen, Neuladen und die Zurück-Taste bleibt sie |
| „Keine weitere passende Übung" erschien in Signalrot | Ein Hinweis, kein Fehler — jetzt im Ton des Lückenhinweises. Echte Fehlermeldungen bleiben rot |
| Das Kreuz zum Schließen einer Meldung war am Handy erst nach dem Festhalten zu sehen | Am Handy immer sichtbar; am Rechner wie bisher beim Überfahren |

**Warum die Browser-Tests BUG-21 nicht gefunden haben:** Playwright beantwortet die
Verlassen-Warnung des Browsers von selbst. Solche Nachfragen des Browsers sieht nur, wer von Hand
klickt.

### Hinweis zur Testumgebung

Mit vier gleichzeitigen Arbeitern scheitern auf diesem Rechner einzelne Tests an Zeitfenstern und
an der Verbindung zu Supabase, ohne dass die App einen Fehler hat. Mit `--workers=2` läuft die
Suite stabil und braucht rund 12 Minuten:

```
PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npx playwright test --workers=2
```

### Zusammenfassung

- **Akzeptanzkriterien:** 110 von 115 bestanden
- **Fehler:** 4 gefunden — 0 kritisch, **1 hoch** (BUG-17), 1 mittel (BUG-20), 2 niedrig (BUG-18, BUG-19). **Stand danach:** BUG-17, BUG-18 und BUG-20 behoben und im Browser nachgetestet; BUG-19 vom Nutzer als „kein Fehler" geschlossen
- **Sicherheit:** bestanden, kein neuer Befund
- **Regression:** keine
- **Bereit für die Auslieferung:** im ersten Durchgang **NEIN** (BUG-17). **Nach Behebung und Nachtest am 2026-10-09: JA** — siehe „Nach der QA behoben"
- **Empfehlung:** die Meldungen einmal am Handy ansehen, dann `/deploy PROJ-7`

## Deployment

- **Production URL:** https://stundenplaner-self.vercel.app
- **Deployed:** 2026-10-10
- **Tag:** `v1.6.0-PROJ-7`
- **Ausgelieferter Commit:** `0bfa3a6`
- **Weg:** Push auf `main` (`4cc0eb5..0bfa3a6`, 19 Commits seit PROJ-6), Vercel liefert automatisch aus

### Vorprüfung

| Punkt | Ergebnis |
|---|---|
| `npm run build` | ✅ 20 Routen |
| `npm run lint` | ✅ 0 Fehler, 4 vorbestehende `<img>`-Warnungen aus PROJ-3 |
| `npm test` | ✅ 426 Tests in 14 Dateien |
| `npm run test:e2e` | ✅ 158 von 158, Lauf vom 2026-10-10 gegen den Endstand — bei der Auslieferung **nicht** wiederholt |
| QA-Freigabe, 0 kritisch/hoch | ✅ 115 von 115 Akzeptanzkriterien, kein offener Fehler |
| Secrets im Repo | ✅ nur `.env.example` und `.env.local.example`; kein Treffer auf Schlüsselmuster im Diff seit `v1.5.0-PROJ-6` |
| Env-Variablen | ✅ keine neue; weiter die drei aus PROJ-6 |
| Migrationen | ✅ Register 15 zu 15, Dateiliste und Datenbank stimmen Version für Version überein |
| `get_advisors` (Sicherheit) | ✅ nur der bekannte Hinweis zum Passwortschutz |

> **Offen, klein:** `NEXT_PUBLIC_SITE_URL` steht nicht in `.env.local.example`, obwohl die App sie
> seit PROJ-2 für die Links in Bestätigungs- und Reset-Mails liest. Ob sie in Vercel gesetzt ist,
> wurde bei dieser Auslieferung nicht nachgesehen; fehlt sie, zeigen die Mail-Links auf
> `localhost:3000`. Die Zeile in der Vorlage ist nicht nachgetragen — die Datei liegt in einem für
> das Werkzeug gesperrten Bereich.

### Nachprüfung in der Produktion — 2026-10-10

| Prüfung | Ergebnis |
|---|---|
| Neue Auslieferung erkennbar | ✅ GitHub führt zum Commit `0bfa3a6` eine Auslieferung in die Umgebung „Production", Vercel meldet dazu „Deployment has completed" |
| Öffentliche Seiten | ✅ `/`, `/login`, `/register`, `/forgot-password` → 200 |
| Zugriffsschutz | ✅ `/dashboard`, `/units`, `/units/new`, `/exercises`, `/groups` → **307 auf `/login`** |
| Sicherheits-Kopfzeilen | ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS liegen weiter an |
| Oberfläche geladen | ✅ „Anmelden", „Passwort" im ausgelieferten HTML, keine Fehlerseite |
| Supabase-Protokolle | ✅ keine Fehlereinträge im Zeitraum der Auslieferung |

**Nicht geprüft:** der Editor selbst in der Produktion. Dafür braucht es eine Anmeldung, und die
Browser-Tests laufen bewusst nicht gegen die Produktion. Ebenso wenig die Vercel-Funktionsprotokolle
und die Browser-Konsole — beides ist von diesem Rechner aus nicht einsehbar. Der letzte Schritt
bleibt beim Nutzer: einmal anmelden, eine Einheit bearbeiten und speichern.

### Zurückrollen

Die Migration ist rein hinzufügend, die Fassung von PROJ-6 läuft mit dem neuen Schema unverändert.
Zurückrollen heißt deshalb nur: Vercel Dashboard → Deployments → vorige Auslieferung → „Promote to
Production". An der Datenbank ist dafür nichts zu tun.
