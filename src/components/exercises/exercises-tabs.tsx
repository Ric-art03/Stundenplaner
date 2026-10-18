'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EXERCISE_TABS, EXERCISE_TAB_LABELS, libraryHref, type ExercisesTab } from '@/lib/library/address'

interface ExercisesTabsProps {
  tab: ExercisesTab
  children: React.ReactNode
}

/**
 * Die Reiter der Seite „Übungen" (PROJ-4). Der Reiter steht in der Adresse —
 * Neuladen und „Zurück" landen damit im selben Reiter. Dasselbe Muster wie in
 * der Verwaltung.
 */
export function ExercisesTabs({ tab, children }: ExercisesTabsProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  return (
    <Tabs
      value={tab}
      onValueChange={(next) =>
        startTransition(() =>
          router.push(next === 'library' ? libraryHref() : '/exercises', { scroll: false })
        )
      }
    >
      <TabsList className="grid h-auto w-full grid-cols-2 sm:w-96">
        {EXERCISE_TABS.map((value) => (
          <TabsTrigger key={value} value={value} className="px-1.5 text-sm">
            {EXERCISE_TAB_LABELS[value]}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        value={tab}
        aria-busy={pending}
        className={pending ? 'mt-6 opacity-60 transition-opacity' : 'mt-6'}
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
