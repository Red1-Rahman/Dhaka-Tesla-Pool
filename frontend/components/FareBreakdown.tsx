import { formatTaka } from "@/lib/format"
import type { FareBreakdownValue } from "@/types/api"

interface FareBreakdownProps {
  fare: FareBreakdownValue
  distanceKm: number
}

// base fare is the flat ৳30 fee, shown separately from the distance
// charge — never collapse them into one "base" line, that's what made the
// Pool Detail screen's breakdown not add up under its own labels.
export function FareBreakdown({ fare, distanceKm }: FareBreakdownProps) {
  return (
    <div className="flex flex-col gap-1 text-right font-mono text-[11px] text-[var(--muted)]">
      <div className="flex justify-between">
        <span>Base fare</span>
        <span>{formatTaka(fare.baseFare)}</span>
      </div>
      <div className="flex justify-between">
        <span>Distance × rate ({distanceKm.toFixed(1)} km × ৳15.00)</span>
        <span>{formatTaka(fare.distanceCharge)}</span>
      </div>
      {fare.discount > 0 && (
        <div className="flex justify-between text-[var(--primary)]">
          <span>Pool discount (−20%)</span>
          <span>-{formatTaka(fare.discount)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between border-t border-[var(--hairline)] pt-1 text-[var(--ink)]">
        <span>Total</span>
        <span>{formatTaka(fare.total)}</span>
      </div>
    </div>
  )
}
