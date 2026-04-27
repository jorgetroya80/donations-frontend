import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const { t } = useTranslation()

  const label = `${dayjs(from).format('DD/MM/YYYY')} - ${dayjs(to).format('DD/MM/YYYY')}`

  function handleSelect(range: DateRange | undefined) {
    if (range?.from && range?.to) {
      onChange(range.from, range.to)
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <span
          className={cn(
            'bg-background inline-flex shrink-0 items-center justify-start gap-2 rounded-lg border px-3 py-1.5 text-left text-sm font-normal',
            'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <CalendarIcon size={16} />
          {label}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={from}
          selected={{ from, to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          footer={
            <p className="text-muted-foreground text-center text-xs">
              {t('dashboard.selectRange')}
            </p>
          }
        />
      </PopoverContent>
    </Popover>
  )
}
