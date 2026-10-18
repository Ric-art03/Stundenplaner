# PROJ-4: Starter-Datenbank (Übungsdatenbank zum Übernehmen)

## Status: Planned
**Created:** 2026-09-28
**Last Updated:** 2026-10-17

## Worum es geht

Ein neues Konto hat keine einzige Übung — und der Generator schöpft nur aus den eigenen Übungen.
Bis heute muss ein Ehrenamtlicher also erst zwanzig, dreißig Übungen von Hand erfassen, bevor die
App ihm überhaupt etwas abnimmt. Genau dort springt er ab.

PROJ-4 gibt jedem Nutzer einen **gemeinsamen, kuratierten Bestand von 50–100 Übungen**, aus dem er
übernimmt, was er braucht: einzeln oder gesammelt, am schnellsten über „passt zu meiner Gruppe". Eine
übernommene Übung gehört danach ihm wie eine selbst angelegte — er kann sie ändern, der Generator
plant sie ein, spätere Änderungen am Bestand erreichen sie nicht.

Der Bestand heißt in der App **„Übungsdatenbank"** und ist ein Reiter auf der Seite „Übungen",
neben **„Meine Übungen"** (dem bisherigen eigenen Ordner). Langfristig ist die Übungsdatenbank die
Sammlung aller öffentlichen Übungen — mit PROJ-12 auch der von Nutzern geteilten. In PROJ-4 enthält
sie nur den kuratierten Starterbestand.

Der Bestand ist **breit und sportartübergreifend**: das, was viele Breitensportgruppen brauchen
(Kinderturnen und -spiele, Allgemeinsport, Fitness, Senioren, Aufwärmen und Cool-Down für alle),
kaum Sporttechnik. Er soll vor dem Launch um weitere Sportarten erweiterbar sein und wird vom
Entwickler gepflegt — ohne Verwaltungsbildschirm in der App.

## Reihenfolge der Arbeit

PROJ-4 beginnt nicht mit dem Bau, sondern mit zwei Vorarbeiten. Die Reihenfolge ist vom Nutzer
festgelegt:

1. **PROJ-19 — Grundstock der Kategorien** spezifizieren und bauen: welche vordefinierten Begriffe
   (vor allem Sportarten) es gibt und in welcher Reihenfolge sie **überall gleich** erscheinen.
   Jede Starter-Übung trägt nur vordefinierte Begriffe — deshalb muss der Grundstock vorher stehen
2. **Rohmasse sichern:** die 39 Testübungen aus dem Konto des Nutzers als erster Block in die
   Tabellenform aus Abschnitt G bringen — bereinigt um Testspuren (Sportart „Capoeirax", Phasen
   „testphase 1/2", Dauer 1 Minute bei „Armada Tritttechnik")
3. **Konto leeren** (einmalige Aufgabe, kein Teil des Features): im Konto des Nutzers wird alles
   gelöscht außer der Anmeldung — Übungen samt Bildern, Varianten und Material, Einheiten,
   Durchführungen, eigene Kategorien, Stundenmuster, Hallen und Gruppen. Danach ist das Konto so,
   wie es ein neuer Nutzer bekommt. Erst nach Schritt 2 und nur mit ausdrücklicher Zustimmung des
   Nutzers; danach nachgeprüft, dass nichts zurückgeblieben ist
4. **PROJ-4 bauen** (Abschnitte A–E)
5. **Bestand blockweise befüllen** (Abschnitte F–H), jeder Block mit Abnahme durch den Nutzer

Stand 2026-10-17: Im Konto stehen 45 Übungen (39 davon Testdaten), 25 Einheiten — alle mit
Testübungen — und 8 Durchführungen.

**Schritt 1 erledigt** (PROJ-19 am 2026-10-18 ausgeliefert). **Schritt 3 erledigt am 2026-10-18**,
auf ausdrücklichen Wunsch des Nutzers. **Schritt 2 nur zur Hälfte:** gesichert ist das **ganze
Konto im Rohzustand**, die bereinigte Tabelle (der erste Block) steht noch aus, weil ihr Format
erst beim ersten Block entschieden wird (offene Frage unten). Die Sicherung enthält alles, was
dafür nötig ist.

- **Sicherung:** `Appentwicklung -  STUNDENPLANER APP\Sicherung Konto 2026-10-18\` auf dem
  Desktop, **außerhalb des Projektordners** — das GitHub-Repository ist öffentlich lesbar, die
  Übungstexte gehören nicht hinein. Darin `konto-sicherung.json` (alle Tabellen des Kontos,
  lesbar nachgeprüft) und `bilder\` (7 Bilder, 7,8 MB, Größen Byte für Byte gegen den Speicher
  geprüft)
- **Gelöscht:** 46 Übungen (mit 11 Varianten, 38 Materialzeilen), 7 Bilder, 25 Einheiten (mit 81
  Segmenten, 147 Einträgen, 8 Durchführungen mit 48 Schritten, 143 Verwendungsnachweisen),
  2 Gruppen (3 Stundenzeiten), 7 Hallen (26 Materialzeilen), 5 eigene Kategorien, 4 Stundenmuster.
  Es waren 46 Übungen statt 45 — die Zahl der Testübungen darunter ist beim Bereinigen neu
  festzustellen
- **Geblieben:** Anmeldung und Profil
- **Nachgeprüft:** in allen Tabellen nichts mehr am Konto, keine verwaisten Zeilen in den
  abhängigen Tabellen, kein Bild im Speicher

## Dependencies
- Requires: PROJ-3 (Übungsdatenbank) — eine übernommene Übung ist eine normale eigene Übung; Liste, Filter, Detailansicht und Übungszeile werden wiederverwendet
- Requires: PROJ-5 (Gruppenprofile) — für „passt zu Gruppe" und das Angebot nach dem Anlegen einer Gruppe
- Requires: PROJ-19 (Grundstock der Kategorien) — die Begriffe, die der Bestand trägt
- Berührt: PROJ-6 (Einheiten-Generator) und PROJ-7 (Einheiten-Editor) — Leerzustand und Texte, die heute „deine Übungsdatenbank" sagen
- Berührt: PROJ-16 (Verwaltung) — „passt zu Gruppe" rechnet über dieselbe Materialprüfung wie der Generator

## User Stories
1. Als **neuer Übungsleiter** möchte ich nach dem Anlegen meiner ersten Gruppe mit wenigen Klicks passende Übungen bekommen, damit der Generator mir sofort eine Einheit vorschlagen kann, statt dass ich erst alles selbst erfasse.
2. Als **Übungsleiter mehrerer Gruppen** möchte ich die Übungsdatenbank nach Sportart, Altersgruppe und Phase durchsehen, damit ich gezielt neue Ideen für eine bestimmte Gruppe finde.
3. Als **Übungsleiter** möchte ich eine Übung vor dem Übernehmen vollständig ansehen können — Ablauf, Material, Varianten —, damit ich nur übernehme, was zu meiner Halle und meinen Leuten passt.
4. Als **Übungsleiter** möchte ich eine übernommene Übung frei verändern können, ohne dass sie mir später überschrieben wird, damit sie wirklich meine wird.
5. Als **Übungsleiter** möchte ich sehen, welche Übungen ich schon übernommen habe, damit ich nichts doppelt hole und später schnell erkenne, was neu dazugekommen ist.
6. Als **Übungsleiter** möchte ich erfahren, *warum* eine Übung nicht zu meiner Gruppe passt (fehlendes Material, Teilnehmerzahl), damit ich bewusst entscheiden kann, ob ich sie trotzdem nehme.
7. Als **Entwickler und Kurator des Bestands** möchte ich neue Übungen blockweise in einer Tabelle bearbeiten und vor der Freigabe in der App sehen, damit der Bestand ohne eigenen Verwaltungsbildschirm schnell und sauber wächst.

## Out of Scope
- **Verwaltungsbildschirm oder Admin-Rolle für den Bestand** — der Entwickler pflegt ihn außerhalb der App (Abschnitt G)
- **Nachziehen von Änderungen in übernommene Kopien** — weder automatisch noch als Hinweis „neuere Fassung"; die Kopie ist unabhängig
- **Feste Pakete** („Paket Kinderturnen 4–6") — ersetzt durch „passt zu Gruppe" mit Auswahl
- **Von Nutzern geteilte Übungen** in der Übungsdatenbank — PROJ-12. PROJ-4 legt nur den Reiter und den Namen so an, dass PROJ-12 dort einziehen kann
- **Bilder und Skizzen** im Starterbestand — aus Urheberrechtsgründen (Abschnitt H) und weil Bilder pro Nutzer geschützt abgelegt sind; eigene Zeichnungen sind ein späteres Thema
- **Musik-Links** im Starterbestand — „Musik benötigt" darf gesetzt sein, ein Link nicht (Lizenz- und Verfallsfragen)
- **Bewertungen, Beliebtheit, „Wird oft übernommen"** — kein MVP-Bedarf
- **Übungsdatenbank ohne Anmeldung**, etwa als Vorschau auf der Landingpage — siehe Open Questions
- **Überarbeitung der vordefinierten Kategorien und ihrer Reihenfolge** — PROJ-19
- **Das Leeren des Nutzerkontos** — einmalige Vorarbeit, kein Verhalten der App (siehe „Reihenfolge der Arbeit")
- **Mitgelieferte Stundenmuster** — in PROJ-16 als möglicher Teil von PROJ-4 vorgemerkt, hier bewusst nicht aufgenommen
- **Automatisches Kopieren beim Registrieren** — verworfen, siehe Decision Log
- **Duplikat-Erkennung** über ähnliche Namen hinaus — wie in PROJ-3

---

## A. Seite „Übungen" mit zwei Reitern und neue Namen

Die Seite `/exercises` heißt **„Übungen"** und hat zwei Reiter: **„Meine Übungen"** (alles, was es
dort heute gibt, unverändert) und **„Übungsdatenbank"** (der Bestand). Der Begriff
„Übungsdatenbank" meint künftig **nur noch** die öffentliche Sammlung; überall, wo er heute den
eigenen Ordner meint, wird er ersetzt.

Bestandsaufnahme vom 2026-10-17 — **zu ändern** (Text, den der Nutzer sieht):

| Stelle | heute | künftig |
|---|---|---|
| Seitenkopf `/exercises` | „Übungsdatenbank" | „Übungen", darunter die beiden Reiter |
| Startseite, Karte | „Übungsdatenbank" | „Übungen" |
| Generator, Einleitung | „… aus deiner Übungsdatenbank zusammen." | „… aus deinen Übungen zusammen." |
| Generator, Leerzustand | „… aus deiner eigenen Übungsdatenbank … Starter-Datenbank … ist in Vorbereitung." | Verweis auf die Übungsdatenbank (Abschnitt E) |
| Auswahldialog im Editor | „… schöpfen aus deiner eigenen Übungsdatenbank." | „… schöpfen aus deinen Übungen." |
| Nachfrage beim Verwerfen (2 Sätze) | „… bleibt/bleiben in deiner Übungsdatenbank." | „… bleibt/bleiben in ‚Meine Übungen'." |
| Nachfrage beim Verlassen (2 Sätze) | „… bleibt/bleiben in deiner Übungsdatenbank, auch wenn du verwirfst." | „… in ‚Meine Übungen', auch wenn du verwirfst." |
| Platzhalter an der Einheit | „Diese Übung wurde aus deiner Datenbank entfernt." | „… aus deinen Übungen gelöscht." |
| Leerzustand „Meine Übungen" | nur „Erste Übung anlegen" | zusätzlich Verweis auf die Übungsdatenbank (Abschnitt E) |
| Browser-Test PROJ-7 (prüft „bleibt in deiner Übungsdatenbank") | — | zieht mit |

**Bleibt:** der Menüpunkt „Übungen" in der Kopfzeile, alle Adressen unter `/exercises/…`, der
Featurename von PROJ-3 in INDEX und PRD (an die ID gebunden), „Übungsordner" in Code-Kommentaren und
die Namen der Browser-Tests — beides sieht kein Nutzer. Kein Browser-Test prüft die Überschrift
„Übungsdatenbank".

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer öffnet „Übungen" im Menü, wenn die Seite lädt, dann heißt sie „Übungen", der Reiter „Meine Übungen" ist gewählt und zeigt die eigene Übersicht wie bisher
- [ ] Angenommen der Nutzer ist auf „Übungen", wenn er den Reiter „Übungsdatenbank" wählt, dann sieht er den Bestand, und die Adresse merkt sich den Reiter (Neuladen und Zurück führen in denselben Reiter)
- [ ] Angenommen der Nutzer ist im Reiter „Übungsdatenbank", wenn er eine Übung öffnet und mit „Zurück" zurückkehrt, dann steht er wieder in der Übungsdatenbank mit denselben Filtern
- [ ] Angenommen die Startseite, wenn der Nutzer sie öffnet, dann heißt die Karte „Übungen"
- [ ] Angenommen eine der Stellen aus der Tabelle oben, wenn der Nutzer sie sieht, dann steht dort der neue Text und nirgends mehr „deine Übungsdatenbank" oder „deine Datenbank" für den eigenen Bestand
- [ ] Angenommen der Nutzer ist am Handy (375 px), wenn er die Seite „Übungen" öffnet, dann passen beide Reiter nebeneinander, ohne dass die Seite waagerecht scrollt

## B. Die Übungsdatenbank durchsehen

Der Reiter zeigt den Bestand **so wie „Meine Übungen"**: dieselbe Listen- und Kartenansicht,
dieselbe Übungszeile (Material · Organisationsform · Varianten), dieselben Filter (Suche, Sportart,
Altersgruppe, Phase, Schwierigkeit, Material) und Sortierungen, dazu die Sortierung **„Zuletzt
hinzugefügt"** — damit wiederkehrende Nutzer sehen, was neu ist. Eine Übung öffnet sich in einer
**Leseansicht**, die aufgebaut ist wie die eigene Detailseite, aber ohne Bearbeiten und Löschen.

### Akzeptanzkriterien
- [ ] Angenommen der Bestand enthält freigegebene Übungen, wenn der Nutzer den Reiter öffnet, dann sieht er alle freigegebenen Übungen mit ihrer Anzahl („68 Übungen")
- [ ] Angenommen der Nutzer setzt Filter oder sucht, wenn die Liste sich aktualisiert, dann zeigt sie nur passende Übungen und die Anzahl der Treffer
- [ ] Angenommen der Nutzer wählt „Zuletzt hinzugefügt", wenn die Liste sortiert wird, dann stehen die zuletzt freigegebenen Übungen oben
- [ ] Angenommen der Nutzer öffnet eine Übung aus der Übungsdatenbank, wenn die Leseansicht lädt, dann sieht er Beschreibung, Anmerkungen, alle Metadaten, Material, Varianten (mit ihren abweichenden Bedingungen) und Links — und keinen Knopf zum Bearbeiten oder Löschen
- [ ] Angenommen eine Übung trägt eine Quellenangabe (Abschnitt H), wenn der Nutzer die Leseansicht öffnet, dann ist die Quelle sichtbar
- [ ] Angenommen ein Filter ergibt keine Treffer, wenn die Liste leer ist, dann nennt die App, woran es liegt (z. B. „Für Volleyball gibt es in der Übungsdatenbank noch keine Übungen"), statt nur „keine Treffer" zu sagen
- [ ] Angenommen der Nutzer ist nicht angemeldet, wenn er die Übungsdatenbank oder eine ihrer Übungen aufruft, dann wird er wie bei allen geschützten Seiten zur Anmeldung geleitet

## C. Einzeln übernehmen

An jeder Übung — in der Liste und in der Leseansicht — steht **„Übernehmen"**. Übernehmen legt in
„Meine Übungen" eine **vollständige, unabhängige Kopie** an: alle Felder, Material, Varianten mit
ihren abweichenden Bedingungen, Links (samt Quellenangabe). Die Arbeitsnotiz bleibt leer, sie gehört
dem Nutzer. Die Kopie ist danach in nichts von einer selbst angelegten Übung zu unterscheiden — außer
einem Vermerk auf ihrer Detailseite: „Aus der Übungsdatenbank übernommen am …".

Eine bereits übernommene Übung trägt in der Übungsdatenbank den Vermerk **„Übernommen"** und statt
„Übernehmen" den Link **„In Meine Übungen öffnen"**. Löscht der Nutzer seine Kopie, verschwindet der
Vermerk, und die Übung lässt sich wieder übernehmen.

### Akzeptanzkriterien
- [ ] Angenommen eine Übung ist noch nicht übernommen, wenn der Nutzer „Übernehmen" klickt, dann steht sie in „Meine Übungen" mit allen Feldern, Material, Varianten und Links, und eine Meldung bestätigt es mit einem Link zur Kopie
- [ ] Angenommen eine Übung wurde übernommen, wenn der Nutzer sie in „Meine Übungen" öffnet, dann steht dort „Aus der Übungsdatenbank übernommen am …", und Bearbeiten und Löschen funktionieren wie bei jeder eigenen Übung
- [ ] Angenommen eine Übung wurde übernommen, wenn der Nutzer anschließend eine Einheit generiert, dann kann der Generator sie einplanen wie jede eigene Übung (inklusive ihrer Varianten)
- [ ] Angenommen der Nutzer hat eine übernommene Übung verändert, wenn der Entwickler die Starter-Übung später korrigiert, dann bleibt die Kopie des Nutzers unverändert
- [ ] Angenommen eine Übung ist übernommen, wenn der Nutzer sie in der Übungsdatenbank sieht, dann trägt sie „Übernommen" und den Link „In Meine Übungen öffnen", aber keinen Knopf „Übernehmen"
- [ ] Angenommen der Nutzer hat seine Kopie gelöscht, wenn er die Übung in der Übungsdatenbank wieder sieht, dann ist der Vermerk weg und „Übernehmen" wieder da
- [ ] Angenommen der Nutzer hat schon eine selbst angelegte Übung mit demselben Namen, wenn er übernimmt, dann wird übernommen, und die Meldung weist darauf hin, dass es jetzt zwei Übungen dieses Namens gibt
- [ ] Angenommen die Starter-Übung trägt nur vordefinierte Begriffe, wenn sie übernommen wird, dann entsteht keine eigene Kategorie beim Nutzer
- [ ] Angenommen das Übernehmen schlägt fehl (Verbindung, Server), wenn die Antwort kommt, dann sagt eine Meldung, dass nichts übernommen wurde, und es bleibt keine halbe Kopie zurück

## D. Gesammelt übernehmen und „passt zu Gruppe"

In der Übungsdatenbank lassen sich **mehrere Übungen auswählen** (Ankästchen) und mit einem Knopf
übernehmen. Der schnellste Weg dahin ist der Filter **„Passt zu Gruppe"**: der Nutzer wählt eine
seiner Gruppen, die Liste zeigt nur Übungen, deren Sportart **und** Altersgruppe zu der Gruppe passen
(nach denselben Regeln wie der Generator), und **alles, was der Generator für diese Gruppe sofort
einplanen würde, ist vorausgewählt**.

Übungen, die zu Sportart und Alter passen, aber an **Material** (Halle hat es nicht oder zu wenig)
oder **Teilnehmerzahl** scheitern, erscheinen trotzdem — **nicht vorausgewählt**, mit dem Grund in
einem Satz („Halle Sporthalle Nord hat keinen Bock", „bis 12 Teilnehmer, die Gruppe hat 25"). Wer das
Material bald anschafft, nimmt sie bewusst mit. Eine Übung, deren Grundform scheitert, deren
Variante aber passt, gilt als passend und sagt es („passt mit der Variante …") — wie im Generator
ist jede Variante eine vollwertige Übung. Bereits übernommene Übungen stehen mit „Übernommen" in der
Liste, sind aber nicht auswählbar.

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer ist in der Übungsdatenbank, wenn er Übungen ankreuzt, dann zeigt eine Leiste die Anzahl („7 ausgewählt") mit „Übernehmen" und „Auswahl aufheben"
- [ ] Angenommen der Nutzer hat mehrere Übungen ausgewählt, wenn er „Übernehmen" klickt, dann werden alle übernommen, und eine Meldung nennt die Anzahl mit einem Link zu „Meine Übungen"
- [ ] Angenommen das gesammelte Übernehmen schlägt mittendrin fehl, wenn die Antwort kommt, dann ist **keine** der Übungen übernommen, die Auswahl bleibt bestehen, und die Meldung sagt es
- [ ] Angenommen der Nutzer hat Gruppen, wenn er „Passt zu Gruppe" öffnet, dann kann er eine seiner Gruppen wählen
- [ ] Angenommen der Nutzer wählt eine Gruppe, wenn die Liste lädt, dann zeigt sie nur Übungen, deren Sportart und Altersgruppe zur Gruppe passen, und alle davon, die der Generator für diese Gruppe einplanen würde, sind vorausgewählt
- [ ] Angenommen eine passende Übung braucht Material, das die Halle der Gruppe nicht oder nicht in der nötigen Menge hat, wenn sie in der Liste steht, dann ist sie nicht vorausgewählt und nennt das fehlende Material und die Halle
- [ ] Angenommen eine passende Übung passt nicht zur Teilnehmerzahl der Gruppe, wenn sie in der Liste steht, dann ist sie nicht vorausgewählt und nennt ihre Grenze und die Zahl der Gruppe
- [ ] Angenommen eine Übung scheitert in der Grundform, aber eine ihrer Varianten passt, wenn sie in der Liste steht, dann ist sie vorausgewählt und sagt, mit welcher Variante sie passt
- [ ] Angenommen eine Übung scheitert an mehreren Gründen, wenn sie in der Liste steht, dann nennt sie alle, nicht nur den ersten
- [ ] Angenommen die Gruppe hat keine Halle, wenn die Liste lädt, dann sagt ein Hinweis oben, dass ohne Halle kein Material geprüft wird — wie im Generator
- [ ] Angenommen der Nutzer wählt einzelne vorausgewählte Übungen ab oder nicht vorausgewählte an, wenn er übernimmt, dann wird genau seine Auswahl übernommen
- [ ] Angenommen der Nutzer hat noch keine Gruppe, wenn er „Passt zu Gruppe" öffnet, dann erklärt die App, dass es dafür eine Gruppe braucht, mit einem Link „Gruppe anlegen"
- [ ] Angenommen zu einer Gruppe passt keine Übung, wenn die Liste leer bleibt, dann nennt die App jeden Grund, der beiträgt (Sportart nicht im Bestand, Altersgruppe nicht im Bestand, beides), statt nur „nichts gefunden"
- [ ] Angenommen alle passenden Übungen sind schon übernommen, wenn die Liste lädt, dann sagt die App das ausdrücklich („Alles Passende hast du schon übernommen")
- [ ] Angenommen der Nutzer ist am Handy (375 px), wenn er Übungen auswählt, dann bleibt die Leiste mit Anzahl und „Übernehmen" erreichbar, ohne dass die Seite waagerecht scrollt

## E. Einstiege

Die Übungsdatenbank ist dort angeboten, wo der Nutzer sie braucht.

### Akzeptanzkriterien
- [ ] Angenommen der Nutzer hat keine eigene Übung, wenn er „Meine Übungen" öffnet, dann bietet der Leerzustand neben „Erste Übung anlegen" auch „Aus der Übungsdatenbank übernehmen" an
- [ ] Angenommen der Nutzer hat keine eigene Übung, wenn er den Generator öffnet, dann erklärt der Leerzustand, dass der Generator aus den eigenen Übungen schöpft, und führt mit einem Knopf in die Übungsdatenbank — der Satz „ist in Vorbereitung" ist weg
- [ ] Angenommen der Nutzer hat eine Gruppe, wenn er aus dem Leerzustand des Generators in die Übungsdatenbank wechselt, dann ist „Passt zu Gruppe" mit der dort gewählten (oder seiner einzigen) Gruppe schon gesetzt
- [ ] Angenommen der Nutzer legt eine **neue** Gruppe an und in der Übungsdatenbank passen Übungen zu ihr, die er noch nicht hat, wenn er sie speichert, dann bietet die App an: „Zu dieser Gruppe passen 23 Übungen aus der Übungsdatenbank — ansehen", und der Link öffnet die Übungsdatenbank mit „Passt zu Gruppe" auf diese Gruppe
- [ ] Angenommen zu der neuen Gruppe passt nichts oder alles Passende ist schon übernommen, wenn er sie speichert, dann erscheint kein Angebot
- [ ] Angenommen der Nutzer bearbeitet eine bestehende Gruppe, wenn er speichert, dann erscheint kein Angebot

## F. Der Bestand

Der Bestand wird vom Entwickler mit Claude erarbeitet (Abschnitt G) und erfüllt für **jede** Übung
einen Mindeststandard. Zum Launch umfasst er 50–100 Übungen; danach kann er wachsen.

**Mindeststandard je Übung:**
- Beschreibung mit **Aufbau** (was steht wo) und **Ablauf** (was die Teilnehmer tun), in eigenen Worten
- **Sicherheitshinweis**, wo die Übung Sturz-, Zusammenstoß- oder Überlastungsgefahr hat
- Im Hauptteil mindestens **eine leichtere und eine schwerere Variante**, wo das sinnvoll ist
- **Nur vordefinierte Begriffe** aus dem Grundstock (PROJ-19) — keine eigenen Kategorien
- Realistische **Dauer** und **Teilnehmerzahl**; Material mit Menge und Modus
- Keine Bilder, keine Musik-Links (Out of Scope); keine Arbeitsnotiz

**Abdeckung zum Launch** (die genauen Begriffe kommen aus PROJ-19): je **Bereich** mindestens
**3 Übungen fürs Aufwärmen, 5 für den Hauptteil, 3 fürs Cool-Down** — genug, dass der Generator für
eine 60-Minuten-Gruppe eine Einheit füllt und über mehrere Wochen abwechseln kann. Vorgesehene
Bereiche: Vorschulkinder (2–6), Kinder (7–10), Jugend (11–17), Erwachsene (18–60), Senioren (60+).
Weitere Sportarten und Bereiche kann der Nutzer vor dem Launch hinzunehmen.

### Akzeptanzkriterien
- [ ] Angenommen ein Block soll freigegeben werden, wenn er geprüft wird, dann trägt jede Übung nur Begriffe aus dem Grundstock, und jede Abweichung ist vor der Freigabe gemeldet und behoben
- [ ] Angenommen der Bestand zum Launch, wenn er nach Bereich und Phase gezählt wird, dann hat jeder vorgesehene Bereich mindestens 3 Aufwärm-, 5 Hauptteil- und 3 Cool-Down-Übungen
- [ ] Angenommen eine 60-Minuten-Gruppe eines vorgesehenen Bereichs mit üblicher Hallenausstattung, wenn der Nutzer alles Passende übernimmt und eine Einheit generiert, dann entsteht eine Einheit ohne offene Lücke
- [ ] Angenommen eine Übung im Hauptteil, wenn sie im Bestand steht, dann hat sie eine leichtere und eine schwerere Variante — oder die Tabelle vermerkt, warum nicht

## G. Pflege des Bestands (Entwickler-Ablauf)

Der Bestand hat **keinen Verwaltungsbildschirm**. Er wird so gepflegt:

1. Der Nutzer zeigt Quellen (Webseiten, PDFs, eigene Notizen) zu einer Sportart oder einem Bereich
   und sagt, was und wie daraus übernommen werden soll
2. Claude erstellt daraus einen **Block** als **Tabelle**: eine Zeile je Übung, verschachtelte
   Angaben in kurzer Schreibweise (z. B. Material `Ball 1 je TN; Hütchen 12`, Varianten mit Titel,
   Beschreibung und Abweichungen)
3. Der Nutzer bearbeitet den Block in der Tabelle — umschreiben, streichen, ergänzen, Lücken füllen
4. Beim Einlesen wird jede Zeile gegen die erlaubten Begriffe und Grenzen geprüft (Längen, Dauer,
   Teilnehmerzahl, Modus); **jeder** Fehler wird mit Zeile und Feld gemeldet, nichts wird still
   korrigiert
5. Der eingelesene Block steht als **Entwurf** im Reiter „Übungsdatenbank" — **nur für den
   Entwickler sichtbar** und als Entwurf gekennzeichnet. Der Nutzer sieht ihn dort so, wie andere ihn
   sehen werden, und kann „passt zu Gruppe" damit ausprobieren
6. Erst die **Freigabe** macht den Block für alle Nutzer sichtbar

Korrekturen an bereits freigegebenen Übungen laufen genauso (Tabelle → Prüfung → Freigabe); sie
erreichen übernommene Kopien nicht. Eine Übung lässt sich aus dem Bestand **zurückziehen** — sie
verschwindet aus der Übungsdatenbank, Kopien bei Nutzern bleiben.

### Akzeptanzkriterien
- [ ] Angenommen ein Block in der Tabelle mit einem Fehler (unbekannte Sportart, Dauer 0, Modus falsch geschrieben), wenn er eingelesen wird, dann wird nichts eingelesen und jeder Fehler mit Zeile und Feld genannt
- [ ] Angenommen ein fehlerfreier Block wird eingelesen, wenn ein normaler Nutzer die Übungsdatenbank öffnet, dann sieht er die Übungen des Blocks **nicht**
- [ ] Angenommen ein Block ist eingelesen, aber nicht freigegeben, wenn der Entwickler die Übungsdatenbank öffnet, dann sieht er dessen Übungen mit dem Vermerk „Entwurf" und kann „passt zu Gruppe" damit ausprobieren
- [ ] Angenommen ein Block wird freigegeben, wenn ein normaler Nutzer die Übungsdatenbank danach öffnet, dann sieht er die Übungen des Blocks, und „Zuletzt hinzugefügt" stellt sie nach oben
- [ ] Angenommen eine freigegebene Übung wird korrigiert und neu freigegeben, wenn ein Nutzer sie vorher übernommen hatte, dann bleibt seine Kopie unverändert, und der Vermerk „Übernommen" bleibt bestehen
- [ ] Angenommen eine Übung wird aus dem Bestand zurückgezogen, wenn ein Nutzer die Übungsdatenbank öffnet, dann ist sie weg; seine Kopie in „Meine Übungen" bleibt

## H. Urheberrecht

Übungen werden aus fremden Quellen **gewonnen, nicht übernommen**. Feste Regeln für jeden Block
(Einschätzung, keine Rechtsberatung — eine rechtliche Durchsicht steht in der Pre-Launch-Checkliste):

- **Frei** sind Spielidee und Übungsprinzip; **geschützt** sind die konkrete Formulierung, Bilder und
  Grafiken sowie eine Sammlung als Ganzes (Recht des Datenbankherstellers)
- Jede Beschreibung **in eigenen Worten** — kein Abschreiben, auch nicht leicht umgestellt
- **Mehrere Quellen mischen** statt eine einzelne Sammlung in großen Teilen abzugrasen
- **Keine Bilder, Skizzen oder Grafiken** aus Quellen
- **Keine geschützten Kurs-, Programm- oder Markennamen** als Übungsnamen
- Quellen mit **ausdrücklichem Nutzungsverbot** (z. B. kostenpflichtige Verlags-PDFs) werden nicht verwendet
- Quellen unter **freier Lizenz mit Namensnennung** (z. B. CC BY) nur mit Quellenangabe an der Übung
- Die Tabelle hält je Übung fest, **woraus** sie gewonnen wurde — als Nachweis, auch wenn die Quelle nicht angezeigt wird

### Akzeptanzkriterien
- [ ] Angenommen ein Block soll freigegeben werden, wenn er geprüft wird, dann ist für jede Übung die Herkunft in der Tabelle vermerkt
- [ ] Angenommen eine Übung stammt aus einer Quelle mit Namensnennungspflicht, wenn sie im Bestand steht, dann trägt sie die Quellenangabe, und die Angabe geht beim Übernehmen mit
- [ ] Angenommen ein Block stützt sich auf eine einzelne Quelle, wenn er geprüft wird, dann ist vermerkt, dass nur ein kleiner Teil dieser Quelle verwendet wurde
- [ ] Angenommen ein Block, wenn er freigegeben wird, dann enthält er keine Bilder und keine wörtlich übernommenen Textpassagen

---

## Edge Cases

1. **Doppelt übernehmen in zwei Tabs:** Der Nutzer klickt in zwei Tabs gleichzeitig „Übernehmen" auf dieselbe Übung. Es entsteht nur eine Kopie; der zweite Tab sagt „Schon übernommen" und verweist auf die Kopie
2. **Übung zurückgezogen, während sie angesehen wird:** Der Nutzer hat die Leseansicht offen, die Übung wird zurückgezogen, er klickt „Übernehmen". Die App sagt, dass es die Übung in der Übungsdatenbank nicht mehr gibt; nichts wird angelegt
3. **Gesammelt übernehmen mit einer inzwischen zurückgezogenen Übung:** Ganz oder gar nicht — die Meldung nennt die betroffene Übung, die übrige Auswahl bleibt stehen und lässt sich erneut übernehmen
4. **Kopie bearbeitet, Starter-Übung korrigiert:** Die Kopie bleibt unverändert, „Übernommen" bleibt stehen. Dass es eine neuere Fassung gibt, wird bewusst nicht angezeigt
5. **Kopie gelöscht, während Einheiten an ihr hängen:** Verhält sich wie jede gelöschte eigene Übung (Platzhalter in der Einheit, PROJ-3). Neu übernehmen legt eine **neue** Kopie an; die alten Einheiten werden nicht wieder verbunden
6. **Gruppe ändert sich, während „Passt zu Gruppe" offen ist** (z. B. in einem anderen Tab Halle oder Teilnehmerzahl geändert): Die Vorauswahl gilt für den Stand beim Laden. Erst ein Neuladen oder erneutes Wählen der Gruppe rechnet neu — kein stilles Umspringen der Auswahl
7. **Gruppe mit eigenen Sportarten oder Altersgruppen:** Eigene Begriffe passen zu keiner Starter-Übung. Trägt die Gruppe ausschließlich eigene Begriffe, nennt die App genau das als Grund der leeren Liste
8. **Gruppe mit Halle ohne Material:** Alles, was Material braucht, ist nicht vorausgewählt und nennt den Grund; Übungen ohne Material sind vorausgewählt
9. **Material „pro Teilnehmer" bei Gruppe ohne Teilnehmerzahl:** Wie im Generator — nicht prüfbar; die Übung gilt als passend, und der Hinweis oben sagt, dass die Teilnehmerzahl fehlt
10. **Sehr viele Übungen auf einmal:** Alle 100 auswählen und übernehmen funktioniert ohne Grenze und bleibt ganz oder gar nicht
11. **Leerer Bestand** (vor der ersten Freigabe): Der Reiter sagt, dass die Übungsdatenbank gerade aufgebaut wird; die Einstiege aus Abschnitt E werden nicht angeboten
12. **Name zu lang nach Korrektur im Bestand** u. ä.: Wird beim Einlesen abgewiesen (Abschnitt G), erreicht also nie einen Nutzer
13. **Entwickler-Entwürfe und normale Konten:** Ein normaler Nutzer kann einen Entwurf weder sehen noch über eine erratene Adresse öffnen oder übernehmen

## Technical Requirements
- **Sicherheit:** Der Bestand ist für alle angemeldeten Nutzer lesbar, aber von keinem Nutzer veränderbar. Entwürfe sind nur für den Entwickler lesbar. Übernehmen schreibt ausschließlich in das Konto des angemeldeten Nutzers
- **Unteilbarkeit:** Einzeln wie gesammelt wird ganz oder gar nicht übernommen — keine halben Kopien (Übung ohne Varianten oder Material)
- **Eine Passungsregel:** „Passt zu Gruppe" rechnet nach denselben Kriterien wie der Generator (Sportart, Altersgruppe, Material, Teilnehmerzahl, Varianten); keine zweite Fassung der Regeln
- **Leistung:** Der Reiter mit 100 Übungen und „Passt zu Gruppe" lädt so schnell wie „Meine Übungen" heute; gesammeltes Übernehmen von 100 Übungen dauert wenige Sekunden
- **Handy:** alles bei 375 px bedienbar, ohne waagerechtes Scrollen
- **Browser:** wie die übrige App (Chrome, Edge; Firefox und Safari auf diesem Rechner nicht prüfbar)

## Open Questions
- [ ] **Tabellenformat** für die Blöcke: Excel-Datei im Projekt, Google-Tabelle oder etwas anderes — beim ersten Block entscheiden
- [ ] **Bereiche über die fünf hinaus:** Krabbelgruppe und Eltern-Kind (0–2) — gehören sie zum Launch? Hängt am Grundstock (PROJ-19)
- [ ] **Übungsdatenbank ohne Anmeldung** als Vorschau auf der Landingpage — könnte neue Nutzer überzeugen; Marketing-Frage vor dem Launch
- [ ] **Rechtliche Durchsicht** des Vorgehens aus Abschnitt H — in der Pre-Launch-Checkliste, Zeitpunkt und Umfang offen
- [ ] **Wer ist „der Entwickler"** für die Entwurfsansicht, wenn das Konto des Nutzers geleert wird — dasselbe Konto bleibt Kuratorenkonto, oder ein eigenes? Für `/architecture`

## Decision Log

### Product Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Bibliothek zum Stöbern, Übernehmen einzeln und gesammelt | Neues Konto ist in einer Minute generatorfähig, übernimmt aber nur, was es braucht; bestätigt die Entscheidung aus PROJ-3 („separate Referenz, nicht als Kopie importiert") | 2026-10-17 |
| Nicht automatisch beim Registrieren kopieren | Füllt die eigene Datenbank mit fremden Sportarten; widerspricht PROJ-3 | 2026-10-17 |
| Generator greift nicht direkt auf den Bestand zu | Die Regel „der Generator schöpft nur aus den eigenen Übungen" bleibt; Rotation, Bearbeiten und Nachbereitung setzen eine eigene Übung voraus | 2026-10-17 |
| Breiter, sportartübergreifender Bestand, kaum Sporttechnik | Trifft die meisten Breitensportgruppen; jede Altersstufe bekommt genug für eine Einheit. Der Nutzer behält sich weitere Sportarten vor dem Launch vor | 2026-10-17 |
| Pflege durch den Entwickler, ohne Admin-Seite | Für einen Solo-Entwickler genug; keine Admin-Rolle, keine weitere Oberfläche; jederzeit erweiterbar | 2026-10-17 |
| Übernommene Kopie bleibt unabhängig, kein Hinweis auf neuere Fassung | Eigene Anpassungen können nie überschrieben werden; ein Vergleich mit Entscheidung über eigene Änderungen wäre unverhältnismäßig | 2026-10-17 |
| „Passt zu Gruppe" mit Vorauswahl statt fester Pakete | Pakete decken sich selten mit der echten Gruppe und wollen gepflegt werden; die Gruppe kennt Sportart, Alter, Halle und Teilnehmer schon | 2026-10-17 |
| Material- und Teilnehmer-Abweichungen anzeigen, aber nicht vorauswählen, mit Grund | Der Nutzer übernimmt nicht blind, was der Generator nie wählt, erfährt aber, was mit anderem Material ginge. Folgt der Regel, dass leere oder eingeschränkte Ergebnisse jede Ursache nennen | 2026-10-17 |
| Eine Übung passt, wenn Grundform **oder** eine Variante passt | Wie im Generator ist jede Variante eine vollwertige Übung (BUG-20 aus PROJ-7) | 2026-10-17 |
| Seite „Übungen" mit Reitern „Meine Übungen" und „Übungsdatenbank" | Vom Nutzer vorgegeben. Kein vierter Menüpunkt; „Übungsdatenbank" ist langfristig der Ort aller öffentlichen Übungen (PROJ-12) | 2026-10-17 |
| „Übungsdatenbank" meint nur noch die öffentliche Sammlung; eigener Bestand heißt „Meine Übungen" | Sonst bezeichnet ein Wort zwei Dinge auf derselben Seite; alle Stellen in Abschnitt A erfasst. Featurename von PROJ-3 bleibt, weil an die ID gebunden | 2026-10-17 |
| Einstiege: Leerzustände und Angebot nach dem Anlegen einer neuen Gruppe | Dort braucht der Nutzer die Übungen; nach dem Anlegen kennt die App die Gruppe und kann „passt zu Gruppe" vorbelegen. Nicht beim Bearbeiten, um nicht zu nerven | 2026-10-17 |
| Leseansicht wie die eigene Detailseite, ohne Bearbeiten | Einmal gelernt, überall gefunden; vor dem Übernehmen alles sehen (User Story 3) | 2026-10-17 |
| Gesammeltes Übernehmen ganz oder gar nicht | Eine halbe Übernahme lässt den Nutzer raten, was fehlt; gleiche Haltung wie beim Speichern im Editor | 2026-10-17 |
| Gleicher Name wie eine eigene Übung: übernehmen mit Hinweis, nicht sperren | Die eigene Übung kann etwas ganz anderes sein; sperren würde den häufigen Fall bestrafen | 2026-10-17 |
| Inhalte: Claude entwirft aus vom Nutzer gezeigten Quellen, der Nutzer bearbeitet blockweise | Vom Nutzer vorgeschlagen. Praxiswissen des Nutzers plus Tempo beim Entwurf | 2026-10-17 |
| Blöcke als Tabelle statt als Übungen im eigenen Konto | Schnell und übersichtlich blockweise bearbeitbar; im Konto würden eigene Übungen und öffentlicher Bestand vermischt. Schwäche bei verschachtelten Angaben aufgefangen durch kurze Schreibweise und strenge Prüfung beim Einlesen | 2026-10-17 |
| Entwurf in der App sichtbar, erst Freigabe zeigt ihn allen | Der Nutzer sieht den Block vor der Freigabe so, wie andere ihn sehen | 2026-10-17 |
| Urheberrechtsregeln als feste Vorgabe; rechtliche Durchsicht vor dem Launch | Ideen sind frei, Formulierungen, Bilder und Sammlungen nicht; das Vorgehen hält das Risiko klein, ersetzt aber keine Beratung | 2026-10-17 |
| Keine Bilder und Musik-Links im Bestand | Urheberrecht; Bilder liegen pro Nutzer geschützt; Links veralten | 2026-10-17 |
| Mindeststandard je Übung und Mindestabdeckung 3/5/3 je Bereich | Ein Bestand, der den Generator nicht füllt, löst das Kernproblem nicht; der Standard macht die Abnahme eines Blocks prüfbar | 2026-10-17 |
| Grundstock der Kategorien als eigenes Feature PROJ-19, vor PROJ-4 | Für sich prüf- und auslieferbar, berührt PROJ-3, 5, 6 und 16; der Bestand braucht die endgültigen Begriffe vorher | 2026-10-17 |
| Konto des Nutzers vor dem Befüllen ganz leeren, außer der Anmeldung | Vom Nutzer gewünscht: den Einstieg eines neuen Nutzers selbst durchgehen. Die Testübungen sind vorher als Rohmasse gesichert | 2026-10-17 |
| Testübungen nur in der Starter-Fassung bereinigen | Testspuren gehören nicht in den Bestand; das Konto wird ohnehin geleert | 2026-10-17 |

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
