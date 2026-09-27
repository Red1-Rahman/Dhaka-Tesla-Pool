"use client"

import { useState } from "react"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { CANONICAL_POOL, THIRD_SEAT_PASSENGER, VEHICLE } from "@/lib/mock-data"
import { PoolPassengerList } from "@/components/PoolPassengerList"
import { CapacityBadge } from "@/components/RideStatusBadge"

function BulletSeatMap({ full }: { full: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[470px] rounded-[14px] bg-[var(--surface-2)] px-5 py-7 sm:px-10">
      <svg viewBox="0 0 470 165" className="h-auto w-full" role="img" aria-label={full ? "Tesla Bullet with three occupied seats" : "Tesla Bullet with two occupied seats and one open seat"}>
        <path d="M38 116h18l21-38c7-14 22-22 39-22h145c21 0 36 8 50 23l22 25h53c14 0 25 9 25 22v12H38c-10 0-16-6-16-12s6-10 16-10Z" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M100 66l16-10h57l15 32H83l17-22Zm106-10h42c13 0 23 6 34 20l9 12h-70l-15-32Z" fill="none" stroke="var(--muted)" strokeWidth="1.2" />
        <circle cx="112" cy="126" r="16" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" /><circle cx="112" cy="126" r="6" fill="none" stroke="var(--muted)" strokeWidth="1" />
        <circle cx="227" cy="126" r="16" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" /><circle cx="227" cy="126" r="6" fill="none" stroke="var(--muted)" strokeWidth="1" />
        <circle cx="342" cy="126" r="16" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" /><circle cx="342" cy="126" r="6" fill="none" stroke="var(--muted)" strokeWidth="1" />
        <path d="M388 105h27M160 95h46" stroke="var(--hairline)" strokeWidth="1" />
      </svg>
      <span className="absolute left-[24%] top-[52%] flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-ink)]">NR</span>
      {full ? (
        <span className="absolute left-1/2 top-[52%] flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-ink)]">{THIRD_SEAT_PASSENGER.initials}</span>
      ) : (
        <span className="absolute left-1/2 top-[52%] size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--faint)]" />
      )}
      <span className="absolute left-[76%] top-[52%] flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-ink)]">RA</span>
      <div className="mt-5 flex justify-center gap-5 font-mono text-[10px] text-[var(--muted)]">
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[var(--primary)]" />Occupied</span>
        {!full && <span className="flex items-center gap-2"><i className="size-2 rounded-full border border-dashed border-[var(--faint)]" />Open seat</span>}
      </div>
    </div>
  )
}

export default function SharedPoolPage() {
  const [isDark, setIsDark] = useState(false)
  const [showFullExample, setShowFullExample] = useState(false)
  const passengers = showFullExample ? [...CANONICAL_POOL, THIRD_SEAT_PASSENGER] : CANONICAL_POOL
  const seatsTaken = passengers.reduce((sum, passenger) => sum + passenger.seats, 0)

  return (
    <main className={isDark ? "dark min-h-screen" : "min-h-screen"}>
      <div className="mx-auto flex min-h-screen w-full max-w-[620px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-10 sm:px-8">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--hairline)]">
          <div className="flex items-center gap-3">
            <a href="/dashboard" aria-label="Back to dashboard" className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"><ArrowLeft size={17} /></a>
            <div><p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">Live ride</p><h1 className="text-[18px] font-medium">Shared pool</h1></div>
          </div>
          <button aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setIsDark(!isDark)} className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]">{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>
        </header>

        <section className="flex flex-col gap-5 pb-7 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">{VEHICLE.name}</p><h2 className="mt-1 text-[25px] font-medium tracking-[-0.03em]">Banani → shared destinations</h2></div>
            <CapacityBadge full={showFullExample} />
          </div>

          <BulletSeatMap full={showFullExample} />

          <div className="flex items-center justify-between border-y border-[var(--hairline)] py-3">
            <div><p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Vehicle</p><p className="mt-0.5 font-mono text-[13px]">{VEHICLE.plate} · {seatsTaken} / {VEHICLE.capacity} seats taken</p></div>
            <span className="font-mono text-[11px] text-[var(--muted)]">{VEHICLE.driver.toUpperCase()} · DRIVER</span>
          </div>

          <PoolPassengerList passengers={passengers} />

          <button onClick={() => setShowFullExample(!showFullExample)} className="self-start font-mono text-[10px] text-[var(--muted)] underline decoration-[var(--faint)] underline-offset-4">
            {showFullExample ? "Show open-seat state" : "Preview full-pool state"}
          </button>
        </section>
      </div>
    </main>
  )
}
