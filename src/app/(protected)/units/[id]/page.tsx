import { notFound } from 'next/navigation'
import {
  getEditorPool,
  getUnit,
  quickCreateExercise,
  saveUnitPlan,
} from '@/lib/actions/units'
import { getGroup } from '@/lib/actions/groups'
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

  const group = await getGroup(unit.groupId)

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
    </div>
  )
}
