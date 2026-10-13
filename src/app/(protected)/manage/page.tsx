import { ManageTabs } from '@/components/manage/manage-tabs'
import { PatternList } from '@/components/manage/pattern-list'
import { CategoryManager } from '@/components/manage/category-manager'
import { VenueList } from '@/components/groups/venue-list'
import {
  getVenuesWithGroupCount,
  createVenue,
  updateVenue,
  deleteVenue,
} from '@/lib/actions/groups'
import { getCustomCategories } from '@/lib/actions/exercises'
import { getPatterns } from '@/lib/actions/patterns'
import { getManagedCategories } from '@/lib/actions/categories'
import { isManageTab, type ManageTab } from '@/lib/manage/tabs'

interface ManagePageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ManagePage({ searchParams }: ManagePageProps) {
  const { tab: tabParam } = await searchParams
  const tab: ManageTab = isManageTab(tabParam) ? tabParam : 'venues'

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Verwaltung</h1>
          <p className="text-muted-foreground">
            Alles, was du selbst angelegt hast: Hallen, Stundenmuster und eigene Kategorien.
          </p>
        </div>

        <ManageTabs tab={tab}>
          {tab === 'venues' && <VenuesTab />}
          {tab === 'patterns' && <PatternsTab />}
          {tab === 'categories' && <CategoriesTab />}
        </ManageTabs>
      </div>
    </div>
  )
}

async function VenuesTab() {
  const [venues, customCategories] = await Promise.all([
    getVenuesWithGroupCount(),
    getCustomCategories(),
  ])

  return (
    <VenueList
      venues={venues}
      customMaterials={customCategories.material ?? []}
      onCreateVenue={createVenue}
      onUpdateVenue={updateVenue}
      onDeleteVenue={deleteVenue}
    />
  )
}

async function PatternsTab() {
  return <PatternList patterns={await getPatterns()} />
}

async function CategoriesTab() {
  return <CategoryManager categories={await getManagedCategories()} />
}
