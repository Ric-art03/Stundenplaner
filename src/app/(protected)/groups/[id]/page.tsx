import { notFound } from 'next/navigation'
import { GroupDetail } from '@/components/groups/group-detail'
import { getGroup, deleteGroup } from '@/lib/actions/groups'
import { getUnitsForGroup } from '@/lib/actions/units'

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const group = await getGroup(id)

  if (!group) {
    notFound()
  }

  const units = await getUnitsForGroup(group.id)

  return (
    <div className="container mx-auto px-4 py-6">
      <GroupDetail group={group} units={units} onDelete={deleteGroup} />
    </div>
  )
}
