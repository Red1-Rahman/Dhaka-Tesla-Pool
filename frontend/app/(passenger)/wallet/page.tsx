"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Car,
  Eye,
  EyeOff,
  Home,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Sun,
  Wallet,
  X,
} from "lucide-react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react"
import { PaisaAmount } from "@/components/ui/paisa-amount"
import { useAuth } from "@/lib/auth-context"

type Transaction = {
  id: string
  label: string
  date: string
  amountPaisa: number
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    label: "Banani → Mohakhali",
    date: "Today · 8:42 AM",
    amountPaisa: -7_440,
  },
  {
    id: "tx-2",
    label: "Wallet top up",
    date: "Yesterday · 6:10 PM",
    amountPaisa: 50_000,
  },
  {
    id: "tx-3",
    label: "Gulshan → Banani",
    date: "18 Sep · 9:05 AM",
    amountPaisa: -6_675,
  },
  {
    id: "tx-4",
    label: "Fare adjustment refund",
    date: "16 Sep · 4:22 PM",
    amountPaisa: 1_200,
  },
]

const TOP_UP_AMOUNTS_PAISA = [10_000, 50_000, 100_000]

const WALLET_BALANCE_PAISA = 128_460

const THEME_STORAGE_KEY = "wallet-theme"

// Simulated payment round-trip length for the demo top up.
const TOP_UP_SIMULATED_DELAY_MS = 900

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center justify-center border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 sm:px-7">
        {children}
      </div>
    </main>
  )
}

export default function WalletPage() {
  const { currentUser, isLoading, signOut } = useAuth()

  const [isDark, setIsDark] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedPaisa, setSelectedPaisa] = useState<number | null>(
    null,
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)
  const [balancePaisa, setBalancePaisa] = useState(
    WALLET_BALANCE_PAISA,
  )
  const [recentTransactions, setRecentTransactions] = useState(
    INITIAL_TRANSACTIONS,
  )

  const prefersReducedMotion = useReducedMotion()
  const topUpButtonRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const topUpTimeoutRef = useRef<number | null>(null)

  // Pick up the saved theme, falling back to the OS preference.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (stored === "dark" || stored === "light") {
      setIsDark(stored === "dark")
    } else {
      setIsDark(
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      )
    }
  }, [])

  // Cancels a pending top up if the page unmounts mid-request. Clearing
  // the timer (instead of flagging "unmounted") stays correct under React
  // Strict Mode, which unmounts and remounts once in development.
  useEffect(() => {
    return () => {
      if (topUpTimeoutRef.current !== null) {
        window.clearTimeout(topUpTimeoutRef.current)
        topUpTimeoutRef.current = null
      }
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark

    setIsDark(next)
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      next ? "dark" : "light",
    )
  }

  const openTopUpSheet = () => {
    setSelectedPaisa(null)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    if (isProcessing) return

    setSheetOpen(false)
    topUpButtonRef.current?.focus()
  }

  // Initial focus when the sheet opens.
  useEffect(() => {
    if (sheetOpen) {
      sheetRef.current?.focus()
    }
  }, [sheetOpen])

  // Escape to dismiss + body scroll lock while the sheet is open.
  useEffect(() => {
    if (!sheetOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing) {
        setSheetOpen(false)
        topUpButtonRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [sheetOpen, isProcessing])

  const handleTopUp = () => {
    if (selectedPaisa === null || isProcessing) return

    setIsProcessing(true)

    // Demo: simulate a payment round-trip.
    // Replace with your real top-up API / payment integration.
    topUpTimeoutRef.current = window.setTimeout(() => {
      topUpTimeoutRef.current = null

      setBalancePaisa((current) => current + selectedPaisa)
      setRecentTransactions((current) => [
        {
          id: `tx-${Date.now()}`,
          label: "Wallet top up",
          date: "Just now",
          amountPaisa: selectedPaisa,
        },
        ...current,
      ])

      setIsProcessing(false)
      setSheetOpen(false)
      topUpButtonRef.current?.focus()
    }, TOP_UP_SIMULATED_DELAY_MS)
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="text-[13px] text-[var(--muted)]">
          Loading...
        </p>
      </Shell>
    )
  }

  if (!currentUser) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] text-[var(--muted)]">
            Please sign in to view your wallet.
          </p>

          <a
            href="/signin"
            className="text-[13px] font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            Sign in
          </a>
        </div>
      </Shell>
    )
  }

  const navItems = [
    { href: "/request", label: "Home", icon: Home },
    { href: "/rides", label: "Rides", icon: Car },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ]

  return (
    <main
      className={
        isDark ? "dark min-h-screen" : "min-h-screen"
      }
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 sm:px-7">
        <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center bg-[var(--canvas)]">
          <span className="text-[14px] font-semibold tracking-[0.02em]">
            Dhaka Tesla Pool
          </span>
        </header>

        <section className="flex-1 pb-6 pt-6">
          {/* Balance card */}
          <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--surface)] px-6 py-7">
            <div className="flex items-center justify-center gap-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Wallet balance
              </p>

              <button
                type="button"
                aria-label={
                  isBalanceHidden
                    ? "Show balance"
                    : "Hide balance"
                }
                onClick={() =>
                  setIsBalanceHidden((hidden) => !hidden)
                }
                className="flex size-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                {isBalanceHidden ? (
                  <EyeOff
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.5}
                  />
                ) : (
                  <Eye
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.5}
                  />
                )}
              </button>
            </div>

            <motion.div
              key={balancePaisa}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 6 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-2.5"
            >
              {isBalanceHidden ? (
                <p className="text-center font-mono text-[40px] leading-[1.1] tracking-[0.08em] text-[var(--muted)]">
                  প ••••
                </p>
              ) : (
                <PaisaAmount
                  value={balancePaisa}
                  iconSize={26}
                  className="justify-center font-mono text-[40px] leading-[1.1] tracking-[-0.04em] tabular-nums"
                />
              )}
            </motion.div>

            <button
              ref={topUpButtonRef}
              type="button"
              onClick={openTopUpSheet}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="mx-auto mt-6 flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] pl-3.5 pr-4 text-[13px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.97]"
            >
              <Plus
                aria-hidden="true"
                size={15}
                strokeWidth={2}
              />
              Top up
            </button>
          </div>

          {/* Transactions */}
          <section className="mt-8">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              Recent transactions
            </h2>

            <ul className="border-y border-[var(--hairline)]">
              {recentTransactions.map((transaction) => {
                const isCredit =
                  transaction.amountPaisa > 0

                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">
                        {transaction.label}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {transaction.date}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums ${
                        isCredit
                          ? "text-[var(--primary)]"
                          : "text-[var(--ink)]"
                      }`}
                    >
                      <span className="sr-only">
                        {isCredit ? "Credit" : "Debit"}:{" "}
                      </span>

                      <span aria-hidden="true">
                        {isCredit ? "+" : "-"}
                      </span>

                      <PaisaAmount
                        value={Math.abs(
                          transaction.amountPaisa,
                        )}
                        iconSize={12}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Profile */}
          <section className="mt-8 border-t border-[var(--hairline)] pt-6">
            <h2 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              Profile
            </h2>

            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-5">
              <div>
                <p className="text-[18px] font-medium">
                  {currentUser.name}
                </p>

                <p className="mt-1 font-mono text-[12px] text-[var(--muted)]">
                  {currentUser.phone}
                </p>
              </div>

              <span className="rounded-full border border-[var(--hairline)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                {currentUser.role === "DRIVER"
                  ? "Driver"
                  : "Passenger"}
              </span>
            </div>

            <div className="divide-y divide-[var(--hairline)]">
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggleTheme}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="flex items-center gap-3 text-[13px]">
                  {isDark ? (
                    <Moon
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Sun
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.5}
                    />
                  )}

                  {isDark ? "Dark mode" : "Light mode"}
                </span>

                <span
                  className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
                    isDark
                      ? "justify-end bg-[var(--primary)]"
                      : "justify-start bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="size-5 rounded-full bg-[var(--surface)] shadow-sm" />
                </span>
              </button>

              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 py-4 text-left text-[13px] text-[var(--danger)]"
              >
                <LogOut
                  aria-hidden="true"
                  size={17}
                  strokeWidth={1.5}
                />
                Sign out
              </button>
            </div>
          </section>
        </section>

        {/* Bottom nav */}
        <nav
          aria-label="Primary navigation"
          className="sticky bottom-0 z-10 -mx-5 grid grid-cols-3 border-t border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:-mx-7 sm:px-7"
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/wallet"

            return (
              <a
                key={href}
                href={href}
                aria-current={
                  isActive ? "page" : undefined
                }
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                  isActive
                    ? "font-medium text-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  size={19}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {label}
              </a>
            )
          })}
        </nav>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.2,
            }}
            className="fixed inset-0 z-30 bg-black/25"
            onClick={closeSheet}
          >
            <motion.div
              ref={sheetRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="top-up-title"
              onClick={(event) =>
                event.stopPropagation()
              }
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.28,
                ease: [0.32, 0.72, 0, 1],
              }}
              drag={prefersReducedMotion ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (
                  info.offset.y > 100 ||
                  info.velocity.y > 600
                ) {
                  closeSheet()
                }
              }}
              className="absolute inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-[20px] border border-[var(--hairline)] bg-[var(--surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
            >
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--muted)]"
              />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="top-up-title"
                    className="text-[18px] font-medium"
                  >
                    Top up wallet
                  </h2>

                  <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                    Choose an amount to add
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close top up"
                  onClick={closeSheet}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  <X
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.5}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {TOP_UP_AMOUNTS_PAISA.map((amountPaisa) => {
                  const isSelected =
                    selectedPaisa === amountPaisa

                  return (
                    <button
                      key={amountPaisa}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isProcessing}
                      onClick={() =>
                        setSelectedPaisa(amountPaisa)
                      }
                      className={`flex h-[68px] items-center justify-center rounded-[10px] border font-mono text-[15px] tabular-nums transition-colors ${
                        isSelected
                          ? "border-[var(--primary)] text-[var(--primary)]"
                          : "border-[var(--hairline)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <PaisaAmount
                        value={amountPaisa}
                        iconSize={14}
                      />
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleTopUp}
                disabled={
                  selectedPaisa === null || isProcessing
                }
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity disabled:opacity-40 active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      size={15}
                      className="animate-spin"
                    />
                    Processing…
                  </>
                ) : selectedPaisa === null ? (
                  "Select an amount"
                ) : (
                  <>
                    Add{" "}
                    <PaisaAmount
                      value={selectedPaisa}
                      iconSize={13}
                    />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
