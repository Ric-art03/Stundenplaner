import { ExerciseWizard } from '@/components/exercises/exercise-wizard'
import { createExercise, getCustomCategories } from '@/lib/actions/exercises'

export default async function NewExercisePage() {
  const customCategories = await getCustomCategories()

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Neue Übung erstellen</h1>
      <ExerciseWizard onSave={createExercise} customCategories={customCategories} />
    </div>
  )
}
