import { notFound } from 'next/navigation'
import { ExerciseDetail } from '@/components/exercises/exercise-detail'
import { getLibraryEntry } from '@/lib/actions/library'
import { libraryQuery, parseLibraryParams } from '@/lib/library/address'

interface LibraryExercisePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Die Leseansicht einer Übung aus der Übungsdatenbank (PROJ-4). Ein Entwurf
 * oder eine zurückgezogene Übung ist für Unbefugte nicht da — die Datenbank
 * liefert sie nicht, auch nicht über eine erratene Adresse.
 */
export default async function LibraryExercisePage({ params, searchParams }: LibraryExercisePageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])
  const entry = await getLibraryEntry(id)

  if (!entry) {
    notFound()
  }

  // Zurück in dieselbe Liste — neu gebaut aus den gelesenen Werten, nie aus
  // dem, was in der Adresse stand.
  const backHref = `/exercises?${libraryQuery(parseLibraryParams(search))}`

  return (
    <div className="container mx-auto px-4 py-6">
      <ExerciseDetail
        exercise={entry.exercise}
        library={{
          backHref,
          isDraft: entry.isDraft,
          copiedExerciseId: entry.copiedExerciseId,
        }}
      />
    </div>
  )
}
