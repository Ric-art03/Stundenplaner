-- Härtung der beiden Datenbankfunktionen — Supabase-Hinweise 0011, 0028, 0029.
-- Keine RLS-Richtlinie wird angefasst, kein Datenbestand verändert.
--
-- Angewendet am 2026-10-05 auf die Produktionsdatenbank; der Dateiname trägt
-- die Version, unter der die Migration dort registriert ist.

-- 1. Fester search_path (Hinweis 0011).
--    Ohne ihn entscheidet der Aufrufer, in welchem Schema ungenannte Objekte
--    gesucht werden. Bei einer SECURITY-DEFINER-Funktion ist das ein
--    Einfallstor, weil sie mit den Rechten ihres Eigentümers läuft.
--    Beide Rümpfe sind schema-qualifiziert (`public.profiles`) bzw. nutzen nur
--    `now()` aus pg_catalog — die Festlegung kann sie nicht brechen.
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

-- 2. Kein REST-Zugang für handle_new_user (Hinweise 0028 und 0029).
--    Sie ist eine Trigger-Funktion und wird allein vom Trigger auf auth.users
--    gerufen. Über /rest/v1/rpc/handle_new_user aufrufbar zu sein braucht sie
--    nicht. Das Ausführungsrecht einer Trigger-Funktion prüft PostgreSQL beim
--    CREATE TRIGGER, nicht bei jedem Auslösen — nachgewiesen an einem
--    Stellvertreter-Aufbau in der Produktionsdatenbank (eigene Trigger-
--    Funktion, Recht entzogen, Einfügen als `authenticated` lief weiter);
--    der bestehende Trigger bleibt also funktionsfähig.
--
--    `update_updated_at` behält ihr Ausführungsrecht: Sie ist SECURITY
--    INVOKER, hängt an fünf Triggern und ein RPC-Aufruf scheitert ohnehin
--    daran, dass eine Trigger-Funktion nur als Trigger aufrufbar ist.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
