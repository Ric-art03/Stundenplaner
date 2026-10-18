import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/lib/types/exercise'
import type { LibraryEntry } from '@/lib/types/library'
import type { ExerciseFit } from './group-fit'
import { preselectedIds, pruneSelection, selectableIds, selectionInOrder } from './selection'

const FITS: ExerciseFit = { kind: 'fits', viaVariant: null }
const BLOCKED: ExerciseFit = { kind: 'blocked', reasons: [], forVariant: null }

function entry(id: string, fit?: ExerciseFit, copied: string | null = null): LibraryEntry {
  return { exercise: { id } as Exercise, isDraft: false, addedAt: null, copiedExerciseId: copied, fit }
}

const entries = [entry('a', FITS), entry('b', BLOCKED), entry('c', FITS, 'kopie-c'), entry('d')]

describe('Auswahl in der Übungsdatenbank', () => {
  it('wählt vor, was passt und noch nicht übernommen ist', () => {
    expect([...preselectedIds(entries)]).toEqual(['a'])
  })

  it('lässt Übernommenes nicht auswählen', () => {
    expect([...selectableIds(entries)]).toEqual(['a', 'b', 'd'])
  })

  it('schrumpft auf das, was noch auswählbar in der Liste steht', () => {
    expect([...pruneSelection(new Set(['a', 'c', 'x']), entries)]).toEqual(['a'])
  })

  it('übernimmt in Listenreihenfolge', () => {
    expect(selectionInOrder(new Set(['d', 'a']), entries)).toEqual(['a', 'd'])
  })
})
