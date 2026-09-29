"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient, ApiError } from "@/lib/api-client"
import {
  RideRequestForm,
  type RideRequestInput,
} from "@/components/RideRequestForm"

export default function RequestRidePage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Creates the ride on the backend, then opens its detail page.
  async function handleSubmit(input: RideRequestInput) {
    setSubmitting(true)
    setError(null)

    try {
      const ride = await apiClient.createRide({
        pickupZone: input.pickup,
        dropoffZone: input.dropoff,
        seatsRequested: input.seats,
      })

      router.push(`/rides/${ride.id}`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Try again.",
      )
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
          <header className="flex h-[68px] shrink-0 items-center">
            <span className="text-[14px] font-semibold tracking-[0.02em]">
              Dhaka Tesla Pool
            </span>
          </header>

          <section className="flex flex-1 items-center justify-center">
            <p className="text-[13px] text-[var(--muted)]">
              Loading...
            </p>
          </section>
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
          <header className="flex h-[68px] shrink-0 items-center">
            <span className="text-[14px] font-semibold tracking-[0.02em]">
              Dhaka Tesla Pool
            </span>
          </header>

          <section className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-[14px] text-[var(--muted)]">
              Please sign in to request a ride.
            </p>

            <a
              href="/signin"
              className="text-[13px] font-medium text-[var(--primary)]"
            >
              Sign in
            </a>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center justify-between">
          <span className="text-[14px] font-semibold tracking-[0.02em]">
            Dhaka Tesla Pool
          </span>
        </header>

        <section className="flex flex-1 flex-col gap-5 pb-4 pt-7">
          <div>
            <h1 className="text-[24px] font-medium leading-tight tracking-[-0.02em]">
              Good evening, {currentUser.name}
            </h1>

            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
              <MapPin
                aria-hidden="true"
                size={13}
                strokeWidth={1.5}
              />
              Banani, Dhaka
            </p>
          </div>

          <RideRequestForm
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />

          <a
            href="/rides"
            className="flex h-12 items-center justify-between border-y border-[var(--hairline)] text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            See ride history
          </a>
        </section>

        <nav
          aria-label="Primary navigation"
          className="grid grid-cols-3 border-t border-[var(--hairline)] pt-4"
        >
          <a
            href="/request"
            className="text-center text-[12px] font-medium text-[var(--primary)]"
          >
            Home
          </a>

          <a
            href="/rides"
            className="text-center text-[12px] text-[var(--muted)]"
          >
            Rides
          </a>

          <a
            href="/wallet"
            className="text-center text-[12px] text-[var(--muted)]"
          >
            Wallet
          </a>
        </nav>
      </div>
    </main>
  )
}
