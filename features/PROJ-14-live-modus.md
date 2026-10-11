# PROJ-14: Live-Modus (Stundenbegleitung)

## Status: In Review
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
- [x] Der Editor von PROJ-7 ist in der Produktion von Hand durchgespielt — vom Nutzer am
      2026-10-10 gemeldet, erfolgreich
- [ ] **Aus `/frontend` (2026-10-10):** Auf einem kleinen Handy (375 × 667) schaut „Danach" beim
      ersten Blick nur knapp unter dem aktuellen Schritt hervor, sobald dieser Arbeitsnotiz,
      Arbeitsnotiz der Phase und Beschreibung hat — man muss scrollen. Am echten Gerät ansehen und
      entscheiden, ob der obere Teil knapper werden soll (etwa die Arbeitsnotiz auf zwei Zeilen)
- [x] **Aus `/architecture` (2026-10-10), vom Nutzer am selben Tag entschieden:** Wird eine
      vergessene Stunde mit „Beenden und festhalten" abgeschlossen, bekommt der Schritt, der die
      ganze Zeit offen stand, **höchstens seine Plandauer** — damit im Protokoll keine Übung mit
      drei Stunden steht und „Dauer übernehmen" nichts Unsinniges vorschlägt
- [ ] **Aus `/architecture` (2026-10-10):** Verhält sich der Stromsparmodus des iPhones so, wie
      die Anleitung annimmt (Wachhalten wird abgelehnt, nach dem Ausschalten gewährt)? In keiner
      Quelle belegt — in `/qa` an einem echten Gerät zu prüfen; stimmt es nicht, wird der erste
      Schritt der Anleitung angepasst
- [ ] **Aus `/architecture` (2026-10-10), für PROJ-11:** Das Wachhalten war bei Seiten, die vom
      Home-Bildschirm des iPhones gestartet wurden, laut Dokumentation bis iOS 18.4 defekt. Vor
      der PWA nachsehen, ob das auf aktuellen Geräten behoben ist

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
| „Danach" als eigenes, plakatives Segment in Blau statt als umrandetes Feld; dasselbe Muster als „Zuerst" auf dem Bereitschaftsbild | Vom Nutzer nach der Durchsicht gefordert: klar und von weitem erkennbar geht vor Einheitlichkeit mit dem übrigen Erscheinungsbild. Die erste Übung braucht ihre Angaben schon vor dem Start | 2026-10-11 |
| Feste Reihenfolge: kann weg → neu holen → andere Menge; Beschreibung vor Arbeitsnotiz | Vom Nutzer so festgelegt. Erst wird weggeräumt, dann geholt; und überall dieselbe Reihenfolge, damit sie einmal gelernt wird | 2026-10-11 |
| Musik-Links je Übung auf dem Bereitschaftsbild, als kurzer Verweis | Vom Nutzer gefordert. Vor der Stunde ist der Moment, die Musik bereitzulegen; die ganze Adresse wäre nur Lärm | 2026-10-11 |
| Die Arbeitsnotiz der Phase steht an jedem Schritt der Phase, vor der Arbeitsnotiz der Übung, beide mit vollem Namen | Vom Nutzer so festgelegt: sie gilt für die ganze Phase. Weicht vom ursprünglichen „nur beim ersten Schritt" ab | 2026-10-11 |
| „Übung löschen" gehört nicht in die Nachbereitung | Vom Nutzer nach dem Durchspielen entschieden; dreht die Entscheidung vom 2026-10-10 um, vier Wege anzubieten. Gelöscht wird im Übungsordner | 2026-10-11 |
| Der Vermerk „Notiz übernommen" nennt beide Ziele, wenn an beide angehängt wurde | Vom Nutzer gefordert. Ein Vermerk, der nur das letzte Ziel kennt, verschweigt die erste Übernahme — und der Vermerk ist dazu da, doppeltes Anhängen zu verhindern | 2026-10-11 |
| Im Live-Modus lässt sich durch alle Bilder der Übung blättern | Vom Nutzer gefordert; eine Übung hat bis zu drei Bilder, und oft erklärt erst das zweite den Aufbau | 2026-10-11 |
| Der Hinweis „Stunde läuft" klebt oben | Vom Nutzer gefordert: wer den Live-Modus verlässt, soll den Rückweg nicht suchen müssen | 2026-10-11 |
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
| Die laufende Stunde lebt als „Stundenakte" auf dem Gerät, nicht in der Datenbank | Die Spec verlangt: kein Netz nach dem Start, dasselbe Gerät, Neuladen ändert nichts. Eine Stunde, die der Server führt, bräuchte in der Halle Verbindung | 2026-10-10 |
| Die Akte trennt den Plan vom Start (fest) vom Verlauf (ändert sich) | Damit läuft die Stunde unverändert weiter, wenn die Einheit anderswo geändert oder gelöscht wird — ohne eigene Regel dafür | 2026-10-10 |
| Speicher des Browsers für die Akte, eigene Ablage für die Bilder | Die Akte ist klein und muss sofort lesbar sein; der Browser meldet Änderungen von selbst an andere Tabs. Bildadressen gelten nur 60 Minuten, also wird das Bild selbst abgelegt | 2026-10-10 |
| Zeit wird aus Zeitpunkten gerechnet, nie mitgezählt | Ein Zähler steht, sobald das Handy die Seite schlafen legt. Zeitpunkte überstehen Sperren und Neuladen und machen die Logik ohne Warten prüfbar | 2026-10-10 |
| Vier Logikbausteine ohne Oberfläche: Schritte, Material, Verlauf, Uhr | Bewährtes Muster aus PROJ-7. Die schwierigen Regeln (Gesamtstand, Zurück, Auslassen, Materialvergleich) sind so einzeln testbar | 2026-10-10 |
| Die Schritte werden einmal beim Start gebildet | Der Live-Bildschirm muss weder Segmente noch Lückenregeln kennen; freie Zeit und Platzhalter sind dann Schritte wie alle anderen | 2026-10-10 |
| Kleiner Offline-Baustein nur für `/live`, von Hand statt per Paket | Vom Nutzer entschieden. Handys laden Seiten von sich aus neu; ohne Baustein stünde in einer Halle ohne Empfang die Fehlerseite. Auf einen Bildschirm begrenzt, damit die übrige App davon unberührt bleibt und PROJ-11 nichts vorweggenommen wird | 2026-10-10 |
| `/live` ist eine feste Adresse ohne Einheit und fragt den Server beim Öffnen nach nichts | Nur so lässt sich der Bildschirm ablegen und ohne Netz wieder öffnen; welche Stunde läuft, steht in der Akte | 2026-10-10 |
| `/live` verlangt keine Anmeldung vom Server; die Akte trägt das Konto | Die Spec fordert, dass eine laufende Stunde bei abgelaufener Sitzung bedienbar bleibt. Der Bildschirm zeigt nur, was schon auf dem Gerät liegt; alles Serverseitige prüft weiter die Anmeldung | 2026-10-10 |
| Zwei Tabellen: Durchführung und Schritt der Durchführung | Eigene Zeilen je Schritt, weil PROJ-10 später nach einzelnen Übungen fragen wird. An bestehenden Tabellen ändert sich nichts | 2026-10-10 |
| Der Schritt trägt den Namen als Abschrift und einen Verweis auf die Übung | Der Name bleibt, was auch immer mit der Übung geschieht; der Verweis fällt beim Löschen von selbst weg und nimmt die Nachbereitung an dem Schritt mit | 2026-10-10 |
| Gespeichert wird sofort bei „Stunde beenden"; „Fertig" trägt nur die Notiz nach | Vom Nutzer entschieden. Wer die Zusammenfassung schließt, verliert nichts, und es gibt keinen Zustand „beendet, aber nicht gespeichert", an den die App erinnern müsste | 2026-10-10 |
| Speichern in einem Zug über eine Datenbank-Funktion, mit einer Kennung, die das Gerät beim Start vergibt | Die Durchführung steht ganz oder gar nicht da; kommt sie zweimal an, wird sie wiedererkannt — „erscheint genau einmal" ohne Abgleich von Hand | 2026-10-10 |
| „Zuletzt durchgeführt" wird aus den Durchführungen gelesen | Ein eigenes Feld müsste beim Löschen einer Durchführung nachgezogen werden | 2026-10-10 |
| Notiz anhängen und Dauer übernehmen ändern Übung und Vermerk im selben Zug, auf dem heutigen Stand der Übung | Kein Vermerk ohne Änderung und umgekehrt; nichts wird überschrieben, was seit dem Start anderswo geändert wurde | 2026-10-10 |
| Eine Zusammenfassung für Live-Bildschirm und Detailseite | Zwei Orte, dieselbe Form der Daten — sonst laufen zwei Ansichten auseinander | 2026-10-10 |
| Das Wachhalten wird ausprobiert, nicht aus Gerät oder Akkustand erraten | Wann Geräte ablehnen, ist nur ungefähr dokumentiert; für den Stromsparmodus des iPhones fand sich kein Beleg | 2026-10-10 |
| Die Anleitung nennt den Bereich der Einstellungen, nicht jeden Menüpunkt | Die Wege heißen je Hersteller und Version anders, iOS 26 hat sie gerade umgebaut. Die Spec verlangt, nichts Falsches zu nennen | 2026-10-10 |
| Der Ton wird im Gerät erzeugt | Keine Datei zu laden oder abzulegen; funktioniert damit auch ohne Netz | 2026-10-10 |
| Vergessene Stunde: der offen gebliebene Schritt zählt mit höchstens seiner Plandauer | Vom Nutzer entschieden. Sonst stünde eine Übung mit Stunden im Protokoll, und „Dauer übernehmen" schlüge Unsinn vor | 2026-10-10 |
| Keine neuen Pakete | Alles Nötige kann der Browser. Ein PWA-Paket würde die ganze App offline-fähig machen wollen | 2026-10-10 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-10-10

### Die Grundidee in drei Sätzen

Beim Tippen auf „Stunde starten" holt die App **einmal alles, was die Stunde braucht**, und legt es
als **Stundenakte auf dem Gerät** ab. Ab da spricht der Live-Bildschirm nur noch mit dieser Akte —
nicht mit dem Server —, und jede Uhr wird aus festgehaltenen Zeitpunkten **ausgerechnet**, nicht
mitgezählt. Erst am Ende geht die fertige Durchführung in einem Zug an die Datenbank; klappt das
nicht, wartet sie auf dem Gerät.

Daraus folgt fast alles Übrige: kein Netz nötig, Sperren und Neuladen ändern nichts, die Einheit
kann währenddessen geändert werden, und zwei Tabs zeigen dasselbe, weil beide dieselbe Akte lesen.

### A) Komponentenstruktur

```
/units/[id]  (Detailseite)                         [vorhanden, wird erweitert]
├── Kopfbereich
│   └── „Stunde starten"                           NEU — nur gespeichert, nur Leseansicht
├── Stundenverlauf                                 [vorhanden, unverändert]
└── Durchführungen                                 NEU
    └── Eintrag: Datum · Dauer · ausgelassen · Notiz
        ├── aufgeklappt: Zusammenfassung           NEU — derselbe Baustein wie im Live-Modus
        └── Notiz ändern · Durchführung löschen

/units  (Übersicht)                                [vorhanden, wird erweitert]
└── Einheit
    ├── „Stunde starten"                           NEU
    └── „Zuletzt durchgeführt am …"                NEU

„Stunde starten" (ein Baustein, zwei Einbauorte)   NEU
└── Nachfrage, falls schon eine Stunde läuft:
    fortsetzen · beenden · abbrechen

/live  (eigener Bildschirm, ohne Navigation)       NEU
├── Bereitschaftsbild
│   ├── Einheit · Gruppe · Halle · Gesamtdauer
│   ├── Materialliste (größter gleichzeitiger Bedarf)
│   ├── Musik-Hinweis · Platzhalter-Hinweis
│   ├── Bildschirm-an-Prüfung
│   │   └── Anleitung in zwei Schritten + „Erneut prüfen"   — nur wenn nötig
│   ├── Warnung „übersteht kein Neuladen"                   — nur wenn die Ablage nicht geht
│   └── „Los geht's"
│
├── Laufende Stunde
│   ├── Gesamtstand-Zeile (bleibt stehen)
│   │   └── Ton-Schalter · Hinweis „Bildschirm kann ausgehen"
│   ├── Aktueller Schritt (scrollt)
│   │   ├── Phase und Stand · Name
│   │   ├── Restzeit (bleibt stehen)
│   │   ├── Übungszeile: Material · Organisationsform    [vorhanden, wiederverwendet]
│   │   ├── Arbeitsnotiz Übung / Phase                    [vorhanden, wiederverwendet]
│   │   └── eingeklappt: Beschreibung · Bild · Varianten
│   ├── „Danach" (scrollt)
│   │   ├── Name · Dauer · neue Phase
│   │   ├── Was sich ändert: neu holen · kann weg · andere Menge · Organisationsform
│   │   └── Arbeitsnotiz · Beschreibung
│   ├── Bedienleiste (bleibt stehen)
│   │   └── Zurück · Auslassen · Pause · Weiter
│   └── Menü: Stunde beenden · Abbrechen
│
├── Pausiert (Überlagerung mit „Fortsetzen")
├── Vergessene Stunde (Entscheidung: festhalten · verwerfen)
│
└── Zusammenfassung                                — ein Baustein, auch auf der Detailseite
    ├── geplant / tatsächlich
    ├── je Schritt: gemacht · ausgelassen · Dauern · Vermerke
    │   └── Nachbereitung: Notiz anhängen · Dauer übernehmen · bearbeiten · löschen
    ├── „Wie lief's?"
    └── „Fertig"

In der ganzen App (Kopfzeile)                      NEU
└── Stunden-Hinweis
    ├── „Stunde läuft — fortsetzen"
    ├── „Durchführung wartet auf Verbindung"
    └── „Konnte nicht gespeichert werden" + Grund + „Verwerfen"

/exercises/[id]/edit  (Bearbeiten-Maske)           [vorhanden, wird erweitert]
└── Hinweis „Steht in n gespeicherten Einheiten" (aufklappbar)   NEU
```

Aus vorhandenen Bausteinen kommen: die Übungszeile und die Arbeitsnotiz aus PROJ-7, der
Löschen-Dialog mit seiner Einheiten-Warnung aus PROJ-3, die Meldungen, Dialoge, Auf- und Zuklapper
und Schalter aus shadcn/ui. Neu gebaut wird nur, was es noch nicht gibt.

### B) Die Stundenakte — was auf dem Gerät liegt

Eine Akte je Gerät und Konto. Sie besteht aus zwei Teilen, die nie vermischt werden:

**Der Plan vom Start** — fest, wird nach dem Start nicht mehr angefasst:
- Einheit, Gruppe, Halle, Teilnehmerzahl, Gesamtdauer
- die **Schritte in ihrer Reihenfolge**, jeder mit allem, was der Bildschirm zeigt: Art (Übung,
  freie Zeit, Platzhalter), Phase, Name, Beschreibung, Plandauer, Material mit ausgerechneten
  Mengen, Organisationsform, Arbeitsnotiz von Übung und Phase, weitere Varianten, Titelbild

**Der Verlauf** — ändert sich bei jedem Tipp:
- Zustand der Stunde: bereit, läuft, pausiert, beendet
- welcher Schritt offen ist und **seit welchem Zeitpunkt**
- je Schritt: bisher gelaufene Zeit, und ob gemacht, ausgelassen oder noch offen
- seit wann pausiert ist
- der angefangene Text bei „Wie lief's?"

Dazu eine **Warteliste** für beendete Durchführungen, die noch nicht in der Datenbank sind.

**Abgelegt im Speicher des Browsers** — klein, sofort lesbar, und er sagt anderen Tabs von selbst
Bescheid, wenn sich etwas ändert. Das **Titelbild** jedes Schritts wird beim Start eigens
heruntergeladen und auf dem Gerät abgelegt: die Adressen, unter denen die App Bilder holt, gelten
nur eine Stunde, und eine Stunde kann länger dauern.

**Die Schritte entstehen einmal, beim Start**, aus der gespeicherten Einheit: Übungen in
Planreihenfolge, die geplante Lücke eines Segments als „Freie Zeit" an dessen Ende, ein frei
gelassenes Segment als „Freie Zeit" über seine ganze Länge, ein Platzhalter als eigener Schritt.
Danach gibt es nur noch diese Liste — der Live-Bildschirm kennt weder Segmente noch Lückenregeln.

### C) Wie die Zeit gerechnet wird

Es läuft **kein Zähler**. Festgehalten wird nur, *wann* etwas geschah; jede Anzeige ist eine
Rechnung aus „jetzt" und diesen Zeitpunkten, einmal pro Sekunde neu gezeichnet.

- **Restzeit** = Plandauer − (bisher gelaufene Zeit des Schritts + Zeit seit dem Betreten)
- **Pause** hält einen Zeitpunkt fest; solange er steht, gilt er als „jetzt"
- **Gesamtstand** = dieselbe Rechnung über alle Schritte
- Springt die Uhr des Geräts, wird das Ergebnis in die erlaubten Grenzen zurückgeholt

Deshalb kann das Handy gesperrt, die App gewechselt, die Seite neu geladen werden: beim nächsten
Hinsehen wird einfach neu gerechnet. Und deshalb lässt sich die ganze Zeitlogik **ohne Bildschirm
und ohne Warten prüfen** — man gibt ihr einen Verlauf und ein „jetzt" und liest das Ergebnis.

Vier Logikbausteine tragen den Live-Modus, alle ohne Oberfläche und ohne Datenbank testbar (wie
`draft.ts` im Editor):

| Baustein | Aufgabe |
|---|---|
| Schritte | macht aus einer Einheit die Schrittliste |
| Material | größter gleichzeitiger Bedarf fürs Bereitschaftsbild; Vergleich zweier Schritte für „Danach" |
| Verlauf | Weiter, Zurück, Auslassen, Pause, Beenden — jeweils alter Verlauf hinein, neuer heraus |
| Uhr | Restzeit, „über", Gesamtstand, vergessene Stunde — aus Verlauf und „jetzt" |

### D) Ohne Netz

Drei Dinge müssen ohne Verbindung da sein, und jedes hat seinen eigenen Ort:

| Was | Wo es liegt |
|---|---|
| Inhalte und Stand der Stunde | Stundenakte im Speicher des Browsers |
| Titelbilder | beim Start auf dem Gerät abgelegt |
| **Der Live-Bildschirm selbst** | **kleiner Offline-Baustein, nur für `/live`** |

Der dritte Punkt ist am 2026-10-10 vom Nutzer entschieden. Ohne ihn zeigt ein Neuladen in einer
Halle ohne Empfang die Fehlerseite des Browsers — und Handys laden Seiten von sich aus neu, etwa
nach einem Anruf.

**Der Offline-Baustein ist eng begrenzt:**
- Er wirkt **nur auf den Live-Bildschirm**. Alle anderen Seiten merken nichts von ihm und laden
  wie bisher
- Er hält bereit, was der Bildschirm zum Anzeigen braucht, und sonst nichts — **keine Daten**, die
  liegen in der Stundenakte
- Mit Netz holt er immer die aktuelle Fassung; die abgelegte dient nur als Rückfall. Eine neue
  Auslieferung kommt also an, sobald das Gerät wieder Verbindung hat
- Er wird beim Öffnen des Bereitschaftsbilds eingerichtet — das ist immer mit Netz

Damit das geht, ist `/live` **eine feste Adresse ohne Einheit darin** und kommt ohne Server aus:
welche Stunde läuft, steht in der Akte. Der Bildschirm fragt den Server beim Öffnen nach nichts.

Das ist ein **Vorgriff auf PROJ-11 (PWA)**, aber kein Ersatz: installieren, Start ganz ohne Netz
und die übrige App offline bleiben dort. PROJ-11 kann den Baustein übernehmen und erweitern.

### E) Was in der Datenbank neu ist

Zwei neue Tabellen, sonst nichts. An Einheiten, Segmenten und Übungen ändert sich **kein Feld**.

**Durchführung** — eine Zeile je gelaufener Stunde:
- zu welcher Einheit und welchem Nutzer sie gehört
- Beginn und Ende
- geplante und tatsächliche Gesamtdauer (ohne Pausen), Dauer der Pausen
- die Notiz „Wie lief's?"
- eine Kennung, die **das Gerät beim Start vergibt** (siehe F)

**Schritt der Durchführung** — eine Zeile je Schritt, in der Reihenfolge von damals:
- Art (Übung, freie Zeit, Platzhalter), Phase, **Name als Abschrift**
- geplante und tatsächliche Dauer; gemacht oder ausgelassen
- ein **Verweis auf die Übung** und gegebenenfalls die Variante
- die Vermerke der Nachbereitung: Notiz übernommen (wohin), Dauer übernommen (welcher Wert)

**Abschrift plus Verweis** löst zwei Forderungen der Spec ohne eigene Logik: der Name bleibt
stehen, was auch immer mit der Übung passiert — und wird die Übung gelöscht, fällt der Verweis
von selbst weg, womit auch die vier Wege der Nachbereitung an diesem Schritt verschwinden.

Eigene Zeilen je Schritt statt einer Liste in der Durchführung, weil PROJ-10 (Rotation) später
fragen wird „wann lief diese Übung zuletzt wirklich?" — das ist dann eine einfache Abfrage.

**Zugriff:** beide Tabellen sind nur für den Eigentümer les- und schreibbar, in der Datenbank
durchgesetzt, nach dem Muster der gehärteten Richtlinien aus BUG-4. Wird die Einheit gelöscht,
gehen ihre Durchführungen mit.

**„Zuletzt durchgeführt am …"** wird aus den Durchführungen gelesen, nicht eigens gespeichert —
ein zweites Feld müsste beim Löschen einer Durchführung nachgezogen werden.

### F) Wie die Durchführung gespeichert wird

**Sofort bei „Stunde beenden"**, nicht erst bei „Fertig" (am 2026-10-10 vom Nutzer entschieden,
kleine Abweichung vom Wortlaut der Spec). „Fertig" trägt nur noch die Notiz nach und führt zur
Detailseite. Wer die Zusammenfassung einfach schließt, verliert nichts.

- **In einem Zug**, über eine neue Datenbank-Funktion — die Durchführung steht ganz da oder gar
  nicht, wie beim Speichern im Editor
- **Genau einmal.** Die Kennung der Durchführung vergibt das Gerät schon beim Start. Kommt
  dieselbe Durchführung ein zweites Mal an (Verbindung brach nach dem Absenden ab, zwei Tabs
  versuchen es gleichzeitig), erkennt die Datenbank sie wieder und legt nichts doppelt an
- **Ohne Netz** wandert sie in die Warteliste. Nachgereicht wird beim nächsten Öffnen der App,
  sobald das Gerät wieder Verbindung meldet, und wenn der Nutzer zurückkehrt. Solange etwas
  wartet, sagt es der Stunden-Hinweis in der Kopfzeile
- **Scheitert es endgültig** — Einheit gelöscht, anderes Konto angemeldet —, nennt der Server den
  Grund, und der Hinweis bietet „Verwerfen" an. Kein stilles Weiterprobieren

Die Zusammenfassung ist **ein Baustein für beide Orte**: im Live-Bildschirm liest sie aus der
Stundenakte, auf der Detailseite aus der Datenbank. Beide liefern dieselbe Form.

### G) Nachbereitung

Die vier Wege brauchen eine gespeicherte Durchführung und Verbindung — beides ist direkt nach
„Stunde beenden" in der Regel gegeben, und ohne Netz sind sie laut Spec ohnehin nicht bedienbar.

- **Notiz anhängen** und **Dauer übernehmen** sind zwei schmale Server-Stellen, die genau ein Feld
  der Übung ändern und **im selben Zug den Vermerk am Schritt setzen**. So kann nicht das eine
  ohne das andere geschehen
- Beide Dialoge **holen beim Öffnen den heutigen Stand der Übung** — die Vorschau zeigt, was
  wirklich entsteht, auch wenn die Übung seit dem Start geändert wurde. Wurde sie zwischen Öffnen
  und Bestätigen noch einmal geändert, wird nicht überschrieben, sondern neu vorgelegt
- Höchstlänge und Mindestdauer prüft der Server nach denselben Regeln wie die Bearbeiten-Maske
- **Übung bearbeiten** öffnet die vorhandene Maske mit einer Rücksprungadresse; Speichern und
  Abbrechen führen dorthin zurück. Angenommen werden nur Adressen innerhalb der App. Die Notiz
  „Wie lief's?" übersteht den Ausflug, weil der angefangene Text in der Stundenakte liegt
- **Übung löschen** benutzt den vorhandenen Dialog samt Einheiten-Warnung
- **Der Hinweis in der Bearbeiten-Maske** („steht in n gespeicherten Einheiten") benutzt die
  Abfrage, die die Löschwarnung schon hat — sie zählt bereits nur gespeicherte Einheiten, keine
  Entwürfe

### H) Bildschirm an — Ergebnis der Prüfung

Die Spec verlangt, das hier nachzusehen. Stand der Recherche am 2026-10-10:

| | Stand |
|---|---|
| **iPhone, Safari** | ab iOS 16.4 (Frühjahr 2023) |
| **Android, Chrome** | seit 2020 |
| **Firefox** | ab Version 126 (2024) |
| **iPhone, vom Home-Bildschirm gestartet** | laut Dokumentation bis iOS 18.4 defekt — betrifft erst PROJ-11 |

**Wann das Gerät ablehnt:** die Dokumentation nennt „systembedingt, etwa Energiesparmodus oder
niedriger Akkustand", ohne je Gerät genauer zu werden. Dass der **Stromsparmodus des iPhones** die
Anfrage ablehnt, ist plausibel, aber **in keiner Quelle belegt**. Außerdem gibt jedes Gerät das
Wachhalten ab, sobald die Seite nicht mehr sichtbar ist.

Daraus zwei Entscheidungen:

1. **Die App rät nicht, sie probiert.** Das Bereitschaftsbild fordert das Wachhalten wirklich an
   und zeigt das Ergebnis. Es schließt nicht vom Gerät oder vom Akkustand auf die Antwort. Geht
   das Wachhalten später verloren, merkt es der Live-Bildschirm an der Rückmeldung des Geräts
   und fordert es beim Zurückkehren neu an
2. **Die Anleitung nennt den Bereich, nicht jeden Menüpunkt.** Die Wege heißen je Hersteller und
   Version anders; iOS 26 hat die Batterie-Einstellungen gerade umgebaut, und die Quellen
   widersprechen sich im Detail. Belegt sind:
   - iPhone: Einstellungen → **Batterie** (Stromsparmodus) · Einstellungen → **Anzeige &
     Helligkeit** → **Automatische Sperre**
   - Android: Einstellungen → **Akku** (Energiesparmodus) · Einstellungen → **Display** →
     Bildschirm-Timeout — der letzte Punkt heißt je Hersteller verschieden

   Die Texte werden so geschrieben, dass sie bei beiden Schreibweisen stimmen, und in `/qa` an
   einem echten iPhone und einem echten Android-Gerät gegengelesen.

Quellen: [caniuse — Screen Wake Lock](https://caniuse.com/wake-lock),
[WebKit-Fehler 254545](https://bugs.webkit.org/show_bug.cgi?id=254545),
[MDN — WakeLock.request](https://docs.w3cub.com/dom/wakelock/request),
[W3C — Screen Wake Lock API](https://www.w3.org/TR/2024/WD-screen-wake-lock-20241024/),
[apfelpatient — Einstellungen iOS 26](https://www.apfelpatient.de/tipps-tricks/iphone-akku-schnell-leer-tipps-einstellungen-ios-26),
[iphone-ticker — iOS 26 Energiesparfunktion](https://www.iphone-ticker.de/apple-verteilt-neue-betas-ios-26-mit-zusaetzlicher-energiesparfunktion-262166/)

### I) Signal

Der Ton wird **im Gerät erzeugt**, es gibt keine Tondatei — nichts zu laden, nichts zu lagern.
Handys lassen Töne erst nach einer Berührung zu; der Tipp auf „Los geht's" schaltet ihn frei.
Vibration gibt es auf Android; das iPhone kann sie aus dem Browser nicht, und das bleibt ohne
Meldung. Die Stummschaltung merkt sich das Gerät über den vorhandenen Baustein, der schon den
Schalter „Arbeitsnotizen anzeigen" trägt.

### J) Konto und Gerät

- Die Stundenakte trägt das **Konto**, zu dem sie gehört. Ist ein anderes Konto angemeldet, wird
  sie weder gezeigt noch nachgereicht
- **Abmelden bei laufender Stunde** fragt vorher: beenden und festhalten, verwerfen oder
  angemeldet bleiben. Danach liegt keine Akte mehr auf dem Gerät
- `/live` verlangt beim Öffnen **keine Anmeldung vom Server** — sonst wäre eine laufende Stunde
  bei abgelaufener Sitzung ohne Netz nicht mehr bedienbar, was die Spec ausdrücklich fordert. Der
  Bildschirm zeigt nur, was schon auf dem Gerät liegt; ohne Akte leitet er zur Übersicht. Alles,
  was den Server berührt (starten, speichern, Nachbereitung), prüft die Anmeldung wie bisher

### K) Zwei Tabs

Beide lesen dieselbe Akte. Ändert ein Tab sie, bekommt der andere vom Browser Bescheid und liest
neu; zusätzlich liest jeder Tab neu, wenn er in den Vordergrund kommt. Eine eigene Abstimmung
gibt es nicht — bei gleichzeitigem Tippen gilt der letzte Tipp.

### L) Was an Vorhandenem angefasst wird

| Stelle | Änderung |
|---|---|
| Detailseite der Einheit | „Stunde starten", Liste der Durchführungen |
| Einheiten-Übersicht | „Stunde starten", „Zuletzt durchgeführt am …" |
| Kopfzeile der App | Stunden-Hinweis |
| Abmelden-Knopf | Nachfrage bei laufender Stunde |
| Bearbeiten-Maske der Übung | Einheiten-Hinweis, Rücksprungadresse |
| Löschen-Dialog der Übung | aus der Zusammenfassung aufrufbar |
| Übungszeile, Arbeitsnotiz | unverändert wiederverwendet |

Der Editor, der Generator und ihre Datenbank-Funktionen bleiben unberührt.

### M) Pakete

**Keine neuen.** Wachhalten, Ton, Vibration, Ablage auf dem Gerät und der Offline-Baustein sind
Fähigkeiten des Browsers. Ein fertiges PWA-Paket würde die ganze App offline-fähig machen wollen —
genau das soll hier noch nicht geschehen.

### N) Mobil, Tastatur, Screenreader

- Drei feste Zonen (Gesamtstand, Restzeit, Bedienleiste), dazwischen scrollt der Inhalt. Die
  Bedienleiste hält Abstand zum unteren Rand, den iPhones für ihre Wischgeste brauchen
- Tippflächen mindestens 44 × 44 px, „Weiter" deutlich größer als der Rest
- Die Restzeit wird für Screenreader **nicht** jede Sekunde angesagt, sondern beim Schrittwechsel
  und beim Ablauf
- „Über der Zeit" und „Pausiert" sind nie nur Farbe, immer auch Wort

### O) Reihenfolge des Bauens

**`/frontend`**
1. Die vier Logikbausteine mit Tests — Schritte, Material, Verlauf, Uhr
2. Stundenakte auf dem Gerät, samt Bescheid an andere Tabs
3. Live-Bildschirm: Bereitschaftsbild, laufende Stunde, Pause — zunächst mit einer Einheit aus
   den vorhandenen Daten, ohne Speichern
4. Wachhalten, Ton, Vibration
5. Zusammenfassung, Stunden-Hinweis in der Kopfzeile, „Stunde starten" an beiden Orten
6. Offline-Baustein und Ablage der Bilder
7. Dialoge der Nachbereitung, Hinweis in der Bearbeiten-Maske

**`/backend`**
8. Migration: zwei Tabellen, Zugriffsregeln, Speicher-Funktion
9. Server-Stellen: alles für den Start holen · Durchführung speichern · Durchführungen lesen,
   Notiz ändern, löschen · Notiz anhängen · Dauer übernehmen
10. Warteliste anschließen, Liste der Durchführungen, „Zuletzt durchgeführt"

Die Uhr und der Offline-Baustein lassen sich in den Browser-Tests gezielt prüfen: die Tests können
die Zeit vorstellen und das Netz abschalten.

### P) Was dieses Design offen lässt

- **Nicht nachweisbar auf diesem Rechner:** ob der Bildschirm auf einem echten iPhone und einem
  echten Android-Gerät wirklich an bleibt, wie sich der Stromsparmodus verhält, und ob der Ton
  kommt. Das braucht zwei echte Geräte in `/qa`
- **Die Ablage im Browser ist kein Tresor.** Löscht der Nutzer die Website-Daten oder räumt das
  Handy bei Speichermangel auf, ist eine laufende Stunde und eine wartende Durchführung weg. Das
  ist bei jeder Web-App so und wird hier nicht verhindert, nur benannt
- **Im privaten Fenster** geht der Offline-Baustein nicht; die Warnung auf dem Bereitschaftsbild
  deckt das mit ab
- Zwei Fragen stehen unter „Open Questions" (Stromsparmodus des iPhones, Wachhalten vom
  Home-Bildschirm); die dritte — die Dauer des offenen Schritts einer vergessenen Stunde — ist
  am 2026-10-10 entschieden

**Vom Nutzer am 2026-10-10 abgenommen**, einschließlich der beiden eigens vorgelegten Punkte:
`/live` ohne Anmeldeprüfung durch den Server, und die Anleitung nennt den Bereich der
Einstellungen statt jeden Menüpunkt.

## Implementation Notes (Frontend)

**Gebaut:** 2026-10-10 · **474 Unit-Tests grün** (426 plus 48 neue), Typprüfung, Lint und
Produktionsbuild sauber. `/live` wird als statische Seite gebaut, wie der Entwurf es verlangt.

Im Browser nachgesehen wurde der Live-Bildschirm selbst, bei 375 × 667 gegen den Produktionsbuild
und mit vorgestellter Uhr: Bereitschaftsbild, Restzeit, „über", Gesamtstand, Neuladen, Pause,
Weiter, Auslassen, freie Zeit, Platzhalter, Zusammenfassung — kein waagerechtes Scrollen, die
Zeiten stimmen. **Nicht** im Browser nachgesehen: „Stunde starten" an einer echten Einheit, der
Hinweis in der Kopfzeile, die Nachfrage beim Abmelden und der Hinweis in der Bearbeiten-Maske —
die brauchen eine Anmeldung. Der Offline-Baustein ist gebaut, aber nicht ohne Netz erprobt.

### Neu: die Logik (ohne Oberfläche, ohne Datenbank) — `src/lib/live/`

| Datei | Aufgabe |
|---|---|
| `types.ts` | Plan vom Start, Verlauf, Stundenakte, Durchführung |
| `steps.ts` | macht aus einer Einheit die Schrittliste; rechnet „pro Teilnehmer" aus |
| `material.ts` | größter gleichzeitiger Bedarf; Vergleich zweier Schritte für „Danach" |
| `run.ts` | Los, Weiter, Zurück, Auslassen, Pause, Beenden, vergessene Stunde; baut die Durchführung |
| `clock.ts` | Restzeit, „über", Gesamtstand, vergessene Stunde — aus Verlauf und „jetzt" |
| `store.ts` | Stundenakte und Warteliste im Speicher des Browsers, Bescheid an andere Tabs, Nachreichen |
| `signal.ts` | Ton (im Gerät erzeugt) und Vibration |
| `return-path.ts` | lässt als Rücksprungadresse nur Wege innerhalb der App zu |

### Neu: die Oberfläche

- `src/app/live/page.tsx` — der Bildschirm, außerhalb des angemeldeten Bereichs und ohne Kopfzeile
- `src/components/live/` — `live-screen` (Ablauf), `ready-screen`, `step-screen`, `run-summary`,
  `step-follow-up` (die vier Wege mit ihren Dialogen), `unit-runs` (Liste an der Einheit),
  `live-banner` (Hinweis in der Kopfzeile), `start-lesson-button`, `clamped-text`
- `src/components/exercises/exercise-units-notice.tsx` — der Hinweis in der Bearbeiten-Maske
- `src/hooks/` — `use-live-session` (Akte, Warteliste, „jetzt", Verbindung), `use-wake-lock`,
  `use-live-offline`
- `public/live-sw.js` — der Offline-Baustein, auf `/live` begrenzt
- `src/lib/actions/live.ts` — die Server-Stellen als Vertrag (siehe unten)

### Geändert an Vorhandenem

- **Detailseite der Einheit:** „Stunde starten" (nur gespeichert, nur Leseansicht), darunter die
  Liste der Durchführungen
- **Einheiten-Übersicht:** „Stunde starten" als Symbol-Knopf je Einheit; „Zuletzt durchgeführt am
  …" ist vorbereitet und erscheint, sobald `/backend` den Wert liefert
- **Kopfzeile:** Stunden-Hinweis; **Abmelden** fragt bei laufender Stunde
- **Bearbeiten-Maske der Übung:** Einheiten-Hinweis und Rücksprungadresse (`?zurueck=`)
- **Arbeitsnotiz** (`work-note.tsx`): kann eine andere Überschrift tragen und gekürzt werden

### Entscheidungen, die beim Bauen fielen

- **Der Gesamtstand rechnet „wo endet die Stunde".** Verstrichenes plus das, was laut Plan noch
  aussteht, gegen die geplante Gesamtdauer. Nur so gewinnt ein ausgelassener Schritt seine
  Planzeit, wie die Spec es verlangt; solange der laufende Schritt in seiner Zeit bleibt, ändert
  sich nichts
- **„Stunde beenden" bei einem über „Zurück" verlassenen Schritt:** hatte der spätere Schritt
  schon Zeit gesammelt, gilt er als gemacht, nicht als ausgelassen
- **Das Signal ertönt nur, wenn die Restzeit vor den Augen des Nutzers null erreicht.** Wer einen
  längst abgelaufenen Schritt wieder öffnet oder neu lädt, hört nichts
- **Das Bereitschaftsbild ist schon Teil der Akte** (Zustand „bereit"). Als laufende Stunde zählt
  es nirgends; „Zurück zur Einheit" räumt es weg
- **Typografische Anführungszeichen** („…") in den neuen Texten, weil der Lint das gerade
  Schlusszeichen in der Oberfläche ablehnt
- **Der Offline-Baustein läuft nur im Produktionsbuild** — in der Entwicklung wäre ein abgelegter
  Stand nach jedem Speichern veraltet
- **Der Hinweis „Bildschirm kann ausgehen"** steht auch auf Geräten, die das Wachhalten gar nicht
  kennen, nicht nur wenn es verloren geht

### Nach der Durchsicht durch den Nutzer nachgeschärft (2026-10-11)

Sieben Punkte, alle Oberfläche. Wo sie vom Abschnitt „Funktionsumfang" abweichen, gilt das hier:

- **Musik-Links auf dem Bereitschaftsbild** — je Übung mit Musik steht ein kurzer Verweis „Musik
  öffnen" (neuer Tab), nicht die ganze Adresse. Zum Verweis wird nur eine gewöhnliche
  Web-Adresse; anderes bleibt Text ohne Link
- **Die erste Übung steht unten auf dem Bereitschaftsbild**, als Segment „Zuerst" — nach demselben
  Muster wie später „Danach", nur ohne Vergleich, weil noch kein Schritt läuft
- **„Danach" ist ein eigenes Segment statt eines umrandeten Felds:** über die ganze Breite, mit
  einer kräftig blauen Kopfleiste als Trennstrich und hellblauem Grund, der den Rest des
  Bildschirms füllt. Bewusst abseits des Grüns der App — es soll von weitem zu erkennen sein
- **Die Arbeitsnotiz steht in diesem Segment auf Weiß** statt auf Hellgrün; auf Blau wäre das Grün
  verschwommen. Ihr grüner Name bleibt, außerhalb des Segments bleibt sie hellgrün
- **Erst „Kann weg", dann „Neu holen", dann „Andere Menge"** — in der Reihenfolge, in der umgebaut
  wird. Die Marken sind kräftig und in drei klar verschiedenen Farben (Grau, Grün, Gelb)
- **Eine neue Phase steht in der Kopfleiste**, in einer Reihe mit „Danach" und vor dem Namen der
  Übung („DANACH · Neue Phase: Hauptteil")
- **Überall erst die Beschreibung, darunter die Arbeitsnotiz** — auch bei der aktuellen Übung, wo
  die Beschreibung eingeklappt bleibt
- **Der Hinweis „Stunde läuft — fortsetzen" klebt unter der Kopfzeile** und ist jetzt ein voller
  grüner Balken über die ganze Breite, der beim Scrollen stehen bleibt

„Danach" ist dafür aus dem Schritt-Bildschirm in einen eigenen Baustein gewandert
(`upcoming-step.tsx`), den beide Orte benutzen. **476 Unit-Tests grün** (474 plus 2 neue),
Typprüfung, Lint und Produktionsbuild sauber; Bereitschaftsbild und laufende Stunde bei 375 px
erneut im Browser nachgesehen. Der angeklebte Hinweis ist **nicht** gesehen — er liegt hinter der
Anmeldung.

**Vom Nutzer am 2026-10-11 im Browser angesehen und für gut befunden**, mit drei weiteren
Punkten, die am selben Tag eingebaut sind:

- **Die Arbeitsnotiz der Phase bleibt während der ganzen Phase stehen** — an jedem ihrer Schritte,
  nicht nur am ersten. Das ändert den Abschnitt „Der Schritt" im Funktionsumfang und das
  zugehörige Akzeptanzkriterium, die nur den ersten Schritt nennen
- **Erst die Arbeitsnotiz der Phase, dann die der Übung**, und beide tragen im Live-Modus ihren
  vollen Namen: „Arbeitsnotiz der Phase" und „Arbeitsnotiz der Übung". In „Danach" steht die der
  Phase weiterhin nur, wenn eine neue Phase beginnt — innerhalb der Phase steht sie schon oben
- **Vom Nutzer am selben Tag genauer gefasst:** der reguläre Platz der Arbeitsnotiz der Phase ist
  **oben bei der aktuellen Übung, als Erstes** — noch vor Material, Organisationsform und
  Beschreibung. In „Danach" steht sie **nur, wenn die Phase als Nächstes beginnt**; auch vor
  freier Zeit innerhalb derselben Phase nicht mehr, dort steht sie schon oben
- **Im Dreipunkt-Menü steht „Live-Modus verlassen" vor „Stunde beenden"**
- **Die Zusammenfassung sagt, dass sich die Stunde auch später nachbereiten lässt** — an der
  Einheit unter „Durchführungen"

### Was noch fehlt — alles davon ist `/backend`

`src/lib/actions/live.ts` legt den Vertrag fest. Angeschlossen ist nur `loadLivePlan`; alles
andere meldet „noch nicht angeschlossen":

- **`saveRun`** — bis dahin bleibt jede beendete Stunde in der Warteliste, und die Kopfzeile sagt
  dauerhaft „wartet auf Verbindung". Das ist der Stand der Oberfläche, kein Fehler
- **`getRunsForUnit`, `updateRunNote`, `deleteRun`** — die Liste an der Einheit ist leer
- **`getFollowUpExercise`, `appendExerciseNote`, `adoptExerciseDuration`** — die vier Wege der
  Nachbereitung sind gebaut, aber erst mit einer gespeicherten Durchführung bedienbar und deshalb
  **noch nie durchgespielt**
- **`lastRunAt`** an der Einheit in der Übersicht
- **`loadLivePlan` liest über die vorhandenen Wege** und bekommt deshalb zweierlei nicht: bei
  einer Variante steht die **Beschreibung der Grundübung** statt der der Variante, und das
  **Titelbild** fehlt ganz. Damit ist auch die Ablage der Bilder auf dem Gerät noch nicht gebaut

## Implementation Notes (Backend)

**Gebaut:** 2026-10-11 · **492 Unit-Tests grün** (476 plus 16 neue), Typprüfung, Lint und
Produktionsbuild sauber. Migration `20261011100000_unit_runs.sql` vom Nutzer über den SQL-Editor
des Dashboards angewendet, **Register 16 zu 16**.

Damit ist alles geschlossen, was der Abschnitt „Was noch fehlt" der Oberfläche offen ließ. **Im
Browser durchgespielt ist davon noch nichts** — nachgewiesen ist die Datenbank, nicht der Weg vom
Knopf bis zur Zeile.

### Datenbank

- **`unit_runs`** — eine Zeile je gelaufener Stunde. Die Kennung hat keinen Standardwert: das
  Gerät vergibt sie beim Start
- **`unit_run_steps`** — eine Zeile je Schritt: Name als Abschrift, Verweis auf Übung und Variante
  (fällt beim Löschen von selbst weg), geplante und tatsächliche Dauer, die zwei Vermerke der
  Nachbereitung
- **Acht Richtlinien**, vier je Tabelle, nur für den Eigentümer. Ein Schritt darf nur auf eine
  eigene Übung verweisen und auf eine Variante nur, wenn sie zu genau dieser Übung gehört. Der
  angemeldete Nutzer wird je Abfrage einmal ausgewertet, nicht je Zeile — die neuen Richtlinien
  fallen damit nicht unter den Leistungshinweis, den Supabase zu den 52 älteren meldet
- **Drei Funktionen**, alle mit den Rechten des Aufrufers, für `anon` gesperrt:
  - `save_unit_run` — die Durchführung ganz oder gar nicht; dieselbe Kennung ein zweites Mal
    ergibt wieder „ok" und nichts Doppeltes
  - `append_exercise_note` — Notizfeld der Übung und Vermerk am Schritt im selben Zug
  - `adopt_exercise_duration` — Dauer der Variante oder der Übung und Vermerk im selben Zug
- **Löschweitergabe:** Einheit weg → Durchführungen weg; Übung oder Variante weg → Verweis leer,
  Name bleibt

### Serverseite — `src/lib/actions/live.ts`

Der Vertrag aus `/frontend` ist unverändert angeschlossen: `saveRun`, `getRunsForUnit`,
`updateRunNote`, `deleteRun`, `getFollowUpExercise`, `appendExerciseNote`,
`adoptExerciseDuration`. Alle prüfen die Anmeldung und die Eingabe (`src/lib/validations/live.ts`).
Dazu:

- **`loadLivePlan` lädt nach, was die Leseansicht nicht mitbringt:** die Beschreibung der
  **Variante** (vorher stand die der Grundübung da) und den Pfad des Titelbilds
- **„Zuletzt durchgeführt am …"** in der Übersicht, aus den Durchführungen gelesen
- **Die Liste an der Einheit** zeigt höchstens die 50 jüngsten Durchführungen

### Auf dem Gerät nachgezogen

- **Titelbilder** werden auf dem Bereitschaftsbild geholt und in der Ablage des Browsers gehalten
  (`src/lib/live/images.ts`); an der aktuellen Übung steht ein einklappbares Feld „Bild"
  (`step-image.tsx`). Geladen wird erst beim Aufklappen, aus der Ablage
- **Die Kennung der Durchführung ist auch auf alten Browsern eine UUID** — die Datenbank nimmt
  nichts anderes an
- **Wurde die Übung inzwischen geändert**, lädt der Dialog der Nachbereitung den neuen Stand und
  setzt die Vorschau neu zusammen, statt zu überschreiben

### Entscheidungen, die beim Bauen fielen

- **Welche Übung gemeint ist, sagt der Schritt, nicht der Aufrufer.** Die Nachbereitung nennt nur
  Durchführung und Position; die Übung liest der Server am Schritt. Ein manipulierter Aufruf kann
  so keine fremde oder andere Übung treffen
- **„Notiz anhängen" schickt den ganzen neuen Text des Felds**, nicht nur den Satz — der Nutzer
  hat genau diesen Text in der Vorschau gesehen und konnte ihn ändern
- **Lief der Schritt als Variante und gibt es sie nicht mehr, wird keine Dauer übernommen.** Sonst
  träfe die Dauer der Variante stillschweigend die Grundübung
- **Bei einer Variante wird der Änderungsstempel der Übung nachgezogen** — die Variante hat keinen
  eigenen, und eine zweite, gleichzeitig offene Übernahme soll die Änderung bemerken
- **Eine nachgereichte Durchführung wird vor der Einheit geprüft:** kam sie beim ersten Mal doch
  an, scheitert die Wiederholung nicht an einer inzwischen geänderten Einheit
- **Endgültig gescheitert** (die App bietet „Verwerfen" an) sind: Einheit gibt es nicht mehr,
  Durchführung unvollständig. **Wird erneut versucht:** nicht angemeldet, alles Unbekannte

### Nachweis am lebenden System (2026-10-11)

In einer zurückgerollten Transaktion unter der Rolle `authenticated`, danach nachgesehen: keine
Zeile zurückgeblieben, die Testübung hat ihre alte Dauer.

| Fall | Ergebnis |
|---|---|
| Speichern | ok, 4 Schritte, Notiz ohne Leerraum |
| Verweise | eigene Übung und Variante bleiben; eine unbekannte Übung wird ohne Verweis abgelegt, mit Namen |
| Dieselbe Durchführung noch einmal | ok, weiter 1 Durchführung und 4 Schritte |
| Einheit gibt es nicht | `unit_not_found` |
| Ohne Schritte | `invalid_run` |
| Fehler mitten in den Schritten | abgewiesen, **nichts halb geschrieben** |
| Notiz mit veraltetem Stempel | `stale`, kein Vermerk, Übung unverändert |
| Notiz | ok, Text steht im Feld, Vermerk gesetzt |
| Dauer an einer Variante | Variante geändert, **Grundübung unverändert**, Vermerk gesetzt |
| Dauer an der Grundübung | Übung geändert, **Plandauer in der Einheit unverändert** |
| Dauer an ausgelassenem Schritt | `step_skipped` |
| Notiz an Schritt ohne Übung | `exercise_gone` |
| Dauer 0, Notiz über 2.000 Zeichen | `invalid_duration`, `invalid_note` |
| Fremdes Konto | sieht 0 Durchführungen und 0 Schritte; Speichern, Notiz, Dauer und direktes Einfügen eines Schritts abgewiesen |
| Ohne Anmeldung | `not_authenticated` |
| Rolle `anon` | Ausführung verweigert |

Lesend am Katalog bestätigt: Zeilenschutz an beiden Tabellen, acht Richtlinien, sieben Indizes,
die drei Funktionen ohne erhöhte Rechte, Löschweitergabe wie oben. `get_advisors` meldet weiter
nur den bekannten Hinweis zum Passwortschutz.

### Nach dem Durchspielen durch den Nutzer geändert (2026-10-11)

Der Nutzer hat den Weg von Hand durchgespielt — Stunde starten, beenden, Durchführung an der
Einheit, Notiz und Dauer übernehmen — und gemeldet: **es klappt alles.** Dazu drei Änderungen:

- **Der Dialog „Notiz anhängen" zeigt das Notizfeld der Übung selbst.** Statt „Dein Satz" und
  einer Vorschau steht dort **ein** Feld mit dem heutigen Text, direkt änderbar. Oben wird
  zwischen Arbeitsnotiz und Anmerkungen umgeschaltet; das Feld wechselt mit, und was im anderen
  getippt wurde, bleibt. Beide lassen sich so in einem Arbeitsschritt ändern, eine Bestätigung
  speichert, was sich geändert hat. Wer den Text löscht, leert das Feld. **Das ersetzt die
  Beschreibung „Notiz anhängen" im Funktionsumfang und fünf Akzeptanzkriterien** (Satz ans Ende,
  Umstellen auf Anmerkungen, Vorschau, Bestätigen ohne Eingabe, überlanger Text in der Vorschau)
- **Der Vermerk „Notiz übernommen" zählt mit.** Er nennt immer, was geändert wurde, und beides,
  wenn beide Felder geändert wurden — in einem Zug oder nacheinander: „Notiz übernommen
  (Arbeitsnotiz)", „(Anmerkungen)" oder „(Arbeitsnotiz, Anmerkungen)"
- **Dafür eine zweite Migration** (`20261011140000_exercise_notes_follow_up.sql`): ein dritter
  erlaubter Wert „beides" am Schritt, und die Funktion `update_exercise_notes` ersetzt
  `append_exercise_note`. Sie setzt **beide Felder in einem Zug** — zwei Aufrufe nacheinander
  gingen nicht, der erste zieht den Änderungsstempel der Übung nach und der zweite stieße sich
  daran — und vermerkt nur, was sich wirklich geändert hat
- **Die Bilder der Übung sind auch in „Danach" und „Zuerst" aufklappbar**, nicht nur am laufenden
  Schritt
- **Nach „Fertig" blitzt nicht mehr „Es läuft gerade keine Stunde" auf.** Die Akte war in dem
  Augenblick schon weggeräumt, die Detailseite aber noch nicht da; jetzt steht bis zum
  Seitenwechsel die Ladeanzeige. Dasselbe gilt für „Zurück zur Einheit", Abbrechen und Verwerfen
- **„Übung löschen" ist aus der Nachbereitung entfernt** — in der Zusammenfassung nach der Stunde
  und an der gespeicherten Durchführung. Es bleiben drei Wege: Notiz anhängen, Dauer übernehmen,
  Übung bearbeiten. Gelöscht wird im Übungsordner. **Das weicht vom Abschnitt „Nachbereitung" und
  von vier Akzeptanzkriterien ab**, die den vierten Weg nennen; sie gelten als überholt
- **Durch alle Bilder der Übung blättern.** Das einklappbare Feld heißt bei mehreren Bildern
  „Bilder (n)", zeigt zuerst das Titelbild und hat links und rechts einen Pfeil; nach dem letzten
  kommt wieder das erste. Alle Bilder liegen auf dem Gerät, geladen wird das gerade gezeigte

**Die zweite Migration ist angewendet, Register 17 zu 17**, und am lebenden System in einer
zurückgerollten Transaktion nachgewiesen (2026-10-11), fünfzehn Fälle, nichts zurückgeblieben:
veralteter Stempel überschreibt nicht; gleicher Text schreibt nichts und vermerkt nichts; nur
Arbeitsnotiz → Vermerk „work", Anmerkungen unberührt; danach Anmerkungen am selben Schritt →
„both"; beide in einem Zug → „both"; nur Anmerkungen → „personal"; geleertes Feld ist danach
leer; ist eine von beiden zu lang, wird **keine** geschrieben; Schritt ohne Übung, fehlender
Schritt, fremdes Konto, fehlende Anmeldung und `anon` abgewiesen. Die alte Funktion
`append_exercise_note` gibt es nicht mehr. `get_advisors` meldet weiter nur den bekannten Hinweis.

**Im Browser sind diese Änderungen noch nicht gesehen** — weder der neue Dialog noch die Bilder
in „Danach" und „Zuerst".

**496 Unit-Tests grün** (492 plus 4 neue), Typprüfung, Lint und Produktionsbuild sauber.

### Was dieser Nachweis nicht abdeckt

- **Die Löschfälle sind nicht ausgeführt**, nur am Katalog abgelesen: ein Block mit `DELETE` auf
  Übung und Einheit wurde vom Werkzeug abgelehnt, auch in der zurückgerollten Transaktion. Dass
  der Name nach dem Löschen der Übung stehen bleibt und die Durchführungen mit der Einheit
  verschwinden, folgt aus den Fremdschlüssel-Regeln — in `/qa` einmal wirklich durchspielen
- **Zwei gleichzeitige Sendungen** derselben Durchführung: der Weg ist gebaut, in einer einzelnen
  Transaktion aber nicht nachstellbar. Nachgewiesen ist die Wiederholung nacheinander
- **Der veraltete Stempel nach einer echten Änderung:** innerhalb einer Transaktion steht die Uhr
  der Datenbank; geprüft ist der Fall mit einem bewusst falschen Stempel
- **Die Server-Stellen selbst** sind nicht gegen die Datenbank gelaufen, nur ihre Prüfungen und
  Umformungen als Unit-Tests. Der Weg Knopf → Server → Datenbank gehört in `/qa`
- **Die Ablage der Bilder** ist ungesehen: sie braucht eine Übung mit Bild und eine Anmeldung

## QA Test Results

**Tested:** 2026-10-11
**App URL:** http://localhost:3100 (Produktionsbuild)
**Tester:** QA Engineer (AI)

### Ergebnis in einem Satz

**Nicht bereit für die Auslieferung:** kein Akzeptanzkriterium ist durchgefallen, aber der
Offline-Baustein — vom Nutzer eigens entschieden — greift auf dem normalen Weg in den Live-Modus
nicht (BUG-23, hoch). Dazu drei kleinere Befunde. Kein Datenverlust in einem der Fälle, kein
Befund am Zugriffsschutz der Datenbank.

### Was gelaufen ist

| | Ergebnis |
|---|---|
| Unit-Tests | **512 grün** (496 plus 16 neue für die Ablage auf dem Gerät), einer davon als erwarteter Fehlschlag markiert (BUG-22) |
| Browser-Tests PROJ-14 | **175**: 85 je Projekt (Rechner, Handybreite) plus 5 ohne Anmeldung. **168 bestanden, 7 als erwartete Fehlschläge markiert** — sie stellen die vier Befunde nach und werden rot, sobald ein Befund behoben ist |
| Gesamtlauf aller Features | **333 von 333 grün in einem Zug** (16,8 Minuten, zwei Arbeiter, ohne Entwicklungsserver): 158 aus PROJ-3, -5, -6, -7, 175 aus PROJ-14. Ein erster Gesamtlauf am selben Tag war es nicht — siehe „Hinweis zur Testumgebung" |
| Datenbank | zwei Nachweise in zurückgerollten Transaktionen aus `/backend` (16 und 15 Fälle), dazu die Löschfälle jetzt wirklich ausgeführt (Browser-Tests) |
| Breiten | 375, 768 und 1440 px in allen drei Zuständen (Bereitschaftsbild, laufende Stunde, Zusammenfassung): kein waagerechtes Scrollen. Dazu die ganze Suite in der Emulation „iPhone 13" (390 px) |
| Browser | **nur Chromium** (Edge). Firefox und echtes Safari sind auf diesem Rechner nicht prüfbar |

Zeit vergeht in den Browser-Tests nicht durch Warten: die festgehaltenen Zeitpunkte der
Stundenakte werden zurückgerückt. Für die App ist das dasselbe wie ein gesperrtes Handy — und
genau der Weg, auf dem sie in der Halle rechnet.

### Akzeptanzkriterien

114 Kriterien. **Durchgefallen: keines.**

| Abschnitt | Kriterien | bestanden | Anmerkung |
|---|---|---|---|
| Start und Bereitschaftsbild | 12 | 12 | |
| Der Schritt | 11 | 11 | „Arbeitsnotiz der Phase beim ersten Schritt" ist durch „an jedem Schritt der Phase" ersetzt und so geprüft |
| „Danach" | 15 | 15 | drei davon am Bildschirmfoto, nicht im Test: das Kürzen langer Texte mit „mehr" (2) und „klar getrennt, Restzeit das größte Element" |
| Bildschirm an | 9 | 4 | **4 nicht prüfbar** ohne echtes Gerät (bleibt an während der Stunde, in der Pause, nach dem Zurückkehren, gibt nach dem Ende frei); **1 nur halb**: der Hinweis im Live-Modus ist am Gerät geprüft, das das Wachhalten gar nicht kennt — nicht am Verlust mitten in der Stunde |
| Zeit | 7 | 6 | **1 nicht prüfbar**: dass der Ton genau einmal kommt |
| Bedienung | 9 | 9 | |
| Robustheit | 5 | 5 | „zwei Minuten gesperrt" durch Zurückrücken der Zeitpunkte nachgestellt |
| Laufende Stunde | 4 | 4 | Abmelden: geprüft ist die Nachfrage. Das Abmelden selbst nicht ausgeführt — es hätte die Sitzung aller übrigen Tests beendet |
| Abschluss und Durchführungen | 12 | 12 | |
| Nachbereitung | 30 | 27 | **2 entfallen** („Übung löschen" ist auf Wunsch des Nutzers entfernt). **1 nicht eigens geprüft**: dass der Hinweis in der Bearbeiten-Maske auch erscheint, wenn sie aus der Nachbereitung geöffnet wird — es ist dieselbe Seite. Vier weitere sind in ihrer **neuen Fassung** geprüft (drei statt vier Wege; der Dialog zeigt das Notizfeld selbst) |
| **Summe** | **114** | **105** | 5 nicht prüfbar · 1 halb · 1 nicht eigens · 2 entfallen |

### Edge Cases

| Fall | Ergebnis |
|---|---|
| Einheit ohne jeden Schritt | **BUG-26** (niedrig): der Knopf ist bedienbar, die Begründung kommt erst nach dem Tippen. Am Code gelesen, nicht nachgestellt — der Fall kann laut Speicherregel nicht entstehen |
| Einheit wird während der Stunde gelöscht | bestanden — die App nennt den Grund und bietet „Verwerfen" |
| Uhr des Geräts springt | bestanden (Unit-Test) |
| Zwei Tabs | bestanden — ein Tipp im einen ist im anderen zu sehen |
| Schritt mit 0 Minuten | kommt nicht vor |
| Überfülltes Segment | bestanden (Unit-Test) |
| Mehrfaches schnelles Tippen | bestanden (Unit-Test: unter zwei Sekunden gilt als ausgelassen) |
| Speicher des Browsers nicht verfügbar | bestanden — Warnung auf dem Bereitschaftsbild, die Stunde startet |
| Ton vom Browser blockiert | am Code gelesen, nicht prüfbar |
| Nachgereichte Durchführung scheitert dauerhaft | bestanden |
| Sehr lange Beschreibung, viele Materialien | bestanden |
| Dieselbe Übung zweimal in der Stunde | bestanden — jeder Schritt ist eine eigene Zeile mit eigener Dauer |
| Dieselbe Übung folgt auf sich selbst | bestanden |
| Übung seit dem Start anderswo geändert | bestanden — der Dialog arbeitet auf dem heutigen Stand, überschreibt nichts |
| Tatsächliche Dauer unter einer Minute | bestanden — vorgeschlagen wird 1 |
| Notiz über der Höchstlänge | bestanden |
| Wachhalten endet mitten in der Stunde | nicht prüfbar ohne echtes Gerät |
| Handy in der Tasche, versehentliches „Weiter" | bestanden — „Zurück" nimmt es zurück |
| Abgemeldet beim Öffnen des Live-Modus | bestanden: eine laufende Stunde bleibt bedienbar und wartet auf dem Gerät. **Nicht geprüft:** das Nachreichen nach erneuter Anmeldung |

### Sicherheit

- [x] **Anmeldung:** jede Server-Stelle prüft sie; ohne Anmeldung nimmt der Server keine Durchführung an (sie bleibt auf dem Gerät)
- [x] **Datentrennung in der Datenbank:** fremdes Konto sieht 0 Durchführungen und 0 Schritte, kann nicht speichern, keine Notiz und keine Dauer setzen und keinen Schritt einfügen; Rolle `anon` darf keine der drei Funktionen ausführen (Nachweise aus `/backend`)
- [x] **Welche Übung gemeint ist, sagt der Schritt:** ein manipulierter Aufruf der Nachbereitung kann keine fremde oder andere Übung treffen
- [x] **Eingaben:** Übungsnamen, Beschreibungen, Arbeitsnotizen und die Notiz zur Stunde mit Markup werden als Text gezeigt, nichts wird ausgeführt
- [x] **Rücksprungadresse** (`?zurueck=`): Adressen nach außen (`https://…`, `//…`, `/\…`) werden nicht angenommen
- [x] **Musik-Link:** nur `http(s)` wird zum Verweis, öffnet in neuem Tab mit `noopener`
- [x] **`/live` ohne Anmeldung:** liefert für alle dieselbe Seite ohne Daten; der Offline-Baustein legt keine Daten und keine Zugänge ab und trägt die Sicherheits-Kopfzeilen
- [x] **Keine Geheimnisse** im ausgelieferten Code des Live-Modus
- [ ] **BUG-24:** eine **beendete** Stunde bleibt nach dem Abmelden auf dem Gerät einsehbar
- **Begrenzung der Anfragen:** gibt es an den neuen Server-Stellen nicht — wie im Rest der App. Kein neuer Befund, aber vor der Marktreife mit zu entscheiden

### Gefundene Fehler

#### BUG-23: Der Offline-Baustein wird auf dem Weg aus der App nicht eingerichtet
- **Status:** behoben am 2026-10-11, siehe „Nach der QA behoben"
- **Severity:** High
- **Was der Nutzer erlebt:** Wer über „Stunde starten" in den Live-Modus kommt — also jeder —, hat
  den Bildschirm **nicht** auf dem Gerät. Lädt das Handy die Seite in einer Halle ohne Empfang neu,
  steht dort die Fehlerseite des Browsers. Der Stand der Stunde geht dabei **nicht** verloren; mit
  Netz ist alles wieder da. Es ist genau der Fall, den der Baustein verhindern sollte
- **Steps to Reproduce:**
  1. Eine gespeicherte Einheit öffnen, „Stunde starten", „Los geht's"
  2. Das Netz trennen und die Seite neu laden
  3. Erwartet: derselbe Schritt mit richtiger Restzeit
  4. Tatsächlich: „Keine Internetverbindung"
- **Was dahintersteckt (nachgestellt, nicht vermutet):** nach dem Wechsel aus der App ist der
  Baustein angemeldet und aktiv, aber **die Seite gehört ihm nicht, und seine Ablage ist leer** —
  auch nach zehn Sekunden. Wird `/live` dagegen **vollständig geladen** (Adresse eingeben oder
  einmal mit Netz neu laden), liegen sofort 20 Dateien samt der Seite auf dem Gerät, und das
  Neuladen ohne Netz gelingt. Der Wechsel aus der App lädt die Seite nicht neu; der Baustein
  wartet auf etwas, das dabei nie eintritt
- **Zweiter Teil desselben Fehlers:** das Bereitschaftsbild **sagt es nicht**. Der Zustand bleibt
  „wird eingerichtet"; der vorgesehene Hinweis erscheint nur bei „nicht möglich"
- **Tests:** `der Live-Bildschirm lädt auch ohne Verbindung neu` (erwarteter Fehlschlag) und, als
  Gegenprobe, `nach einem Neuladen mit Netz liegt der Live-Bildschirm auf dem Gerät` (bestanden)
- **Priority:** Fix before deployment

#### BUG-22: Die Notiz „Wie lief's?" geht verloren, wenn „Fertig" das laufende Speichern überholt
- **Status:** behoben am 2026-10-11, siehe „Nach der QA behoben"
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Bei langsamer Verbindung „Stunde beenden" — die Durchführung ist unterwegs zum Server
  2. Einen Satz bei „Wie lief's?" eintragen und „Fertig" tippen, bevor die Antwort da ist
  3. Erwartet: die Notiz steht an der Durchführung
  4. Tatsächlich: die Durchführung ist gespeichert, **ohne Notiz**
- **Was dahintersteckt:** die Notiz wird an die noch wartende Durchführung gehängt — die aber
  schon ohne sie abgeschickt ist. Kommt die Antwort, wird die wartende Durchführung samt Notiz
  weggeräumt. Im Browser mit vier Sekunden Verzögerung nachgestellt, und ohne Browser im Unit-Test
- **Wie oft:** nur bei wirklich langsamer Verbindung; sonst ist das Speichern durch, bevor ein
  Satz getippt ist. Die Notiz lässt sich an der Durchführung nachtragen
- **Tests:** Unit `verliert eine Notiz nicht, die nachgetragen wird …` und Browser `die Notiz geht
  nicht verloren, wenn „Fertig" getippt wird …` (beide erwartete Fehlschläge)
- **Priority:** Fix before deployment

#### BUG-24: Eine beendete Stunde bleibt nach dem Abmelden auf dem Gerät einsehbar
- **Status:** behoben am 2026-10-11, mit einer bewusst gelassenen Ausnahme — siehe „Nach der QA behoben"
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Eine Stunde beenden und die Zusammenfassung **nicht** mit „Fertig" schließen
  2. Abmelden — es kommt keine Nachfrage, die gibt es nur bei *laufender* Stunde
  3. `/live` öffnen, ohne angemeldet zu sein
  4. Erwartet: „Es läuft gerade keine Stunde"
  5. Tatsächlich: die Zusammenfassung mit Name der Einheit, Übungen und Zeiten
- **Einordnung:** betrifft nur ein Gerät, das sich mehrere Leute teilen. Ein *anderes angemeldetes*
  Konto sieht die Stunde nicht (geprüft). Zu sehen sind Namen und Zeiten, keine Zugänge; ändern
  lässt sich ohne Anmeldung nichts. Dasselbe gilt für ein offen gelassenes Bereitschaftsbild und
  für die Warteliste, die im Speicher des Browsers liegen bleibt
- **Abzuwägen beim Beheben:** eine *laufende* Stunde muss ohne Anmeldung bedienbar bleiben
  (Spec) — für eine beendete gibt es diesen Grund nicht
- **Test:** `eine beendete Stunde eines früheren Nutzers ist ohne Anmeldung nicht mehr einsehbar`
  (erwarteter Fehlschlag)
- **Priority:** Fix before deployment

#### BUG-25: „Fertig" ohne Netz führt auf die Fehlerseite des Browsers
- **Status:** behoben am 2026-10-11, siehe „Nach der QA behoben"
- **Severity:** Low
- **Steps to Reproduce:**
  1. Ohne Netz eine Stunde beenden, bei „Wie lief's?" etwas eintragen, „Fertig"
  2. Erwartet: die App sagt, dass die Durchführung nachgereicht wird, und bleibt bedienbar
  3. Tatsächlich: „Keine Internetverbindung" — die Detailseite der Einheit lässt sich nicht laden
- **Es geht nichts verloren:** nachgesehen — die Durchführung wartet samt Notiz auf dem Gerät und
  wird beim nächsten Öffnen der App nachgereicht. Aber so sieht es nicht aus, und es ist der
  Augenblick direkt nach der Stunde in der Halle
- **Test:** `ohne Netz geht „Fertig" trotzdem …` (erwarteter Fehlschlag)
- **Priority:** Fix before deployment — liegt im selben Feld wie BUG-23

#### BUG-26: „Stunde starten" an einer Einheit ohne Schritt ist bedienbar
- **Severity:** Low
- **Befund:** die Spec verlangt „nicht bedienbar, mit Begründung". Gebaut ist: der Knopf lässt
  sich tippen, danach erscheint die Begründung als Meldung
- **Einordnung:** der Fall kann laut Speicherregel nicht entstehen; am Code gelesen
- **Priority:** Nice to have

### Nach der QA behoben (2026-10-11)

Auf Auftrag des Nutzers: **BUG-23 und BUG-25.** Offen bleiben BUG-22, BUG-24 und BUG-26.

**BUG-23 — der Offline-Baustein füllt sich jetzt auch auf dem Weg aus der App.** Drei Änderungen:

- **Die Seite wartet am Baustein selbst, bis er aktiv ist** (`src/hooks/use-live-offline.ts`).
  Vorher wartete sie auf ein Zeichen des Browsers, das nur für Seiten kommt, die *innerhalb* von
  `/live` geladen wurden — aus der App heraus wird die Seite aber nicht neu geladen
- **Der Baustein holt alles selbst** (`public/live-sw.js`): er lädt `/live` frisch und liest aus
  der Seite heraus, welche Bausteine sie braucht. Was die Seite zusätzlich als geladen meldet,
  ist nur noch die zweite Quelle — die Liste des Browsers ist begrenzt und kann nach langer
  Benutzung unvollständig sein. Die Seite wird zuletzt abgelegt: sie liegt erst da, wenn ihre
  Bausteine da sind
- **Das Bereitschaftsbild sagt es, wenn es nicht klappt.** Meldet der Baustein nicht binnen 20
  Sekunden, dass alles abgelegt ist, gilt das als „nicht möglich", und der Hinweis erscheint

**BUG-25 — „Fertig" ohne Netz bleibt in der App.** Vor jedem Verlassen des Live-Modus fragt die
App beim Server nach, ob er erreichbar ist (`src/lib/live/network.ts`, höchstens vier Sekunden).
Dem Gerät allein wird dabei nicht geglaubt: ein Hallen-WLAN ohne Internet gilt dem Browser als
„online". Ist der Server nicht erreichbar, steht „Fertig — die Stunde ist festgehalten" da, mit
dem Satz, dass Durchführung und Notiz auf dem Gerät liegen und nachgereicht werden. Kommt das
Netz zurück, wird von selbst nachgereicht; „Zur Einheit" führt dann weiter.

**Über den Auftrag hinaus, weil es derselbe Fehler war:** „Live-Modus verlassen (läuft weiter)"
im Menü führte ohne Netz ebenfalls auf die Fehlerseite des Browsers. Jetzt bleibt man im
Live-Modus und bekommt eine Meldung; die Stunde läuft weiter. Und ohne laufende Stunde sagt
`/live`, wenn noch eine Durchführung auf dem Gerät wartet.

**Nachgeprüft:** **337 von 337 Browser-Tests grün in einem Zug** (21,4 Minuten, zwei Arbeiter,
ohne Entwicklungsserver), **517 Unit-Tests grün** (5 neue für die Nachfrage beim Server),
Typprüfung, Lint und Produktionsbuild sauber.

- Der Test für BUG-23 geht genau den Weg des Nutzers — „Stunde starten" aus der App, dann Netz
  trennen und neu laden — und besteht an Rechner und in Handybreite; die Markierung als
  erwarteter Fehlschlag ist entfernt
- Der Test für BUG-25 prüft den ganzen Ablauf: ohne Netz „Fertig", die App bleibt stehen,
  „Zur Einheit" führt ohne Netz nirgendwohin und sagt es, mit Netz wird samt Notiz nachgereicht
- Zwei neue Tests: der Hinweis auf dem Bereitschaftsbild, wenn sich der Baustein nicht anmelden
  lässt; und „Live-Modus verlassen" ohne Netz
- Als erwartete Fehlschläge markiert bleiben drei Browser-Tests und ein Unit-Test (BUG-22, BUG-24)

**Was das nicht belegt:**

- **Ein echtes Handy.** Geprüft ist in Edge am Rechner, auch in der Handy-Emulation. Ob Safari auf
  dem iPhone den Baustein genauso anmeldet und befüllt, ist offen
- **Das Zeitlimit von 20 Sekunden** ist nicht eigens ausgelöst worden, nur der Fall „lässt sich
  nicht anmelden"
- **Ein WLAN ohne Internet** ist nur im Unit-Test nachgestellt (die Anfrage scheitert), im
  Browser nur „ganz ohne Netz"
- **Nach einer neuen Auslieferung** holt ein Gerät den neuen Stand erst, wenn das Bereitschaftsbild
  wieder mit Netz geöffnet wird — so ist es gebaut, geprüft ist es nicht

#### Zweiter Durchgang am selben Tag: BUG-22 und BUG-24

Auf Auftrag des Nutzers. Offen bleibt danach nur BUG-26 (niedrig).

**BUG-22 — die Notiz geht nicht mehr verloren.** Nach dem Speichern der Durchführung vergleicht
das Nachreichen (`flushPending` in `src/lib/live/store.ts`), welche Notiz hinausging und welche
inzwischen an der wartenden Durchführung steht. Weicht sie ab, bleibt der Eintrag liegen — als
„gespeichert, Notiz fehlt" — und die Notiz wird eigens nachgetragen; erst dann verschwindet er.
Scheitert das Nachtragen am Netz, versucht es der nächste Anlass wieder, **ohne die Durchführung
ein zweites Mal zu senden**. Lässt es sich endgültig nicht nachtragen (die Durchführung gibt es
nicht mehr), nennt der Hinweis in der Kopfzeile den Grund und bietet „Verwerfen".

Dafür gehen jetzt alle Stellen, die nachreichen, über **einen** Weg (`src/lib/live/sync.ts`): nach
„Stunde beenden", aus dem Hinweis in der Kopfzeile, beim Start einer zweiten Stunde, vor dem
Abmelden. Der Server sagt beim Ändern der Notiz dazu, ob ein Fehlschlag vorübergehend ist.

**BUG-24 — eine beendete Stunde ist ohne Anmeldung nicht mehr einsehbar.** Zwei Änderungen:

- **Abmelden nimmt die Stundenakte immer vom Gerät**, nicht mehr nur bei laufender Stunde. Die
  Warteliste bleibt — was dort liegt, wird noch nachgereicht
- **Wer die Akte sehen darf, steht jetzt an einer Stelle** (`src/lib/live/access.ts`), ohne
  Oberfläche prüfbar: ein anderes angemeldetes Konto nie; ohne Anmeldung eine *laufende* Stunde
  ja (Spec), ein offenes Bereitschaftsbild nein, eine beendete nur in einem Fall. Was nicht
  gezeigt werden darf, wird **vom Gerät genommen**, nicht bloß verborgen

**Die bewusst gelassene Ausnahme:** eine beendete Stunde bleibt ohne Anmeldung stehen, **solange
ihre Durchführung noch auf dem Gerät wartet** und das Ende höchstens zwölf Stunden her ist. Das
ist der Fall „Halle ohne Netz, die Sitzung ist während der Stunde abgelaufen" — ohne die Ausnahme
stünde der Nutzer nach einer langen Stunde vor „Es läuft gerade keine Stunde", ohne seine
Zusammenfassung und ohne „Wie lief's?". Wer das Gerät in dieser Zeit in die Hand nimmt, sieht sie
also weiterhin. Dem Nutzer am 2026-10-11 so vorgelegt; strenger wäre möglich, kostet aber genau
diesen Fall.

**Nachgeprüft:** **339 von 339 Browser-Tests grün in einem Zug** (20,8 Minuten, zwei Arbeiter,
ohne Entwicklungsserver), **529 Unit-Tests grün** (12 neue), Typprüfung, Lint und
Produktionsbuild sauber. **Keine Markierung als erwarteter Fehlschlag mehr** — alle Tests, die
einen Befund nachstellten, müssen jetzt echt bestehen und tun es.

- BUG-22 im Browser: mit vier Sekunden verzögerter Antwort „Fertig" getippt — die Notiz steht
  danach an der Durchführung. Dazu fünf Unit-Tests: nachgetragen; nach Netzausfall beim nächsten
  Mal nachgetragen, ohne zweite Sendung; unveränderte Notiz wie bisher; endgültiger Fehlschlag
  nennt den Grund; die Notiz bleibt auch liegen, wenn niemand sie nachtragen kann
- BUG-24 im Browser, ohne Anmeldung: beendete und gespeicherte Stunde ist weg und liegt nicht
  mehr im Speicher des Browsers; offenes Bereitschaftsbild ist weg; beendete Stunde mit wartender
  Durchführung bleibt. Dazu acht Unit-Tests für die Zugangsregel

**Was das nicht belegt:**

- **Das Abmelden selbst.** Im Browser-Test nicht ausführbar — es beendete die Sitzung aller
  übrigen Tests. Dass es die Akte wegräumt, ist am Code gelesen, nicht gesehen
- **Die Zwölf-Stunden-Grenze** ist nur im Unit-Test geprüft
- **Eine wirklich langsame Verbindung** ist mit einer künstlichen Verzögerung nachgestellt

### Was kein Fehler ist

- **„Application error" während der Tests.** Zwischendurch zeigte jede Seite einen Absturz. Es
  war der Testaufbau: auf Port 3100 lief noch ein Server aus einem früheren Durchgang mit
  veraltetem Build. Mit frischem Server tritt nichts davon auf
- **Ein 404 in der Browser-Konsole auf jeder Seite:** `/favicon.ico` fehlt. Besteht seit PROJ-1,
  hat mit dem Live-Modus nichts zu tun — beim Aufräumen vor der Marktreife mitzunehmen
- **„5 Min voraus" statt 6 nach dem Auslassen eines 6-Minuten-Schritts,** wenn das Auslassen
  selbst eine Sekunde gekostet hat: angezeigt werden ganze Minuten, abgerundet. Passt zu „unter
  einer Minute gilt als im Plan"

### Hinweis zur Testumgebung

- **Der erste Gesamtlauf war in einem Zug nicht grün, der zweite schon.** Drei Editor-Tests von PROJ-7 scheiterten
  am Zeitfenster von 15 Sekunden (der Seitenabzug zeigt die Einheit nach „Speichern" noch als
  Entwurf, ohne Fehlermeldung); einzeln nachgelaufen bestanden beide Titel. Der Lauf brauchte
  33,6 Minuten für 159 Tests, am 2026-10-10 waren es rund 12 für 158. Belegt ist die Langsamkeit,
  nicht ihre Ursache: bekannt sind auf diesem Rechner der Echtzeit-Virenscan (Avast) und zu viele
  gleichzeitige Arbeiter; heute lief außerdem der Entwicklungsserver nebenher, und die Live-Läufe
  starteten mit drei Arbeitern statt mit zwei. **Der zweite Gesamtlauf — zwei Arbeiter, ohne
  Entwicklungsserver — lief in 16,8 Minuten durch: 333 von 333 grün, kein Zeitlimit gerissen.**
  Das spricht dafür, dass es an diesen beiden Dingen lag; getrennt geprüft habe ich sie nicht
- **Vor Browser-Tests den Port prüfen.** `playwright.config.ts` nimmt einen schon laufenden Server
  stillschweigend weiter — auch einen mit veraltetem Build. `netstat` meldet auf diesem Rechner
  „ABHÖREN", nicht „LISTENING"
- **Aufruf:** `PLAYWRIGHT_CHANNEL=msedge PLAYWRIGHT_PORT=3100 npx playwright test --workers=2`.
  Die Live-Tests laufen als eigene Stufe nach dem Editor (Projekte „live" und „live mobil")
- **Erwartete Fehlschläge:** sieben Browser-Tests und ein Unit-Test sind mit `test.fail` bzw.
  `it.fails` markiert und tragen die Nummer ihres Befunds. Sie halten die Suite grün, solange der
  Fehler besteht, und werden rot, sobald er behoben ist — dann gehört die Markierung weg

### Was diese QA nicht abdeckt

- **Echte Geräte.** Ob der Bildschirm an bleibt, wie sich der Stromsparmodus verhält, ob der Ton
  kommt und das Handy vibriert: nichts davon lässt sich hier belegen. Dazu ein echtes iPhone und
  ein echtes Android-Gerät — und dabei die Texte der Anleitung gegenlesen
- **Firefox und Safari**
- **Die Bilder der Übungen:** die Ablage auf dem Gerät und das Blättern sind ungeprüft — die
  Testübungen haben keine Bilder
- **Zwei gleichzeitige Sendungen** derselben Durchführung
- **Das Abmelden bei laufender Stunde** über die Nachfrage hinaus

### Zusammenfassung

- **Akzeptanzkriterien:** 105 von 114 bestanden, **0 durchgefallen**; 5 nicht prüfbar ohne echtes
  Gerät, 1 halb, 1 nicht eigens geprüft, 2 entfallen
- **Fehler:** 5 (0 kritisch, **1 hoch**, 2 mittel, 2 niedrig)
- **Sicherheit:** ein Befund (BUG-24, mittel); der Zugriffsschutz der Datenbank hält
- **Regression:** keine — der Gesamtlauf ist mit 333 von 333 grün
- **Production Ready:** **NEIN**
- **Empfehlung:** BUG-23 beheben, BUG-25 im selben Zug; BUG-22 und BUG-24 vor der Auslieferung.
  Danach `/qa` erneut

## Deployment
_To be added by /deploy_
