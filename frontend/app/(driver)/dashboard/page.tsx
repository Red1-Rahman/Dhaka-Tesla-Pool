"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CarFront,
  Check,
  MapPin,
  Moon,
  Sun,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { apiClient, ApiError } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type {
  AvailableRideResponse,
  PoolResponse,
  RideStatus,
  VehicleResponse,
} from "@/types/api"
import { PaisaAmount } from "@/components/ui/paisa-amount"
import { CapacityBadge } from "@/components/RideStatusBadge"

const REFRESH_INTERVAL_MS = 5000

type DriverAction =
  | "arrived"
  | "start"
  | "complete"
  | null

function formatAge(createdAt: string): string {
  const created = new Date(createdAt).getTime()
  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - created) / 60_000),
  )

  if (diffMinutes < 1) {
    return "just now"
  }

  if (diffMinutes === 1) {
    return "1 min ago"
  }

  return `${diffMinutes} min ago`
}

export default function DriverDashboard() {
  const { currentUser, isLoading: authLoading } = useAuth()

  const [vehicle, setVehicle] =
    useState<VehicleResponse | null>(null)

  const [availableRides, setAvailableRides] = useState<
    AvailableRideResponse[]
  >([])

  const [activePool, setActivePool] =
    useState<PoolResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingRideId, setAcceptingRideId] =
    useState<string | null>(null)

  const [driverAction, setDriverAction] =
    useState<DriverAction>(null)

  const [error, setError] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  const reducedMotion = useReducedMotion()

  const loadDashboard = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const currentVehicle = await apiClient.getVehicle()

        setVehicle(currentVehicle)

        if (!currentVehicle.isOnline) {
          setAvailableRides([])
          setActivePool(null)
          setError(null)
          return
        }

        const [rides, existingPool] = await Promise.all([
          apiClient.getAvailableRides(),
          Promise.resolve(null),
        ])

        setAvailableRides(rides)

        // A pool id is only known from an accepted ride. We keep the
        // active pool locally after acceptance and refresh it below.
        if (activePool?.poolId) {
          try {
            const refreshedPool = await apiClient.getPool(
              activePool.poolId,
            )

            setActivePool(refreshedPool)
          } catch (err) {
            if (
              err instanceof ApiError &&
              err.statusCode === 404
            ) {
              setActivePool(null)
            }
          }
        }

        setError(null)

        void existingPool
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          setVehicle(null)
          setAvailableRides([])
          setActivePool(null)
        } else {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load the driver dashboard.",
          )
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [activePool?.poolId],
  )

  useEffect(() => {
    if (authLoading || !currentUser) {
      return
    }

    if (currentUser.role !== "DRIVER") {
      return
    }

    void loadDashboard()
  }, [
    authLoading,
    currentUser,
    loadDashboard,
  ])

  useEffect(() => {
    if (
      authLoading ||
      !currentUser ||
      currentUser.role !== "DRIVER" ||
      !vehicle?.isOnline
    ) {
      return
    }

    const interval = window.setInterval(() => {
      void loadDashboard(true)
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    authLoading,
    currentUser,
    vehicle?.isOnline,
    loadDashboard,
  ])

  async function toggleOnline() {
    if (!vehicle) {
      return
    }

    setError(null)

    try {
      const updated = await apiClient.setVehicleOnline(
        !vehicle.isOnline,
      )

      setVehicle(updated)

      if (!updated.isOnline) {
        setAvailableRides([])
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not update vehicle status.",
      )
    }
  }

  async function acceptRide(
    rideRequestId: string,
  ) {
    if (acceptingRideId) {
      return
    }

    setAcceptingRideId(rideRequestId)
    setError(null)

    try {
      const accepted = await apiClient.acceptRide(
        rideRequestId,
      )

      const pool = await apiClient.getPool(
        accepted.poolId,
      )

      setActivePool(pool)

      setAvailableRides((rides) =>
        rides.filter(
          (ride) => ride.id !== rideRequestId,
        ),
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not accept this ride.",
      )

      // The request may have disappeared because another
      // operation matched it. Refresh from the server.
      void loadDashboard(true)
    } finally {
      setAcceptingRideId(null)
    }
  }

  async function advancePool() {
    if (!activePool || driverAction) {
      return
    }

    setDriverAction(
      activePool.status === "MATCHED"
        ? "arrived"
        : activePool.status === "DRIVER_ARRIVED"
          ? "start"
          : activePool.status === "STARTED"
            ? "complete"
            : null,
    )

    setError(null)

    try {
      let result

      if (activePool.status === "MATCHED") {
        result = await apiClient.markDriverArrived(
          activePool.poolId,
        )
      } else if (
        activePool.status === "DRIVER_ARRIVED"
      ) {
        result = await apiClient.startPool(
          activePool.poolId,
        )
      } else if (activePool.status === "STARTED") {
        result = await apiClient.completePool(
          activePool.poolId,
        )
      } else {
        return
      }

      const updatedPool = await apiClient.getPool(
        result.poolId,
      )

      setActivePool(updatedPool)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not advance the ride.",
      )
    } finally {
      setDriverAction(null)
    }
  }

  const seatsTaken = useMemo(
    () =>
      activePool?.passengers.reduce(
        (sum, passenger) =>
          sum + passenger.seatsRequested,
        0,
      ) ?? 0,
    [activePool],
  )

  const seatsOpen = vehicle
    ? Math.max(vehicle.capacity - seatsTaken, 0)
    : 0

  const actionLabel =
    activePool?.status === "MATCHED"
      ? "Next: I've arrived"
      : activePool?.status === "DRIVER_ARRIVED"
        ? "Start trip"
        : activePool?.status === "STARTED"
          ? "Complete trip"
          : null

  const isActionDisabled =
    driverAction !== null ||
    !activePool ||
    !actionLabel

  if (authLoading || loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[620px] items-center justify-center border-x border-[var(--hairline)] bg-[var(--canvas)]">
          <p className="text-[13px] text-[var(--muted)]">
            Loading driver dashboard...
          </p>
        </div>
      </main>
    )
  }

  if (!currentUser || currentUser.role !== "DRIVER") {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[620px] flex-col items-center justify-center border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 text-center">
          <p className="text-[15px] font-medium">
            Driver access required
          </p>

          <Link
            href="/signin"
            className="mt-3 text-[13px] text-[var(--primary)]"
          >
            Sign in
          </Link>
        </div>
      </main>
    )
  }

  if (!vehicle) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[620px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-8">
          <header className="flex h-[68px] shrink-0 items-center gap-2.5 border-b border-[var(--hairline)]">
            <CarFront size={19} strokeWidth={1.5} />

            <span className="text-[14px] font-semibold">
              Driver mode
            </span>
          </header>

          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <CarFront
              size={24}
              className="text-[var(--muted)]"
            />

            <h1 className="mt-4 text-[20px] font-medium">
              Add my vehicle
            </h1>

            <p className="mt-2 max-w-[280px] text-[13px] text-[var(--muted)]">
              You need a registered vehicle before you can
              accept rides.
            </p>

            <Link
              href="/vehicle"
              className="mt-5 flex h-11 items-center gap-2 rounded-[8px] bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)]"
            >
              Open vehicle
              <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const online = vehicle.isOnline

  return (
    <main className={isDark ? "dark min-h-screen" : "min-h-screen"}>
      <div
        className={`mx-auto flex min-h-screen w-full max-w-[620px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-8 ${
          !online ? "grayscale" : ""
        }`}
      >
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <CarFront size={19} strokeWidth={1.5} />

            <span className="text-[14px] font-semibold tracking-[0.02em]">
              Driver mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label={
                isDark
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={() => setIsDark(!isDark)}
              className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"
            >
              {isDark ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>

            <Link
              href="/vehicle"
              className="font-mono text-[11px] text-[var(--muted)] underline-offset-4 hover:underline"
            >
              {vehicle.name}
            </Link>
          </div>
        </header>

        <section
          className={`flex flex-1 flex-col gap-5 pb-6 pt-6 transition-opacity ${
            !online ? "opacity-45" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.12em] text-[var(--muted)]">
                Good evening, {currentUser.name}
              </p>

              <h1 className="mt-1 text-[25px] font-medium leading-tight tracking-[-0.03em]">
                {vehicle.name}
              </h1>

              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
                <MapPin size={13} />
                Banani, Dhaka
              </p>
            </div>

            <button
              onClick={toggleOnline}
              aria-pressed={online}
              className={`flex min-w-[122px] items-center justify-between gap-3 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors ${
                online
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]"
                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              <span>
                {online ? "Online" : "Offline"}
              </span>

              <span
                className={`flex size-6 items-center justify-center rounded-full ${
                  online
                    ? "bg-[var(--accent)] text-[#111113]"
                    : "bg-[var(--muted)] text-[var(--surface-2)]"
                }`}
              >
                {online ? (
                  <Wifi size={13} />
                ) : (
                  <WifiOff size={13} />
                )}
              </span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-[8px] border border-[color-mix(in_srgb,var(--danger)_30%,var(--hairline))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] px-3 py-2 text-[12px] text-[var(--danger)]"
            >
              {error}
            </div>
          )}

          {online ? (
            <>
              <div className="flex items-center justify-between border-y border-[var(--hairline)] py-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    Capacity
                  </p>

                  <p className="mt-0.5 font-mono text-[15px]">
                    {activePool
                      ? `${seatsTaken} / ${vehicle.capacity} seats`
                      : `${vehicle.capacity} seats`}
                  </p>
                </div>

                {activePool ? (
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {activePool.status}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-[var(--faint)]">
                    {refreshing ? "SYNCING" : "LIVE"}
                  </span>
                )}
              </div>

              {!activePool ? (
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <h2 className="text-[18px] font-medium">
                        Available rides
                      </h2>

                      <p className="mt-1 text-[13px] text-[var(--muted)]">
                        Requested rides currently available
                        to drivers.
                      </p>
                    </div>

                    <span className="font-mono text-[11px] text-[var(--faint)]">
                      {String(
                        availableRides.length,
                      ).padStart(2, "0")}{" "}
                      REQUESTED
                    </span>
                  </div>

                  {availableRides.length === 0 ? (
                    <div className="border-y border-[var(--hairline)] py-10 text-center">
                      <Users
                        size={21}
                        className="mx-auto text-[var(--muted)]"
                      />

                      <p className="mt-3 text-[14px] font-medium">
                        No ride requests yet
                      </p>

                      <p className="mt-1 text-[12px] text-[var(--muted)]">
                        New requests will appear here
                        automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                      {availableRides.map((ride) => (
                        <div
                          key={ride.id}
                          className="py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[15px] font-medium">
                                {ride.pickupZone}{" "}
                                <span className="text-[var(--muted)]">
                                  →
                                </span>{" "}
                                {ride.dropoffZone}
                              </p>

                              <p className="mt-1 text-[12px] text-[var(--muted)]">
                                {ride.seatsRequested}{" "}
                                {ride.seatsRequested === 1
                                  ? "seat"
                                  : "seats"}{" "}
                                requested ·{" "}
                                {formatAge(
                                  ride.createdAt,
                                )}
                              </p>
                            </div>

                            <PaisaAmount
                              value={ride.farePaisa}
                              iconSize={13}
                              className="font-mono text-[13px] tabular-nums"
                            />
                          </div>

                          <button
                            disabled={
                              acceptingRideId !== null
                            }
                            onClick={() =>
                              void acceptRide(ride.id)
                            }
                            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[7px] bg-[var(--primary)] text-[12px] font-semibold text-[var(--primary-ink)] disabled:cursor-wait disabled:opacity-60"
                          >
                            {acceptingRideId ===
                            ride.id
                              ? "Accepting..."
                              : "Accept"}

                            {acceptingRideId !==
                              ride.id && (
                              <ArrowRight size={14} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={
                    reducedMotion
                      ? false
                      : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-5"
                >
                  <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
                          Active pool
                        </p>

                        <h2 className="mt-1 text-[18px] font-medium">
                          {activePool.vehicle.name} ·{" "}
                          {activePool.passengers.length}{" "}
                          {activePool.passengers.length ===
                          1
                            ? "passenger"
                            : "passengers"}
                        </h2>
                      </div>

                      <CapacityBadge
                        full={
                          seatsTaken >=
                          activePool.vehicle.capacity
                        }
                      />
                    </div>

                    <div className="relative flex h-[104px] items-center justify-center rounded-[9px] bg-[var(--surface-2)]">
                      <div className="absolute inset-x-12 top-1/2 h-px bg-[var(--primary)]" />

                      <div className="relative z-10 flex items-center gap-5">
                        {activePool.passengers.map(
                          (passenger, index) => (
                            <div
                              key={
                                passenger.rideRequestId
                              }
                              className="flex flex-col items-center gap-2"
                            >
                              <span
                                className={`flex size-11 items-center justify-center rounded-full border-2 ${
                                  index === 0
                                    ? "border-[var(--accent)] bg-[var(--accent)] text-[#111113]"
                                    : "border-[var(--primary)] bg-[var(--surface)]"
                                }`}
                              >
                                <Users size={16} />
                              </span>

                              <span className="font-mono text-[10px] text-[var(--muted)]">
                                {
                                  passenger.seatsRequested
                                }{" "}
                                {passenger.seatsRequested ===
                                1
                                  ? "seat"
                                  : "seats"}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-[12px] text-[var(--muted)]">
                      {seatsTaken} /{" "}
                      {activePool.vehicle.capacity} seats
                      occupied · {seatsOpen} open
                    </p>
                  </div>

                  <button
                    disabled={isActionDisabled}
                    onClick={() => void advancePool()}
                    className="flex h-[54px] items-center justify-center gap-2 rounded-[8px] bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {driverAction
                      ? "Updating..."
                      : actionLabel}

                    {!driverAction && (
                      <ArrowRight size={17} />
                    )}
                  </button>

                  <div>
                    <h2 className="mb-3 text-[16px] font-medium">
                      Passenger routes
                    </h2>

                    <div className="ml-2 border-l border-[var(--hairline)]">
                      {activePool.passengers.map(
                        (passenger, index) => (
                          <div
                            key={
                              passenger.rideRequestId
                            }
                            className="relative flex gap-4 pb-5 pl-5 last:pb-0"
                          >
                            <span
                              className={`absolute -left-[5px] top-1 size-[9px] rounded-full border-2 border-[var(--canvas)] ${
                                index === 0
                                  ? "bg-[var(--accent)]"
                                  : "bg-[var(--muted)]"
                              }`}
                            />

                            <div>
                              <p className="text-[14px] font-medium">
                                {
                                  passenger.pickupZone
                                }{" "}
                                <span className="text-[var(--muted)]">
                                  →
                                </span>{" "}
                                {
                                  passenger.dropoffZone
                                }
                              </p>

                              <p className="text-[12px] text-[var(--muted)]">
                                {passenger.seatsRequested}{" "}
                                {passenger.seatsRequested ===
                                1
                                  ? "seat"
                                  : "seats"}{" "}
                                ·{" "}
                                {passenger.status}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {activePool.status ===
                    "COMPLETED" && (
                    <div className="border-t border-[var(--hairline)] pt-5">
                      <div className="flex items-center gap-2 text-[var(--primary)]">
                        <Check size={15} />

                        <span className="text-[13px] font-medium">
                          Ride completed
                        </span>
                      </div>

                      <p className="mt-1 text-[12px] text-[var(--muted)]">
                        All active passengers have completed
                        this pool.
                      </p>

                      <button
                        onClick={() =>
                          setActivePool(null)
                        }
                        className="mt-4 text-[12px] text-[var(--primary)] underline underline-offset-4"
                      >
                        View available requests
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <WifiOff
                size={22}
                className="text-[var(--muted)]"
              />

              <h2 className="mt-4 text-[18px] font-medium">
                You're offline
              </h2>

              <p className="mt-1 max-w-[260px] text-[13px] text-[var(--muted)]">
                Go online to see ride requests and accept a
                pool.
              </p>

              <Link
                href="/vehicle"
                className="mt-5 flex h-10 items-center gap-2 rounded-[8px] border border-[var(--hairline)] px-4 text-[12px] font-medium"
              >
                Manage vehicle
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        <footer className="border-t border-[var(--hairline)] pt-4">
          <p className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Check size={12} />
            {online
              ? "Vehicle online · accepting ride requests"
              : "Vehicle offline · new requests paused"}
          </p>
        </footer>
      </div>
    </main>
  )
}
