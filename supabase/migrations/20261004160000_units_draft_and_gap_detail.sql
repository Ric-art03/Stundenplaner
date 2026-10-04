-- ============================================
-- PROJ-6: Entwurfszustand und ausführliche Lückengründe
-- ============================================
-- Rein additiv: keine Spalte wird entfernt, keine Bedingung ersetzt, keine
-- bestehende Zeile beschrieben.

-- 1. Eine generierte Einheit ist zunächst nur ein Entwurf.
-- Erst „Einheit speichern" legt sie in die Übersichten. Pro Nutzer existiert
-- immer höchstens ein Entwurf — jedes Generieren ersetzt den vorigen, damit
-- sich keine verworfenen Vorschläge ansammeln.
--
-- Der Standardwert steht beim Anlegen der Spalte bewusst auf `true` und wird
-- erst danach auf `false` gesetzt: So gelten die bereits bestehenden Einheiten
-- als gespeichert (sie wurden vor dieser Änderung sofort abgelegt), ohne dass
-- eine einzige Zeile beschrieben werden muss. Neue Einheiten entstehen
-- anschließend als Entwurf.
ALTER TABLE units ADD COLUMN saved BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE units ALTER COLUMN saved SET DEFAULT false;

CREATE INDEX idx_units_user_saved ON units(user_id, saved, created_at DESC);

-- 2. Der Lückengrund nennt künftig jede beteiligte Ursache mit Anzahl, nicht
-- nur die erste. Als Fließtext passte das nicht mehr in die bestehende
-- Längenbegrenzung — und die Oberfläche kann eine Aufschlüsselung ohnehin
-- besser darstellen, wenn sie strukturiert vorliegt.
--
-- `gap_reason` bleibt unverändert als einzeilige Zusammenfassung bestehen,
-- `gap_detail` trägt die Aufschlüsselung. Dadurch muss die vorhandene
-- Längenbedingung nicht angefasst werden.
ALTER TABLE unit_segments ADD COLUMN gap_detail JSONB;
