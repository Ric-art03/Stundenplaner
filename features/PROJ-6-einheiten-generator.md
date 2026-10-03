# PROJ-6: Einheiten-Generator

## Status: Planned
**Created:** 2026-10-03
**Last Updated:** 2026-10-03

## Dependencies
- Requires: PROJ-1 (Supabase Infrastructure Setup) — Datenbank
- Requires: PROJ-2 (Benutzerregistrierung & Login) — Nur eingeloggte Nutzer generieren Einheiten
- Requires: PROJ-3 (Übungsdatenbank) — Liefert die Übungen, aus denen der Generator auswählt
- Requires: PROJ-5 (Gruppenprofile) — Liefert Sportarten, Altersgruppen, Teilnehmerzahl, Einheitsdauer und Hallenmaterial als Generator-Input
- Ermöglicht: PROJ-7 (Einheiten-Editor), PROJ-9 (Kalenderansicht), PROJ-10 (Übungsrotation), PROJ-14 (Live-Modus)

### Offene Abhängigkeit in PROJ-3
PROJ-6 braucht eine eindeutige Semantik für das abweichende Material einer Variante, die in PROJ-3 nur als „nur was anders ist als bei der Hauptübung" beschrieben ist. Festgelegt wird: **Ersetzen** (siehe Produktentscheidungen). Die Komponente `src/components/exercises/variant-input.tsx` muss dafür angepasst werden — standardmäßig erbt die Variante das Material der Hauptübung und zeigt es als Text an; erst ein Klick auf „Material für diese Variante anpassen" kopiert die Liste in bearbeitbare Felder, ein zweiter Button setzt auf Erben zurück.

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
- **Vorlagen / wiederverwendbare Konfigurationen** — nicht im MVP; die Konfiguration wird pro Einheit gespeichert, aber nicht als eigenständige Vorlage verwaltet

## Einstiegspunkte

Eine Einheit wird **immer** in Bezug auf eine Gruppe erstellt. Es gibt zwei Wege dorthin:

1. **Gruppen-Detailseite** → Button „Einheit generieren" → Konfigurationsseite mit **vorausgefüllter** Gruppe
2. **Startseite / Dashboard** → Karte „Einheitengenerator" → Konfigurationsseite, auf der die Gruppe **zuerst gewählt** wird

## UI-Konzept

### Konfigurationsseite (vor dem Generieren)

Eine einzige Seite mit drei Blöcken. Der Standardweg ist ein Klick: Gruppe gewählt, „Volle Dauer" und „Klassisch (20/60/20)" sind vorausgewählt, direkt „Einheit generieren".

**1. Gruppe**
- Dropdown aller Gruppenprofile des Nutzers
- Beim Einstieg über die Gruppen-Detailseite vorausgefüllt
- Unter der Auswahl eine Zusammenfassung dessen, was der Generator aus dem Profil zieht: Sportarten, Altersgruppen, Teilnehmerzahl, Einheitsdauer, Halle mit Materialanzahl

**2. Umfang**
- Auswahl: **„Volle Dauer füllen"** (Standard) oder **„Nur Teile füllen"**
- Bei „Nur Teile füllen" erscheint der Zeitstrahl, auf dem Segmente als „frei lassen" markiert werden können

**3. Phasenverteilung**
- Auswahl: **„Klassisch (20 / 60 / 20)"** (Standard) oder **„Individuell"**
- Klassisch erzeugt drei Segmente: Aufwärmen 20 %, Hauptteil 60 %, Cool-Down 20 % der Einheitsdauer
- Bei „Individuell" klappt der Zeitstrahl auf und ist voll bearbeitbar

### Der Zeitstrahl (ein Widget für Umfang und Phasen)

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
| **Schwierigkeitsgrad** | Multi-Select nach derselben Logik; Standard = alle drei Stufen |

Weitere Zeitstrahl-Funktionen:
- Segment hinzufügen / entfernen
- Segmente umsortieren
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
| **Material** | Jedes benötigte Material muss in der Halle in ausreichender Menge vorhanden sein. `insgesamt` → benötigte Menge; `pro Teilnehmer` → Menge × Teilnehmerzahl Max der Gruppe. „Kein Material" gilt immer als erfüllt. **Entfällt vollständig**, wenn die Gruppe keine Halle zugewiesen hat oder bei `pro Teilnehmer` keine Teilnehmerzahl Max hinterlegt ist. Die Prüfung erfolgt **pro Übung, nicht kumulativ über das Segment** — Übungen laufen nacheinander und konkurrieren nicht um dasselbe Material |
| **Teilnehmerzahl** | Die Teilnehmerzahl der Gruppe muss in das Min/Max-Fenster der Übung passen. Nur geprüft, wenn beide Seiten Werte hinterlegt haben |

### Auswahl innerhalb eines Segments

1. **Sportart-Rotation:** Pro Übungs-Slot wird eine Sportart aus den für das Segment gewählten Sportarten gezogen — in gemischter Reihenfolge, aber jede kommt dran, bevor sich eine wiederholt. Bei zwei getaggten Sportarten und drei Slots also A, B, A.
2. **Frische-Regel:** Übungen, die in den **letzten zwei Einheiten dieser Gruppe** verwendet wurden, werden an das Ende des Pools sortiert — nicht ausgeschlossen, damit bei kleiner Datenbank keine unnötigen Lücken entstehen.
3. **Keine Dopplungen:** Innerhalb einer Einheit kommt keine Übung zweimal vor. Eine Hauptübung und eine ihrer eigenen Varianten gelten dabei als dieselbe Übung und schließen sich gegenseitig aus.
4. **Füllen:** Es werden Übungen gezogen, bis das Minutenbudget des Segments etwa erreicht ist.
5. **Dauer-Anpassung:** Die Restdifferenz wird auf die gewählten Übungen verteilt, **maximal ±25 % pro Übung**. Es gibt **keine Unter- oder Obergrenze für die Anzahl der Übungen** pro Segment und keine Mindestdauer — kurze Dehn-, Kräftigungs- und Koordinationsübungen müssen auswählbar bleiben. Wie viele Übungen entstehen, ergibt sich aus dem, was in der Datenbank liegt.
6. **Lücke bei Unterdeckung:** Lässt sich das Budget weder durch eine weitere Übung noch durch Streckung füllen, bleibt der Rest eine Lücke. Der Grund wird festgehalten und im Ergebnis in Alltagssprache ausgegeben.

### Kriterien lockern

Nur auf aktiven Klick des Nutzers („Mit gelockerten Kriterien erneut versuchen"). Gelockert werden ausschließlich die weichen Kriterien — zuerst der Schwierigkeitsgrad, dann die Sportart-Vorgabe. **Harte Kriterien bleiben hart**, insbesondere Material und Altersgruppe. Was gelockert wurde, wird im Ergebnis angezeigt, zum Beispiel „Sportart-Vorgabe gelockert: 2 Übungen aus Allgemeinsport ergänzt".

### Neu generieren

- Überschreibt denselben Einheiten-Datensatz — es entstehen keine verwaisten Entwürfe
- Die Konfiguration (Zeitstrahl, Sportarten, Schwierigkeitsgrade) bleibt erhalten; der Nutzer bekommt eine andere Übungsauswahl, nicht eine andere Struktur
- Hat der Nutzer die Einheit bereits manuell bearbeitet, erscheint vorher die Warnung „Deine Änderungen an dieser Einheit werden überschrieben."

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
| Reihenfolge | Zahl | Ja | Position auf dem Zeitstrahl |

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
- [ ] Angenommen der Nutzer öffnet die Konfigurationsseite, wenn er nichts verändert, dann sind „Volle Dauer füllen" und „Klassisch (20/60/20)" vorausgewählt und er kann direkt generieren
- [ ] Angenommen die Gruppe hat eine Einheitsdauer von 60 Minuten, wenn der Nutzer „Klassisch (20/60/20)" wählt, dann entstehen die Segmente Aufwärmen 12 Min, Hauptteil 36 Min und Cool-Down 12 Min
- [ ] Angenommen der Nutzer wählt „Individuell", wenn die Auswahl greift, dann klappt der Zeitstrahl auf und die Segmente sind bearbeitbar

### Zeitstrahl
- [ ] Angenommen der Zeitstrahl ist offen, wenn der Nutzer eine Segmentgrenze verschiebt, dann ändern sich die Minutenwerte der angrenzenden Segmente entsprechend und die Summe bleibt gleich der Einheitsdauer
- [ ] Angenommen der Zeitstrahl ist offen, wenn der Nutzer ein Segment hinzufügt, dann kann er dessen Namen, Dauer, Modus, Sportarten und Schwierigkeitsgrade festlegen
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
- [ ] Angenommen eine Übung benötigt 1 Ball pro Teilnehmer und die Gruppe hat maximal 20 Teilnehmer, wenn die Halle nur 12 Bälle hat, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen der Gruppe ist keine Halle zugewiesen, wenn der Generator läuft, dann wird das Material-Kriterium nicht angewendet und Übungen werden unabhängig vom Material vorgeschlagen
- [ ] Angenommen zwei Übungen im selben Segment benötigen beide 8 Hütchen und die Halle hat 8, wenn der Generator läuft, dann sind beide zulässig, weil Material nicht kumulativ geprüft wird
- [ ] Angenommen die Gruppe hat 20 Teilnehmer und eine Übung ist für maximal 8 Teilnehmer ausgelegt, wenn der Generator läuft, dann wird diese Übung nicht vorgeschlagen
- [ ] Angenommen eine Übung hat keine Teilnehmerzahl hinterlegt, wenn der Generator läuft, dann wird das Teilnehmer-Kriterium für diese Übung übersprungen
- [ ] Angenommen eine Variante trägt eine abweichende Altersgruppe, die zur Gruppe passt, während die Hauptübung nicht passt, wenn der Generator läuft, dann kann die Variante als Kandidat vorgeschlagen werden
- [ ] Angenommen eine Variante hat eigenes Material eingetragen, wenn der Generator ihr Material prüft, dann gilt ausschließlich die Materialliste der Variante und nicht die der Hauptübung
- [ ] Angenommen eine Variante hat kein eigenes Material eingetragen, wenn der Generator ihr Material prüft, dann gilt das Material der Hauptübung
- [ ] Angenommen eine Hauptübung und eine ihrer Varianten passen beide, wenn der Generator die Einheit füllt, dann erscheint nur eine von beiden in der Einheit
- [ ] Angenommen das Segment hat drei Übungs-Slots und die Gruppe ist mit zwei Sportarten getaggt, wenn der Generator läuft, dann werden beide Sportarten genutzt, bevor sich eine wiederholt

### Zeitbudget und Dauer
- [ ] Angenommen ein Segment hat 12 Minuten Budget und die gewählte Übung ist auf 10 Minuten geschätzt, wenn der Generator die Dauer anpasst, dann steht die Übung mit 12 Minuten Plandauer im Plan und die geschätzten 10 Minuten bleiben sichtbar
- [ ] Angenommen eine Übung ist auf 10 Minuten geschätzt, wenn der Generator die Dauer anpasst, dann liegt die Plandauer zwischen 7,5 und 12,5 Minuten (±25 %)
- [ ] Angenommen in der Datenbank liegen nur Übungen mit 3 Minuten Dauer und das Cool-Down-Segment hat 12 Minuten, wenn der Generator läuft, dann werden mehrere kurze Übungen eingeplant, ohne dass eine Mindestdauer sie ausschließt
- [ ] Angenommen das Budget eines Segments lässt sich weder durch eine weitere Übung noch durch Streckung füllen, wenn der Generator fertig ist, dann bleibt der Rest als Lücke sichtbar

### Lücken und Lockern
- [ ] Angenommen für ein Segment findet der Generator keine passende Übung, wenn das Ergebnis angezeigt wird, dann sieht der Nutzer, wie viele Minuten ungefüllt blieben und aus welchem Grund in Alltagssprache
- [ ] Angenommen ein Segment konnte nicht gefüllt werden, wenn der Nutzer auf „Mit gelockerten Kriterien erneut versuchen" klickt, dann werden Schwierigkeitsgrad und Sportart-Vorgabe gelockert, während Material und Altersgruppe hart bleiben
- [ ] Angenommen der Nutzer hat die Kriterien gelockert, wenn das Ergebnis angezeigt wird, dann steht im Ergebnis, was gelockert wurde
- [ ] Angenommen ein Segment konnte nicht gefüllt werden, wenn das Ergebnis angezeigt wird, dann bietet der Hinweis einen Button zum Anlegen einer passenden Übung an

### Speichern, Anzeigen, Neu generieren
- [ ] Angenommen der Nutzer klickt auf „Einheit generieren", wenn die Generierung erfolgreich war, dann wird die Einheit sofort gespeichert und der Nutzer sieht den Stundenverlauf
- [ ] Angenommen eine Einheit wurde generiert, wenn der Nutzer den Browser schließt und zurückkehrt, dann ist die Einheit noch vorhanden
- [ ] Angenommen eine Einheit wurde generiert, wenn sie gespeichert wird, dann trägt sie automatisch einen Namen aus Gruppenname und Erstelldatum
- [ ] Angenommen der Nutzer sieht den Stundenverlauf, wenn er auf „Neu generieren" klickt, dann wird dieselbe Einheit mit einer anderen Übungsauswahl überschrieben und die Zeitstrahl-Konfiguration bleibt erhalten
- [ ] Angenommen der Nutzer hat die Einheit bereits manuell bearbeitet, wenn er auf „Neu generieren" klickt, dann erscheint vorher eine Warnung, dass seine Änderungen überschrieben werden
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
6. **Gruppe ohne Teilnehmerzahl Max:** Die Prüfung von `pro Teilnehmer`-Material entfällt, ebenso das Teilnehmer-Kriterium
7. **Sehr kurze Einheitsdauer:** Bei 20 Minuten ergibt die klassische Verteilung 4 / 12 / 4 Minuten. Passt in ein Segment keine einzige Übung, bleibt es leer mit Hinweis — der Nutzer kann die Verteilung auf „Individuell" umstellen und Segmente zusammenlegen
8. **Segment kürzer als die kürzeste verfügbare Übung:** Segment bleibt leer, Grund wird genannt
9. **Alle Segmente auf „frei lassen":** Erlaubt — es entsteht eine leere Einheit als Gerüst, die der Nutzer in PROJ-7 selbst füllt
10. **Übung während des Generierens gelöscht:** Fällt einfach aus dem Pool; falls sie schon eingeplant war, greift die Platzhalter-Logik
11. **Übung mit widersprüchlicher Teilnehmerzahl (Min > Max):** In PROJ-3 durch Validierung ausgeschlossen; sollte so ein Datensatz dennoch existieren, fällt die Übung aus dem Pool statt den Generator abzubrechen
12. **Netzwerkfehler während des Generierens:** Fehlermeldung „Generieren fehlgeschlagen, bitte erneut versuchen"; die Konfiguration bleibt erhalten und es entsteht keine halb gespeicherte Einheit
13. **Nutzer verlässt die Konfigurationsseite:** Browser-Warnung über nicht gespeicherte Eingaben, sofern er den Zeitstrahl bearbeitet hat
14. **Nutzer generiert mehrfach schnell hintereinander:** Der Button wird während des Laufs gesperrt, damit nicht mehrere Einheiten gleichzeitig entstehen
15. **Zeitstrahl-Segment auf 0 Minuten gezogen:** Nicht erlaubt; ein Segment hat mindestens 1 Minute oder muss entfernt werden

## Technical Requirements
- **Authentifizierung:** Alle Endpoints erfordern einen eingeloggten Nutzer
- **Row Level Security:** Jeder Nutzer sieht und bearbeitet nur seine eigenen Einheiten; die Gruppenzugehörigkeit wird serverseitig geprüft
- **Performance:** Generierung in unter 2 Sekunden bei bis zu 150 Kandidaten (Hauptübungen plus Varianten); Laden einer gespeicherten Einheit in unter 500 ms
- **Mobile:** Alle Views responsiv. Der Zeitstrahl muss auf Smartphone-Breite (375 px) bedienbar sein — als Rückfallebene zu den ziehbaren Grenzen gibt es pro Segment ein Minutenfeld zur direkten Eingabe
- **Nachvollziehbarkeit:** Der Grund für jede Lücke wird am Segment gespeichert, nicht nur flüchtig angezeigt
- **Keine Eigenentwicklung ohne Not:** Die Multi-Select-Komponente aus PROJ-3 wird für Sportarten, Schwierigkeitsgrade und Phasennamen wiederverwendet. Der Zeitstrahl ist die einzige echte Eigenentwicklung

## Open Questions
- [ ] **Hilfe- und Tutorial-Feature:** Die App muss dem Nutzer die sinnvolle Nutzung aktiv vermitteln — eine Gruppe nicht mit nur einer Sportart taggen, nicht jede Stunde braucht alle Phasen, und die geschätzte Übungsdauer muss Umbau- und Erklärzeit einschließen. Soll das ein eigenes Feature werden (neue PROJ-ID) oder in bestehende Leerzustände und Hinweise verteilt bleiben?
- [ ] **Hinweis im Übungsformular (PROJ-3):** Das Dauer-Feld sollte einen Hinweis bekommen, dass Umbau-, Aufstell- und Erklärzeit mitzählen. Als kleine Nacharbeit in PROJ-3 oder als Teil von PROJ-6 umsetzen?
- [ ] Soll die Zeitstrahl-Konfiguration später als wiederverwendbare Vorlage gespeichert werden können (etwa „mein Volleyball-Schema")? Aktuell Out of Scope, aber naheliegende Erweiterung
- [ ] Wie viele Einheiten pro Gruppe werden in der Liste auf der Gruppen-Detailseite angezeigt, bevor ein „Mehr laden" nötig wird?
- [ ] Sollen Musik-Hinweise („Musik benötigt") im Stundenverlauf besonders hervorgehoben werden, damit der Nutzer vor der Stunde weiß, dass er eine Box braucht?
- [ ] Ist die Frische-Regel mit „letzten zwei Einheiten" die richtige Tiefe, oder zeigt der echte Einsatz, dass mehr Gedächtnis nötig ist? Bewusst erst nach Praxiserfahrung zu entscheiden

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Einheit wird immer in Bezug auf eine Gruppe erstellt | Alle Matching-Kriterien (Sportart, Alter, Teilnehmer, Material, Dauer) stammen aus dem Gruppenprofil; ohne Gruppe hat der Generator keine Grundlage | 2026-10-03 |
| Zwei Einstiegspunkte: Gruppen-Detailseite und Startseite | Über die Gruppe ist der Weg kürzer (vorausgefüllt), über die Startseite ist der Generator als Hauptfunktion sichtbar — entspricht seiner Rolle als Herzstück der App | 2026-10-03 |
| Ein Zeitstrahl für Umfang und Phasenverteilung statt zwei getrennter Schritte | Beide beschreiben dieselbe Zeitachse; zwei Regler-Widgets über denselben 60 Minuten hätten den Nutzer gezwungen, zwei Modelle zusammenzudenken, und dieselbe Mechanik zweimal nötig gemacht. Eine Lücke ist nun einfach ein Segment, das nicht gefüllt wird | 2026-10-03 |
| Standardweg bleibt ein Klick (volle Dauer, klassisch 20/60/20) | Die PRD verspricht „auf Knopfdruck" für Ehrenamtliche mit wenig Zeit; der Zeitstrahl klappt nur bei „Individuell" auf | 2026-10-03 |
| Klassische Verteilung prozentual (20/60/20), nicht in festen Minuten | Skaliert automatisch mit jeder Einheitsdauer; feste Minuten wären bei 30- oder 120-Minuten-Einheiten unpassend | 2026-10-03 |
| Phasenverteilung gehört zur Einheit, nicht zum Gruppenprofil | Dieselbe Gruppe kann je Woche ein anderes Stundenbild brauchen; außerdem bleibt PROJ-5 unangetastet | 2026-10-03 |
| Segmentname aus Phasenliste wählbar, kein Freitext | Der Name ist das Matching-Kriterium gegen die Phasen-Tags der Übungen; Freitext würde zuverlässig null Treffer erzeugen. Eigene Phasen bleiben über `custom_categories` möglich | 2026-10-03 |
| Harte Kriterien: Phase, Altersgruppe, Material, Teilnehmerzahl | Diese entscheiden über Durchführbarkeit und Angemessenheit — eine Senioren-Übung im Kinderturnen ist falsch, und ohne Gerät ist eine Übung nicht machbar | 2026-10-03 |
| Weiche Kriterien: Sportart und Schwierigkeitsgrad | Ein allgemeines Laufspiel passt auch ins Volleyball-Aufwärmen; strikte Filterung würde bei kleinen Datenbanken zu viele Segmente leer lassen | 2026-10-03 |
| „Weich" bei Sportart heißt Rotation innerhalb der Gruppen-Tags, nicht Fallback | Vom Nutzer so festgelegt: die getaggten Sportarten der Gruppe wechseln sich ab, statt dass eine bevorzugt und der Rest nur im Notfall genutzt wird. Erzeugt echte Abwechslung statt Rangfolge | 2026-10-03 |
| Sportart-Rotation pro Übungs-Slot, nicht pro Phase | Gibt innerhalb eines Segments mehr Abwechslung; bei drei Slots und zwei Sportarten kommen beide dran | 2026-10-03 |
| Sportart und Schwierigkeitsgrad pro Segment überschreibbar, mindestens eine Sportart Pflicht | Erlaubt gezielte Stundenbilder (allgemeines Aufwärmen, sportartspezifischer Hauptteil), ohne den Ein-Klick-Weg zu belasten. Null Sportarten wären eine sinnlose Konfiguration | 2026-10-03 |
| OR-Matching innerhalb einer Kategorie | Eine Übung mit mehreren Sportart-Tags muss nur einen Treffer haben; alles andere würde breit getaggte Übungen systematisch benachteiligen | 2026-10-03 |
| Material wird pro Übung geprüft, nicht kumulativ über das Segment | Übungen laufen nacheinander ab und konkurrieren nicht um dasselbe Material | 2026-10-03 |
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
| Zeitstrahl auf Mobil mit Minutenfeld als Rückfallebene | Ziehbare Grenzen auf 375 px Breite sind fehleranfällig; ein direktes Zahlenfeld garantiert Bedienbarkeit | 2026-10-03 |

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
