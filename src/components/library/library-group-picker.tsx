'use client'

import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NONE = 'none'

interface LibraryGroupPickerProps {
  groups: { id: string; name: string }[]
  groupId: string | null
  onChange: (groupId: string | null) => void
}

/** „Passt zu Gruppe" — zeigt nur, was zur gewählten Gruppe passt, und wählt vor. */
export function LibraryGroupPicker({ groups, groupId, onChange }: LibraryGroupPickerProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm sm:flex-row sm:items-center">
        <p className="flex-1 text-muted-foreground">
          <Users className="mr-1.5 inline h-4 w-4 align-text-bottom" aria-hidden />
          Für &bdquo;Passt zu Gruppe&ldquo; braucht es eine Gruppe — dann wählt die App
          vor, was der Generator für sie sofort einplanen würde.
        </p>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            Gruppe anlegen
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <Label htmlFor="library-group" className="shrink-0">
        Passt zu Gruppe
      </Label>
      <Select value={groupId ?? NONE} onValueChange={(value) => onChange(value === NONE ? null : value)}>
        <SelectTrigger id="library-group" className="w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Keine Gruppe — alle Übungen</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
