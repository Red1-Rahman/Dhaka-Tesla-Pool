"use client"

import { useState } from "react"
import { ArrowRight, CarFront, Check, MapPin, Moon, Sun, Users, Wifi, WifiOff } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { CANONICAL_POOL, THIRD_SEAT_PASSENGER, VEHICLE } from "@/lib/mock-data"
import { formatTaka } from "@/lib/format"
import { CapacityBadge } from "@/components/RideStatusBadge"

// available requests use the same canonical data as everywhere else in the
// app — no invented routes, no distance/fare pairs that don't derive from
// the real formula.
const requests = [CANONICAL_POOL[0], CANONICAL_POOL[1], THIRD_SEAT_PASSENGER]

// 1 + 1 + 1 = 3/3 — matches capacity, and Shirin (not an invented name)
// filling the last seat is exactly the brief's "last seat" story.
const stops = [
  { zone: CANONICAL_POOL[0].pickup, passenger: CANONICAL_POOL[0].name, seats: CANONICAL_POOL[0].seats, status: "next" as const },
  { zone: CANONICAL_POOL[1].dropoff, passenger: CANONICAL_POOL[1].name, seats: CANONICAL_POOL[1].seats, status: "upcoming" as const },
  { zone: THIRD_SEAT_PASSENGER.dropoff, passenger: THIRD_SEAT_PASSENGER.name, seats: THIRD_SEAT_PASSENGER.seats, status: "upcoming" as const },
]

export default function DriverDashboard() {
  const [online, setOnline] = useState(true)
  const [activePool, setActivePool] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const reducedMotion = useReducedMotion()
  const seatsTaken = stops.reduce((sum, stop) => sum + stop.seats, 0)

  return (
    <main className={isDark ? "dark min-h-screen" : "min-h-screen"}>
      <div className={`mx-auto flex min-h-screen w-full max-w-[620px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-8 ${!online ? "grayscale" : ""}`}>
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5"><CarFront size={19} strokeWidth={1.5} /><span className="text-[14px] font-semibold tracking-[0.02em]">Driver mode</span></div>
          <div className="flex items-center gap-2">
            <button aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setIsDark(!isDark)} className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]">{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <span className="font-mono text-[11px] text-[var(--muted)]">{VEHICLE.plate}</span>
          </div>
        </header>

        <section className={`flex flex-1 flex-col gap-5 pb-6 pt-6 transition-opacity ${!online ? "opacity-45" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)]">Good evening, {VEHICLE.driver}</p>
              <h1 className="mt-1 text-[25px] font-medium leading-tight tracking-[-0.03em]">{VEHICLE.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--muted)]"><MapPin size={13} />Banani, Dhaka</p>
            </div>
            <button onClick={() => setOnline(!online)} aria-pressed={online} className={`flex min-w-[122px] items-center justify-between gap-3 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors ${online ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]" : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--muted)]"}`}>
              <span>{online ? "Online" : "Offline"}</span>
              <span className={`flex size-6 items-center justify-center rounded-full ${online ? "bg-[var(--accent)] text-[#111113]" : "bg-[var(--muted)] text-[var(--surface-2)]"}`}>{online ? <Wifi size={13} /> : <WifiOff size={13} />}</span>
            </button>
          </div>

          {online && (
            <>
              <div className="flex items-center justify-between border-y border-[var(--hairline)] py-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Capacity</p>
                  <p className="mt-0.5 font-mono text-[15px]">{activePool ? `${seatsTaken} / ${VEHICLE.capacity} seats` : `${VEHICLE.capacity} seats`}</p>
                </div>
                <button onClick={() => setActivePool(!activePool)} className="text-[12px] text-[var(--primary)] underline underline-offset-4">{activePool ? "View requests" : "Open active pool"}</button>
              </div>

              {!activePool ? (
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <h2 className="text-[18px] font-medium">Available rides near Banani</h2>
                      <p className="mt-1 text-[13px] text-[var(--muted)]">Requested rides matched to your route.</p>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--faint)]">{String(requests.length).padStart(2, "0")} REQUESTED</span>
                  </div>
                  <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                    {requests.map((ride) => (
                      <div key={ride.name} className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[15px] font-medium">{ride.pickup} <span className="text-[var(--muted)]">→</span> {ride.dropoff}</p>
                            <p className="mt-1 text-[12px] text-[var(--muted)]">{ride.name} · {ride.seats} {ride.seats === 1 ? "seat" : "seats"} requested · {ride.distanceKm.toFixed(1)} km</p>
                          </div>
                          <span className="font-mono text-[13px] tabular-nums">{formatTaka(ride.fare.total)}</span>
                        </div>
                        <button onClick={() => setActivePool(true)} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[7px] bg-[var(--primary)] text-[12px] font-semibold text-[var(--primary-ink)]">Accept <ArrowRight size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                  <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Active pool</p>
                        <h2 className="mt-1 text-[18px] font-medium">Bullet · {stops.length} passengers</h2>
                      </div>
                      <CapacityBadge full={seatsTaken >= VEHICLE.capacity} />
                    </div>
                    <div className="relative flex h-[104px] items-center justify-center rounded-[9px] bg-[var(--surface-2)]">
                      <div className="absolute inset-x-12 top-1/2 h-px bg-[var(--primary)]" />
                      <div className="relative z-10 flex items-center gap-8">
                        {stops.map((stop) => (
                          <div key={stop.passenger} className="flex flex-col items-center gap-2">
                            <span className={`flex size-11 items-center justify-center rounded-full border-2 ${stop.status === "next" ? "border-[var(--accent)] bg-[var(--accent)] text-[#111113]" : "border-[var(--primary)] bg-[var(--surface)]"}`}><Users size={16} /></span>
                            <span className="font-mono text-[10px] text-[var(--muted)]">{stop.seats} seat</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-[12px] text-[var(--muted)]">{VEHICLE.plate} · {VEHICLE.capacity} seats · Banani → shared destinations</p>
                  </div>
                  <button className="flex h-[54px] items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)]">Next: I&apos;ve arrived <ArrowRight size={17} /></button>
                  <div>
                    <h2 className="mb-3 text-[16px] font-medium">Pickup route</h2>
                    <div className="ml-2 border-l border-[var(--hairline)]">
                      {stops.map((stop, index) => (
                        <div key={stop.passenger} className="relative flex gap-4 pb-5 pl-5 last:pb-0">
                          <span className={`absolute -left-[5px] top-1 size-[9px] rounded-full border-2 border-[var(--canvas)] ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`} />
                          <div>
                            <p className="text-[14px] font-medium">{stop.zone}</p>
                            <p className="text-[12px] text-[var(--muted)]">{stop.passenger} · {stop.seats} {stop.seats === 1 ? "seat" : "seats"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {!online && (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <WifiOff size={22} className="text-[var(--muted)]" />
              <h2 className="mt-4 text-[18px] font-medium">You&apos;re offline</h2>
              <p className="mt-1 max-w-[260px] text-[13px] text-[var(--muted)]">Go online to see nearby ride requests and start a pool.</p>
            </div>
          )}
        </section>

        <footer className="border-t border-[var(--hairline)] pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Today&apos;s earnings</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-[28px] leading-none tabular-nums">৳1,248</span>
                <span className="text-[12px] text-[var(--muted)]">8 rides</span>
              </div>
            </div>
            <svg viewBox="0 0 116 36" className="h-9 w-[116px]" role="img" aria-label="Earnings trend rising"><polyline points="2,29 18,26 31,28 46,17 61,20 75,10 91,14 114,3" fill="none" stroke="var(--primary)" strokeWidth="1.5" /></svg>
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] text-[var(--muted)]"><Check size={12} /> Active vehicle · capacity {VEHICLE.capacity}</p>
        </footer>
      </div>
    </main>
  )
}
