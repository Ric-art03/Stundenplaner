import { notFound } from 'next/navigation'
import { getUnit } from '@/lib/actions/units'
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
      <UnitPlanView unit={unit} singleSportGroup={group?.sports.length === 1} />
    </div>
  )
}
