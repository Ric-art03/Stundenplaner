'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExerciseLink } from '@/lib/types/exercise'

interface LinkInputProps {
  links: ExerciseLink[]
  onChange: (links: ExerciseLink[]) => void
}

export function LinkInput({ links, onChange }: LinkInputProps) {
  function addLink() {
    onChange([...links, { url: '', title: '' }])
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index))
  }

  function updateLink(index: number, field: keyof ExerciseLink, value: string) {
    onChange(links.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
            />
            <Input
              placeholder="Titel (optional)"
              value={link.title ?? ''}
              onChange={(e) => updateLink(index, 'title', e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeLink(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addLink}>
        <Plus className="mr-2 h-4 w-4" />
        Link hinzufügen
      </Button>
    </div>
  )
}
