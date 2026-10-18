import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/lib/types/exercise'
import type { LibraryEntry } from '@/lib/types/library'
import type { ExerciseFit } from './group-fit'
import { dropCopied, hiddenCount, preselectedIds, selectableIds, selectionInOrder } from './selection'

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

  it('nimmt Übernommenes heraus, lässt Ausgeblendetes aber stehen', () => {
    expect([...dropCopied(new Set(['a', 'c', 'x']), entries)]).toEqual(['a', 'x'])
  })

  it('zählt, was ausgewählt, aber gerade ausgeblendet ist', () => {
    expect(hiddenCount(new Set(['a', 'x', 'y']), entries)).toBe(2)
    expect(hiddenCount(new Set(['a', 'b']), entries)).toBe(0)
  })

  it('übernimmt die sichtbaren in Listenreihenfolge, danach die ausgeblendeten', () => {
    expect(selectionInOrder(new Set(['x', 'd', 'a']), entries)).toEqual(['a', 'd', 'x'])
  })
})
