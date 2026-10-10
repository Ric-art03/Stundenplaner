# PROJ-14: Live-Modus (Stundenbegleitung)

## Status: Planned
**Created:** 2026-10-10
**Last Updated:** 2026-10-10

## Dependencies
- **Benötigt:** PROJ-6 (Einheiten-Generator) — der Live-Modus führt durch eine gespeicherte
  Einheit mit ihren Segmenten, Einträgen und Plandauern
- **Benötigt:** PROJ-7 (Einheiten-Editor) — gespeicherte Einheiten haben seitdem garantiert keine
  offene Lücke; geplante Lücken und die Arbeitsnotizen von Phase und Übung entstehen dort und
  werden hier angezeigt
- **Benötigt:** PROJ-3 (Übungsdatenbank) — Beschreibung, Material, Organisationsform, Bilder und
  Arbeitsnotiz der Übung
- **Benötigt:** PROJ-5 (Gruppenprofile) — Gruppe, Halle und Teilnehmerzahl für das
  Bereitschaftsbild und die Materialmengen
- **Ändert:** PROJ-7 (Detailseite der Einheit) — bekommt den Knopf „Stunde starten" und die Liste
  der Durchführungen
- **Ändert:** PROJ-6 (Einheiten-Übersicht) — „Stunde starten" je gespeicherter Einheit
- **Ändert:** PROJ-3 (Übungsdatenbank) — aus der Nachbereitung einer Stunde lassen sich Notiz und
  Dauer einer Übung direkt übernehmen; Bearbeiten-Maske und Löschen-Dialog werden von dort aus
  aufgerufen und führen dorthin zurück. Die Bearbeiten-Maske bekommt einen Hinweis, in wie vielen
  gespeicherten Einheiten die Übung steht und dass Änderungen dort sofort erscheinen — außer der
  geplanten Dauer
- **Berührt:** PROJ-10 (Übungsrotation) und PROJ-9 (Kalenderansicht) — beide können später auf die
  festgehaltenen Durchführungen zugreifen; ausgewertet wird hier nichts

## Worum es geht

Bis hierher hilft die App beim Planen. In der Halle selbst steht der Übungsleiter mit der
Leseansicht da: eine lange Liste, klein gesetzt, ohne Beschreibung der Übungen und ohne Uhr. Ob er
im Plan liegt, rechnet er im Kopf.

Der Live-Modus begleitet die Stunde. Er zeigt **genau eine Übung groß**, lässt ihre Restzeit
herunterlaufen und sagt in einer Zeile, wie die ganze Stunde im Plan liegt. Das Tempo bestimmt die
Halle: die App schaltet nie von selbst weiter. Am Ende hält sie fest, was tatsächlich stattgefunden
hat.

Unter der aktuellen Übung steht fest die **nächste** — mit dem, was sich ändert: welches Material
zu holen ist, welches weg kann, wie sich die Gruppe neu aufstellt. So bereitet sich der
Übungsleiter vor, während die laufende Übung ausläuft.

Nach der Stunde folgt die **Nachbereitung**: was gelernt wurde, lässt sich mit einem Tipp an die
Übung selbst zurückgeben — eine Notiz, die echte Dauer, eine Korrektur, das Löschen.

Der Live-Modus **ändert den Plan nicht**. Getauscht und umgebaut wird vorher im Editor.

## User Stories
- Als Übungsleiter möchte ich in der Halle auf einen Blick sehen, welche Übung jetzt dran ist und
  wie sie geht, damit ich nicht in einer Liste suchen oder auf die Übungsseite wechseln muss
- Als Übungsleiter möchte ich sehen, wie viel Zeit die laufende Übung noch hat und ob die ganze
  Stunde im Plan liegt, damit ich nicht im Kopf mitrechnen muss
- Als Übungsleiter möchte ich selbst entscheiden, wann es weitergeht, damit die App mich nicht
  aus einer Übung reißt, die gerade gut läuft
- Als Übungsleiter möchte ich eine Übung auslassen und die Stunde pausieren können, damit
  Trinkpausen und Planänderungen die Zeitrechnung nicht verfälschen
- Als Übungsleiter möchte ich vor dem Start sehen, welches Material bereitliegen muss, damit ich
  nicht mitten in der Stunde in den Geräteraum laufe
- Als Übungsleiter möchte ich, dass die Stunde auch ohne Empfang und nach dem Sperren des Handys
  an der richtigen Stelle weiterläuft, damit ich mich in der Halle auf die App verlassen kann
- Als Übungsleiter möchte ich nach der Stunde sehen, was tatsächlich stattgefunden hat, und einen
  Satz dazu notieren, damit ich beim nächsten Mal weiß, wie es lief
- Als Übungsleiter möchte ich während der laufenden Übung schon sehen, was die nächste braucht —
  Material, Organisationsform, Arbeitsnotiz, Beschreibung —, damit ich mich darauf einstellen und
  den Umbau vorbereiten kann
- Als Übungsleiter möchte ich, dass der Bildschirm während der Stunde an bleibt, und erfahren, was
  ich tun muss, falls mein Handy das nicht von selbst zulässt, damit ich nicht mitten in der
  Stunde entsperren muss
- Als Übungsleiter möchte ich direkt nach der Stunde an einer Übung festhalten, was ich gelernt
  habe — eine Notiz, die echte Dauer, eine Korrektur oder dass sie weg soll —, damit meine
  Übungsdatenbank mit jeder Stunde besser wird

## Funktionsumfang

### Start
- **„Stunde starten"** steht an jeder **gespeicherten** Einheit: auf der Detailseite (in der
  Leseansicht, nicht im Bearbeiten-Modus) und in der Einheiten-Übersicht
- Am Entwurf gibt es den Knopf nicht. Dort heißt es weiter „Einheit speichern"
- Der Live-Modus ist ein **eigener Bildschirm** ohne die Navigation der App

### Bereitschaftsbild
Vor der ersten Übung steht eine Seite mit allem, was vor der Stunde bereitliegen muss. Die Uhr
läuft noch nicht.

- Name der Einheit, Gruppe, Halle, Gesamtdauer
- **Das Material der ganzen Einheit, je Material einmal**, mit der Menge, die **gleichzeitig**
  gebraucht wird — also der größte Bedarf einer einzelnen Übung, nicht die Summe über alle.
  Mengen „pro Teilnehmer" sind mit der Teilnehmerzahl der Gruppe ausgerechnet
- Ob Musik gebraucht wird, und bei welchen Übungen
- Ein Hinweis, falls die Einheit Platzhalter „Übung gelöscht" enthält, mit Verweis auf „Bearbeiten"
- **Ob der Bildschirm an bleibt.** Das Bereitschaftsbild prüft es vor dem Start und sagt das
  Ergebnis: „Bildschirm bleibt während der Stunde an" — oder „Dein Gerät lässt das gerade nicht
  zu" mit einer kurzen Anleitung, was zu tun ist (siehe „Bildschirm an")
- **„Los geht's"** startet die Stunde. Erst jetzt läuft die Zeit

### Der Schritt
Die Stunde besteht aus **Schritten** in der Reihenfolge des Plans. Ein Schritt ist:

- eine **Übung** (mit gewählter Variante, falls eine gesetzt ist),
- **freie Zeit** — die geplante Lücke eines Segments oder ein frei gelassenes Segment,
- ein **Platzhalter** für eine gelöschte Übung.

Der Bildschirm ist **ungleich geteilt**: oben groß der aktuelle Schritt, darunter fest der Block
„Danach" mit dem nächsten. Darüber die Zeile mit dem Gesamtstand, darunter die Bedienung.

**Oben — der aktuelle Schritt:**

- Phase und Stand („Aufwärmen · 2 von 3")
- Name der Übung, bei einer Variante deren Titel
- **Restzeit**, groß und aus einem Meter Entfernung lesbar, daneben die geplante Dauer
- Material mit Mengen, Organisationsform
- **Arbeitsnotiz der Übung**, im bekannten hellgrünen Feld. Sie steht im Live-Modus **immer** da,
  unabhängig vom Schalter „Arbeitsnotizen anzeigen" der Leseansicht
- **Arbeitsnotiz der Phase**, beim ersten Schritt der Phase und bei freier Zeit
- **Beschreibung** der Übung bzw. der Variante: **eingeklappt**, per Tipp aufklappbar. Die laufende
  Übung ist schon erklärt; der Platz gehört der Zeit und dem, was als Nächstes kommt
- Titelbild und weitere Varianten der Übung: ebenfalls eingeklappt, die Varianten nur zum Ansehen

**Unten — „Danach":**

- Name und geplante Dauer des nächsten Schritts
- **Was sich ändert**, verglichen mit dem aktuellen Schritt und auf einen Blick erkennbar:
  - **neu holen** — Material, das der aktuelle Schritt nicht braucht, mit Menge
  - **kann weg** — Material des aktuellen Schritts, das der nächste nicht braucht
  - **Menge ändert sich** — dasselbe Material in anderer Menge
  - **Wechsel der Organisationsform** — „Kreis → Zwei Mannschaften"; bleibt sie gleich, steht sie
    ohne Hervorhebung da
  - Material, das bleibt, steht ruhig darunter
- **Arbeitsnotiz** der nächsten Übung
- **Beschreibung** der nächsten Übung bzw. Variante, **offen sichtbar**
- Beginnt mit dem nächsten Schritt eine neue Phase, steht ihr Name und ihre Arbeitsnotiz dabei
- Beim letzten Schritt steht statt alledem „Danach: Ende der Stunde"

**Lange Texte** — Arbeitsnotizen in beiden Teilen und die Beschreibung der nächsten Übung — sind
bis zu einer festen Länge sichtbar und darüber hinaus gekürzt, mit „mehr" zum Aufklappen. Ein
aufgeklappter Text klappt beim Wechsel zum nächsten Schritt wieder zu.

Ist der aktuelle Schritt **freie Zeit** oder ein **Platzhalter**, gibt es nichts zu vergleichen:
„Danach" listet Material und Organisationsform dann einfach auf. Ist der **nächste** Schritt freie
Zeit, zeigt „Danach" „Freie Zeit · n Min" mit der Arbeitsnotiz der Phase und nennt das Material
des aktuellen Schritts als „kann weg".

Bei **freier Zeit** als aktuellem Schritt steht „Freie Zeit · n Min" mit der Arbeitsnotiz der
Phase. Beim **Platzhalter** steht „Übung gelöscht · n Min" mit dem Hinweis, dass der Platz nicht
nachbesetzt wurde.

**Übersichtlichkeit hat Vorrang.** Die beiden Teile sind klar getrennt und auf den ersten Blick zu
unterscheiden; die Restzeit ist das größte Element des Bildschirms. Alle Bedienelemente sind groß
genug für den Daumen. Der Bildschirm kommt bei 375 px ohne waagerechtes Scrollen aus; wird der
Inhalt länger als der Bildschirm, scrollt er senkrecht — Gesamtstand, Restzeit und Knöpfe bleiben
dabei stehen.

### Die Zeit
- Die Restzeit eines Schritts läuft ab dem Betreten herunter
- Bei null **schaltet nichts weiter**. Die Anzeige wechselt deutlich die Farbe und zählt als
  „1:20 über" hoch
- Beim Ablauf ertönt **einmal** ein kurzer Ton, und wo das Gerät es kann, vibriert es. Ein Schalter
  im Live-Modus stellt beides stumm; die Einstellung merkt sich das Gerät. Standard: an
- Oben steht dauerhaft der **Gesamtstand** in einer Zeile: verbleibende Minuten der Stunde und
  „im Plan", „n Min hinter Plan" oder „n Min voraus". Verglichen wird die tatsächlich verstrichene
  Zeit mit dem, was laut Plan bis zum aktuellen Schritt hätte laufen sollen. Abweichungen unter
  einer Minute gelten als „im Plan"
- Pausen zählen nicht mit

### Bedienung
- **Weiter** — beendet den Schritt und öffnet den nächsten. Vor Ablauf der Zeit gilt der Schritt
  als früher beendet, nicht als ausgelassen
- **Zurück** — öffnet den vorigen Schritt wieder. Seine Zeit läuft dort weiter, wo sie stand; ein
  ausgelassener Schritt gilt danach wieder als gemacht
- **Auslassen** — der Schritt wird nicht gemacht. Seine geplante Zeit zählt als gewonnen
- **Pause / Fortsetzen** — hält alle Uhren an. Der Bildschirm zeigt deutlich, dass pausiert ist
- **Stunde beenden** — jederzeit, auch vorzeitig. Nach dem letzten Schritt heißt „Weiter"
  „Stunde beenden". Übrige Schritte gelten bei vorzeitigem Ende als ausgelassen
- **Abbrechen** — verwirft die laufende Stunde ohne Protokoll, mit Nachfrage

### Robustheit
- Nach „Los geht's" braucht die Stunde **kein Netz** mehr. Alle Inhalte sind geladen
- Sperren des Handys, Wechsel in eine andere App und Neuladen der Seite ändern nichts am Stand:
  Schritt, Restzeit, Pause und Gesamtstand sind danach richtig — die Zeit ist in der Zwischenzeit
  weitergelaufen, nicht stehengeblieben
- Das gilt **für dasselbe Gerät**. Eine laufende Stunde lässt sich nicht auf einem zweiten Gerät
  fortsetzen
- Die laufende Stunde arbeitet mit dem **Plan vom Zeitpunkt des Starts**. Wird die Einheit
  währenddessen anderswo geändert oder gelöscht, läuft die Stunde unverändert zu Ende

### Bildschirm an
Der Live-Modus soll die ganze Stunde sichtbar bleiben, ohne Standby und ohne Entsperren.

- Solange der Live-Modus im Vordergrund offen ist und die Stunde läuft, **hält die App den
  Bildschirm wach**. Auf aktuellen Handys geht das von selbst, der Nutzer muss nichts einstellen
- Das gilt auch in der Pause — eine Trinkpause soll das Handy nicht sperren
- **Wann es nicht geht:** auf Geräten, die es nicht können, und wenn das Gerät es verweigert
  (typisch: Energiesparmodus). Dann sagt es die App, statt still zu scheitern:
  - auf dem **Bereitschaftsbild** vor dem Start, mit einer kurzen Anleitung in zwei Schritten:
    zuerst den Energiesparmodus ausschalten und erneut prüfen; hilft das nicht, die automatische
    Bildschirmsperre des Handys für die Dauer der Stunde hochsetzen. Die Anleitung nennt den Weg
    in den Einstellungen passend zum Gerät (iPhone oder Android) und erinnert daran, die Sperre
    danach zurückzustellen
  - **während der Stunde** mit einem dezenten, dauerhaften Hinweis im Live-Modus, falls das
    Wachhalten verloren geht und sich nicht zurückholen lässt
- Wer die App wechselt oder das Handy von Hand sperrt, gibt das Wachhalten ab. Beim Zurückkehren
  holt der Live-Modus es sich **von selbst** wieder
- Die Stunde lässt sich in jedem Fall starten — der dunkle Bildschirm ist ein Komfortverlust,
  kein Hindernis. Die Uhren laufen ohnehin richtig weiter (siehe „Robustheit")
- **Kein Sperrbildschirm.** Dort kann nur eine eigens installierte App etwas anzeigen, keine
  Web-App

### Laufende Stunde
- Es läuft **höchstens eine** Stunde je Gerät
- Wer den Live-Modus verlässt, ohne zu beenden, lässt die Stunde offen. In der ganzen App steht
  dann ein Hinweis **„Stunde läuft — fortsetzen"**
- Wer eine zweite Stunde startet, wird gefragt: die laufende fortsetzen, beenden (wird
  festgehalten) oder abbrechen (wird verworfen)
- Eine **vergessene Stunde** — die geplante Gesamtdauer ist um mehr als das Doppelte überschritten
  — wird beim nächsten Öffnen nicht stillschweigend weitergezählt, sondern zur Entscheidung
  vorgelegt: „Beenden und festhalten" oder „Verwerfen"

### Abschluss
Nach „Stunde beenden" steht eine Zusammenfassung:

- geplante und tatsächliche Gesamtdauer (ohne Pausen)
- je Schritt: gemacht oder ausgelassen, geplante und tatsächliche Dauer
- ein freiwilliges Feld **„Wie lief's?"** für einen Satz zur Stunde
- **„Fertig"** speichert die Durchführung und führt zur Detailseite der Einheit

Ist beim Speichern kein Netz da, bleibt die Durchführung auf dem Gerät und wird nachgereicht,
sobald die App wieder Verbindung hat. Solange das aussteht, sagt die App es.

### Nachbereitung: aus der Stunde in die Übung
Was in der Halle gelernt wurde, soll nicht in einer Notiz zur Stunde liegen bleiben, sondern an
der Übung ankommen. In der Zusammenfassung stehen deshalb an jedem Schritt, der eine Übung ist,
vier Wege — **alle freiwillig**, und keiner ändert etwas ohne ausdrückliche Bestätigung:

- **Notiz anhängen** — ein Satz zur Übung. Er wird ans Ende der **Arbeitsnotiz** der Übung
  gesetzt; der bisherige Text bleibt stehen. Beim Anhängen lässt sich auf **„Anmerkungen"**
  (persönliche Tipps, erscheinen nie im Plan) umstellen. Vor dem Übernehmen sieht der Nutzer den
  Text, wie er danach dasteht, und kann ihn ändern
- **Dauer übernehmen** — zeigt geschätzte und tatsächliche Dauer nebeneinander („11 statt 8 Min")
  und schlägt die tatsächliche, auf ganze Minuten gerundet, als neue geschätzte Dauer vor. Der
  Wert ist vor dem Übernehmen änderbar. Lief der Schritt als Variante, gilt die Änderung der
  Dauer dieser Variante. An ausgelassenen Schritten gibt es den Weg nicht
- **Übung bearbeiten** — öffnet die bekannte Bearbeiten-Maske der Übung (PROJ-3) für alles
  andere: Material, Organisationsform, Schwierigkeit, Beschreibung. Speichern oder Abbrechen
  führt zurück in die Zusammenfassung, an dieselbe Stelle
- **Übung löschen** — mit der bekannten Nachfrage und der Warnung, in welchen Einheiten die Übung
  steht. Die Zusammenfassung und die Durchführung nennen sie danach weiter beim Namen

Dazu gilt:

- Die Änderungen wirken auf die **Übung in der Datenbank**, also dauerhaft. Was das für
  bestehende Einheiten heißt, folgt der Regel, die seit PROJ-6 gilt — eine Einheit **verweist**
  auf ihre Übungen und kopiert nur die Plandauer:
  - **Alles außer der Dauer** — Name, Beschreibung, Material, Organisationsform, Schwierigkeit,
    Arbeitsnotiz — erscheint sofort in **allen** Einheiten, in denen die Übung steht, auch in
    dieser
  - **Die Dauer** gilt nur für künftige Einheiten. Bestehende behalten ihre Plandauer, damit ein
    fertiger Stundenverlauf sich nicht verschiebt
- **Hinweis bei „Dauer übernehmen"**, vor dem Bestätigen sichtbar: „Die neue Dauer gilt für
  künftige Einheiten. In bestehenden Einheiten bleibt die geplante Dauer stehen — dort änderst du
  sie über ‚Bearbeiten'." Steht die Übung in keiner anderen gespeicherten Einheit, entfällt der
  zweite Satz
- **Die reguläre Bearbeiten-Maske der Übung erklärt dieselbe Regel** (Erweiterung an PROJ-3), mit
  **einem gemeinsamen Hinweis** statt einzelner an jedem Feld. Steht die Übung in mindestens einer
  gespeicherten Einheit, zeigt die Maske oben dauerhaft: „Diese Übung steht in n gespeicherten
  Einheiten. Änderungen erscheinen dort sofort — nur die geplante Dauer bleibt dort stehen." Die
  Einheiten sind aufklappbar beim Namen genannt. Der Hinweis steht da, sobald die Maske offen
  ist, egal welches Feld geändert wird, und gilt auch, wenn die Maske aus der Nachbereitung
  heraus geöffnet wurde. Steht die Übung in keiner gespeicherten Einheit, erscheint er nicht
- **Hinweis bei „Notiz anhängen"** in die Arbeitsnotiz: „Erscheint ab sofort in allen Einheiten
  mit dieser Übung."
- Die festgehaltene Durchführung zeigt weiter, was damals lief — sie ändert sich durch nichts
  davon
- Was an einem Schritt übernommen wurde, ist dort **sichtbar vermerkt** („Notiz übernommen",
  „Dauer übernommen: 11 Min"), damit nichts doppelt angehängt wird
- **Dieselben vier Wege stehen später an der gespeicherten Durchführung** auf der Detailseite der
  Einheit — für alle, die direkt nach der Stunde keine Zeit oder kein Netz haben
- Ohne Verbindung sind die vier Wege nicht bedienbar, mit dem Hinweis, dass sie an der
  gespeicherten Durchführung nachgeholt werden können. „Fertig" geht trotzdem
- An freier Zeit und am Platzhalter gibt es die Wege nicht; ist die Übung inzwischen gelöscht,
  ebenfalls nicht

### Durchführungen an der Einheit
- Eine Einheit kann **beliebig oft** durchgeführt werden; jede Durchführung steht für sich
- Auf der Detailseite steht die Liste der Durchführungen, neueste zuerst: Datum, tatsächliche
  Dauer, Zahl der ausgelassenen Schritte, die Notiz. Aufgeklappt zeigt ein Eintrag die
  Zusammenfassung von damals, mit den vier Wegen der Nachbereitung
- Die Zusammenfassung zeigt den Plan **wie er durchgeführt wurde**, auch wenn die Einheit seitdem
  geändert oder eine Übung gelöscht wurde
- Eine Durchführung lässt sich löschen, mit Nachfrage. Die Notiz lässt sich nachträglich ändern
- In der Einheiten-Übersicht steht an der Einheit „Zuletzt durchgeführt am …"
- Wird die Einheit gelöscht, sind ihre Durchführungen mit gelöscht

## Out of Scope
- **Den Plan in der Halle ändern** — tauschen, auswürfeln, Dauer ändern, umsortieren bleiben im
  Editor (PROJ-7). Der Live-Modus kennt nur Auslassen
- **Vorschläge zum Aufholen** bei Rückstand (welche Übung kürzen oder streichen) — bewusst
  ausgeschlossen, mögliche spätere Erweiterung
- **Selbsttätiges Weiterschalten** bei Ablauf der Zeit
- **Vorwarnung** vor Ablauf der Zeit
- **Übungen als „bewährt" bestätigen** und daraus einen bevorzugten Pool bilden, aus dem Generator
  und Auswürfeln häufiger ziehen — oder nur bei ausdrücklicher Einstellung im Generator. Vom Nutzer
  am 2026-10-10 als Idee festgehalten, **noch nicht ausgereift und eigens zu besprechen**; greift
  in PROJ-3, PROJ-6 und PROJ-10 ein. Die Nachbereitung wäre der naheliegende Ort für die
  Bestätigung
- **Selbsttätige Vorschläge aus mehreren Durchführungen** — etwa „im Schnitt 11 statt 8 Min" über
  mehrere Stunden hinweg. Hier wird nur die eine, eben gelaufene Stunde angeboten
- **Die Einheit an die Durchführung anpassen** — tatsächliche Dauern und Ausgelassenes in den Plan
  zurückschreiben. Der Plan wird im Editor geändert (PROJ-7)
- **Die Rotation nach „wirklich gemacht" richten** (PROJ-10)
- **Bestehende Einheiten nachprüfen**, wenn sich Material oder Organisationsform einer Übung
  ändern — ob sie noch zu Halle und Phase passen. Offener Punkt an PROJ-7
- **Nachfrage beim Speichern einer verwendeten Übung** — der Hinweis in der Maske genügt
- **Eine zweite Bearbeiten-Oberfläche für Übungen** — Material, Organisationsform und alles
  Weitere werden in der vorhandenen Maske geändert, nicht in der Zusammenfassung
- **Anzeige auf dem Sperrbildschirm** — nur einer eigens installierten App möglich; eine native
  App ist laut PRD kein Ziel
- **Bildschirmhelligkeit steuern** oder gegen versehentliche Berührungen sperren
- **Durchführungen im Kalender** (PROJ-9)
- **Fortsetzen auf einem zweiten Gerät**
- **Material einzeln abhaken** auf dem Bereitschaftsbild
- **Entwürfe starten** — ein Entwurf wird erst gespeichert
- **Start ganz ohne Netz** — der Start selbst braucht Verbindung; die App ohne Netz zu öffnen ist
  Sache von PROJ-11 (PWA)
- **Signal bei gesperrtem Bildschirm** — eine Web-App kann dann nicht zuverlässig tönen
- **Anwesenheit** der Teilnehmer erfassen
- **Musik abspielen** — ein hinterlegter Musik-Link bleibt ein Link

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Start und Bereitschaftsbild
- [ ] Angenommen eine Einheit ist gespeichert, wenn der Nutzer ihre Detailseite in der Leseansicht öffnet, dann steht dort der Knopf „Stunde starten"
- [ ] Angenommen eine Einheit ist gespeichert, wenn der Nutzer die Einheiten-Übersicht öffnet, dann lässt sich die Stunde von dort starten
- [ ] Angenommen eine Einheit ist ein Entwurf, wenn der Nutzer ihre Detailseite öffnet, dann gibt es keinen Knopf „Stunde starten"
- [ ] Angenommen der Nutzer ist im Bearbeiten-Modus, wenn er die Seite ansieht, dann gibt es keinen Knopf „Stunde starten"
- [ ] Angenommen der Nutzer tippt auf „Stunde starten", wenn das Bereitschaftsbild erscheint, dann zeigt es Name, Gruppe, Halle und Gesamtdauer, und es läuft noch keine Zeit
- [ ] Angenommen zwei Übungen brauchen 4 und 6 Hütchen, wenn das Bereitschaftsbild erscheint, dann steht dort einmal „Hütchen" mit der Menge 6
- [ ] Angenommen eine Übung braucht 1 Ball pro Teilnehmer und die Gruppe hat 12 Teilnehmer, wenn das Bereitschaftsbild erscheint, dann steht dort „Ball" mit der Menge 12
- [ ] Angenommen keine Übung der Einheit braucht Material, wenn das Bereitschaftsbild erscheint, dann steht dort ausdrücklich, dass kein Material nötig ist
- [ ] Angenommen mindestens eine Übung braucht Musik, wenn das Bereitschaftsbild erscheint, dann nennt es das und die betroffenen Übungen
- [ ] Angenommen die Einheit enthält einen Platzhalter „Übung gelöscht", wenn das Bereitschaftsbild erscheint, dann weist es darauf hin, und die Stunde lässt sich trotzdem starten
- [ ] Angenommen das Bereitschaftsbild ist offen, wenn der Nutzer „Los geht's" tippt, dann erscheint der erste Schritt und seine Restzeit beginnt zu laufen
- [ ] Angenommen das Bereitschaftsbild ist offen, wenn der Nutzer es verlässt, ohne „Los geht's" zu tippen, dann läuft keine Stunde und nichts wurde festgehalten

### Der Schritt
- [ ] Angenommen eine Stunde läuft, wenn ein Schritt mit einer Übung angezeigt wird, dann zeigt der obere Teil Phase und Stand, Name, Restzeit, geplante Dauer, Material, Organisationsform und Arbeitsnotiz
- [ ] Angenommen ein Schritt mit einer Übung wird angezeigt, wenn der Nutzer nichts tippt, dann ist die Beschreibung der aktuellen Übung eingeklappt, und ein Tipp klappt sie auf
- [ ] Angenommen an einem Platz ist eine Variante gewählt, wenn der Schritt angezeigt wird, dann stehen Titel, Beschreibung, Material und Organisationsform der Variante da
- [ ] Angenommen die Übung hat eine Arbeitsnotiz und der Schalter „Arbeitsnotizen anzeigen" der Leseansicht ist aus, wenn der Schritt angezeigt wird, dann steht die Arbeitsnotiz trotzdem da
- [ ] Angenommen die Phase hat eine Arbeitsnotiz, wenn ihr erster Schritt angezeigt wird, dann steht die Arbeitsnotiz der Phase dabei
- [ ] Angenommen ein Segment hat eine geplante Lücke von 5 Minuten, wenn die Stunde dorthin kommt, dann erscheint ein Schritt „Freie Zeit · 5 Min" mit laufender Restzeit und der Arbeitsnotiz der Phase
- [ ] Angenommen ein Segment wurde im Generator frei gelassen und nie gefüllt, wenn die Stunde dorthin kommt, dann erscheint ein Schritt „Freie Zeit" über die ganze Länge des Segments
- [ ] Angenommen ein Platz trägt den Platzhalter „Übung gelöscht", wenn die Stunde dorthin kommt, dann erscheint ein eigener Schritt mit diesem Hinweis und der Plandauer des Platzes
- [ ] Angenommen der letzte Schritt wird angezeigt, wenn der Nutzer hinsieht, dann steht dort „Danach: Ende der Stunde" und der Hauptknopf heißt „Stunde beenden"
- [ ] Angenommen der Bildschirm ist 375 px breit und die Beschreibung ist lang, wenn der Schritt angezeigt wird, dann gibt es kein waagerechtes Scrollen und Restzeit und Knöpfe bleiben beim Scrollen sichtbar
- [ ] Angenommen die Übung hat weitere Varianten, wenn der Nutzer „Varianten" aufklappt, dann sieht er sie, kann aber keine auswählen

### Die nächste Übung („Danach")
- [ ] Angenommen auf den aktuellen Schritt folgt eine Übung, wenn der Schritt angezeigt wird, dann zeigt der Block „Danach" ihren Namen, ihre geplante Dauer, Material, Organisationsform, Arbeitsnotiz und Beschreibung, ohne dass der Nutzer etwas aufklappen muss
- [ ] Angenommen die aktuelle Übung braucht 4 Hütchen und die nächste 2 Bänke, wenn der Schritt angezeigt wird, dann nennt „Danach" die Bänke als „neu holen" und die Hütchen als „kann weg"
- [ ] Angenommen die aktuelle Übung braucht 6 Bälle und die nächste 12, wenn der Schritt angezeigt wird, dann steht der Ball in „Danach" mit der Menge 12 und als geänderte Menge gekennzeichnet
- [ ] Angenommen beide Übungen brauchen dieselben 4 Hütchen, wenn der Schritt angezeigt wird, dann stehen die Hütchen in „Danach" ohne Hervorhebung
- [ ] Angenommen die aktuelle Übung läuft im Kreis und die nächste in zwei Mannschaften, wenn der Schritt angezeigt wird, dann ist der Wechsel der Organisationsform in „Danach" hervorgehoben
- [ ] Angenommen beide Übungen haben dieselbe Organisationsform, wenn der Schritt angezeigt wird, dann steht sie in „Danach" ohne Hervorhebung
- [ ] Angenommen am nächsten Platz ist eine Variante gewählt, wenn der Schritt angezeigt wird, dann zeigt „Danach" Titel, Beschreibung, Material und Organisationsform der Variante
- [ ] Angenommen die Arbeitsnotiz oder die Beschreibung der nächsten Übung ist länger als die feste Länge, wenn der Schritt angezeigt wird, dann ist der Text gekürzt und lässt sich mit „mehr" aufklappen
- [ ] Angenommen die Arbeitsnotiz der aktuellen Übung ist länger als die feste Länge, wenn der Schritt angezeigt wird, dann ist sie gekürzt und lässt sich aufklappen
- [ ] Angenommen der Nutzer hat einen Text aufgeklappt, wenn er „Weiter" tippt, dann ist im nächsten Schritt wieder alles im Ausgangszustand
- [ ] Angenommen der nächste Schritt gehört zu einer neuen Phase, wenn der Schritt angezeigt wird, dann nennt „Danach" die neue Phase und ihre Arbeitsnotiz
- [ ] Angenommen der nächste Schritt ist freie Zeit, wenn der Schritt angezeigt wird, dann zeigt „Danach" „Freie Zeit · n Min" mit der Arbeitsnotiz der Phase und das Material der aktuellen Übung als „kann weg"
- [ ] Angenommen der aktuelle Schritt ist freie Zeit und der nächste eine Übung, wenn der Schritt angezeigt wird, dann listet „Danach" Material und Organisationsform ohne Vergleich auf
- [ ] Angenommen der Nutzer tippt „Weiter", wenn der nächste Schritt erscheint, dann steht oben die Übung, die eben in „Danach" stand, und „Danach" zeigt die übernächste
- [ ] Angenommen der Bildschirm ist 375 px breit und beide Teile sind gefüllt, wenn der Nutzer hinsieht, dann sind der aktuelle Schritt und „Danach" klar getrennt, und die Restzeit ist das größte Element

### Bildschirm an
- [ ] Angenommen das Gerät kann den Bildschirm wachhalten, wenn das Bereitschaftsbild erscheint, dann steht dort „Bildschirm bleibt während der Stunde an"
- [ ] Angenommen das Gerät kann oder darf den Bildschirm nicht wachhalten, wenn das Bereitschaftsbild erscheint, dann sagt es das und zeigt die Anleitung in zwei Schritten, passend zu iPhone oder Android
- [ ] Angenommen die Anleitung wird gezeigt, wenn der Nutzer den Energiesparmodus ausschaltet und „Erneut prüfen" tippt, dann wechselt die Anzeige auf „Bildschirm bleibt während der Stunde an"
- [ ] Angenommen das Gerät kann den Bildschirm nicht wachhalten, wenn der Nutzer „Los geht's" tippt, dann startet die Stunde trotzdem
- [ ] Angenommen eine Stunde läuft und der Live-Modus ist im Vordergrund, wenn die übliche Zeit bis zur automatischen Sperre verstreicht, dann bleibt der Bildschirm an
- [ ] Angenommen eine Stunde ist pausiert, wenn die übliche Zeit bis zur automatischen Sperre verstreicht, dann bleibt der Bildschirm an
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer in eine andere App wechselt und zurückkehrt, dann bleibt der Bildschirm danach wieder an, ohne dass er etwas tun muss
- [ ] Angenommen das Wachhalten geht während der Stunde verloren und lässt sich nicht zurückholen, wenn der Nutzer hinsieht, dann steht im Live-Modus ein dauerhafter, dezenter Hinweis darauf
- [ ] Angenommen die Stunde ist beendet oder abgebrochen, wenn der Nutzer die Zusammenfassung oder eine andere Seite sieht, dann hält die App den Bildschirm nicht mehr wach

### Zeit
- [ ] Angenommen ein Schritt mit 8 Minuten Plandauer läuft seit 3 Minuten, wenn der Nutzer hinsieht, dann zeigt die Restzeit 5:00
- [ ] Angenommen die Restzeit erreicht null, wenn nichts getippt wird, dann bleibt der Schritt stehen, die Anzeige wechselt die Farbe und zählt als „über" hoch
- [ ] Angenommen der Ton ist an und der Bildschirm ist eingeschaltet, wenn die Restzeit null erreicht, dann ertönt genau einmal ein Signal
- [ ] Angenommen der Nutzer hat das Signal stummgestellt, wenn die Restzeit null erreicht, dann bleibt es still, und beim nächsten Start einer Stunde ist das Signal weiter stumm
- [ ] Angenommen laut Plan wären bis zum aktuellen Schritt 20 Minuten vergangen und tatsächlich sind 24 vergangen, wenn der Nutzer hinsieht, dann steht oben „4 Min hinter Plan"
- [ ] Angenommen die Abweichung liegt unter einer Minute, wenn der Nutzer hinsieht, dann steht oben „im Plan"
- [ ] Angenommen ein Schritt mit 6 Minuten wird ausgelassen, wenn der nächste Schritt erscheint, dann hat sich der Gesamtstand um 6 Minuten zugunsten des Nutzers verschoben

### Bedienung
- [ ] Angenommen ein Schritt läuft, wenn der Nutzer vor Ablauf „Weiter" tippt, dann erscheint der nächste Schritt und der beendete gilt als gemacht mit seiner tatsächlichen Dauer
- [ ] Angenommen ein Schritt läuft, wenn der Nutzer „Auslassen" tippt, dann erscheint der nächste Schritt und der ausgelassene steht in der Zusammenfassung als ausgelassen
- [ ] Angenommen der zweite Schritt läuft, wenn der Nutzer „Zurück" tippt, dann erscheint der erste Schritt wieder und seine Zeit läuft dort weiter, wo sie stand
- [ ] Angenommen ein Schritt wurde ausgelassen, wenn der Nutzer mit „Zurück" dorthin geht und ihn mit „Weiter" beendet, dann gilt er als gemacht
- [ ] Angenommen der erste Schritt läuft, wenn der Nutzer hinsieht, dann ist „Zurück" nicht bedienbar
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer „Pause" tippt, dann stehen Restzeit und Gesamtstand still und der Bildschirm zeigt deutlich „Pausiert"
- [ ] Angenommen die Stunde war 4 Minuten pausiert, wenn der Nutzer „Fortsetzen" tippt, dann laufen Restzeit und Gesamtstand dort weiter, wo sie standen
- [ ] Angenommen es stehen noch drei Schritte aus, wenn der Nutzer „Stunde beenden" tippt und bestätigt, dann erscheint die Zusammenfassung und die drei Schritte gelten als ausgelassen
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer „Abbrechen" tippt und die Nachfrage bestätigt, dann läuft keine Stunde mehr und es wurde keine Durchführung festgehalten

### Robustheit
- [ ] Angenommen eine Stunde läuft, wenn die Verbindung abbricht, dann lassen sich alle Schritte bis zum Ende mit allen Inhalten durchgehen
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer das Handy zwei Minuten sperrt und wieder entsperrt, dann zeigt der Live-Modus denselben Schritt mit einer um zwei Minuten geringeren Restzeit
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer die Seite neu lädt, dann zeigt der Live-Modus denselben Schritt mit richtiger Restzeit und richtigem Gesamtstand
- [ ] Angenommen eine Stunde ist pausiert, wenn der Nutzer die Seite neu lädt, dann ist sie weiter pausiert
- [ ] Angenommen eine Stunde läuft, wenn die Einheit in einem zweiten Tab geändert und gespeichert wird, dann zeigt die laufende Stunde weiter den Plan vom Start

### Laufende Stunde
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer den Live-Modus verlässt, dann steht auf jeder Seite der App ein Hinweis „Stunde läuft — fortsetzen", der in den Live-Modus zurückführt
- [ ] Angenommen eine Stunde läuft, wenn der Nutzer an einer anderen Einheit „Stunde starten" tippt, dann wird er gefragt, ob er die laufende fortsetzen, beenden oder abbrechen will
- [ ] Angenommen eine Stunde von 60 Minuten läuft seit mehr als 120 Minuten, wenn der Nutzer die App öffnet, dann wird ihm die Stunde mit „Beenden und festhalten" und „Verwerfen" vorgelegt, statt weiterzulaufen
- [ ] Angenommen der Nutzer meldet sich ab, wenn eine Stunde läuft, dann wird er vorher gefragt, und ein anderes Konto auf demselben Gerät sieht die Stunde nicht

### Abschluss und Durchführungen
- [ ] Angenommen der Nutzer hat die Stunde beendet, wenn die Zusammenfassung erscheint, dann zeigt sie geplante und tatsächliche Gesamtdauer ohne Pausen und je Schritt gemacht oder ausgelassen mit geplanter und tatsächlicher Dauer
- [ ] Angenommen die Zusammenfassung ist offen, wenn der Nutzer „Fertig" tippt, ohne etwas einzutragen, dann wird die Durchführung ohne Notiz gespeichert
- [ ] Angenommen die Zusammenfassung ist offen, wenn der Nutzer bei „Wie lief's?" etwas einträgt und „Fertig" tippt, dann steht die Notiz an der Durchführung
- [ ] Angenommen die Durchführung ist gespeichert, wenn der Nutzer die Detailseite der Einheit öffnet, dann steht sie in der Liste der Durchführungen mit Datum, tatsächlicher Dauer, Zahl der ausgelassenen Schritte und Notiz
- [ ] Angenommen eine Einheit wurde zweimal durchgeführt, wenn der Nutzer die Detailseite öffnet, dann stehen beide Durchführungen da, die neuere oben
- [ ] Angenommen eine Durchführung existiert, wenn der Nutzer die Einheiten-Übersicht öffnet, dann steht an der Einheit „Zuletzt durchgeführt am …"
- [ ] Angenommen eine Übung wurde nach der Durchführung gelöscht, wenn der Nutzer die Durchführung aufklappt, dann steht die Übung dort weiter mit ihrem Namen
- [ ] Angenommen es gibt beim Tippen auf „Fertig" kein Netz, wenn die Speicherung scheitert, dann sagt die App, dass die Durchführung auf dem Gerät liegt und nachgereicht wird, und nichts geht verloren
- [ ] Angenommen eine Durchführung liegt noch auf dem Gerät, wenn die App wieder Verbindung hat, dann wird sie gespeichert und erscheint genau einmal in der Liste
- [ ] Angenommen eine Durchführung existiert, wenn der Nutzer sie löscht und die Nachfrage bestätigt, dann ist sie aus der Liste verschwunden
- [ ] Angenommen eine Durchführung existiert, wenn der Nutzer ihre Notiz ändert und speichert, dann steht die neue Notiz da
- [ ] Angenommen ein Nutzer ist angemeldet, wenn er die Durchführungen abruft, dann sieht er nur die seiner eigenen Einheiten

### Nachbereitung
- [ ] Angenommen die Zusammenfassung ist offen, wenn der Nutzer einen Schritt mit einer Übung ansieht, dann stehen dort „Notiz anhängen", „Dauer übernehmen", „Übung bearbeiten" und „Übung löschen"
- [ ] Angenommen die Zusammenfassung ist offen, wenn der Nutzer keinen der vier Wege benutzt und „Fertig" tippt, dann wird die Durchführung gespeichert und keine Übung ist verändert
- [ ] Angenommen die Übung hat die Arbeitsnotiz „Bälle vorher aufpumpen", wenn der Nutzer „Notiz anhängen" wählt, „Mit 2 Bällen besser" eingibt und bestätigt, dann enthält die Arbeitsnotiz der Übung beide Texte, den neuen am Ende
- [ ] Angenommen der Nutzer hat „Notiz anhängen" geöffnet, wenn er auf „Anmerkungen" umstellt und bestätigt, dann steht der Satz am Ende der Anmerkungen und die Arbeitsnotiz ist unverändert
- [ ] Angenommen der Nutzer hat „Notiz anhängen" geöffnet, wenn er hinsieht, dann sieht er den Text des Felds, wie er nach dem Übernehmen dasteht, und kann ihn vor dem Bestätigen ändern
- [ ] Angenommen der Nutzer hat „Notiz anhängen" geöffnet, wenn er ohne Eingabe bestätigen will, dann ist das nicht möglich, und an der Übung ändert sich nichts
- [ ] Angenommen eine Übung war mit 8 Minuten geschätzt und lief 10:40, wenn der Nutzer „Dauer übernehmen" wählt, dann stehen 8 und 11 Minuten nebeneinander und 11 ist als neuer Wert vorgeschlagen
- [ ] Angenommen „Dauer übernehmen" ist offen, wenn der Nutzer den Wert auf 10 ändert und bestätigt, dann ist die geschätzte Dauer der Übung 10 Minuten
- [ ] Angenommen die Übung steht in mindestens einer weiteren gespeicherten Einheit, wenn „Dauer übernehmen" offen ist, dann steht vor dem Bestätigen der Hinweis, dass die neue Dauer nur für künftige Einheiten gilt und bestehende ihre geplante Dauer behalten
- [ ] Angenommen die Übung steht in keiner weiteren gespeicherten Einheit, wenn „Dauer übernehmen" offen ist, dann nennt der Hinweis nur, dass die Dauer für künftige Einheiten gilt
- [ ] Angenommen eine Übung steht in 3 gespeicherten Einheiten, wenn der Nutzer ihre Bearbeiten-Maske öffnet, dann steht oben der Hinweis, dass Änderungen in diesen 3 Einheiten sofort erscheinen und nur die geplante Dauer dort stehen bleibt
- [ ] Angenommen der Hinweis wird gezeigt, wenn der Nutzer ihn aufklappt, dann sind die betroffenen Einheiten beim Namen genannt
- [ ] Angenommen eine Übung steht in keiner gespeicherten Einheit, wenn der Nutzer ihre Bearbeiten-Maske öffnet, dann erscheint kein Hinweis
- [ ] Angenommen eine Übung steht nur in einem Entwurf, wenn der Nutzer ihre Bearbeiten-Maske öffnet, dann erscheint kein Hinweis
- [ ] Angenommen der Nutzer ändert in der Maske das Material einer Übung und speichert, wenn er eine gespeicherte Einheit mit dieser Übung öffnet, dann steht dort das neue Material, auch im Bereitschaftsbild
- [ ] Angenommen der Nutzer ändert in der Maske die Organisationsform einer Übung und speichert, wenn er eine gespeicherte Einheit mit dieser Übung öffnet, dann steht dort die neue Organisationsform
- [ ] Angenommen der Nutzer öffnet die Maske über „Übung bearbeiten" aus der Nachbereitung, wenn die Übung in gespeicherten Einheiten steht, dann steht der Hinweis auch dort
- [ ] Angenommen „Notiz anhängen" ist mit dem Ziel Arbeitsnotiz offen, wenn der Nutzer hinsieht, dann steht dort, dass die Notiz ab sofort in allen Einheiten mit dieser Übung erscheint
- [ ] Angenommen der Nutzer hat eine Notiz an die Arbeitsnotiz angehängt, wenn er eine andere gespeicherte Einheit mit dieser Übung öffnet, dann steht die ergänzte Arbeitsnotiz dort
- [ ] Angenommen der Schritt lief als Variante, wenn der Nutzer „Dauer übernehmen" bestätigt, dann ändert sich die Dauer der Variante und die der Grundübung bleibt
- [ ] Angenommen ein Schritt wurde ausgelassen, wenn der Nutzer ihn in der Zusammenfassung ansieht, dann gibt es dort kein „Dauer übernehmen", die anderen drei Wege aber schon
- [ ] Angenommen die Dauer einer Übung wurde übernommen, wenn der Nutzer die durchgeführte Einheit öffnet, dann steht die Übung dort mit ihrer bisherigen Plandauer
- [ ] Angenommen der Nutzer tippt „Übung bearbeiten", wenn er in der Maske speichert oder abbricht, dann steht er wieder in der Zusammenfassung an derselben Stelle, und die Notiz zur Stunde ist noch da
- [ ] Angenommen der Nutzer tippt „Übung löschen", wenn die Nachfrage erscheint, dann nennt sie die Einheiten, in denen die Übung steht
- [ ] Angenommen der Nutzer hat eine Übung aus der Zusammenfassung gelöscht, wenn er die Zusammenfassung ansieht, dann steht die Übung dort weiter beim Namen, und die vier Wege sind an ihr verschwunden
- [ ] Angenommen an einem Schritt wurde eine Notiz oder Dauer übernommen, wenn der Nutzer die Zusammenfassung oder später die Durchführung ansieht, dann ist das am Schritt vermerkt
- [ ] Angenommen ein Schritt ist freie Zeit oder ein Platzhalter, wenn der Nutzer ihn in der Zusammenfassung ansieht, dann gibt es dort keinen der vier Wege
- [ ] Angenommen eine Durchführung ist gespeichert, wenn der Nutzer sie auf der Detailseite der Einheit aufklappt, dann stehen an ihren Übungen dieselben vier Wege
- [ ] Angenommen es gibt keine Verbindung, wenn die Zusammenfassung offen ist, dann sind die vier Wege nicht bedienbar und ein Hinweis nennt, dass sie an der gespeicherten Durchführung nachgeholt werden können
- [ ] Angenommen das Übernehmen einer Notiz oder Dauer schlägt fehl, wenn die Fehlermeldung erscheint, dann ist die Übung unverändert und die Eingabe steht noch da

## Edge Cases
- **Einheit ohne jeden Schritt** (alle Übungen entfernt, keine Lücke erklärt — kann laut
  Speicherregel nicht vorkommen, aber): „Stunde starten" ist nicht bedienbar, mit Begründung
- **Einheit wird während der laufenden Stunde gelöscht:** die Stunde läuft zu Ende. Beim
  Speichern gibt es die Einheit nicht mehr — die App sagt das, die Durchführung wird verworfen
- **Uhr des Geräts springt** (Zeitumstellung, manuelles Verstellen): eine Restzeit wird nie
  negativ über die verstrichene Stundenzeit hinaus und nie größer als die Plandauer angezeigt
- **Zwei Tabs mit derselben laufenden Stunde:** beide zeigen denselben Stand; ein Tipp in einem
  Tab ist im anderen sichtbar, sobald dieser wieder in den Vordergrund kommt
- **Schritt mit 0 Minuten Plandauer** kommt nicht vor (Mindestdauer aus PROJ-7); freie Zeit unter
  einer Minute gibt es nicht, weil Lücken in ganzen Minuten gerechnet werden
- **Überfülltes Segment:** die Schritte laufen mit ihrer Plandauer; die Gesamtdauer der Stunde ist
  die Summe der Schritte, nicht die im Generator eingestellte Länge
- **Mehrfaches schnelles Tippen auf „Weiter":** jeder Tipp schaltet höchstens einen Schritt; ein
  Schritt, der unter zwei Sekunden offen war, gilt als ausgelassen statt als gemacht
- **Speicher des Browsers nicht verfügbar** (privates Fenster): der Live-Modus startet, warnt aber
  auf dem Bereitschaftsbild, dass die Stunde ein Neuladen nicht übersteht
- **Ton vom Browser blockiert:** der Ablauf bleibt sichtbar; es erscheint keine Fehlermeldung
- **Nachgereichte Durchführung scheitert dauerhaft** (Einheit gelöscht, Konto gewechselt): die App
  sagt, warum, und bietet an, sie zu verwerfen — sie versucht es nicht endlos still weiter
- **Sehr lange Beschreibung oder viele Materialien:** der Inhalt scrollt, Restzeit und Knöpfe
  bleiben stehen
- **Dieselbe Übung steht zweimal in der Stunde:** jede Stelle hat ihre eigene tatsächliche Dauer
  und ihr eigenes „Dauer übernehmen"; die zuletzt bestätigte gilt
- **Dieselbe Übung folgt auf sich selbst:** „Danach" zeigt sie ohne jede Hervorhebung — nichts
  ändert sich
- **Die Übung wurde seit dem Start der Stunde anderswo geändert:** „Notiz anhängen" und „Dauer
  übernehmen" arbeiten auf dem heutigen Stand der Übung, nicht auf dem vom Start; die Vorschau
  zeigt, was wirklich entsteht
- **Tatsächliche Dauer unter einer Minute** (sofort weitergetippt): „Dauer übernehmen" schlägt die
  Mindestdauer vor, nicht null
- **Die angehängte Notiz würde das Feld über seine Höchstlänge bringen:** die Vorschau sagt es, und
  übernommen wird erst, wenn der Text passt
- **Akku fast leer oder Gerät schaltet selbst in den Energiesparmodus:** das Wachhalten kann
  mitten in der Stunde enden — der Hinweis im Live-Modus erscheint, die Stunde läuft weiter
- **Handy liegt mit eingeschaltetem Bildschirm in der Tasche:** versehentliche Tipps sind möglich;
  „Zurück" nimmt ein versehentliches „Weiter" folgenlos zurück
- **Nutzer ist beim Öffnen des Live-Modus abgemeldet** (Sitzung abgelaufen, kein Netz): eine
  bereits laufende Stunde bleibt bedienbar; gespeichert wird nach erneuter Anmeldung

## Technical Requirements (optional)
- **Zeit:** die Anzeige rechnet aus Zeitpunkten, nicht aus einem mitlaufenden Zähler — sonst steht
  die Uhr, sobald der Browser die Seite schlafen legt
- **Sicherheit:** Anmeldung erforderlich; Durchführungen sind nur für den Eigentümer der Einheit
  les- und schreibbar, in der Datenbank durchgesetzt
- **Bedienbarkeit:** Tippflächen mindestens 44 × 44 px; Restzeit in sehr großer Schrift; ausreichend
  Kontrast für helle Hallenbeleuchtung
- **Browser:** Chrome und Safari auf dem Handy sind die Zielgeräte. Vibration ist eine Zugabe und
  darf ohne Meldung fehlen. Fehlt das Wachhalten des Bildschirms, **muss** die App es sagen
- **In `/architecture` zu prüfen:** auf welchen Geräten und Browser-Versionen das Wachhalten
  verfügbar ist, unter welchen Bedingungen das Gerät es verweigert, und wie die Wege in den
  Einstellungen auf iPhone und Android heute heißen — die Anleitung darf nichts Falsches nennen

## Open Questions
- [ ] Soll die Übungsrotation (PROJ-10) „zuletzt verwendet" künftig nach der Durchführung richten
      statt nach dem Speichern der Einheit (Stand seit BUG-6)? Hier nicht entschieden; die Daten
      dafür liegen mit diesem Feature vor
- [ ] Sollen ausgelassene Übungen in der Rotation als „nicht verwendet" gelten? Gehört zur selben
      Entscheidung in PROJ-10
- [ ] Die „feste Länge", ab der Arbeitsnotiz und Beschreibung gekürzt werden: als Zeilenzahl
      festzulegen, sobald der Bildschirm mit echten Übungen am Handy zu sehen ist (Vorschlag als
      Ausgangswert: Arbeitsnotiz 3 Zeilen, Beschreibung der nächsten Übung 4 Zeilen)
- [ ] **Offener Punkt an PROJ-7, hier nur festgehalten:** ändert der Nutzer Material oder
      Organisationsform einer Übung, steht sie in bestehenden Einheiten mit den neuen Angaben —
      ohne dass geprüft wird, ob die Halle der Gruppe das Material hat oder die Organisationsform
      zur Vorgabe der Phase passt. Geprüft wird nur beim Generieren und im Auswahldialog. Soll
      eine Einheit das anzeigen? Über `/refine PROJ-7` zu entscheiden
- [ ] „Bewährt"-Pool: eigenes Gespräch, siehe Out of Scope. Wird daraus ein Feature, bekommt es
      eine eigene ID
- [ ] Der Editor von PROJ-7 ist in der Produktion noch nicht von Hand durchgespielt (siehe
      INDEX.md) — vor dem Bau des Live-Modus nachholen, weil er auf denselben Einheiten aufsetzt

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Eine Übung groß statt der ganzen Liste mit Marke | In der Halle wird aus der Entfernung und im Vorbeigehen gelesen. Eine Liste ist klein und verlangt Scrollen; die Übersicht hat der Nutzer schon in der Leseansicht | 2026-10-10 |
| Die Beschreibung der Übung gehört in den Live-Modus | Die Karte der Leseansicht zeigt sie nicht. Genau in der Halle wird sie gebraucht, und ein Wechsel auf die Übungsseite kostet den Blick auf die Uhr | 2026-10-10 |
| Ungleich geteilter Bildschirm: oben die aktuelle Übung groß, unten fest „Danach" | Vom Nutzer gefordert: auf die nächste Übung muss man sich einstellen können. Halb und halb macht auf 375 px beide Teile klein und nimmt der Restzeit ihre Größe | 2026-10-10 |
| Beschreibung der aktuellen Übung eingeklappt, die der nächsten offen | Vom Nutzer so festgelegt. Die laufende Übung ist schon erklärt; gelesen wird, was als Nächstes kommt | 2026-10-10 |
| Arbeitsnotizen stehen an beiden Übungen offen, lange Texte gekürzt und aufklappbar | Vom Nutzer so festgelegt. Die Arbeitsnotiz ist das, was in der Halle zählt; die Kürzung hält den Bildschirm trotzdem ruhig | 2026-10-10 |
| „Danach" hebt hervor, was sich ändert: neu holen, kann weg, andere Menge, andere Organisationsform | Die eigentliche Vorbereitung ist der Umbau. Zwei Materiallisten im Kopf abzugleichen, während eine Übung läuft, ist genau die Arbeit, die die App abnehmen soll | 2026-10-10 |
| Bildschirm bleibt an, solange der Live-Modus offen ist — auch in der Pause | Vom Nutzer gefordert: kein Standby, kein Entsperren. Eine Trinkpause ist kein Grund, das Handy zu sperren | 2026-10-10 |
| Die Prüfung steht auf dem Bereitschaftsbild; eine Anleitung erscheint nur, wenn das Gerät es nicht zulässt | Die meisten Geräte können es von selbst. Eine Anleitung für alle läse die Mehrheit umsonst; still zu scheitern ließe den Rest mit dunklem Bildschirm in der Halle stehen | 2026-10-10 |
| Kein Sperrbildschirm | Dort kann nur eine eigens installierte App etwas anzeigen; eine native App ist laut PRD kein Ziel | 2026-10-10 |
| Ein Gerät ohne Wachhalten sperrt den Start nicht | Die Uhren laufen trotzdem richtig. Der dunkle Bildschirm kostet Komfort, nicht die Stunde | 2026-10-10 |
| Nachbereitung: Erkenntnisse gehen in die Übung selbst, nicht in eine eigene Liste | Vom Nutzer so entschieden. Was gelernt wurde, soll dort stehen, wo geplant und durchgeführt wird | 2026-10-10 |
| Vier Wege je Übung: Notiz anhängen, Dauer übernehmen, Übung bearbeiten, Übung löschen — alle freiwillig | Vom Nutzer gefordert: Dauer und weitere Merkmale dauerhaft änderbar, die Übung löschbar. Zwei Schnellwege für das Häufigste, die vorhandene Maske für alles andere — keine zweite Bearbeiten-Oberfläche, die mit der ersten Schritt halten müsste | 2026-10-10 |
| „Notiz anhängen" geht in die Arbeitsnotiz, umstellbar auf „Anmerkungen", mit Vorschau | Was in der Halle gelernt wurde, soll in der Halle wieder vor Augen stehen. Rein Persönliches hat mit „Anmerkungen" trotzdem einen Ort. Angehängt statt ersetzt, damit nichts verloren geht | 2026-10-10 |
| Nichts wird ohne Bestätigung geändert, und nur aus der einen Stunde | Eine einzelne Stunde kann ein Ausreißer sein. Der Übungsleiter weiß das, die App nicht | 2026-10-10 |
| Eine übernommene Dauer ändert die Übung, nicht bestehende Einheiten — mit einem Hinweis vor dem Bestätigen | Die Regel besteht seit PROJ-6: die Einheit kopiert nur die Plandauer, damit ein fertiger Stundenverlauf sich nicht verschiebt. Ein rückwirkend veränderter Plan könnte überfüllt sein oder eine offene Lücke bekommen, die gespeicherte Einheiten nicht haben dürfen. Der Hinweis, vom Nutzer gefordert, sagt es, statt es zu verschweigen | 2026-10-10 |
| Die reguläre Bearbeiten-Maske erklärt die Regel mit einem gemeinsamen Hinweis: Änderungen erscheinen sofort in n Einheiten, nur die Dauer nicht | Vom Nutzer so entschieden. Material und Organisationsform wandern in bestehende Einheiten mit, und das wurde bisher nirgends gesagt. Ein Hinweis für beide Richtungen statt je einem pro Feld; eine Nachfrage bei jedem Speichern wäre bei kleinen Korrekturen lästig | 2026-10-10 |
| Keine Nachprüfung bestehender Einheiten gegen Halle und Phase in diesem Feature | Eine geänderte Übung kann in einer bestehenden Einheit stehen, obwohl sie nicht mehr passt. Das zu zeigen ist ein Baustein des Editors, nicht des Live-Modus — als offener Punkt festgehalten | 2026-10-10 |
| Keine eigene Regel dafür, andere Änderungen in bestehende Einheiten zu tragen | Sie ist nicht nötig: alles außer der Dauer liest die Einheit ohnehin von der Übung. Der Hinweis bei „Notiz anhängen" macht das sichtbar | 2026-10-10 |
| Dieselben vier Wege stehen an der gespeicherten Durchführung | Direkt nach der Stunde ist oft keine Zeit und in der Halle oft kein Netz | 2026-10-10 |
| „Bewährt"-Pool nicht in diesem Feature | Vom Nutzer ausdrücklich als unausgereift zurückgestellt; greift in Generator und Rotation ein | 2026-10-10 |
| Die Zeit zählt herunter, schaltet aber nie selbst weiter | Die Halle bestimmt das Tempo. Eine App, die mitten in einer laufenden Übung weiterspringt, zeigt etwas Falsches | 2026-10-10 |
| Gesamtstand als eine Zeile, ohne Vorschläge zum Aufholen | „Wie liege ich im Plan" ist das, was im Kopf am schwersten mitläuft. Vorschläge brauchen Regeln, die erst mit Erfahrung aus echten Stunden gut werden | 2026-10-10 |
| Eingriffe: Auslassen und Pause, kein Tauschen | Tauschen holt den halben Editor in einen Bildschirm, der ruhig sein soll. Ohne Pause verfälscht jede Trinkpause den Gesamtstand | 2026-10-10 |
| „Weiter" vor Ablauf ist „gemacht", „Auslassen" ist eigens | Beides sieht in der Zeitrechnung ähnlich aus, bedeutet für das Protokoll aber Verschiedenes | 2026-10-10 |
| „Zurück" öffnet den Schritt wieder und lässt seine Zeit weiterlaufen | Der häufigste Anlass ist ein versehentlicher Tipp auf „Weiter". Der soll folgenlos zurückzunehmen sein | 2026-10-10 |
| Die Durchführung wird festgehalten: Zeitpunkt, je Schritt gemacht/ausgelassen, tatsächliche Dauer | Die Daten fallen ohnehin an und sind die Grundlage für Rotation (PROJ-10) und Kalender (PROJ-9). Nachträglich lassen sie sich nicht gewinnen | 2026-10-10 |
| Die Durchführung trägt den Plan, wie er lief | Die Einheit kann danach geändert, eine Übung gelöscht werden. Ein Protokoll, das sich rückwirkend ändert, ist keines | 2026-10-10 |
| Läuft nach dem Start ohne Netz, auf demselben Gerät | Sporthallen haben oft schlechten Empfang. Geräteübergreifendes Fortsetzen bräuchte Netz während der Stunde und widerspricht dem | 2026-10-10 |
| Nur gespeicherte Einheiten sind startbar | Sie haben garantiert keine offene Lücke, und ein Entwurf kann vom nächsten Generatorlauf ersetzt werden, während die Stunde läuft | 2026-10-10 |
| Freie Zeit und Platzhalter sind eigene Schritte | Sonst fehlen Minuten in der Rechnung und der Nutzer läge scheinbar ständig voraus. Nichts wird stillschweigend übersprungen | 2026-10-10 |
| Ein Platzhalter „Übung gelöscht" sperrt den Start nicht | Eine Hürde unmittelbar vor der Stunde ist der schlechteste Zeitpunkt. Das Bereitschaftsbild weist darauf hin | 2026-10-10 |
| Signal: sichtbar, dazu Ton und Vibration, abschaltbar, einmalig | In der Halle schaut niemand dauernd aufs Handy. Abschaltbar, weil Musik laufen oder Ruhe gefragt sein kann. Die Grenze bei gesperrtem Bildschirm wird nicht versprochen | 2026-10-10 |
| Bereitschaftsbild vor dem Start, Uhr läuft erst mit „Los geht's" | Wer während des Aufbaus startet, liegt von Beginn an hinter Plan. Und die Materialliste der Einheit hat bisher keinen Ort | 2026-10-10 |
| Material je Art einmal, mit dem größten gleichzeitigen Bedarf | Dieselben Hütchen werden in mehreren Übungen benutzt. Eine Summe würde zu viel aus dem Geräteraum holen lassen | 2026-10-10 |
| Die Arbeitsnotiz der Übung steht im Live-Modus immer da | In PROJ-7 als ihr besonderer Rang festgehalten. Der Schalter der Leseansicht dient der Übersicht beim Planen, nicht der Durchführung | 2026-10-10 |
| Höchstens eine laufende Stunde; Verlassen beendet nicht | Ein versehentlicher Tipp darf den Stand nicht kosten. Mehrere offene Stunden würden sich als vergessene Läufe ansammeln | 2026-10-10 |
| Eine vergessene Stunde wird zur Entscheidung vorgelegt (ab doppelter Plandauer) | Stillschweigend weiterzuzählen ergäbe ein Protokoll über Stunden; stillschweigend zu verwerfen verlöre eine echte Stunde | 2026-10-10 |
| Abschluss mit Zusammenfassung und einer freiwilligen Notiz, ohne Bewertung der Übungen | Der Eindruck direkt nach der Stunde ist wertvoll und kostet einen Satz. Bewertungen greifen in drei andere Features ein | 2026-10-10 |
| Eine Einheit ist beliebig oft durchführbar | Bewährte Einheiten wiederzuverwenden ist ein Kernversprechen des Produkts | 2026-10-10 |

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
