"use client"

import { useMemo, useState } from "react"
import { ArrowRight, ChevronDown, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { calculateFare, distanceKmBetween, ZONES } from "@/lib/mock-data"
import { PaisaAmount } from "@/components/ui/paisa-amount"
import type { Zone } from "@/types/api"

const graphPoints: { name: Zone; x: number; y: number }[] = [
  { name: "Uttara", x: 14, y: 19 },
  { name: "Mirpur", x: 28, y: 34 },
  { name: "Bashundhara", x: 82, y: 25 },
  { name: "Banani", x: 47, y: 39 },
  { name: "Gulshan", x: 68, y: 45 },
  { name: "Mohakhali", x: 39, y: 55 },
  { name: "Farmgate", x: 49, y: 70 },
  { name: "Dhanmondi", x: 25, y: 82 },
]

const graphLines: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 5],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [5, 7],
  [6, 7],
]

interface RideRequestFormProps {
  onSubmit?: (input: {
    pickup: Zone
    dropoff: Zone
    seats: number
  }) => void
}

export function RideRequestForm({ onSubmit }: RideRequestFormProps) {
  const [pickup, setPickup] = useState<Zone>("Banani")
  const [dropoff, setDropoff] = useState<Zone>("Mohakhali")
  const [seats, setSeats] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const distance = distanceKmBetween(pickup, dropoff)

  const solo = useMemo(
    () => calculateFare(distance, false),
    [distance],
  )

  const pooled = useMemo(
    () => calculateFare(distance, true),
    [distance],
  )

  return (
    <>
      <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
            Dhaka zones
          </span>

          <span className="font-mono text-[11px] text-[var(--faint)]">
            schematic · 08
          </span>
        </div>

        <div
          className="relative h-[220px] overflow-hidden rounded-[8px] bg-[var(--surface-2)]"
          aria-label="Dhaka zone transit diagram"
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full"
            role="img"
            aria-label="Connected zone diagram"
          >
            {graphLines.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={graphPoints[a].x}
                y1={graphPoints[a].y}
                x2={graphPoints[b].x}
                y2={graphPoints[b].y}
                stroke="var(--hairline)"
                strokeWidth="0.55"
              />
            ))}

            {graphPoints.map((point) => (
              <g key={point.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2.6"
                  fill={
                    point.name === pickup
                      ? "var(--accent)"
                      : "var(--surface)"
                  }
                  stroke={
                    point.name === pickup
                      ? "var(--accent)"
                      : "var(--muted)"
                  }
                  strokeWidth="0.65"
                />

                <text
                  x={point.x}
                  y={point.y - 5}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="3.1"
                >
                  {point.name}
                </text>
              </g>
            ))}
          </svg>

          {graphPoints.map((point) => (
            <button
              key={point.name}
              aria-label={`Select ${point.name} as pickup`}
              onClick={() => setPickup(point.name)}
              className="absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            />
          ))}
        </div>

        <p className="mt-3 text-[12px] text-[var(--muted)]">
          Tap a zone to change your pickup point.
        </p>
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        className="flex h-[58px] items-center justify-between rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-4 text-left transition-colors hover:border-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        aria-haspopup="dialog"
      >
        <span>
          <span className="block text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
            Where to?
          </span>

          <span className="mt-0.5 block text-[15px]">
            {dropoff}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={1.5}
          className="text-[var(--muted)]"
        />
      </button>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--muted)]">
          Seats
        </span>

        <div
          className="flex rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-2)] p-1"
          role="group"
          aria-label="Number of seats"
        >
          {[1, 2, 3].map((seat) => (
            <button
              key={seat}
              onClick={() => setSeats(seat)}
              aria-pressed={seats === seat}
              className={`h-8 w-11 rounded-[6px] font-mono text-[13px] transition-colors ${
                seats === seat
                  ? "bg-[var(--surface)] text-[var(--ink)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {seat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <p className="text-[12px] text-[var(--muted)]">
            Solo
          </p>

          <PaisaAmount
            value={solo.totalPaisa}
            iconSize={16}
            className="mt-1 font-mono text-[18px] tabular-nums"
          />
        </div>

        <div className="rounded-[8px] bg-[var(--accent)] p-3 text-[#111113]">
          <p className="text-[12px] opacity-70">
            Pooled · 20% off
          </p>

          <PaisaAmount
            value={pooled.totalPaisa}
            iconSize={16}
            className="mt-1 font-mono text-[18px] tabular-nums"
          />
        </div>
      </div>

      <button
        onClick={() =>
          onSubmit?.({
            pickup,
            dropoff,
            seats,
          })
        }
        className="flex h-[52px] items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.99]"
      >
        <span>Request ride ·</span>

        <PaisaAmount
          value={solo.totalPaisa}
          iconSize={15}
          className="font-mono tabular-nums"
        />

        <ArrowRight
          aria-hidden="true"
          size={17}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/25"
            onClick={() => setSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.22,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="destination-title"
              onClick={(event) => event.stopPropagation()}
              className="absolute inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-[20px] border border-[var(--hairline)] bg-[var(--surface)] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2
                    id="destination-title"
                    className="text-[18px] font-medium"
                  >
                    Choose destination
                  </h2>

                  <p className="text-[13px] text-[var(--muted)]">
                    From {pickup}
                  </p>
                </div>

                <button
                  aria-label="Close destination picker"
                  onClick={() => setSheetOpen(false)}
                  className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
                >
                  <X
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.5}
                  />
                </button>
              </div>

              <div className="flex max-h-[55vh] flex-col gap-1 overflow-y-auto">
                {ZONES.filter((zone) => zone !== pickup).map(
                  (zone) => {
                    const zoneDistance = distanceKmBetween(pickup, zone)
                    const fare = calculateFare(zoneDistance, false)

                    return (
                      <button
                        key={zone}
                        onClick={() => {
                          setDropoff(zone)
                          setSheetOpen(false)
                        }}
                        className="flex items-center justify-between rounded-[8px] px-3 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                      >
                        <span>
                          <span className="block text-[14px]">
                            {zone}
                          </span>

                          <span className="block text-[12px] text-[var(--muted)]">
                            {zoneDistance.toFixed(1)} km away
                          </span>
                        </span>

                        <PaisaAmount
                          value={fare.totalPaisa}
                          iconSize={13}
                          className="font-mono text-[13px] tabular-nums"
                        />
                      </button>
                    )
                  },
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
