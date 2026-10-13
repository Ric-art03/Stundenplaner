'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MANAGE_TABS, MANAGE_TAB_LABELS, manageHref, type ManageTab } from '@/lib/manage/tabs'

interface ManageTabsProps {
  tab: ManageTab
  children: React.ReactNode
}

/**
 * Die Reiterleiste der Verwaltung. Der gewählte Reiter steht in der Adresse —
 * Neuladen, Weitergeben und jeder „verwalten"-Link landen damit von selbst am
 * richtigen Platz. Den Inhalt lädt der Server je Reiter.
 */
export function ManageTabs({ tab, children }: ManageTabsProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  return (
    <Tabs
      value={tab}
      onValueChange={(next) =>
        startTransition(() => router.push(manageHref(next as ManageTab), { scroll: false }))
      }
    >
      <TabsList className="grid h-auto w-full grid-cols-3">
        {MANAGE_TABS.map((value) => (
          <TabsTrigger key={value} value={value} className="px-1.5 text-xs sm:text-sm">
            {MANAGE_TAB_LABELS[value]}
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
