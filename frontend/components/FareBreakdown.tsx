import { PaisaAmount } from "@/components/ui/paisa-amount"
import type { FareBreakdownValue } from "@/types/api"

interface FareBreakdownProps {
  fare: FareBreakdownValue
  distanceKm: number
}

// Base fare is shown separately from the distance charge.
export function FareBreakdown({
  fare,
  distanceKm,
}: FareBreakdownProps) {
  return (
    <div className="flex flex-col gap-1 text-right font-mono text-[11px] text-[var(--muted)]">
      <div className="flex justify-between">
        <span>Base fare</span>
        <PaisaAmount value={fare.baseFarePaisa} iconSize={12} />
      </div>

      <div className="flex justify-between">
        <span className="inline-flex items-center gap-1">
          Distance × rate ({distanceKm.toFixed(1)} km ×
          <PaisaAmount value={1500} iconSize={12} />)
        </span>
        <PaisaAmount value={fare.distanceChargePaisa} iconSize={12} />
      </div>

      {fare.discountPaisa > 0 && (
        <div className="flex justify-between text-[var(--primary)]">
          <span>Pool discount (−20%)</span>
          <span className="inline-flex items-center gap-1">
            -
            <PaisaAmount value={fare.discountPaisa} iconSize={12} />
          </span>
        </div>
      )}

      <div className="mt-1 flex justify-between border-t border-[var(--hairline)] pt-1 text-[var(--ink)]">
        <span>Total</span>
        <PaisaAmount value={fare.totalPaisa} iconSize={12} />
      </div>
    </div>
  )
}
