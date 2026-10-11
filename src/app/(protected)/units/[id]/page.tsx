import { notFound } from 'next/navigation'
import {
  getEditorPool,
  getUnit,
  quickCreateExercise,
  saveUnitPlan,
} from '@/lib/actions/units'
import { getGroup } from '@/lib/actions/groups'
import { getRunsForUnit } from '@/lib/actions/live'
import { UnitRuns } from '@/components/live/unit-runs'
import { UnitPlanView } from '@/components/units/unit-plan-view'

interface UnitPageProps {
  params: Promise<{ id: string }>
}

export default async function UnitPage({ params }: UnitPageProps) {
  const { id } = await params
  const unit = await getUnit(id)

  if (!unit) {
    notFound()
  }

  const [group, runs] = await Promise.all([
    getGroup(unit.groupId),
    // Ein Entwurf lässt sich nicht starten und hat deshalb keine Durchführungen.
    unit.saved ? getRunsForUnit(unit.id) : Promise.resolve([]),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <UnitPlanView
        unit={unit}
        singleSportGroup={group?.sports.length === 1}
        groupAgeGroups={group?.ageGroups ?? []}
        editorActions={{
          loadPool: getEditorPool,
          // Die Einheit steht fest, sobald die Seite geladen ist — der Editor
          // schickt nur noch die Arbeitsfassung.
          savePlan: saveUnitPlan.bind(null, unit.id),
          quickCreate: quickCreateExercise,
        }}
      />
      {unit.saved && <UnitRuns unitId={unit.id} runs={runs} />}
    </div>
  )
}
