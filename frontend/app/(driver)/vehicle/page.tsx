"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Wifi, WifiOff } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api-client"
import type { VehicleResponse } from "@/types/api"
import { RickshawIcon } from "@/components/ui/rickshaw-icon"
import { RickshawSilhouette } from "@/components/RickshawSilhouette"

export default function VehiclePage() {
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadVehicle() {
      try {
        const result = await apiClient.getVehicle()

        if (!cancelled) {
          setVehicle(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load your vehicle.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadVehicle()

    return () => {
      cancelled = true
    }
  }, [])

  async function toggleOnline() {
    if (!vehicle || updating) {
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const updated = await apiClient.setVehicleOnline(
        !vehicle.isOnline,
      )

      setVehicle(updated)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not update vehicle status.",
      )
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center justify-center border-x border-[var(--hairline)] bg-[var(--canvas)]">
          <p className="text-[13px] text-[var(--muted)]">
            Loading vehicle...
          </p>
        </div>
      </main>
    )
  }

  if (!vehicle) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
          <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-[var(--hairline)]">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
            >
              <ArrowLeft size={17} />
            </Link>

            <h1 className="text-[20px] font-medium">
              My vehicle
            </h1>
          </header>

          <section className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-[15px] font-medium">
              No vehicle registered
            </p>

            <p className="max-w-[280px] text-[13px] text-[var(--muted)]">
              {error ??
                "There is no vehicle registered for this driver."}
            </p>

            <Link
              href="/dashboard"
              className="mt-2 rounded-[8px] bg-[var(--primary)] px-5 py-3 text-[13px] font-semibold text-[var(--primary-ink)]"
            >
              Back to dashboard
            </Link>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
          >
            <ArrowLeft size={17} />
          </Link>

          <h1 className="text-[24px] font-medium tracking-[-0.02em]">
            My vehicle
          </h1>
        </header>

        <section className="flex flex-1 flex-col gap-5 pt-6">
          <RickshawSilhouette
            occupants={[]}
            capacity={vehicle.capacity}
            label={`${vehicle.name}, electric rickshaw`}
          />

          <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                <RickshawIcon size={22} />
              </span>

              <div>
                <p className="text-[17px] font-medium">
                  {vehicle.name}
                </p>

                <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                  Electric rickshaw
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-4">
              <span className="text-[13px] text-[var(--muted)]">
                Capacity
              </span>

              <span className="font-mono text-[14px] tabular-nums">
                {vehicle.capacity} seats
              </span>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[8px] border border-[color-mix(in_srgb,var(--danger)_30%,var(--hairline))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] px-3 py-2 text-[12px] text-[var(--danger)]"
            >
              {error}
            </p>
          )}

          <button
            onClick={toggleOnline}
            disabled={updating}
            aria-pressed={vehicle.isOnline}
            className={`flex h-[52px] items-center justify-between rounded-[8px] border px-4 text-[14px] font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
              vehicle.isOnline
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]"
                : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            <span>
              {updating
                ? "Updating..."
                : vehicle.isOnline
                  ? "Online — accepting rides"
                  : "Offline"}
            </span>

            {vehicle.isOnline ? (
              <Wifi
                aria-hidden="true"
                size={17}
                strokeWidth={1.5}
              />
            ) : (
              <WifiOff
                aria-hidden="true"
                size={17}
                strokeWidth={1.5}
              />
            )}
          </button>

          <p className="text-[12px] text-[var(--muted)]">
            One vehicle per driver in this MVP. Going offline
            stops new ride requests from being routed to you; any
            pool already in progress is not affected.
          </p>
        </section>
      </div>
    </main>
  )
}
