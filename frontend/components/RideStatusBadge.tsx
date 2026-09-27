import type { RideStatus } from "@/types/api"

const activeStatuses: RideStatus[] = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"]

function classesFor(status: RideStatus): string {
  if (status === "COMPLETED") return "bg-[var(--surface-2)] text-[var(--muted)]"
  if (status === "CANCELLED")
    return "bg-[color-mix(in_srgb,var(--danger)_14%,var(--surface))] text-[var(--danger)]"
  if (activeStatuses.includes(status)) return "bg-[var(--primary)] text-[var(--primary-ink)]"
  return "bg-[var(--surface-2)] text-[var(--muted)]"
}

// exact lifecycle strings from common/status-machine.ts — never a friendlier
// label, the string shown is the string the backend actually returns.
export function RideStatusBadge({ status }: { status: RideStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] tracking-[0.06em] ${classesFor(status)}`}
    >
      {status}
    </span>
  )
}

// same idea for the driver dashboard's "seats full" pill, which was
// borrowing --accent (a brand color, not a semantic one) before.
export function CapacityBadge({ full }: { full: boolean }) {
  if (!full) {
    return (
      <span className="shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-1 font-mono text-[10px] text-[#111113]">
        seat open
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-[var(--warning)] px-2.5 py-1 font-mono text-[10px] text-[#111113]">
      FULL
    </span>
  )
}
