---
name: gottago
description: Sitzung in Sekunden übergabefähig machen — auch spontan und während Prozesse weiterlaufen. Sichert den Stand in einer Übergabedatei, gibt einen Prompt für die nächste Sitzung aus und ein kurzes Briefing darüber, was vorgekehrt wurde und was im Hintergrund weiterläuft. Nutze es, wenn der Nutzer weg muss ("muss weg", "gotta go", "Sitzung beenden", "Feierabend").
argument-hint: "optional: verbleibende Zeit, z.B. 'sofort', '2 min'"
user-invocable: true
---

# Notübergabe

## Rolle

Du machst die laufende Sitzung in möglichst kurzer Zeit so übergabefähig, dass
die **nächste** Sitzung — mit kaltem Cache, ohne jeden Gesprächsverlauf —
nahtlos weiterarbeiten kann. Der Nutzer muss weg. Jede Sekunde, die du jetzt
verbrauchst, ist eine Sekunde, die er wartet.

**Die Grundhaltung:** Nicht abwürgen, sondern festhalten. Laufende Prozesse
dürfen weiterlaufen. Was nicht fertig wird, wird **aufgeschrieben**, nicht
abgebrochen.

## Zeitbudget (bindend)

| Argument | Budget | Was du tust |
|---|---|---|
| `sofort` | **~20 Sekunden** | Nur Schritt 1 und 3 (Lage + Übergabedatei), dann Ausgabe. Kein Commit, kein Zeiger, keine Nacharbeit |
| kein Argument | **~60–90 Sekunden** | Schritte 1 bis 6 vollständig |
| `2 min`, `5 min` … | die genannte Zeit | Vollständig, plus Nacharbeit aus der Triage, solange das Budget reicht |

Überschreitest du das Budget, **brich die Nacharbeit ab** und sag es im
Briefing. Eine Übergabe, die zu spät kommt, ist keine Übergabe.

## Schritt 1 — Lage aufnehmen (alles parallel, nur lesend)

In **einer** Antwort, damit es gleichzeitig läuft:

```bash
git status --short && git log --oneline -5 && git status -sb | head -2
git diff --stat && git diff --cached --stat
```

Dazu aus dem eigenen Gesprächsverlauf zusammentragen — das steht in keiner
Datei und ist genau das, was sonst verloren geht:

- **Laufende Hintergrundprozesse:** Task-ID, was sie tun, **absoluter** Pfad
  der Ausgabedatei, geschätzte Restzeit **mit Begründung**
- **Offene Fragen an den Nutzer**, die noch nicht beantwortet sind
- **Entscheidungen**, die in dieser Sitzung gefallen sind und sich aus dem Code
  nicht ergeben (samt Begründung — die ist das Wertvolle)
- **Was bereits ausgeschlossen wurde**, damit die nächste Sitzung es nicht
  erneut untersucht
- **Fallen**, über die du gestolpert bist

Hintergrundprozesse zusätzlich auf Lebendigkeit prüfen, das kostet nichts:

```bash
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Select-Object ProcessId,CreationDate,CommandLine | Format-List"
```

> **Warum diese Prüfung:** Ein Prozess, den du für laufend hältst, kann seit
> Stunden hängen — und hängende Prozesse haben in diesem Projekt schon einmal
> eine ganze Fehlersuche in die falsche Richtung geschickt. Lieber einmal
> nachsehen als es der nächsten Sitzung als Tatsache verkaufen.

## Schritt 2 — Triage: jetzt noch oder später?

Entscheide nach **einem** Maßstab: *Ist es in Sekunden erledigt und geht es
sonst verloren?*

**Jetzt noch erledigen** (nur das):

- Die Übergabedatei schreiben — immer, auch bei `sofort`
- Eine Änderung zu Ende schreiben, die den Code **gerade kaputt** hinterlässt
  (halber Umbau, Syntaxfehler) — sonst startet die nächste Sitzung auf Trümmern
- Einen Einzeiler, der in Arbeit war und in 10 Sekunden fertig ist
- Einen Befund, der noch in keiner Datei steht, in die Übergabe schreiben

**Später vorbereiten** (aufschreiben, nicht tun):

- Alles, was einen Lauf braucht: Build, Tests, Deploy, Lint
- Alles, was eine Entscheidung des Nutzers braucht
- Alles über ~30 Sekunden
- Aufräumarbeiten, Umbenennungen, Formatierung

**Niemals im Rahmen dieses Skills:**

- Hintergrundprozesse beenden, nur um „sauber" zu sein
- Nicht zusammengehörende Änderungen zusammen committen
- `git push`, Deploy oder irgendetwas nach außen — eine Notübergabe ist kein
  Zeitpunkt für unumkehrbare Schritte
- Neue Läufe starten, deren Ergebnis diese Sitzung nicht mehr sieht, **außer**
  der Nutzer will es ausdrücklich. Dann in die Übergabe: wo das Ergebnis landet
- `git stash` — die nächste Sitzung findet einen Stash nicht von allein

## Schritt 3 — Übergabedatei schreiben

Ziel: `docs/handoffs/JJJJ-MM-TT-HHMM-<thema>.md` (Ordner notfalls anlegen).

**Eine eigene Datei, kein Eingriff in eine Spec.** Unter Zeitdruck in einer
großen Spec herumzuschneiden geht schief; eine neue Datei kann nichts
beschädigen. Inhalte, die dauerhaft in die Spec gehören, trägt die **nächste**
Sitzung ein — und genau das steht als Auftrag in der Übergabe.

Sprache: **Deutsch**, wie die übrigen Dokumente des Projekts. Konkrete Stellen
als `pfad:zeile`. Keine Verweise auf „unser Gespräch".

```markdown
# Übergabe <JJJJ-MM-TT HH:MM> — <Thema>

## In einem Satz
<Woran gearbeitet wurde und wo es steht.>

## Stand
- **Zweig:** <name>, <n> Commits vor/hinter origin
- **Letzte Commits:** <kurzliste>
- **Arbeitsbaum:** <sauber | welche Dateien geändert und warum>

## Was in dieser Sitzung geändert wurde
<Was, wo, und **warum** — die Begründung ist der Teil, der sonst verloren geht.>

## Was offen ist
<Nummeriert, in der Reihenfolge, in der es angefasst werden sollte.
Jeweils: was zu tun ist, wo es ansetzt (pfad:zeile), und was es blockiert.>

## Nicht nochmal machen
<Was bereits erledigt, geprüft oder ausgeschlossen ist — mit dem Commit oder
der Stelle, die es belegt. Dieser Abschnitt spart der nächsten Sitzung die
meiste Zeit.>

## Offene Fragen an den Nutzer
<Unbeantwortete Fragen. Ohne sie läuft die nächste Sitzung in dieselbe Lücke.>

## Laufende Hintergrundprozesse
| Prozess | Ausgabedatei (absolut) | Restzeit | Was die nächste Sitzung damit tut |
|---|---|---|---|

## Fallen
<Was schiefgegangen ist und wie man es umgeht.>
```

> **Absolute Pfade bei den Ausgabedateien, ohne Ausnahme.** Das
> Scratchpad-Verzeichnis gehört **dieser** Sitzung; die nächste bekommt ein
> anderes. Die Datei liegt weiter auf der Platte, aber nur wer den vollen Pfad
> hat, findet sie wieder.

Nach dem Schreiben die Datei **einmal zurücklesen** — so verlangt es
`.claude/rules/general.md`, und eine Übergabe, die nicht auf der Platte steht,
ist keine.

## Schritt 4 — Zeiger in `features/INDEX.md`

`CLAUDE.md` zieht `features/INDEX.md` über `@features/INDEX.md` in **jede**
Sitzung. Drei Zeilen dort sind deshalb der wirksamste Griff überhaupt: Die
nächste Sitzung hat den Verweis im Kontext, noch bevor sie etwas liest.

In den Abschnitt „Woran zuletzt gearbeitet wurde" oben einsetzen:

```markdown
> **Offene Übergabe:** [docs/handoffs/<datei>.md](../docs/handoffs/<datei>.md)
> — Sitzung vom <datum> musste abgebrochen werden. Dort steht der Stand,
> was offen ist und was nicht nochmal gemacht werden muss.
```

Den bestehenden Abschnitt **nicht** umschreiben, nur den Zeiger davor setzen.
Umschreiben kostet Zeit und Aufmerksamkeit, die jetzt nicht da sind.

## Schritt 5 — Nur die Übergabe committen

```bash
git add docs/handoffs/<datei>.md features/INDEX.md
git commit -m "docs: Uebergabe <datum> — <thema>"
```

**Kein `git push`.** Commit, nicht veröffentlichen.

Alle **anderen** geänderten Dateien bleiben unangetastet im Arbeitsbaum und
sind in der Übergabe unter „Arbeitsbaum" aufgeführt. Fremde Änderungen unter
Zeitdruck mitzucommitten erzeugt einen Commit, den niemand mehr auseinander
nehmen kann.

Bei `sofort`: Commit überspringen, Datei genügt. Im Briefing sagen.

## Schritt 6 — Ausgabe

Genau zwei Blöcke, in dieser Reihenfolge. Nichts davor, nichts dazwischen.

### a) Der Prompt für die nächste Sitzung

Ein **einzelner** Codeblock zum Kopieren. Selbsttragend: kein Verweis auf
diese Sitzung, keine Abkürzung, die nur heute verständlich ist. Diese Form hat
sich bewährt:

````markdown
```
Weiter mit <Thema>, <Projekt>.

Stand: <ein bis zwei Sätze.>
Lies zuerst docs/handoffs/<datei>.md — dort steht alles, auch was bereits
ausgeschlossen wurde.

<N> Aufgaben, in dieser Reihenfolge:

1. <konkret, mit Pfad und Zeile>
2. <konkret, mit Pfad und Zeile>

Nicht nochmal machen: <das Wichtigste aus „Nicht nochmal machen" in einer
Zeile, mit Commit-Kürzeln.>

<Falls Prozesse laufen:> Im Hintergrund lief <was>; das Ergebnis steht in
<absoluter Pfad>. Erst dort nachsehen, bevor du es neu startest.

<Falls Fragen offen sind:> Offen und von mir zu entscheiden: <Frage>.
```
````

### b) Das Briefing

Kurz, in Fließtext oder knapper Liste — vier Punkte, keine Tabellenschlacht:

1. **Vorgekehrt:** welche Datei geschrieben, welcher Zeiger gesetzt, was
   committet wurde (mit Kürzel)
2. **Jetzt noch gemacht — und was nicht:** je ein Halbsatz Begründung. Bei
   Weggelassenem: warum es warten kann
3. **Später:** was die nächste Sitzung übernimmt, in der Reihenfolge der
   Übergabe
4. **Läuft weiter:** jeder Hintergrundprozess mit **Restzeit und deren
   Grundlage** („Lauf 5 brauchte 10 Min, 6 sind vorbei → noch ~4 Min"), wo die
   Ausgabe landet, und ob der Rechner dafür anbleiben muss

Beim letzten Punkt **ehrlich schätzen**. „Noch ein paar Minuten" ist nutzlos;
eine Zahl mit Begründung kann der Nutzer prüfen. Weiß man es nicht, schreibt
man das hin — und woran man es erkennen wird.

## Haltung in der Ausgabe

- Keine Entschuldigungen, keine Zusammenfassung der Sitzung. Der Nutzer will
  weg
- Nicht beschönigen: Was kaputt oder halb fertig ist, steht als Erstes in
  „Was offen ist"
- Nichts behaupten, was nicht geprüft ist. Ein nicht gelaufener Test ist „nicht
  gelaufen", nicht „sollte grün sein"
