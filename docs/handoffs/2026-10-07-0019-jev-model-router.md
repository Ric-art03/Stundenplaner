# Übergabe 2026-10-07 00:19 — Jev Model Router einrichten

> **ERLEDIGT am 2026-10-07.** Diese Übergabe ist abgearbeitet — der Nachtrag am Ende hält fest, was daraus wurde. Der Rest des Dokuments ist der Stand von 00:19 und bleibt als Protokoll stehen.

## In einem Satz
Der Jev Model Router aus `jev-model-router/` sollte nach `~/.claude/` installiert werden; die Vorarbeit (`jq`) steht, die fünf Schreibzugriffe wurden vom Auto-Modus blockiert und brauchen eine Entscheidung des Nutzers.

## Stand
- **Zweig:** `main`, 4 Commits vor `origin/main`
- **Letzte Commits:** `de316e0` Migrationsregister/Passwortschutz · `5077131` Spec PROJ-7 · `e34db40` RLS-Härtung BUG-4
- **Arbeitsbaum:** sauber bis auf `?? jev-model-router/` — ein **fremdes Repo mit eigenem `.git`**, das im Projektordner liegt. `git diff` und `git diff --cached` sind leer
- **Diese Sitzung hat am Stundenplaner-Projekt nichts geändert.** Es ging ausschließlich um ein Fremdwerkzeug

## Was in dieser Sitzung geändert wurde
Genau eine Änderung auf der Platte, außerhalb des Projekts:

- **`C:\Users\goryg\bin\jq.exe` angelegt** (1.035.264 Bytes, `jq-1.8.2`). Grund: `jq` war über winget längst installiert, aber winget hatte **keinen Shim** in `%LOCALAPPDATA%\Microsoft\WinGet\Links\` erzeugt — der Ordner ist leer. Deshalb kannte keine Shell den Befehl. `C:\Users\goryg\bin` stand bereits an **erster** Stelle im PATH, existierte aber nicht; Anlegen und Hineinkopieren war der kürzeste Weg. Nachgeprüft: `which jq` → `/c/Users/goryg/bin/jq`, `jq --version` → `jq-1.8.2`

Nichts in `~/.claude/` wurde geschrieben. `~/.claude/jev-router` existiert **nicht**.

## Was offen ist

1. **Die fünf Schreibzugriffe der Installation — blockiert, Entscheidung des Nutzers.**
   Der Auto-Modus hat den `cp`-Befehl mit der Begründung *„Untrusted Code Integration"* abgelehnt. Das greift sachlich richtig: Es werden fremde Shell-Skripte in die **globale** Claude-Konfiguration geschrieben und ein `UserPromptSubmit`-Hook eingehängt, der danach in **jedem** Projekt bei **jedem** Prompt läuft und Prompt-Text an einen US-Dienst schickt. Zu kopieren wären (Quelle → Ziel):
   - `jev-model-router/jev-router/route.sh` → `~/.claude/jev-router/route.sh` (+ `chmod +x`)
   - `jev-model-router/jev-router/jev.sh` → `~/.claude/jev-router/jev.sh` (+ `chmod +x`)
   - `jev-model-router/jev-router/config.json` → `~/.claude/jev-router/config.json`
   - `jev-model-router/skills/jev/SKILL.md` → `~/.claude/skills/jev/SKILL.md`
   - Hook-Block aus `jev-model-router/hook-settings.json` **ergänzend** in `~/.claude/settings.json` unter `hooks.UserPromptSubmit`

2. **TypeSafe-API-Key fehlt — ohne ihn ist die Installation wirkungslos.**
   `TYPESAFE_API_KEY` ist in der Umgebung nicht gesetzt. Ziel ist `~/.claude/jev-router/.env` mit der Zeile `TYPESAFE_API_KEY=…`. **Der Nutzer trägt den Key selbst ein; niemals selbst einen Key in eine Datei schreiben.** Quelle: console.typesafe.ai (laut README Startguthaben für neue Konten). `route.sh:16` bricht ohne Key stumm ab — fail-open, also ohne jede Fehlermeldung.

3. **Abschlusstest aus der README** — erst nach 1 und 2 möglich:
   `bash ~/.claude/jev-router/jev.sh test "Wo wird in diesem Projekt der Supabase-Client initialisiert?"`
   `jev.sh test` erzwingt den Schalter nur für diesen einen Aufruf und lässt den echten Zustand unberührt (`jev.sh:25-31`).

4. **Router nicht einschalten.** Keine Datei `~/.claude/jev-router/enabled` anlegen — das macht der Nutzer selbst mit `/jev on`. So steht es ausdrücklich im Tutorial-Prompt.

5. **Nach der Installation: `jev-model-router/` aus dem Projektordner herausnehmen.**
   Der Ordner hat sein eigenes `.git` und taucht sonst dauerhaft als `?? jev-model-router/` in `git status` auf — mit dem Risiko, versehentlich mitcommittet zu werden. Vorschlag: nach `C:\Users\goryg\Desktop\` verschieben. **Erst nach** der Installation, die Dateien werden vorher als Quelle gebraucht.

6. **Nach dem Einbau prüfen, ob der Hook auf Windows überhaupt feuert.**
   Der Hook-Befehl ist Bash-Syntax: `[ -x "$HOME/.claude/jev-router/route.sh" ] && bash "$HOME/.claude/jev-router/route.sh" || true`. Ob Claude Code ihn unter Windows über Git Bash ausführt, ist **nicht geprüft**. Ablesen an `/jev status` nach einem Neustart von Claude Code.

## Nicht nochmal machen

- **`jq` ist erledigt.** Nicht nach `brew install jq` suchen (README ist für Mac) und nicht erneut `winget install` versuchen — winget meldet „Kein verfügbares Upgrade gefunden", das Paket ist da. Die Lösung war der fehlende Shim, siehe oben.
- **`curl` ist vorhanden:** `/mingw64/bin/curl`. Nicht prüfen, nicht installieren.
- **`session_model` muss nicht geändert werden.** `~/.claude/settings.json` hat `"model": "claude-opus-5"`, und `jev-router/config.json` steht bereits auf `"session_model": "opus"`. Das passt zusammen — keine Bearbeitung nötig.
- **Die `settings.json`-Zusammenführung ist konfliktfrei.** `~/.claude/settings.json` enthält nur `model` und `modelSettings` und **keinen** `hooks`-Block (`grep -c hooks` → 0). Der Block kann ergänzt werden, ohne irgendetwas zu überschreiben.
- **Es gibt kein `claude`-CLI auf diesem Rechner.** Nur die VS-Code-Erweiterung `anthropic.claude-code-2.1.289-win32-x64`; `%APPDATA%\npm` ist leer, `~/.local/bin/claude` fehlt. Darum schlug der ursprüngliche Versuch `cd jev-model-router; claude` in PowerShell mit `CommandNotFoundException` fehl. **Eine zweite Claude-Session im Unterordner ist nicht nötig** — `jev-model-router/` liegt innerhalb des Projekts und ist von hier aus lesbar.
- **Die OpenRouter-Frage ist geklärt: der OpenRouter-Key funktioniert hierfür nicht.** Am lebenden Dienst nachgeprüft (`https://openrouter.ai/api/v1/models`, 466 Modelle): es existiert **genau ein** TypeSafe-Eintrag, `typesafe/jev-router` — ein **Chat-Modell**, das die Anfrage selbst an ein Modell weiterleitet und die fertige Antwort liefert, Preis `"-1"` (variabel). Das Repo braucht das Gegenteil: `route.sh:37` ruft `https://api.typesafe.ai/v1/systemone` mit `Authorization: Bearer $TYPESAFE_API_KEY` auf, schickt `{state, model, questions}` und liest `.answers.route.choice`, `.answers.route.confidence`, `.answers.needs_context.noul`. Diese Felder gibt es in einer OpenAI-kompatiblen Antwort nicht. Die Adresse ist **fest verdrahtet**, es gibt keine einstellbare Basis-URL.
- **Zwei Angaben aus einer Google/Gemini-Auskunft sind widerlegt, nicht erneut verfolgen:** Die Modell-ID `typesafe/jev-1.13` **existiert nicht** (OpenRouter führt `typesafe/jev-router`). Und die angebliche Erststart-Abfrage *„Where do you want to reach Jev? 1. TypeSafe 2. OpenRouter"* **existiert nicht** — das gesamte Repo wurde über alle `.sh`, `.json` und `.md` nach `where do you want`, `openrouter`, `sk-or-`, `read -p` und `select` durchsucht: **null Treffer**. Das Skript fragt beim ersten Start nichts.

## Offene Fragen an den Nutzer

1. **Soll die Installation mit Freigabe durchgeführt werden, oder will der Nutzer die Befehle selbst ausführen?** Ersteres braucht eine Berechtigungsregel für `Bash` bzw. einen weniger strikten Modus. Ohne diese Antwort geht es nicht weiter.
2. **Holt der Nutzer einen TypeSafe-Key (console.typesafe.ai)?** Falls nein, ist die Installation zwecklos. Zwei Alternativen stehen ausgearbeitet bereit: den OpenRouter-Key für eigene KI-Funktionen im Stundenplaner verwenden, oder `route.sh` auf OpenRouter mit `structured_outputs` umbauen — letzteres eine echte Neuimplementierung, keine geänderte Zeile.

## Laufende Hintergrundprozesse

| Prozess | Ausgabedatei (absolut) | Restzeit | Was die nächste Sitzung damit tut |
|---|---|---|---|
| — | — | — | **Keine.** Nichts gestartet, nichts wartet, der Rechner muss für diese Sitzung nicht anbleiben |

## Fallen

- **`winget`s `msstore`-Quelle ist auf diesem Rechner kaputt:** `0x8a15005e — Das Serverzertifikat stimmte mit keinem der erwarteten Werte überein`. Jeder `winget install` ohne `--source winget` bleibt an einer Quellenabfrage hängen. Immer `--source winget` mitgeben.
- **`%LOCALAPPDATA%\Microsoft\WinGet\Links\` ist leer**, obwohl Pakete installiert sind, und steht nicht im PATH. Über winget installierte CLI-Werkzeuge sind auf diesem Rechner deshalb grundsätzlich nicht aufrufbar. Gegenmittel: `.exe` nach `C:\Users\goryg\bin` kopieren, das ist schon im PATH.
- **PowerShell liest den PATH nur beim Start.** Nach PATH-Änderungen ein neues Terminal öffnen, sonst sieht man den Erfolg nicht.
- **`chmod 600` auf der `.env` leistet unter NTFS über Git Bash kaum etwas.** Echten Schutz gäbe erst eine NTFS-ACL. Die Zeile aus der README (für Mac gedacht) ist hier größtenteils kosmetisch — den Nutzer nicht in falscher Sicherheit lassen.
- **Der Router ist durchgehend fail-open** (`route.sh`, Kopfkommentar): jeder Fehler endet mit `exit 0` ohne Ausgabe. Ein falscher Key, ein fehlendes `jq`, eine falsche Adresse — nichts davon erzeugt eine Fehlermeldung, man sieht nur, dass nie delegiert wird. **Bei der Fehlersuche nie auf eine Meldung warten**, sondern `jev.sh test` benutzen.
- **Datenschutz, vor dem Einschalten ansprechen:** Sobald `/jev on` gesetzt ist, geht der **Prompt-Text** (max. 12.000 Zeichen; keine Dateien, kein Code, kein Verlauf) an `api.typesafe.ai`, einen US-Anbieter — auch während der Stundenplaner-Arbeit, weil der Hook global ist. `/jev off` beendet das. `~/.claude/jev-router/log.jsonl` speichert die ersten 120 Zeichen jedes klassifizierten Prompts: nicht teilen, nicht committen.
- **Keine Keys im Chat.** Weder der OpenRouter- noch der TypeSafe-Key gehören in die Unterhaltung; sie gehören in die `.env`, vom Nutzer selbst eingetragen.

## Nachtrag 2026-10-07 — Installation abgeschlossen

Der Nutzer hat sich für den TypeSafe-Key entschieden und die Schreibzugriffe freigegeben. Stand jetzt:

- **Die vier Dateien liegen in `~/.claude/`**, alle mit `cmp` byte-identisch gegen das Repo geprüft, beide `.sh` ausführbar. Der Skill `/jev` war danach ohne Neustart verfügbar
- **Der `hooks`-Block steht in `~/.claude/settings.json`** — der Nutzer hat ihn selbst eingefügt, nachdem der Auto-Modus den Schreibzugriff auch beim zweiten Versuch ablehnte. Nachgeprüft: gültiges JSON, `model` und beide `modelSettings` erhalten, genau ein `UserPromptSubmit`-Eintrag ohne Dopplung
- **Der Abschlusstest lief erfolgreich:** `tier=haiku confidence=1.0 needs_context=0.66 → handle`, 1133 ms, 565 Eingabe-Tokens. Key und Verbindung funktionieren. Der Trockenlauf hat `enabled` korrekt wieder entfernt
- **`.env` liegt unter `~/.claude/jev-router/.env`**, vom Nutzer selbst gefüllt. `chmod 600` **griff nicht** — die Datei steht auf `-rw-r--r--`, was die NTFS-Einschränkung aus „Fallen" bestätigt
- **`jev-model-router/` liegt jetzt unter `C:\Users\goryg\Desktop\jev-model-router`**, aus dem Projekt-Repo entfernt
- **Der Router ist AUS.** Einschalten mit `/jev on` bleibt dem Nutzer überlassen

Zwei Erkenntnisse, die über diese Übergabe hinaus gelten:

- **Die Latenz liegt bei 1133 ms, nicht unter 500 ms** wie die README behauptet. Eine einzige Messung, womöglich inklusive TLS-Aufbau. Über `/jev status` beobachten, bevor man es als Tatsache nimmt — bei dem Wert kostet jeder Prompt rund eine Sekunde Vorlauf
- **`session_model` nimmt nur die vier Stufennamen** (`haiku`/`sonnet`/`opus`/`fable`), nicht Modell-IDs. Ein Wechsel von Opus 5 auf Opus 5.5 bleibt deshalb innerhalb der Stufe `opus` und erfordert **keine** Änderung am Router. Nachziehen nur bei einem Stufenwechsel — und das von Hand, es gibt keine Verbindung zu `settings.json`
