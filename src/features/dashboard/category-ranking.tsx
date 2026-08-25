import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/lib/formatters'
import { calcPctChange } from './financial-overview.utils'
import { PctChange } from './pct-change'

export interface RankingItem {
  key: string
  label: string
  current: number
  previous: number | null | undefined
}

export interface CategoryRankingProps {
  items: RankingItem[]
  /** Title of the card this table sits in, used for the screen-reader caption. */
  title: string
  /** True for expenses, where an increase is bad. */
  inverted?: boolean
}

export function CategoryRanking({
  items,
  title,
  inverted,
}: CategoryRankingProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  // Ties break by label so the order does not jump between renders.
  const rows = [...items].sort(
    (a, b) => b.current - a.current || a.label.localeCompare(b.label)
  )
  const max = rows[0]?.current ?? 0

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        {t('dashboard.rankingCaption', { title })}
      </caption>
      <tbody>
        {rows.map((item) => (
          <tr key={item.key}>
            <td className="py-1.5 pr-3 text-right align-middle whitespace-nowrap">
              {item.label}
            </td>
            <td className="w-full py-1.5">
              <div aria-hidden="true" className="bg-muted h-5 rounded">
                <div
                  className="bg-chart-1 h-5 min-w-[3px] rounded"
                  style={{
                    width: `${max > 0 ? (item.current / max) * 100 : 0}%`,
                  }}
                />
              </div>
            </td>
            <td className="py-1.5 pl-3 text-right font-medium whitespace-nowrap">
              {formatCurrency(item.current)}
            </td>
            <td className="py-1.5 pl-3 text-right whitespace-nowrap">
              {calcPctChange(item.current, item.previous) == null &&
              item.current > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {t('dashboard.newCategory')}
                </span>
              ) : (
                <PctChange
                  current={item.current}
                  previous={item.previous}
                  inverted={inverted}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
