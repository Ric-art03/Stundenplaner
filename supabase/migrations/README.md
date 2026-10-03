# Datenbank-Migrationen

Jede Datei beschreibt eine Änderung an der Datenbankstruktur, in der Reihenfolge ihrer Zeitstempel. Zusammen ergeben sie den vollständigen Aufbau — die Datenbank lässt sich daraus von Null an neu erstellen.

## Warum dieser Ordner existiert

Bis Oktober 2026 lag die Datenbankstruktur ausschließlich im Supabase-Projekt und sonst nirgends. Im Repository stand sie nur als Fließtext in den Feature-Specs. Ginge das Supabase-Projekt verloren oder sollte eine zweite Umgebung zum Testen entstehen, hätte sie aus Prosa rekonstruiert werden müssen.

Seit dem 4. Oktober 2026 gehört jede Strukturänderung als Datei hierher und durchläuft damit dieselbe Versionierung wie der übrige Code.

## Hinweis zur Herkunft

Die ersten fünf Dateien stammen aus dem Migrationsverlauf, den Supabase selbst mitgeschrieben hat, und sind wortgetreu übernommen.

Drei weitere Änderungen wurden seinerzeit direkt im Supabase SQL Editor ausgeführt. Der SQL Editor schreibt keine Migrationen mit, deshalb fehlten sie in Supabases Verlauf und wurden hier aus dem tatsächlichen Datenbankzustand rekonstruiert:

- `20261002150000_group_schedules_one_time_dates.sql`
- `20261003120000_groups_single_participant_count.sql`
- `20261004100000_groups_add_primary_sport.sql`

Ihre Zeitstempel sind geschätzt und dienen nur der richtigen Reihenfolge. Inhaltlich entsprechen sie dem geprüften Ist-Zustand der Datenbank.

## Für neue Änderungen

Neue Datei nach dem Muster `JJJJMMTTHHMMSS_kurze_beschreibung.sql` anlegen und ausführen. Wird eine Änderung direkt im SQL Editor gemacht, muss sie **zusätzlich** als Datei hier landen — sonst läuft der Verlauf wieder auseinander, genau wie bei den drei oben.
