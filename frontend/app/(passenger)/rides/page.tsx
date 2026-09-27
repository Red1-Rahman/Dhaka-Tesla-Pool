"use client"

import { useState } from "react"
import { ArrowRight, ClipboardList } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { RideStatusBadge } from "@/components/RideStatusBadge"
import type { RideHistoryEntry } from "@/types/api"

const filters = ["All", "Completed", "Cancelled"] as const
type Filter = (typeof filters)[number]

const rides: RideHistoryEntry[] = [
  { id: "banani-mohakhali-01", pickup: "Banani", dropoff: "Mohakhali", date: "Today · 8:42 AM", fareTotal: 74.4, status: "COMPLETED" },
  { id: "banani-gulshan-01", pickup: "Banani", dropoff: "Gulshan", date: "Yesterday · 6:18 PM", fareTotal: 57.6, status: "CANCELLED" },
  { id: "dhanmondi-banani-01", pickup: "Dhanmondi", dropoff: "Banani", date: "18 Sep · 9:05 AM", fareTotal: 91.8, status: "COMPLETED" },
  { id: "mohakhali-uttara-01", pickup: "Mohakhali", dropoff: "Uttara", date: "16 Sep · 7:26 PM", fareTotal: 132.0, status: "STARTED" },
  { id: "farmgate-mirpur-01", pickup: "Farmgate", dropoff: "Mirpur", date: "14 Sep · 5:44 PM", fareTotal: 86.4, status: "MATCHED" },
  { id: "bashundhara-banani-01", pickup: "Bashundhara", dropoff: "Banani", date: "12 Sep · 8:11 AM", fareTotal: 79.2, status: "COMPLETED" },
]

export default function RidesPage() {
  const [filter, setFilter] = useState<Filter>("All")
  const prefersReducedMotion = useReducedMotion()
  const visibleRides = rides.filter(
    (ride) => filter === "All" || (filter === "Completed" ? ride.status === "COMPLETED" : ride.status === "CANCELLED"),
  )

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center">
          <h1 className="text-[28px] font-medium leading-none tracking-[-0.03em]">Your rides</h1>
        </header>

        <section className="flex flex-1 flex-col pt-7">
          <div className="flex rounded-full border border-[var(--hairline)] bg-[var(--surface-2)] p-1" role="tablist" aria-label="Filter rides">
            {filters.map((item) => (
              <button key={item} role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`h-9 flex-1 rounded-full text-[13px] transition-colors ${filter === item ? "bg-[var(--surface)] font-medium text-[var(--ink)]" : "text-[var(--muted)]"}`}>
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col" aria-live="polite">
            {visibleRides.length > 0 ? (
              visibleRides.map((ride, index) => (
                <motion.a
                  key={ride.id}
                  href={`/rides/${ride.id}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.18, delay: prefersReducedMotion ? 0 : index * 0.035 }}
                  className="group flex min-h-[88px] items-center justify-between gap-4 border-b border-[var(--hairline)] py-4 first:border-t focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{ride.pickup} → {ride.dropoff}</span>
                    <span className="mt-1 block text-[12px] text-[var(--muted)]">{ride.date}</span>
                    <span className="mt-2 inline-block"><RideStatusBadge status={ride.status} /></span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[14px] tabular-nums">৳{ride.fareTotal.toFixed(2)}</span>
                    <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} className="text-[var(--faint)] transition-transform group-hover:translate-x-0.5" />
                  </span>
                </motion.a>
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <ClipboardList aria-hidden="true" size={22} strokeWidth={1.5} className="text-[var(--muted)]" />
                <p className="text-[14px] text-[var(--muted)]">No cancelled rides yet.</p>
              </div>
            )}
          </div>
        </section>

        <nav aria-label="Primary navigation" className="grid grid-cols-3 border-t border-[var(--hairline)] pt-4">
          <a href="/request" className="text-center text-[12px] text-[var(--muted)]">Home</a>
          <a href="/rides" aria-current="page" className="text-center text-[12px] font-medium text-[var(--primary)]">Rides</a>
          <a href="/wallet" className="text-center text-[12px] text-[var(--muted)]">Wallet</a>
        </nav>
      </div>
    </main>
  )
}
