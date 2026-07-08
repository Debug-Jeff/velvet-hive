import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from?: Date
  to?: Date
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

const PRESETS: { label: string; getRange: () => DateRangeValue }[] = [
  { label: 'Today', getRange: () => ({ from: startOfDay(new Date()), to: new Date() }) },
  { label: 'Last 7 days', getRange: () => ({ from: daysAgo(6), to: new Date() }) },
  { label: 'Last 30 days', getRange: () => ({ from: daysAgo(29), to: new Date() }) },
  {
    label: 'This month',
    getRange: () => {
      const now = new Date()
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    },
  },
  { label: 'All time', getRange: () => ({ from: undefined, to: undefined }) },
]

function formatDate(d?: Date) {
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const label =
    value.from || value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : 'All time'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start font-normal">
          <CalendarIcon />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn('justify-start font-normal')}
                onClick={() => {
                  onChange(preset.getRange())
                  setOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={value as DateRange}
            onSelect={(range) => onChange(range ?? {})}
            numberOfMonths={2}
            defaultMonth={value.from}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
