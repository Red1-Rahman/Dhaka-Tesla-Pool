"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Share2,
  Star,
  X,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  CANONICAL_POOL,
  VEHICLE,
} from "@/lib/mock-data"
import { PaisaAmount } from "@/components/ui/paisa-amount"
import { PoolPassengerList } from "@/components/PoolPassengerList"
import { RickshawSilhouette } from "@/components/RickshawSilhouette"
import type { RideStatus } from "@/types/api"

// Happy-path lifecycle, exact strings from common/status-machine.ts.
const states: RideStatus[] = [
  "REQUESTED",
  "MATCHED",
  "DRIVER_ARRIVED",
  "STARTED",
  "COMPLETED",
]

// Label for the mock "advance" button, keyed by the status we are advancing from.
const NEXT_LABEL: Partial<Record<RideStatus, string>> = {
  REQUESTED: "Simulate match",
  MATCHED: "I've arrived",
  DRIVER_ARRIVED: "Start trip",
  STARTED: "Complete trip",
}

function Timeline({ current }: { current: RideStatus }) {
  const currentIndex = states.indexOf(current)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          Ride status
        </span>

        <span className="font-mono text-[11px] text-[var(--faint)]">
          POOL-2409-01
        </span>
      </div>

      <div className="flex items-start">
        {states.map((state, index) => {
          const complete = index < currentIndex
          const active = index === currentIndex

          return (
            <div
              key={state}
              className="flex min-w-0 flex-1 items-start last:flex-none"
            >
              <div className="flex w-full flex-col items-center gap-3">
                <div className="flex w-full items-center">
                  <div
                    className={`h-px flex-1 ${
                      index === 0
                        ? "bg-transparent"
                        : complete
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--hairline)]"
                    }`}
                  />

                  <motion.span
                    animate={
                      active && !prefersReducedMotion
                        ? { scale: [1, 1.12, 1] }
                        : { scale: 1 }
                    }
                    transition={{
                      duration: 1.6,
                      repeat: active ? Infinity : 0,
                    }}
                    className={`relative size-3 shrink-0 rounded-full border ${
                      complete
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : active
                          ? "border-[var(--accent)] bg-[var(--accent)]"
                          : "border-[var(--faint)] bg-[var(--surface)]"
                    }`}
                  />

                  {index === states.length - 1 ? null : (
                    <div
                      className={`h-px flex-1 ${
                        complete
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--hairline)]"
                      }`}
                    />
                  )}
                </div>

                <span
                  className={`text-center font-mono text-[9px] tracking-[0.08em] ${
                    active
                      ? "font-semibold text-[var(--ink)]"
                      : "text-[var(--faint)]"
                  }`}
                >
                  {state}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RideDetailPage() {
  const [status, setStatus] = useState<RideStatus>("MATCHED")
  const [cancelled, setCancelled] = useState(false)

  const currentIndex = states.indexOf(status)

  const isCompleted = status === "COMPLETED"
  const canCancel =
    status === "REQUESTED" || status === "MATCHED"

  // One entry per occupied seat, in seating order (a 2-seat request fills 2 seats).
  const occupants = CANONICAL_POOL.flatMap((passenger) =>
    Array<string>(passenger.seats).fill(passenger.initials),
  )
  const seatsTaken = occupants.length
  const seatsOpen = VEHICLE.capacity - seatsTaken

  // Receipt maths: subtotal - discount = total, all integer paisa.
  const subtotalPaisa = CANONICAL_POOL.reduce(
    (sum, passenger) => sum + passenger.fare.subtotalPaisa,
    0,
  )
  const totalDiscountPaisa = CANONICAL_POOL.reduce(
    (sum, passenger) => sum + passenger.fare.discountPaisa,
    0,
  )
  const totalFarePaisa = CANONICAL_POOL.reduce(
    (sum, passenger) => sum + passenger.fare.totalPaisa,
    0,
  )

  const advanceStatus = () =>
    setStatus(
      states[Math.min(currentIndex + 1, states.length - 1)],
    )

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-28 sm:px-7">
        <header className="flex h-[68px] items-center gap-3">
          <Link
            href="/rides"
            aria-label="Back to rides"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
          >
            <ArrowLeft aria-hidden="true" size={17} />
          </Link>

          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Active pool
            </p>

            <h1 className="text-[19px] font-medium">
              Banani → shared ride
            </h1>
          </div>
        </header>

        {cancelled ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <X aria-hidden="true" className="text-[var(--muted)]" />

            <h2 className="text-[20px] font-medium">
              Ride cancelled
            </h2>

            <p className="text-[13px] text-[var(--muted)]">
              This pool is no longer active.
            </p>

            <Link
              href="/request"
              className="mt-4 rounded-[8px] bg-[var(--primary)] px-5 py-3 text-[13px] font-semibold text-[var(--primary-ink)]"
            >
              Request another ride
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <Timeline current={status} />
            </div>

            <section className="mt-5 rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-medium">
                    {VEHICLE.name}
                  </h2>

                  <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                    {VEHICLE.plate} · {seatsTaken} / {VEHICLE.capacity}{" "}
                    seats taken
                  </p>
                </div>

                <span className="rounded-full bg-[var(--accent)] px-2 py-1 font-mono text-[10px] text-[#111113]">
                  {seatsOpen === 0
                    ? "Full"
                    : `${seatsOpen} seat${seatsOpen === 1 ? "" : "s"} open`}
                </span>
              </div>

              <RickshawSilhouette
                occupants={occupants}
                capacity={VEHICLE.capacity}
                label={`${VEHICLE.name}, electric rickshaw`}
              />

              <p className="mt-3 text-center text-[12px] text-[var(--muted)]">
                Shared pickup zone · different destinations
              </p>
            </section>

            <div className="mt-5">
              <PoolPassengerList passengers={CANONICAL_POOL} />
            </div>

            <section className="mt-5 flex items-center gap-3 border-y border-[var(--hairline)] py-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)] text-[12px] font-semibold text-[var(--primary-ink)]">
                JA
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">
                  {VEHICLE.driver}
                </span>

                <span className="mt-1 block font-mono text-[11px] text-[var(--muted)]">
                  {VEHICLE.name} · {VEHICLE.plate} · capacity{" "}
                  {VEHICLE.capacity}
                </span>
              </span>

              <button
                aria-label={`Call ${VEHICLE.driver}`}
                className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
              >
                <Phone aria-hidden="true" size={15} />
              </button>

              <button
                aria-label={`Message ${VEHICLE.driver}`}
                className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
              >
                <MessageCircle aria-hidden="true" size={15} />
              </button>
            </section>

            {isCompleted && (
              <section className="mt-6 border-t border-[var(--hairline)] pt-5">
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  POOL-2409-01 · RECEIPT
                </p>

                <h2 className="mt-3 text-[24px] font-medium">
                  Banani → shared destinations
                </h2>

                <div className="mt-5 flex flex-col gap-2 border-y border-[var(--hairline)] py-4 font-mono text-[12px]">
                  <div className="flex items-center justify-between">
                    <span>Fare before discount</span>

                    <PaisaAmount
                      value={subtotalPaisa}
                      iconSize={12}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[var(--primary)]">
                    <span>
                      <i className="mr-2 inline-block size-1.5 rounded-full bg-[var(--accent)]" />
                      Pool discount
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <span>-</span>

                      <PaisaAmount
                        value={totalDiscountPaisa}
                        iconSize={12}
                      />
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-[var(--hairline)] pt-3 text-[32px] text-[var(--ink)]">
                    <span>Total</span>

                    <PaisaAmount
                      value={totalFarePaisa}
                      iconSize={22}
                      className="font-mono text-[32px] tabular-nums"
                    />
                  </div>
                </div>

                <button className="mt-4 flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[var(--hairline)] px-4 text-[13px] text-[var(--muted)]">
                  <Share2 aria-hidden="true" size={15} />
                  Share receipt
                </button>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-4">
                  <span className="text-[13px]">Rate driver</span>

                  <span className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        aria-hidden="true"
                        size={16}
                        strokeWidth={1.5}
                        className="text-[var(--muted)]"
                      />
                    ))}
                  </span>
                </div>
              </section>
            )}
          </>
        )}

        {!cancelled && !isCompleted && (
          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[520px] items-center gap-3 border-t border-[var(--hairline)] bg-[var(--canvas)] px-5 py-4 sm:px-7">
            <button
              disabled={!canCancel}
              onClick={() => setCancelled(true)}
              className={`text-[13px] ${
                canCancel
                  ? "text-[var(--muted)] hover:text-[var(--danger)]"
                  : "cursor-not-allowed text-[var(--faint)]"
              }`}
            >
              Cancel ride
            </button>

            <button
              onClick={advanceStatus}
              className="ml-auto flex h-12 flex-1 items-center justify-center rounded-[8px] bg-[var(--primary)] text-[14px] font-semibold text-[var(--primary-ink)]"
            >
              {NEXT_LABEL[status] ?? "Complete trip"}
            </button>

            <button
              onClick={advanceStatus}
              className="absolute -top-10 right-5 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] text-[var(--muted)]"
            >
              Simulate next state
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
