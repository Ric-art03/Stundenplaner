import { VenueList } from '@/components/groups/venue-list'
import {
  getVenuesWithGroupCount,
  createVenue,
  updateVenue,
  deleteVenue,
} from '@/lib/actions/groups'
import { getCustomCategories } from '@/lib/actions/exercises'

export default async function VenuesPage() {
  const [venues, customCategories] = await Promise.all([
    getVenuesWithGroupCount(),
    getCustomCategories(),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <VenueList
        venues={venues}
        customMaterials={customCategories.material ?? []}
        onCreateVenue={createVenue}
        onUpdateVenue={updateVenue}
        onDeleteVenue={deleteVenue}
      />
    </div>
  )
}
