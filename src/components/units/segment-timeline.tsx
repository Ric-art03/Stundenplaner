'use client'

import * as React from 'react'
import { GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  layoutToMinutes,
  minutesToLayout,
  minPanelSize,
  reorderSegments,
} from '@/lib/units/timeline'
import type { SegmentConfig } from '@/lib/types/unit'

interface SegmentTimelineProps {
  segments: SegmentConfig[]
  totalMinutes: number
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (segments: SegmentConfig[]) => void
}

interface DragState {
  fromIndex: number
  overIndex: number
}

export function SegmentTimeline({
  segments,
  totalMinutes,
  selectedId,
  onSelect,
  onChange,
}: SegmentTimelineProps) {
  const signature = segments.map((s) => `${s.id}:${s.minutes}`).join('|')

  // Beim Ziehen einer Grenze verwaltet die Panel-Gruppe die Breiten selbst.
  // Wird dagegen ein Minutenfeld geändert oder umsortiert, muss der Balken von
  // außen nachgezogen werden — das geschieht über einen Neuaufbau. Damit das
  // nicht auch nach jedem Ziehen passiert, merken wir uns unsere eigenen Meldungen.
  const reported = React.useRef(signature)
  const [remountKey, setRemountKey] = React.useState(0)

  React.useEffect(() => {
    if (reported.current !== signature) {
      reported.current = signature
      setRemountKey((key) => key + 1)
    }
  }, [signature])

  const containerRef = React.useRef<HTMLDivElement>(null)
  const pressRef = React.useRef<{ x: number; index: number } | null>(null)
  const draggedRef = React.useRef(false)
  const [drag, setDrag] = React.useState<DragState | null>(null)

  function handleLayout(sizes: number[]) {
    if (sizes.length !== segments.length) return

    const minutes = layoutToMinutes(sizes, totalMinutes)
    if (minutes.every((m, i) => m === segments[i].minutes)) return

    const next = segments.map((segment, i) => ({ ...segment, minutes: minutes[i] }))
    reported.current = next.map((s) => `${s.id}:${s.minutes}`).join('|')
    onChange(next)
  }

  /** Welches Segment liegt unter dieser Bildschirm-X-Position? */
  function indexFromClientX(clientX: number): number {
    const element = containerRef.current
    if (!element) return 0

    const rect = element.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const minute = ratio * totalMinutes

    let accumulated = 0
    for (let i = 0; i < segments.length; i += 1) {
      accumulated += segments[i].minutes
      if (minute <= accumulated) return i
    }
    return segments.length - 1
  }

  function onPointerDown(event: React.PointerEvent, index: number) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pressRef.current = { x: event.clientX, index }
    draggedRef.current = false
  }

  function onPointerMove(event: React.PointerEvent) {
    const press = pressRef.current
    if (!press) return

    if (!drag) {
      // Erst ab einer deutlichen Bewegung wird es ein Ziehen — ein Antippen
      // soll das Segment weiterhin nur auswählen.
      if (Math.abs(event.clientX - press.x) < 8) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
      draggedRef.current = true
      setDrag({ fromIndex: press.index, overIndex: press.index })
      return
    }

    const over = indexFromClientX(event.clientX)
    if (over !== drag.overIndex) setDrag({ ...drag, overIndex: over })
  }

  function onPointerUp() {
    // Die Umsortierung wird erst beim Loslassen übernommen. Würde sie laufend
    // angewendet, baute sich die Panel-Gruppe mitten im Ziehen neu auf und
    // der Finger verlöre das Segment.
    if (drag && drag.overIndex !== drag.fromIndex) {
      onChange(reorderSegments(segments, drag.fromIndex, drag.overIndex))
    }
    pressRef.current = null
    setDrag(null)
  }

  /** Tastatur-Ersatz für das Ziehen (ersetzt die früheren Pfeil-Buttons). */
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (!event.altKey) return
    const target = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1 : null
    if (target === null || target < 0 || target >= segments.length) return
    event.preventDefault()
    onChange(reorderSegments(segments, index, target))
  }

  const sizes = minutesToLayout(segments, totalMinutes)
  const minSize = minPanelSize(totalMinutes)

  return (
    <div className="space-y-2">
      <div ref={containerRef}>
        <ResizablePanelGroup
          key={remountKey}
          direction="horizontal"
          onLayout={handleLayout}
          className="h-24 rounded-lg border overflow-hidden"
        >
          {segments.map((segment, index) => (
            <React.Fragment key={segment.id}>
              {index > 0 && <ResizableHandle withHandle />}
              <ResizablePanel
                id={segment.id}
                order={index}
                defaultSize={sizes[index]}
                minSize={minSize}
              >
                <button
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, index)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  // Verliert der Browser die Zeigererfassung (etwa weil das
                  // Element neu gerendert wird), käme sonst nie ein pointerup
                  // an und die Umsortierung ginge verloren.
                  onLostPointerCapture={onPointerUp}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  onClick={() => {
                    if (draggedRef.current) return
                    onSelect(segment.id)
                  }}
                  title={`${segment.name} · ${segment.minutes} Min — zum Umsortieren seitwärts ziehen`}
                  aria-pressed={selectedId === segment.id}
                  aria-label={`${segment.name}, ${segment.minutes} Minuten, Position ${index + 1} von ${segments.length}. Mit Alt und Pfeiltasten verschieben.`}
                  className={cn(
                    'group flex h-full w-full touch-pan-y cursor-grab flex-col justify-between overflow-hidden px-2 py-2 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    segment.fillMode === 'empty'
                      ? 'bg-muted/60'
                      : 'bg-primary/10 hover:bg-primary/20',
                    selectedId === segment.id && 'ring-2 ring-primary ring-inset',
                    drag?.fromIndex === index && 'opacity-40',
                    drag !== null && drag.overIndex === index && drag.fromIndex !== index &&
                      'ring-2 ring-primary ring-inset'
                  )}
                >
                  <span className="block min-w-0">
                    <span
                      className={cn(
                        'block truncate text-sm font-semibold leading-tight',
                        segment.fillMode === 'empty' && 'text-muted-foreground'
                      )}
                    >
                      {segment.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {segment.minutes} Min
                      {segment.fillMode === 'empty' && ' · frei'}
                    </span>
                  </span>
                  <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-opacity group-hover:text-muted-foreground" />
                </button>
              </ResizablePanel>
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0 Min</span>
        <span className="hidden sm:inline">
          Grenzen ziehen zum Verteilen · Segment seitwärts ziehen zum Umsortieren
        </span>
        <span>{totalMinutes} Min</span>
      </div>
    </div>
  )
}
