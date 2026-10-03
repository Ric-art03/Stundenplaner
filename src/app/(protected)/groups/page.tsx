import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupCard } from '@/components/groups/group-card'
import { GroupEmptyState } from '@/components/groups/group-empty-state'
import { getGroups, deleteGroup } from '@/lib/actions/groups'

export default async function GroupsPage() {
  const groups = await getGroups()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Meine Gruppen</h1>
          <p className="text-muted-foreground">Deine Trainingsgruppen und ihre Profile.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/groups/venues">
              <MapPin className="mr-2 h-4 w-4" />
              Hallen verwalten
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              Neue Gruppe
            </Link>
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <GroupEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onDelete={deleteGroup} />
          ))}
        </div>
      )}
    </div>
  )
}
