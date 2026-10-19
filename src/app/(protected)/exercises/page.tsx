import { ExercisesTabs } from '@/components/exercises/exercises-tabs'
import { MyExercises } from '@/components/exercises/my-exercises'
import { LibraryBrowser } from '@/components/library/library-browser'
import { getCustomCategories } from '@/lib/actions/exercises'
import { getGroups } from '@/lib/actions/groups'
import { hasLibraryContent } from '@/lib/actions/library'
import { parseExercisesTab, parseLibraryParams } from '@/lib/library/address'

interface ExercisesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** „Übungen" mit zwei Reitern: der eigene Bestand und die Übungsdatenbank (PROJ-4). */
export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const search = await searchParams
  const tab = parseExercisesTab(search)

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Übungen</h1>

      <ExercisesTabs tab={tab}>
        {tab === 'mine' ? <MineTab /> : <LibraryTab search={search} />}
      </ExercisesTabs>
    </div>
  )
}

async function MineTab() {
  // Mit der Seite statt per Server-Aktion nach dem Laden — siehe BUG-31.
  const [libraryHasContent, customCategories] = await Promise.all([
    hasLibraryContent(),
    getCustomCategories(),
  ])
  return <MyExercises libraryHasContent={libraryHasContent} customCategories={customCategories} />
}

async function LibraryTab({ search }: { search: Record<string, string | string[] | undefined> }) {
  const groups = await getGroups()
  return (
    <LibraryBrowser
      // Ein neuer Aufruf der Adresse (Einstieg mit Gruppe, Zurück) beginnt frisch.
      key={JSON.stringify(search)}
      initialParams={parseLibraryParams(search)}
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
    />
  )
}
