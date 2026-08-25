import { calcPctChange } from './financial-overview.utils'

export function PctChange({
  current,
  previous,
  inverted = false,
}: {
  current: number | null | undefined
  previous: number | null | undefined
  inverted?: boolean
}) {
  const pct = calcPctChange(current, previous)
  // The previous-period queries resolve independently of the current-period
  // ones, so hold the line's space until they land or the card grows a row.
  if (pct == null)
    return (
      <span
        data-slot="pct-change"
        aria-hidden="true"
        className="invisible mt-1 text-xs font-medium"
      >
        &nbsp;
      </span>
    )
  const isPositive = pct > 0
  const isGood = inverted ? !isPositive : isPositive
  return (
    <span
      data-slot="pct-change"
      className={`mt-1 text-xs font-medium ${isGood ? 'text-success' : 'text-destructive'}`}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}
