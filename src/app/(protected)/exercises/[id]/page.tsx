import { notFound } from 'next/navigation'
import { ExerciseDetail } from '@/components/exercises/exercise-detail'
import { getExercise, deleteExercise } from '@/lib/actions/exercises'

interface ExercisePageProps {
  params: Promise<{ id: string }>
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { id } = await params
  const exercise = await getExercise(id)

  if (!exercise) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ExerciseDetail exercise={exercise} onDelete={deleteExercise} />
    </div>
  )
}
