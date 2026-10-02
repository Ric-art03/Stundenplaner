import { GroupForm } from '@/components/groups/group-form'
import { createGroup, getVenues, createVenue, updateVenue } from '@/lib/actions/groups'
import { getCustomCategories } from '@/lib/actions/exercises'

export default async function NewGroupPage() {
  const [venues, customCategories] = await Promise.all([
    getVenues(),
    getCustomCategories(),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Neue Gruppe anlegen</h1>
      <GroupForm
        venues={venues}
        customCategories={customCategories}
        onSave={createGroup}
        onCreateVenue={createVenue}
        onUpdateVenue={updateVenue}
      />
    </div>
  )
}
