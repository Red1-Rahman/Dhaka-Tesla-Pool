"use client"

import { useState } from "react"
import { Check, ChevronRight, LogOut, Moon, Plus, Sun, Users, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CAST } from "@/lib/mock-data"
import { formatSignedTaka, formatTaka } from "@/lib/format"
import { useAuth } from "@/lib/auth-context"

const transactions = [
  { label: "Banani → Mohakhali", date: "Today · 8:42 AM", amountTaka: -74.4 },
  { label: "Wallet top up", date: "Yesterday · 6:10 PM", amountTaka: 500.0 },
  { label: "Gulshan → Banani", date: "18 Sep · 9:05 AM", amountTaka: -66.75 },
  { label: "Fare adjustment refund", date: "16 Sep · 4:22 PM", amountTaka: 12.0 },
]

export default function WalletPage() {
  const { currentUser, signInAs, signOut } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <main className={isDark ? "dark min-h-screen" : "min-h-screen"}>
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-x border-[var(--hairline)] bg-[var(--canvas)] px-5 pb-5 sm:px-7">
        <header className="flex h-[68px] shrink-0 items-center justify-between">
          <span className="text-[14px] font-semibold tracking-[0.02em]">Dhaka Tesla Pool</span>
          <button aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setIsDark(!isDark)} className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            {isDark ? <Sun aria-hidden="true" size={17} strokeWidth={1.5} /> : <Moon aria-hidden="true" size={17} strokeWidth={1.5} />}
          </button>
        </header>

        <section className="flex-1 pt-7">
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Wallet balance</p>
            <p className="mt-2 font-mono text-[48px] leading-none tracking-[-0.05em] tabular-nums">{formatTaka(1284.6)}</p>
            <button onClick={() => setSheetOpen(true)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[var(--primary)] px-4 text-[13px] font-semibold text-[var(--primary-ink)] transition-transform active:scale-[0.98]">
              <Plus aria-hidden="true" size={16} strokeWidth={1.5} /> Top up
            </button>
          </div>

          <section className="mt-9">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">Recent transactions</h2>
            <div className="border-y border-[var(--hairline)]">
              {transactions.map((transaction) => (
                <div key={`${transaction.label}-${transaction.date}`} className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{transaction.label}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">{transaction.date}</p>
                  </div>
                  <span className={`shrink-0 font-mono text-[13px] tabular-nums ${transaction.amountTaka > 0 ? "text-[var(--primary)]" : "text-[var(--ink)]"}`}>
                    {formatSignedTaka(transaction.amountTaka)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-t border-[var(--hairline)] pt-6">
            <h2 className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">Profile</h2>
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-5">
              <div>
                <p className="text-[18px] font-medium">{currentUser.name}</p>
                <p className="mt-1 font-mono text-[12px] text-[var(--muted)]">+880 17•• ••4821</p>
              </div>
              <span className="rounded-full border border-[var(--hairline)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                {currentUser.role === "DRIVER" ? "Driver" : "Passenger"}
              </span>
            </div>
            <div className="divide-y divide-[var(--hairline)]">
              <button onClick={() => setIsDark(!isDark)} className="flex w-full items-center justify-between py-4 text-left">
                <span className="flex items-center gap-3 text-[13px]">{isDark ? <Moon aria-hidden="true" size={17} strokeWidth={1.5} /> : <Sun aria-hidden="true" size={17} strokeWidth={1.5} />} {isDark ? "Dark mode" : "Light mode"}</span>
                <span className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${isDark ? "justify-end bg-[var(--primary)]" : "justify-start bg-[var(--surface-2)]"}`}>
                  <span className="size-5 rounded-full bg-[var(--surface)] shadow-sm" />
                </span>
              </button>

              {/* was a toggle switch — fixed: this reveals a list, it isn't a
                  binary setting, so it's a disclosure row like the one below it */}
              <button onClick={() => setAccountsOpen(!accountsOpen)} aria-expanded={accountsOpen} className="flex w-full items-center justify-between py-4 text-left">
                <span className="flex items-center gap-3 text-[13px]"><Users aria-hidden="true" size={17} strokeWidth={1.5} /> Demo accounts</span>
                <span className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
                  {currentUser.name}
                  <ChevronRight aria-hidden="true" size={15} strokeWidth={1.5} className={`transition-transform ${accountsOpen ? "rotate-90" : ""}`} />
                </span>
              </button>

              <button onClick={signOut} className="flex w-full items-center gap-3 py-4 text-left text-[13px] text-[var(--danger)]">
                <LogOut aria-hidden="true" size={17} strokeWidth={1.5} /> Sign out
              </button>
            </div>

            <AnimatePresence>
              {accountsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.18 }} className="overflow-hidden">
                  <div className="mb-2 flex flex-col gap-1 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-1">
                    {CAST.map((account) => (
                      <button key={account.name} onClick={() => { signInAs(account.name); setAccountsOpen(false) }} className="flex items-center justify-between rounded-[6px] px-3 py-2 text-left text-[12px] hover:bg-[var(--surface-2)]">
                        <span>{account.name} <span className="text-[var(--muted)]">· {account.role === "DRIVER" ? "Driver" : "Passenger"}</span></span>
                        {account.name === currentUser.name && <Check aria-hidden="true" size={14} strokeWidth={1.5} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </section>

        <nav aria-label="Primary navigation" className="grid grid-cols-3 border-t border-[var(--hairline)] pt-4">
          <a href="/request" className="text-center text-[12px] text-[var(--muted)]">Home</a>
          <a href="/rides" className="text-center text-[12px] text-[var(--muted)]">Rides</a>
          <a href="/wallet" className="text-center text-[12px] font-medium text-[var(--primary)]">Wallet</a>
        </nav>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 bg-black/25" onClick={() => setSheetOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: prefersReducedMotion ? 0 : 0.22 }} role="dialog" aria-modal="true" aria-labelledby="top-up-title" onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-[20px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 id="top-up-title" className="text-[18px] font-medium">Top up wallet</h2>
                  <p className="text-[13px] text-[var(--muted)]">Choose an amount to add</p>
                </div>
                <button aria-label="Close top up" onClick={() => setSheetOpen(false)} className="flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--muted)]"><X aria-hidden="true" size={17} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <button key={amount} onClick={() => setSheetOpen(false)} className="rounded-[8px] border border-[var(--hairline)] py-4 font-mono text-[14px] tabular-nums transition-colors hover:border-[var(--primary)]">
                    {formatTaka(amount)}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
