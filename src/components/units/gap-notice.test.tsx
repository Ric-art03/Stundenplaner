import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GapNotice, SPORT_TAGGING_HINT } from './gap-notice'
import type { GapDetail } from '@/lib/units/generator'

function detail(overrides: Partial<GapDetail> = {}): GapDetail {
  return {
    kind: 'exhausted',
    phase: 'Hauptteil',
    totalCandidates: 3,
    phaseMatches: 3,
    blockedBy: [],
    relaxed: false,
    usableCandidates: 1,
    participants: 12,
    ...overrides,
  }
}

function renderNotice(gap: GapDetail, filledMinutes = 10) {
  render(
    <GapNotice
      segmentMinutes={30}
      filledMinutes={filledMinutes}
      reason="Grund"
      detail={gap}
      singleSportGroup={false}
      relaxing={false}
    />
  )
}

describe('GapNotice — Hinweis zum Markieren benachbarter Sportarten (PROJ-19, BUG-28)', () => {
  it('steht bei teilweise gefülltem Segment, wenn die Sportart Übungen ausschließt', () => {
    renderNotice(detail({ blockedBy: [{ criterion: 'sport', count: 2 }] }))
    expect(screen.getByText(SPORT_TAGGING_HINT)).toBeTruthy()
    expect(screen.getByText(/Lege weitere Übungen der Phase/)).toBeTruthy()
  })

  it('steht auch, wenn die restlichen Minuten zu kurz sind und die Sportart Übungen ausschließt', () => {
    renderNotice(
      detail({
        kind: 'too-short',
        remainingMinutes: 4,
        shortestDuration: 10,
        blockedBy: [{ criterion: 'sport', count: 1 }],
      })
    )
    expect(screen.getByText(SPORT_TAGGING_HINT)).toBeTruthy()
  })

  it('steht bei ganz leerem Segment wie bisher', () => {
    renderNotice(
      detail({ kind: 'all-filtered', usableCandidates: undefined, blockedBy: [{ criterion: 'sport', count: 3 }] }),
      0
    )
    expect(screen.getByText(SPORT_TAGGING_HINT)).toBeTruthy()
  })

  it('fehlt, wenn die Sportart nicht die Ursache ist', () => {
    renderNotice(detail({ blockedBy: [{ criterion: 'age', count: 2 }] }))
    expect(screen.queryByText(SPORT_TAGGING_HINT)).toBeNull()
  })

  it('fehlt, wenn es nur zu wenige Übungen gibt', () => {
    renderNotice(detail())
    expect(screen.queryByText(SPORT_TAGGING_HINT)).toBeNull()
  })
})
