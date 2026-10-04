-- ============================================
-- PROJ-6: Bedienstand der Konfigurationsseite an der Einheit
-- ============================================
-- Rein additiv: eine neue Spalte, nichts entfernt, nichts beschrieben.

-- „Zurück zum Generator" soll die Maske genau so öffnen, wie der Nutzer sie
-- verlassen hat — auch wenn er aus einer ganz anderen Richtung kommt, etwa
-- über „Meine Einheiten". Der Zeitverlauf steckt bereits in `unit_segments`;
-- was fehlte, war der reine Bedienstand:
--
--   { "mode": "standard" | "custom", "expandedPosition": <Zahl> | null }
--
-- `mode` entscheidet, ob die Seite mit „Standard" oder aufgeklapptem
-- Zeitverlauf öffnet. `expandedPosition` ist die Position des Segments, dessen
-- Einstellbereich offen war — bewusst die Position und nicht die Kennung,
-- weil die Kennungen im Formular bei jedem Laden neu vergeben werden.
--
-- Als eigene Spalte statt zwei Einzelspalten, damit der Editor aus PROJ-7
-- weiteren Bedienstand ablegen kann, ohne das Schema erneut anzufassen.
ALTER TABLE units ADD COLUMN editor_state JSONB;
