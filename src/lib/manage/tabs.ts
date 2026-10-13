import { categoryAnchor, type CategoryType } from './categories'

export const MANAGE_TABS = ['venues', 'patterns', 'categories'] as const
export type ManageTab = (typeof MANAGE_TABS)[number]

export const MANAGE_TAB_LABELS: Record<ManageTab, string> = {
  venues: 'Hallen',
  patterns: 'Stundenmuster',
  categories: 'Kategorien',
}

export function isManageTab(value: unknown): value is ManageTab {
  return typeof value === 'string' && (MANAGE_TABS as readonly string[]).includes(value)
}

/** Die Adresse eines Reiters; bei Kategorien wahlweise gleich der Abschnitt einer Art. */
export function manageHref(tab: ManageTab, categoryType?: CategoryType): string {
  const base = `/manage?tab=${tab}`
  return tab === 'categories' && categoryType ? `${base}#${categoryAnchor(categoryType)}` : base
}
