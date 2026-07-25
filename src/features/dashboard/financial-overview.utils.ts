import dayjs from 'dayjs'

export function formatDate(d: Date) {
  return dayjs(d).format('YYYY-MM-DD')
}

export function previousRange(from: Date, to: Date) {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1
  return {
    from: dayjs(from).subtract(days, 'day').format('YYYY-MM-DD'),
    to: dayjs(from).subtract(1, 'day').format('YYYY-MM-DD'),
  }
}

export function calcPctChange(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}
