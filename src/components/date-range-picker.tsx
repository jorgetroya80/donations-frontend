import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start text-left font-normal')}
        >
          <CalendarIcon size={16} />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={from}
          selected={{ from, to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          footer={
            <p className="text-center text-xs text-muted-foreground">
              {t('dashboard.selectRange')}
            </p>
          }
        />
      </PopoverContent>
    </Popover>
  )
}
