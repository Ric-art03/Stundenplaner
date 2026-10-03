'use server'

import type { Unit, UnitConfig, UnitSummary } from '@/lib/types/unit'

/**
 * Noch nicht angebunden: Die vier Einheiten-Tabellen und der Auswahl-
 * algorithmus entstehen im Backend-Schritt (siehe Tech Design in
 * features/PROJ-6-einheiten-generator.md). Die Oberfläche ist vollständig
 * gebaut und ruft bereits die endgültigen Signaturen auf.
 */
const BACKEND_PENDING =
  'Das Speichern von Einheiten ist noch nicht verfügbar — der Generator wird im nächsten Schritt angebunden.'

export async function generateUnit(
  _config: UnitConfig
): Promise<{ unitId?: string; error?: string }> {
  return { error: BACKEND_PENDING }
}

export async function regenerateUnit(
  _unitId: string,
  _relaxCriteria = false
): Promise<{ success?: boolean; error?: string }> {
  return { error: BACKEND_PENDING }
}

export async function getUnit(_id: string): Promise<Unit | null> {
  return null
}

export async function getUnitsForGroup(_groupId: string): Promise<UnitSummary[]> {
  return []
}

export async function getUnits(): Promise<UnitSummary[]> {
  return []
}
