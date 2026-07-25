import dayjs from 'dayjs'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD')
}

export function currentMonthRange(): { from: Date; to: Date } {
  return {
    from: dayjs().startOf('month').toDate(),
    to: dayjs().endOf('month').toDate(),
  }
}
