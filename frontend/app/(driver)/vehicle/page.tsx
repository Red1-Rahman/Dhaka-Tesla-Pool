"use client"

import { useState } from "react"
import { CarFront, Wifi, WifiOff } from "lucide-react"
import { VEHICLE } from "@/lib/mock-data"

export default function VehiclePage() {
  const [isOnline, setIsOnline] = useState(true)

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center">
          <h1 className="text-[24px] font-medium tracking-[-0.02em]">My vehicle</h1>
        </header>

        <section className="flex flex-1 flex-col gap-5 pt-6">
          <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]"><CarFront size={20} strokeWidth={1.5} /></span>
              <div>
                <p className="text-[17px] font-medium">{VEHICLE.name}</p>
                <p className="mt-0.5 font-mono text-[12px] text-[var(--muted)]">{VEHICLE.plate}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-4">
              <span className="text-[13px] text-[var(--muted)]">Capacity</span>
              <span className="font-mono text-[14px] tabular-nums">{VEHICLE.capacity} seats</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] text-[var(--muted)]">Driver</span>
              <span className="text-[14px]">{VEHICLE.driver}</span>
            </div>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            aria-pressed={isOnline}
            className={`flex h-[52px] items-center justify-between rounded-[8px] border px-4 text-[14px] font-medium transition-colors ${isOnline ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]" : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--muted)]"}`}
          >
            <span>{isOnline ? "Online — accepting rides" : "Offline"}</span>
            {isOnline ? <Wifi size={17} strokeWidth={1.5} /> : <WifiOff size={17} strokeWidth={1.5} />}
          </button>

          <p className="text-[12px] text-[var(--muted)]">
            One vehicle per driver in this MVP. Going offline stops new ride requests from being routed to you; any pool already in progress isn&apos;t affected.
          </p>
        </section>
      </div>
    </main>
  )
}
