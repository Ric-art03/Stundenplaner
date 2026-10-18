import { notFound } from 'next/navigation'
import { GroupDetail } from '@/components/groups/group-detail'
import { LibraryOffer } from '@/components/library/library-offer'
import { getGroup, deleteGroup } from '@/lib/actions/groups'
import { getUnitsForGroup } from '@/lib/actions/units'
import { getLibraryOfferForGroup } from '@/lib/actions/library'

interface GroupPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ neu?: string }>
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const [{ id }, { neu }] = await Promise.all([params, searchParams])
  const group = await getGroup(id)

  if (!group) {
    notFound()
  }

  // Nur direkt nach dem Anlegen (PROJ-4, E): dann bietet die Seite an, was aus
  // der Übungsdatenbank sofort zu der neuen Gruppe passt.
  const [units, offer] = await Promise.all([
    getUnitsForGroup(group.id),
    neu === '1' ? getLibraryOfferForGroup(group.id) : Promise.resolve(null),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <GroupDetail
        group={group}
        units={units}
        onDelete={deleteGroup}
        notice={offer && <LibraryOffer groupId={group.id} matching={offer.matching} ready={offer.ready} />}
      />
    </div>
  )
}
