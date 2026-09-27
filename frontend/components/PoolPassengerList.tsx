"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { formatTaka } from "@/lib/format"
import { FareBreakdown } from "./FareBreakdown"
import type { PoolPassenger } from "@/types/api"

function PassengerRow({ passenger }: { passenger: PoolPassenger }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--hairline)] py-4 last:border-b-0">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-ink)]">
          {passenger.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">{passenger.name}</span>
          <span className="mt-0.5 block truncate text-[12px] text-[var(--muted)]">
            {passenger.pickup} → {passenger.dropoff}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--accent)] px-2 py-1 font-mono text-[9px] text-[#111113]">pooled</span>
          <span className="font-mono text-[13px] tabular-nums">{formatTaka(passenger.fare.total)}</span>
          <ChevronDown aria-hidden="true" size={15} strokeWidth={1.5} className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-12 mt-3 overflow-hidden">
          <FareBreakdown fare={passenger.fare} distanceKm={passenger.distanceKm} />
        </motion.div>
      )}
    </div>
  )
}

export function PoolPassengerList({ passengers }: { passengers: PoolPassenger[] }) {
  const totalDiscount = passengers.reduce((sum, passenger) => sum + passenger.fare.discount, 0)

  return (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-[16px] font-medium">Passengers</h2>
        <span className="font-mono text-[11px] text-[var(--muted)]">{passengers.length} people · pooled</span>
      </div>
      <div className="border-t border-[var(--hairline)]">
        {passengers.map((passenger) => (
          <PassengerRow key={passenger.name} passenger={passenger} />
        ))}
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-[8px] border-l-2 border-[var(--accent)] bg-[var(--surface-2)] px-4 py-3">
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
        <p className="text-[13px] leading-5">
          Everyone saves 20% — total pool discount <span className="font-mono font-medium">{formatTaka(totalDiscount)}</span>
        </p>
      </div>
    </section>
  )
}
