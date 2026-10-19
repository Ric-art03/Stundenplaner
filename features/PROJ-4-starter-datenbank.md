# PROJ-4: Starter-Datenbank (Übungsdatenbank zum Übernehmen)

## Status: Approved
**Created:** 2026-09-28
**Last Updated:** 2026-10-19

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
einen Mindeststandard. Richtgröße sind 50–100 Übungen; wie weit der Bestand bis zum Launch kommt,
zeigt die Arbeit Block für Block. Danach kann er weiter wachsen.

**Mindeststandard je Übung:**
- Beschreibung mit **Aufbau** (was steht wo) und **Ablauf** (was die Teilnehmer tun), in eigenen Worten
- **Sicherheitshinweis**, wo die Übung Sturz-, Zusammenstoß- oder Überlastungsgefahr hat
- Im Hauptteil mindestens **eine leichtere und eine schwerere Variante**, wo das sinnvoll ist
- **Nur vordefinierte Begriffe** aus dem Grundstock (PROJ-19) — keine eigenen Kategorien
- Realistische **Dauer** und **Teilnehmerzahl**; Material mit Menge und Modus
- Keine Bilder, keine Musik-Links (Out of Scope); keine Arbeitsnotiz

**Abdeckung je Zielgruppe** *(geändert am 2026-10-18, beim Tech Design)*. Gezählt wird je
**Zielgruppe = Sportart + Alter** (z. B. „Kinderturnen, 4–6"), weil der Generator für eine Gruppe
Übungen braucht, die zu beidem zugleich passen. Eine Zielgruppe gilt als **abgedeckt** mit
mindestens **3 Übungen fürs Aufwärmen, 5 für den Hauptteil und 3 fürs Cool-Down**. Das reicht,
damit der Generator für eine 60-Minuten-Gruppe eine Einheit füllt und etwas abwechseln kann.

- **Es gibt keine feste Liste zum Launch.** Der Nutzer nennt die Zielgruppen nacheinander, die
  wichtigsten zuerst; wie viele es bis zum Launch werden, zeigt die Arbeit
- **Eine Übung zählt für jede Zielgruppe, deren Sportart und Alter sie trägt.** Gerade Aufwärmen
  und Cool-Down passen oft zu mehreren — richtig markiert spart das viel Arbeit (PROJ-19: eine Übung
  trägt alle passenden Begriffe)
- Altersgrenzen der Zielgruppe sind die Altersgruppen des Grundstocks (PROJ-19); eine Zielgruppe
  darf mehrere davon zusammenfassen, z. B. „Senioren 60–75 und 75+"

*Ersetzt die frühere Vorgabe „je Bereich, fünf feste Bereiche (Vorschulkinder bis Senioren)" — die
Bereiche passten nach PROJ-19 nicht mehr zu den Altersgruppen und hätten alle Sportarten über einen
Kamm geschoren.*

### Akzeptanzkriterien
- [ ] Angenommen ein Block soll freigegeben werden, wenn er geprüft wird, dann trägt jede Übung nur Begriffe aus dem Grundstock, und jede Abweichung ist vor der Freigabe gemeldet und behoben
- [ ] Angenommen eine Zielgruppe, die der Nutzer genannt hat, wenn der freigegebene Bestand für sie nach Phase gezählt wird, dann zeigt die Zählung den Stand gegen 3 / 5 / 3 — und eine Zielgruppe gilt erst als abgedeckt, wenn alle drei Marken erreicht sind
- [ ] Angenommen eine abgedeckte Zielgruppe und eine 60-Minuten-Gruppe dieser Sportart und dieses Alters mit üblicher Hallenausstattung, wenn der Nutzer alles Passende übernimmt und eine Einheit generiert, dann entsteht eine Einheit ohne offene Lücke
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
- [ ] **Tabellenformat** für die Blöcke: ~~Excel-Datei im Projekt, Google-Tabelle oder etwas anderes~~ — *zur Hälfte beantwortet (2026-10-18, Tech Design):* Austauschformat ist .xlsx mit drei Blättern, außerhalb des Projektordners. Offen bleibt nur das Werkzeug (Excel oder Google Tabellen) — beim ersten Block entscheiden
- [ ] **Bereiche über die fünf hinaus:** Krabbelgruppe und Eltern-Kind (0–2) — gehören sie zum Launch? *Technisch kein Hindernis mehr: der Grundstock hat die Begriffe (PROJ-19). Bleibt eine Inhaltsfrage*
- [ ] **Sicherung des Ordners mit den Blöcken** — außerhalb des Projekts ohne Versionsgeschichte; Cloud-Ordner oder privates Repository (aus dem Tech Design)
- [ ] **Übungsdatenbank ohne Anmeldung** als Vorschau auf der Landingpage — könnte neue Nutzer überzeugen; Marketing-Frage vor dem Launch
- [ ] **Rechtliche Durchsicht** des Vorgehens aus Abschnitt H — in der Pre-Launch-Checkliste, Zeitpunkt und Umfang offen
- [x] **Wer ist „der Entwickler"** für die Entwurfsansicht? — *Beantwortet 2026-10-18:* das eigene Konto des Nutzers, als Vorschau-Konto je Block. Entwürfe stehen dort nur zwischen Einlesen und Freigabe

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
| Angebot nach dem Anlegen einer Gruppe nennt beide Zahlen: was passt, und wie viel davon sofort einplanbar ist | Sonst schwiege das Angebot, wenn der Halle für alles noch Material fehlt — gerade dann ist es nützlich. Vom Nutzer nach einem Beispiel gewählt | 2026-10-18 |
| Ein Filter blendet ausgewählte Übungen aus, wählt sie aber nicht ab; die Leiste nennt, wie viele ausgeblendet sind | Wer kurz filtert, soll seine Vorauswahl nicht still verlieren; übernommen wird, was angekreuzt ist, und die Leiste sagt es. Vom Nutzer nach einem Beispiel gewählt | 2026-10-18 |
| Abdeckung je Zielgruppe (Sportart + Alter) statt je festem Altersbereich; keine feste Liste zum Launch | Vom Nutzer beim Tech Design gewünscht: Stück für Stück, die wichtigsten Zielgruppen zuerst, und sehen, wie weit es realistisch reicht. Eine Gruppe braucht Übungen, die zu Sportart und Alter zugleich passen | 2026-10-18 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Eigene Tabellen für die Übungsdatenbank, gleich aufgebaut wie die eigenen Übungen | Generator, Editor, Live-Modus und Kategorien-Verwaltung können den Bestand nicht sehen. Eine besitzerlose Übung in den bestehenden Tabellen wäre bei jeder Abfrage ohne Besitzerprüfung durchgerutscht | 2026-10-18 |
| Übernehmen als eine Datenbank-Funktion mit den Rechten des Nutzers | Ganz oder gar nicht, auch bei 100 Übungen. Sie kann nur ins eigene Konto schreiben, weil die bestehenden Regeln der eigenen Übungen greifen | 2026-10-18 |
| Kopie trägt „Übernommen aus" und „Übernommen am"; je Nutzer höchstens eine Kopie je Übung, von der Datenbank geprüft | „Übernommen", Wieder-Übernehmen nach dem Löschen und „nur eine Kopie aus zwei Tabs" ergeben sich daraus ohne eigenen Zustand | 2026-10-18 |
| Quellenangabe als eigenes Feld, beim Übernehmen kopiert, nicht im Formular | Lizenzen mit Namensnennung verlangen sie auch an einer veränderten Kopie. Ein Link taugt nicht, weil nicht jede Quelle eine Adresse hat | 2026-10-18 |
| Herkunft nur in der Tabelle des Blocks, nicht in der Datenbank | Alles in den lesbaren Tabellen ist für jeden angemeldeten Nutzer über die Schnittstelle abrufbar, auch was die App nicht anzeigt | 2026-10-18 |
| „Passt zu Gruppe" auf dem Server, über die Kriterien und Kandidaten des Generators | Eine Passungsregel. Die Materialprüfung liefert künftig die Fehlliste, „reicht" heißt „Liste leer" | 2026-10-18 |
| Filter beider Reiter über einen gemeinsamen Abfrage-Baustein | Ein Filter kann nicht in einem Reiter anders wirken als im anderen | 2026-10-18 |
| Übungsdatenbank lädt auf einmal, ohne „Mehr laden" | Bei 50–100 Übungen schneller, und die Vorauswahl braucht alle Treffer. Mit PROJ-12 neu zu entscheiden | 2026-10-18 |
| Reiter, Filter, Sortierung und Gruppe in der Adresse | Neuladen, „Zurück" mit Filtern und die Einstiege mit vorbelegter Gruppe ergeben sich daraus | 2026-10-18 |
| Angebot nach dem Anlegen einer Gruppe als Hinweis auf der Gruppenseite, nicht als Kurzmeldung | Eine Kurzmeldung verschwindet nach Sekunden | 2026-10-18 |
| Vorschau-Konten je Block; Standard ist das Konto des Nutzers | Vom Nutzer entschieden. Kein zweites Login; Entwürfe nur zwischen Einlesen und Freigabe sichtbar. Beantwortet die offene Frage „Wer ist der Entwickler" | 2026-10-18 |
| Korrekturen an freigegebenen Übungen: Gegenüberstellung im Prüfprogramm, Ja schreibt und macht live | Vom Nutzer entschieden. Eine Vorschau in der App bräuchte eine zweite, wartende Fassung je Übung. Weicht von Abschnitt G ab | 2026-10-18 |
| Zurückziehen nur über eine ausdrückliche Markierung in der Tabelle | Eine versehentlich gelöschte Zeile soll nichts aus dem Bestand nehmen | 2026-10-18 |
| Einlesen und Freigeben über ein Prüfprogramm auf diesem Rechner mit dem Dienstschlüssel | Keine Admin-Seite, keine Admin-Rolle in der App. Der Schlüssel liegt für den Prüfplan schon in `.env.local` und kommt nicht nach Vercel | 2026-10-18 |
| Prüfprogramm prüft mit den Listen und Grenzen des Übungsformulars, dazu Regeln nur für den Bestand | Ein Block kann nichts enthalten, was ein Nutzer nicht auch anlegen könnte. Pflicht im Bestand: Sportart, Altersgruppe, Phase und Herkunft | 2026-10-18 |
| Austauschformat .xlsx mit Blättern Block, Übungen, Varianten | Funktioniert mit Excel und mit Google Tabellen. CSV verliert bei deutschem Excel Umlaute und Zeilenumbrüche, und Varianten sind zu lang für eine Zelle | 2026-10-18 |
| Tabellen der Blöcke außerhalb des Projektordners | Das Repository ist öffentlich; die Sammlung als Ganzes samt Herkunft gehört nicht hinein | 2026-10-18 |
| Testblock, der nie freigegeben wird, Vorschau nur für das Testkonto | Browser-Tests laufen gegen die gemeinsame Datenbank; kein echter Nutzer darf Testübungen sehen | 2026-10-18 |
| Abdeckungsbericht je Zielgruppe (Sportart + Alter) aus einer Liste, die der Nutzer führt | Der Generator braucht Sportart und Alter zugleich; feste Altersbereiche hätten das verfehlt. Vom Nutzer am 2026-10-18 so gewollt: Stück für Stück, die wichtigsten zuerst | 2026-10-18 |
| Arbeit am Bestand in eigenen Block-Sitzungen, nicht in einem Skill-Schritt | Die Skills bauen die Maschine einmal; Inhalte entstehen wiederkehrend und brauchen keinen Code, keinen Commit und keine Auslieferung | 2026-10-18 |
| `exceljs` als reines Entwicklungspaket | Liest .xlsx im Prüfprogramm. `xlsx` wird über npm nicht mehr gepflegt. Die App bekommt kein neues Paket | 2026-10-18 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Stand:** 2026-10-18

### Der tragende Gedanke

Drei Entscheidungen tragen das Feature:

1. **Die Übungsdatenbank hat ihre eigenen Tabellen**, getrennt von den Tabellen der eigenen
   Übungen und genauso aufgebaut (Übung, Material, Varianten, Links). Der Generator, der Editor,
   der Live-Modus und die Verwaltung der Kategorien lesen nur die eigenen Tabellen und **können
   den Bestand gar nicht sehen**. Damit ist „der Generator schöpft nur aus den eigenen Übungen"
   eine Eigenschaft des Aufbaus und keine Regel, die jede einzelne Abfrage einhalten muss
2. **Übernehmen ist eine einzige Datenbank-Operation**, die mit den Rechten des angemeldeten
   Nutzers läuft. Sie kopiert eine oder hundert Übungen samt Material, Varianten und Links ganz oder
   gar nicht, und sie kann nur in das eigene Konto schreiben, weil die bestehenden Zugriffsregeln
   der eigenen Übungen das schon heute so erzwingen. Die Kopie merkt sich, woher sie kommt. Daraus
   ergeben sich „Übernommen", „In Meine Übungen öffnen", „wieder übernehmbar nach dem Löschen" und
   „nur eine Kopie aus zwei Tabs", ohne dass dafür eine eigene Logik nötig ist
3. **„Passt zu Gruppe" ist die Kriterienliste des Generators**, befragt für die ganze Gruppe statt
   für ein Segment: Sportart, Altersgruppe, Material, Teilnehmerzahl, je Grundform und je Variante.
   Phase, Schwierigkeit und Organisationsform hängen am Segment und fallen deshalb weg. Es gibt
   keine zweite Fassung der Regeln

In die Datenbank schreibt die App selbst nichts, was zum Bestand gehört. Einlesen, Freigeben und
Zurückziehen laufen über ein **Prüfprogramm auf diesem Rechner**, das die Tabelle eines Blocks
liest, jede Zeile gegen den Grundstock und die Grenzen der Übungsdaten prüft und erst dann
schreibt.

### A) Aufbau der Oberfläche

```
Seite „Übungen"  (bisher „Übungsdatenbank"; der Reiter steht in der Adresse)
+-- Reiterleiste: Meine Übungen | Übungsdatenbank
+-- Reiter „Meine Übungen"  (die bestehende Übersicht, unverändert)
|   +-- Leerzustand: „Erste Übung anlegen" + „Aus der Übungsdatenbank übernehmen"  (neu)
+-- Reiter „Übungsdatenbank"  (neu; Filter, Sortierung und Gruppe stehen in der Adresse)
    +-- Werkzeugleiste  (die bestehende: Suche, Filter, Ansicht, Sortierung)
    |   +-- Sortierung „Zuletzt hinzugefügt"  (nur hier)
    |   +-- Auswahl „Passt zu Gruppe"  (nur hier; ohne Gruppe: Erklärung + „Gruppe anlegen")
    +-- Hinweise oben  (nur mit Gruppe): ohne Halle kein Materialabgleich, Teilnehmerzahl fehlt
    +-- Anzahl („68 Übungen")
    +-- Liste oder Karten  (die bestehenden Ansichten, erweitert)
    |   +-- Übungszeile  (bestehend: Material · Organisationsform · Varianten)
    |   +-- Ankästchen zum Auswählen
    |   +-- „Übernehmen"  bzw.  „Übernommen" + „In Meine Übungen öffnen"
    |   +-- Vermerk „Entwurf"  (nur in der Vorschau des Entwicklers)
    |   +-- mit Gruppe: „passt", „passt mit der Variante …" oder alle Gründe in einem Satz
    +-- Auswahlleiste unten, klebt am Rand: „7 ausgewählt" · Übernehmen · Auswahl aufheben
    +-- Leerzustände: Bestand wird aufgebaut | Filter ohne Treffer mit Grund |
                      Gruppe ohne Treffer mit allen Gründen | „Alles Passende hast du schon übernommen"

Leseansicht einer Übung aus der Übungsdatenbank  (neue Adresse unter /exercises/…)
+-- die bestehende Detailansicht, im Lesemodus: ohne Bearbeiten und Löschen
+-- Quellenangabe, wenn vorhanden
+-- „Übernehmen"  bzw.  „Übernommen" + „In Meine Übungen öffnen"
+-- „Zurück" führt in den Reiter mit denselben Filtern

Detailansicht einer eigenen Übung  (bestehend, erweitert)
+-- Vermerk „Aus der Übungsdatenbank übernommen am …"
+-- Quellenangabe, wenn vorhanden

Gruppenseite direkt nach dem Anlegen  (bestehend, erweitert)
+-- Hinweis „Zu dieser Gruppe passen 23 Übungen aus der Übungsdatenbank — ansehen"

Generator  (bestehend)
+-- Leerzustand „keine Übungen": Knopf in die Übungsdatenbank, mit Gruppe vorbelegt

Texte aus Abschnitt A  (Startseite, Generator, Editor, Nachfragen, Platzhalter) — reine Textänderungen
```

Alles besteht aus Bausteinen, die schon im Projekt liegen: Reiter, Ankästchen, Auswahl, Hinweise,
die Werkzeugleiste, beide Ansichten und die Detailansicht. Die Listen- und Kartenansicht bekommen
eine Einstellung „Übungsdatenbank", die Löschen gegen Auswählen und Übernehmen tauscht; die
Detailansicht bekommt einen Lesemodus. Neu gebaut wird nur die Auswahlleiste, nach dem Muster der
Änderungsleiste aus dem Editor.

### B) Daten

**Die Übungsdatenbank — vier neue Tabellen, aufgebaut wie die der eigenen Übungen:**

```
Jede Übung der Übungsdatenbank hat:
- Kennung und einen festen Schlüssel aus der Tabelle (z. B. „KI-07"), der sich nie ändert
- alle Felder einer eigenen Übung, mit denselben Grenzen: Name, Beschreibung, Anmerkungen,
  Sportarten, Altersgruppen, Phasen, Schwierigkeit, Organisationsformen, Dauer,
  Teilnehmer von/bis, „Musik benötigt"
- Material, Varianten und Links genau wie bei einer eigenen Übung (je eine eigene Tabelle)
- Quellenangabe (optional) — der Text, der angezeigt wird, wo eine Lizenz Namensnennung verlangt
- Zu welchem Block sie gehört
- Zustand: Entwurf, freigegeben oder zurückgezogen
- Zuerst freigegeben am (für „Zuletzt hinzugefügt")
- Zuletzt geändert am

Nicht dabei: Bilder, Musik-Link, Arbeitsnotiz, „noch zu ergänzen" (Out of Scope bzw. gehört dem Nutzer)

Jeder Block hat:
- Kennung und Name (z. B. „Kinder 7–10, Aufwärmen")
- Die Konten, die seine Entwürfe vorab sehen dürfen

Gespeichert in: der Datenbank. Lesbar für jeden angemeldeten Nutzer, soweit freigegeben; Entwürfe
nur für die Vorschau-Konten ihres Blocks. Änderbar für niemanden über die App.
```

**An der eigenen Übung kommen drei Felder dazu:**

- **Übernommen aus** — der Verweis auf die Übung der Übungsdatenbank. Pro Nutzer darf jede Übung
  der Übungsdatenbank nur **einmal** als Kopie vorkommen. Diese Regel prüft die Datenbank selbst,
  so entsteht auch bei zwei Tabs nur eine Kopie
- **Übernommen am** — für den Vermerk auf der Detailseite
- **Quellenangabe** — wird beim Übernehmen mitkopiert. Sie steht nicht im Formular, bleibt also
  beim Bearbeiten erhalten. Bei selbst angelegten Übungen ist sie leer

„Übernommen" in der Übungsdatenbank ist **kein gespeicherter Zustand**, sondern die Frage, ob der
Nutzer gerade eine Kopie mit diesem Verweis hat. Löscht er sie, ist der Vermerk von selbst weg.

**Was nicht in die Datenbank kommt: die Herkunft** (woraus eine Übung gewonnen wurde, Abschnitt H).
Sie steht in der Tabelle des Blocks und bleibt dort. Läge sie in der Datenbank, könnte jeder
angemeldete Nutzer sie über die Schnittstelle abrufen, auch wenn die App sie nicht anzeigt.

**Drei neue Datenbank-Funktionen:**

- **Übernehmen** — eine Liste von Übungen der Übungsdatenbank hinein, die Kennungen der Kopien
  heraus. Läuft mit den Rechten des Nutzers. Ist eine Übung inzwischen zurückgezogen oder nicht
  sichtbar, bricht sie ab, nennt die Übung und schreibt nichts. Ist eine schon übernommen, wird
  sie übersprungen und als „schon übernommen" zurückgemeldet. Das ist kein Fehler, und die
  übrigen werden kopiert
- **Block einlesen** — schreibt einen geprüften Block in einem Zug: neue Übungen als Entwurf,
  geänderte überschreibt sie anhand ihres Schlüssels, als „zurückgezogen" markierte zieht sie
  zurück. Gesperrt für alle Nutzer, nur das Prüfprogramm darf sie aufrufen
- **Block freigeben** — macht alle Entwürfe eines Blocks sichtbar und setzt bei jeder Übung, die
  zum ersten Mal freigegeben wird, „zuerst freigegeben am". Ebenso gesperrt

### C) Wie ein Block in die App kommt

```
Tabelle des Blocks (.xlsx, außerhalb des Projektordners)
  Blatt „Block"      Name, Vorschau-Konten, Vermerk zu den Quellen
  Blatt „Übungen"    eine Zeile je Übung, Material in kurzer Schreibweise („Ball 1 je TN; Hütchen 12"),
                     Herkunft, Quellenangabe, Zustand, ggf. „ohne Varianten, weil …"
  Blatt „Varianten"  eine Zeile je Variante, mit dem Schlüssel ihrer Übung
        |
        v
Prüfprogramm „prüfen"     jede Zeile gegen Grundstock und Grenzen; jeder Fehler mit Blatt, Zeile, Feld
                          bei Fehlern: Ende, nichts geschrieben
                          sonst: Gegenüberstellung — neu / geändert (Feld für Feld) / zurückgezogen / gleich
        |
        v  (Ja des Nutzers)
Prüfprogramm „einlesen"   neue Übungen als Entwurf -> in der App nur für die Vorschau-Konten sichtbar
                          Korrekturen an freigegebenen Übungen sind ab jetzt live
        |
        v  (Ansehen in der App, „Passt zu Gruppe" ausprobieren, Ja des Nutzers)
Prüfprogramm „freigeben"  Entwürfe des Blocks für alle sichtbar

Prüfprogramm „Abdeckung"  zählt den freigegebenen Bestand je Zielgruppe (Sportart + Alter) und Phase
                          gegen 3 / 5 / 3, z. B. „Kinderturnen 4–6: Aufwärmen 3/3, Hauptteil 2/5, Cool-Down 1/3"
```

Welche Zielgruppen gezählt werden, steht in einer kleinen eigenen Liste im Ordner der Blöcke. Der
Nutzer ergänzt sie Zielgruppe für Zielgruppe, in der Reihenfolge, in der er sie angehen will.

Das Prüfprogramm liegt im Projekt, die Tabellen nicht. Es prüft mit **denselben Listen und
Grenzen wie das Übungsformular** (die Begriffe des Grundstocks aus PROJ-19, die Längen und Zahlen
aus der Prüfung des Formulars). Ein Block kann also nichts enthalten, was ein Nutzer nicht auch von
Hand anlegen könnte. Dazu kommen die Regeln, die nur für den Bestand gelten:

- mindestens eine Sportart, eine Altersgruppe und eine Phase. Der Generator lässt eine Übung
  **ohne** Altersgruppe überall durch, im Bestand wäre das ein Fehler
- nur Begriffe aus dem Grundstock, in der richtigen Schreibweise. Wird einer falsch geschrieben,
  meldet das Programm das, statt ihn still zu korrigieren
- Herkunft ausgefüllt (Abschnitt H)
- im Hauptteil eine leichtere und eine schwerere Variante oder eine Begründung (Abschnitt F)
- Schlüssel eindeutig, Varianten zeigen auf vorhandene Schlüssel
- **Zurückgezogen wird nur, was die Tabelle ausdrücklich so markiert.** Eine Zeile zu löschen zieht
  nichts zurück, das Programm meldet die fehlende Zeile nur

Geschrieben wird mit dem Dienstschlüssel von Supabase, der für den Prüfplan schon in `.env.local`
liegt. Er bleibt auf diesem Rechner und kommt nicht nach Vercel.

### C2) Wann und wie die Arbeit am Bestand passiert

**Nicht in einem Skill-Schritt.** `/frontend`, `/backend`, `/qa` und `/deploy` bauen die Maschine:
den Reiter, das Übernehmen, „Passt zu Gruppe" und das Prüfprogramm. Die Übungen selbst entstehen
danach in **eigenen Arbeitssitzungen**, je Sitzung ein Block, so oft der Nutzer will. Sinnvoll
beginnen sie nach `/deploy` von PROJ-4; möglich wären sie schon nach `/backend`, weil Entwürfe nur
im Konto des Nutzers zu sehen sind.

**Eine Block-Sitzung:**

| # | Wer | Was | Wo |
|---|---|---|---|
| 1 | Nutzer | sagt, wofür der Block ist (z. B. „Kinderturnen 4–6, Aufwärmen und Hauptteil"), zeigt Quellen (Links, PDFs, eigene Notizen) und sagt, was daraus werden soll | Chat |
| 2 | Claude | liest die Quellen, schreibt die Übungen in eigenen Worten in die Tabelle, trägt die Herkunft ein, lässt „prüfen" selbst laufen, bis es fehlerfrei ist | .xlsx im Ordner der Blöcke |
| 3 | Nutzer | öffnet die Tabelle, schreibt um, streicht, ergänzt, speichert | Excel |
| 4 | Claude | „prüfen": Fehlerliste (zurück zu 3) oder Gegenüberstellung, was neu ist und was sich ändert | Terminal, Ergebnis im Chat |
| 5 | Claude, nach Ja des Nutzers | „einlesen": die Übungen stehen als **Entwurf** im Konto des Nutzers unter „Übungsdatenbank" | Datenbank |
| 6 | Nutzer | sieht sie in der App an, probiert „Passt zu Gruppe" mit einer Gruppe, übernimmt vielleicht welche und generiert eine Einheit. Gefällt etwas nicht: zurück zu 3 | App |
| 7 | Claude, nach Ja des Nutzers | „freigeben": ab jetzt sehen alle Nutzer den Block; danach „Abdeckung" für den Stand je Zielgruppe | Datenbank |

**Ein „Hochladen" zu GitHub oder Vercel gibt es dabei nicht.** Übungen sind Daten in der
Datenbank, kein Code: Einlesen und Freigeben gehen direkt dorthin, ohne Auslieferung, ohne Commit,
und die Tabelle berührt das Projekt nie. Jeder Schritt, der in die Datenbank schreibt (5 und 7),
geschieht nur nach ausdrücklichem Ja. Ein eigener Skill für diesen wiederkehrenden Ablauf (etwa
`/block`) ist möglich, sobald das Prüfprogramm steht.

**Der erste Block** ist die bereinigte Rohmasse aus der Kontosicherung (Schritt 2 der
„Reihenfolge der Arbeit"). Er läuft durch denselben Ablauf und ist zugleich der erste echte Test
des Prüfprogramms.

### D) Entscheidungen und ihre Gründe

**Eigene Tabellen statt Bestand in den Übungstabellen.** Die naheliegende Alternative wäre, die
Starter-Übungen als Übungen ohne Besitzer in die bestehenden Tabellen zu legen und sie über eine
zusätzliche Leseregel sichtbar zu machen. Dann würde aber jede Abfrage, die heute Übungen liest
(Generator, Editor, Auswahldialog, Zählen und Umbenennen der Kategorien, Nachbereitung), den
Bestand mit sehen, sobald sie den Besitzer nicht ausdrücklich prüft. Ein einziges Versäumnis würde
fremde Übungen in den Generator bringen und die Kategorien-Verwaltung Begriffe im Bestand
umbenennen lassen. Mit eigenen Tabellen kann das nicht passieren. Der Preis: Kommt an der Übung
ein Feld dazu, muss es auch am Bestand nachgezogen werden. Das passiert selten, und die
Prüfung des Formulars, die beide teilen, macht das Fehlen sichtbar.

**Die Liste der Übungsdatenbank filtert über denselben Baustein wie „Meine Übungen".** Die Filter
(Suche, Sportart, Altersgruppe, Phase, Schwierigkeit, Material samt „Ohne Material") stecken heute
in der Abfrage der eigenen Übungen. Sie werden zu einem Baustein, der für beide Tabellenreihen
dieselbe Abfrage baut. So kann ein Filter in einem Reiter nicht anders wirken als im anderen.

**Die Übungsdatenbank lädt auf einmal, ohne „Mehr laden".** Bei 50–100 Übungen ist das schneller
als jedes Nachladen, und „Passt zu Gruppe" braucht ohnehin alle Treffer, um vorauszuwählen. Mit
PROJ-12 (geteilte Übungen, womöglich Tausende) ist das neu zu entscheiden.

**„Passt zu Gruppe" rechnet der Server, mit den Bausteinen des Generators.** Der Server lädt die
Gruppe mit Halle und Material, baut aus dem Bestand die Kandidaten (jede Grundform und jede
Variante, derselbe Baustein wie im Generator) und fragt für jeden die Kriterien des Generators ab.
Zurück kommt je Übung: passt, passt mit Variante …, oder alle Gründe. Dafür muss die
Materialprüfung des Generators sagen können, **welches** Material fehlt, nicht nur ob etwas fehlt.
Sie wird so umgebaut, dass sie die Fehlliste liefert; „reicht das Material" ist dann „die Liste ist
leer". Das bleibt eine Regel, nur mit mehr Auskunft.

**Vorausgewählt ist, was passt und noch nicht übernommen ist.** Übernommenes steht mit
„Übernommen" in der Liste und ist nicht auswählbar. Die Vorauswahl wird beim Laden berechnet und
springt danach nicht mehr von selbst um (Edge Case 6). Erst „Gruppe neu wählen" oder Neuladen
rechnet neu.

**Die Adresse trägt Reiter, Filter, Sortierung und Gruppe.** Daraus ergeben sich Neuladen, „Zurück"
aus der Leseansicht mit denselben Filtern und die Einstiege mit vorbelegter Gruppe (Generator,
Gruppenseite), ohne dass sich die App etwas merken muss. „Meine Übungen" bleibt dabei, wie es ist.

**Das Angebot nach dem Anlegen einer Gruppe steht auf der Gruppenseite**, nicht in einer
Kurzmeldung. Eine Kurzmeldung verschwindet nach Sekunden, das Angebot soll aber in Ruhe gelesen
werden. Die Gruppenseite erfährt über die Adresse, dass sie direkt nach dem Anlegen geöffnet wurde,
und fragt dann die Zahl passender, noch nicht übernommener Übungen ab. Bei null erscheint nichts.
Beim Bearbeiten kommt das Merkmal nicht in die Adresse.

**Vorschau über das eigene Konto, je Block festgelegt** (vom Nutzer am 2026-10-18 entschieden).
Ein Block nennt die Konten, die seine Entwürfe sehen. Normalerweise ist das das Konto des Nutzers.
Entwürfe stehen dort nur zwischen Einlesen und Freigabe. Danach sieht das Konto aus wie jedes
andere. Die Vorschau-Konten dürfen Entwürfe auch übernehmen, um den Generator damit auszuprobieren.
Für alle anderen sind Entwürfe weder sichtbar noch über eine erratene Adresse abrufbar oder
übernehmbar (Edge Case 13). Die Datenbank sorgt dafür, nicht die Oberfläche.

**Korrekturen an freigegebenen Übungen ohne Vorschau in der App** (vom Nutzer am 2026-10-18
entschieden). Für eine Vorschau müsste an jeder Übung eine zweite, wartende Fassung hängen. Statt
dessen zeigt „prüfen" Feld für Feld, was sich ändert, und erst das Ja schreibt. **Das weicht von
Abschnitt G ab:** dort laufen Korrekturen über eine Freigabe in der App. Neue Übungen kommen
weiterhin erst als Entwurf. Übernommene Kopien bleiben in jedem Fall unverändert (Akzeptanzkriterium
G.5), weil die Kopie keine Verbindung außer dem Verweis hat.

**Die Tabellen der Blöcke liegen außerhalb des Projektordners**, neben der Kontosicherung. Das
Repository ist öffentlich. Dort läge die ganze kuratierte Sammlung samt Herkunft jeder Übung zum
Herunterladen bereit, und genau diese Sammlung als Ganzes schützt Abschnitt H. Das Prüfprogramm
selbst enthält keine Inhalte und liegt im Projekt.

**Austauschformat .xlsx mit drei Blättern** (beantwortet die offene Frage zum Tabellenformat zur
Hälfte). Excel speichert es direkt, Google Tabellen lädt es als .xlsx herunter. Womit der Nutzer
bearbeitet, bleibt seine Wahl. CSV wäre ohne Paket lesbar, verliert aber bei deutschem Excel
Umlaute und Zeilenumbrüche in Beschreibungen. Varianten stehen auf einem **eigenen Blatt** statt in
kurzer Schreibweise in der Zeile ihrer Übung: Titel, Beschreibung und Abweichungen sind zu lang für
eine Zelle. Für Material bleibt die kurze Schreibweise.

**Testdaten in einem eigenen Block, der nie freigegeben wird.** Die Browser-Tests laufen gegen
dieselbe Datenbank wie die Produktion, und der Bestand ist für alle gemeinsam. Ein Testblock mit
wenigen erfundenen Übungen wird einmal eingelesen. Sein einziges Vorschau-Konto ist das Testkonto,
also sieht kein echter Nutzer ihn, auch der Nutzer selbst nicht. Kopien entstehen nur im Testkonto
und werden dort wie gewohnt aufgeräumt.

**Zugriffsschutz.** Die vier neuen Tabellen bekommen je **eine** Leseregel und keine Schreibregel.
Die Funktion „Übernehmen" läuft mit den Rechten des Nutzers und unterliegt damit den bestehenden
Regeln der eigenen Übungen. „Einlesen" und „Freigeben" sind für `anon` und `authenticated`
gesperrt. Die Härtung aus PROJ-6 gilt für alle drei. *Neue Zugriffsregeln brauchen laut
Projektregel die ausdrückliche Zustimmung des Nutzers. Sie wird in `/backend` mit dem fertigen Text
der Migration eingeholt.*

### E) Was dabei aufgefallen ist

- **Die fünf Bereiche aus Abschnitt F passten nicht mehr zum Grundstock** („Vorschulkinder 2–6"
  sind dort zwei Altersgruppen, Jugend, Erwachsene und Senioren ebenso) und sahen keine Sportart
  vor, obwohl der Generator Sportart und Alter zugleich braucht. **Auf Rückfrage des Nutzers am
  2026-10-18 geändert:** gezählt wird je **Zielgruppe = Sportart + Alter**, ohne feste Liste zum
  Launch; der Nutzer nennt die Zielgruppen nacheinander (Abschnitt F ist nachgezogen). Ebenso nennt
  „Worum es geht" noch „Allgemeinsport", den es seit PROJ-19 nicht mehr gibt
- **Eine Übung ohne Altersgruppe passt im Generator zu jeder Gruppe.** Für eigene Übungen ist das
  gewollt („unbekannt ist kein Widerspruch"). Im Bestand würde es „Passt zu Gruppe" verfälschen,
  deshalb verlangt das Prüfprogramm mindestens eine Altersgruppe
- **„Nennt alle Gründe" braucht Gründe je Form.** Passt keine Form einer Übung, nennt die Liste die
  Gründe der Grundform. Passt nur eine Variante zu Sportart und Alter (weil sie andere Altersgruppen
  trägt), nennt sie die Gründe dieser Variante
- **Die Startseite** trägt in ihrer Karte noch „Übungsdatenbank". Sie steht in der Tabelle von
  Abschnitt A und zieht mit
- **„Meine Übungen" vergisst Filter beim Zurück weiterhin**, wie heute. Für die Übungsdatenbank
  verlangt die Spec es anders. Beide gleich zu machen wäre ein eigener kleiner Schritt

### F) Reihenfolge beim Bauen

1. **Seite „Übungen" mit zwei Reitern und die Texte aus Abschnitt A.** Ohne Datenbank-Änderung;
   der Reiter „Übungsdatenbank" zeigt zunächst den Leerzustand „wird aufgebaut". Der Browser-Test
   aus PROJ-7 zieht mit
2. **Übungsdatenbank ansehen**: Liste, Filter, Leseansicht, Vorschau mit „Entwurf". Braucht die
   Migration und den Testblock
3. **Übernehmen**, einzeln und gesammelt, Vermerke an beiden Seiten
4. **„Passt zu Gruppe"** mit Vorauswahl und Gründen, zuerst der Umbau der Materialprüfung mit Tests
5. **Einstiege** (Leerzustände, Generator, Gruppenseite)
6. **Prüfprogramm** mit Tests für jede Prüfregel. Dabei fällt die Entscheidung über das
   Bearbeitungswerkzeug beim ersten echten Block

Danach beginnen die **Block-Sitzungen** (Abschnitt C2) — außerhalb der Skill-Schritte.

**Eine Migration**, rein hinzufügend: vier Tabellen der Übungsdatenbank und eine der Blöcke mit
ihren Leseregeln, drei Felder an der eigenen Übung, drei Funktionen. Angewendet über den
SQL-Editor des Dashboards.

### G) Pakete

- **`exceljs`**, nur als Entwicklungspaket, für das Prüfprogramm: liest die .xlsx-Tabellen. Kommt
  nicht in die App und nicht nach Vercel. (Das bekanntere Paket `xlsx` wird über npm nicht mehr
  gepflegt.)

Für die App selbst **keine neuen Pakete**.

### H) Was der Entwurf nicht beantwortet

- **Wer den Ordner mit den Blöcken sichert.** Außerhalb des Projekts hat er keine Versionsgeschichte
  und keine Kopie bei GitHub. Ein Cloud-Ordner oder ein eigenes privates Repository würde das lösen,
  das ist eine Entscheidung des Nutzers
- Ob 100 Übungen auf einmal übernehmen wirklich „wenige Sekunden" dauert, zeigt erst der Nachweis am
  lebenden System. Bei rund 300 Zeilen (Übungen, Varianten, Material) in einem Aufruf ist es zu
  erwarten
- Krabbelgruppe und Eltern-Kind: der Grundstock hat die Begriffe (Sportarten Krabbelgruppe und
  Eltern-Kind-Turnen, Altersgruppen 0–1 und 1–2). Technisch gibt es also kein Hindernis mehr. Ob
  sie zum Launch gehören, ist eine Inhaltsfrage

## Implementation Notes (Frontend)

**Stand:** 2026-10-18. **692 Unit-Tests grün** (652 plus 40 neue), Typprüfung, Lint (nur die
vier bekannten Bild-Warnungen) und Produktionsbuild sauber. Gebaut sind die Teile 1–5 aus „Reihenfolge
beim Bauen"; das Prüfprogramm (Teil 6) gehört zu `/backend`.

### Was gebaut ist

- **Seite „Übungen" mit zwei Reitern** (`/exercises`, Reiter in der Adresse) — „Meine Übungen" ist
  die bisherige Übersicht, unverändert in `my-exercises.tsx` umgezogen; die Reiterleiste folgt dem
  Muster der Verwaltung (`exercises-tabs.tsx`)
- **Reiter „Übungsdatenbank"** (`components/library/library-browser.tsx`): dieselbe Werkzeugleiste
  (ohne „Neue Übung" und ohne „noch zu ergänzen"), Sortierung „Zuletzt hinzugefügt" als
  Voreinstellung, Liste und Karten mit Ankästchen, Vermerken „Entwurf" / „Übernommen",
  „Übernehmen" bzw. „In Meine Übungen öffnen", „Alle auswählen", Auswahlleiste am unteren Rand.
  Filter, Sortierung und Gruppe stehen in der Adresse und werden ohne Serverrunde nachgeführt
- **„Passt zu Gruppe"**: Gruppenwahl, Hinweise „keine Halle" und „keine Teilnehmerzahl", je Übung
  ein Satz „Passt zur Gruppe" / „Passt mit der Variante …" / alle Gründe; Vorauswahl beim Wählen
  der Gruppe; ohne Gruppe Erklärung und „Gruppe anlegen"
- **Leerzustände mit Gründen**: Bestand im Aufbau, nicht erreichbar, Filter ohne Treffer (jeder
  Filterwert ohne Übung wird genannt, sonst „liegt an der Kombination"), Gruppe ohne Treffer
  (Sportart, Altersgruppe, beides, eigene Begriffe, „nur nicht zusammen"), „Alles Passende hast du
  schon übernommen"
- **Leseansicht** `/exercises/library/[id]`: die bestehende Detailansicht im Lesemodus, mit
  Quellenangabe, „Entwurf", „Übernehmen"; „Zurück zur Übungsdatenbank" führt in dieselbe Liste
- **Eigene Detailansicht**: „Aus der Übungsdatenbank übernommen am …" und Quellenangabe
- **Einstiege**: Leerzustand „Meine Übungen" und Generator verweisen in die Übungsdatenbank (der
  Generator mit der gewählten oder einzigen Gruppe); nach dem **Anlegen** einer Gruppe zeigt ihre
  Seite das Angebot (`?neu=1`, beim Bearbeiten nicht). Beides nur, wenn der Bestand nicht leer ist
- **Texte aus Abschnitt A** alle ersetzt, der Browser-Test aus PROJ-7 zieht mit

**Logik ohne Oberfläche, mit Tests** (`src/lib/library/`):

- `group-fit.ts` — „Passt zu Gruppe" über die Kandidaten und Kriterien des Generators. Dafür liefert
  die Materialprüfung des Generators jetzt die Fehlliste (`missingMaterials`); `materialsAvailable`
  ist „Liste leer". `matchesSports` ist dafür exportiert
- `filter-reasons.ts` — Gründe einer leeren Filterliste
- `address.ts` — Adresse lesen und schreiben; ein „Zurück"-Verweis wird immer aus gelesenen Werten
  neu gebaut, Unbekanntes fällt weg
- `selection.ts` — Vorauswahl, Auswählbarkeit, Schrumpfen der Auswahl

**Ein gemeinsamer Filter-Baustein** (`src/lib/exercises/filter-query.ts`): die Filter aus
`getExercises` herausgelöst; „Meine Übungen" und die Übungsdatenbank bauen ihre Abfrage darüber.
Material, Varianten und Links lesen beide über `src/lib/exercises/map-rows.ts`.

**Komponententest** `library-browser.test.tsx` mit nachgestellten Serverantworten: Vermerke,
Vorauswahl mit Gründen, Übernehmen in Listenreihenfolge, leere Zustände.

### Was erst mit `/backend` trägt

Die Serverwege sind geschrieben (`src/lib/actions/library.ts`), die Tabellen fehlen noch. Die
Datenbank-Typen sind **von Hand vorab eingetragen** (wie in PROJ-16) und legen fest, was die
Migration liefern muss:

- `library_blocks` (u. a. `preview_user_ids`), `library_exercises` (u. a. `key`, `block_id`,
  `status` mit `draft` / `released` / `withdrawn`, `first_released_at`, `source_credit`), dazu
  `library_exercise_materials`, `_variants`, `_links` — die Kindtabellen mit der Spalte
  **`exercise_id`**, wie bei den eigenen Übungen, damit der Filter-Baustein für beide gilt
- an `exercises`: `library_exercise_id`, `copied_at`, `source_credit`
- `copy_library_exercises(p_ids uuid[])` → JSON `{ copied, already, unavailable }`, je Eintrag
  `library_id`, `exercise_id` (nicht bei `unavailable`) und `name`; bei `unavailable` wird nichts
  geschrieben

Bis dahin sagt der Reiter „Die Übungsdatenbank ist gerade nicht erreichbar", und alle Einstiege
bleiben verborgen, weil der Bestand als leer gilt.

### Entscheidungen beim Bauen

- **Das Angebot nach dem Anlegen nennt beide Zahlen** *(vom Nutzer am 2026-10-18 entschieden,
  nach der ersten Fassung)*: „Zu dieser Gruppe passen 30 Übungen …" — alles, was zu Sportart und
  Alter passt und noch nicht übernommen ist — und darunter, wie viele davon der Generator sofort
  einplanen würde („23 davon …", „sie alle …" oder „für keine davon reicht im Moment das
  Material …"). Es erscheint damit auch, wenn der Halle für alles noch Material fehlt. Die erste
  Fassung zählte nur das sofort Einplanbare und schwieg in diesem Fall ganz
- **Filter wählen nicht ab** *(vom Nutzer am 2026-10-18 entschieden, nach der ersten Fassung)*:
  Was ein Filter ausblendet, bleibt ausgewählt; die Leiste sagt „23 ausgewählt, davon 18 gerade
  ausgeblendet", und übernommen werden alle — erst die sichtbaren in Listenreihenfolge, dann die
  ausgeblendeten. „Alle auswählen" / „Keine auswählen" wirkt nur auf die sichtbaren, „Auswahl
  aufheben" auf alle. Die erste Fassung wählte Ausgeblendetes ab, und es kam nach dem Entfernen des
  Filters nicht zurück — wer nur kurz hineinsah, verlor still seine Vorauswahl
- **Die Auswahl springt nur beim Wechsel der Gruppe um.** Dieselbe Gruppe noch einmal zu wählen
  rechnet nicht neu (die Auswahlliste meldet keine Änderung); dafür eine andere wählen oder neu laden
- **„Alle auswählen"** in der Zeile mit der Anzahl — für Edge Case 10 (alle 100 übernehmen)
- **Gründe je Übung**: die der Grundform; passt nur eine Variante zu Sportart und Alter, die dieser
  Variante (mit ihrem Titel davor)
- **Eine Gruppe aus der Adresse, die es nicht mehr gibt**: Hinweis, dann alle Übungen
- **Vorschau-Konten dürfen Entwürfe übernehmen** (Tech Design); die Leseansicht sagt bei einem
  Entwurf „nur in deiner Vorschau sichtbar"

### Nicht belegt

- **Die Liste der Übungsdatenbank im Browser** — ohne Tabellen nicht darstellbar. Angesehen sind
  bei 375 und 1280 px am Produktionsbuild: beide Reiter (Zustand „nicht erreichbar"), Startseite,
  Generator; nirgends waagerechtes Scrollen. Liste, Karten, Auswahlleiste und Leseansicht nur im
  Komponententest
- Das Angebot auf der Gruppenseite und der Weg aus dem Generator sind ungesehen
- **Die Browser-Tests sind nicht gelaufen** — gehören in `/qa`, auch PROJ-3 (die Übersicht ist
  umgezogen) und PROJ-7 (geänderter Text)

## Implementation Notes (Backend)

**Stand:** 2026-10-18. Migration `20261018200000_library_exercises.sql` mit ausdrücklicher Zustimmung
des Nutzers zu den neuen Zugriffsregeln im SQL-Editor angewendet, **Register 19 zu 19**. **709
Unit-Tests grün** (692 plus 17 neue für das Prüfprogramm), Typprüfung, Lint und Produktionsbuild
sauber. Ein Entwicklungspaket dazu: `exceljs` (wie im Entwurf abgenommen).

### Migration

- **Fünf Tabellen**: `library_blocks` (Name, Vorschau-Konten), `library_exercises` (Felder und Grenzen
  wie `exercises`, dazu Schlüssel, Block, Zustand `draft` / `released` / `withdrawn`,
  „zuerst freigegeben am", Quellenangabe) und die drei Kindtabellen für Material, Varianten, Links
- **Zugriffsregeln: je Tabelle eine Leseregel, nur für Angemeldete.** Freigegeben sehen alle,
  Entwürfe nur die Vorschau-Konten ihres Blocks, Zurückgezogenes niemand; einen Block nur seine
  Vorschau-Konten. Keine Schreibregel, zusätzlich die Schreibrechte für `anon` und
  `authenticated` entzogen
- **An `exercises`**: `library_exercise_id`, `copied_at`, `source_credit` und ein eindeutiger Index
  „je Nutzer höchstens eine Kopie je Übung"
- **`copy_library_exercises`** mit den Rechten des Nutzers, ganz oder gar nicht; Schon-Übernommenes
  wird übersprungen (auch gleichzeitig aus zwei Tabs, über den Index), Nicht-mehr-Sichtbares bricht
  ohne Schreiben ab
- **`import_library_block`** und **`release_library_block`** nur für den Dienstschlüssel

### Prüfprogramm (`npm run bestand`)

Anleitung in [scripts/library/README.md](../scripts/library/README.md). Befehle: `pruefen`,
`einlesen [--ja]`, `freigeben [--ja]`, `abdeckung`, `vorlage`, `zielgruppen-vorlage`, `testblock`.
Geschrieben wird nur mit `--ja`.

- **Prüfregeln** (`src/lib/library/import/parse.ts`): Grundstock-Begriffe in genauer Schreibweise
  (eine falsche wird gemeldet, mit der richtigen — nicht korrigiert), Material in kurzer
  Schreibweise mit „je TN", Pflicht für Sportart, Altersgruppe, Phase und Herkunft, im Hauptteil
  zwei Varianten oder eine Begründung, eindeutige Schlüssel, Varianten mit vorhandenem Schlüssel,
  fehlende oder falsch geschriebene Spaltenüberschriften. Danach **die Prüfung des Übungsformulars
  selbst** (`exerciseSchema`) — dieselben Grenzen. Jeder Fehler mit Blatt, Zeile und Spalte
- **Gegenüberstellung** (`diff.ts`): neu / Feld für Feld geändert (freigegebene markiert: „nach dem
  Einlesen sofort für alle sichtbar") / zurückgezogen / wieder aufgenommen / fehlt in der Tabelle /
  Schlüssel eines anderen Blocks
- **Abdeckung** (`coverage.ts`): je Zielgruppe aus einer Liste, die der Nutzer führt, gegen 3 / 5 / 3;
  Altersgruppen von Varianten zählen mit
- **Starter** `scripts/library/bestand.mjs` lädt das Programm über `runnerImport` von Vite (kommt mit
  Vitest) — so gelten die `@/`-Pfade der App ohne weiteres Paket

### Entscheidungen beim Bauen

- **Varianten auf eigenem Blatt**, Material in kurzer Schreibweise, Listen mit „;", Links als
  „Titel | Adresse" — wie im Entwurf; Blatt „Hinweise" in jeder Vorlage
- **Vorschau-Konten stehen als E-Mail-Adressen in der Tabelle**; das Programm löst sie auf und bricht
  bei einer unbekannten Adresse ab
- **„Zurückgezogen" nennt keinen Namen mehr**: die Datenbank darf eine zurückgezogene Übung dem
  Nutzer nicht mehr zeigen, also auch nicht ihren Namen. Die Oberfläche nennt ihn aus ihrer Liste
  (kleine Anpassung am Frontend)
- **Im Hauptteil wird nur gezählt, nicht beurteilt**: „eine leichtere und eine schwerere Variante"
  prüft das Programm als „mindestens zwei Varianten oder eine Begründung" — ob sie wirklich leichter
  und schwerer sind, bleibt der Abnahme des Blocks
- **Eine zurückgezogene Zeile** braucht nur ihren Schlüssel; ihr übriger Inhalt wird nicht geprüft

### Testblock

`tests/fixtures/uebungsdatenbank-testblock.xlsx` (erzeugt mit `npm run bestand -- testblock`), Block
„E2E-Testblock (nie freigeben)", fünf erfundene Übungen, **als Entwurf eingelesen, nur das Testkonto
sieht sie**. Er deckt ab: passt ohne Material, scheitert an Material und passt mit Variante,
scheitert an der Teilnehmerzahl, trägt Quellenangabe und Link, andere Sportart. Ein zweites
„prüfen" meldet „Unverändert: 5" — Datenbank und Tabelle stimmen Feld für Feld überein.
**Der Testblock wird nie freigegeben.**

### Nachweis am lebenden System

Zwanzig Fälle in einer zurückgerollten Transaktion, alle bestanden, nichts zurückgeblieben:
Freigabe zählt richtig; Zurückziehen nur per Markierung; fremder Schlüssel bricht das Einlesen ab;
ein normales Konto sieht nur Freigegebenes — kein Material eines Entwurfs, keinen Block; Schreiben in
den Bestand und Einlesen für Nutzer gesperrt; Übernehmen kopiert Material, beide Varianten (auch
„Ohne Material" und abweichende Altersgruppe), Link und Quellenangabe, Arbeitsnotiz leer, keine eigene
Kategorie; zweites Übernehmen legt keine zweite Kopie an, auch ein direktes Einfügen nicht; Entwurf
für ein normales Konto nicht übernehmbar, gesammelt mit Zurückgezogenem nennt es beide und schreibt
nichts; das Vorschau-Konto sieht Entwurf und Blöcke und darf übernehmen, fremde Kopien nicht; `anon`
sieht nichts und kann nicht übernehmen; eine Korrektur am Freigegebenen bleibt freigegeben, die
veränderte Kopie des Nutzers unverändert; Neues in einem freigegebenen Block kommt als Entwurf; eine
zweite Freigabe ändert das Datum der ersten nicht. `get_advisors` meldet weiter nur den bekannten
Hinweis zum Passwortschutz.

**Im Browser angesehen** (Produktionsbuild, Testkonto, vorübergehende Testgruppe mit Halle ohne
Bock und ohne Yoga-Matte, 18 Teilnehmer, danach weggeräumt): die Liste mit „Entwurf"; „Passt zu
Gruppe" mit zwei vorausgewählten und den Sätzen „Passt zur Gruppe", „Passt mit der Variante ‚Ohne
Bock (leichter)'", „für 4–12 Teilnehmer, die Gruppe hat 18", „In ‚E2E4 Halle' fehlt: Yoga-Matte";
die Volleyball-Übung fehlt zu Recht; Leseansicht ohne Bearbeiten/Löschen, mit Quelle, „Zurück" in
dieselbe gefilterte Liste; Übernehmen → „Übernommen", Auswahlleiste schrumpft um die Kopie; die Kopie
trägt „Aus der Übungsdatenbank übernommen am 18. Oktober 2026"; das Angebot auf der Gruppenseite
„passen 3 Übungen … 1 davon kann der Generator sofort einplanen". 375 und 1280 px, nirgends
waagerechtes Scrollen. Dabei behoben: „1 ausgewählt" brach am Handy um.

### Nicht belegt

- **„Kopie löschen, dann neu übernehmen"** am lebenden System — der Block mit `DELETE` wird vom
  Werkzeug abgelehnt, auch zurückgerollt (wie in PROJ-14). Der eindeutige Index gilt nur für
  vorhandene Zeilen; im Browser in `/qa` nachzuholen
- **Zwei gleichzeitige Übernahmen** — über den Index und `ON CONFLICT` gelöst, aber nicht gleichzeitig
  ausgelöst
- Die **Leistung bei 100 Übungen** und das **Übernehmen von 100 auf einmal** — der Testblock hat fünf
- **Die Browser-Tests sind nicht gelaufen** (Entwicklungsserver lief nebenher)

### Für `/deploy` vorgemerkt, unabhängig von PROJ-4

`npm audit --omit=dev` meldet sechs Funde in den Paketen der App (einer „kritisch" in `next`,
Image-Optimierung). Sie bestanden schon vor PROJ-4. `exceljs` bringt einen mittleren Fund in `uuid`
mit — nur im Prüfprogramm, nicht in der App.

## QA Test Results

**Getestet:** 2026-10-19, Stand Commit `bbd81cf` plus die Tests dieser QA
**Umgebung:** Produktionsbuild auf Port 3100, Edge (Chromium) am Rechner und in Handybreite
(iPhone 13, Chromium-Motor), Testkonto (Vorschau-Konto des Testblocks), dazu Prüfungen am
lebenden System unter den Rollen `authenticated` und `anon`
**Tester:** QA Engineer (AI)

### Überblick
- **Akzeptanzkriterien:** 53 von 57 bestanden, **1 nicht bestanden** (BUG-31), 1 erst mit dem
  ersten echten Block prüfbar, 2 entfallen für die Prüfung der App (Vorgaben an die Arbeit je
  Block)
- **Fehler:** 5 — 0 kritisch, 0 hoch, 1 mittel, 4 niedrig
- **Sicherheit:** kein Befund; ein Hinweis ohne Handlungsbedarf (siehe unten)
- **Regression:** in der Nacht nur zum Teil belegt (siehe „Regression" unten). *Am Morgen nach der
  Behebung von BUG-31 nachgeholt: **568 von 568 Browser-Tests grün in einem Zug** (20,1 Minuten,
  zwei Arbeiter) — keine Regression*
- **Leistung:** erfüllt — 105 Übungen in 1,3–1,5 s („Meine Übungen" 1,6–2,0 s), 100 Übungen auf
  einmal übernommen in 0,3 s
- **Bereit für die Auslieferung:** ja — kein kritischer oder hoher Fehler

**Neue Browser-Tests:** `tests/PROJ-4-starter-datenbank.spec.ts`, 49 Tests je Rechner und Handy,
als eigene Stufe „uebungsdatenbank" und danach „uebungsdatenbank mobil", nach dem Grundstock und
vor „exklusiv". Die Tests legen Kopien in „Meine Übungen" an und räumen für die Leerzustände den
Grundbestand zeitweise weg (und bauen ihn im `finally` wieder auf) — das darf neben keinem anderen
Feature laufen. Zwei davon (BUG-32, BUG-34) sind als erwartete Fehlschläge markiert und stellen die
Befunde nach. Dazu `tests/PROJ-4-starter-datenbank.anon.spec.ts` (2 Tests ohne Anmeldung, Stufe
„abgemeldet"). Der Testblock wird dabei **nie freigegeben**: wo ein Test ihn verändert (Name,
Zustand, Datum „zuerst freigegeben", Vorschau-Konten), stellt er ihn im `finally` wieder her.

Alle Fehlschläge beim Schreiben der Tests lagen an den Tests, nicht an der App — mit einer
Ausnahme, aus der BUG-31 wurde: gerade Anführungszeichen statt der typografischen der App, die
doppelt im Seitenbaum stehende Meldung (sichtbar und als Ansage), „Öffnen" trifft auch „In Meine
Übungen öffnen", die Materialfolge (richtig ist die des Grundstocks: „Turnmatte" vor „Bock"), und
zwei Seiten im selben Browser-Kontext, die beim Laden hängen blieben.

**Neuer Unit-Test:** `filter-reasons.test.ts` — ein Teilnehmer-Filter ohne Treffer (BUG-33), als
erwarteter Fehlschlag plus dem heutigen Verhalten. **Unit-Tests: 710 grün, 1 erwarteter
Fehlschlag** (709 vor der QA plus 2 neue). Zu Beginn liefen alle in 13 s; am Ende der Nacht nur
noch mit einem Arbeitsprozess, und zwei Komponententests (`library-browser`, `unit-config-form`)
rissen dabei die Grenze von 5 s — mit 30 s Grenze beide grün.

Legende: **E2E** = im Browser ausgeführt, **Unit** = über Unit-Tests, **Code** = nur am Code
gelesen, **Live** = am lebenden System, **Skript** = eigenes Prüfskript gegen das lebende System
bzw. den Testserver (nicht Teil der Suite).

### A. Seite „Übungen" mit zwei Reitern und neue Namen
- [x] „Übungen" öffnet mit „Meine Übungen" und der bisherigen Übersicht (E2E)
- [ ] **BUG-31:** Reiter „Übungsdatenbank" — mit Abwarten des Ladens: Bestand, Adresse, Neuladen,
  Zurück und Vorwärts landen im richtigen Reiter (E2E). Fällt der Klick aber in das Laden von
  „Meine Übungen", wechselt nur die Adresse (Skript: 4 von 5 Läufen)
- [x] Leseansicht → „Zurück zur Übungsdatenbank" und Zurück-Knopf des Browsers: dieselbe Suche,
  dieselbe Trefferzahl (E2E)
- [x] Karte der Startseite heißt „Übungen" (E2E)
- [x] Kein „deine Übungsdatenbank" / „deine Datenbank" mehr im Code der Oberfläche (Code, Suche
  über `src/`); Generator-Einleitung „aus deinen Übungen" (E2E); die Texte der Nachfragen im
  Editor über den mitgezogenen Browser-Test von PROJ-7 (E2E)
- [x] Am Handy beide Reiter nebeneinander, kein waagerechtes Scrollen (E2E)

### B. Die Übungsdatenbank durchsehen
- [x] Alle sichtbaren Übungen mit Anzahl („5 Übungen"), dieselbe Übungszeile wie in „Meine
  Übungen"; auch in der Kartenansicht mit Auswählen, Vermerken und „Übernehmen" (E2E)
- [x] Filter (Sportart, Phase) und Suche mit Trefferzahl (E2E)
- [x] „Zuletzt hinzugefügt" ist Voreinstellung und sortiert nach dem Freigabedatum (E2E — das
  Datum wird gesetzt, der Testblock nicht freigegeben)
- [x] Leseansicht mit Beschreibung, Metadaten, Material, Varianten, Links, Vermerk „Entwurf" —
  ohne Bearbeiten und Löschen (E2E). Anmerkungen trägt keine Testübung; sie laufen über dieselbe
  Detailansicht wie bei eigenen Übungen (Code)
- [x] Quellenangabe sichtbar (E2E)
- [x] Filter ohne Treffer nennt den Grund („Für „Fußball" gibt es … noch keine Übungen"), dazu
  „Filter zurücksetzen" (E2E). Lücke beim Teilnehmer-Filter: BUG-33
- [x] Ohne Anmeldung zur Anmeldung, Reiter und Leseansicht (E2E)

### C. Einzeln übernehmen
- [x] Vollständige Kopie (2 Materialzeilen, 2 Varianten, Arbeitsnotiz leer), Meldung mit „Öffnen"
  zur Kopie (E2E); Link und Quellenangabe gehen mit (E2E)
- [x] „Aus der Übungsdatenbank übernommen am …" auf der Kopie; Bearbeiten über den Assistenten
  speichert und lässt Vermerk und „Übernommen" stehen; Löschen funktioniert (E2E)
- [x] Der Generator plant übernommene Übungen ein (E2E: alle drei Phasen aus Kopien gefüllt).
  Varianten der Kopie werden wie bei jeder eigenen Übung behandelt (Code)
- [x] Korrektur am Bestand lässt die Kopie unverändert, „Übernommen" bleibt (E2E)
- [x] „Übernommen" + „In Meine Übungen öffnen", kein „Übernehmen", Ankästchen gesperrt — auch
  nach dem Neuladen (E2E)
- [x] Kopie gelöscht → Vermerk weg, neu übernehmen legt eine neue Kopie an (E2E; bisher unbelegt)
- [x] Gleicher Name wie eine eigene Übung: übernommen, mit Hinweis „zwei Übungen namens …" (E2E)
- [x] Keine eigene Kategorie entsteht (E2E, Zählung vorher/nachher)
- [x] Abgebrochene Verbindung: „Nichts übernommen", keine Kopie, Knopf wieder bedienbar (E2E).
  Ein Fehler des Servers läuft über denselben Meldungsweg (Code)

### D. Gesammelt übernehmen und „Passt zu Gruppe"
- [x] Leiste mit „2 ausgewählt", „Übernehmen", „Auswahl aufheben" (E2E)
- [x] Gesammelt übernommen, Meldung „2 Übungen übernommen" mit „Zu Meine Übungen" (E2E)
- [x] Fehlschlag mittendrin: keine übernommen, Auswahl bleibt (E2E)
- [x] Gruppen wählbar, dazu „Keine Gruppe — alle Übungen" (E2E)
- [x] Nur Passendes („4 Übungen passen …", die Volleyball-Übung fehlt), vorausgewählt genau das
  Einplanbare (E2E)
- [x] Fehlendes Material mit Halle („In „E2E4 Halle" fehlt: Yoga-Matte"); zu wenig mit Bedarf und
  Bestand („Turnmatte (2 nötig, 1 da)") (E2E)
- [x] Teilnehmerzahl mit Grenze und Zahl der Gruppe („für 4–12 Teilnehmer, die Gruppe hat 18") (E2E)
- [x] Grundform scheitert, Variante passt: vorausgewählt, „Passt mit der Variante „Ohne Bock
  (leichter)"" (E2E)
- [x] Mehrere Gründe in einem Satz (Material · Teilnehmer) (E2E)
- [x] Gruppe ohne Halle: Hinweis oben, kein Materialabgleich (E2E)
- [x] Genau die eigene Auswahl wird übernommen (E2E); ein Filter wählt nicht ab, die Leiste sagt
  „davon 1 gerade ausgeblendet", übernommen wird alles Angekreuzte (E2E)
- [x] Ohne Gruppe: Erklärung und „Gruppe anlegen" (E2E)
- [x] Leere Liste mit jedem Grund: Sportart und Altersgruppe zugleich genannt (E2E)
- [x] „Alles Passende hast du schon übernommen" — auch nach dem Neuladen (E2E). Erscheint aber
  auch, wenn nur ein Filter das noch nicht Übernommene ausblendet: BUG-32
- [x] Am Handy bleibt die Leiste im Bild, auch nach dem Scrollen, kein waagerechtes Scrollen (E2E)

### E. Einstiege
- [x] Leerzustand „Meine Übungen" bietet „Aus der Übungsdatenbank übernehmen" (E2E)
- [x] Generator ohne Übungen: Erklärung, Knopf „Zur Übungsdatenbank", kein „in Vorbereitung" (E2E)
- [x] … und „Passt zu Gruppe" ist mit der gewählten Gruppe gesetzt (E2E); mit der einzigen Gruppe,
  wenn keine gewählt ist (Code)
- [x] Neue Gruppe über das Formular angelegt → „Zu dieser Gruppe passen 4 Übungen …", „Ansehen"
  setzt „Passt zu Gruppe" (E2E)
- [x] Kein Angebot, wenn nichts passt oder alles übernommen ist (E2E)
- [x] Kein Angebot nach dem Bearbeiten einer Gruppe (E2E)

### F. Der Bestand
- [x] Nur Begriffe des Grundstocks, jede Abweichung mit Zeile und Feld (Unit `import.test.ts`;
  Live aus `/backend`)
- [x] Zählung je Zielgruppe gegen 3 / 5 / 3 (Unit `coverage.ts`)
- [ ] *Erst mit dem ersten echten Block prüfbar:* abgedeckte Zielgruppe → Einheit ohne offene Lücke.
  Der Testblock ist dafür zu klein (eine Übung je Phase)
- [x] Hauptteil mit zwei Varianten oder Begründung (Unit) — ob sie wirklich leichter und schwerer
  sind, bleibt der Abnahme des Blocks (so im Backend entschieden)

### G. Pflege des Bestands
- [x] Fehlerhafter Block: nichts eingelesen, jeder Fehler mit Zeile und Feld (Unit)
- [x] Ein normales Konto sieht keinen Entwurf — weder Übung noch Material, Varianten, Links oder
  Block (Live, Rolle `authenticated` mit dem Konto des Nutzers)
- [x] Das Vorschau-Konto sieht Entwürfe mit „Entwurf" und kann „Passt zu Gruppe" damit ausprobieren
  (E2E)
- [x] Freigabe macht sichtbar und setzt das Datum (Live aus `/backend`); die Sortierung danach (E2E)
- [x] Korrektur am Freigegebenen: Kopie unverändert, „Übernommen" bleibt (E2E und Live)
- [x] Zurückgezogen: aus der Liste weg, die Kopie bleibt (Live aus `/backend`; E2E über Edge 2 und 3)

### H. Urheberrecht
- [x] Herkunft ist Pflicht beim Einlesen (Unit)
- [x] Die Quellenangabe geht beim Übernehmen mit (E2E)
- [ ] *Entfällt für die App:* Vermerk „nur kleiner Teil einer Quelle" — Vorgabe an die Arbeit je
  Block
- [ ] *Entfällt für die App:* keine Bilder, keine wörtlichen Passagen — Bilder kann der Bestand
  technisch nicht tragen (keine Spalte); wörtliche Passagen sind Abnahme je Block

### Edge Cases
- [x] **1 — zwei Tabs:** nur eine Kopie; drei gleichzeitige Aufrufe ergaben eine Kopie und zweimal
  „schon übernommen" (Skript). Die Seite des zweiten Tabs sagt „Schon übernommen" mit Link (E2E,
  die Kopie des anderen Tabs nebenher angelegt)
- [x] **2 — zurückgezogen beim Ansehen:** „gibt es nicht mehr", nichts angelegt (E2E)
- [x] **3 — gesammelt mit Zurückgezogenem:** nichts übernommen, die Übung genannt, der Rest bleibt
  ausgewählt und lässt sich übernehmen (E2E)
- [x] **4 — Kopie bearbeitet, Bestand korrigiert** (E2E, siehe C)
- [x] **5 — Kopie gelöscht:** neu übernehmen legt eine neue Kopie an (E2E). Der Platzhalter in der
  Einheit ist das Verhalten aus PROJ-3 (Code)
- [x] **6 — Gruppe ändert sich in einem anderen Tab:** die Vorauswahl springt nicht um (Code)
- [x] **7 — nur eigene Begriffe:** genau das wird als Grund genannt (E2E)
- [x] **8 — Halle ohne Material:** nur die Übung ohne Material ist vorausgewählt (E2E)
- [x] **9 — „pro Teilnehmer" ohne Teilnehmerzahl:** gilt als passend, Hinweis oben (E2E)
- [x] **10 — 100 auf einmal:** 100 Übungen in einem Aufruf in 0,3 s, mit allen 200 Material- und
  200 Variantenzeilen; ein zweiter Aufruf legt nichts doppelt an; 93 über die Oberfläche in 1,4 s
  (Skript, vorübergehender Entwurfsblock nur für das Testkonto, danach restlos entfernt)
- [x] **11 — leerer Bestand:** „wird gerade aufgebaut", kein „Übernehmen" (E2E)
- [x] **12 — zu langer Name:** wird beim Einlesen abgewiesen (Unit)
- [x] **13 — Entwurf über erratene Adresse:** 404 (E2E), nicht übernehmbar (Live)

### Sicherheit (Red Team)
Am lebenden System in einer zurückgerollten Transaktion, unter `authenticated` mit dem Konto des
Nutzers (kein Vorschau-Konto), unter `anon` und unter dem Testkonto — alles wie entworfen:
- [x] Normales Konto sieht 0 Übungen, 0 Material-, Varianten-, Linkzeilen, 0 Blöcke des Entwurfs
- [x] Normales Konto kann einen Entwurf nicht übernehmen (`unavailable`, nichts geschrieben)
- [x] Schreiben in den Bestand: `permission denied` (UPDATE, INSERT); `import_library_block` und
  `release_library_block`: `permission denied`
- [x] Eine Übung in ein fremdes Konto schreiben: von der Zugriffsregel abgewiesen
- [x] `anon` sieht nichts und darf `copy_library_exercises` nicht aufrufen
- [x] Übernehmen: doppelte Kennungen im Aufruf ergeben eine Kopie; leere Liste ohne Wirkung;
  501 Kennungen abgewiesen
- [x] Ohne Anmeldung leiten Reiter und Leseansicht zur Anmeldung (E2E)
- [x] Eingaben: Namen und Quellenangaben werden als Text gerendert, Links nur `http(s)://`
  (Datenbank-Bedingung) — kein Weg für Skript-Einschleusung (Code)
- [x] `get_advisors`: nur der bekannte Hinweis zum Passwortschutz

**Hinweis ohne Handlungsbedarf:** Ein Nutzer kann über die Schnittstelle an einer **eigenen** Übung
`library_exercise_id` auf eine beliebige Kennung setzen. Die Fremdschlüsselprüfung läuft ohne
Zugriffsregeln, also verrät sie, ob eine Kennung im Bestand existiert — auch bei Entwürfen und
Zurückgezogenem. Wer das nutzen wollte, müsste eine zufällige UUID erraten; zu sehen bekommt er
dadurch nichts, und die Wirkung bleibt im eigenen Konto (die Übung gilt dort als „übernommen").

### Fehler

#### BUG-31: Ein Klick, der in das Laden einer Übungsliste fällt, geht verloren
*Am 2026-10-19 behoben — siehe „Nach der QA behoben" unten.*
- **Schwere:** mittel
- **Schritte:**
  1. „Übungen" öffnen und sofort, während „Meine Übungen" noch lädt, auf „Übungsdatenbank" tippen
  2. Erwartet: der Reiter wechselt
  3. Tatsächlich: nur die Adresse wechselt auf `tab=library`; Reiter und Inhalt bleiben bei „Meine
     Übungen". Erst ein zweiter Tipp wirkt (Skript: 4 von 5 Läufen, wenn der Klick in die laufende
     Server-Aktion fällt)
- **Auch:** Verlassen der Übungsdatenbank, während sie lädt — ein Klick auf „Gruppen" blieb in
  1 von 5 Läufen wirkungslos; im Browser-Test zeigte „Gruppe anlegen" die neue Seite, während die
  Adresse 15 s lang bei `/exercises?tab=library` stand. Von „Meine Übungen" weg ging dagegen kein
  Klick verloren (8 von 8)
- **Vermutete Ursache:** beide Reiter holen ihre Liste mit einer Server-Aktion aus dem Browser
  (`getExercises`, `getLibrary`); eine Navigation, die währenddessen startet, wird verworfen
- **Warum mittel:** es ist der Weg in das neue Feature, und am Handy ist das Ladefenster deutlich
  länger als hier am Rechner. Ein zweiter Tipp hilft
- **Priorität:** vor der Auslieferung beheben oder bewusst hinnehmen

#### BUG-32: „Alles Passende hast du schon übernommen" bei nur ausgeblendeten Übungen
- **Schwere:** niedrig
- **Schritte:** eine passende Übung übernehmen, „Passt zu Gruppe" wählen, nach dieser einen Übung
  suchen → der Satz erscheint, obwohl drei passende Übungen nicht übernommen, nur ausgeblendet sind
- **Ursache:** der Satz rechnet mit der sichtbaren Liste
- **Test:** als erwarteter Fehlschlag in der Suite
- **Priorität:** im nächsten Durchgang

#### BUG-33: Ein Teilnehmer-Filter ohne Treffer wird als „liegt an der Kombination" erklärt
- **Schwere:** niedrig
- **Schritte:** in der Übungsdatenbank nur „ab 20 Teilnehmern" filtern, wenn alle Übungen für
  weniger sind → „Jeder Filter hat für sich Treffer, aber keine Übung erfüllt alle zugleich" — es
  ist aber nur ein Filter gesetzt, und der Grund ist die Teilnehmerzahl
- **Ursache:** `explainEmptyFilters` kennt die Teilnehmerfilter nicht. Widerspricht der Regel, dass
  leere Ergebnisse jeden Grund nennen
- **Test:** Unit, als erwarteter Fehlschlag. Im Browser mit dem Testblock nicht nachstellbar
- **Priorität:** im nächsten Durchgang

#### BUG-34: „1 Übung passen zu Sportart und Alter"
- **Schwere:** niedrig (Text)
- **Schritte:** „Passt zu Gruppe" mit genau einem Treffer → „1 Übung passen …" statt „passt"
- **Test:** als erwarteter Fehlschlag in der Suite
- **Priorität:** im nächsten Durchgang

#### BUG-35: Gemischte Anführungszeichen in den Meldungen
- **Schwere:** niedrig (Text)
- **Beobachtung:** manche Sätze enden mit dem geraden Zeichen („E2E Fangspiel" hattest du schon
  übernommen, die Gründe an den Übungen), andere mit dem typografischen („E2E Bockspringen“ steht
  jetzt in „Meine Übungen“, die Hinweise zu Halle und Teilnehmerzahl). Im übrigen Programm ist
  das gerade Zeichen üblich
- **Priorität:** schön zu haben

### Regression
Der Gesamtlauf aller Stufen wurde gestartet und **abgebrochen**: ab etwa 1 Uhr nachts war der
Rechner so ausgebremst, dass seine Ergebnisse nichts mehr aussagten. Belegt:
- Die Bausteine der Seite (`/_next/static/chunks/…`) hingen im Browser über 20 s, während derselbe
  Server sie `curl` in 0,2 s auslieferte; daraus wurde in Handybreite „Application error" auf
  `/exercises`. Allein und mit einem Arbeiter geladen: kein Absturz
- Supabase antwortete mit 0,55–0,7 s statt 0,23 s; ProtonVPN lief
- Playwright brauchte zum Starten für drei kurze Tests rund 14 Minuten
- Vitest brach ab, weil seine Arbeitsprozesse nicht rechtzeitig starteten („Timeout waiting for
  worker to respond") — um 00:18 liefen dieselben Unit-Tests **709 von 709 in 13 s**
- Der Prozessor war dabei kaum belastet (2 %)

Gezielt und nacheinander mit einem Arbeiter gelaufen, was PROJ-4 am stärksten berührt:
- **PROJ-4 am Rechner 49 von 49** (in zwei Durchgängen; fünf Tests nach Korrektur der Tests
  einzeln nachgelaufen)
- **PROJ-4 in Handybreite 49 von 49** in einem Zug
- **PROJ-3 an Rechner und Handy 26 von 26** — ein Test (Liste der eigenen Übungen) kam im Lauf
  nicht binnen 15 s an, einzeln dreimal grün
- **Alle Tests ohne Anmeldung 18 von 18**, darunter die zwei neuen

**Offen und vor `/deploy` nachzuholen:** PROJ-5, PROJ-6, PROJ-7, PROJ-14, PROJ-16, PROJ-19 und
„exklusiv". Kein anderer Browser-Test prüft einen der Texte, die PROJ-4 geändert hat (gesucht);
Regressionsrisiko steckt aber in zwei umgebauten Bausteinen: dem gemeinsamen Filter (PROJ-19,
„Ohne Material" in „Meine Übungen") und der Materialprüfung des Generators, die jetzt die Fehlliste
liefert (PROJ-6, PROJ-7, PROJ-16). Beide sind durch ihre Unit-Tests abgedeckt.

### Weitere Beobachtungen (kein Fehler)
- Das Angebot auf der Gruppenseite steht weiter da, wenn man die Seite direkt nach dem Anlegen neu
  lädt (`?neu=1` bleibt in der Adresse)
- Die Browser-Tests dieser Stufe brauchen hier 10–50 s je Test (Start des Browser-Kontexts unter
  dem Virenscanner); die beiden Stufen zusammen rund eine Dreiviertelstunde

### Nicht belegt
- **Firefox und echtes Safari** — auf diesem Rechner nicht prüfbar
- **Abdeckung → Einheit ohne Lücke** (F.3) — erst mit dem ersten echten Block
- **Freigabe im Browser** — der Testblock wird nie freigegeben; „Zuletzt hinzugefügt" ist über
  das gesetzte Datum geprüft, die Freigabe selbst am lebenden System im `/backend`
- **Gruppe in einem anderen Tab geändert** (Edge 6) — nur am Code

## Nach der QA behoben

### BUG-31 (2026-10-19, `/frontend`)

**Die Ursache liegt im Router von Next.js 16.1.1, nicht im Ablauf der App.** Am Quelltext des
Routers nachgelesen (`app-router-instance.js`): Server-Aktionen stehen in einer Warteschlange.
Eine Navigation verwirft die gerade laufende Aktion und läuft sofort los. Kommt die verworfene
Aktion zurück, *bevor* die Navigation fertig ist, rückt die Schlange trotzdem weiter und startet
die nächste wartende Aktion — mit dem **alten** Seitenstand als Ausgang. Ist die Navigation fertig
und kommt danach diese Aktion zurück, setzt sie den alten Seitenstand wieder ein: neue Adresse,
alter Inhalt. „Meine Übungen" startete beim Laden zwei Server-Aktionen (Liste und eigene
Kategorien) — deshalb verlor gerade der Reiterwechsel so oft.

**Behoben, indem die Seite „Übungen" nicht mehr über Server-Aktionen liest:**
- Die beiden Listen kommen über gewöhnliche Abfragen, die nicht in der Warteschlange des Routers
  stehen: `GET /api/exercises` („Meine Übungen") und `GET /api/library` („Übungsdatenbank" samt
  „Passt zu Gruppe"). Beide rufen dieselben Serverfunktionen wie vorher (`getExercises`,
  `getLibrary`); Anmeldung und Zugriffsregeln wirken unverändert dort
- Die Abfragen tragen dieselbe Adresskodierung wie die Seite (`address.ts`: die Filter aus
  `parseLibraryParams` und `libraryQuery` herausgelöst; neu `exerciseListQuery` und
  `parseExerciseListQuery` für Sortierung und Seite, Anzahl höchstens 100). Werte aus der Adresse
  werden wie bisher misstrauisch gelesen; „noch zu ergänzen" gilt nie für die Übungsdatenbank
- Die eigenen Kategorien von „Meine Übungen" kommen mit der Seite vom Server statt per
  Server-Aktion nach dem Laden
- Ein überholtes Laden wird abgebrochen (neuer Filter, Verlassen der Seite)
- **Neu dabei:** scheitert das Laden von „Meine Übungen", steht dort „Deine Übungen ließen sich
  gerade nicht laden" mit „Erneut versuchen" — vorher erschien still der Leerzustand „Noch keine
  Übungen"; beim Nachladen („Mehr laden") sagt es eine Meldung
- Server-Aktionen bleiben fürs Ändern: Übernehmen und Löschen

**Nachgeprüft:** mit denselben Nachstell-Skripten wie in der QA, mitten ins Laden geklickt —
Reiterwechsel **8 von 8** (vorher 4 von 5 verloren), Klick auf „Gruppen" aus der ladenden
Übungsdatenbank **8 von 8** (vorher 1 von 5 verloren). Die Browser-Tests klicken jetzt bewusst
sofort (Reiter, „Gruppe anlegen") und bewachen den Fehler damit. **713 Unit-Tests grün**, 1
erwarteter Fehlschlag (BUG-33); 3 neu für die Kodierung der Liste; der Komponententest der
Übungsdatenbank stellt jetzt die Abfrage statt der Server-Aktion nach. Typprüfung, Lint und
Produktionsbuild sauber.

**Gesamtlauf danach, am Morgen des 2026-10-19 auf wieder schnellem Rechner: 568 von 568
Browser-Tests grün in einem Zug** (20,1 Minuten, zwei Arbeiter, kein Entwicklungsserver) — alle
Stufen von PROJ-3 bis PROJ-19, beide Stufen von PROJ-4 und „exklusiv". Damit ist die Regression
nachgeholt, die in der Nacht ausfiel. Erwartete Fehlschläge darin: BUG-27 (PROJ-16), BUG-32 und
BUG-34 (PROJ-4).

**Nicht behoben, nur festgestellt:** dieselbe Eigenheit des Routers trifft jede Stelle, die beim
Laden per Server-Aktion liest und neben der eine Navigation möglich ist. Auf der Seite „Übungen"
ist das jetzt ausgeräumt; anderswo (etwa der Hinweis zur Verwendung im Löschdialog, die
Kandidatenliste im Editor) ist es nicht untersucht.

## Deployment
_To be added by /deploy_
