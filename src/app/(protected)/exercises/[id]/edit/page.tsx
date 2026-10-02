import { notFound } from 'next/navigation'
import { ExerciseWizard } from '@/components/exercises/exercise-wizard'
import { getExercise, updateExercise, getCustomCategories } from '@/lib/actions/exercises'
import type { ExerciseFormData } from '@/lib/types/exercise'

interface EditExercisePageProps {
  params: Promise<{ id: string }>
}

export default async function EditExercisePage({ params }: EditExercisePageProps) {
  const { id } = await params
  const [exercise, customCategories] = await Promise.all([
    getExercise(id),
    getCustomCategories(),
  ])

  if (!exercise) {
    notFound()
  }

  const initialData: ExerciseFormData = {
    name: exercise.name,
    description: exercise.description,
    notes: exercise.notes ?? '',
    workNotes: exercise.workNotes ?? '',
    sports: exercise.sports,
    ageGroups: exercise.ageGroups,
    phases: exercise.phases,
    difficulty: exercise.difficulty,
    organizationForms: exercise.organizationForms,
    duration: exercise.duration,
    participantsMin: exercise.participantsMin ?? null,
    participantsMax: exercise.participantsMax ?? null,
    musicRequired: exercise.musicRequired,
    musicLink: exercise.musicLink ?? '',
    images: exercise.images ?? [],
    materials: exercise.materials,
    variants: exercise.variants,
    links: exercise.links,
  }

  async function handleSave(data: ExerciseFormData) {
    'use server'
    return updateExercise(id, data)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Übung bearbeiten</h1>
      <ExerciseWizard initialData={initialData} exerciseId={id} onSave={handleSave} customCategories={customCategories} />
    </div>
  )
}
