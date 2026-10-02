'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, Trash2, CalendarDays, RefreshCw, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { WEEKDAYS, type GroupSchedule, type ScheduleType } from '@/lib/types/group'

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

interface ScheduleInputProps {
  schedules: GroupSchedule[]
  onChange: (schedules: GroupSchedule[]) => void
  errors?: Record<number, { weekday?: string; startTime?: string; endTime?: string; date?: string }>
}

function splitTime(time: string): [string, string] {
  if (!time) return ['', '']
  const [h, m] = time.split(':')
  return [h ?? '', m ?? '']
}

function joinTime(hour: string, minute: string): string {
  if (!hour || !minute) return ''
  return `${hour}:${minute}`
}

export function ScheduleInput({ schedules, onChange, errors }: ScheduleInputProps) {
  function addSchedule(type: ScheduleType) {
    onChange([...schedules, {
      scheduleType: type,
      weekday: '',
      date: null,
      startTime: '',
      endTime: '',
    }])
  }

  function removeSchedule(index: number) {
    onChange(schedules.filter((_, i) => i !== index))
  }

  function updateSchedule(index: number, field: keyof GroupSchedule, value: string | null) {
    const updated = schedules.map((s, i) => {
      if (i !== index) return s
      return { ...s, [field]: value }
    })
    onChange(updated)
  }

  function updateTime(index: number, field: 'startTime' | 'endTime', part: 'hour' | 'minute', value: string) {
    const schedule = schedules[index]
    const current = schedule[field]
    const [h, m] = splitTime(current)
    const newTime = part === 'hour' ? joinTime(value, m || '00') : joinTime(h || '00', value)
    updateSchedule(index, field, newTime)
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-3">
          {/* Header row with type label and delete */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {schedule.scheduleType === 'recurring' ? (
                <><RefreshCw className="h-3 w-3" /> Wiederkehrend</>
              ) : (
                <><CalendarDays className="h-3 w-3" /> Einmalig</>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSchedule(index)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            {/* Weekday or Date */}
            {schedule.scheduleType === 'recurring' ? (
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground mb-1 block">Wochentag</label>
                <Select
                  value={schedule.weekday}
                  onValueChange={(v) => updateSchedule(index, 'weekday', v)}
                >
                  <SelectTrigger className={errors?.[index]?.weekday ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.[index]?.weekday && (
                  <p className="text-xs text-destructive mt-1">{errors[index].weekday}</p>
                )}
              </div>
            ) : (
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <label className="text-xs text-muted-foreground mb-1 block">Datum</label>
                <DatePicker
                  value={schedule.date}
                  onChange={(d) => updateSchedule(index, 'date', d)}
                  error={!!errors?.[index]?.date}
                />
                {errors?.[index]?.date && (
                  <p className="text-xs text-destructive mt-1">{errors[index].date}</p>
                )}
              </div>
            )}

            {/* Start time */}
            <div className="w-full sm:w-auto">
              <label className="text-xs text-muted-foreground mb-1 block">Beginn</label>
              <TimeSelect
                value={schedule.startTime}
                onHourChange={(v) => updateTime(index, 'startTime', 'hour', v)}
                onMinuteChange={(v) => updateTime(index, 'startTime', 'minute', v)}
                error={!!errors?.[index]?.startTime}
              />
              {errors?.[index]?.startTime && (
                <p className="text-xs text-destructive mt-1">{errors[index].startTime}</p>
              )}
            </div>

            {/* End time */}
            <div className="w-full sm:w-auto">
              <label className="text-xs text-muted-foreground mb-1 block">Ende</label>
              <TimeSelect
                value={schedule.endTime}
                onHourChange={(v) => updateTime(index, 'endTime', 'hour', v)}
                onMinuteChange={(v) => updateTime(index, 'endTime', 'minute', v)}
                error={!!errors?.[index]?.endTime}
              />
              {errors?.[index]?.endTime && (
                <p className="text-xs text-destructive mt-1">{errors[index].endTime}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addSchedule('recurring')}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Wiederkehrende Trainingszeit hinzufügen
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addSchedule('one_time')}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Einmalige Trainingszeit hinzufügen
        </Button>
      </div>
    </div>
  )
}

function TimeSelect({
  value,
  onHourChange,
  onMinuteChange,
  error,
}: {
  value: string
  onHourChange: (v: string) => void
  onMinuteChange: (v: string) => void
  error?: boolean
}) {
  const [h, m] = splitTime(value)

  return (
    <div className="flex items-center gap-1">
      <Select value={h} onValueChange={onHourChange}>
        <SelectTrigger className={cn('w-[72px]', error && 'border-destructive')}>
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-medium">:</span>
      <Select value={m} onValueChange={onMinuteChange}>
        <SelectTrigger className={cn('w-[72px]', error && 'border-destructive')}>
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((min) => (
            <SelectItem key={min} value={min}>{min}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DatePicker({
  value,
  onChange,
  error,
}: {
  value: string | null
  onChange: (date: string | null) => void
  error?: boolean
}) {
  const selected = value ? new Date(value + 'T00:00:00') : undefined

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange(null)
      return
    }
    const iso = format(date, 'yyyy-MM-dd')
    onChange(iso)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(new Date(value + 'T00:00:00'), 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={de}
        />
      </PopoverContent>
    </Popover>
  )
}
