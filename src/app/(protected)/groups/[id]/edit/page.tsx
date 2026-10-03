import { notFound } from 'next/navigation'
import { GroupForm } from '@/components/groups/group-form'
import { getGroup, updateGroup, getVenues, createVenue, updateVenue } from '@/lib/actions/groups'
import { getCustomCategories } from '@/lib/actions/exercises'
import type { GroupFormData } from '@/lib/types/group'

interface EditGroupPageProps {
  params: Promise<{ id: string }>
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { id } = await params
  const [group, venues, customCategories] = await Promise.all([
    getGroup(id),
    getVenues(),
    getCustomCategories(),
  ])

  if (!group) {
    notFound()
  }

  const initialData: GroupFormData = {
    name: group.name,
    sports: group.sports,
    ageGroups: group.ageGroups,
    primarySport: group.primarySport,
    participants: group.participants,
    unitDuration: group.unitDuration,
    venueId: group.venueId,
    schedules: group.schedules.map((s) => ({
      scheduleType: s.scheduleType,
      weekday: s.weekday,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  }

  async function handleSave(data: GroupFormData) {
    'use server'
    return updateGroup(id, data)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Gruppe bearbeiten</h1>
      <GroupForm
        initialData={initialData}
        groupId={id}
        venues={venues}
        customCategories={customCategories}
        onSave={handleSave}
        onCreateVenue={createVenue}
        onUpdateVenue={updateVenue}
      />
    </div>
  )
}
